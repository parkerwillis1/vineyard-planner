/* ================================================================
   FIELD-SPECIFIC WEATHER SERVICE
   Automatic rainfall and forecast data per vineyard field
================================================================ */

/**
 * Fetch historical rainfall using Open-Meteo API
 * FREE, no API key needed, reliable historical data worldwide
 * Uses forecast API for recent data (up to 92 days) + archive API for older
 * @param {number} lat - Field center latitude
 * @param {number} lng - Field center longitude
 * @param {number} days - Days of historical data to fetch
 * @returns {Promise} Rainfall data
 */
async function fetchRainfallOpenMeteo(lat, lng, days = 7) {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  console.log(`🌧️ Open-Meteo: Fetching ${days} days of rainfall from ${startStr} to ${endStr}`);

  let url;
  if (days <= 92) {
    // Forecast API supports up to 92 past days with current data
    url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum&timezone=auto&past_days=${days}&forecast_days=0`;
  } else {
    // Archive API for longer historical periods (5-day delay on most recent)
    const archiveEnd = new Date(endDate);
    archiveEnd.setDate(archiveEnd.getDate() - 5); // Account for archive delay
    const archiveEndStr = archiveEnd.toISOString().split('T')[0];
    url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startStr}&end_date=${archiveEndStr}&daily=precipitation_sum&timezone=auto`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Process daily precipitation
  let totalMm = 0;
  const dailyRainfall = {};
  const lastRainEvent = { date: null, amount: 0 };

  const dates = data.daily?.time || [];
  const precipitation = data.daily?.precipitation_sum || [];

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const precipMm = precipitation[i] || 0;

    if (precipMm > 0) {
      totalMm += precipMm;
      dailyRainfall[date] = precipMm;

      // Track most recent rain event
      if (!lastRainEvent.date || date > lastRainEvent.date) {
        lastRainEvent.date = date;
        lastRainEvent.amount = precipMm;
      }
    }
  }

  const daysWithPrecip = Object.keys(dailyRainfall).length;

  console.log(`📊 Open-Meteo: ${totalMm.toFixed(1)}mm total, ${daysWithPrecip} days with rain`);
  if (lastRainEvent.date) {
    console.log(`🌧️ Last rain: ${lastRainEvent.date}, amount: ${lastRainEvent.amount?.toFixed(2)}mm`);
  }

  return {
    totalMm,
    totalInches: totalMm / 25.4,
    dailyRainfall,
    lastRainEvent,
    source: 'Open-Meteo',
    days,
    observationDays: dates.length,
    daysWithPrecip,
    dataComplete: dates.length >= days * 0.8,
    dataWarning: null
  };
}

/**
 * Fetch historical rainfall for a specific field
 * Uses Open-Meteo (primary) with NWS fallback
 * @param {number} lat - Field center latitude
 * @param {number} lng - Field center longitude
 * @param {number} days - Days of historical data to fetch
 * @returns {Promise} Rainfall data
 */
