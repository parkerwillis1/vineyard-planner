-- =====================================================
-- VINEYARD BLOCKS TABLE
-- =====================================================

-- Drop the table if it exists (to ensure clean schema)
DROP TABLE IF EXISTS vineyard_blocks CASCADE;

-- Create vineyard_blocks with full viticulture schema
CREATE TABLE vineyard_blocks (
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

  -- Additional fields from original schema
  elevation_ft NUMERIC,
  soil_type TEXT,
  aspect TEXT,
  slope_percent NUMERIC,
  geom JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_vineyard_blocks_user_id ON vineyard_blocks(user_id);
CREATE INDEX idx_vineyard_blocks_season_id ON vineyard_blocks(season_id);
CREATE INDEX idx_vineyard_blocks_status ON vineyard_blocks(status);

-- Enable RLS
ALTER TABLE vineyard_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own blocks" ON vineyard_blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blocks" ON vineyard_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blocks" ON vineyard_blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blocks" ON vineyard_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_vineyard_blocks_updated_at
  BEFORE UPDATE ON vineyard_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
