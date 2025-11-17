-- Migration 014: Add imported_to_production flag
-- Prevents duplicate imports from Operations to Production

ALTER TABLE harvest_tracking
  ADD COLUMN IF NOT EXISTS imported_to_production BOOLEAN DEFAULT false;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_harvest_tracking_imported
  ON harvest_tracking(imported_to_production)
  WHERE imported_to_production = false;

COMMENT ON COLUMN harvest_tracking.imported_to_production IS 'Flag indicating whether this harvest has been imported into the Production module';
