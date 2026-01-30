import { supabase } from './supabaseClient';

/* ================================================================
   FLOW METER API
   Real-time flow monitoring, sessions, alerts, and analytics
================================================================ */

// =====================================================
// FLOW READINGS
// =====================================================

/**
 * Get latest flow readings for all devices
 * Efficient query using flow_readings_latest table
 * @returns {Promise} Latest reading per device with device info
 */
export async function getLatestReadings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('flow_readings_latest')
    .select(`
      *,
      device:irrigation_devices(id, device_name, device_type, current_state, is_active),
      zone_mapping:device_zone_mappings(id, zone_number, zone_name, block_id,
        block:vineyard_blocks(id, name, variety)
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
}

/**
 * Get flow readings for a device within a time range
 * @param {string} deviceId - Device ID
 * @param {Date} startTime - Start of time range
 * @param {Date} endTime - End of time range
 * @param {boolean} useHourly - Use hourly aggregates instead of raw data
 * @returns {Promise} Flow readings
 */
export async function listFlowReadings(deviceId, startTime, endTime, useHourly = false) {
  const table = useHourly ? 'flow_readings_hourly' : 'flow_readings';
  const timeColumn = useHourly ? 'hour_start' : 'reading_timestamp';

  let query = supabase
    .from(table)
    .select('*')
    .eq('device_id', deviceId)
    .gte(timeColumn, startTime.toISOString())
    .lte(timeColumn, endTime.toISOString())
    .order(timeColumn, { ascending: true });

  // For raw readings, limit to prevent huge responses
  if (!useHourly) {
    query = query.limit(2000);
  }

  return query;
}

/**
 * Get raw flow readings for a short time period (for detailed charts)
 * @param {string} deviceId - Device ID
 * @param {number} minutesBack - Minutes to look back from now
 * @returns {Promise} Recent flow readings
 */
export async function getRecentReadings(deviceId, minutesBack = 30) {
  const startTime = new Date(Date.now() - minutesBack * 60 * 1000);

  return supabase
    .from('flow_readings')
    .select('*')
    .eq('device_id', deviceId)
    .gte('reading_timestamp', startTime.toISOString())
    .order('reading_timestamp', { ascending: true })
    .limit(500);
}

/**
 * Get hourly flow readings for a device (for long-term charts)
 * @param {string} deviceId - Device ID
 * @param {number} daysBack - Days to look back from now
 * @returns {Promise} Hourly aggregated readings
 */
export async function getHourlyReadings(deviceId, daysBack = 7) {
  const startTime = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  return supabase
    .from('flow_readings_hourly')
    .select('*')
    .eq('device_id', deviceId)
    .gte('hour_start', startTime.toISOString())
    .order('hour_start', { ascending: true });
}

// =====================================================
// DEVICE STATUS
// =====================================================

/**
 * Get comprehensive device status
 * Combines device state, last reading, and active session
 * @param {string} deviceId - Device ID
 * @returns {Promise} Device status object
 */
export async function getDeviceStatus(deviceId) {
  const [deviceResult, latestResult, sessionResult] = await Promise.all([
    supabase
      .from('irrigation_devices')
      .select('*')
      .eq('id', deviceId)
      .single(),
    supabase
      .from('flow_readings_latest')
      .select('*')
      .eq('device_id', deviceId)
      .single(),
    supabase
      .from('irrigation_sessions')
      .select('*')
      .eq('device_id', deviceId)
      .eq('state', 'running')
      .single()
  ]);

  return {
    data: {
      device: deviceResult.data,
      latestReading: latestResult.data,
      activeSession: sessionResult.data
    },
    error: deviceResult.error
  };
}

/**
 * Get all devices with their current status
 * @returns {Promise} All devices with status
 */
export async function listDevicesWithStatus() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  // Fetch devices with latest readings and zone mappings
  const { data: devices, error } = await supabase
    .from('irrigation_devices')
    .select(`
      *,
      latest_reading:flow_readings_latest(
        flow_rate_gpm, cumulative_gallons, battery_level, signal_strength, reading_timestamp
      ),
      zone_mappings:device_zone_mappings(
        id, zone_number, zone_name, block_id,
        block:vineyard_blocks(id, name)
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('device_name');

  if (error || !devices) return { data: devices, error };

  // Fetch active sessions separately to avoid FK ambiguity
  const { data: activeSessions } = await supabase
    .from('irrigation_sessions')
    .select('id, device_id, state, started_at, total_gallons, avg_flow_rate_gpm')
    .eq('user_id', user.id)
    .eq('state', 'running');

  // Merge active sessions into devices
  const sessionsMap = {};
  (activeSessions || []).forEach(s => {
    sessionsMap[s.device_id] = s;
  });

  const devicesWithSessions = devices.map(d => ({
    ...d,
    active_session: sessionsMap[d.id] ? [sessionsMap[d.id]] : []
  }));

  return { data: devicesWithSessions, error: null };
}

// =====================================================
// IRRIGATION SESSIONS
// =====================================================

/**
 * List active (running) irrigation sessions
 * @returns {Promise} Running sessions
 */
export async function listActiveSessions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  // Fetch sessions
  const { data: sessions, error } = await supabase
    .from('irrigation_sessions')
    .select(`
      *,
      zone_mapping:device_zone_mappings(id, zone_number, zone_name,
        block:vineyard_blocks(id, name, variety, acres)
      )
    `)
    .eq('user_id', user.id)
    .eq('state', 'running')
    .order('started_at', { ascending: false });

  if (error || !sessions || sessions.length === 0) {
    return { data: sessions || [], error };
  }

  // Fetch devices separately to avoid FK ambiguity
  const deviceIds = [...new Set(sessions.map(s => s.device_id))];
  const { data: devices } = await supabase
    .from('irrigation_devices')
    .select('id, device_name, device_type')
    .in('id', deviceIds);

  // Merge devices into sessions
  const devicesMap = {};
  (devices || []).forEach(d => { devicesMap[d.id] = d; });

  const sessionsWithDevices = sessions.map(s => ({
    ...s,
    device: devicesMap[s.device_id] || null
  }));

  return { data: sessionsWithDevices, error: null };
}

