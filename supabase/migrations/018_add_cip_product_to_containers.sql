-- Migration 018: Add CIP tracking to production_containers
-- Adds fields to track cleaning/sanitizing history

ALTER TABLE production_containers
  ADD COLUMN IF NOT EXISTS last_cip_date DATE,
  ADD COLUMN IF NOT EXISTS cip_product TEXT;

-- Add comments
COMMENT ON COLUMN production_containers.last_cip_date IS 'Date when container was last cleaned/sanitized';
COMMENT ON COLUMN production_containers.cip_product IS 'Clean-in-place product used for sanitizing this container';
