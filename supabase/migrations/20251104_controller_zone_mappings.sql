-- Controller Zone to Block Mappings
-- Maps irrigation controller zones/relays to vineyard blocks

CREATE TABLE IF NOT EXISTS controller_zone_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  controller_id UUID REFERENCES irrigation_controllers(id) ON DELETE CASCADE NOT NULL,

  -- Zone identification from controller
  zone_id_external VARCHAR(100) NOT NULL, -- Zone/relay ID from controller system
  zone_name VARCHAR(100), -- Friendly name (e.g., "North Block Drip Zone 1")

  -- Mapping to vineyard block
  block_id UUID NOT NULL, -- References vineyard_blocks(id)

  -- Zone characteristics
  flow_rate_gpm INTEGER, -- If known, flow rate for this zone
  coverage_acres DECIMAL(8,3), -- How many acres this zone covers

  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one zone can only map to one block per controller
  UNIQUE(controller_id, zone_id_external)
);

-- Add indexes
CREATE INDEX idx_controller_zone_mappings_user_id ON controller_zone_mappings(user_id);
CREATE INDEX idx_controller_zone_mappings_controller_id ON controller_zone_mappings(controller_id);
CREATE INDEX idx_controller_zone_mappings_block_id ON controller_zone_mappings(block_id);
CREATE INDEX idx_controller_zone_mappings_zone_external ON controller_zone_mappings(zone_id_external);

-- Enable Row Level Security
ALTER TABLE controller_zone_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own zone mappings"
  ON controller_zone_mappings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own zone mappings"
  ON controller_zone_mappings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own zone mappings"
  ON controller_zone_mappings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own zone mappings"
  ON controller_zone_mappings FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_controller_zone_mappings_updated_at
  BEFORE UPDATE ON controller_zone_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE controller_zone_mappings IS 'Maps irrigation controller zones/relays to vineyard blocks';
COMMENT ON COLUMN controller_zone_mappings.zone_id_external IS 'Zone/relay ID from the irrigation controller system';
COMMENT ON COLUMN controller_zone_mappings.block_id IS 'Vineyard block ID this zone irrigates';
