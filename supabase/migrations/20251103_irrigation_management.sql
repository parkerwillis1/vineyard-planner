-- Irrigation Management Tables
-- This migration creates tables for managing irrigation events, ET data, and sensor data

-- Table: irrigation_events
-- Stores manual and automated irrigation events
CREATE TABLE IF NOT EXISTS irrigation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  block_id UUID NOT NULL, -- References vineyard_blocks table
  event_date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_hours DECIMAL(5,2) NOT NULL, -- Duration in hours
  flow_rate_gpm INTEGER, -- Flow rate in gallons per minute
  total_water_gallons INTEGER, -- Total water applied
  total_water_inches DECIMAL(6,3), -- Water depth in inches (acre-inches / acres)
  irrigation_method VARCHAR(50), -- Drip, Micro-sprinkler, Overhead, Flood
  is_automated BOOLEAN DEFAULT false, -- Manual vs automated
  controller_id VARCHAR(100), -- If automated, the controller ID
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_irrigation_events_user_id ON irrigation_events(user_id);
CREATE INDEX idx_irrigation_events_block_id ON irrigation_events(block_id);
CREATE INDEX idx_irrigation_events_date ON irrigation_events(event_date DESC);

-- Enable Row Level Security
ALTER TABLE irrigation_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own irrigation events
CREATE POLICY "Users can view their own irrigation events"
  ON irrigation_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own irrigation events"
  ON irrigation_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own irrigation events"
  ON irrigation_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own irrigation events"
  ON irrigation_events FOR DELETE
  USING (auth.uid() = user_id);

-- Table: openet_data
-- Stores cached OpenET evapotranspiration data
CREATE TABLE IF NOT EXISTS openet_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  block_id UUID NOT NULL,
  data_date DATE NOT NULL,
  et_mm DECIMAL(6,2), -- Reference ET in mm/day
  etc_mm DECIMAL(6,2), -- Crop ET in mm/day (ET * Kc)
  kc_value DECIMAL(4,3), -- Crop coefficient used
  model VARCHAR(50), -- OpenET model used (ensemble, ssebop, etc)
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(block_id, data_date, model)
);

-- Add indexes
CREATE INDEX idx_openet_data_user_id ON openet_data(user_id);
CREATE INDEX idx_openet_data_block_id ON openet_data(block_id);
CREATE INDEX idx_openet_data_date ON openet_data(data_date DESC);

-- Enable Row Level Security
ALTER TABLE openet_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own ET data"
  ON openet_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ET data"
  ON openet_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table: soil_moisture_sensors
-- Stores IoT soil moisture sensor configurations
CREATE TABLE IF NOT EXISTS soil_moisture_sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  block_id UUID NOT NULL,
  sensor_name VARCHAR(100) NOT NULL,
  sensor_type VARCHAR(50), -- Teros 12, Sentek, etc.
  sensor_id VARCHAR(100) UNIQUE, -- External sensor ID
  depth_inches INTEGER, -- Sensor depth
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  is_active BOOLEAN DEFAULT true,
  webhook_url TEXT, -- For push notifications
  api_endpoint TEXT, -- For polling
  api_key_encrypted TEXT, -- Encrypted API key
  last_reading_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_soil_moisture_sensors_user_id ON soil_moisture_sensors(user_id);
CREATE INDEX idx_soil_moisture_sensors_block_id ON soil_moisture_sensors(block_id);
CREATE INDEX idx_soil_moisture_sensors_sensor_id ON soil_moisture_sensors(sensor_id);

-- Enable Row Level Security
ALTER TABLE soil_moisture_sensors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sensors"
  ON soil_moisture_sensors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sensors"
  ON soil_moisture_sensors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sensors"
  ON soil_moisture_sensors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sensors"
  ON soil_moisture_sensors FOR DELETE
  USING (auth.uid() = user_id);

-- Table: soil_moisture_readings
-- Stores actual sensor readings (timeseries data)
CREATE TABLE IF NOT EXISTS soil_moisture_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID REFERENCES soil_moisture_sensors(id) ON DELETE CASCADE NOT NULL,
  reading_time TIMESTAMPTZ NOT NULL,
  moisture_percent DECIMAL(5,2), -- Volumetric water content %
  temperature_f DECIMAL(5,2), -- Soil temperature
  raw_value INTEGER, -- Raw sensor reading
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for timeseries queries
CREATE INDEX idx_soil_moisture_readings_sensor_id ON soil_moisture_readings(sensor_id);
CREATE INDEX idx_soil_moisture_readings_time ON soil_moisture_readings(reading_time DESC);

-- Composite index for efficient queries
CREATE INDEX idx_soil_moisture_readings_sensor_time ON soil_moisture_readings(sensor_id, reading_time DESC);