export async function fetchFieldRainfall(lat, lng, days = 7) {
  // Try Open-Meteo first (more reliable historical data)
  try {
    const openMeteoData = await fetchRainfallOpenMeteo(lat, lng, days);
    if (openMeteoData && !openMeteoData.error) {
      return openMeteoData;
    }
  } catch (error) {
    console.warn('Open-Meteo failed, falling back to NWS:', error.message);
  }

  // Fallback to NWS
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
    // Note: NWS API typically only provides ~7-14 days of observation history
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    console.log(`🌧️ Fetching ${days} days of rainfall from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    const obsUrl = `${nearestStation}/observations?start=${startDate.toISOString()}&end=${endDate.toISOString()}`;

    const obsResponse = await fetch(obsUrl, {
      headers: {
        'User-Agent': 'VineyardPlanner/1.0',
        'Accept': 'application/geo+json'
      }
    });

    const obsData = await obsResponse.json();
    console.log(`📊 Received ${obsData.features?.length || 0} observations from NWS`);

    // Step 4: Transform and aggregate rainfall data
    let totalMm = 0;
    const dailyRainfall = {};
    const lastRainEvent = { date: null, amount: 0 };
    const hourlyData = new Map(); // Track by hour to avoid double-counting

    // Debug: log first observation with precipitation to understand data structure
    if (obsData.features?.length > 0) {
      // Find an observation with precipitation data
      const withPrecip = obsData.features.find(f =>
        f.properties.precipitationLastHour?.value ||
        f.properties.precipitationLast3Hours?.value
      );
      if (withPrecip) {
        const p = withPrecip.properties;
        console.log('📋 Found precipitation data:', {
          timestamp: p.timestamp,
          precipLastHour: p.precipitationLastHour?.value,
          unitCode: p.precipitationLastHour?.unitCode,
          precipLast3Hours: p.precipitationLast3Hours?.value
        });
      } else {
        console.log('📋 No precipitation data found in observations (stations may not report precip)');
      }
    }

    for (const obs of obsData.features || []) {
      const props = obs.properties;

      // NWS API: precipitation should be in meters, but data quality varies
      // Some stations report in inches, some don't report at all
      let precipMm = 0;
      let rawValue = null;
      let unitCode = null;

      // Try precipitationLastHour first (most common)
      if (props.precipitationLastHour?.value !== null &&
          props.precipitationLastHour?.value !== undefined) {
        rawValue = props.precipitationLastHour.value;
        unitCode = props.precipitationLastHour.unitCode;
      }
      // Fallback to precipitationLast3Hours / 3
      else if (props.precipitationLast3Hours?.value !== null &&
               props.precipitationLast3Hours?.value !== undefined) {
        rawValue = props.precipitationLast3Hours.value / 3; // average per hour
        unitCode = props.precipitationLast3Hours.unitCode;
      }

      if (rawValue !== null && rawValue > 0) {
        // Convert based on unit code or infer from value magnitude
        if (unitCode === 'wmoUnit:mm' || unitCode === 'unit:mm') {
          precipMm = rawValue;
        } else if (unitCode === 'wmoUnit:m' || unitCode === 'unit:m') {
          precipMm = rawValue * 1000; // meters to mm
        } else if (unitCode === 'wmoUnit:inch' || unitCode === 'unit:inch' || rawValue < 5) {
          // If unitCode indicates inches OR value is small (likely inches)
          // 5 meters of rain per hour is impossible, but 5 inches is possible in extreme storms
          precipMm = rawValue * 25.4; // inches to mm
        } else {
          // Default: assume meters
          precipMm = rawValue * 1000;
        }

        // Final sanity check - skip impossible values (>100mm/hour is rare but possible)
        if (precipMm > 100) {
          // This is suspicious but might be valid in extreme weather
          // Skip values that would be >4 inches/hour as likely data errors
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

    // Track all days we have observations for (even if no rain)
    const daysWithObservations = new Set();
    for (const obs of obsData.features || []) {
      const date = new Date(obs.properties.timestamp).toISOString().split('T')[0];
      daysWithObservations.add(date);
    }

    // Sum up unique hourly readings
    for (const [hour, amount] of hourlyData.entries()) {
      totalMm += amount;

      // Track daily totals from unique hours
      const date = hour.split('T')[0];
      dailyRainfall[date] = (dailyRainfall[date] || 0) + amount;
    }

    // Calculate actual data coverage
    const daysWithPrecip = Object.keys(dailyRainfall).length;
    const observationDays = daysWithObservations.size;
    const dataComplete = observationDays >= days * 0.5; // Consider complete if we have 50%+ coverage

    console.log(`📅 Observation coverage: ${observationDays} days of data, ${daysWithPrecip} days with precipitation (of ${days} requested)`);
    if (lastRainEvent.date) {
      console.log(`🌧️ Last rain: ${lastRainEvent.date}, amount: ${lastRainEvent.amount?.toFixed(2)}mm`);
    }

    return {
      totalMm,
      totalInches: totalMm / 25.4,
      dailyRainfall,
      lastRainEvent,
      stationName: stationsData.features[0]?.properties?.name || 'Unknown Station',
      source: 'NWS',
      days,
      observationDays,
      daysWithPrecip,
      dataComplete,
      dataWarning: !dataComplete ? 'Limited observation data available' : null
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
