-- Rain Gauge and Weather Station Tracking
-- This migration adds tables for tracking rainfall and weather data

-- Table: rain_gauges
-- Stores rain gauge/weather station configurations
CREATE TABLE IF NOT EXISTS rain_gauges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  station_name VARCHAR(100) NOT NULL,
  station_type VARCHAR(50), -- Manual, Davis, Onset HOBO, Rainwise, WeatherFlow, etc.
  station_id_external VARCHAR(100), -- External device ID if applicable
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  elevation_ft INTEGER,
  is_active BOOLEAN DEFAULT true,

  -- Integration settings
  api_endpoint TEXT, -- For pulling data from cloud services
  api_key_encrypted TEXT, -- Encrypted API key
  webhook_url TEXT, -- For push notifications

  -- Station capabilities
  measures_rainfall BOOLEAN DEFAULT true,
  measures_temperature BOOLEAN DEFAULT false,
  measures_humidity BOOLEAN DEFAULT false,
  measures_wind BOOLEAN DEFAULT false,
  measures_solar_radiation BOOLEAN DEFAULT false,

  -- Association
  primary_for_blocks UUID[], -- Array of block IDs this station covers

  -- Metadata
  last_reading_at TIMESTAMPTZ,
  installation_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_rain_gauges_user_id ON rain_gauges(user_id);
CREATE INDEX idx_rain_gauges_station_id ON rain_gauges(station_id_external);
CREATE INDEX idx_rain_gauges_location ON rain_gauges(lat, lng);

-- Enable Row Level Security
ALTER TABLE rain_gauges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own rain gauges"
  ON rain_gauges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rain gauges"
  ON rain_gauges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rain gauges"
  ON rain_gauges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rain gauges"
  ON rain_gauges FOR DELETE
  USING (auth.uid() = user_id);

-- Table: rainfall_readings
-- Stores timeseries rainfall data
CREATE TABLE IF NOT EXISTS rainfall_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rain_gauge_id UUID REFERENCES rain_gauges(id) ON DELETE CASCADE NOT NULL,
  reading_time TIMESTAMPTZ NOT NULL,

  -- Rainfall data
  rainfall_inches DECIMAL(6,3), -- Rainfall amount in inches
  rainfall_mm DECIMAL(7,2), -- Rainfall amount in mm (auto-calculated)
  rainfall_rate_in_hr DECIMAL(6,3), -- Intensity (inches per hour)

  -- Additional weather data (if available)
  temperature_f DECIMAL(5,2),
  humidity_percent DECIMAL(5,2),
  wind_speed_mph DECIMAL(5,2),
  wind_direction_degrees INTEGER,
  solar_radiation_w_m2 DECIMAL(7,2),

  -- Data source tracking
  data_source VARCHAR(50) DEFAULT 'manual', -- manual, api, webhook, imported
  is_validated BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for timeseries queries
CREATE INDEX idx_rainfall_readings_gauge_id ON rainfall_readings(rain_gauge_id);
CREATE INDEX idx_rainfall_readings_time ON rainfall_readings(reading_time DESC);
CREATE INDEX idx_rainfall_readings_gauge_time ON rainfall_readings(rain_gauge_id, reading_time DESC);

