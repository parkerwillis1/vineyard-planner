/* ================================================================
   FIELD-SPECIFIC WEATHER SERVICE
   Automatic rainfall and forecast data per vineyard field
================================================================ */

/**
 * Fetch historical rainfall for a specific field
 * Uses National Weather Service (NWS) - FREE, no API key needed
 * @param {number} lat - Field center latitude
 * @param {number} lng - Field center longitude
 * @param {number} days - Days of historical data to fetch
 * @returns {Promise} Rainfall data
 */
export async function fetchFieldRainfall(lat, lng, days = 7) {
  try {
    // Step 1: Get the grid point for this location
    const pointUrl = `https://api.weather.gov/points/${lat},${lng}`;

    const pointResponse = await fetch(pointUrl, {
      headers: {
        'User-Agent': 'VineyardPlanner/1.0',
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
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const obsUrl = `${nearestStation}/observations?start=${startDate.toISOString()}&end=${endDate.toISOString()}`;

    const obsResponse = await fetch(obsUrl, {
      headers: {
        'User-Agent': 'VineyardPlanner/1.0',
        'Accept': 'application/geo+json'
      }
    });

    const obsData = await obsResponse.json();

    // Step 4: Transform and aggregate rainfall data
    let totalMm = 0;
    const dailyRainfall = {};
    const lastRainEvent = { date: null, amount: 0 };
    const hourlyData = new Map(); // Track by hour to avoid double-counting

    for (const obs of obsData.features || []) {
      const props = obs.properties;

      // Precipitation is in meters, convert to mm
      // Use precipitationLastHour for incremental hourly amounts
      let precipMm = 0;

      if (props.precipitationLastHour?.value !== null &&
          props.precipitationLastHour?.value !== undefined) {
        precipMm = props.precipitationLastHour.value * 1000;

        // Sanity check - hourly precipitation should not exceed 100mm (4 inches)
        if (precipMm > 100) {
          console.warn(`Suspicious rainfall value: ${precipMm}mm, skipping`);
          precipMm = 0;
        }
      }

      if (precipMm > 0) {
        // Round to nearest hour to avoid double-counting
        const hourKey = new Date(props.timestamp).toISOString().substring(0, 13); // YYYY-MM-DDTHH

        // Only count each hour once (take the latest reading for that hour)
        if (!hourlyData.has(hourKey) || precipMm > 0) {
          hourlyData.set(hourKey, precipMm);
        }

        // Track daily totals
        const date = new Date(props.timestamp).toISOString().split('T')[0];

        // Track last rain event
        if (!lastRainEvent.date || new Date(props.timestamp) > new Date(lastRainEvent.date)) {
          lastRainEvent.date = props.timestamp;
          lastRainEvent.amount = precipMm;
        }
      }
    }

    // Sum up unique hourly readings
    for (const [hour, amount] of hourlyData.entries()) {
      totalMm += amount;

      // Track daily totals from unique hours
      const date = hour.split('T')[0];
      dailyRainfall[date] = (dailyRainfall[date] || 0) + amount;
    }

    return {
      totalMm,
      totalInches: totalMm / 25.4,
      dailyRainfall,
      lastRainEvent,
      stationName: stationsData.features[0]?.properties?.name || 'Unknown Station',
      source: 'NWS',
      days
    };

  } catch (error) {
    console.error('Error fetching field rainfall:', error);
    return { totalMm: 0, totalInches: 0, error: error.message };
  }
}

/**
 * Fetch weather forecast for a specific field
 * Uses National Weather Service (NWS) - FREE, no API key needed
 * @param {number} lat - Field center latitude
 * @param {number} lng - Field center longitude
 * @returns {Promise} 7-day forecast data
 */
export async function fetchFieldForecast(lat, lng) {
  try {
    // Step 1: Get the grid point for this location
    const pointUrl = `https://api.weather.gov/points/${lat},${lng}`;

    const pointResponse = await fetch(pointUrl, {
      headers: {
        'User-Agent': 'VineyardPlanner/1.0',
        'Accept': 'application/geo+json'
      }
    });

    if (!pointResponse.ok) {
      throw new Error(`NWS API error: ${pointResponse.statusText}`);
    }

    const pointData = await pointResponse.json();
    const forecastUrl = pointData.properties.forecast;

    // Step 2: Get forecast
    const forecastResponse = await fetch(forecastUrl, {
      headers: {
        'User-Agent': 'VineyardPlanner/1.0',
        'Accept': 'application/geo+json'
      }
    });

    const forecastData = await forecastResponse.json();

    // Step 3: Calculate predicted rainfall from forecast
    let predictedRainfallMm = 0;
    const periods = [];

    for (const period of forecastData.properties?.periods || []) {
      // NWS provides probability of precipitation
      const precipProb = period.probabilityOfPrecipitation?.value || 0;

      // Estimate rainfall based on probability and conditions
      // This is a simplified estimation - actual amounts vary
      let estimatedMm = 0;
      if (precipProb > 70) {
        estimatedMm = 10; // Heavy rain likely
      } else if (precipProb > 40) {
        estimatedMm = 5; // Moderate rain possible
      } else if (precipProb > 20) {
        estimatedMm = 2; // Light rain possible
      }

      if (estimatedMm > 0) {
        predictedRainfallMm += estimatedMm;
      }

      periods.push({
        name: period.name,
        startTime: period.startTime,
        temperature: period.temperature,
        precipitationProbability: precipProb,
        shortForecast: period.shortForecast,
        detailedForecast: period.detailedForecast,
        estimatedRainfallMm: estimatedMm,
        windSpeed: period.windSpeed,
        windDirection: period.windDirection
      });
    }

    return {
      predictedRainfallMm,
      predictedRainfallInches: predictedRainfallMm / 25.4,
      periods: periods.slice(0, 14), // Next 7 days (day + night periods)
      source: 'NWS Forecast'
    };

  } catch (error) {
    console.error('Error fetching field forecast:', error);
    return { predictedRainfallMm: 0, predictedRainfallInches: 0, error: error.message };
  }
}

/**
 * Get complete weather summary for a field
 * Combines historical rainfall and forecast
 * @param {number} lat - Field center latitude
 * @param {number} lng - Field center longitude
 * @param {number} historicalDays - Days of historical data
 * @returns {Promise} Complete weather summary
 */
export async function getFieldWeatherSummary(lat, lng, historicalDays = 7) {
  try {
    const [rainfall, forecast] = await Promise.all([
      fetchFieldRainfall(lat, lng, historicalDays),
      fetchFieldForecast(lat, lng)
    ]);

    return {
      historical: rainfall,
      forecast,
      totalExpectedMm: (rainfall.totalMm || 0) + (forecast.predictedRainfallMm || 0),
      totalExpectedInches: ((rainfall.totalMm || 0) + (forecast.predictedRainfallMm || 0)) / 25.4
    };
  } catch (error) {
    console.error('Error fetching field weather summary:', error);
    return { error: error.message };
  }
}

/**
 * Calculate adjusted irrigation need based on rainfall
 * @param {number} baseIrrigationNeed - Base irrigation need in mm
 * @param {number} rainfallReceived - Rainfall received in mm
 * @param {number} predictedRainfall - Predicted rainfall in mm
 * @param {number} fieldCapacity - Field water holding capacity (default 150mm)
 * @returns {Object} Adjusted irrigation recommendation
 */
export function calculateAdjustedIrrigation(
  baseIrrigationNeed,
  rainfallReceived = 0,
  predictedRainfall = 0,
  fieldCapacity = 150
) {
  // Net irrigation need = base need - rainfall received
  let netNeed = baseIrrigationNeed - rainfallReceived;

  // Further reduce if rain is predicted soon
  if (predictedRainfall > 0) {
    netNeed = netNeed - (predictedRainfall * 0.7); // 70% confidence in forecast
  }

  // Don't over-irrigate beyond field capacity
  netNeed = Math.min(netNeed, fieldCapacity);

  // Never recommend negative irrigation
  netNeed = Math.max(netNeed, 0);

  return {
    baseNeed: baseIrrigationNeed,
    rainfallReceived,
    predictedRainfall,
    adjustedNeed: netNeed,
    adjustedNeedInches: netNeed / 25.4,
    savings: baseIrrigationNeed - netNeed,
    savingsPercent: baseIrrigationNeed > 0 ? ((baseIrrigationNeed - netNeed) / baseIrrigationNeed * 100) : 0
  };
}
