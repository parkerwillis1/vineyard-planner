-- Add custom_fields column to vineyard_blocks table
-- This stores user-defined custom metadata fields as key-value pairs

ALTER TABLE vineyard_blocks
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add a comment to document what this column is for
COMMENT ON COLUMN vineyard_blocks.custom_fields IS 'User-defined custom metadata fields stored as JSON key-value pairs';

-- Add index for better query performance on custom_fields
CREATE INDEX IF NOT EXISTS idx_vineyard_blocks_custom_fields
ON vineyard_blocks USING gin (custom_fields);
