-- =====================================================
-- VINEYARD OPERATIONS - COMPLETE SCHEMA
-- Phase 1: Foundation & Data Model
-- Phase 2: Spray Compliance & Safety
-- =====================================================

-- =====================================================
-- SEASONS
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

CREATE INDEX idx_seasons_user_id ON seasons(user_id);
CREATE INDEX idx_seasons_is_active ON seasons(is_active);

-- =====================================================
-- ENHANCED BLOCKS
-- =====================================================
CREATE TABLE IF NOT EXISTS vineyard_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  variety TEXT,
  rootstock TEXT,
  acres NUMERIC,
  vines INTEGER,
  row_spacing_ft NUMERIC,
  vine_spacing_ft NUMERIC,
  trellis TEXT,
  irrigation_zone_id UUID,
  elevation_ft NUMERIC,
  soil_type TEXT,
  aspect TEXT, -- N, NE, E, SE, S, SW, W, NW
  slope_percent NUMERIC,
  planting_date DATE,
  geom JSONB, -- GeoJSON geometry
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vineyard_blocks_user_id ON vineyard_blocks(user_id);
CREATE INDEX idx_vineyard_blocks_season_id ON vineyard_blocks(season_id);

-- =====================================================
-- SENSORS
-- =====================================================
CREATE TABLE IF NOT EXISTS sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  sensor_type TEXT NOT NULL, -- soil_moisture, temp, leaf_wetness, etc.
  device_sn TEXT,
  install_date DATE,
  status TEXT DEFAULT 'active', -- active, inactive, maintenance
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sensors_user_id ON sensors(user_id);
CREATE INDEX idx_sensors_block_id ON sensors(block_id);

-- =====================================================
-- WEATHER READINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS weather_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  temp_c NUMERIC,
  temp_f NUMERIC,
  humidity_pct NUMERIC,
  wind_mps NUMERIC,
  wind_mph NUMERIC,
  wind_direction TEXT,
  rain_mm NUMERIC,
  rain_inches NUMERIC,
  pressure_mb NUMERIC,
  solar_radiation NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_weather_readings_user_id ON weather_readings(user_id);
CREATE INDEX idx_weather_readings_timestamp ON weather_readings(timestamp);

-- =====================================================
-- GROWING DEGREE DAYS (GDD)
-- =====================================================
CREATE TABLE IF NOT EXISTS gdd_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  base_temp_c NUMERIC DEFAULT 10,
  base_temp_f NUMERIC DEFAULT 50,
  gdd_value NUMERIC NOT NULL,
  cumulative_gdd NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, season_id, date)
);

CREATE INDEX idx_gdd_records_user_id ON gdd_records(user_id);
CREATE INDEX idx_gdd_records_season_id ON gdd_records(season_id);
CREATE INDEX idx_gdd_records_date ON gdd_records(date);

-- =====================================================
-- INVENTORY ITEMS (Chemicals, Fertilizers, Supplies)
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('chemical', 'fertilizer', 'fuel', 'ppe', 'supplies', 'misc')),
  name TEXT NOT NULL,
  manufacturer TEXT,
  product_code TEXT,
  unit TEXT NOT NULL, -- gal, L, lb, kg, oz, ea
  on_hand_qty NUMERIC DEFAULT 0,
  min_qty NUMERIC DEFAULT 0,
  max_qty NUMERIC,
  unit_cost NUMERIC,
  lot_number TEXT,
  expires_on DATE,
  -- Chemical-specific fields
  epa_reg_no TEXT,
  frac_code TEXT, -- Fungicide Resistance Action Committee code
  hrac_code TEXT, -- Herbicide Resistance Action Committee code
  irac_code TEXT, -- Insecticide Resistance Action Committee code
  rei_hours INTEGER, -- Re-Entry Interval in hours
  phi_days INTEGER, -- Pre-Harvest Interval in days
  active_ingredient TEXT,
  concentration TEXT,
  signal_word TEXT, -- CAUTION, WARNING, DANGER
  -- Storage & safety
  storage_location TEXT,
  sds_url TEXT, -- Safety Data Sheet URL
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_on_hand_qty ON inventory_items(on_hand_qty);

-- =====================================================
-- INVENTORY TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receive', 'use', 'adjust', 'waste', 'return')),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  reference_type TEXT, -- spray, task, harvest, purchase_order
  reference_id UUID,
  lot_number TEXT,
  notes TEXT,
  transaction_date TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inventory_transactions_user_id ON inventory_transactions(user_id);
CREATE INDEX idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_date ON inventory_transactions(transaction_date);

