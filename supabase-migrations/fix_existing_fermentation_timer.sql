-- Fix existing fermentation lots to show timer
-- This updates lots that have fermentation_start_date but no target_fermentation_days

-- Update all fermenting lots to have a default target_fermentation_days if not set
UPDATE production_lots
SET target_fermentation_days = 14  -- Default to 14 days for reds
WHERE status = 'fermenting'
  AND fermentation_start_date IS NOT NULL
  AND target_fermentation_days IS NULL;

-- For white wine varietals, set to 10 days instead
UPDATE production_lots
SET target_fermentation_days = 10
WHERE status = 'fermenting'
  AND fermentation_start_date IS NOT NULL
  AND (
    LOWER(varietal) LIKE '%chardonnay%' OR
    LOWER(varietal) LIKE '%sauvignon%' OR
    LOWER(varietal) LIKE '%riesling%' OR
    LOWER(varietal) LIKE '%pinot gris%' OR
    LOWER(varietal) LIKE '%pinot grigio%'
  );
