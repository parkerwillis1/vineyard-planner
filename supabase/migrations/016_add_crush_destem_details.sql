-- Migration 016: Add crush/destem workflow fields to production_lots
-- Adds detailed crush processing data for harvest intake workflow

ALTER TABLE production_lots
  ADD COLUMN IF NOT EXISTS processing_style TEXT CHECK (processing_style IN ('red', 'white', 'rosé', 'sparkling', 'other')),
  ADD COLUMN IF NOT EXISTS destem_mode TEXT CHECK (destem_mode IN ('fully_destemmed', 'partial_whole_cluster', 'whole_cluster')),
  ADD COLUMN IF NOT EXISTS whole_cluster_percent DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS crushed_weight_lbs DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS stem_loss_lbs DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS stem_loss_percent DECIMAL(5, 2);

-- Add constraints
ALTER TABLE production_lots
  ADD CONSTRAINT whole_cluster_percent_range CHECK (whole_cluster_percent >= 0 AND whole_cluster_percent <= 100),
  ADD CONSTRAINT stem_loss_percent_range CHECK (stem_loss_percent >= 0 AND stem_loss_percent <= 100);

-- Add comments
COMMENT ON COLUMN production_lots.processing_style IS 'Wine processing style: red, white, rosé, sparkling, or other';
COMMENT ON COLUMN production_lots.destem_mode IS 'Destemming approach: fully_destemmed, partial_whole_cluster, or whole_cluster';
COMMENT ON COLUMN production_lots.whole_cluster_percent IS 'Percentage of whole cluster if using partial_whole_cluster mode (0-100)';
COMMENT ON COLUMN production_lots.crushed_weight_lbs IS 'Weight after crushing and destemming (net must/juice weight)';
COMMENT ON COLUMN production_lots.stem_loss_lbs IS 'Weight of stems removed during destemming';
COMMENT ON COLUMN production_lots.stem_loss_percent IS 'Percentage of harvest weight lost to stems (0-100)';
