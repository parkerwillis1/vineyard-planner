-- Migration 012: Harvest Management System
-- Creates tables for harvest tracking, loads, and field samples

-- ============================================================================
-- HARVEST TRACKING TABLE
-- One record per block per season for tracking planned and actual harvest
-- ============================================================================
CREATE TABLE IF NOT EXISTS harvest_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  season INTEGER NOT NULL, -- e.g., 2026

  -- Planning
  target_pick_date DATE,
  estimated_tons NUMERIC,
  estimated_tons_per_acre NUMERIC,

  -- Target Quality Metrics
  target_brix NUMERIC,
  target_ta NUMERIC,
  target_ph NUMERIC,

  -- Status Tracking
  status TEXT CHECK (status IN ('planned', 'in_progress', 'completed')) DEFAULT 'planned',

  -- Actuals (calculated from loads)
  actual_tons NUMERIC DEFAULT 0,
  actual_tons_per_acre NUMERIC DEFAULT 0,
  total_bins INTEGER DEFAULT 0,

  -- Important Dates
  actual_pick_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Additional Info
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one harvest record per block per season
  UNIQUE(organization_id, block_id, season)
);

-- ============================================================================
-- HARVEST LOADS TABLE
-- Individual loads/bins during harvest with weights and quality data
-- ============================================================================
CREATE TABLE IF NOT EXISTS harvest_loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  harvest_id UUID NOT NULL REFERENCES harvest_tracking(id) ON DELETE CASCADE,

  -- Load Information
  load_number INTEGER, -- 1, 2, 3... for this harvest
  bin_count INTEGER DEFAULT 1,

  -- Weight Measurements
  gross_weight_lbs NUMERIC,
  tare_weight_lbs NUMERIC DEFAULT 0,
  net_weight_lbs NUMERIC GENERATED ALWAYS AS (
    COALESCE(gross_weight_lbs, 0) - COALESCE(tare_weight_lbs, 0)
  ) STORED,
  tons NUMERIC GENERATED ALWAYS AS (
    (COALESCE(gross_weight_lbs, 0) - COALESCE(tare_weight_lbs, 0)) / 2000.0
  ) STORED,

  -- Quality Metrics
  brix NUMERIC,
  ta NUMERIC, -- titratable acidity
  ph NUMERIC,
  temperature_f NUMERIC,

  -- Tracking
  picked_at TIMESTAMPTZ DEFAULT now(),
  destination TEXT, -- e.g., "Tank 5", "Sold to XYZ Winery"

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- HARVEST FIELD SAMPLES TABLE
-- Pre-harvest quality checks to track berry ripeness
-- ============================================================================
CREATE TABLE IF NOT EXISTS harvest_field_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,

  sample_date DATE NOT NULL,

  -- Berry Quality Metrics
  brix NUMERIC,
  ta NUMERIC, -- titratable acidity
  ph NUMERIC,

  -- Visual Observations
  berry_size TEXT, -- small, medium, large
  cluster_condition TEXT, -- excellent, good, fair, poor
  disease_pressure TEXT, -- none, low, medium, high

  -- Harvest Readiness
  ready_to_pick BOOLEAN DEFAULT false,
  estimated_days_to_harvest INTEGER,

  -- Tracking
  sampled_by UUID REFERENCES organization_members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_harvest_tracking_org_season
  ON harvest_tracking(organization_id, season);

CREATE INDEX IF NOT EXISTS idx_harvest_tracking_block
  ON harvest_tracking(block_id);

CREATE INDEX IF NOT EXISTS idx_harvest_tracking_status
  ON harvest_tracking(status);

CREATE INDEX IF NOT EXISTS idx_harvest_loads_harvest
  ON harvest_loads(harvest_id);

CREATE INDEX IF NOT EXISTS idx_harvest_loads_org
  ON harvest_loads(organization_id);

CREATE INDEX IF NOT EXISTS idx_harvest_samples_block_date
  ON harvest_field_samples(block_id, sample_date DESC);

CREATE INDEX IF NOT EXISTS idx_harvest_samples_org
  ON harvest_field_samples(organization_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE harvest_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_field_samples ENABLE ROW LEVEL SECURITY;

-- harvest_tracking policies
CREATE POLICY "Users can view org harvests" ON harvest_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create org harvests" ON harvest_tracking
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update org harvests" ON harvest_tracking
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete org harvests" ON harvest_tracking
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

-- harvest_loads policies
CREATE POLICY "Users can view org loads" ON harvest_loads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create org loads" ON harvest_loads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update org loads" ON harvest_loads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete org loads" ON harvest_loads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

-- harvest_field_samples policies
CREATE POLICY "Users can view org samples" ON harvest_field_samples
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create org samples" ON harvest_field_samples
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update org samples" ON harvest_field_samples
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete org samples" ON harvest_field_samples
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGER FUNCTION
-- Auto-update harvest_tracking.updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_harvest_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_harvest_tracking_updated_at
  BEFORE UPDATE ON harvest_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_harvest_tracking_updated_at();