/**
 * List completed irrigation sessions
 * @param {Object} options - Filter options
 * @param {string} options.deviceId - Filter by device
 * @param {string} options.blockId - Filter by block
 * @param {Date} options.startDate - Filter by date range
 * @param {Date} options.endDate - Filter by date range
 * @param {number} options.limit - Limit results
 * @returns {Promise} Completed sessions
 */
export async function listCompletedSessions({
  deviceId,
  blockId,
  startDate,
  endDate,
  limit = 50
} = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('irrigation_sessions')
    .select(`
      *,
      zone_mapping:device_zone_mappings(id, zone_number, zone_name,
        block:vineyard_blocks(id, name, variety, acres)
      )
    `)
    .eq('user_id', user.id)
    .eq('state', 'ended')
    .order('ended_at', { ascending: false })
    .limit(limit);

  if (deviceId) query = query.eq('device_id', deviceId);
  if (blockId) query = query.eq('block_id', blockId);
  if (startDate) query = query.gte('started_at', startDate.toISOString());
  if (endDate) query = query.lte('ended_at', endDate.toISOString());

  const { data: sessions, error } = await query;

  if (error || !sessions || sessions.length === 0) {
    return { data: sessions || [], error };
  }

  // Fetch devices separately to avoid FK ambiguity
  const deviceIds = [...new Set(sessions.map(s => s.device_id))];
  const { data: devices } = await supabase
    .from('irrigation_devices')
    .select('id, device_name, device_type')
    .in('id', deviceIds);

  const devicesMap = {};
  (devices || []).forEach(d => { devicesMap[d.id] = d; });

  const sessionsWithDevices = sessions.map(s => ({
    ...s,
    device: devicesMap[s.device_id] || null
  }));

  return { data: sessionsWithDevices, error: null };
}

/**
 * Get a specific session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise} Session details
 */
export async function getSession(sessionId) {
  const { data: session, error } = await supabase
    .from('irrigation_sessions')
    .select(`
      *,
      zone_mapping:device_zone_mappings(id, zone_number, zone_name,
        block:vineyard_blocks(id, name, variety, acres)
      )
    `)
    .eq('id', sessionId)
    .single();

  if (error || !session) return { data: session, error };

  // Fetch device separately
  const { data: device } = await supabase
    .from('irrigation_devices')
    .select('id, device_name, device_type')
    .eq('id', session.device_id)
    .single();

  return { data: { ...session, device }, error: null };
}

/**
 * Manually end a stuck irrigation session
 * Use this when a session is stuck in 'running' state (e.g., device went offline)
 * @param {string} sessionId - Session ID to end
 * @param {string} reason - Reason for manual end (e.g., 'device_offline', 'manual')
 * @returns {Promise} Updated session
 */
