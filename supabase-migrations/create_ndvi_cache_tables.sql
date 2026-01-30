-- NDVI Scene Cache Table
-- Caches the "best scene" selection from Sentinel Hub Catalog API
-- TTL: 24 hours (checked in application code)
CREATE TABLE IF NOT EXISTS ndvi_scene_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  scene_id TEXT NOT NULL,
  acquisition_date TIMESTAMPTZ NOT NULL,
  cloud_cover NUMERIC(5,2),
  bbox_json JSONB NOT NULL,
  available_images INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicate cache entries for same block/date range
  UNIQUE(block_id, from_date, to_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ndvi_scene_cache_block_dates
  ON ndvi_scene_cache(block_id, from_date, to_date);

CREATE INDEX IF NOT EXISTS idx_ndvi_scene_cache_created
  ON ndvi_scene_cache(created_at);

-- NDVI Result Cache Table
-- Caches the actual NDVI processing results from Sentinel Hub Process API
-- TTL: 30 days (checked in application code)
CREATE TABLE IF NOT EXISTS ndvi_result_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  scene_id TEXT NOT NULL,
  evalscript_version TEXT NOT NULL DEFAULT 'v1',
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicate cache entries
  UNIQUE(block_id, scene_id, evalscript_version)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ndvi_result_cache_lookup
  ON ndvi_result_cache(block_id, scene_id, evalscript_version);

CREATE INDEX IF NOT EXISTS idx_ndvi_result_cache_created
  ON ndvi_result_cache(created_at);

-- RLS Policies for ndvi_scene_cache
ALTER TABLE ndvi_scene_cache ENABLE ROW LEVEL SECURITY;

-- Users can read cache entries for blocks they own
CREATE POLICY "Users can read own block scene cache" ON ndvi_scene_cache
  FOR SELECT
  USING (
    block_id IN (
      SELECT id FROM vineyard_blocks WHERE user_id = auth.uid()
    )
  );

-- Users can insert cache entries for blocks they own
CREATE POLICY "Users can insert own block scene cache" ON ndvi_scene_cache
  FOR INSERT
  WITH CHECK (
    block_id IN (
      SELECT id FROM vineyard_blocks WHERE user_id = auth.uid()
    )
  );

-- Users can delete cache entries for blocks they own
CREATE POLICY "Users can delete own block scene cache" ON ndvi_scene_cache
  FOR DELETE
  USING (
    block_id IN (
      SELECT id FROM vineyard_blocks WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for ndvi_result_cache
ALTER TABLE ndvi_result_cache ENABLE ROW LEVEL SECURITY;

-- Users can read cache entries for blocks they own
CREATE POLICY "Users can read own block result cache" ON ndvi_result_cache
  FOR SELECT
  USING (
    block_id IN (
      SELECT id FROM vineyard_blocks WHERE user_id = auth.uid()
    )
  );

-- Users can insert cache entries for blocks they own
CREATE POLICY "Users can insert own block result cache" ON ndvi_result_cache
  FOR INSERT
  WITH CHECK (
    block_id IN (
      SELECT id FROM vineyard_blocks WHERE user_id = auth.uid()
    )
  );

-- Users can delete cache entries for blocks they own
CREATE POLICY "Users can delete own block result cache" ON ndvi_result_cache
  FOR DELETE
  USING (
    block_id IN (
      SELECT id FROM vineyard_blocks WHERE user_id = auth.uid()
    )
  );

-- Optional: Function to clean up expired cache entries (can be called via cron)
CREATE OR REPLACE FUNCTION cleanup_ndvi_cache()
RETURNS void AS $$
BEGIN
  -- Delete scene cache entries older than 24 hours
  DELETE FROM ndvi_scene_cache
  WHERE created_at < NOW() - INTERVAL '24 hours';

  -- Delete result cache entries older than 30 days
  DELETE FROM ndvi_result_cache
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
