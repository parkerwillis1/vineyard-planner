-- =====================================================
-- COMPLETE VINEYARD OPERATIONS MIGRATION
-- All tables needed for current features
-- =====================================================

-- =====================================================
-- HELPER FUNCTION (needed for triggers)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 1. SEASONS
-- =====================================================
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seasons_user_id ON seasons(user_id);
CREATE INDEX IF NOT EXISTS idx_seasons_is_active ON seasons(is_active);

-- =====================================================
-- 2. VINEYARD BLOCKS
-- =====================================================
CREATE TABLE IF NOT EXISTS vineyard_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,

  -- Basic Info
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fallow', 'new', 'removed')),
  acres NUMERIC,

  -- Viticulture Details
  variety TEXT,
  rootstock TEXT,
  clone TEXT,
  trellis_system TEXT,
  row_spacing_ft NUMERIC,
  vine_spacing_ft NUMERIC,
  vine_count_reported INTEGER,
  row_orientation_deg NUMERIC,
  year_planted INTEGER,
  irrigation_zone TEXT,

  -- Additional fields
  elevation_ft NUMERIC,
  soil_type TEXT,
  aspect TEXT,
  slope_percent NUMERIC,
  geom JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vineyard_blocks_user_id ON vineyard_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_vineyard_blocks_season_id ON vineyard_blocks(season_id);
CREATE INDEX IF NOT EXISTS idx_vineyard_blocks_status ON vineyard_blocks(status);

-- =====================================================
-- 3. INVENTORY ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('chemical', 'fertilizer', 'fuel', 'ppe', 'supplies', 'misc')),
  name TEXT NOT NULL,
  manufacturer TEXT,
  product_code TEXT,
  unit TEXT NOT NULL,
  on_hand_qty NUMERIC DEFAULT 0,
  min_qty NUMERIC DEFAULT 0,
  max_qty NUMERIC,
  unit_cost NUMERIC,
  lot_number TEXT,
  expires_on DATE,

  -- Chemical-specific fields
  epa_reg_no TEXT,
  frac_code TEXT,
  hrac_code TEXT,
  irac_code TEXT,
  rei_hours INTEGER,
  phi_days INTEGER,
  active_ingredient TEXT,
  concentration TEXT,
  signal_word TEXT,

  -- Storage & safety
  storage_location TEXT,
  sds_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_on_hand_qty ON inventory_items(on_hand_qty);

-- =====================================================
-- 4. INVENTORY TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receive', 'use', 'adjust', 'waste', 'return')),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  reference_type TEXT,
  reference_id UUID,
  lot_number TEXT,
  notes TEXT,
  transaction_date TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id ON inventory_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);

-- =====================================================
-- 5. SPRAY APPLICATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS spray_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  application_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  applicator_id UUID REFERENCES auth.users(id),
  applicator_name TEXT,
  applicator_license TEXT,

  -- Weather conditions
  wind_mph NUMERIC,
  wind_direction TEXT,
  temp_f NUMERIC,
  humidity_pct NUMERIC,
  cloud_cover TEXT,
  inversion_risk TEXT,

  -- Application details
  equipment_id UUID,
  nozzle_type TEXT,
  nozzle_size TEXT,
  pressure_psi NUMERIC,
  gpa NUMERIC,
  total_tank_gal NUMERIC,
  treated_acres NUMERIC,
  spray_method TEXT,

  -- Compliance
  target_pest TEXT,
  growth_stage TEXT,
  buffer_zones_respected BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'locked')),

  -- Documentation
  notes TEXT,
  photos JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_spray_applications_user_id ON spray_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_spray_applications_season_id ON spray_applications(season_id);
CREATE INDEX IF NOT EXISTS idx_spray_applications_date ON spray_applications(application_date);
CREATE INDEX IF NOT EXISTS idx_spray_applications_status ON spray_applications(status);

