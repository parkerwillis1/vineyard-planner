import { supabase } from './supabaseClient';

/* ================================================================
   RAIN GAUGE API
   Supabase CRUD helpers for rain gauge and weather tracking
================================================================ */

// =====================================================
// RAIN GAUGES / WEATHER STATIONS
// =====================================================

/**
 * List all rain gauges for the current user
 * @param {boolean} activeOnly - Only return active stations
 * @returns {Promise} Supabase query response
 */
export async function listRainGauges(activeOnly = true) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('rain_gauges')
    .select('*')
    .eq('user_id', user.id)
    .order('station_name', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  return query;
}

/**
 * Get a single rain gauge by ID
 * @param {string} gaugeId - Rain gauge ID
 * @returns {Promise} Supabase query response
 */
export async function getRainGauge(gaugeId) {
  return supabase
    .from('rain_gauges')
    .select('*')
    .eq('id', gaugeId)
    .single();
}

/**
 * Create a new rain gauge/weather station
 * @param {Object} gauge - Rain gauge configuration
 * @returns {Promise} Supabase query response
 */
export async function createRainGauge(gauge) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('rain_gauges')
    .insert({ ...gauge, user_id: user.id })
    .select()
    .single();
}

/**
 * Update a rain gauge
 * @param {string} gaugeId - Rain gauge ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} Supabase query response
 */
export async function updateRainGauge(gaugeId, updates) {
  return supabase
    .from('rain_gauges')
    .update(updates)
    .eq('id', gaugeId)
    .select()
    .single();
}

/**
 * Delete a rain gauge
 * @param {string} gaugeId - Rain gauge ID
 * @returns {Promise} Supabase query response
 */
export async function deleteRainGauge(gaugeId) {
  return supabase
    .from('rain_gauges')
    .delete()
    .eq('id', gaugeId);
}

// =====================================================
// RAINFALL READINGS
// =====================================================

/**
 * List rainfall readings for a specific gauge
 * @param {string} gaugeId - Rain gauge ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Supabase query response
 */
export async function listRainfallReadings(gaugeId, startDate = null, endDate = null) {
  let query = supabase
    .from('rainfall_readings')
    .select('*')
    .eq('rain_gauge_id', gaugeId)
    .order('reading_time', { ascending: false });

  if (startDate) {
    query = query.gte('reading_time', startDate);
  }

  if (endDate) {
    query = query.lte('reading_time', endDate);
  }

  return query;
}

/**
 * Add a rainfall reading
 * @param {string} gaugeId - Rain gauge ID
 * @param {Object} reading - Reading data
 * @returns {Promise} Supabase query response
 */
export async function createRainfallReading(gaugeId, reading) {
  return supabase
    .from('rainfall_readings')
    .insert({
      rain_gauge_id: gaugeId,
      ...reading
    })
    .select()
    .single();
}

/**
 * Bulk insert rainfall readings (for API imports)
 * @param {string} gaugeId - Rain gauge ID
 * @param {Array} readings - Array of reading objects
 * @returns {Promise} Supabase query response
 */
export async function bulkCreateRainfallReadings(gaugeId, readings) {
  const recordsWithGaugeId = readings.map(reading => ({
    rain_gauge_id: gaugeId,
    ...reading
  }));

  return supabase
    .from('rainfall_readings')
    .insert(recordsWithGaugeId)
    .select();
}

/**
 * Update a rainfall reading
 * @param {string} readingId - Reading ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} Supabase query response
 */
export async function updateRainfallReading(readingId, updates) {
  return supabase
    .from('rainfall_readings')
    .update(updates)
    .eq('id', readingId)
    .select()
    .single();
}

/**
 * Delete a rainfall reading
 * @param {string} readingId - Reading ID
 * @returns {Promise} Supabase query response
 */
export async function deleteRainfallReading(readingId) {
  return supabase
    .from('rainfall_readings')
    .delete()
    .eq('id', readingId);
}

// =====================================================
// DAILY SUMMARIES
// =====================================================

/**
 * Get daily rainfall summaries for a gauge
 * @param {string} gaugeId - Rain gauge ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Supabase query response
 */
