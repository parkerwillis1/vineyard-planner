-- Add barrel tracking date fields to production_containers
-- Run this migration to add topping and racking date tracking

ALTER TABLE production_containers
ADD COLUMN IF NOT EXISTS last_topping_date DATE,
ADD COLUMN IF NOT EXISTS last_racking_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN production_containers.last_topping_date IS 'Last date this barrel was topped up';
COMMENT ON COLUMN production_containers.last_racking_date IS 'Last date wine was racked from this container';
