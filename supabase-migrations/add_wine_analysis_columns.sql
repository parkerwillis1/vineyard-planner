-- Add wine analysis columns to fermentation_logs and production_lots tables
-- These columns support comprehensive wine chemistry tracking

-- Add columns to fermentation_logs for lab analysis
ALTER TABLE fermentation_logs
  ADD COLUMN IF NOT EXISTS alcohol_pct DECIMAL(4, 2),
  ADD COLUMN IF NOT EXISTS malic_acid DECIMAL(5, 3),
  ADD COLUMN IF NOT EXISTS lactic_acid DECIMAL(5, 3),
  ADD COLUMN IF NOT EXISTS residual_sugar DECIMAL(6, 2);

-- Add wine_profile column to production_lots for storing the selected wine style
-- This is used to show target chemistry ranges in the Wine Analysis page
ALTER TABLE production_lots
  ADD COLUMN IF NOT EXISTS wine_profile TEXT CHECK (wine_profile IN (
    'white_dry', 'white_sweet', 'red_light', 'red_full', 'sparkling', 'dessert'
  ));

-- Add comment for documentation
COMMENT ON COLUMN fermentation_logs.alcohol_pct IS 'Alcohol percentage measured via ebulliometer or other method';
COMMENT ON COLUMN fermentation_logs.malic_acid IS 'Malic acid in g/L - tracked for MLF monitoring';
COMMENT ON COLUMN fermentation_logs.lactic_acid IS 'Lactic acid in g/L - tracked for MLF completion';
COMMENT ON COLUMN fermentation_logs.residual_sugar IS 'Residual sugar in g/L';
COMMENT ON COLUMN production_lots.wine_profile IS 'Wine style profile for target chemistry ranges: white_dry, white_sweet, red_light, red_full, sparkling, dessert';
