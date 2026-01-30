import { supabase } from './supabaseClient';

/* ================================================================
   IRRIGATION HARDWARE API
   Manage irrigation controllers, flow meters, and device mappings
================================================================ */

// =====================================================
// IRRIGATION DEVICES
// =====================================================

/**
 * List all irrigation devices for current user
 * @returns {Promise} Supabase query response
 */
export async function listIrrigationDevices() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('irrigation_devices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
}

/**
 * Get a single irrigation device by ID
 * @param {string} deviceId - Device ID
 * @returns {Promise} Supabase query response
 */
export async function getIrrigationDevice(deviceId) {
  return supabase
    .from('irrigation_devices')
    .select('*')
    .eq('id', deviceId)
    .single();
}

/**
 * Create a new irrigation device
 * @param {Object} device - Device data
 * @returns {Promise} Supabase query response
 */
export async function createIrrigationDevice(device) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('irrigation_devices')
    .insert({
      ...device,
      user_id: user.id
    })
    .select()
    .single();
}

/**
 * Update an irrigation device
 * @param {string} deviceId - Device ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} Supabase query response
 */
export async function updateIrrigationDevice(deviceId, updates) {
  return supabase
    .from('irrigation_devices')
    .update(updates)
    .eq('id', deviceId)
    .select()
    .single();
}

/**
 * Delete an irrigation device
 * @param {string} deviceId - Device ID
 * @returns {Promise} Supabase query response
 */
export async function deleteIrrigationDevice(deviceId) {
  return supabase
    .from('irrigation_devices')
    .delete()
    .eq('id', deviceId);
}

/**
 * Update device last sync timestamp
 * @param {string} deviceId - Device ID
 * @returns {Promise} Supabase query response
 */
export async function updateDeviceLastSync(deviceId) {
  return supabase
    .from('irrigation_devices')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', deviceId);
}

// =====================================================
// DEVICE ZONE MAPPINGS
// =====================================================

/**
 * List zone mappings for a device
 * @param {string} deviceId - Device ID
 * @returns {Promise} Supabase query response with block details
 */
export async function listDeviceZoneMappings(deviceId) {
  return supabase
    .from('device_zone_mappings')
    .select(`
      *,
      block:vineyard_blocks(id, name, variety, acres)
    `)
    .eq('device_id', deviceId)
    .order('zone_number', { ascending: true });
}

/**
 * Get all zone mappings for current user
 * @returns {Promise} Supabase query response
 */