export async function getDailyRainfallSummaries(gaugeId, startDate, endDate) {
  return supabase
    .from('daily_rainfall_summary')
    .select('*')
    .eq('rain_gauge_id', gaugeId)
    .gte('summary_date', startDate)
    .lte('summary_date', endDate)
    .order('summary_date', { ascending: true });
}

/**
 * Trigger daily summary update for a specific date
 * @param {string} date - Date to update (YYYY-MM-DD) or null for today
 * @returns {Promise} Result of function call
 */
export async function updateDailySummaries(date = null) {
  const { data, error } = await supabase.rpc('update_daily_rainfall_summaries', {
    p_date: date
  });

  return { data, error };
}

// =====================================================
// BLOCK RAINFALL QUERIES
// =====================================================

/**
 * Get total rainfall for a specific block over a date range
 * @param {string} blockId - Block ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Rainfall summary for block
 */
export async function getBlockRainfall(blockId, startDate, endDate) {
  const { data, error } = await supabase.rpc('get_block_rainfall', {
    p_block_id: blockId,
    p_start_date: startDate,
    p_end_date: endDate
  });

  return { data, error };
}

/**
 * Get rainfall for all blocks with associated rain gauges
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Rainfall data grouped by block
 */
export async function getAllBlocksRainfall(startDate, endDate) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  // Get all rain gauges for user
  const { data: gauges, error: gaugeError } = await listRainGauges(true);
  if (gaugeError) return { data: [], error: gaugeError };

  // Get summaries for each gauge
  const rainfallByBlock = {};

  for (const gauge of gauges) {
    const { data: summaries } = await getDailyRainfallSummaries(
      gauge.id,
      startDate,
      endDate
    );

    if (!summaries) continue;

    const totalMm = summaries.reduce((sum, s) => sum + (parseFloat(s.total_rainfall_mm) || 0), 0);
    const totalInches = summaries.reduce((sum, s) => sum + (parseFloat(s.total_rainfall_inches) || 0), 0);

    // Associate rainfall with blocks covered by this gauge
    if (gauge.primary_for_blocks) {
      gauge.primary_for_blocks.forEach(blockId => {
        if (!rainfallByBlock[blockId]) {
          rainfallByBlock[blockId] = {
            blockId,
            totalMm: 0,
            totalInches: 0,
            gaugeName: gauge.station_name
          };
        }
        rainfallByBlock[blockId].totalMm += totalMm;
        rainfallByBlock[blockId].totalInches += totalInches;
      });
    }
  }

  return { data: Object.values(rainfallByBlock), error: null };
}

// =====================================================
// WEATHER STATION INTEGRATIONS
// =====================================================

/**
 * Import data from Davis WeatherLink API
 * @param {string} gaugeId - Rain gauge ID
 * @param {string} apiKey - WeatherLink API key
 * @param {string} stationId - WeatherLink station ID
 * @param {string} startDate - Start date for import
 * @param {string} endDate - End date for import
 * @returns {Promise} Import results
 */
export async function importDavisWeatherLink(gaugeId, apiKey, stationId, startDate, endDate) {
  // This would call Davis WeatherLink API
  // Implementation depends on their API structure
  // Returns promise with imported data count

  console.log('Davis WeatherLink import not yet implemented');
  return { data: null, error: new Error('Not implemented yet') };
}

/**
 * Import data from Onset HOBO
 * @param {string} gaugeId - Rain gauge ID
 * @param {File} csvFile - CSV file from HOBO data logger
 * @returns {Promise} Import results
 */
export async function importHOBOData(gaugeId, csvFile) {
  // Parse HOBO CSV format
  // Convert to rainfall_readings format
  // Bulk insert

  console.log('HOBO import not yet implemented');
  return { data: null, error: new Error('Not implemented yet') };
}

/**
 * Import data from Rainwise weather station
 * @param {string} gaugeId - Rain gauge ID
 * @param {string} apiEndpoint - Rainwise API endpoint
 * @param {string} apiKey - Rainwise API key
 * @returns {Promise} Import results
 */
export async function importRainwiseData(gaugeId, apiEndpoint, apiKey) {
  console.log('Rainwise import not yet implemented');
  return { data: null, error: new Error('Not implemented yet') };
}
