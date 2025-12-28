-- Add fermentation tracking fields to production_lots table
ALTER TABLE production_lots
  ADD COLUMN IF NOT EXISTS fermentation_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS target_fermentation_days INTEGER,
  ADD COLUMN IF NOT EXISTS press_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS so2_ppm DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS yeast_strain TEXT;

-- Add harvest/crush tracking fields to production_lots table
ALTER TABLE production_lots
  ADD COLUMN IF NOT EXISTS pick_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pick_end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mog_percent DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS rot_percent DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS mildew_percent DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS sunburn_percent DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS sorting TEXT CHECK (sorting IN ('none', 'light', 'moderate', 'heavy', 'berry'));

-- Add comments for documentation
COMMENT ON COLUMN production_lots.fermentation_start_date IS 'Date when fermentation was started (yeast inoculation)';
COMMENT ON COLUMN production_lots.target_fermentation_days IS 'Expected duration of primary fermentation in days';
COMMENT ON COLUMN production_lots.press_date IS 'Date when wine was pressed off skins/solids';
COMMENT ON COLUMN production_lots.so2_ppm IS 'Initial SO2 addition at fermentation start (ppm)';
COMMENT ON COLUMN production_lots.yeast_strain IS 'Yeast strain used for fermentation (e.g., EC-1118, RC-212)';
COMMENT ON COLUMN production_lots.pick_start_time IS 'Time when grape picking started in vineyard';
COMMENT ON COLUMN production_lots.pick_end_time IS 'Time when grape picking finished in vineyard';
COMMENT ON COLUMN production_lots.arrival_time IS 'Time when grapes arrived at winery for processing';
COMMENT ON COLUMN production_lots.mog_percent IS 'Material other than grapes percentage (stems, leaves, etc.)';
COMMENT ON COLUMN production_lots.rot_percent IS 'Percentage of grapes showing rot/mold';
COMMENT ON COLUMN production_lots.mildew_percent IS 'Percentage of grapes affected by powdery mildew';
COMMENT ON COLUMN production_lots.sunburn_percent IS 'Percentage of grapes with sunburn damage';
COMMENT ON COLUMN production_lots.sorting IS 'Level of sorting performed: none, light, moderate, heavy, or berry (individual berry sorting)';
