-- Labor Time Entries Table
CREATE TABLE IF NOT EXISTS labor_time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  break_minutes INTEGER DEFAULT 30,
  block_id UUID REFERENCES vineyard_blocks(id) ON DELETE SET NULL,
  task TEXT,
  pieces DECIMAL(10, 2),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES organization_members(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labor Certifications Table
CREATE TABLE IF NOT EXISTS labor_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  certification_type TEXT,
  cert_number TEXT,
  issued_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS labor_time_entries_user_id_idx ON labor_time_entries(user_id);
CREATE INDEX IF NOT EXISTS labor_time_entries_member_id_idx ON labor_time_entries(member_id);
CREATE INDEX IF NOT EXISTS labor_time_entries_date_idx ON labor_time_entries(date);
CREATE INDEX IF NOT EXISTS labor_time_entries_status_idx ON labor_time_entries(status);
CREATE INDEX IF NOT EXISTS labor_time_entries_block_id_idx ON labor_time_entries(block_id);

CREATE INDEX IF NOT EXISTS labor_certifications_user_id_idx ON labor_certifications(user_id);
CREATE INDEX IF NOT EXISTS labor_certifications_member_id_idx ON labor_certifications(member_id);
CREATE INDEX IF NOT EXISTS labor_certifications_expiry_date_idx ON labor_certifications(expiry_date);

-- RLS Policies
ALTER TABLE labor_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_certifications ENABLE ROW LEVEL SECURITY;

-- Time entries policies
CREATE POLICY "Users can view their own time entries"
  ON labor_time_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time entries"
  ON labor_time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time entries"
  ON labor_time_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time entries"
  ON labor_time_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Certifications policies
CREATE POLICY "Users can view their own certifications"
  ON labor_certifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certifications"
  ON labor_certifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certifications"
  ON labor_certifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certifications"
  ON labor_certifications FOR DELETE
  USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_labor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER labor_time_entries_updated_at
  BEFORE UPDATE ON labor_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_labor_updated_at();

CREATE TRIGGER labor_certifications_updated_at
  BEFORE UPDATE ON labor_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_labor_updated_at();