-- =====================================================
-- 6. SPRAY BLOCKS (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS spray_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spray_id UUID NOT NULL REFERENCES spray_applications(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  acres_treated NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(spray_id, block_id)
);

CREATE INDEX IF NOT EXISTS idx_spray_blocks_spray_id ON spray_blocks(spray_id);
CREATE INDEX IF NOT EXISTS idx_spray_blocks_block_id ON spray_blocks(block_id);

-- =====================================================
-- 7. SPRAY MIX LINES
-- =====================================================
CREATE TABLE IF NOT EXISTS spray_mix_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spray_id UUID NOT NULL REFERENCES spray_applications(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  rate_per_acre NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  total_quantity NUMERIC NOT NULL,
  total_cost NUMERIC,
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spray_mix_lines_spray_id ON spray_mix_lines(spray_id);
CREATE INDEX IF NOT EXISTS idx_spray_mix_lines_item_id ON spray_mix_lines(item_id);

-- =====================================================
-- 8. PHI LOCKS (Pre-Harvest Interval)
-- =====================================================
CREATE TABLE IF NOT EXISTS phi_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  spray_id UUID NOT NULL REFERENCES spray_applications(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  phi_days INTEGER NOT NULL,
  application_date DATE NOT NULL,
  phi_release_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  override_reason TEXT,
  override_by UUID REFERENCES auth.users(id),
  override_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phi_locks_user_id ON phi_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_phi_locks_block_id ON phi_locks(block_id);
CREATE INDEX IF NOT EXISTS idx_phi_locks_release_date ON phi_locks(phi_release_date);
CREATE INDEX IF NOT EXISTS idx_phi_locks_is_active ON phi_locks(is_active);

-- =====================================================
-- 9. REI LOCKS (Re-Entry Interval)
-- =====================================================
CREATE TABLE IF NOT EXISTS rei_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  spray_id UUID NOT NULL REFERENCES spray_applications(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  rei_hours INTEGER NOT NULL,
  application_datetime TIMESTAMPTZ NOT NULL,
  rei_release_datetime TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  override_reason TEXT,
  override_by UUID REFERENCES auth.users(id),
  override_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rei_locks_user_id ON rei_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_rei_locks_block_id ON rei_locks(block_id);
CREATE INDEX IF NOT EXISTS idx_rei_locks_release_datetime ON rei_locks(rei_release_datetime);
CREATE INDEX IF NOT EXISTS idx_rei_locks_is_active ON rei_locks(is_active);

-- =====================================================
-- 10. COMPLIANCE WARNINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spray_id UUID REFERENCES spray_applications(id) ON DELETE CASCADE,
  warning_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'blocking')),
  message TEXT NOT NULL,
  details JSONB,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_warnings_user_id ON compliance_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_warnings_spray_id ON compliance_warnings(spray_id);
CREATE INDEX IF NOT EXISTS idx_compliance_warnings_severity ON compliance_warnings(severity);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vineyard_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_mix_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE phi_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rei_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_warnings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Seasons
DROP POLICY IF EXISTS "Users can view own seasons" ON seasons;
DROP POLICY IF EXISTS "Users can insert own seasons" ON seasons;
DROP POLICY IF EXISTS "Users can update own seasons" ON seasons;
DROP POLICY IF EXISTS "Users can delete own seasons" ON seasons;

CREATE POLICY "Users can view own seasons" ON seasons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own seasons" ON seasons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own seasons" ON seasons FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own seasons" ON seasons FOR DELETE USING (auth.uid() = user_id);

-- Vineyard Blocks
DROP POLICY IF EXISTS "Users can view own blocks" ON vineyard_blocks;
DROP POLICY IF EXISTS "Users can insert own blocks" ON vineyard_blocks;
DROP POLICY IF EXISTS "Users can update own blocks" ON vineyard_blocks;
DROP POLICY IF EXISTS "Users can delete own blocks" ON vineyard_blocks;

CREATE POLICY "Users can view own blocks" ON vineyard_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own blocks" ON vineyard_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own blocks" ON vineyard_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own blocks" ON vineyard_blocks FOR DELETE USING (auth.uid() = user_id);

-- Inventory Items
DROP POLICY IF EXISTS "Users can view own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can insert own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can update own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete own inventory" ON inventory_items;

CREATE POLICY "Users can view own inventory" ON inventory_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON inventory_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON inventory_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON inventory_items FOR DELETE USING (auth.uid() = user_id);

-- Inventory Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON inventory_transactions;

CREATE POLICY "Users can view own transactions" ON inventory_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON inventory_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Spray Applications
DROP POLICY IF EXISTS "Users can view own sprays" ON spray_applications;
DROP POLICY IF EXISTS "Users can insert own sprays" ON spray_applications;
DROP POLICY IF EXISTS "Users can update own sprays" ON spray_applications;
DROP POLICY IF EXISTS "Users can delete own sprays" ON spray_applications;

CREATE POLICY "Users can view own sprays" ON spray_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sprays" ON spray_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sprays" ON spray_applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sprays" ON spray_applications FOR DELETE USING (auth.uid() = user_id);

-- Spray Blocks
DROP POLICY IF EXISTS "Users can view spray blocks" ON spray_blocks;
DROP POLICY IF EXISTS "Users can insert spray blocks" ON spray_blocks;

CREATE POLICY "Users can view spray blocks" ON spray_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM spray_applications
      WHERE spray_applications.id = spray_blocks.spray_id
      AND spray_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert spray blocks" ON spray_blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM spray_applications
      WHERE spray_applications.id = spray_blocks.spray_id
      AND spray_applications.user_id = auth.uid()
    )
  );

