-- =====================================================
-- FIELD ENHANCEMENTS: SOIL DATA, PHOTOS, YIELD HISTORY, CUSTOM FIELDS
-- =====================================================

-- Add enhanced soil data columns to vineyard_blocks
ALTER TABLE vineyard_blocks
ADD COLUMN IF NOT EXISTS soil_ph NUMERIC,
ADD COLUMN IF NOT EXISTS soil_texture TEXT,
ADD COLUMN IF NOT EXISTS soil_drainage TEXT CHECK (soil_drainage IN ('excellent', 'good', 'moderate', 'poor')),
ADD COLUMN IF NOT EXISTS soil_organic_matter_percent NUMERIC,
ADD COLUMN IF NOT EXISTS soil_notes TEXT;

-- Add custom fields as JSONB
ALTER TABLE vineyard_blocks
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Comments for documentation
COMMENT ON COLUMN vineyard_blocks.soil_ph IS 'Soil pH level (typically 3.0-9.0 for vineyards)';
COMMENT ON COLUMN vineyard_blocks.soil_texture IS 'Soil texture classification (e.g., loam, clay, sandy)';
COMMENT ON COLUMN vineyard_blocks.soil_drainage IS 'Soil drainage quality';
COMMENT ON COLUMN vineyard_blocks.soil_organic_matter_percent IS 'Percentage of organic matter in soil';
COMMENT ON COLUMN vineyard_blocks.custom_fields IS 'User-defined custom fields as JSON key-value pairs';

-- =====================================================
-- FIELD ATTACHMENTS TABLE (for photos and documents)
-- =====================================================

CREATE TABLE IF NOT EXISTS field_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'photo', 'document', 'video'
  file_size_bytes INTEGER,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  mime_type TEXT,

  -- Metadata
  title TEXT,
  description TEXT,
  tags TEXT[], -- Array of tags for categorization
  capture_date DATE, -- When photo was taken (may differ from upload date)

  -- Photo-specific fields
  latitude NUMERIC,
  longitude NUMERIC,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_field_attachments_field_id ON field_attachments(field_id);
CREATE INDEX idx_field_attachments_user_id ON field_attachments(user_id);
CREATE INDEX idx_field_attachments_file_type ON field_attachments(file_type);
CREATE INDEX idx_field_attachments_tags ON field_attachments USING GIN (tags);

-- RLS Policies
ALTER TABLE field_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own field attachments" ON field_attachments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own field attachments" ON field_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own field attachments" ON field_attachments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own field attachments" ON field_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_field_attachments_updated_at
  BEFORE UPDATE ON field_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- YIELD HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS field_yield_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,

  -- Harvest info
  harvest_year INTEGER NOT NULL,
  harvest_date DATE,

  -- Yield data
  tons_harvested NUMERIC,
  tons_per_acre NUMERIC,
  brix NUMERIC, -- Sugar content
  ph NUMERIC, -- Juice pH
  ta NUMERIC, -- Titratable acidity

  -- Quality metrics
  cluster_count INTEGER,
  berry_weight_g NUMERIC,
  quality_grade TEXT, -- 'excellent', 'good', 'fair', 'poor'

  -- Destination
  destination TEXT, -- 'winery', 'sold', 'discarded'
  buyer_name TEXT,
  price_per_ton NUMERIC,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_field_yield_history_field_id ON field_yield_history(field_id);
CREATE INDEX idx_field_yield_history_user_id ON field_yield_history(user_id);
CREATE INDEX idx_field_yield_history_season_id ON field_yield_history(season_id);
CREATE INDEX idx_field_yield_history_harvest_year ON field_yield_history(harvest_year);

-- RLS Policies
ALTER TABLE field_yield_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own yield history" ON field_yield_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own yield history" ON field_yield_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own yield history" ON field_yield_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own yield history" ON field_yield_history
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_field_yield_history_updated_at
  BEFORE UPDATE ON field_yield_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE field_attachments IS 'Photos, documents, and videos attached to vineyard fields';
COMMENT ON TABLE field_yield_history IS 'Historical harvest and yield data for vineyard fields';
COMMENT ON COLUMN field_yield_history.brix IS 'Sugar content measurement (°Brix)';
COMMENT ON COLUMN field_yield_history.ta IS 'Titratable acidity (g/L)';
