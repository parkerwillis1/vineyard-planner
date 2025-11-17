-- Migration 017: Add time/logistics and fruit quality fields to production_lots
-- Adds pick times, arrival time, and fruit condition data for harvest intake workflow

ALTER TABLE production_lots
  -- Time & Logistics
  ADD COLUMN IF NOT EXISTS pick_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pick_end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMPTZ,

  -- Fruit Quality & Condition
  ADD COLUMN IF NOT EXISTS mog_percent DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS rot_percent DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS mildew_percent DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS sunburn_percent DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS sorting TEXT CHECK (sorting IN ('none', 'hand_sort', 'optical_sort', 'vibrating_table'));

-- Add constraints for percentages (0-100 range)
ALTER TABLE production_lots
  ADD CONSTRAINT mog_percent_range CHECK (mog_percent >= 0 AND mog_percent <= 100),
  ADD CONSTRAINT rot_percent_range CHECK (rot_percent >= 0 AND rot_percent <= 100),
  ADD CONSTRAINT mildew_percent_range CHECK (mildew_percent >= 0 AND mildew_percent <= 100),
  ADD CONSTRAINT sunburn_percent_range CHECK (sunburn_percent >= 0 AND sunburn_percent <= 100);

-- Add comments
COMMENT ON COLUMN production_lots.pick_start_time IS 'When harvesting began in the vineyard';
COMMENT ON COLUMN production_lots.pick_end_time IS 'When harvesting completed in the vineyard';
COMMENT ON COLUMN production_lots.arrival_time IS 'When fruit arrived at the crush pad';
COMMENT ON COLUMN production_lots.mog_percent IS 'Material other than grapes percentage (leaves, stems, etc.)';
COMMENT ON COLUMN production_lots.rot_percent IS 'Percentage of fruit with rot/spoilage';
COMMENT ON COLUMN production_lots.mildew_percent IS 'Percentage of fruit with mildew damage';
COMMENT ON COLUMN production_lots.sunburn_percent IS 'Percentage of fruit with sunburn/heat damage';
COMMENT ON COLUMN production_lots.sorting IS 'Sorting method used: none, hand_sort, optical_sort, or vibrating_table';
