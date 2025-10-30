-- Add geometry field to vineyard_blocks table for map polygons
-- This allows storing GeoJSON polygon data for each block

ALTER TABLE vineyard_blocks
ADD COLUMN IF NOT EXISTS geom JSONB;

-- Add centroid coordinates for quick map centering
ALTER TABLE vineyard_blocks
ADD COLUMN IF NOT EXISTS centroid_lat NUMERIC;

ALTER TABLE vineyard_blocks
ADD COLUMN IF NOT EXISTS centroid_lng NUMERIC;

-- Index for geom queries (GIN index works well with JSONB)
CREATE INDEX IF NOT EXISTS idx_vineyard_blocks_geom
ON vineyard_blocks USING GIN (geom);

-- Comment on columns for documentation
COMMENT ON COLUMN vineyard_blocks.geom IS 'GeoJSON geometry object representing the block boundary polygon';
COMMENT ON COLUMN vineyard_blocks.centroid_lat IS 'Latitude of block centroid for map centering';
COMMENT ON COLUMN vineyard_blocks.centroid_lng IS 'Longitude of block centroid for map centering';
