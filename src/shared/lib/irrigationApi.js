import { supabase } from './supabaseClient';

/* ================================================================
   IRRIGATION API
   Supabase CRUD helpers for irrigation management
================================================================ */

// =====================================================
// IRRIGATION EVENTS
// =====================================================

/**
 * List irrigation events for a specific block or all blocks
 * @param {string} blockId - Optional block ID to filter by
 * @param {string} startDate - Optional start date filter (YYYY-MM-DD)
 * @param {string} endDate - Optional end date filter (YYYY-MM-DD)
 * @returns {Promise} Supabase query response
 */
export async function listIrrigationEvents(blockId = null, startDate = null, endDate = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('irrigation_events')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date', { ascending: false });

  if (blockId) {
    query = query.eq('block_id', blockId);
  }

  if (startDate) {
    query = query.gte('event_date', startDate);
  }

  if (endDate) {
    query = query.lte('event_date', endDate);
  }

  return query;
}

/**
 * Get a single irrigation event by ID
 * @param {string} eventId - Irrigation event ID
 * @returns {Promise} Supabase query response
 */
export async function getIrrigationEvent(eventId) {
  return supabase
    .from('irrigation_events')
    .select('*')
    .eq('id', eventId)
    .single();
}

/**
 * Create a new irrigation event
 * @param {Object} event - Irrigation event data
 * @returns {Promise} Supabase query response
 */
export async function createIrrigationEvent(event) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  // Calculate total water if not provided
  let totalWater = event.total_water_gallons;
  if (!totalWater && event.duration_hours && event.flow_rate_gpm) {
    totalWater = event.duration_hours * event.flow_rate_gpm * 60;
  }

  return supabase
    .from('irrigation_events')
    .insert({
      ...event,
      user_id: user.id,
      total_water_gallons: totalWater
    })
    .select()
    .single();
}

/**
 * Update an existing irrigation event
 * @param {string} eventId - Irrigation event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} Supabase query response
 */
export async function updateIrrigationEvent(eventId, updates) {
  // Recalculate total water if duration or flow rate changed
  if ((updates.duration_hours || updates.flow_rate_gpm) && !updates.total_water_gallons) {
    const { data: existing } = await supabase
      .from('irrigation_events')
      .select('duration_hours, flow_rate_gpm')
      .eq('id', eventId)
      .single();

    if (existing) {
      const duration = updates.duration_hours || existing.duration_hours;
      const flowRate = updates.flow_rate_gpm || existing.flow_rate_gpm;
      updates.total_water_gallons = duration * flowRate * 60;
    }
  }

  return supabase
    .from('irrigation_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();
}

/**
 * Delete an irrigation event
 * @param {string} eventId - Irrigation event ID
 * @returns {Promise} Supabase query response
 */
export async function deleteIrrigationEvent(eventId) {
  return supabase
    .from('irrigation_events')
    .delete()
    .eq('id', eventId);
}

/**
 * Get irrigation summary for a block over a date range
 * @param {string} blockId - Block ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Summary object with total water, event count, etc.
 */
export async function getIrrigationSummary(blockId, startDate, endDate) {
  const { data: events, error } = await listIrrigationEvents(blockId, startDate, endDate);

  if (error || !events) {
    return { data: null, error };
  }

  const summary = {
    eventCount: events.length,
    totalGallons: 0,
    totalHours: 0,
    avgFlowRate: 0,
    byMethod: {}
  };

  events.forEach(event => {
    summary.totalGallons += parseFloat(event.total_water_gallons) || 0;
    summary.totalHours += parseFloat(event.duration_hours) || 0;

    const method = event.irrigation_method || 'Unknown';
    if (!summary.byMethod[method]) {
      summary.byMethod[method] = {
        count: 0,
        gallons: 0,
        hours: 0
      };
    }
    summary.byMethod[method].count++;
    summary.byMethod[method].gallons += parseFloat(event.total_water_gallons) || 0;
    summary.byMethod[method].hours += parseFloat(event.duration_hours) || 0;
  });

  // Calculate average flow rate from events with flow rate data
  const eventsWithFlowRate = events.filter(e => e.flow_rate_gpm);
  if (eventsWithFlowRate.length > 0) {
    summary.avgFlowRate = eventsWithFlowRate.reduce((sum, e) => sum + e.flow_rate_gpm, 0) / eventsWithFlowRate.length;
  }

  return { data: summary, error: null };
}

// =====================================================
// OPENET DATA CACHE
// =====================================================

/**
 * Get cached OpenET data for a block
 * @param {string} blockId - Block ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Supabase query response
 */
export async function getCachedETData(blockId, startDate, endDate) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('openet_data')
    .select('*')
    .eq('user_id', user.id)
    .eq('block_id', blockId)
    .gte('data_date', startDate)
    .lte('data_date', endDate)
    .order('data_date', { ascending: true });
}

/**
 * Cache OpenET data
 * @param {string} blockId - Block ID
 * @param {Array} etDataArray - Array of ET data points
 * @returns {Promise} Supabase query response
 */
export async function cacheETData(blockId, etDataArray) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  // Format data for insertion
  const records = etDataArray.map(item => ({
    user_id: user.id,
    block_id: blockId,
    data_date: item.date,
    et_mm: item.et,
    etc_mm: item.etc,
    kc_value: item.kc,
    model: item.model || 'ensemble'
  }));

  // Use upsert to handle duplicates
  return supabase
    .from('openet_data')
    .upsert(records, {
      onConflict: 'block_id,data_date,model'
    });
}