export async function listAllZoneMappings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('device_zone_mappings')
    .select(`
      *,
      device:irrigation_devices(id, device_name, device_type),
      block:vineyard_blocks(id, name, variety, acres)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
}

/**
 * Create a zone mapping
 * @param {Object} mapping - Zone mapping data
 * @returns {Promise} Supabase query response
 */
export async function createZoneMapping(mapping) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('device_zone_mappings')
    .insert({
      ...mapping,
      user_id: user.id
    })
    .select()
    .single();
}

/**
 * Update a zone mapping
 * @param {string} mappingId - Mapping ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} Supabase query response
 */
export async function updateZoneMapping(mappingId, updates) {
  return supabase
    .from('device_zone_mappings')
    .update(updates)
    .eq('id', mappingId)
    .select()
    .single();
}

/**
 * Delete a zone mapping
 * @param {string} mappingId - Mapping ID
 * @returns {Promise} Supabase query response
 */
export async function deleteZoneMapping(mappingId) {
  return supabase
    .from('device_zone_mappings')
    .delete()
    .eq('id', mappingId);
}

/**
 * Get zone mapping by device and zone number
 * @param {string} deviceId - Device ID
 * @param {number} zoneNumber - Zone number
 * @returns {Promise} Supabase query response
 */
export async function getZoneMappingByZoneNumber(deviceId, zoneNumber) {
  return supabase
    .from('device_zone_mappings')
    .select('*')
    .eq('device_id', deviceId)
    .eq('zone_number', zoneNumber)
    .single();
}

// =====================================================
// WEBHOOK HELPERS
// =====================================================

/**
 * Find device by webhook token
 * @param {string} webhookToken - Webhook authentication token
 * @returns {Promise} Supabase query response
 */
export async function findDeviceByWebhookToken(webhookToken) {
  return supabase
    .from('irrigation_devices')
    .select('*')
    .eq('webhook_token', webhookToken)
    .eq('is_active', true)
    .single();
}

/**
 * Process webhook irrigation event
 * Creates irrigation event from webhook data
 * @param {string} webhookToken - Webhook token for authentication
 * @param {Object} webhookData - Irrigation data from webhook
 * @returns {Promise} Created irrigation event
 */
export async function processWebhookIrrigationEvent(webhookToken, webhookData) {
  // Find device by webhook token
  const { data: device, error: deviceError } = await findDeviceByWebhookToken(webhookToken);

  if (deviceError || !device) {
    return { error: new Error('Invalid webhook token or device not found') };
  }

  // Find zone mapping
  const { data: zoneMapping, error: mappingError } = await getZoneMappingByZoneNumber(
    device.id,
    webhookData.zone_number
  );

  if (mappingError || !zoneMapping) {
    console.warn(`No zone mapping found for device ${device.id} zone ${webhookData.zone_number}`);
    return { error: new Error('Zone mapping not found') };
  }

  // Calculate irrigation data
  const startTime = new Date(webhookData.start_time);
  const endTime = new Date(webhookData.end_time);
  const durationHours = (endTime - startTime) / (1000 * 60 * 60);

  // Use total gallons from webhook or calculate from flow rate
  let totalGallons = webhookData.total_gallons;
  if (!totalGallons && webhookData.flow_rate_avg && durationHours) {
    totalGallons = webhookData.flow_rate_avg * 60 * durationHours;
  }
  if (!totalGallons && zoneMapping.flow_rate_gpm && durationHours) {
    totalGallons = zoneMapping.flow_rate_gpm * 60 * durationHours;
  }

  // Create irrigation event
  const { data: event, error: eventError } = await supabase
    .from('irrigation_events')
    .insert({
      user_id: device.user_id,
      block_id: zoneMapping.block_id,
      event_date: startTime.toISOString().split('T')[0],
      duration_hours: durationHours,
      flow_rate_gpm: webhookData.flow_rate_avg || zoneMapping.flow_rate_gpm,
      total_water_gallons: totalGallons,
      irrigation_method: zoneMapping.irrigation_method,
      source: 'webhook',
      device_id: device.id,
      zone_number: webhookData.zone_number,
      notes: `Auto-logged from ${device.device_name} (Zone ${webhookData.zone_number})`
    })
    .select()
    .single();

  if (eventError) {
    return { error: eventError };
  }

  // Update device last sync time
  await updateDeviceLastSync(device.id);

  return { data: event, error: null };
}

// =====================================================
// DEVICE TYPE HELPERS
// =====================================================

/**
 * Get supported device types with metadata
 */
export const DEVICE_TYPES = {
  rachio: {
    name: 'Rachio Smart Sprinkler',
    iconName: 'Droplets',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    supportsApi: true,
    supportsWebhook: true,
    setupInstructions: 'Get your API key from app.rach.io and configure webhooks...',
    recommended: true
  },
  hunter: {
    name: 'Hunter Hydrawise',
    iconName: 'Waves',
    iconColor: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    supportsApi: true,
    supportsWebhook: false,
    setupInstructions: 'Enter your Hydrawise API key from your account settings...'
  },
  flow_meter: {
    name: 'Flow Meter',
    iconName: 'Gauge',
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    supportsApi: false,
    supportsWebhook: true,
    setupInstructions: 'Configure your flow meter to send data to the webhook URL...'
  },
  custom: {
    name: 'Custom Webhook',
    iconName: 'Webhook',
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50',
    supportsApi: false,
    supportsWebhook: true,
    setupInstructions: 'Send POST requests to the webhook URL with irrigation data...'
  }
};

/**
 * Get the base URL for API/webhook calls
 * Uses custom API domain if available, falls back to Supabase URL
 */
function getApiBaseUrl() {
  return import.meta.env.VITE_API_DOMAIN || import.meta.env.VITE_SUPABASE_URL;
}

/**
 * Generate webhook URL for a device
 * @param {string} webhookToken - Device webhook token
 * @returns {string} Full webhook URL
 */
export function generateWebhookUrl(webhookToken) {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/functions/v1/irrigation-webhook?token=${webhookToken}`;
}

/**
 * Generate webhook URL for flow meter (uses the new flow-meter-webhook)
 * @param {string} webhookToken - Device webhook token
 * @returns {string} Full webhook URL for flow meter
 */
export function generateFlowMeterWebhookUrl(webhookToken) {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/functions/v1/flow-meter-webhook?token=${webhookToken}`;
}

// =====================================================
// DEVICE CONFIGURATION
// =====================================================

/**
 * Update device flow detection thresholds
 * @param {string} deviceId - Device ID
 * @param {Object} thresholds - Threshold configuration
 * @returns {Promise} Updated device
 */
export async function updateDeviceThresholds(deviceId, thresholds) {
  const validKeys = [
    'flow_start_threshold_gpm',
    'flow_stop_threshold_gpm',
    'min_session_duration_minutes',
    'min_session_gallons',
    'offline_threshold_minutes',
    'consecutive_start_readings',
    'consecutive_stop_readings'
  ];

  const updates = {};
  validKeys.forEach(key => {
    if (thresholds[key] !== undefined) {
      updates[key] = thresholds[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    return { data: null, error: new Error('No valid threshold values provided') };
  }

  return supabase
    .from('irrigation_devices')
    .update(updates)
    .eq('id', deviceId)
    .select()
    .single();
}

/**
 * Reset device state (useful for debugging)
 * Clears current session and resets to idle
 * @param {string} deviceId - Device ID
 * @returns {Promise} Updated device
 */
export async function resetDeviceState(deviceId) {
  return supabase
    .from('irrigation_devices')
    .update({
      current_state: 'idle',
      current_session_id: null,
      consecutive_flow_readings: 0
    })
    .eq('id', deviceId)
    .select()
    .single();
}
