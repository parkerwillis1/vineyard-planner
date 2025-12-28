-- ================================================================
-- IOT SENSOR INTEGRATION SYSTEM
-- Hardware-agnostic temperature monitoring with real-time alerts
-- ================================================================

-- SENSORS TABLE
-- Stores registered temperature sensors (any hardware type)
CREATE TABLE IF NOT EXISTS temperature_sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Sensor identification
  name TEXT NOT NULL,
  sensor_type TEXT NOT NULL, -- 'tilt', 'plaato', 'raspberry_pi', 'modbus', 'manual', 'other'
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,

  -- Association (sensor can be assigned to a tank OR a specific lot)
  container_id UUID REFERENCES production_containers(id) ON DELETE SET NULL,
  lot_id UUID REFERENCES production_lots(id) ON DELETE SET NULL,

  -- Authentication & Security
  api_key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  webhook_url TEXT, -- Optional: URL to push data TO (for two-way communication)

  -- Status & Monitoring
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'offline')),
  last_reading_at TIMESTAMPTZ,
  last_reading_temp_f DECIMAL(5,2),
  connection_interval_minutes INTEGER DEFAULT 15, -- Expected check-in interval

  -- Configuration (JSON for flexibility with any sensor type)
  config JSONB DEFAULT '{}', -- Store sensor-specific settings

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT sensor_assignment_check CHECK (
    (container_id IS NOT NULL) OR (lot_id IS NOT NULL)
  )
);