-- Enable Row Level Security
ALTER TABLE soil_moisture_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Access through sensor ownership
CREATE POLICY "Users can view readings from their sensors"
  ON soil_moisture_readings FOR SELECT
  USING (
    sensor_id IN (
      SELECT id FROM soil_moisture_sensors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert readings for their sensors"
  ON soil_moisture_readings FOR INSERT
  WITH CHECK (
    sensor_id IN (
      SELECT id FROM soil_moisture_sensors WHERE user_id = auth.uid()
    )
  );

-- Table: variable_rate_zones
-- Stores VRI zones for blocks
CREATE TABLE IF NOT EXISTS variable_rate_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  block_id UUID NOT NULL,
  zone_name VARCHAR(100) NOT NULL,
  zone_number INTEGER,
  geometry JSONB NOT NULL, -- GeoJSON polygon
  irrigation_rate_multiplier DECIMAL(4,2) DEFAULT 1.0, -- Relative to base rate
  soil_type VARCHAR(50),
  ndvi_avg DECIMAL(4,3), -- Average NDVI from drone data
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_variable_rate_zones_user_id ON variable_rate_zones(user_id);
CREATE INDEX idx_variable_rate_zones_block_id ON variable_rate_zones(block_id);

-- Enable Row Level Security
ALTER TABLE variable_rate_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own VRI zones"
  ON variable_rate_zones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own VRI zones"
  ON variable_rate_zones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own VRI zones"
  ON variable_rate_zones FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own VRI zones"
  ON variable_rate_zones FOR DELETE
  USING (auth.uid() = user_id);

-- Table: irrigation_controllers
-- Stores automated irrigation controller configurations
CREATE TABLE IF NOT EXISTS irrigation_controllers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  controller_name VARCHAR(100) NOT NULL,
  controller_type VARCHAR(50), -- Baseline, Hunter Hydrawise, Rachio, RainMachine
  controller_id_external VARCHAR(100) UNIQUE,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  supports_automation BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_irrigation_controllers_user_id ON irrigation_controllers(user_id);

-- Enable Row Level Security
ALTER TABLE irrigation_controllers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own controllers"
  ON irrigation_controllers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own controllers"
  ON irrigation_controllers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own controllers"
  ON irrigation_controllers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own controllers"
  ON irrigation_controllers FOR DELETE
  USING (auth.uid() = user_id);

-- Table: irrigation_schedules
-- Stores automated irrigation schedules (future/planned irrigations)
CREATE TABLE IF NOT EXISTS irrigation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  block_id UUID NOT NULL,
  controller_id UUID REFERENCES irrigation_controllers(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_start_time TIME,
  estimated_duration_hours DECIMAL(5,2),
  estimated_water_inches DECIMAL(6,3),
  reason VARCHAR(50), -- ET_deficit, scheduled, manual
  et_deficit_mm DECIMAL(6,2), -- ET deficit that triggered this
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled, failed
  executed_at TIMESTAMPTZ,
  actual_event_id UUID REFERENCES irrigation_events(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_irrigation_schedules_user_id ON irrigation_schedules(user_id);
CREATE INDEX idx_irrigation_schedules_block_id ON irrigation_schedules(block_id);
CREATE INDEX idx_irrigation_schedules_date ON irrigation_schedules(scheduled_date);
CREATE INDEX idx_irrigation_schedules_status ON irrigation_schedules(status);

-- Enable Row Level Security
ALTER TABLE irrigation_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own schedules"
  ON irrigation_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules"
  ON irrigation_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
  ON irrigation_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON irrigation_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Function: Calculate water budget for a block
CREATE OR REPLACE FUNCTION calculate_water_budget(
  p_block_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_applied_gallons BIGINT,
  total_applied_inches DECIMAL,
  total_etc_mm DECIMAL,
  total_etc_inches DECIMAL,
  deficit_inches DECIMAL,
  balance_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH applied_water AS (
    SELECT
      COALESCE(SUM(total_water_gallons), 0) as gallons,
      COALESCE(SUM(total_water_inches), 0) as inches
    FROM irrigation_events
    WHERE block_id = p_block_id
      AND event_date BETWEEN p_start_date AND p_end_date
  ),
  crop_et AS (
    SELECT
      COALESCE(SUM(etc_mm), 0) as mm,
      COALESCE(SUM(etc_mm / 25.4), 0) as inches
    FROM openet_data
    WHERE block_id = p_block_id
      AND data_date BETWEEN p_start_date AND p_end_date
  )
  SELECT
    applied_water.gallons::BIGINT,
    applied_water.inches::DECIMAL,
    crop_et.mm::DECIMAL,
    crop_et.inches::DECIMAL,
    (crop_et.inches - applied_water.inches)::DECIMAL as deficit,
    CASE
      WHEN crop_et.inches > 0 THEN (applied_water.inches / crop_et.inches * 100)::DECIMAL
      ELSE 0::DECIMAL
    END as balance_pct
  FROM applied_water, crop_et;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_irrigation_events_updated_at BEFORE UPDATE ON irrigation_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_soil_moisture_sensors_updated_at BEFORE UPDATE ON soil_moisture_sensors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variable_rate_zones_updated_at BEFORE UPDATE ON variable_rate_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_irrigation_controllers_updated_at BEFORE UPDATE ON irrigation_controllers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_irrigation_schedules_updated_at BEFORE UPDATE ON irrigation_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE irrigation_events IS 'Stores manual and automated irrigation events with water application data';
COMMENT ON TABLE openet_data IS 'Cached OpenET satellite-based evapotranspiration data';
COMMENT ON TABLE soil_moisture_sensors IS 'IoT soil moisture sensor configurations';
COMMENT ON TABLE soil_moisture_readings IS 'Timeseries soil moisture sensor readings';
COMMENT ON TABLE variable_rate_zones IS 'Variable rate irrigation zones within blocks';
COMMENT ON TABLE irrigation_controllers IS 'Automated irrigation controller integrations';
COMMENT ON TABLE irrigation_schedules IS 'Scheduled and planned irrigation events';
