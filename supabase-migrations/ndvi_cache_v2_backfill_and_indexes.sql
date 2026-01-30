-- NDVI Cache V2: Backfill legacy rows + verify indexes
-- Run this AFTER ndvi_cache_v2_data_aware_keys.sql

-- ============================================================================
-- BACKFILL LEGACY SCENE CACHE ROWS
-- ============================================================================

-- For scene cache, we can compute aoi_hash from bbox_json if available
-- Set sensible defaults for legacy rows
UPDATE ndvi_scene_cache
SET
  aoi_hash = COALESCE(
    -- Try to generate hash from bbox if available
    CASE
      WHEN bbox_json IS NOT NULL THEN
        encode(sha256(bbox_json::text::bytea), 'hex')::text
      ELSE 'legacy-' || id::text
    END,
    'legacy-' || id::text
  ),
  cloud_threshold = COALESCE(cloud_threshold, 30),
  data_collection = COALESCE(data_collection, 'sentinel-2-l2a')
WHERE aoi_hash = 'legacy' OR aoi_hash IS NULL;

-- ============================================================================
-- BACKFILL LEGACY RESULT CACHE ROWS
-- ============================================================================

-- For result cache, use defaults - these will be replaced on next fetch
UPDATE ndvi_result_cache
SET
  aoi_hash = COALESCE(aoi_hash, 'legacy-' || id::text),
  evalscript_hash = COALESCE(evalscript_hash, 'v1-legacy'),
  resolution = COALESCE(resolution, 512),
  cloud_threshold = COALESCE(cloud_threshold, 30),
  data_collection = COALESCE(data_collection, 'sentinel-2-l2a')
WHERE aoi_hash = 'legacy' OR aoi_hash IS NULL OR evalscript_hash = 'legacy';

-- ============================================================================
-- VERIFY/CREATE OPTIMIZED INDEXES
-- ============================================================================

-- Scene cache: compound index matching the v2 query pattern
DROP INDEX IF EXISTS idx_ndvi_scene_cache_v2_lookup;
CREATE INDEX IF NOT EXISTS idx_ndvi_scene_cache_v2_compound
  ON ndvi_scene_cache(block_id, from_date, to_date, aoi_hash, cloud_threshold);

-- Also index created_at for TTL cleanup queries
CREATE INDEX IF NOT EXISTS idx_ndvi_scene_cache_created_at
  ON ndvi_scene_cache(created_at);

-- Result cache: compound index matching the v2 query pattern
DROP INDEX IF EXISTS idx_ndvi_result_cache_v2_lookup;
CREATE INDEX IF NOT EXISTS idx_ndvi_result_cache_v2_compound
  ON ndvi_result_cache(block_id, scene_id, evalscript_hash, aoi_hash, resolution);

-- Also index created_at for TTL cleanup queries
CREATE INDEX IF NOT EXISTS idx_ndvi_result_cache_created_at
  ON ndvi_result_cache(created_at);

-- ============================================================================
-- CLEANUP FUNCTION (updated for v2)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_ndvi_cache()
RETURNS TABLE(scenes_deleted INTEGER, results_deleted INTEGER) AS $$
DECLARE
  scene_count INTEGER;
  result_count INTEGER;
BEGIN
  -- Delete scene cache entries older than 24 hours
  WITH deleted AS (
    DELETE FROM ndvi_scene_cache
    WHERE created_at < NOW() - INTERVAL '24 hours'
    RETURNING 1
  )
  SELECT COUNT(*) INTO scene_count FROM deleted;

  -- Delete result cache entries older than 30 days
  WITH deleted AS (
    DELETE FROM ndvi_result_cache
    WHERE created_at < NOW() - INTERVAL '30 days'
    RETURNING 1
  )
  SELECT COUNT(*) INTO result_count FROM deleted;

  RETURN QUERY SELECT scene_count, result_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STATS FUNCTION (useful for debugging)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_ndvi_cache_stats()
RETURNS TABLE(
  scene_count BIGINT,
  result_count BIGINT,
  oldest_scene_hours NUMERIC,
  oldest_result_days NUMERIC,
  legacy_scene_count BIGINT,
  legacy_result_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM ndvi_scene_cache),
    (SELECT COUNT(*) FROM ndvi_result_cache),
    (SELECT EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 3600 FROM ndvi_scene_cache),
    (SELECT EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 86400 FROM ndvi_result_cache),
    (SELECT COUNT(*) FROM ndvi_scene_cache WHERE aoi_hash LIKE 'legacy%'),
    (SELECT COUNT(*) FROM ndvi_result_cache WHERE aoi_hash LIKE 'legacy%' OR evalscript_hash LIKE '%legacy%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_ndvi_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION get_ndvi_cache_stats() TO authenticated;
