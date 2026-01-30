-- Add quality_score column to ndvi_scene_cache for scene selection metrics
-- This stores the quality scoring breakdown from scene selection

ALTER TABLE ndvi_scene_cache
ADD COLUMN IF NOT EXISTS quality_score JSONB;

-- Add comment for documentation
COMMENT ON COLUMN ndvi_scene_cache.quality_score IS 'Quality score breakdown: { total, breakdown: { cloudScore, recencyScore, growingSeasonScore, viewAngleScore, daysSinceCapture } }';

-- Index for potential quality-based queries
CREATE INDEX IF NOT EXISTS idx_scene_cache_quality
  ON ndvi_scene_cache USING GIN (quality_score);
