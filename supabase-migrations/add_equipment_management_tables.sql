-- Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT, -- Tractor, Sprayer, Harvester, etc.
  manufacturer TEXT,
  model TEXT,
  year INTEGER,
  serial_number TEXT,
  vin TEXT,
  purchase_price DECIMAL(10, 2),
  purchase_date DATE,
  current_hours DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'repair', 'retired', 'sold')),
  location TEXT,
  insurance_policy TEXT,
  insurance_expiry DATE,
  registration_number TEXT,
  registration_expiry DATE,
  notes TEXT,
  photo_url TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Maintenance Records Table
CREATE TABLE IF NOT EXISTS equipment_maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL, -- Oil Change, Filter Replacement, Inspection, Repair, etc.
  service_date DATE NOT NULL,
  hours_at_service DECIMAL(10, 2),
  performed_by TEXT,
  cost DECIMAL(10, 2),
  parts_replaced TEXT[],
  description TEXT,
  notes TEXT,
  next_service_date DATE,
  next_service_hours DECIMAL(10, 2),
  attachments TEXT[], -- URLs to receipts/photos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Maintenance Schedules Table
CREATE TABLE IF NOT EXISTS equipment_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('hours', 'days', 'months', 'years')),
  frequency_value INTEGER NOT NULL, -- e.g., 50 hours, 30 days, 6 months
  last_service_date DATE,
  last_service_hours DECIMAL(10, 2),
  next_due_date DATE,
  next_due_hours DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 7,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Usage Logs Table
CREATE TABLE IF NOT EXISTS equipment_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  operator_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
  start_hours DECIMAL(10, 2),
  end_hours DECIMAL(10, 2),
  hours_used DECIMAL(10, 2),
  block_id UUID REFERENCES vineyard_blocks(id) ON DELETE SET NULL,
  task TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Fuel Logs Table
CREATE TABLE IF NOT EXISTS equipment_fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  fill_date DATE NOT NULL,
  fill_time TIME,
  gallons DECIMAL(10, 2) NOT NULL,
  cost_per_gallon DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  odometer_hours DECIMAL(10, 2),
  fuel_type TEXT, -- Diesel, Gasoline, Propane, Electric
  filled_by TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Expenses Table
CREATE TABLE IF NOT EXISTS equipment_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  expense_type TEXT NOT NULL, -- Maintenance, Repair, Fuel, Insurance, Registration, Parts, Other
  category TEXT, -- More specific categorization
  amount DECIMAL(10, 2) NOT NULL,
  vendor TEXT,
  description TEXT,
  maintenance_record_id UUID REFERENCES equipment_maintenance_records(id) ON DELETE SET NULL,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Attachments/Implements Table
CREATE TABLE IF NOT EXISTS equipment_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL, -- What it attaches to
  name TEXT NOT NULL,
  type TEXT, -- Plow, Mower Deck, Sprayer Boom, etc.
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_price DECIMAL(10, 2),
  purchase_date DATE,
  status TEXT DEFAULT 'operational',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS equipment_user_id_idx ON equipment(user_id);
CREATE INDEX IF NOT EXISTS equipment_status_idx ON equipment(status);
CREATE INDEX IF NOT EXISTS equipment_type_idx ON equipment(type);

CREATE INDEX IF NOT EXISTS equipment_maintenance_records_equipment_id_idx ON equipment_maintenance_records(equipment_id);
CREATE INDEX IF NOT EXISTS equipment_maintenance_records_user_id_idx ON equipment_maintenance_records(user_id);
CREATE INDEX IF NOT EXISTS equipment_maintenance_records_service_date_idx ON equipment_maintenance_records(service_date);

CREATE INDEX IF NOT EXISTS equipment_maintenance_schedules_equipment_id_idx ON equipment_maintenance_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS equipment_maintenance_schedules_next_due_date_idx ON equipment_maintenance_schedules(next_due_date);

CREATE INDEX IF NOT EXISTS equipment_usage_logs_equipment_id_idx ON equipment_usage_logs(equipment_id);
CREATE INDEX IF NOT EXISTS equipment_usage_logs_usage_date_idx ON equipment_usage_logs(usage_date);

CREATE INDEX IF NOT EXISTS equipment_fuel_logs_equipment_id_idx ON equipment_fuel_logs(equipment_id);
CREATE INDEX IF NOT EXISTS equipment_fuel_logs_fill_date_idx ON equipment_fuel_logs(fill_date);

CREATE INDEX IF NOT EXISTS equipment_expenses_equipment_id_idx ON equipment_expenses(equipment_id);
CREATE INDEX IF NOT EXISTS equipment_expenses_expense_date_idx ON equipment_expenses(expense_date);
CREATE INDEX IF NOT EXISTS equipment_expenses_expense_type_idx ON equipment_expenses(expense_type);

-- RLS Policies
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_attachments ENABLE ROW LEVEL SECURITY;

-- Equipment policies
CREATE POLICY "Users can view their own equipment"
  ON equipment FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own equipment"
  ON equipment FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment"
  ON equipment FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own equipment"
  ON equipment FOR DELETE
  USING (auth.uid() = user_id);

-- Maintenance records policies
CREATE POLICY "Users can view their own maintenance records"
  ON equipment_maintenance_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own maintenance records"
  ON equipment_maintenance_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenance records"
  ON equipment_maintenance_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenance records"
  ON equipment_maintenance_records FOR DELETE
  USING (auth.uid() = user_id);

-- Maintenance schedules policies
CREATE POLICY "Users can view their own maintenance schedules"
  ON equipment_maintenance_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own maintenance schedules"
  ON equipment_maintenance_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenance schedules"
  ON equipment_maintenance_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenance schedules"
  ON equipment_maintenance_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view their own usage logs"
  ON equipment_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs"
  ON equipment_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage logs"
  ON equipment_usage_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own usage logs"
  ON equipment_usage_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Fuel logs policies
CREATE POLICY "Users can view their own fuel logs"
  ON equipment_fuel_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fuel logs"
  ON equipment_fuel_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fuel logs"
  ON equipment_fuel_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fuel logs"
  ON equipment_fuel_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can view their own expenses"
  ON equipment_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON equipment_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON equipment_expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON equipment_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Attachments policies
CREATE POLICY "Users can view their own attachments"
  ON equipment_attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attachments"
  ON equipment_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attachments"
  ON equipment_attachments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments"
  ON equipment_attachments FOR DELETE
  USING (auth.uid() = user_id);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_equipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_updated_at();

CREATE TRIGGER equipment_maintenance_records_updated_at
  BEFORE UPDATE ON equipment_maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_updated_at();

CREATE TRIGGER equipment_maintenance_schedules_updated_at
  BEFORE UPDATE ON equipment_maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_updated_at();

CREATE TRIGGER equipment_usage_logs_updated_at
  BEFORE UPDATE ON equipment_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_updated_at();

CREATE TRIGGER equipment_fuel_logs_updated_at
  BEFORE UPDATE ON equipment_fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_updated_at();

CREATE TRIGGER equipment_expenses_updated_at
  BEFORE UPDATE ON equipment_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_updated_at();

CREATE TRIGGER equipment_attachments_updated_at
  BEFORE UPDATE ON equipment_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_updated_at();
