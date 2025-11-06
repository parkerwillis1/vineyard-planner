/**
 * OpenET API Integration
 *
 * Fetches actual evapotranspiration data from OpenET satellite-based platform
 * Documentation: https://openet.gitbook.io/docs/quick-start
 *
 * Note: Uses Vite proxy in development, Supabase Edge Function in production
 */

// Use Vite dev proxy in development, Supabase Edge Function in production
const isDevelopment = import.meta.env.DEV;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const OPENET_PROXY_URL = isDevelopment
  ? '/api/openet'  // Vite proxy for development (no CORS)
  : `${SUPABASE_URL}/functions/v1/openet-proxy`;  // Edge Function for production

/**
 * Fetch ET data from OpenET API for a specific point and date range
 *
 * @param {Object} params
 * @param {number} params.lat - Latitude
 * @param {number} params.lng - Longitude
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {string} params.model - OpenET model (default: 'ensemble')
 * @param {string} params.interval - Time interval (default: 'monthly')
 * @returns {Promise<Object>} ET data response
 */
export async function fetchOpenETData({
  lat,
  lng,
  startDate,
  endDate,
  model = 'ensemble',
  interval = 'daily'
}) {
  console.log('📡 Fetching OpenET data via proxy:', { lat, lng, startDate, endDate, model });

  try {
    // OpenET API format: https://openet.gitbook.io/docs/quick-start
    const requestBody = {
      date_range: [startDate, endDate],
      interval: interval,
      geometry: [lng, lat],  // [longitude, latitude]
      model: model.charAt(0).toUpperCase() + model.slice(1), // Capitalize first letter
      variable: 'ET',  // OpenET uses uppercase
      reference_et: 'gridMET',  // Required field
      units: 'mm',
      file_format: 'JSON'  // Required field
    };

    console.log('📡 Request body:', requestBody);

    // Add timeout to fetch request (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(OPENET_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenET proxy error:', response.status, response.statusText);
      console.error('Error details:', errorText);
      console.error('Request was:', { lat, lng, startDate, endDate, model });

      // Fall back to mock data on error
      console.warn('⚠️ OpenET API request via proxy failed. Falling back to mock data.');
      return generateMockETData(startDate, endDate);
    }

    const data = await response.json();
    console.log('✅ OpenET data received via proxy:', data);

    // Transform API response to our format
    return transformOpenETResponse(data);

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ OpenET proxy timeout after 30 seconds');
      console.warn('⚠️ The OpenET proxy is not responding. Falling back to mock data.');
    } else {
      console.error('❌ Error fetching OpenET data via proxy:', error);
      console.warn('⚠️ OpenET API request via proxy failed. Falling back to mock data.');
    }

    // Fall back to mock data
    return generateMockETData(startDate, endDate);
  }
}

/**
 * Transform OpenET API response to our internal format
 */
function transformOpenETResponse(apiResponse) {
  // OpenET point timeseries returns array of {time: "YYYY-MM-DD", et: X.XX}
  const values = Array.isArray(apiResponse) ? apiResponse : [];

  const timeseries = values.map(item => ({
    date: item.time,
    et: item.et || 0, // ET in mm/day
    etc: item.et || 0 // We'll calculate ETc with Kc separately
  }));

  // Calculate summary statistics
  const etValues = timeseries.map(t => t.et).filter(v => v > 0);
  const avgET = etValues.length > 0
    ? etValues.reduce((sum, v) => sum + v, 0) / etValues.length
    : 0;
  const totalET = etValues.reduce((sum, v) => sum + v, 0);

  return {
    timeseries,
    summary: {
      avgET: avgET,
      totalET: totalET,
      totalETc: totalET, // Will be adjusted with Kc
      deficit: 0 // Calculated separately with irrigation data
    },
    source: 'openet-api',
    fetchedAt: new Date().toISOString()
  };
}

/**
 * Generate mock ET data when API is not available
 * This provides realistic-looking data for testing
 */
function generateMockETData(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeseries = [];

  // Generate daily data
  let currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Generate realistic ET values (3-5 mm/day is typical for grapes)
    // Add some seasonal variation
    const month = currentDate.getMonth();
    const baseET = month >= 5 && month <= 8 ? 4.5 : 3.5; // Higher in summer
    const variation = (Math.random() - 0.5) * 1.0;
    const et = Math.max(2.0, baseET + variation);

    timeseries.push({
      date: dateStr,
      et: parseFloat(et.toFixed(2)),
      etc: parseFloat((et * 0.9).toFixed(2)) // Mock ETc with approx Kc
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate summary
  const etValues = timeseries.map(t => t.et);
  const avgET = etValues.reduce((sum, v) => sum + v, 0) / etValues.length;
  const totalET = etValues.reduce((sum, v) => sum + v, 0);

  return {
    timeseries,
    summary: {
      avgET: parseFloat(avgET.toFixed(2)),
      totalET: parseFloat(totalET.toFixed(2)),
      totalETc: parseFloat((totalET * 0.9).toFixed(2)),
      deficit: 0
    },
    source: 'mock-data',
    fetchedAt: new Date().toISOString()
  };
}

/**
 * Fetch ET data for multiple points (for efficiency)
 * Useful when loading data for multiple vineyard blocks
 */
export async function fetchOpenETDataBatch(requests) {
  const results = await Promise.allSettled(
    requests.map(req => fetchOpenETData(req))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        ...requests[index],
        data: result.value,
        success: true
      };
    } else {
      console.error(`Failed to fetch ET data for request ${index}:`, result.reason);
      return {
        ...requests[index],
        data: null,
        success: false,
        error: result.reason?.message || 'Unknown error'
      };
    }
  });
}

