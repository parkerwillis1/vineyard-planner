-- Production Containers Table
-- Tracks tanks, barrels, totes, and other vessels
CREATE TABLE IF NOT EXISTS production_containers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tank', 'barrel', 'tote', 'ibc', 'bin', 'other')),
  material TEXT CHECK (material IN ('stainless', 'oak_french', 'oak_american', 'oak_hungarian', 'concrete', 'plastic', 'other')),
  capacity_gallons DECIMAL(10, 2) NOT NULL,
  current_volume_gallons DECIMAL(10, 2) DEFAULT 0,
  location TEXT,
  status TEXT DEFAULT 'empty' CHECK (status IN ('empty', 'in_use', 'cleaning', 'needs_repair', 'retired')),

  -- Barrel-specific fields
  cooperage TEXT,
  toast_level TEXT,
  purchase_date DATE,
  total_fills INTEGER DEFAULT 0,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production Lots Table
-- Tracks wine lots from crush through bottling
CREATE TABLE IF NOT EXISTS production_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vintage INTEGER NOT NULL,
  varietal TEXT NOT NULL,
  appellation TEXT,

  -- Link to vineyard block if applicable
  block_id UUID REFERENCES vineyard_blocks(id) ON DELETE SET NULL,

  -- Harvest/crush data
  harvest_date DATE,
  initial_weight_lbs DECIMAL(10, 2),
  initial_brix DECIMAL(5, 2),
  initial_ph DECIMAL(4, 2),
  initial_ta DECIMAL(5, 2),

  -- Current state
  current_volume_gallons DECIMAL(10, 2),
  current_brix DECIMAL(5, 2),
  current_ph DECIMAL(4, 2),
  current_ta DECIMAL(5, 2),
  current_temp_f DECIMAL(5, 1),
  current_alcohol_pct DECIMAL(4, 2),

  -- Container assignment
  container_id UUID REFERENCES production_containers(id) ON DELETE SET NULL,

  -- Lot lifecycle
  status TEXT DEFAULT 'planning' CHECK (status IN (
    'planning', 'harvested', 'crushing', 'fermenting', 'pressed',
    'aging', 'blending', 'filtering', 'bottled', 'archived'
  )),

  -- Lot lineage (for splits and blends)
  parent_lot_id UUID REFERENCES production_lots(id) ON DELETE SET NULL,
  is_blend BOOLEAN DEFAULT FALSE,

  notes TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fermentation Logs Table
-- Daily monitoring and cellar work tracking
CREATE TABLE IF NOT EXISTS fermentation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
  log_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Chemistry readings
  brix DECIMAL(5, 2),
  temp_f DECIMAL(5, 1),
  ph DECIMAL(4, 2),
  ta DECIMAL(5, 2),
  free_so2 DECIMAL(6, 2),
  total_so2 DECIMAL(6, 2),
  va DECIMAL(5, 3),

  -- Cellar work performed
  work_performed TEXT[], -- array of: punchdown, pumpover, rack, add_nutrient, add_so2, etc.

  -- Additions tracking
  addition_type TEXT,
  addition_name TEXT,
  addition_amount DECIMAL(10, 3),
  addition_unit TEXT,

  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blend Components Table
-- Tracks which lots went into a blend
CREATE TABLE IF NOT EXISTS blend_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blend_lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
  component_lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
  volume_gallons DECIMAL(10, 2) NOT NULL,
  percentage DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS production_containers_user_id_idx ON production_containers(user_id);
CREATE INDEX IF NOT EXISTS production_containers_type_idx ON production_containers(type);
CREATE INDEX IF NOT EXISTS production_containers_status_idx ON production_containers(status);

CREATE INDEX IF NOT EXISTS production_lots_user_id_idx ON production_lots(user_id);
CREATE INDEX IF NOT EXISTS production_lots_vintage_idx ON production_lots(vintage);
CREATE INDEX IF NOT EXISTS production_lots_status_idx ON production_lots(status);
CREATE INDEX IF NOT EXISTS production_lots_container_id_idx ON production_lots(container_id);
CREATE INDEX IF NOT EXISTS production_lots_block_id_idx ON production_lots(block_id);

CREATE INDEX IF NOT EXISTS fermentation_logs_user_id_idx ON fermentation_logs(user_id);
CREATE INDEX IF NOT EXISTS fermentation_logs_lot_id_idx ON fermentation_logs(lot_id);
CREATE INDEX IF NOT EXISTS fermentation_logs_log_date_idx ON fermentation_logs(log_date);

CREATE INDEX IF NOT EXISTS blend_components_blend_lot_id_idx ON blend_components(blend_lot_id);
CREATE INDEX IF NOT EXISTS blend_components_component_lot_id_idx ON blend_components(component_lot_id);

-- Enable RLS
ALTER TABLE production_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE fermentation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blend_components ENABLE ROW LEVEL SECURITY;

-- RLS Policies for production_containers
CREATE POLICY "Users can view their own containers"
  ON production_containers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own containers"
  ON production_containers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own containers"
  ON production_containers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own containers"
  ON production_containers FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for production_lots
CREATE POLICY "Users can view their own lots"
  ON production_lots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lots"
  ON production_lots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lots"
  ON production_lots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lots"
  ON production_lots FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for fermentation_logs
CREATE POLICY "Users can view their own fermentation logs"
  ON fermentation_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fermentation logs"
  ON fermentation_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fermentation logs"
  ON fermentation_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fermentation logs"
  ON fermentation_logs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for blend_components
CREATE POLICY "Users can view blend components for their lots"
  ON blend_components FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM production_lots
      WHERE id = blend_components.blend_lot_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert blend components for their lots"
  ON blend_components FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM production_lots
      WHERE id = blend_lot_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update blend components for their lots"
  ON blend_components FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM production_lots
      WHERE id = blend_lot_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete blend components for their lots"
  ON blend_components FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM production_lots
      WHERE id = blend_lot_id
      AND user_id = auth.uid()
    )
  );

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_production_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER production_containers_updated_at
  BEFORE UPDATE ON production_containers
  FOR EACH ROW
  EXECUTE FUNCTION update_production_updated_at();

CREATE TRIGGER production_lots_updated_at
  BEFORE UPDATE ON production_lots
  FOR EACH ROW
  EXECUTE FUNCTION update_production_updated_at();
