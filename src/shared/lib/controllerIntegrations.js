import { supabase } from './supabaseClient';
import { createIrrigationEvent } from './irrigationApi';

/* ================================================================
   IRRIGATION CONTROLLER INTEGRATIONS
   Support for Baseline, Hunter Hydrawise, Rachio, RainMachine, etc.
================================================================ */

// =====================================================
// CONTROLLER MANAGEMENT
// =====================================================

/**
 * List irrigation controllers for current user
 * @param {boolean} activeOnly - Only return active controllers
 * @returns {Promise} Supabase query response
 */
export async function listControllers(activeOnly = true) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('irrigation_controllers')
    .select('*')
    .eq('user_id', user.id)
    .order('controller_name', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  return query;
}

/**
 * Get a single controller by ID
 * @param {string} controllerId - Controller ID
 * @returns {Promise} Supabase query response
 */
export async function getController(controllerId) {
  return supabase
    .from('irrigation_controllers')
    .select('*')
    .eq('id', controllerId)
    .single();
}

/**
 * Create a new controller
 * @param {Object} controller - Controller configuration
 * @returns {Promise} Supabase query response
 */
export async function createController(controller) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('irrigation_controllers')
    .insert({ ...controller, user_id: user.id })
    .select()
    .single();
}

/**
 * Update a controller
 * @param {string} controllerId - Controller ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} Supabase query response
 */
export async function updateController(controllerId, updates) {
  return supabase
    .from('irrigation_controllers')
    .update(updates)
    .eq('id', controllerId)
    .select()
    .single();
}

/**
 * Delete a controller
 * @param {string} controllerId - Controller ID
 * @returns {Promise} Supabase query response
 */
export async function deleteController(controllerId) {
  return supabase
    .from('irrigation_controllers')
    .delete()
    .eq('id', controllerId);
}

// =====================================================
// BASELINE IRRIGATION CONTROLLER
// https://baselineirrigationcontroller.com/
// =====================================================

/**
 * Sync irrigation events from Baseline controller
 * @param {string} controllerId - Controller ID in database
 * @param {string} baselineApiKey - Baseline API key
 * @param {string} baselineControllerId - Baseline controller ID
 * @param {string} startDate - Start date for sync (YYYY-MM-DD)
 * @param {string} endDate - End date for sync (YYYY-MM-DD)
 * @returns {Promise} Sync results with event count
 */
export async function syncBaselineController(controllerId, baselineApiKey, baselineControllerId, startDate, endDate) {
  try {
    // Baseline API endpoint (example - adjust based on actual API)
    const apiUrl = `https://api.baseline.ag/v1/controllers/${baselineControllerId}/events`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${baselineApiKey}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate
      })
    });

    if (!response.ok) {
      throw new Error(`Baseline API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform Baseline events to our format
    const events = data.events || [];
    let importedCount = 0;

    for (const event of events) {
      // Map Baseline zone to vineyard block
      // This would need configuration to map zone_id to block_id
      const blockId = await mapBaselineZoneToBlock(event.zone_id, controllerId);

      if (!blockId) {
        console.warn(`No block mapping for Baseline zone ${event.zone_id}`);
        continue;
      }

      // Create irrigation event
      const { error } = await createIrrigationEvent({
        block_id: blockId,
        event_date: event.start_time.split('T')[0],
        start_time: event.start_time,
        end_time: event.end_time,
        duration_hours: event.duration_minutes / 60,
        flow_rate_gpm: event.flow_rate || null,
        total_water_gallons: event.total_gallons || null,
        irrigation_method: 'Drip', // Default, could be configured
        is_automated: true,
        controller_id: controllerId,
        notes: `Imported from Baseline controller ${baselineControllerId}`
      });

      if (!error) importedCount++;
    }

    // Update last sync time
    await updateController(controllerId, {
      last_sync_at: new Date().toISOString()
    });

    return {
      data: {
        imported: importedCount,
        total: events.length
      },
      error: null
    };

  } catch (error) {
    console.error('Error syncing Baseline controller:', error);
    return { data: null, error };
  }
}

// =====================================================
// HUNTER HYDRAWISE
// https://www.hydrawise.com/
// =====================================================

/**
 * Sync irrigation events from Hunter Hydrawise
 * @param {string} controllerId - Controller ID in database
 * @param {string} hydrawiseApiKey - Hydrawise API key
 * @param {string} startDate - Start date for sync
 * @param {string} endDate - End date for sync
 * @returns {Promise} Sync results
 */
export async function syncHydrawiseController(controllerId, hydrawiseApiKey, startDate, endDate) {
  try {
    // Hydrawise API v2 endpoint
    const apiUrl = 'https://api.hydrawise.com/api/v2/statusschedule.php';

    const response = await fetch(`${apiUrl}?api_key=${hydrawiseApiKey}`);

    if (!response.ok) {
      throw new Error(`Hydrawise API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Get historical watering logs
    const logsUrl = 'https://api.hydrawise.com/api/v2/waterlog.php';
    const logsResponse = await fetch(
      `${logsUrl}?api_key=${hydrawiseApiKey}&start=${startDate}&end=${endDate}`
    );

    const logsData = await logsResponse.json();

    let importedCount = 0;

    for (const log of logsData.waterlog || []) {
      const blockId = await mapHydrawiseRelayToBlock(log.relay_id, controllerId);

      if (!blockId) continue;

      const { error } = await createIrrigationEvent({
        block_id: blockId,
        event_date: log.time.split(' ')[0],
        duration_hours: log.run_seconds / 3600,
        irrigation_method: 'Drip',
        is_automated: true,
        controller_id: controllerId,
        notes: `Imported from Hydrawise: ${log.relay_name}`
      });

      if (!error) importedCount++;
    }

    await updateController(controllerId, {
      last_sync_at: new Date().toISOString()
    });

    return {
      data: { imported: importedCount, total: logsData.waterlog?.length || 0 },
      error: null
    };

  } catch (error) {
    console.error('Error syncing Hydrawise:', error);
    return { data: null, error };
  }
}

