-- Backfill alcohol_pct and last_analysis_date from fermentation_logs to production_lots
-- This fixes lots that had lab tests created before the propagation logic was added

UPDATE production_lots
SET
  alcohol_pct = latest_labs.alcohol_pct,
  last_analysis_date = latest_labs.log_date,
  updated_at = now()
FROM (
  SELECT DISTINCT ON (lot_id)
    lot_id,
    alcohol_pct,
    log_date
  FROM fermentation_logs
  WHERE alcohol_pct IS NOT NULL
  ORDER BY lot_id, log_date DESC
) AS latest_labs
WHERE production_lots.id = latest_labs.lot_id
  AND (
    production_lots.alcohol_pct IS NULL
    OR production_lots.alcohol_pct != latest_labs.alcohol_pct
  );
