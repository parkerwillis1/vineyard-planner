/* ================================================================
   WEATHER API INTEGRATIONS
   Automatic rainfall data from weather services
================================================================ */

import { bulkCreateRainfallReadings } from './rainGaugeApi';

// =====================================================
// NATIONAL WEATHER SERVICE (NWS) - FREE, NO API KEY
// https://www.weather.gov/documentation/services-web-api
// =====================================================

/**
 * Fetch rainfall data from National Weather Service (USA only)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Array of rainfall readings
 */
export async function fetchNWSRainfall(lat, lng, startDate, endDate) {
  try {
    // Step 1: Get the grid point for this location
    const pointUrl = `https://api.weather.gov/points/${lat},${lng}`;

    const pointResponse = await fetch(pointUrl, {
      headers: {
        'User-Agent': 'VineyardPlanner/1.0 (contact@vineyardplanner.com)',
        'Accept': 'application/geo+json'
      }
    });

    if (!pointResponse.ok) {
      throw new Error(`NWS API error: ${pointResponse.statusText}`);
    }

    const pointData = await pointResponse.json();
    const observationStationsUrl = pointData.properties.observationStations;

    // Step 2: Get nearest observation station
    const stationsResponse = await fetch(observationStationsUrl, {
      headers: {
        'User-Agent': 'VineyardPlanner/1.0',
        'Accept': 'application/geo+json'
      }
    });

    const stationsData = await stationsResponse.json();
    const nearestStation = stationsData.features[0]?.id;

    if (!nearestStation) {
      throw new Error('No NWS observation station found for this location');
    }

    // Step 3: Get observations from station
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();

    const obsUrl = `${nearestStation}/observations?start=${start}&end=${end}`;

    const obsResponse = await fetch(obsUrl, {
      headers: {
        'User-Agent': 'VineyardPlanner/1.0',
        'Accept': 'application/geo+json'
      }
    });

    const obsData = await obsResponse.json();

    // Step 4: Transform to our format
    const readings = [];

    for (const obs of obsData.features || []) {
      const props = obs.properties;

      // Precipitation is in meters, convert to inches
      const precipMm = props.precipitationLastHour?.value
        ? props.precipitationLastHour.value * 1000 // meters to mm
        : null;

      if (precipMm !== null && precipMm > 0) {
        readings.push({
          reading_time: props.timestamp,
          rainfall_mm: precipMm,
          rainfall_inches: precipMm / 25.4,
          temperature_f: props.temperature?.value
            ? (props.temperature.value * 9/5) + 32 // Celsius to Fahrenheit
            : null,
          humidity_percent: props.relativeHumidity?.value || null,
          wind_speed_mph: props.windSpeed?.value
            ? props.windSpeed.value * 2.237 // m/s to mph
            : null,
          wind_direction_degrees: props.windDirection?.value || null,
          data_source: 'nws_api'
        });
      }
    }

    return {
      data: readings,
      stationId: nearestStation.split('/').pop(),
      stationName: stationsData.features[0]?.properties?.name || 'Unknown',
      source: 'National Weather Service'
    };

  } catch (error) {
    console.error('Error fetching NWS data:', error);
    return { data: [], error: error.message };
  }
}

// =====================================================
// OPENWEATHERMAP - FREE TIER (1000 calls/day)
// https://openweathermap.org/api
// =====================================================

/**
 * Fetch rainfall data from OpenWeatherMap
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} apiKey - OpenWeatherMap API key
 * @param {number} days - Days of historical data (max 5 for free tier)
 * @returns {Promise} Array of rainfall readings
 */
