import { supabase } from './supabaseClient';

/* ================================================================
   PRODUCTION API
   Supabase CRUD helpers for winery production management
================================================================ */

// =====================================================
// PRODUCTION CONTAINERS (Tanks, Barrels, Vessels)
// =====================================================

export async function listContainers() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('production_containers')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });
}

export async function getContainer(containerId) {
  return supabase
    .from('production_containers')
    .select('*')
    .eq('id', containerId)
    .single();
}

export async function createContainer(container) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('production_containers')
    .insert({ ...container, user_id: user.id })
    .select()
    .single();
}

export async function updateContainer(containerId, updates) {
  return supabase
    .from('production_containers')
    .update(updates)
    .eq('id', containerId)
    .select()
    .single();
}

export async function deleteContainer(containerId) {
  return supabase
    .from('production_containers')
    .delete()
    .eq('id', containerId);
}

export async function getAvailableContainers(minCapacityGallons = 0) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('production_containers')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'empty')
    .gte('capacity_gallons', minCapacityGallons)
    .order('capacity_gallons', { ascending: true });
}

// =====================================================
// PRODUCTION LOTS
// =====================================================

export async function listLots(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('production_lots')
    .select(`
      *,
      container:production_containers(id, name, type, capacity_gallons),
      block:vineyard_blocks(id, name, acres)
    `)
    .eq('user_id', user.id)
    .is('archived_at', null);

  // Apply filters
  if (filters.vintage) {
    query = query.eq('vintage', filters.vintage);
  }
  if (filters.varietal) {
    query = query.eq('varietal', filters.varietal);
  }
  if (filters.status) {
    // Support both comma-separated string and array
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : filters.status.split(',').map(s => s.trim());
    query = query.in('status', statuses);
  }
  if (filters.blockId) {
    query = query.eq('block_id', filters.blockId);
  }

  return query.order('created_at', { ascending: false });
}

export async function getLot(lotId) {
  return supabase
    .from('production_lots')
    .select(`
      *,
      container:production_containers(id, name, type, capacity_gallons, location),
      block:vineyard_blocks(id, name, acres, variety, clone),
      fermentation_logs(*)
    `)
    .eq('id', lotId)
    .single();
}

export async function createLot(lot) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('production_lots')
    .insert({ ...lot, user_id: user.id })
    .select()
    .single();
}

export async function updateLot(lotId, updates) {
  return supabase
    .from('production_lots')
    .update(updates)
    .eq('id', lotId)
    .select()
    .single();
}

export async function deleteLot(lotId) {
  // First, get the lot to check if it's a child lot with a parent
  const { data: lot, error: fetchError } = await supabase
    .from('production_lots')
    .select('parent_lot_id, current_volume_gallons, name')
    .eq('id', lotId)
    .single();

  if (fetchError) {
    console.error('Error fetching lot for deletion:', fetchError);
    return { error: fetchError };
  }

  // If this lot has a parent, restore the volume to the parent
  if (lot.parent_lot_id) {
    const volumeToRestore = lot.current_volume_gallons || 0;

    // Get parent lot's current volume
    const { data: parentLot, error: parentFetchError } = await supabase
      .from('production_lots')
      .select('current_volume_gallons, notes, name')
      .eq('id', lot.parent_lot_id)
      .single();

    if (parentFetchError) {
      console.error('Error fetching parent lot:', parentFetchError);
      return { error: parentFetchError };
    }

    // Restore volume to parent
    const newParentVolume = (parentLot.current_volume_gallons || 0) + volumeToRestore;
    const deletionNote = `\n\n--- BATCH DELETED ---\nDate: ${new Date().toLocaleDateString()}\nDeleted child lot: ${lot.name}\nVolume restored: ${volumeToRestore} gallons\nNew total: ${newParentVolume} gallons`;

    const { error: updateError } = await supabase
      .from('production_lots')
      .update({
        current_volume_gallons: newParentVolume,
        notes: parentLot.notes ? `${parentLot.notes}${deletionNote}` : deletionNote
      })
      .eq('id', lot.parent_lot_id);

    if (updateError) {
      console.error('Error updating parent lot:', updateError);
      return { error: updateError };
    }
  }

  // Now delete the lot
  return supabase
    .from('production_lots')
    .delete()
    .eq('id', lotId);
}

export async function archiveLot(lotId) {
  return supabase
    .from('production_lots')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', lotId)
    .select()
    .single();
}