-- Enable Row Level Security
ALTER TABLE rainfall_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Access through rain gauge ownership
CREATE POLICY "Users can view readings from their rain gauges"
  ON rainfall_readings FOR SELECT
  USING (
    rain_gauge_id IN (
      SELECT id FROM rain_gauges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert readings for their rain gauges"
  ON rainfall_readings FOR INSERT
  WITH CHECK (
    rain_gauge_id IN (
      SELECT id FROM rain_gauges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update readings from their rain gauges"
  ON rainfall_readings FOR UPDATE
  USING (
    rain_gauge_id IN (
      SELECT id FROM rain_gauges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete readings from their rain gauges"
  ON rainfall_readings FOR DELETE
  USING (
    rain_gauge_id IN (
      SELECT id FROM rain_gauges WHERE user_id = auth.uid()
    )
  );

-- Table: daily_rainfall_summary
-- Materialized daily aggregates for performance
CREATE TABLE IF NOT EXISTS daily_rainfall_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rain_gauge_id UUID REFERENCES rain_gauges(id) ON DELETE CASCADE NOT NULL,
  summary_date DATE NOT NULL,

  -- Aggregated rainfall
  total_rainfall_inches DECIMAL(6,3),
  total_rainfall_mm DECIMAL(7,2),
  max_rainfall_rate_in_hr DECIMAL(6,3),
  reading_count INTEGER,

  -- Weather aggregates
  avg_temperature_f DECIMAL(5,2),
  min_temperature_f DECIMAL(5,2),
  max_temperature_f DECIMAL(5,2),
  avg_humidity_percent DECIMAL(5,2),
  avg_wind_speed_mph DECIMAL(5,2),
  total_solar_radiation_mj_m2 DECIMAL(8,3),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rain_gauge_id, summary_date)
);

-- Add indexes
CREATE INDEX idx_daily_rainfall_summary_gauge_id ON daily_rainfall_summary(rain_gauge_id);
CREATE INDEX idx_daily_rainfall_summary_date ON daily_rainfall_summary(summary_date DESC);

-- Enable Row Level Security
ALTER TABLE daily_rainfall_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their rain gauge summaries"
  ON daily_rainfall_summary FOR SELECT
  USING (
    rain_gauge_id IN (
      SELECT id FROM rain_gauges WHERE user_id = auth.uid()
    )
  );

-- Function: Auto-calculate mm from inches on insert/update
CREATE OR REPLACE FUNCTION calculate_rainfall_mm()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert inches to mm (1 inch = 25.4 mm)
  IF NEW.rainfall_inches IS NOT NULL THEN
    NEW.rainfall_mm := NEW.rainfall_inches * 25.4;
  ELSIF NEW.rainfall_mm IS NOT NULL THEN
    NEW.rainfall_inches := NEW.rainfall_mm / 25.4;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rainfall_readings
CREATE TRIGGER rainfall_readings_calculate_mm
  BEFORE INSERT OR UPDATE ON rainfall_readings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_rainfall_mm();

-- Trigger for daily_rainfall_summary
CREATE TRIGGER daily_rainfall_summary_calculate_mm
  BEFORE INSERT OR UPDATE ON daily_rainfall_summary
  FOR EACH ROW
  EXECUTE FUNCTION calculate_rainfall_mm();

-- Function: Get total rainfall for a block over date range
CREATE OR REPLACE FUNCTION get_block_rainfall(
  p_block_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_rainfall_mm DECIMAL,
  total_rainfall_inches DECIMAL,
  reading_count INTEGER,
  rain_gauge_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(drs.total_rainfall_mm)::DECIMAL as total_mm,
    SUM(drs.total_rainfall_inches)::DECIMAL as total_inches,
    SUM(drs.reading_count)::INTEGER as count,
    rg.station_name
  FROM rain_gauges rg
  JOIN daily_rainfall_summary drs ON drs.rain_gauge_id = rg.id
  WHERE p_block_id = ANY(rg.primary_for_blocks)
    AND drs.summary_date BETWEEN p_start_date AND p_end_date
  GROUP BY rg.station_name;
END;
$$ LANGUAGE plpgsql;

-- Function: Update daily summaries (can be called manually or via cron)
CREATE OR REPLACE FUNCTION update_daily_rainfall_summaries(p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER := 0;
BEGIN
  INSERT INTO daily_rainfall_summary (
    rain_gauge_id,
    summary_date,
    total_rainfall_inches,
    total_rainfall_mm,
    max_rainfall_rate_in_hr,
    reading_count,
    avg_temperature_f,
    min_temperature_f,
    max_temperature_f,
    avg_humidity_percent,
    avg_wind_speed_mph,
    total_solar_radiation_mj_m2
  )
  SELECT
    rain_gauge_id,
    DATE(reading_time) as summary_date,
    SUM(rainfall_inches) as total_rainfall_inches,
    SUM(rainfall_mm) as total_rainfall_mm,
    MAX(rainfall_rate_in_hr) as max_rainfall_rate_in_hr,
    COUNT(*) as reading_count,
    AVG(temperature_f) as avg_temperature_f,
    MIN(temperature_f) as min_temperature_f,
    MAX(temperature_f) as max_temperature_f,
    AVG(humidity_percent) as avg_humidity_percent,
    AVG(wind_speed_mph) as avg_wind_speed_mph,
    SUM(solar_radiation_w_m2 * 0.0036) as total_solar_radiation_mj_m2 -- Convert W/m² to MJ/m²
  FROM rainfall_readings
  WHERE DATE(reading_time) = p_date
  GROUP BY rain_gauge_id, DATE(reading_time)
  ON CONFLICT (rain_gauge_id, summary_date)
  DO UPDATE SET
    total_rainfall_inches = EXCLUDED.total_rainfall_inches,
    total_rainfall_mm = EXCLUDED.total_rainfall_mm,
    max_rainfall_rate_in_hr = EXCLUDED.max_rainfall_rate_in_hr,
    reading_count = EXCLUDED.reading_count,
    avg_temperature_f = EXCLUDED.avg_temperature_f,
    min_temperature_f = EXCLUDED.min_temperature_f,
    max_temperature_f = EXCLUDED.max_temperature_f,
    avg_humidity_percent = EXCLUDED.avg_humidity_percent,
    avg_wind_speed_mph = EXCLUDED.avg_wind_speed_mph,
    total_solar_radiation_mj_m2 = EXCLUDED.total_solar_radiation_mj_m2;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE TRIGGER update_rain_gauges_updated_at BEFORE UPDATE ON rain_gauges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE rain_gauges IS 'Rain gauge and weather station configurations';
COMMENT ON TABLE rainfall_readings IS 'Timeseries rainfall and weather data';
COMMENT ON TABLE daily_rainfall_summary IS 'Daily aggregated rainfall and weather statistics';
COMMENT ON FUNCTION get_block_rainfall IS 'Get total rainfall for a block over a date range';
COMMENT ON FUNCTION update_daily_rainfall_summaries IS 'Aggregate rainfall readings into daily summaries';