export async function fetchOpenWeatherMapRainfall(lat, lng, apiKey, days = 5) {
  try {
    // One Call API 3.0 - includes historical data
    const url = `https://api.openweathermap.org/data/3.0/onecall/timemachine`;

    const readings = [];
    const now = Math.floor(Date.now() / 1000);

    // Fetch data for each day
    for (let i = 0; i < days; i++) {
      const timestamp = now - (i * 86400); // 86400 seconds = 1 day

      const response = await fetch(
        `${url}?lat=${lat}&lon=${lng}&dt=${timestamp}&appid=${apiKey}&units=imperial`
      );

      if (!response.ok) {
        console.error(`OpenWeatherMap API error: ${response.statusText}`);
        continue;
      }

      const data = await response.json();

      // Extract hourly rainfall
      for (const hour of data.data || []) {
        const rainMm = hour.rain?.['1h'] || 0; // Rain in last hour (mm)

        if (rainMm > 0) {
          readings.push({
            reading_time: new Date(hour.dt * 1000).toISOString(),
            rainfall_mm: rainMm,
            rainfall_inches: rainMm / 25.4,
            temperature_f: hour.temp,
            humidity_percent: hour.humidity,
            wind_speed_mph: hour.wind_speed,
            wind_direction_degrees: hour.wind_deg,
            data_source: 'openweathermap_api'
          });
        }
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      data: readings,
      source: 'OpenWeatherMap'
    };

  } catch (error) {
    console.error('Error fetching OpenWeatherMap data:', error);
    return { data: [], error: error.message };
  }
}

// =====================================================
// NOAA CLIMATE DATA ONLINE (CDO)
// https://www.ncdc.noaa.gov/cdo-web/webservices/v2
// =====================================================

/**
 * Fetch rainfall data from NOAA Climate Data Online
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} apiToken - NOAA API token (free from ncdc.noaa.gov/cdo-web/token)
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Array of rainfall readings
 */
export async function fetchNOAARainfall(lat, lng, apiToken, startDate, endDate) {
  try {
    // Step 1: Find nearest weather station
    const stationUrl = `https://www.ncdc.noaa.gov/cdo-web/api/v2/stations`;

    const stationResponse = await fetch(
      `${stationUrl}?extent=${lat-0.5},${lng-0.5},${lat+0.5},${lng+0.5}&limit=1`,
      {
        headers: {
          'token': apiToken
        }
      }
    );

    const stationData = await stationResponse.json();
    const stationId = stationData.results?.[0]?.id;

    if (!stationId) {
      throw new Error('No NOAA station found near this location');
    }

    // Step 2: Get precipitation data
    const dataUrl = `https://www.ncdc.noaa.gov/cdo-web/api/v2/data`;

    const dataResponse = await fetch(
      `${dataUrl}?datasetid=GHCND&datatypeid=PRCP&stationid=${stationId}&startdate=${startDate}&enddate=${endDate}&units=metric&limit=1000`,
      {
        headers: {
          'token': apiToken
        }
      }
    );

    const data = await dataResponse.json();

    // Step 3: Transform to our format
    const readings = (data.results || []).map(record => ({
      reading_time: record.date,
      rainfall_mm: record.value / 10, // NOAA returns tenths of mm
      rainfall_inches: (record.value / 10) / 25.4,
      data_source: 'noaa_cdo_api'
    }));

    return {
      data: readings,
      stationId,
      stationName: stationData.results?.[0]?.name || 'Unknown',
      source: 'NOAA Climate Data Online'
    };

  } catch (error) {
    console.error('Error fetching NOAA data:', error);
    return { data: [], error: error.message };
  }
}

// =====================================================
// VISUAL CROSSING WEATHER
// https://www.visualcrossing.com/
// Free tier: 1000 records/day
// =====================================================

/**
 * Fetch rainfall data from Visual Crossing
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} apiKey - Visual Crossing API key
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Array of rainfall readings
 */
export async function fetchVisualCrossingRainfall(lat, lng, apiKey, startDate, endDate) {
  try {
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lng}/${startDate}/${endDate}`;

    const response = await fetch(
      `${url}?unitGroup=us&key=${apiKey}&include=days,hours&elements=datetime,precip,temp,humidity,windspeed,winddir`
    );

    if (!response.ok) {
      throw new Error(`Visual Crossing API error: ${response.statusText}`);
    }

    const data = await response.json();

    const readings = [];

    // Process hourly data
    for (const day of data.days || []) {
      for (const hour of day.hours || []) {
        const precipInches = hour.precip || 0;

        if (precipInches > 0) {
          readings.push({
            reading_time: `${day.datetime}T${hour.datetime}`,
            rainfall_inches: precipInches,
            rainfall_mm: precipInches * 25.4,
            temperature_f: hour.temp,
            humidity_percent: hour.humidity,
            wind_speed_mph: hour.windspeed,
            wind_direction_degrees: hour.winddir,
            data_source: 'visualcrossing_api'
          });
        }
      }
    }

    return {
      data: readings,
      source: 'Visual Crossing Weather'
    };

  } catch (error) {
    console.error('Error fetching Visual Crossing data:', error);
    return { data: [], error: error.message };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Auto-sync rainfall for a rain gauge from configured API
 * @param {string} gaugeId - Rain gauge ID in database
 * @param {Object} gauge - Rain gauge object with API config
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise} Import results
 */
export async function autoSyncRainfallFromAPI(gaugeId, gauge, startDate, endDate) {
  try {
    let result;

    // Determine which API to use based on gauge configuration
    if (gauge.station_type === 'NWS') {
      result = await fetchNWSRainfall(gauge.lat, gauge.lng, startDate, endDate);
    } else if (gauge.station_type === 'OpenWeatherMap') {
      const apiKey = gauge.api_key_encrypted; // Would need to decrypt in production
      const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      result = await fetchOpenWeatherMapRainfall(gauge.lat, gauge.lng, apiKey, Math.min(days, 5));
    } else if (gauge.station_type === 'NOAA') {
      const apiToken = gauge.api_key_encrypted;
      result = await fetchNOAARainfall(gauge.lat, gauge.lng, apiToken, startDate, endDate);
    } else if (gauge.station_type === 'VisualCrossing') {
      const apiKey = gauge.api_key_encrypted;
      result = await fetchVisualCrossingRainfall(gauge.lat, gauge.lng, apiKey, startDate, endDate);
    } else {
      return { error: `Unsupported station type: ${gauge.station_type}` };
    }

    if (result.error) {
      return { error: result.error };
    }

    // Import readings to database
    if (result.data.length > 0) {
      const { data, error } = await bulkCreateRainfallReadings(gaugeId, result.data);

      if (error) {
        return { error: error.message };
      }

      return {
        imported: result.data.length,
        source: result.source,
        stationId: result.stationId,
        stationName: result.stationName
      };
    }

    return { imported: 0, message: 'No rainfall data found for this period' };

  } catch (error) {
    console.error('Error auto-syncing rainfall:', error);
    return { error: error.message };
  }
}

/**
 * Get recommended weather API for a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Recommended API type
 */
export function getRecommendedWeatherAPI(lat, lng) {
  // Check if in USA (NWS is best for USA, free and reliable)
  if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) {
    return 'NWS'; // National Weather Service - FREE, best for USA
  }

  // Outside USA - recommend OpenWeatherMap (has free tier, global)
  return 'OpenWeatherMap';
}

/**
 * Setup automatic rain gauge from weather API
 * @param {string} gaugeName - Name for the rain gauge
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Array} blockIds - Block IDs to associate with this gauge
 * @param {string} apiType - 'NWS', 'OpenWeatherMap', 'NOAA', 'VisualCrossing'
 * @param {string} apiKey - API key (if needed for the service)
 * @returns {Promise} Created gauge
 */
export async function createAutoRainGauge(gaugeName, lat, lng, blockIds, apiType = null, apiKey = null) {
  const recommendedType = apiType || getRecommendedWeatherAPI(lat, lng);

  const gaugeData = {
    station_name: gaugeName,
    station_type: recommendedType,
    lat,
    lng,
    is_active: true,
    measures_rainfall: true,
    primary_for_blocks: blockIds,
    api_key_encrypted: apiKey, // In production, encrypt this
    notes: `Auto-created weather API rain gauge using ${recommendedType}`
  };

  // Would call createRainGauge from rainGaugeApi here
  return gaugeData;
}
