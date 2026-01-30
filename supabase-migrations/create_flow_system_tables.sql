-- ================================================================
-- FLOW METER REAL-TIME DATA SYSTEM
-- Creates tables for real-time flow monitoring, session tracking,
-- and device alerting
-- ================================================================

-- =====================================================
-- 1. FLOW_READINGS - Raw telemetry (high-frequency)
-- =====================================================
CREATE TABLE IF NOT EXISTS flow_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES irrigation_devices(id) ON DELETE CASCADE,
  zone_mapping_id UUID REFERENCES device_zone_mappings(id) ON DELETE SET NULL,

  -- Flow data
  flow_rate_gpm DECIMAL(10, 3) NOT NULL,
  cumulative_gallons DECIMAL(12, 3),
  pulse_count BIGINT,  -- Raw pulse count for debugging

  -- Device health telemetry
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  signal_strength INTEGER,  -- WiFi RSSI or LoRa SNR

  -- Timestamps (device time vs server time)
  reading_timestamp TIMESTAMPTZ NOT NULL,  -- From device (NTP synced)
  received_at TIMESTAMPTZ DEFAULT now(),   -- When server got it

  raw_data JSONB,  -- Full payload for debugging

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_flow_readings_device_time
  ON flow_readings(device_id, reading_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_flow_readings_zone_time
  ON flow_readings(zone_mapping_id, reading_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_flow_readings_user_recent
  ON flow_readings(user_id, received_at DESC);

-- RLS for flow_readings
ALTER TABLE flow_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own flow readings" ON flow_readings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert flow readings" ON flow_readings
  FOR INSERT WITH CHECK (true);  -- Edge function uses service role

-- =====================================================
-- 2. FLOW_READINGS_LATEST - Current state per device
-- Efficient table for UI (1 row per device, updated on each reading)
-- =====================================================
CREATE TABLE IF NOT EXISTS flow_readings_latest (
  device_id UUID PRIMARY KEY REFERENCES irrigation_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_mapping_id UUID REFERENCES device_zone_mappings(id) ON DELETE SET NULL,

  flow_rate_gpm DECIMAL(10, 3),
  cumulative_gallons DECIMAL(12, 3),
  battery_level INTEGER,
  signal_strength INTEGER,

  reading_timestamp TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_flow_readings_latest_user
  ON flow_readings_latest(user_id);

-- RLS for flow_readings_latest
ALTER TABLE flow_readings_latest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own latest readings" ON flow_readings_latest
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can upsert latest readings" ON flow_readings_latest
  FOR ALL WITH CHECK (true);  -- Edge function uses service role

-- =====================================================
-- 3. IRRIGATION_SESSIONS - State machine for irrigation events
-- =====================================================
CREATE TABLE IF NOT EXISTS irrigation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES irrigation_devices(id) ON DELETE CASCADE,
  zone_mapping_id UUID REFERENCES device_zone_mappings(id) ON DELETE SET NULL,
  block_id UUID REFERENCES vineyard_blocks(id) ON DELETE SET NULL,

  -- State machine
  state TEXT NOT NULL DEFAULT 'running' CHECK (state IN ('running', 'ended', 'dropped')),

  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes DECIMAL(8, 2),

  -- Aggregates (updated continuously while running)
  total_gallons DECIMAL(12, 3) DEFAULT 0,
  avg_flow_rate_gpm DECIMAL(10, 3),
  peak_flow_rate_gpm DECIMAL(10, 3),
  reading_count INTEGER DEFAULT 0,

  -- State machine debounce tracking
  consecutive_zero_readings INTEGER DEFAULT 0,

  -- If dropped, why?
  dropped_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_irrigation_sessions_device
  ON irrigation_sessions(device_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_irrigation_sessions_user_state
  ON irrigation_sessions(user_id, state);
CREATE INDEX IF NOT EXISTS idx_irrigation_sessions_running
  ON irrigation_sessions(device_id) WHERE state = 'running';

-- RLS for irrigation_sessions
ALTER TABLE irrigation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON irrigation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions" ON irrigation_sessions
  FOR ALL WITH CHECK (true);

-- =====================================================
-- 4. DEVICE_ALERTS - Alerting system
-- =====================================================
CREATE TABLE IF NOT EXISTS device_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES irrigation_devices(id) ON DELETE CASCADE,
  zone_mapping_id UUID REFERENCES device_zone_mappings(id) ON DELETE SET NULL,

  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'leak', 'no_flow', 'battery_low', 'offline', 'anomaly', 'flow_started', 'flow_stopped'
  )),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,

  -- Context snapshot at time of alert
  flow_rate_gpm DECIMAL(10, 3),
  expected_flow_rate_gpm DECIMAL(10, 3),

  -- Status tracking
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for unresolved alerts
CREATE INDEX IF NOT EXISTS idx_device_alerts_unresolved
  ON device_alerts(user_id, created_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_device_alerts_device
  ON device_alerts(device_id, created_at DESC);

-- RLS for device_alerts
ALTER TABLE device_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts" ON device_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON device_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert alerts" ON device_alerts
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 5. MODIFY IRRIGATION_DEVICES - Add state tracking columns
-- =====================================================

-- Device health state
ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS current_state TEXT DEFAULT 'idle'
  CHECK (current_state IN ('idle', 'running', 'offline', 'error'));

ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS current_session_id UUID REFERENCES irrigation_sessions(id) ON DELETE SET NULL;

-- Flow thresholds (per device, configurable)
ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS flow_start_threshold_gpm DECIMAL(10, 3) DEFAULT 0.5;

ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS flow_stop_threshold_gpm DECIMAL(10, 3) DEFAULT 0.2;

ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS min_session_duration_minutes INTEGER DEFAULT 3;

ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS min_session_gallons DECIMAL(10, 3) DEFAULT 5;

ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS offline_threshold_minutes INTEGER DEFAULT 30;

-- Consecutive readings required for state changes
ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS consecutive_start_readings INTEGER DEFAULT 2;

ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS consecutive_stop_readings INTEGER DEFAULT 3;

-- Security enhancements
ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'token'
  CHECK (auth_method IN ('token', 'hmac', 'api_key'));

ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS hmac_secret TEXT;

-- Temporary counter for debounce (not persisted across readings in a clean way)
-- Actually this is tracked in the session, but we need a counter for START debounce
ALTER TABLE irrigation_devices
  ADD COLUMN IF NOT EXISTS consecutive_flow_readings INTEGER DEFAULT 0;

-- =====================================================
-- 6. FLOW_READINGS_HOURLY - Aggregated data for charts
-- =====================================================
CREATE TABLE IF NOT EXISTS flow_readings_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES irrigation_devices(id) ON DELETE CASCADE,
  zone_mapping_id UUID REFERENCES device_zone_mappings(id) ON DELETE SET NULL,

  hour_start TIMESTAMPTZ NOT NULL,  -- Truncated to hour

  avg_flow_rate_gpm DECIMAL(10, 3),
  max_flow_rate_gpm DECIMAL(10, 3),
  min_flow_rate_gpm DECIMAL(10, 3),
  total_gallons DECIMAL(12, 3),
  reading_count INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(device_id, hour_start)
);

CREATE INDEX IF NOT EXISTS idx_flow_readings_hourly_device_time
  ON flow_readings_hourly(device_id, hour_start DESC);
CREATE INDEX IF NOT EXISTS idx_flow_readings_hourly_user_time
  ON flow_readings_hourly(user_id, hour_start DESC);

-- RLS for flow_readings_hourly
ALTER TABLE flow_readings_hourly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hourly readings" ON flow_readings_hourly
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can upsert hourly readings" ON flow_readings_hourly
  FOR ALL WITH CHECK (true);

-- =====================================================
-- 7. HELPER FUNCTION - Update hourly aggregates
-- =====================================================
CREATE OR REPLACE FUNCTION update_flow_hourly_aggregate()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO flow_readings_hourly (
    user_id, device_id, zone_mapping_id, hour_start,
    avg_flow_rate_gpm, max_flow_rate_gpm, min_flow_rate_gpm,
    total_gallons, reading_count
  )
  VALUES (
    NEW.user_id,
    NEW.device_id,
    NEW.zone_mapping_id,
    date_trunc('hour', NEW.reading_timestamp),
    NEW.flow_rate_gpm,
    NEW.flow_rate_gpm,
    NEW.flow_rate_gpm,
    COALESCE(NEW.flow_rate_gpm / 60.0 * 0.5, 0),  -- Estimate gallons for 30 sec interval
    1
  )
  ON CONFLICT (device_id, hour_start) DO UPDATE SET
    avg_flow_rate_gpm = (
      (flow_readings_hourly.avg_flow_rate_gpm * flow_readings_hourly.reading_count + NEW.flow_rate_gpm)
      / (flow_readings_hourly.reading_count + 1)
    ),
    max_flow_rate_gpm = GREATEST(flow_readings_hourly.max_flow_rate_gpm, NEW.flow_rate_gpm),
    min_flow_rate_gpm = LEAST(flow_readings_hourly.min_flow_rate_gpm, NEW.flow_rate_gpm),
    total_gallons = flow_readings_hourly.total_gallons + COALESCE(NEW.flow_rate_gpm / 60.0 * 0.5, 0),
    reading_count = flow_readings_hourly.reading_count + 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update hourly aggregates
DROP TRIGGER IF EXISTS trg_flow_readings_hourly ON flow_readings;
CREATE TRIGGER trg_flow_readings_hourly
  AFTER INSERT ON flow_readings
  FOR EACH ROW
  EXECUTE FUNCTION update_flow_hourly_aggregate();

-- =====================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE flow_readings IS 'Raw flow meter telemetry - high frequency data (every 10-30 seconds)';
COMMENT ON TABLE flow_readings_latest IS 'Current state per device - single row updated on each reading for efficient UI subscriptions';
COMMENT ON TABLE irrigation_sessions IS 'State machine tracking of irrigation events - debounced and validated';
COMMENT ON TABLE device_alerts IS 'Device alerts with acknowledgment and resolution tracking';
COMMENT ON TABLE flow_readings_hourly IS 'Hourly aggregated flow data for historical charts';

COMMENT ON COLUMN irrigation_devices.current_state IS 'Device state: idle, running, offline, error';
COMMENT ON COLUMN irrigation_devices.flow_start_threshold_gpm IS 'Flow rate (GPM) above which irrigation is detected';
COMMENT ON COLUMN irrigation_devices.flow_stop_threshold_gpm IS 'Flow rate (GPM) below which irrigation is considered stopped';
COMMENT ON COLUMN irrigation_devices.consecutive_start_readings IS 'Number of consecutive readings above threshold to start session';
COMMENT ON COLUMN irrigation_devices.consecutive_stop_readings IS 'Number of consecutive readings below threshold to end session';