// =====================================================
// RACHIO
// https://rachio.com/
// =====================================================

/**
 * Sync irrigation events from Rachio smart controller
 * @param {string} controllerId - Controller ID in database
 * @param {string} rachioApiKey - Rachio API key (Bearer token)
 * @param {string} rachioDeviceId - Rachio device ID
 * @param {string} startDate - Start date for sync
 * @param {string} endDate - End date for sync
 * @returns {Promise} Sync results
 */
export async function syncRachioController(controllerId, rachioApiKey, rachioDeviceId, startDate, endDate) {
  try {
    // Rachio API v1 endpoint
    const apiUrl = `https://api.rach.io/1/public/device/${rachioDeviceId}`;

    // Get device info
    const deviceResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${rachioApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!deviceResponse.ok) {
      throw new Error(`Rachio API error: ${deviceResponse.statusText}`);
    }

    const deviceData = await deviceResponse.json();

    // Get zone run history
    // Note: Rachio uses webhooks for real-time data
    // For historical data, you may need to query their events endpoint
    const eventsUrl = `https://api.rach.io/1/public/device/${rachioDeviceId}/event`;

    const eventsResponse = await fetch(eventsUrl, {
      headers: {
        'Authorization': `Bearer ${rachioApiKey}`
      }
    });

    const eventsData = await eventsResponse.json();

    let importedCount = 0;

    for (const event of eventsData || []) {
      if (event.type !== 'ZONE_COMPLETED') continue;

      const blockId = await mapRachioZoneToBlock(event.zoneId, controllerId);

      if (!blockId) continue;

      const { error } = await createIrrigationEvent({
        block_id: blockId,
        event_date: new Date(event.startTime).toISOString().split('T')[0],
        start_time: event.startTime,
        end_time: event.endTime,
        duration_hours: event.duration / 3600,
        irrigation_method: 'Drip',
        is_automated: true,
        controller_id: controllerId,
        notes: `Imported from Rachio: Zone ${event.zoneName || event.zoneId}`
      });

      if (!error) importedCount++;
    }

    await updateController(controllerId, {
      last_sync_at: new Date().toISOString()
    });

    return {
      data: { imported: importedCount, total: eventsData?.length || 0 },
      error: null
    };

  } catch (error) {
    console.error('Error syncing Rachio:', error);
    return { data: null, error };
  }
}

