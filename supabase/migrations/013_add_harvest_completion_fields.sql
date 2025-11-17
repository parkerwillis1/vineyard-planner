-- Migration 013: Add Harvest Completion Fields
-- Adds chemistry fields to harvest_tracking for recording actual harvest quality metrics

-- Add average chemistry fields for completed harvests
ALTER TABLE harvest_tracking
  ADD COLUMN IF NOT EXISTS avg_brix NUMERIC,
  ADD COLUMN IF NOT EXISTS avg_ph NUMERIC,
  ADD COLUMN IF NOT EXISTS avg_ta NUMERIC,
  ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Add comment to explain these fields
COMMENT ON COLUMN harvest_tracking.avg_brix IS 'Average Brix measured across all loads during harvest';
COMMENT ON COLUMN harvest_tracking.avg_ph IS 'Average pH measured across all loads during harvest';
COMMENT ON COLUMN harvest_tracking.avg_ta IS 'Average titratable acidity (g/L) measured across all loads during harvest';
COMMENT ON COLUMN harvest_tracking.completion_notes IS 'Notes recorded when completing the harvest (weather, crew notes, quality observations)';