export async function endStuckSession(sessionId, reason = 'manual') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  // Get the session first to calculate duration
  const { data: session, error: fetchError } = await supabase
    .from('irrigation_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .eq('state', 'running')
    .single();

  if (fetchError || !session) {
    return { error: fetchError || new Error('Session not found or already ended') };
  }

  const endedAt = new Date();
  const durationMinutes = (endedAt - new Date(session.started_at)) / (1000 * 60);

  // Update the session to ended
  return supabase
    .from('irrigation_sessions')
    .update({
      state: 'ended',
      ended_at: endedAt.toISOString(),
      duration_minutes: durationMinutes,
      dropped_reason: reason === 'manual' ? null : reason
    })
    .eq('id', sessionId)
    .select()
    .single();
}

/**
 * Reset a device's state to idle (use when device is stuck in "running" state)
 * @param {string} deviceId - Device ID to reset
 * @returns {Promise} Updated device
 */
export async function resetDeviceState(deviceId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('resetDeviceState: Not authenticated');
    return { error: new Error('Not authenticated') };
  }

  console.log('resetDeviceState: Starting for device', deviceId, 'user', user.id);

  // First, end any running sessions for this device
  const { data: runningSessions, error: sessionsError } = await supabase
    .from('irrigation_sessions')
    .select('id, started_at')
    .eq('device_id', deviceId)
    .eq('user_id', user.id)
    .eq('state', 'running');

  console.log('resetDeviceState: Found running sessions', runningSessions, sessionsError);

  if (runningSessions && runningSessions.length > 0) {
    for (const session of runningSessions) {
      const endedAt = new Date();
      const durationMinutes = (endedAt - new Date(session.started_at)) / (1000 * 60);

      const { data: updatedSession, error: updateError } = await supabase
        .from('irrigation_sessions')
        .update({
          state: 'ended',
          ended_at: endedAt.toISOString(),
          duration_minutes: durationMinutes
        })
        .eq('id', session.id)
        .select()
        .single();

      console.log('resetDeviceState: Ended session', session.id, 'result:', updatedSession, 'error:', updateError);
    }
  }

  // Reset the device state
  const { data: deviceData, error: deviceError } = await supabase
    .from('irrigation_devices')
    .update({
      current_state: 'idle',
      current_session_id: null
    })
    .eq('id', deviceId)
    .eq('user_id', user.id)
    .select()
    .single();

  console.log('resetDeviceState: Updated device', deviceData, deviceError);

  return { data: deviceData, error: deviceError };
}

/**
 * End all stuck sessions (sessions running for more than specified hours)
 * @param {number} hoursThreshold - End sessions running longer than this (default 4 hours)
 * @returns {Promise} Count of ended sessions
 */
export async function endAllStuckSessions(hoursThreshold = 4) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  const cutoffTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

  // Find stuck sessions
  const { data: stuckSessions, error: fetchError } = await supabase
    .from('irrigation_sessions')
    .select('id, started_at')
    .eq('user_id', user.id)
    .eq('state', 'running')
    .lt('started_at', cutoffTime.toISOString());

  if (fetchError) return { error: fetchError };
  if (!stuckSessions || stuckSessions.length === 0) {
    return { data: { count: 0, sessions: [] }, error: null };
  }

  // End each stuck session
  const results = [];
  for (const session of stuckSessions) {
    const result = await endStuckSession(session.id, 'timeout');
    results.push(result);
  }

  return {
    data: {
      count: stuckSessions.length,
      sessions: results.map(r => r.data).filter(Boolean)
    },
    error: null
  };
}

/**
 * Get session statistics for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} blockId - Optional block filter
 * @returns {Promise} Session statistics
 */
