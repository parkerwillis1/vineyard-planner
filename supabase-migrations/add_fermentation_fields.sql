-- Add fermentation tracking fields to production_lots table
ALTER TABLE production_lots
  ADD COLUMN IF NOT EXISTS fermentation_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS target_fermentation_days INTEGER,
  ADD COLUMN IF NOT EXISTS press_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS so2_ppm DECIMAL(6, 2),
  ADD COLUMN IF NOT EXISTS yeast_strain TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS production_lots_fermentation_start_date_idx ON production_lots(fermentation_start_date);
CREATE INDEX IF NOT EXISTS production_lots_press_date_idx ON production_lots(press_date);

-- Add comments for documentation
COMMENT ON COLUMN production_lots.fermentation_start_date IS 'Date when primary fermentation was started';
COMMENT ON COLUMN production_lots.target_fermentation_days IS 'Target number of days for fermentation (typically 10-21 days)';
COMMENT ON COLUMN production_lots.press_date IS 'Date when wine was pressed (fermentation complete)';
COMMENT ON COLUMN production_lots.so2_ppm IS 'SO₂ addition in parts per million at fermentation start';
COMMENT ON COLUMN production_lots.yeast_strain IS 'Yeast strain used for fermentation (e.g., RC-212, EC-1118)';
