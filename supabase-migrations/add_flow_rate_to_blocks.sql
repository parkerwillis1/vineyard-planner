-- Add flow_rate_gpm column to vineyard_blocks table
-- This stores the user's configured irrigation system flow rate in gallons per minute

ALTER TABLE vineyard_blocks
ADD COLUMN IF NOT EXISTS flow_rate_gpm INTEGER;

-- Add a comment to document what this column is for
COMMENT ON COLUMN vineyard_blocks.flow_rate_gpm IS 'Irrigation system flow rate in gallons per minute (GPM). User-configured value for runtime calculations.';