export async function getSessionStats(startDate, endDate, blockId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: null };

  let query = supabase
    .from('irrigation_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('state', 'ended')
    .gte('started_at', startDate.toISOString())
    .lte('ended_at', endDate.toISOString());

  if (blockId) query = query.eq('block_id', blockId);

  const { data: sessions, error } = await query;

  if (error || !sessions) return { data: null, error };

  // Calculate statistics
  const stats = {
    sessionCount: sessions.length,
    totalGallons: sessions.reduce((sum, s) => sum + (s.total_gallons || 0), 0),
    totalMinutes: sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
    avgFlowRate: 0,
    peakFlowRate: 0,
    byDevice: {},
    byBlock: {}
  };

  if (sessions.length > 0) {
    stats.avgFlowRate = sessions.reduce((sum, s) => sum + (s.avg_flow_rate_gpm || 0), 0) / sessions.length;
    stats.peakFlowRate = Math.max(...sessions.map(s => s.peak_flow_rate_gpm || 0));

    // Group by device
    sessions.forEach(s => {
      if (!stats.byDevice[s.device_id]) {
        stats.byDevice[s.device_id] = { count: 0, gallons: 0, minutes: 0 };
      }
      stats.byDevice[s.device_id].count++;
      stats.byDevice[s.device_id].gallons += s.total_gallons || 0;
      stats.byDevice[s.device_id].minutes += s.duration_minutes || 0;

      // Group by block
      if (s.block_id) {
        if (!stats.byBlock[s.block_id]) {
          stats.byBlock[s.block_id] = { count: 0, gallons: 0, minutes: 0 };
        }
        stats.byBlock[s.block_id].count++;
        stats.byBlock[s.block_id].gallons += s.total_gallons || 0;
        stats.byBlock[s.block_id].minutes += s.duration_minutes || 0;
      }
    });
  }

  return { data: stats, error: null };
}

// =====================================================
// DEVICE ALERTS
// =====================================================

/**
 * List active (unresolved) alerts
 * @returns {Promise} Unresolved alerts
 */
export async function listActiveAlerts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('device_alerts')
    .select(`
      *,
      device:irrigation_devices(id, device_name, device_type),
      zone_mapping:device_zone_mappings(id, zone_number, zone_name,
        block:vineyard_blocks(id, name)
      )
    `)
    .eq('user_id', user.id)
    .is('resolved_at', null)
    .order('created_at', { ascending: false });
}

/**
 * List all alerts with optional filters
 * @param {Object} options - Filter options
 * @param {string} options.deviceId - Filter by device
 * @param {string} options.alertType - Filter by type
 * @param {boolean} options.unresolvedOnly - Only show unresolved
 * @param {number} options.limit - Limit results
 * @returns {Promise} Alerts
 */
