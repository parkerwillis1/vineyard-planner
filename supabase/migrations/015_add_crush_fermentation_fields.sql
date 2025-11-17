-- Migration 015: Add crush and fermentation tracking fields to production_lots
-- Adds columns needed for crush pad and fermentation tracking

ALTER TABLE production_lots
  ADD COLUMN IF NOT EXISTS crush_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fermentation_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fermentation_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS so2_ppm DECIMAL(6, 2),
  ADD COLUMN IF NOT EXISTS yeast_strain TEXT,
  ADD COLUMN IF NOT EXISTS press_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bottling_date TIMESTAMPTZ;

-- Add indexes for date-based queries
CREATE INDEX IF NOT EXISTS production_lots_fermentation_start_idx
  ON production_lots(fermentation_start_date)
  WHERE fermentation_start_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS production_lots_crush_date_idx
  ON production_lots(crush_date)
  WHERE crush_date IS NOT NULL;

-- Add comments
COMMENT ON COLUMN production_lots.crush_date IS 'Date/time when grapes were crushed and destemmed';
COMMENT ON COLUMN production_lots.fermentation_start_date IS 'Date/time when fermentation was started (yeast pitched)';
COMMENT ON COLUMN production_lots.fermentation_end_date IS 'Date/time when fermentation completed';
COMMENT ON COLUMN production_lots.so2_ppm IS 'Current or target SO2 level in parts per million';
COMMENT ON COLUMN production_lots.yeast_strain IS 'Yeast strain used for fermentation (e.g., EC-1118, D47, RC-212)';
COMMENT ON COLUMN production_lots.press_date IS 'Date/time when wine was pressed off skins';
COMMENT ON COLUMN production_lots.bottling_date IS 'Date/time when wine was bottled';
