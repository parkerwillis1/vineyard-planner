-- Bottling Management Tables
-- Run this migration in Supabase SQL Editor

-- 1. Bottling Runs (main run tracking)
CREATE TABLE IF NOT EXISTS bottling_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES wine_lots(id) ON DELETE RESTRICT,

  -- Run metadata
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  operator TEXT,

  -- Packaging configuration
  bottle_ml INTEGER NOT NULL DEFAULT 750,
  closure_type TEXT NOT NULL DEFAULT 'natural_cork',
  capsule_color TEXT,
  case_pack INTEGER NOT NULL DEFAULT 12,
  pallet_cases INTEGER,

  -- Volume & loss
  bulk_volume_gal DECIMAL(10, 2) NOT NULL,
  loss_pct DECIMAL(5, 2) NOT NULL DEFAULT 2.5,
  headspace_loss_gal DECIMAL(10, 2) DEFAULT 0,
  net_volume_gal DECIMAL(10, 2) NOT NULL,

  -- Planned vs actual
  estimated_bottles INTEGER NOT NULL,
  estimated_cases INTEGER NOT NULL,
  estimated_pallets INTEGER DEFAULT 0,
  actual_bottles INTEGER DEFAULT 0,
  actual_cases INTEGER DEFAULT 0,

  -- Label & compliance
  label_name TEXT NOT NULL,
  varietal TEXT NOT NULL,
  vintage INTEGER NOT NULL,
  appellation TEXT,
  abv DECIMAL(5, 2),
  lot_code TEXT NOT NULL,

  -- Inventory settings
  sku_prefix TEXT DEFAULT 'BOT',
  sku TEXT, -- Generated SKU
  create_as TEXT DEFAULT 'available' CHECK (create_as IN ('available', 'quarantine', 'needs_lab')),

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bottled Inventory (created upon run completion)
CREATE TABLE IF NOT EXISTS bottled_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES bottling_runs(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES wine_lots(id) ON DELETE RESTRICT,

  -- Inventory details
  sku TEXT NOT NULL,
  bottle_ml INTEGER NOT NULL,
  bottles_count INTEGER NOT NULL,
  cases_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'quarantine', 'needs_lab', 'allocated', 'sold')),

  -- Label info (denormalized for fast queries)
  label_name TEXT NOT NULL,
  varietal TEXT NOT NULL,
  vintage INTEGER NOT NULL,
  abv DECIMAL(5, 2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. QC Checks (timestamped checkpoints)
CREATE TABLE IF NOT EXISTS bottling_qc_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES bottling_runs(id) ON DELETE CASCADE,

  check_type TEXT NOT NULL CHECK (check_type IN ('fill_height', 'cork_insertion', 'label_placement', 'closure_torque', 'oxygen_check', 'sample_retained')),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(run_id, check_type)
);

-- 4. Issues Log (problems during run)
CREATE TABLE IF NOT EXISTS bottling_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES bottling_runs(id) ON DELETE CASCADE,

  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'critical')),
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bottling_runs_user ON bottling_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_bottling_runs_lot ON bottling_runs(lot_id);
CREATE INDEX IF NOT EXISTS idx_bottling_runs_status ON bottling_runs(status);
CREATE INDEX IF NOT EXISTS idx_bottled_inventory_user ON bottled_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_bottled_inventory_run ON bottled_inventory(run_id);
CREATE INDEX IF NOT EXISTS idx_bottled_inventory_sku ON bottled_inventory(sku);
CREATE INDEX IF NOT EXISTS idx_bottling_qc_run ON bottling_qc_checks(run_id);
CREATE INDEX IF NOT EXISTS idx_bottling_issues_run ON bottling_issues(run_id);

-- Row Level Security (RLS)
ALTER TABLE bottling_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottled_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottling_qc_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottling_issues ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bottling runs"
  ON bottling_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bottling runs"
  ON bottling_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bottling runs"
  ON bottling_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bottling runs"
  ON bottling_runs FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view their own bottled inventory"
  ON bottled_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bottled inventory"
  ON bottled_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bottled inventory"
  ON bottled_inventory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own QC checks"
  ON bottling_qc_checks FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own issues"
  ON bottling_issues FOR ALL
  USING (auth.uid() = user_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bottling_runs_updated_at
  BEFORE UPDATE ON bottling_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bottled_inventory_updated_at
  BEFORE UPDATE ON bottled_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bottling_qc_checks_updated_at
  BEFORE UPDATE ON bottling_qc_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bottling_issues_updated_at
  BEFORE UPDATE ON bottling_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RPC Function: Atomic Complete Bottling Run
CREATE OR REPLACE FUNCTION complete_bottling_run(
  p_run_id UUID,
  p_actual_bottles INTEGER,
  p_actual_cases INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_run bottling_runs;
  v_lot wine_lots;
  v_volume_used_gal DECIMAL(10, 2);
  v_inventory_id UUID;
  v_result JSON;
BEGIN
  -- 1. Lock and validate run
  SELECT * INTO v_run
  FROM bottling_runs
  WHERE id = p_run_id AND user_id = auth.uid() AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Run not found or not active';
  END IF;

  -- 2. Lock lot and validate volume
  SELECT * INTO v_lot
  FROM wine_lots
  WHERE id = v_run.lot_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lot not found';
  END IF;

  -- Calculate actual volume used
  v_volume_used_gal := (p_actual_bottles * v_run.bottle_ml) / 3785.411784;

  -- Validate sufficient volume
  IF v_lot.current_volume_gallons < v_volume_used_gal THEN
    RAISE EXCEPTION 'Insufficient volume: need %.2f gal, have %.2f gal',
      v_volume_used_gal, v_lot.current_volume_gallons;
  END IF;

  -- 3. Deduct volume from lot
  UPDATE wine_lots
  SET
    current_volume_gallons = current_volume_gallons - v_volume_used_gal,
    status = CASE
      WHEN current_volume_gallons - v_volume_used_gal <= 0 THEN 'bottled'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = v_lot.id;

  -- 4. Create bottled inventory
  INSERT INTO bottled_inventory (
    user_id, run_id, lot_id, sku, bottle_ml, bottles_count, cases_count,
    status, label_name, varietal, vintage, abv
  ) VALUES (
    auth.uid(), p_run_id, v_run.lot_id, v_run.sku, v_run.bottle_ml,
    p_actual_bottles, p_actual_cases, v_run.create_as,
    v_run.label_name, v_run.varietal, v_run.vintage, v_run.abv
  ) RETURNING id INTO v_inventory_id;

  -- 5. Mark run as completed
  UPDATE bottling_runs
  SET
    status = 'completed',
    actual_bottles = p_actual_bottles,
    actual_cases = p_actual_cases,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_run_id;

  -- 6. Return success result
  SELECT json_build_object(
    'success', true,
    'run_id', p_run_id,
    'inventory_id', v_inventory_id,
    'volume_deducted_gal', v_volume_used_gal,
    'lot_remaining_gal', v_lot.current_volume_gallons - v_volume_used_gal
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to complete run: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION complete_bottling_run TO authenticated;

COMMENT ON TABLE bottling_runs IS 'Bottling run sessions with planning and execution data';
COMMENT ON TABLE bottled_inventory IS 'Finished goods inventory created from bottling runs';
COMMENT ON TABLE bottling_qc_checks IS 'Quality control checkpoints during bottling';
COMMENT ON TABLE bottling_issues IS 'Issues/problems logged during bottling runs';
COMMENT ON FUNCTION complete_bottling_run IS 'Atomically complete a bottling run: deduct volume, create inventory, update statuses';