export async function listAlerts({
  deviceId,
  alertType,
  unresolvedOnly = false,
  limit = 100
} = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('device_alerts')
    .select(`
      *,
      device:irrigation_devices(id, device_name, device_type),
      zone_mapping:device_zone_mappings(id, zone_number, zone_name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (deviceId) query = query.eq('device_id', deviceId);
  if (alertType) query = query.eq('alert_type', alertType);
  if (unresolvedOnly) query = query.is('resolved_at', null);

  return query;
}

/**
 * Acknowledge an alert
 * @param {string} alertId - Alert ID
 * @returns {Promise} Updated alert
 */
export async function acknowledgeAlert(alertId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  return supabase
    .from('device_alerts')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id
    })
    .eq('id', alertId)
    .select()
    .single();
}

/**
 * Resolve an alert
 * @param {string} alertId - Alert ID
 * @param {string} notes - Resolution notes
 * @returns {Promise} Updated alert
 */
export async function resolveAlert(alertId, notes = '') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  return supabase
    .from('device_alerts')
    .update({
      resolved_at: new Date().toISOString(),
      resolution_notes: notes,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id
    })
    .eq('id', alertId)
    .select()
    .single();
}

/**
 * Get count of unacknowledged alerts
 * @returns {Promise<number>} Count of unacknowledged alerts
 */
export async function getUnacknowledgedAlertCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { count: 0, error: null };

  const { count, error } = await supabase
    .from('device_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('resolved_at', null)
    .is('acknowledged_at', null);

  return { count: count || 0, error };
}

// =====================================================
// DEVICE THRESHOLD CONFIGURATION
// =====================================================

/**
 * Update device flow thresholds
 * @param {string} deviceId - Device ID
 * @param {Object} thresholds - Threshold configuration
 * @returns {Promise} Updated device
 */
export async function updateDeviceThresholds(deviceId, {
  flow_start_threshold_gpm,
  flow_stop_threshold_gpm,
  min_session_duration_minutes,
  min_session_gallons,
  offline_threshold_minutes,
  consecutive_start_readings,
  consecutive_stop_readings
}) {
  const updates = {};

  if (flow_start_threshold_gpm !== undefined) updates.flow_start_threshold_gpm = flow_start_threshold_gpm;
  if (flow_stop_threshold_gpm !== undefined) updates.flow_stop_threshold_gpm = flow_stop_threshold_gpm;
  if (min_session_duration_minutes !== undefined) updates.min_session_duration_minutes = min_session_duration_minutes;
  if (min_session_gallons !== undefined) updates.min_session_gallons = min_session_gallons;
  if (offline_threshold_minutes !== undefined) updates.offline_threshold_minutes = offline_threshold_minutes;
  if (consecutive_start_readings !== undefined) updates.consecutive_start_readings = consecutive_start_readings;
  if (consecutive_stop_readings !== undefined) updates.consecutive_stop_readings = consecutive_stop_readings;

  return supabase
    .from('irrigation_devices')
    .update(updates)
    .eq('id', deviceId)
    .select()
    .single();
}

/**
 * Configure HMAC authentication for a device
 * @param {string} deviceId - Device ID
 * @param {boolean} enable - Enable or disable HMAC
 * @returns {Promise} Updated device with HMAC secret
 */
export async function configureDeviceHMAC(deviceId, enable = true) {
  if (enable) {
    // Generate a new HMAC secret
    const hmacSecret = crypto.randomUUID() + crypto.randomUUID();

    return supabase
      .from('irrigation_devices')
      .update({
        auth_method: 'hmac',
        hmac_secret: hmacSecret
      })
      .eq('id', deviceId)
      .select()
      .single();
  } else {
    return supabase
      .from('irrigation_devices')
      .update({
        auth_method: 'token',
        hmac_secret: null
      })
      .eq('id', deviceId)
      .select()
      .single();
  }
}

// =====================================================
// ANALYTICS & REPORTING
// =====================================================

/**
 * Get water usage summary for dashboard
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise} Usage summary
 */
export async function getWaterUsageSummary(startDate, endDate) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: null };

  // Get sessions for the period
  const { data: sessions, error } = await supabase
    .from('irrigation_sessions')
    .select(`
      *,
      block:vineyard_blocks(id, name, acres)
    `)
    .eq('user_id', user.id)
    .eq('state', 'ended')
    .gte('started_at', startDate.toISOString())
    .lte('ended_at', endDate.toISOString());

  if (error || !sessions) return { data: null, error };

  // Calculate totals
  const totalGallons = sessions.reduce((sum, s) => sum + (s.total_gallons || 0), 0);
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  // Calculate per-block usage
  const blockUsage = {};
  sessions.forEach(s => {
    if (s.block_id) {
      if (!blockUsage[s.block_id]) {
        blockUsage[s.block_id] = {
          block: s.block,
          gallons: 0,
          minutes: 0,
          sessions: 0
        };
      }
      blockUsage[s.block_id].gallons += s.total_gallons || 0;
      blockUsage[s.block_id].minutes += s.duration_minutes || 0;
      blockUsage[s.block_id].sessions++;
    }
  });

  // Calculate per-block gallons per acre
  Object.values(blockUsage).forEach(usage => {
    if (usage.block?.acres) {
      usage.gallonsPerAcre = usage.gallons / usage.block.acres;
    }
  });

  // Daily breakdown
  const dailyUsage = {};
  sessions.forEach(s => {
    const date = s.started_at.split('T')[0];
    if (!dailyUsage[date]) {
      dailyUsage[date] = { gallons: 0, minutes: 0, sessions: 0 };
    }
    dailyUsage[date].gallons += s.total_gallons || 0;
    dailyUsage[date].minutes += s.duration_minutes || 0;
    dailyUsage[date].sessions++;
  });

  return {
    data: {
      totalGallons,
      totalMinutes,
      totalHours: totalMinutes / 60,
      sessionCount: sessions.length,
      byBlock: Object.values(blockUsage),
      byDay: Object.entries(dailyUsage).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date))
    },
    error: null
  };
}

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to latest flow readings updates
 * @param {Function} callback - Called when data changes
 * @returns {Object} Subscription to unsubscribe from
 */
export function subscribeToLatestReadings(callback) {
  return supabase
    .channel('flow_readings_latest_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'flow_readings_latest' },
      (payload) => callback(payload)
    )
    .subscribe();
}

/**
 * Subscribe to active alerts
 * @param {Function} callback - Called when alerts change
 * @returns {Object} Subscription to unsubscribe from
 */
export function subscribeToAlerts(callback) {
  return supabase
    .channel('device_alerts_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'device_alerts' },
      (payload) => callback(payload)
    )
    .subscribe();
}

/**
 * Subscribe to active sessions
 * @param {Function} callback - Called when sessions change
 * @returns {Object} Subscription to unsubscribe from
 */
export function subscribeToSessions(callback) {
  return supabase
    .channel('irrigation_sessions_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'irrigation_sessions' },
      (payload) => callback(payload)
    )
    .subscribe();
}