-- Spray Mix Lines
DROP POLICY IF EXISTS "Users can view spray mix lines" ON spray_mix_lines;
DROP POLICY IF EXISTS "Users can insert spray mix lines" ON spray_mix_lines;

CREATE POLICY "Users can view spray mix lines" ON spray_mix_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM spray_applications
      WHERE spray_applications.id = spray_mix_lines.spray_id
      AND spray_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert spray mix lines" ON spray_mix_lines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM spray_applications
      WHERE spray_applications.id = spray_mix_lines.spray_id
      AND spray_applications.user_id = auth.uid()
    )
  );

-- PHI Locks
DROP POLICY IF EXISTS "Users can view own phi locks" ON phi_locks;
DROP POLICY IF EXISTS "Users can insert own phi locks" ON phi_locks;
DROP POLICY IF EXISTS "Users can update own phi locks" ON phi_locks;

CREATE POLICY "Users can view own phi locks" ON phi_locks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own phi locks" ON phi_locks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own phi locks" ON phi_locks FOR UPDATE USING (auth.uid() = user_id);

-- REI Locks
DROP POLICY IF EXISTS "Users can view own rei locks" ON rei_locks;
DROP POLICY IF EXISTS "Users can insert own rei locks" ON rei_locks;
DROP POLICY IF EXISTS "Users can update own rei locks" ON rei_locks;

CREATE POLICY "Users can view own rei locks" ON rei_locks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rei locks" ON rei_locks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rei locks" ON rei_locks FOR UPDATE USING (auth.uid() = user_id);

-- Compliance Warnings
DROP POLICY IF EXISTS "Users can view compliance warnings" ON compliance_warnings;
DROP POLICY IF EXISTS "Users can insert compliance warnings" ON compliance_warnings;

CREATE POLICY "Users can view compliance warnings" ON compliance_warnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert compliance warnings" ON compliance_warnings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS update_seasons_updated_at ON seasons;
CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vineyard_blocks_updated_at ON vineyard_blocks;
CREATE TRIGGER update_vineyard_blocks_updated_at BEFORE UPDATE ON vineyard_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_spray_applications_updated_at ON spray_applications;
CREATE TRIGGER update_spray_applications_updated_at BEFORE UPDATE ON spray_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_phi_locks_updated_at ON phi_locks;
CREATE TRIGGER update_phi_locks_updated_at BEFORE UPDATE ON phi_locks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