-- =====================================================
-- SPRAYS (Enhanced for Compliance)
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
  inversion_risk TEXT, -- none, low, moderate, high
  -- Application details
  equipment_id UUID,
  nozzle_type TEXT,
  nozzle_size TEXT,
  pressure_psi NUMERIC,
  gpa NUMERIC, -- Gallons per acre
  total_tank_gal NUMERIC,
  treated_acres NUMERIC,
  spray_method TEXT, -- airblast, boom, handgun, backpack
  -- Compliance
  target_pest TEXT,
  growth_stage TEXT,
  buffer_zones_respected BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'locked')),
  -- Documentation
  notes TEXT,
  photos JSONB, -- Array of photo URLs
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

-- =====================================================
-- SPRAY BLOCKS (Many-to-Many: Sprays to Blocks)
-- =====================================================
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

-- =====================================================
-- SPRAY MIX LINES (Tank Mix Components)
-- =====================================================
CREATE TABLE IF NOT EXISTS spray_mix_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spray_id UUID NOT NULL REFERENCES spray_applications(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  rate_per_acre NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  total_quantity NUMERIC NOT NULL,
  total_cost NUMERIC,
  purpose TEXT, -- fungicide, insecticide, herbicide, adjuvant, fertilizer
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_spray_mix_lines_spray_id ON spray_mix_lines(spray_id);
CREATE INDEX idx_spray_mix_lines_item_id ON spray_mix_lines(item_id);

-- =====================================================
-- PHI LOCKS (Pre-Harvest Interval Enforcement)
-- =====================================================
CREATE TABLE IF NOT EXISTS phi_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  spray_id UUID NOT NULL REFERENCES spray_applications(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  phi_days INTEGER NOT NULL,
  application_date DATE NOT NULL,
  phi_release_date DATE NOT NULL, -- Calculated: application_date + phi_days
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

-- =====================================================
-- REI LOCKS (Re-Entry Interval Enforcement)
-- =====================================================
CREATE TABLE IF NOT EXISTS rei_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  spray_id UUID NOT NULL REFERENCES spray_applications(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  rei_hours INTEGER NOT NULL,
  application_datetime TIMESTAMPTZ NOT NULL,
  rei_release_datetime TIMESTAMPTZ NOT NULL, -- Calculated: application_datetime + rei_hours
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

-- =====================================================
-- COMPLIANCE WARNINGS (Pre-check results)
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spray_id UUID REFERENCES spray_applications(id) ON DELETE CASCADE,
  warning_type TEXT NOT NULL, -- phi_conflict, frac_rotation, weather_risk, rei_active, buffer_zone
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

-- =====================================================
-- ENHANCED TASKS
-- =====================================================
CREATE TABLE IF NOT EXISTS vineyard_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  block_id UUID REFERENCES vineyard_blocks(id) ON DELETE SET NULL,
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT, -- pruning, hedging, leaf_pull, spray_prep, irrigation, scouting, harvest_prep, maintenance
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  due_time TIME,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  recurrence_rule TEXT, -- RRULE format (e.g., FREQ=WEEKLY;BYDAY=MO)
  parent_task_id UUID REFERENCES vineyard_tasks(id),
  photos JSONB,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vineyard_tasks_user_id ON vineyard_tasks(user_id);
CREATE INDEX idx_vineyard_tasks_season_id ON vineyard_tasks(season_id);
CREATE INDEX idx_vineyard_tasks_block_id ON vineyard_tasks(block_id);
CREATE INDEX idx_vineyard_tasks_status ON vineyard_tasks(status);
CREATE INDEX idx_vineyard_tasks_due_date ON vineyard_tasks(due_date);
CREATE INDEX idx_vineyard_tasks_assigned_to ON vineyard_tasks(assigned_to);

-- =====================================================
-- TASK TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  task_type TEXT,
  estimated_hours NUMERIC,
  checklist_items JSONB, -- Array of checklist items
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_templates_user_id ON task_templates(user_id);

-- =====================================================
-- TASK CHECKLIST ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES vineyard_tasks(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_checklist_items_task_id ON task_checklist_items(task_id);

-- =====================================================
-- EQUIPMENT (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- tractor, sprayer, harvester, atv, irrigation, trailer, hand_tool, misc
  make TEXT,
  model TEXT,
  year INTEGER,
  serial_number TEXT,
  purchase_date DATE,
  purchase_price NUMERIC,
  current_value NUMERIC,
  depreciation_method TEXT,
  hourly_operating_cost NUMERIC,
  in_service BOOLEAN DEFAULT true,
  hours_meter_reading NUMERIC DEFAULT 0,
  last_service_date DATE,
  next_service_date DATE,
  service_interval_hours INTEGER,
  license_plate TEXT,
  vin TEXT,
  insurance_policy TEXT,
  insurance_expires DATE,
  notes TEXT,
  photos JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_equipment_user_id ON equipment(user_id);
CREATE INDEX idx_equipment_in_service ON equipment(in_service);

-- =====================================================
-- EQUIPMENT LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS equipment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  task_id UUID REFERENCES vineyard_tasks(id) ON DELETE SET NULL,
  block_id UUID REFERENCES vineyard_blocks(id) ON DELETE SET NULL,
  log_type TEXT NOT NULL, -- usage, maintenance, repair, inspection, fuel
  log_date DATE NOT NULL,
  hours_used NUMERIC,
  hours_meter_reading NUMERIC,
  fuel_quantity NUMERIC,
  fuel_cost NUMERIC,
  service_description TEXT,
  parts_cost NUMERIC,
  labor_cost NUMERIC,
  total_cost NUMERIC,
  performed_by TEXT,
  notes TEXT,
  photos JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_equipment_logs_user_id ON equipment_logs(user_id);
CREATE INDEX idx_equipment_logs_equipment_id ON equipment_logs(equipment_id);
CREATE INDEX idx_equipment_logs_date ON equipment_logs(log_date);

-- =====================================================
-- WORKERS (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id), -- If worker has login access
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT, -- manager, operator, field_worker, harvest_crew, seasonal
  phone TEXT,
  email TEXT,
  hourly_rate NUMERIC,
  piece_rate NUMERIC,
  employment_type TEXT, -- full_time, part_time, seasonal, contractor
  hire_date DATE,
  termination_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'seasonal_inactive', 'terminated')),
  certifications JSONB, -- Array of certifications (pesticide applicator, forklift, etc.)
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workers_user_id ON workers(user_id);
CREATE INDEX idx_workers_status ON workers(status);
CREATE INDEX idx_workers_auth_user_id ON workers(auth_user_id);

-- =====================================================
-- LABOR LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS labor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  task_id UUID REFERENCES vineyard_tasks(id) ON DELETE SET NULL,
  block_id UUID REFERENCES vineyard_blocks(id) ON DELETE SET NULL,
  log_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  hours_worked NUMERIC NOT NULL,
  rate_type TEXT DEFAULT 'hourly' CHECK (rate_type IN ('hourly', 'piece', 'salary')),
  hourly_rate NUMERIC,
  piece_rate NUMERIC,
  units_completed NUMERIC, -- For piece rate work
  total_cost NUMERIC,
  activity_description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_labor_logs_user_id ON labor_logs(user_id);
CREATE INDEX idx_labor_logs_worker_id ON labor_logs(worker_id);
CREATE INDEX idx_labor_logs_date ON labor_logs(log_date);
CREATE INDEX idx_labor_logs_task_id ON labor_logs(task_id);
CREATE INDEX idx_labor_logs_block_id ON labor_logs(block_id);

-- =====================================================
-- Enable Row Level Security on all tables
-- =====================================================
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vineyard_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdd_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_mix_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE phi_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rei_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vineyard_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies (User isolation)
-- =====================================================

-- Seasons
CREATE POLICY "Users can view own seasons" ON seasons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own seasons" ON seasons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own seasons" ON seasons FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own seasons" ON seasons FOR DELETE USING (auth.uid() = user_id);

-- Vineyard Blocks
CREATE POLICY "Users can view own blocks" ON vineyard_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own blocks" ON vineyard_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own blocks" ON vineyard_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own blocks" ON vineyard_blocks FOR DELETE USING (auth.uid() = user_id);

-- Inventory Items
CREATE POLICY "Users can view own inventory" ON inventory_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON inventory_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON inventory_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON inventory_items FOR DELETE USING (auth.uid() = user_id);

-- Spray Applications
CREATE POLICY "Users can view own sprays" ON spray_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sprays" ON spray_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sprays" ON spray_applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sprays" ON spray_applications FOR DELETE USING (auth.uid() = user_id);

-- PHI Locks
CREATE POLICY "Users can view own phi locks" ON phi_locks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own phi locks" ON phi_locks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own phi locks" ON phi_locks FOR UPDATE USING (auth.uid() = user_id);

-- REI Locks
CREATE POLICY "Users can view own rei locks" ON rei_locks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rei locks" ON rei_locks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rei locks" ON rei_locks FOR UPDATE USING (auth.uid() = user_id);

-- Workers
CREATE POLICY "Users can view own workers" ON workers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workers" ON workers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workers" ON workers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workers" ON workers FOR DELETE USING (auth.uid() = user_id);

-- Equipment
CREATE POLICY "Users can view own equipment" ON equipment FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own equipment" ON equipment FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own equipment" ON equipment FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own equipment" ON equipment FOR DELETE USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "Users can view own tasks" ON vineyard_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON vineyard_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON vineyard_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON vineyard_tasks FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Triggers for updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vineyard_blocks_updated_at BEFORE UPDATE ON vineyard_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spray_applications_updated_at BEFORE UPDATE ON spray_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vineyard_tasks_updated_at BEFORE UPDATE ON vineyard_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
