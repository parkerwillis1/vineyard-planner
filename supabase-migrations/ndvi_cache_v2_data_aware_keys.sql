-- NDVI Cache V2: Data-aware cache keys
-- Adds columns for AOI hash, processing params, and evalscript hash
-- to ensure cache correctness when parameters change

-- Add new columns to ndvi_scene_cache
ALTER TABLE ndvi_scene_cache
ADD COLUMN IF NOT EXISTS aoi_hash TEXT,
ADD COLUMN IF NOT EXISTS cloud_threshold INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS data_collection TEXT DEFAULT 'sentinel-2-l2a';

-- Add new columns to ndvi_result_cache
ALTER TABLE ndvi_result_cache
ADD COLUMN IF NOT EXISTS aoi_hash TEXT,
ADD COLUMN IF NOT EXISTS resolution INTEGER DEFAULT 512,
ADD COLUMN IF NOT EXISTS cloud_threshold INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS data_collection TEXT DEFAULT 'sentinel-2-l2a',
ADD COLUMN IF NOT EXISTS date_from DATE,
ADD COLUMN IF NOT EXISTS date_to DATE,
ADD COLUMN IF NOT EXISTS evalscript_hash TEXT;

-- Create new composite indexes for the data-aware lookups
DROP INDEX IF EXISTS idx_ndvi_scene_cache_block_dates;
CREATE INDEX idx_ndvi_scene_cache_v2_lookup
  ON ndvi_scene_cache(block_id, from_date, to_date, aoi_hash, cloud_threshold);

DROP INDEX IF EXISTS idx_ndvi_result_cache_lookup;
CREATE INDEX idx_ndvi_result_cache_v2_lookup
  ON ndvi_result_cache(block_id, scene_id, evalscript_hash, aoi_hash, resolution);

-- Update the unique constraints to include new key parts
-- First drop existing constraints
ALTER TABLE ndvi_scene_cache DROP CONSTRAINT IF EXISTS ndvi_scene_cache_block_id_from_date_to_date_key;
ALTER TABLE ndvi_result_cache DROP CONSTRAINT IF EXISTS ndvi_result_cache_block_id_scene_id_evalscript_version_key;

-- Add new composite unique constraints
ALTER TABLE ndvi_scene_cache
ADD CONSTRAINT ndvi_scene_cache_v2_unique
UNIQUE (block_id, from_date, to_date, aoi_hash, cloud_threshold);

ALTER TABLE ndvi_result_cache
ADD CONSTRAINT ndvi_result_cache_v2_unique
UNIQUE (block_id, scene_id, evalscript_hash, aoi_hash, resolution);

-- Backfill existing records with default aoi_hash (will be regenerated on next fetch)
-- Setting to 'legacy' to distinguish from properly hashed entries
UPDATE ndvi_scene_cache SET aoi_hash = 'legacy' WHERE aoi_hash IS NULL;
UPDATE ndvi_result_cache SET aoi_hash = 'legacy', evalscript_hash = 'legacy' WHERE aoi_hash IS NULL;

-- Make aoi_hash NOT NULL after backfill
ALTER TABLE ndvi_scene_cache ALTER COLUMN aoi_hash SET NOT NULL;
ALTER TABLE ndvi_result_cache ALTER COLUMN aoi_hash SET NOT NULL;
ALTER TABLE ndvi_result_cache ALTER COLUMN evalscript_hash SET NOT NULL;
