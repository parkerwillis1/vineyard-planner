-- Add cost tracking fields to production_containers
ALTER TABLE production_containers
ADD COLUMN IF NOT EXISTS purchase_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS annual_maintenance_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS estimated_replacement_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS last_cip_date DATE,
ADD COLUMN IF NOT EXISTS cip_product TEXT;

-- Add comments for cost fields
COMMENT ON COLUMN production_containers.purchase_cost IS 'Original purchase price of the vessel';
COMMENT ON COLUMN production_containers.annual_maintenance_cost IS 'Estimated annual maintenance cost';
COMMENT ON COLUMN production_containers.estimated_replacement_cost IS 'Estimated cost to replace this vessel';
COMMENT ON COLUMN production_containers.last_cip_date IS 'Last date this vessel was cleaned (CIP)';
COMMENT ON COLUMN production_containers.cip_product IS 'Product used for last CIP (e.g., Saniclean, Star San)';

-- Update status constraint to include new status values
ALTER TABLE production_containers
DROP CONSTRAINT IF EXISTS production_containers_status_check;

ALTER TABLE production_containers
ADD CONSTRAINT production_containers_status_check
CHECK (status IN ('empty', 'in_use', 'cleaning', 'needs_cip', 'sanitized', 'needs_repair', 'retired'));

-- Create vessel_history table to track all vessel events
CREATE TABLE IF NOT EXISTS vessel_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  container_id UUID NOT NULL REFERENCES production_containers(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'fill', 'empty', 'transfer_in', 'transfer_out',
    'cip', 'top', 'rack', 'maintenance', 'repair',
    'lot_assigned', 'lot_removed', 'volume_change'
  )),
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Volume tracking
  volume_before DECIMAL(10, 2),
  volume_after DECIMAL(10, 2),
  volume_change DECIMAL(10, 2), -- Calculated: volume_after - volume_before

  -- Related entities
  lot_id UUID REFERENCES production_lots(id) ON DELETE SET NULL,
  related_container_id UUID REFERENCES production_containers(id) ON DELETE SET NULL, -- For transfers

  -- Event-specific data
  cip_product TEXT, -- For CIP events
  maintenance_type TEXT, -- For maintenance/repair events
  cost DECIMAL(10, 2), -- Cost of maintenance/repair

  -- Additional context
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS vessel_history_container_id_idx ON vessel_history(container_id);
CREATE INDEX IF NOT EXISTS vessel_history_user_id_idx ON vessel_history(user_id);
CREATE INDEX IF NOT EXISTS vessel_history_event_type_idx ON vessel_history(event_type);
CREATE INDEX IF NOT EXISTS vessel_history_event_date_idx ON vessel_history(event_date DESC);
CREATE INDEX IF NOT EXISTS vessel_history_lot_id_idx ON vessel_history(lot_id);

-- Enable RLS
ALTER TABLE vessel_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own vessel history" ON vessel_history;
DROP POLICY IF EXISTS "Users can insert their own vessel history" ON vessel_history;
DROP POLICY IF EXISTS "Users can update their own vessel history" ON vessel_history;
DROP POLICY IF EXISTS "Users can delete their own vessel history" ON vessel_history;

-- RLS Policies for vessel_history
CREATE POLICY "Users can view their own vessel history"
  ON vessel_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vessel history"
  ON vessel_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vessel history"
  ON vessel_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vessel history"
  ON vessel_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to automatically log volume changes
CREATE OR REPLACE FUNCTION log_vessel_volume_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if volume actually changed
  IF (OLD.current_volume_gallons IS DISTINCT FROM NEW.current_volume_gallons) THEN
    INSERT INTO vessel_history (
      user_id,
      container_id,
      event_type,
      volume_before,
      volume_after,
      volume_change,
      notes
    ) VALUES (
      NEW.user_id,
      NEW.id,
      'volume_change',
      OLD.current_volume_gallons,
      NEW.current_volume_gallons,
      (NEW.current_volume_gallons - COALESCE(OLD.current_volume_gallons, 0)),
      'Automatic volume change log'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic volume logging
DROP TRIGGER IF EXISTS vessel_volume_change_trigger ON production_containers;
CREATE TRIGGER vessel_volume_change_trigger
  AFTER UPDATE ON production_containers
  FOR EACH ROW
  EXECUTE FUNCTION log_vessel_volume_change();

-- Create a view for vessel analytics
CREATE OR REPLACE VIEW vessel_analytics AS
SELECT
  c.id,
  c.user_id,
  c.name,
  c.type,
  c.capacity_gallons,
  c.purchase_cost,
  c.annual_maintenance_cost,
  c.total_fills,
  c.purchase_date,

  -- Calculate age in days
  CASE
    WHEN c.purchase_date IS NOT NULL
    THEN EXTRACT(DAY FROM (NOW() - c.purchase_date))
    ELSE NULL
  END as age_days,

  -- Cost per gallon (purchase cost / lifetime capacity)
  CASE
    WHEN c.purchase_cost IS NOT NULL AND c.total_fills > 0
    THEN c.purchase_cost / (c.capacity_gallons * c.total_fills)
    ELSE NULL
  END as cost_per_gallon,

  -- Total maintenance costs from history
  (
    SELECT COALESCE(SUM(cost), 0)
    FROM vessel_history
    WHERE container_id = c.id
    AND event_type IN ('maintenance', 'repair', 'cip')
  ) as total_maintenance_spent,

  -- Count of fill events
  (
    SELECT COUNT(*)
    FROM vessel_history
    WHERE container_id = c.id
    AND event_type IN ('fill', 'lot_assigned')
  ) as fill_events_count,

  -- Count of CIP events
  (
    SELECT COUNT(*)
    FROM vessel_history
    WHERE container_id = c.id
    AND event_type = 'cip'
  ) as cip_events_count,

  -- Last fill date
  (
    SELECT MAX(event_date)
    FROM vessel_history
    WHERE container_id = c.id
    AND event_type IN ('fill', 'lot_assigned')
  ) as last_fill_date,

  -- Days since last CIP
  CASE
    WHEN c.last_cip_date IS NOT NULL
    THEN EXTRACT(DAY FROM (NOW() - c.last_cip_date))
    ELSE NULL
  END as days_since_cip,

  -- Current lot assignment
  (
    SELECT l.name
    FROM production_lots l
    WHERE l.container_id = c.id
    LIMIT 1
  ) as current_lot_name

FROM production_containers c;

-- Grant access to the view
COMMENT ON VIEW vessel_analytics IS 'Comprehensive analytics view for vessel performance and costs';
