-- ================================================================
-- IRRIGATION HARDWARE INTEGRATION
-- Tables for connecting physical irrigation controllers/flow meters
-- ================================================================

-- Table: irrigation_devices
-- Stores registered irrigation hardware (controllers, flow meters, etc.)
CREATE TABLE IF NOT EXISTS irrigation_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Device identification
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'rain_bird', 'hunter', 'toro', 'flow_meter', 'custom'
  device_id TEXT NOT NULL, -- External device identifier (serial, MAC, etc.)

  -- Authentication
  api_key TEXT, -- For devices that need API keys
  webhook_token TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT, -- Unique token for webhook auth

  -- Configuration
  config JSONB DEFAULT '{}', -- Device-specific settings
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_sync_at TIMESTAMPTZ,

  -- Ensure unique device per user
  CONSTRAINT unique_device_per_user UNIQUE(user_id, device_id)
);

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_irrigation_devices_webhook_token
  ON irrigation_devices(webhook_token);

CREATE INDEX IF NOT EXISTS idx_irrigation_devices_user_id
  ON irrigation_devices(user_id);

-- ================================================================

-- Table: device_zone_mappings
-- Maps irrigation controller zones to vineyard blocks/fields
CREATE TABLE IF NOT EXISTS device_zone_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES irrigation_devices(id) ON DELETE CASCADE,

  -- Zone information
  zone_number INTEGER NOT NULL,
  zone_name TEXT,

  -- Mapping to vineyard block
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,

  -- Flow configuration for this zone
  flow_rate_gpm DECIMAL(10, 2), -- Gallons per minute
  irrigation_method TEXT DEFAULT 'drip', -- 'drip', 'sprinkler', 'flood', etc.

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one mapping per zone per device
  CONSTRAINT unique_zone_per_device UNIQUE(device_id, zone_number)
);

CREATE INDEX IF NOT EXISTS idx_device_zone_mappings_device_id
  ON device_zone_mappings(device_id);

CREATE INDEX IF NOT EXISTS idx_device_zone_mappings_block_id
  ON device_zone_mappings(block_id);

-- ================================================================

-- Modify existing irrigation_events table to track source
-- Add source column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'irrigation_events' AND column_name = 'source'
  ) THEN
    ALTER TABLE irrigation_events ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'irrigation_events' AND column_name = 'device_id'
  ) THEN
    ALTER TABLE irrigation_events ADD COLUMN device_id UUID REFERENCES irrigation_devices(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'irrigation_events' AND column_name = 'zone_number'
  ) THEN
    ALTER TABLE irrigation_events ADD COLUMN zone_number INTEGER;
  END IF;
END $$;

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_irrigation_events_source
  ON irrigation_events(source);

CREATE INDEX IF NOT EXISTS idx_irrigation_events_device_id
  ON irrigation_events(device_id);

-- ================================================================

-- Row Level Security (RLS) Policies

-- irrigation_devices policies
ALTER TABLE irrigation_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own devices"
  ON irrigation_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
  ON irrigation_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON irrigation_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
  ON irrigation_devices FOR DELETE
  USING (auth.uid() = user_id);

-- device_zone_mappings policies
ALTER TABLE device_zone_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own zone mappings"
  ON device_zone_mappings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own zone mappings"
  ON device_zone_mappings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own zone mappings"
  ON device_zone_mappings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own zone mappings"
  ON device_zone_mappings FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================

-- Updated_at trigger for irrigation_devices
CREATE OR REPLACE FUNCTION update_irrigation_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER irrigation_devices_updated_at
  BEFORE UPDATE ON irrigation_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_irrigation_devices_updated_at();

-- Updated_at trigger for device_zone_mappings
CREATE OR REPLACE FUNCTION update_device_zone_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_zone_mappings_updated_at
  BEFORE UPDATE ON device_zone_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_device_zone_mappings_updated_at();
