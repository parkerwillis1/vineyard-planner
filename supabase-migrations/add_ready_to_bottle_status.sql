-- Add 'ready_to_bottle' status to production_lots
-- This status indicates wine has completed aging and is approved for bottling

-- Drop existing constraint
ALTER TABLE production_lots
DROP CONSTRAINT IF EXISTS production_lots_status_check;

-- Add new constraint with 'ready_to_bottle' included
ALTER TABLE production_lots
ADD CONSTRAINT production_lots_status_check
CHECK (status IN (
  'planning', 'harvested', 'crushing', 'fermenting', 'pressed',
  'aging', 'blending', 'ready_to_bottle', 'filtering', 'bottled', 'archived'
));

-- Add comment explaining the workflow
COMMENT ON COLUMN production_lots.status IS
'Lot lifecycle: planning → harvested → crushing → fermenting → pressed → aging → blending → ready_to_bottle → filtering → bottled → archived';
