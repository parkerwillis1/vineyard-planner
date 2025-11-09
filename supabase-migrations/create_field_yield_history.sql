-- Create field_yield_history table to track harvest data per field per year
CREATE TABLE IF NOT EXISTS field_yield_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,

  -- Year and date
  harvest_year INTEGER NOT NULL,
  harvest_date DATE,

  -- Yield metrics
  tons_harvested NUMERIC(10, 2),
  tons_per_acre NUMERIC(10, 2),

  -- Quality metrics
  brix NUMERIC(5, 2),
  ph NUMERIC(4, 2),
  ta NUMERIC(5, 2),
  cluster_count INTEGER,
  berry_weight_g NUMERIC(6, 2),
  quality_grade TEXT,

  -- Sales/destination
  destination TEXT,
  buyer_name TEXT,
  price_per_ton NUMERIC(10, 2),

  -- Additional info
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(field_id, harvest_year)
);

-- Create index for faster queries
CREATE INDEX idx_field_yield_history_field_id ON field_yield_history(field_id);
CREATE INDEX idx_field_yield_history_user_id ON field_yield_history(user_id);
CREATE INDEX idx_field_yield_history_year ON field_yield_history(harvest_year);

-- Enable RLS
ALTER TABLE field_yield_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own yield history"
  ON field_yield_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own yield history"
  ON field_yield_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own yield history"
  ON field_yield_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own yield history"
  ON field_yield_history FOR DELETE
  USING (auth.uid() = user_id);
