-- Add soil data and custom fields columns to vineyard_blocks table
-- This adds comprehensive soil analysis fields and custom metadata storage

-- Soil Data Columns
ALTER TABLE vineyard_blocks
ADD COLUMN IF NOT EXISTS soil_type TEXT,
ADD COLUMN IF NOT EXISTS soil_ph DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS soil_texture TEXT,
ADD COLUMN IF NOT EXISTS soil_drainage TEXT,
ADD COLUMN IF NOT EXISTS soil_organic_matter_percent DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS soil_notes TEXT;

-- Custom Fields (user-defined metadata)
ALTER TABLE vineyard_blocks
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add comments to document columns
COMMENT ON COLUMN vineyard_blocks.soil_type IS 'Soil type classification (e.g., clay, loam, sandy)';
COMMENT ON COLUMN vineyard_blocks.soil_ph IS 'Soil pH level (0-14 scale)';
COMMENT ON COLUMN vineyard_blocks.soil_texture IS 'Detailed soil texture description';
COMMENT ON COLUMN vineyard_blocks.soil_drainage IS 'Soil drainage characteristics (e.g., well-drained, poor drainage)';
COMMENT ON COLUMN vineyard_blocks.soil_organic_matter_percent IS 'Percentage of organic matter in soil';
COMMENT ON COLUMN vineyard_blocks.soil_notes IS 'Additional notes about soil conditions';
COMMENT ON COLUMN vineyard_blocks.custom_fields IS 'User-defined custom metadata fields stored as JSON key-value pairs';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vineyard_blocks_soil_type
ON vineyard_blocks(soil_type);

CREATE INDEX IF NOT EXISTS idx_vineyard_blocks_custom_fields
ON vineyard_blocks USING gin (custom_fields);
