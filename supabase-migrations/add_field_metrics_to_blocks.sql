-- Add field metrics columns to vineyard_blocks table

ALTER TABLE vineyard_blocks
ADD COLUMN IF NOT EXISTS estimated_vines INTEGER,
ADD COLUMN IF NOT EXISTS estimated_rows INTEGER;

COMMENT ON COLUMN vineyard_blocks.estimated_vines IS 'Total number of vines in the field';
COMMENT ON COLUMN vineyard_blocks.estimated_rows IS 'Number of rows in the field';

CREATE INDEX IF NOT EXISTS idx_vineyard_blocks_estimated_vines ON vineyard_blocks(estimated_vines);

CREATE INDEX IF NOT EXISTS idx_vineyard_blocks_estimated_rows ON vineyard_blocks(estimated_rows);