export async function getActiveFermentations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('production_lots')
    .select(`
      *,
      container:production_containers(id, name, type),
      fermentation_logs(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'fermenting')
    .is('archived_at', null)
    .order('harvest_date', { ascending: false });
}

export async function getLotsByVintage(vintage) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('production_lots')
    .select('*')
    .eq('user_id', user.id)
    .eq('vintage', vintage)
    .is('archived_at', null)
    .order('varietal', { ascending: true });
}

// =====================================================
// FERMENTATION LOGS
// =====================================================

export async function listFermentationLogs(lotId) {
  return supabase
    .from('fermentation_logs')
    .select('*')
    .eq('lot_id', lotId)
    .order('log_date', { ascending: false });
}

export async function createFermentationLog(log) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('fermentation_logs')
    .insert({ ...log, user_id: user.id, created_by: user.id })
    .select()
    .single();
}

export async function updateFermentationLog(logId, updates) {
  return supabase
    .from('fermentation_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single();
}

export async function deleteFermentationLog(logId) {
  return supabase
    .from('fermentation_logs')
    .delete()
    .eq('id', logId);
}

export async function getLatestFermentationLog(lotId) {
  return supabase
    .from('fermentation_logs')
    .select('*')
    .eq('lot_id', lotId)
    .order('log_date', { ascending: false })
    .limit(1)
    .single();
}

// =====================================================
// BLEND COMPONENTS
// =====================================================

export async function listBlendComponents(blendLotId) {
  return supabase
    .from('blend_components')
    .select(`
      *,
      component_lot:production_lots!component_lot_id(id, name, varietal, vintage)
    `)
    .eq('blend_lot_id', blendLotId);
}

export async function createBlendComponent(blendComponent) {
  return supabase
    .from('blend_components')
    .insert(blendComponent)
    .select()
    .single();
}

export async function deleteBlendComponent(componentId) {
  return supabase
    .from('blend_components')
    .delete()
    .eq('id', componentId);
}

// =====================================================
// LOT STATUS SYNCHRONIZATION
// =====================================================

// Status hierarchy (later statuses are "more advanced")
const STATUS_HIERARCHY = [
  'planning',
  'harvested',
  'crushing',
  'fermenting',
  'pressed',
  'aging',
  'blending',
  'filtering',
  'bottled',
  'archived'
];

// Sync parent lot status based on children's most advanced status
export async function syncParentLotStatus(parentLotId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  // Get parent lot
  const { data: parentLot, error: parentError } = await supabase
    .from('production_lots')
    .select('*')
    .eq('id', parentLotId)
    .single();

  if (parentError) return { error: parentError };

  // Get all children of this parent
  const { data: children, error: childrenError } = await supabase
    .from('production_lots')
    .select('*')
    .eq('parent_lot_id', parentLotId)
    .is('archived_at', null);

  if (childrenError) return { error: childrenError };

  if (!children || children.length === 0) {
    // No children, nothing to sync
    return { data: parentLot, error: null };
  }

  // Find the most advanced status among children
  const childStatuses = children.map(c => c.status);
  const mostAdvancedStatus = STATUS_HIERARCHY
    .slice()
    .reverse()
    .find(status => childStatuses.includes(status));

  // Get parent's current status index
  const parentStatusIndex = STATUS_HIERARCHY.indexOf(parentLot.status);
  const childStatusIndex = STATUS_HIERARCHY.indexOf(mostAdvancedStatus);

  // Only update if child is more advanced than parent
  if (childStatusIndex > parentStatusIndex) {
    const { data, error } = await supabase
      .from('production_lots')
      .update({
        status: mostAdvancedStatus,
        notes: parentLot.notes
          ? `${parentLot.notes}\n\n--- AUTO-SYNC ---\nDate: ${new Date().toLocaleDateString()}\nStatus updated to "${mostAdvancedStatus}" to match child lot progression`
          : `--- AUTO-SYNC ---\nDate: ${new Date().toLocaleDateString()}\nStatus updated to "${mostAdvancedStatus}" to match child lot progression`
      })
      .eq('id', parentLotId)
      .select()
      .single();

    return { data, error };
  }

  return { data: parentLot, error: null };
}

// Sync all parent lots in the system
export async function syncAllParentLotStatuses() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  // Get all lots that are parents (have children)
  const { data: allLots, error: lotsError } = await supabase
    .from('production_lots')
    .select('id, parent_lot_id')
    .eq('user_id', user.id)
    .is('archived_at', null);

  if (lotsError) return { error: lotsError };

  // Find unique parent IDs
  const parentIds = [...new Set(allLots
    .filter(lot => lot.parent_lot_id)
    .map(lot => lot.parent_lot_id))];

  // Sync each parent
  const results = [];
  for (const parentId of parentIds) {
    const result = await syncParentLotStatus(parentId);
    results.push(result);
  }

  return {
    data: {
      synced: results.filter(r => !r.error).length,
      errors: results.filter(r => r.error).length
    },
    error: null
  };
}

// =====================================================
// DASHBOARD / ANALYTICS
// =====================================================

export async function getProductionDashboardData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  // Get summary counts by status
  const { data: lots, error: lotsError } = await supabase
    .from('production_lots')
    .select('status, current_volume_gallons')
    .eq('user_id', user.id)
    .is('archived_at', null);

  if (lotsError) return { data: null, error: lotsError };

  // Get container utilization
  const { data: containers, error: containersError } = await supabase
    .from('production_containers')
    .select('type, capacity_gallons, current_volume_gallons, status')
    .eq('user_id', user.id);

  if (containersError) return { data: null, error: containersError };

  // Calculate summary statistics
  const lotsByStatus = lots.reduce((acc, lot) => {
    acc[lot.status] = (acc[lot.status] || 0) + 1;
    return acc;
  }, {});

  const totalVolume = lots.reduce((sum, lot) => sum + (lot.current_volume_gallons || 0), 0);

  const containerUtilization = containers.reduce((acc, container) => {
    const utilization = container.capacity_gallons > 0
      ? (container.current_volume_gallons / container.capacity_gallons) * 100
      : 0;
    acc.push({ ...container, utilization });
    return acc;
  }, []);

  return {
    data: {
      lotsByStatus,
      totalVolume,
      totalLots: lots.length,
      containers: containerUtilization,
      emptyContainers: containers.filter(c => c.status === 'empty').length,
      totalCapacity: containers.reduce((sum, c) => sum + c.capacity_gallons, 0)
    },
    error: null
  };
}

// =====================================================
// TEMPERATURE SENSORS (IoT Integration)
// =====================================================

export async function listSensors(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('temperature_sensors')
    .select(`
      *,
      container:production_containers(id, name, type),
      lot:production_lots(id, name, varietal, vintage)
    `)
    .eq('user_id', user.id);

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.container_id) {
    query = query.eq('container_id', filters.container_id);
  }
  if (filters.lot_id) {
    query = query.eq('lot_id', filters.lot_id);
  }

  return query.order('created_at', { ascending: false });
}

export async function getSensor(sensorId) {
  return supabase
    .from('temperature_sensors')
    .select(`
      *,
      container:production_containers(id, name, type, capacity_gallons),
      lot:production_lots(id, name, varietal, vintage, status)
    `)
    .eq('id', sensorId)
    .single();
}

export async function createSensor(sensor) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('temperature_sensors')
    .insert({ ...sensor, user_id: user.id })
    .select()
    .single();
}

export async function updateSensor(sensorId, updates) {
  return supabase
    .from('temperature_sensors')
    .update(updates)
    .eq('id', sensorId)
    .select()
    .single();
}

export async function deleteSensor(sensorId) {
  return supabase
    .from('temperature_sensors')
    .delete()
    .eq('id', sensorId);
}

export async function regenerateSensorApiKey(sensorId) {
  const newApiKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return supabase
    .from('temperature_sensors')
    .update({ api_key: newApiKey })
    .eq('id', sensorId)
    .select()
    .single();
}

// =====================================================
// TEMPERATURE READINGS
// =====================================================

export async function getLatestReading(sensorId) {
  return supabase
    .from('temperature_readings')
    .select('*')
    .eq('sensor_id', sensorId)
    .order('reading_timestamp', { ascending: false })
    .limit(1)
    .single();
}

export async function getReadingHistory(sensorId, hoursBack = 24) {
  const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

  return supabase
    .from('temperature_readings')
    .select('*')
    .eq('sensor_id', sensorId)
    .gte('reading_timestamp', startTime)
    .order('reading_timestamp', { ascending: true });
}

export async function getLotReadings(lotId, hoursBack = 72) {
  const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

  return supabase
    .from('temperature_readings')
    .select(`
      *,
      sensor:temperature_sensors(id, name, sensor_type)
    `)
    .eq('lot_id', lotId)
    .gte('reading_timestamp', startTime)
    .order('reading_timestamp', { ascending: true });
}

export async function recordTemperatureReading(reading) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('temperature_readings')
    .insert({ ...reading, user_id: user.id })
    .select()
    .single();
}

// =====================================================
// ALERT RULES
// =====================================================

export async function listAlertRules(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('temperature_alert_rules')
    .select(`
      *,
      sensor:temperature_sensors(id, name, sensor_type),
      lot:production_lots(id, name, varietal),
      container:production_containers(id, name, type)
    `)
    .eq('user_id', user.id);

  if (filters.enabled !== undefined) {
    query = query.eq('enabled', filters.enabled);
  }

  return query.order('created_at', { ascending: false });
}

export async function createAlertRule(rule) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('temperature_alert_rules')
    .insert({ ...rule, user_id: user.id })
    .select()
    .single();
}

export async function updateAlertRule(ruleId, updates) {
  return supabase
    .from('temperature_alert_rules')
    .update(updates)
    .eq('id', ruleId)
    .select()
    .single();
}

export async function deleteAlertRule(ruleId) {
  return supabase
    .from('temperature_alert_rules')
    .delete()
    .eq('id', ruleId);
}

// =====================================================
// ALERT HISTORY
// =====================================================

export async function getAlertHistory(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('temperature_alert_history')
    .select(`
      *,
      sensor:temperature_sensors(id, name, sensor_type),
      alert_rule:temperature_alert_rules(id, name)
    `)
    .eq('user_id', user.id);

  if (filters.acknowledged !== undefined) {
    query = query.eq('acknowledged', filters.acknowledged);
  }

  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }

  return query.order('created_at', { ascending: false }).limit(100);
}

export async function acknowledgeAlert(alertId, notes) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('temperature_alert_history')
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
      resolution_notes: notes
    })
    .eq('id', alertId)
    .select()
    .single();
}

// =====================================================
// VESSEL HISTORY & ANALYTICS
// =====================================================

/**
 * Create a vessel history event
 * @param {Object} event - Event details
 * @param {string} event.container_id - Container UUID
 * @param {string} event.event_type - Type: fill, empty, cip, maintenance, etc.
 * @param {number} event.volume_before - Volume before event
 * @param {number} event.volume_after - Volume after event
 * @param {string} event.lot_id - Optional lot UUID
 * @param {string} event.cip_product - Optional CIP product for cleaning events
 * @param {string} event.maintenance_type - Optional maintenance type
 * @param {number} event.cost - Optional cost of maintenance/repair
 * @param {string} event.notes - Optional notes
 */
export async function createVesselHistoryEvent(event) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  const volume_change = event.volume_after !== undefined && event.volume_before !== undefined
    ? event.volume_after - event.volume_before
    : null;

  return supabase
    .from('vessel_history')
    .insert({
      ...event,
      user_id: user.id,
      performed_by: user.id,
      volume_change,
      event_date: event.event_date || new Date().toISOString()
    })
    .select()
    .single();
}

/**
 * Get vessel history for a specific container
 * @param {string} containerId - Container UUID
 * @param {Object} options - Query options
 * @param {number} options.limit - Limit number of results (default: 100)
 * @param {string} options.event_type - Filter by event type
 */
export async function getVesselHistory(containerId, options = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('vessel_history')
    .select(`
      *,
      lot:production_lots(name, varietal, vintage)
    `)
    .eq('user_id', user.id)
    .eq('container_id', containerId)
    .order('event_date', { ascending: false });

  if (options.event_type) {
    query = query.eq('event_type', options.event_type);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  } else {
    query = query.limit(100);
  }

  return query;
}

/**
 * Get all vessel history events for a user
 * @param {Object} options - Query options
 */
export async function getAllVesselHistory(options = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('vessel_history')
    .select(`
      *,
      container:production_containers(name, type),
      lot:production_lots(name, varietal, vintage)
    `)
    .eq('user_id', user.id)
    .order('event_date', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  } else {
    query = query.limit(50);
  }

  return query;
}

/**
 * Get vessel analytics for a specific container
 * @param {string} containerId - Container UUID
 */
export async function getVesselAnalytics(containerId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: null };

  return supabase
    .from('vessel_analytics')
    .select('*')
    .eq('id', containerId)
    .eq('user_id', user.id)
    .single();
}

/**
 * Get all vessel analytics for a user
 */
export async function getAllVesselAnalytics() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('vessel_analytics')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });
}

/**
 * Log a lot assignment to a vessel
 * @param {string} containerId - Container UUID
 * @param {string} lotId - Lot UUID
 * @param {number} volume - Volume being assigned
 */
export async function logLotAssignment(containerId, lotId, volume) {
  return createVesselHistoryEvent({
    container_id: containerId,
    event_type: 'lot_assigned',
    lot_id: lotId,
    volume_after: volume,
    notes: 'Lot assigned to vessel'
  });
}

/**
 * Log a lot removal from a vessel
 * @param {string} containerId - Container UUID
 * @param {string} lotId - Lot UUID
 * @param {string} reason - Reason for removal (pressed, transferred, etc.)
 */
export async function logLotRemoval(containerId, lotId, reason) {
  return createVesselHistoryEvent({
    container_id: containerId,
    event_type: 'lot_removed',
    lot_id: lotId,
    volume_after: 0,
    notes: reason || 'Lot removed from vessel'
  });
}

/**
 * Log a CIP (Clean-In-Place) event
 * @param {string} containerId - Container UUID
 * @param {string} cipProduct - CIP product used
 * @param {number} cost - Optional cost of CIP
 */
export async function logCIPEvent(containerId, cipProduct, cost = null) {
  return createVesselHistoryEvent({
    container_id: containerId,
    event_type: 'cip',
    cip_product: cipProduct,
    cost,
    notes: `Vessel cleaned with ${cipProduct}`
  });
}

/**
 * Log a maintenance or repair event
 * @param {string} containerId - Container UUID
 * @param {string} maintenanceType - Type of maintenance/repair
 * @param {number} cost - Cost of maintenance
 * @param {string} notes - Details about the work done
 */
export async function logMaintenanceEvent(containerId, maintenanceType, cost, notes) {
  return createVesselHistoryEvent({
    container_id: containerId,
    event_type: maintenanceType === 'repair' ? 'repair' : 'maintenance',
    maintenance_type: maintenanceType,
    cost,
    notes
  });
}

// =====================================================
// BLENDING OPERATIONS
// =====================================================

/**
 * Execute a blend - creates new blend lot and records components
 * @param {Object} blendData - Blend lot details
 * @param {Array} components - Array of {lot_id, percentage, volume_gallons}
 * @param {string} containerId - Optional container to assign blend to
 * @returns {Object} { data: { blendLot, components }, error }
 */
export async function executeBlend(blendData, components, containerId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  try {
    // 1. Create the blend lot
    const { data: blendLot, error: blendError } = await supabase
      .from('production_lots')
      .insert({
        ...blendData,
        user_id: user.id,
        is_blend: true,
        container_id: containerId,
        status: blendData.status || 'blending'
      })
      .select()
      .single();

    if (blendError) throw blendError;

    // 2. Insert blend components
    const componentRecords = components.map(comp => ({
      blend_lot_id: blendLot.id,
      component_lot_id: comp.lot_id,
      volume_gallons: comp.volume_gallons,
      percentage: comp.percentage
    }));

    const { data: savedComponents, error: componentsError } = await supabase
      .from('blend_components')
      .insert(componentRecords)
      .select(`
        *,
        component_lot:production_lots!component_lot_id(id, name, varietal, vintage)
      `);

    if (componentsError) throw componentsError;

    // 3. Deduct volumes from source lots
    for (const comp of components) {
      const { data: sourceLot, error: fetchError } = await supabase
        .from('production_lots')
        .select('current_volume_gallons, name')
        .eq('id', comp.lot_id)
        .single();

      if (fetchError) throw fetchError;

      const newVolume = (sourceLot.current_volume_gallons || 0) - comp.volume_gallons;

      const { error: updateError } = await supabase
        .from('production_lots')
        .update({
          current_volume_gallons: newVolume,
          status: newVolume <= 0 ? 'blending' : undefined
        })
        .eq('id', comp.lot_id);

      if (updateError) throw updateError;
    }

    // 4. If assigned to container, update container volume
    if (containerId) {
      const { data: container } = await supabase
        .from('production_containers')
        .select('current_volume_gallons')
        .eq('id', containerId)
        .single();

      if (container) {
        await supabase
          .from('production_containers')
          .update({
            current_volume_gallons: (container.current_volume_gallons || 0) + blendData.current_volume_gallons,
            status: 'in_use'
          })
          .eq('id', containerId);
      }
    }

    return {
      data: {
        blendLot,
        components: savedComponents
      },
      error: null
    };
  } catch (error) {
    console.error('Error executing blend:', error);
    return { data: null, error };
  }
}

/**
 * Get all blends for the current user
 * @param {Object} filters - Optional filters
 * @returns {Array} Blend lots with their components
 */
export async function listBlends(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('production_lots')
    .select(`
      *,
      container:production_containers(id, name, type, capacity_gallons),
      block:vineyard_blocks(id, name),
      blend_components!blend_lot_id(
        id,
        volume_gallons,
        percentage,
        component_lot:production_lots!component_lot_id(id, name, varietal, vintage, current_volume_gallons)
      )
    `)
    .eq('user_id', user.id)
    .eq('is_blend', true)
    .is('archived_at', null);

  if (filters.vintage) {
    query = query.eq('vintage', filters.vintage);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  return query.order('created_at', { ascending: false });
}

/**
 * Get a single blend with full details
 * @param {string} blendId - Blend lot UUID
 */
export async function getBlend(blendId) {
  return supabase
    .from('production_lots')
    .select(`
      *,
      container:production_containers(id, name, type, capacity_gallons, location),
      block:vineyard_blocks(id, name),
      blend_components!blend_lot_id(
        id,
        volume_gallons,
        percentage,
        component_lot:production_lots!component_lot_id(
          id,
          name,
          varietal,
          vintage,
          appellation,
          current_volume_gallons,
          current_ph,
          current_ta,
          current_alcohol_pct,
          current_brix
        )
      ),
      fermentation_logs(*)
    `)
    .eq('id', blendId)
    .eq('is_blend', true)
    .single();
}

/**
 * Get lots that were used in a specific blend
 * @param {string} lotId - Component lot UUID
 * @returns {Array} Blends that used this lot
 */
export async function getBlendsUsingLot(lotId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('blend_components')
    .select(`
      *,
      blend_lot:production_lots!blend_lot_id(
        id,
        name,
        varietal,
        vintage,
        current_volume_gallons,
        status,
        created_at
      )
    `)
    .eq('component_lot_id', lotId);
}

/**
 * Calculate predicted blend chemistry from components
 * @param {Array} components - Array of {lot, percentage, volume}
 * @returns {Object} Weighted average chemistry values
 */
export function calculateBlendChemistry(components) {
  const validComponents = components.filter(c => c.lot && c.percentage > 0);

  if (validComponents.length === 0) {
    return {
      ph: null,
      ta: null,
      alcohol: null,
      brix: null
    };
  }

  const totalPercentage = validComponents.reduce((sum, c) => sum + c.percentage, 0);

  // Weighted averages
  const calculateWeightedAvg = (field) => {
    const values = validComponents
      .filter(c => c.lot[field] != null)
      .map(c => ({
        value: parseFloat(c.lot[field]),
        weight: c.percentage / totalPercentage
      }));

    if (values.length === 0) return null;

    return values.reduce((sum, v) => sum + (v.value * v.weight), 0);
  };

  return {
    ph: calculateWeightedAvg('current_ph'),
    ta: calculateWeightedAvg('current_ta'),
    alcohol: calculateWeightedAvg('current_alcohol_pct'),
    brix: calculateWeightedAvg('current_brix'),
    componentCount: validComponents.length
  };
}

/**
 * Get varietal composition breakdown
 * @param {Array} components - Array of {lot, percentage}
 * @returns {Object} Varietal percentages
 */
export function calculateVarietalComposition(components) {
  const validComponents = components.filter(c => c.lot && c.percentage > 0);

  const composition = validComponents.reduce((acc, comp) => {
    const varietal = comp.lot.varietal || 'Unknown';
    acc[varietal] = (acc[varietal] || 0) + comp.percentage;
    return acc;
  }, {});

  return Object.entries(composition)
    .map(([varietal, percentage]) => ({ varietal, percentage }))
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Delete a blend (only if not yet executed/saved)
 * @param {string} blendId - Blend lot UUID
 */
export async function deleteBlend(blendId) {
  // This will cascade delete blend_components due to DB constraints
  return supabase
    .from('production_lots')
    .delete()
    .eq('id', blendId)
    .eq('is_blend', true);
}

/**
 * Update blend lot (before components are finalized)
 * @param {string} blendId - Blend lot UUID
 * @param {Object} updates - Fields to update
 */
export async function updateBlend(blendId, updates) {
  return supabase
    .from('production_lots')
    .update(updates)
    .eq('id', blendId)
    .eq('is_blend', true)
    .select()
    .single();
}
