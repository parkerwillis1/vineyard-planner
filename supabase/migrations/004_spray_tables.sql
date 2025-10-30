-- =====================================================
-- SPRAY APPLICATION TABLES
-- =====================================================

-- SPRAY APPLICATIONS
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

CREATE INDEX idx_spray_applications_user_id ON spray_applications(user_id);
CREATE INDEX idx_spray_applications_season_id ON spray_applications(season_id);
CREATE INDEX idx_spray_applications_date ON spray_applications(application_date);
CREATE INDEX idx_spray_applications_status ON spray_applications(status);

-- SPRAY BLOCKS (Many-to-Many)
CREATE TABLE IF NOT EXISTS spray_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spray_id UUID NOT NULL REFERENCES spray_applications(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  acres_treated NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(spray_id, block_id)
);

CREATE INDEX idx_spray_blocks_spray_id ON spray_blocks(spray_id);
CREATE INDEX idx_spray_blocks_block_id ON spray_blocks(block_id);

-- SPRAY MIX LINES
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

CREATE INDEX idx_spray_mix_lines_spray_id ON spray_mix_lines(spray_id);
CREATE INDEX idx_spray_mix_lines_item_id ON spray_mix_lines(item_id);

-- PHI LOCKS
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

CREATE INDEX idx_phi_locks_user_id ON phi_locks(user_id);
CREATE INDEX idx_phi_locks_block_id ON phi_locks(block_id);
CREATE INDEX idx_phi_locks_release_date ON phi_locks(phi_release_date);
CREATE INDEX idx_phi_locks_is_active ON phi_locks(is_active);

-- REI LOCKS
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

CREATE INDEX idx_rei_locks_user_id ON rei_locks(user_id);
CREATE INDEX idx_rei_locks_block_id ON rei_locks(block_id);
CREATE INDEX idx_rei_locks_release_datetime ON rei_locks(rei_release_datetime);
CREATE INDEX idx_rei_locks_is_active ON rei_locks(is_active);

-- COMPLIANCE WARNINGS
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

CREATE INDEX idx_compliance_warnings_user_id ON compliance_warnings(user_id);
CREATE INDEX idx_compliance_warnings_spray_id ON compliance_warnings(spray_id);
CREATE INDEX idx_compliance_warnings_severity ON compliance_warnings(severity);

-- Enable RLS
ALTER TABLE spray_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_mix_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE phi_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rei_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_warnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sprays" ON spray_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sprays" ON spray_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sprays" ON spray_applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sprays" ON spray_applications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own phi locks" ON phi_locks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own phi locks" ON phi_locks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own phi locks" ON phi_locks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own rei locks" ON rei_locks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rei locks" ON rei_locks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rei locks" ON rei_locks FOR UPDATE USING (auth.uid() = user_id);

-- Add RLS for spray_blocks (child table needs policies)
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

-- Add RLS for spray_mix_lines (child table needs policies)
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

CREATE POLICY "Users can view compliance warnings" ON compliance_warnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert compliance warnings" ON compliance_warnings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_spray_applications_updated_at
  BEFORE UPDATE ON spray_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