-- TEMPERATURE READINGS TABLE
-- Stores all temperature data points from sensors
CREATE TABLE IF NOT EXISTS temperature_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source
  sensor_id UUID REFERENCES temperature_sensors(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES production_lots(id) ON DELETE CASCADE,
  container_id UUID REFERENCES production_containers(id) ON DELETE SET NULL,

  -- Reading data
  temp_f DECIMAL(5,2) NOT NULL,
  temp_c DECIMAL(5,2) GENERATED ALWAYS AS ((temp_f - 32) * 5 / 9) STORED,
  humidity_percent DECIMAL(5,2), -- Optional: if sensor supports it
  specific_gravity DECIMAL(6,4), -- Optional: for Tilt hydrometer
  battery_level INTEGER, -- Optional: battery percentage

  -- Metadata
  source TEXT DEFAULT 'sensor' CHECK (source IN ('sensor', 'manual', 'import')),
  reading_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at TIMESTAMPTZ DEFAULT NOW(),

  -- Raw data from sensor (for debugging)
  raw_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALERT RULES TABLE
-- Configurable temperature alert rules per tank/lot
CREATE TABLE IF NOT EXISTS temperature_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What to monitor
  sensor_id UUID REFERENCES temperature_sensors(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES production_lots(id) ON DELETE CASCADE,
  container_id UUID REFERENCES production_containers(id) ON DELETE SET NULL,

  -- Alert conditions
  name TEXT NOT NULL,
  min_temp_f DECIMAL(5,2),
  max_temp_f DECIMAL(5,2),

  -- Alert channels
  alert_email TEXT[], -- Array of email addresses
  alert_sms TEXT[], -- Array of phone numbers
  alert_webhook TEXT, -- HTTP webhook to call

  -- Alert management
  enabled BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 60, -- Minimum time between alerts
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALERT HISTORY TABLE
-- Log of all triggered alerts
CREATE TABLE IF NOT EXISTS temperature_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  alert_rule_id UUID REFERENCES temperature_alert_rules(id) ON DELETE SET NULL,
  sensor_id UUID REFERENCES temperature_sensors(id) ON DELETE SET NULL,
  reading_id UUID REFERENCES temperature_readings(id) ON DELETE SET NULL,

  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('temp_high', 'temp_low', 'sensor_offline', 'battery_low')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  temp_f DECIMAL(5,2),

  -- Response tracking
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- INDEXES for performance
-- ================================================================

CREATE INDEX idx_sensors_user ON temperature_sensors(user_id);
CREATE INDEX idx_sensors_container ON temperature_sensors(container_id);
CREATE INDEX idx_sensors_lot ON temperature_sensors(lot_id);
CREATE INDEX idx_sensors_status ON temperature_sensors(status);
CREATE INDEX idx_sensors_api_key ON temperature_sensors(api_key);

CREATE INDEX idx_readings_sensor ON temperature_readings(sensor_id);
CREATE INDEX idx_readings_lot ON temperature_readings(lot_id);
CREATE INDEX idx_readings_timestamp ON temperature_readings(reading_timestamp DESC);
CREATE INDEX idx_readings_user_time ON temperature_readings(user_id, reading_timestamp DESC);

CREATE INDEX idx_alert_rules_sensor ON temperature_alert_rules(sensor_id);
CREATE INDEX idx_alert_rules_enabled ON temperature_alert_rules(enabled) WHERE enabled = true;

CREATE INDEX idx_alert_history_user ON temperature_alert_history(user_id);
CREATE INDEX idx_alert_history_sensor ON temperature_alert_history(sensor_id);
CREATE INDEX idx_alert_history_created ON temperature_alert_history(created_at DESC);
CREATE INDEX idx_alert_history_unacked ON temperature_alert_history(acknowledged) WHERE acknowledged = false;

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE temperature_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_alert_history ENABLE ROW LEVEL SECURITY;

-- Sensors policies
CREATE POLICY "Users can view their own sensors"
  ON temperature_sensors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sensors"
  ON temperature_sensors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sensors"
  ON temperature_sensors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sensors"
  ON temperature_sensors FOR DELETE
  USING (auth.uid() = user_id);

-- Readings policies (allow insert via API key)
CREATE POLICY "Users can view their own readings"
  ON temperature_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert readings"
  ON temperature_readings FOR INSERT
  WITH CHECK (true); -- Will be validated by API endpoint

-- Alert rules policies
CREATE POLICY "Users can manage their own alert rules"
  ON temperature_alert_rules FOR ALL
  USING (auth.uid() = user_id);

-- Alert history policies
CREATE POLICY "Users can view their own alert history"
  ON temperature_alert_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can acknowledge their own alerts"
  ON temperature_alert_history FOR UPDATE
  USING (auth.uid() = user_id);

-- ================================================================
-- FUNCTIONS & TRIGGERS
-- ================================================================

-- Update sensor status when reading is received
CREATE OR REPLACE FUNCTION update_sensor_last_reading()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE temperature_sensors
  SET
    last_reading_at = NEW.reading_timestamp,
    last_reading_temp_f = NEW.temp_f,
    status = 'active',
    updated_at = NOW()
  WHERE id = NEW.sensor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sensor_reading
  AFTER INSERT ON temperature_readings
  FOR EACH ROW
  EXECUTE FUNCTION update_sensor_last_reading();

-- Update lot's current temperature when reading is received
CREATE OR REPLACE FUNCTION update_lot_temperature()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lot_id IS NOT NULL THEN
    UPDATE production_lots
    SET
      current_temp_f = NEW.temp_f,
      updated_at = NOW()
    WHERE id = NEW.lot_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lot_temp
  AFTER INSERT ON temperature_readings
  FOR EACH ROW
  EXECUTE FUNCTION update_lot_temperature();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sensors_updated_at
  BEFORE UPDATE ON temperature_sensors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_alert_rules_updated_at
  BEFORE UPDATE ON temperature_alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- COMMENTS for documentation
-- ================================================================

COMMENT ON TABLE temperature_sensors IS 'Registered IoT temperature sensors (hardware-agnostic)';
COMMENT ON TABLE temperature_readings IS 'Time-series temperature data from sensors';
COMMENT ON TABLE temperature_alert_rules IS 'Configurable temperature alert rules';
COMMENT ON TABLE temperature_alert_history IS 'Log of triggered alerts';

COMMENT ON COLUMN temperature_sensors.api_key IS 'Unique API key for sensor authentication';
COMMENT ON COLUMN temperature_sensors.config IS 'JSON config for sensor-specific settings';
COMMENT ON COLUMN temperature_sensors.connection_interval_minutes IS 'Expected check-in frequency (for offline detection)';

COMMENT ON COLUMN temperature_readings.source IS 'Data source: sensor (IoT), manual (user entry), or import (bulk)';
COMMENT ON COLUMN temperature_readings.raw_data IS 'Raw JSON payload from sensor (for debugging)';

COMMENT ON COLUMN temperature_alert_rules.cooldown_minutes IS 'Minimum minutes between repeat alerts';