/**
 * Apply crop coefficient (Kc) to ET data to calculate ETc (crop ET)
 *
 * @param {Array} timeseries - Array of {date, et} objects
 * @param {number|Function} kc - Kc value or function that returns Kc for a date
 * @returns {Array} Updated timeseries with etc values
 */
export function applyKcToTimeseries(timeseries, kc) {
  return timeseries.map(day => {
    const kcValue = typeof kc === 'function' ? kc(new Date(day.date)) : kc;
    return {
      ...day,
      etc: parseFloat((day.et * kcValue).toFixed(2)),
      kc: kcValue
    };
  });
}

/**
 * Get Kc (crop coefficient) for grapes based on date
 * Values based on UC Davis and FAO-56 recommendations
 */
export function getGrapeKc(date) {
  const month = date.getMonth(); // 0-11

  // Grape Kc values by growth stage
  const kcValues = {
    dormant: 0.30,      // December - March
    budbreak: 0.45,     // Early April
    flowering: 0.70,    // May - early June
    fruitset: 0.85,     // Late June - July
    veraison: 0.90,     // August
    harvest: 0.75,      // September - October
    postharvest: 0.50   // November
  };

  if (month >= 11 || month <= 2) return kcValues.dormant;      // Dec-Mar
  if (month === 3) return kcValues.budbreak;                   // Apr
  if (month === 4 || (month === 5 && date.getDate() <= 15)) return kcValues.flowering; // May-early Jun
  if ((month === 5 && date.getDate() > 15) || month === 6 || month === 7) return kcValues.fruitset; // Late Jun-Jul
  if (month === 8) return kcValues.veraison;                   // Aug
  if (month === 9) return kcValues.harvest;                    // Sep-Oct
  if (month === 10) return kcValues.postharvest;               // Nov

  return 0.70; // Default mid-season value
}

/**
 * Calculate water deficit based on ET and irrigation data
 *
 * @param {number} totalETc - Total crop ET (mm)
 * @param {number} totalIrrigation - Total irrigation applied (mm)
 * @returns {Object} Deficit analysis
 */
export function calculateWaterDeficit(totalETc, totalIrrigation) {
  const deficit = totalETc - totalIrrigation;
  const deficitInches = deficit / 25.4; // Convert mm to inches

  return {
    deficitMm: parseFloat(deficit.toFixed(2)),
    deficitInches: parseFloat(deficitInches.toFixed(2)),
    percentageMet: totalETc > 0 ? parseFloat(((totalIrrigation / totalETc) * 100).toFixed(1)) : 0,
    status: deficit > 25 ? 'urgent' : deficit > 12 ? 'recommended' : deficit < -12 ? 'excess' : 'optimal'
  };
}

/**
 * Fetch ET heat map data for a polygon area
 * Creates a grid of points within the polygon and fetches ET for each
 *
 * @param {Object} params
 * @param {Array} params.polygonCoords - Array of {lat, lng} coordinates
 * @param {string} params.date - Date (YYYY-MM-DD)
 * @param {number} params.gridResolution - Grid spacing in degrees (default 0.0001 ~11m)
 * @returns {Promise<Array>} Array of {lat, lng, et} for heat map
 */
export async function fetchETHeatMapData({
  polygonCoords,
  date,
  gridResolution = 0.0001 // ~11 meters
}) {
  if (!polygonCoords || polygonCoords.length < 3) {
    return [];
  }

  // Find bounding box
  const lats = polygonCoords.map(p => p.lat);
  const lngs = polygonCoords.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Generate grid points within bounds
  const gridPoints = [];
  for (let lat = minLat; lat <= maxLat; lat += gridResolution) {
    for (let lng = minLng; lng <= maxLng; lng += gridResolution) {
      // Check if point is inside polygon
      if (isPointInPolygon({lat, lng}, polygonCoords)) {
        gridPoints.push({lat, lng});
      }
    }
  }

  console.log(`📍 Generated ${gridPoints.length} grid points for heat map`);

  // Limit to avoid too many API calls
  const maxPoints = 50;
  const sampledPoints = gridPoints.length > maxPoints
    ? gridPoints.filter((_, i) => i % Math.ceil(gridPoints.length / maxPoints) === 0)
    : gridPoints;

  console.log(`📡 Fetching ET data for ${sampledPoints.length} points...`);

  // Fetch ET data for each point
  const results = await Promise.all(
    sampledPoints.map(async (point) => {
      try {
        const data = await fetchOpenETData({
          lat: point.lat,
          lng: point.lng,
          startDate: date,
          endDate: date,
          model: 'ensemble',
          interval: 'daily'
        });

        // Get ET value for the specific date
        const etValue = data.timeseries?.[0]?.et || 0;

        return {
          lat: point.lat,
          lng: point.lng,
          et: etValue,
          weight: etValue // For Google Maps HeatmapLayer
        };
      } catch (err) {
        console.error(`Failed to fetch ET for point ${point.lat},${point.lng}:`, err);
        return null;
      }
    })
  );

  return results.filter(r => r !== null);
}

/**
 * Check if a point is inside a polygon
 */
function isPointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;

    const intersect = ((yi > point.lat) !== (yj > point.lat))
        && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Get date range for common periods
 */
export function getDateRange(period = 'week') {
  const end = new Date();
  const start = new Date();

  switch(period) {
    case 'week':
    case '7days':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
    case '30days':
      start.setDate(end.getDate() - 30);
      break;
    case 'season':
      // Growing season: April 1 - October 31
      start.setMonth(3); // April
      start.setDate(1);
      if (end.getMonth() < 3) {
        // If we're before April, use last year's season
        start.setFullYear(start.getFullYear() - 1);
      }
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setDate(end.getDate() - 7);
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
}