// =====================================================
// RAINMACHINE
// https://www.rainmachine.com/
// =====================================================

/**
 * Sync irrigation events from RainMachine controller
 * @param {string} controllerId - Controller ID in database
 * @param {string} rainmachineIp - Local IP address of RainMachine
 * @param {string} rainmachinePassword - RainMachine password
 * @param {string} startDate - Start date for sync
 * @param {string} endDate - End date for sync
 * @returns {Promise} Sync results
 */
export async function syncRainMachineController(controllerId, rainmachineIp, rainmachinePassword, startDate, endDate) {
  try {
    // RainMachine local API
    // First, get access token
    const loginUrl = `https://${rainmachineIp}:8080/api/4/auth/login`;

    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pwd: rainmachinePassword })
    });

    const { access_token } = await loginResponse.json();

    // Get watering log
    const logUrl = `https://${rainmachineIp}:8080/api/4/watering/log`;
    const logResponse = await fetch(logUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const logData = await logResponse.json();

    let importedCount = 0;

    for (const entry of logData.waterLog?.days || []) {
      for (const zone of entry.zones || []) {
        const blockId = await mapRainMachineZoneToBlock(zone.uid, controllerId);

        if (!blockId) continue;

        const { error } = await createIrrigationEvent({
          block_id: blockId,
          event_date: entry.date,
          duration_hours: zone.duration / 60,
          irrigation_method: 'Drip',
          is_automated: true,
          controller_id: controllerId,
          notes: `Imported from RainMachine: Zone ${zone.name || zone.uid}`
        });

        if (!error) importedCount++;
      }
    }

    await updateController(controllerId, {
      last_sync_at: new Date().toISOString()
    });

    return {
      data: { imported: importedCount },
      error: null
    };

  } catch (error) {
    console.error('Error syncing RainMachine:', error);
    return { data: null, error };
  }
}

// =====================================================
// ZONE/RELAY TO BLOCK MAPPING
// =====================================================

// Table: controller_zone_mappings (would need migration)
// Maps controller zones/relays to vineyard blocks

async function mapBaselineZoneToBlock(zoneId, controllerId) {
  const { data } = await supabase
    .from('controller_zone_mappings')
    .select('block_id')
    .eq('controller_id', controllerId)
    .eq('zone_id_external', zoneId)
    .single();

  return data?.block_id || null;
}

async function mapHydrawiseRelayToBlock(relayId, controllerId) {
  const { data } = await supabase
    .from('controller_zone_mappings')
    .select('block_id')
    .eq('controller_id', controllerId)
    .eq('zone_id_external', String(relayId))
    .single();

  return data?.block_id || null;
}

async function mapRachioZoneToBlock(zoneId, controllerId) {
  const { data } = await supabase
    .from('controller_zone_mappings')
    .select('block_id')
    .eq('controller_id', controllerId)
    .eq('zone_id_external', zoneId)
    .single();

  return data?.block_id || null;
}

async function mapRainMachineZoneToBlock(zoneUid, controllerId) {
  const { data } = await supabase
    .from('controller_zone_mappings')
    .select('block_id')
    .eq('controller_id', controllerId)
    .eq('zone_id_external', String(zoneUid))
    .single();

  return data?.block_id || null;
}

/**
 * Create zone to block mapping
 * @param {string} controllerId - Controller ID
 * @param {string} zoneIdExternal - Zone/relay ID from controller
 * @param {string} blockId - Vineyard block ID
 * @param {string} zoneName - Friendly name for zone
 * @returns {Promise} Supabase query response
 */
export async function createZoneMapping(controllerId, zoneIdExternal, blockId, zoneName = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('controller_zone_mappings')
    .insert({
      user_id: user.id,
      controller_id: controllerId,
      zone_id_external: zoneIdExternal,
      block_id: blockId,
      zone_name: zoneName
    })
    .select()
    .single();
}

/**
 * List zone mappings for a controller
 * @param {string} controllerId - Controller ID
 * @returns {Promise} Supabase query response
 */
export async function listZoneMappings(controllerId) {
  return supabase
    .from('controller_zone_mappings')
    .select(`
      *,
      vineyard_blocks(name, variety, acres)
    `)
    .eq('controller_id', controllerId)
    .order('zone_id_external', { ascending: true });
}
