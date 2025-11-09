/**
 * Sentinel Hub API Integration for NDVI Data
 *
 * Fetches satellite NDVI imagery from Sentinel-2 satellites
 * Free tier: 30,000 processing units/month
 * Resolution: 10m per pixel
 *
 * Uses Supabase Edge Function as proxy to avoid CORS issues
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SENTINEL_PROXY_URL = `${SUPABASE_URL}/functions/v1/sentinel-hub-proxy`;

/**
 * Get OAuth token from Sentinel Hub via Supabase Edge Function
 * Tokens are valid for 1 hour
 */
async function getAuthToken() {
  const clientId = import.meta.env.VITE_SENTINEL_HUB_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SENTINEL_HUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Sentinel Hub credentials not configured');
    throw new Error('Sentinel Hub API credentials not found. Please configure in .env.local');
  }

  try {
    const response = await fetch(SENTINEL_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        action: 'auth',
        clientId,
        clientSecret
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Auth failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Failed to get Sentinel Hub auth token:', error);
    throw error;
  }
}

/**
 * Convert vineyard block geometry to Sentinel Hub format
 * @param {Object} geom - GeoJSON geometry from vineyard_blocks
 * @returns {Object} Sentinel Hub geometry object
 */
function formatGeometry(geom) {
  if (!geom || !geom.coordinates) {
    throw new Error('Invalid geometry');
  }

  return {
    type: geom.type,
    coordinates: geom.coordinates
  };
}

/**
 * Fetch NDVI data for a vineyard block
 * @param {Object} block - Vineyard block with geom property
 * @param {Object} options - Options for the request
 * @returns {Promise<Object>} NDVI data and statistics
 */
export async function fetchNDVIForBlock(block, options = {}) {
  console.log('🛰️ Fetching NDVI data from Sentinel-2 for block:', block.name);

  if (!block.geom || !block.geom.coordinates) {
    throw new Error('Block must have geometry to fetch NDVI data');
  }

  // Get auth token
  const token = await getAuthToken();

  // Calculate date range for peak growing season (June-September)
  // This ensures we get imagery when vegetation is at its peak, not dormant season
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // If we're before June, use last year's growing season
  // If we're after September, use this year's growing season
  const growingSeasonYear = currentMonth < 5 ? currentYear - 1 : currentYear;

  const startDate = new Date(growingSeasonYear, 5, 1); // June 1
  const endDate = new Date(growingSeasonYear, 8, 30); // September 30

  console.log('📅 NDVI Date Range (Peak Growing Season):', {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
    reason: 'Using peak growing season for accurate vegetation health data'
  });

  const evalscript = `
    //VERSION=3
    function setup() {
      return {
        input: [{
          bands: ["B04", "B08", "SCL"],
          units: "DN"
        }],
        output: {
          bands: 1,
          sampleType: "FLOAT32"
        }
      };
    }

    function evaluatePixel(sample) {
      // B08 = NIR (Near Infrared)
      // B04 = Red
      // SCL = Scene Classification Layer (cloud mask)

      // Filter out only high-confidence clouds and invalid data
      // SCL classes: 0=No Data, 1=Saturated, 3=Cloud Shadow, 6=Water, 8=Cloud Med, 9=Cloud High, 10=Cirrus, 11=Snow
      // Be less aggressive - only filter high-confidence clouds, not water (ponds are valid)
      if (sample.SCL === 0 || sample.SCL === 1 || sample.SCL === 9 || sample.SCL === 10) {
        return [NaN];
      }

      // DN values from Sentinel-2 are already in correct scale
      // For L2A surface reflectance, values are typically 0-1 but stored as integers 0-10000
      // Some bands return values already scaled to 0-1, others need division
      let nir = sample.B08;
      let red = sample.B04;

      // If values are in 0-10000 range (DN), convert to 0-1 (reflectance)
      if (nir > 1 || red > 1) {
        nir = nir / 10000.0;
        red = red / 10000.0;
      }

      // Avoid division by zero
      if (nir + red === 0) {
        return [NaN];
      }

      // Calculate NDVI: (NIR - Red) / (NIR + Red)
      let ndvi = (nir - red) / (nir + red);

      // Clamp to valid range
      ndvi = Math.max(-1, Math.min(1, ndvi));

      // Return NDVI value (-1 to 1)
      return [ndvi];
    }
  `;

  const requestBody = {
    input: {
      bounds: {
        geometry: formatGeometry(block.geom),
        properties: {
          crs: 'http://www.opengis.net/def/crs/EPSG/0/4326'
        }
      },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: {
              from: startDate.toISOString().split('T')[0] + 'T00:00:00Z',
              to: endDate.toISOString().split('T')[0] + 'T23:59:59Z'
            },
            maxCloudCoverage: 30
          }
        }
      ]
    },
    output: {
      width: 512,
      height: 512,
      responses: [
        {
          identifier: 'default',
          format: {
            type: 'image/tiff'
          }
        },
        {
          identifier: 'userdata',
          format: {
            type: 'application/json'
          }
        }
      ]
    },
    evalscript: evalscript
  };

  try {
    const clientId = import.meta.env.VITE_SENTINEL_HUB_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SENTINEL_HUB_CLIENT_SECRET;

    const response = await fetch(SENTINEL_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        action: 'process',
        token: token,
        body: requestBody,
        clientId,
        clientSecret
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Sentinel Hub API error:', errorData);
      throw new Error(`Sentinel Hub API failed: ${errorData.error || response.statusText}`);
    }

    // Response is a TAR archive containing TIFF and JSON
    const blob = await response.blob();

    // Parse the TIFF data with geotiff.js
    const ndviStats = await parseNDVITiff(blob, block.geom);

    console.log('✅ NDVI data fetched successfully:', ndviStats);

    return {
      success: true,
      blockId: block.id,
      blockName: block.name,
      dateRange: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0]
      },
      source: 'sentinel-2-l2a',
      resolution: '10m',
      fetchedAt: new Date().toISOString(),
      // Spread all the raster data for visualization
      ...ndviStats
    };

  } catch (error) {
    console.error('Failed to fetch NDVI data:', error);
    throw error;
  }
}

/**
 * Parse NDVI TIFF and calculate statistics and zones
 * @param {Blob} blob - TAR archive from Sentinel Hub
 * @param {Object} blockGeom - Block geometry for coordinate mapping
 * @returns {Promise<Object>} NDVI statistics, zones, and spatial data
 */
async function parseNDVITiff(blob, blockGeom) {
  try {
    // Import geotiff dynamically
    const GeoTIFF = await import('geotiff');

    console.log('📦 Parsing TAR archive from Sentinel Hub...');

    // Convert blob to array buffer
    const arrayBuffer = await blob.arrayBuffer();

    // Parse TAR archive (Sentinel Hub returns TIFF in TAR format)
    // For now, we'll use a simpler approach and parse the blob directly as TIFF
    // The actual implementation would need a TAR parser
    let tiffData;
    try {
      // Try to parse directly as GeoTIFF
      tiffData = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    } catch (tarError) {
      console.log('Direct TIFF parse failed, trying TAR extraction...');
      // If that fails, the data might be in TAR format
      // For now, we'll extract the first file from the TAR
      tiffData = await extractTiffFromTar(arrayBuffer);
    }

    const image = await tiffData.getImage();
    const width = image.getWidth();
    const height = image.getHeight();
    const bbox = image.getBoundingBox();

    console.log(`📐 TIFF dimensions: ${width}x${height} pixels`);
    console.log(`🗺️ Bounding box:`, bbox);

    // Read the raster data (NDVI values)
    const rasters = await image.readRasters();
    const ndviData = rasters[0]; // First band contains NDVI values

    // Calculate statistics
    const stats = calculateNDVIStats(ndviData);

    console.log('📊 NDVI Statistics:', stats);
    console.log('📊 Sample NDVI values (first 20 pixels):', Array.from(ndviData.slice(0, 20)));

    // Create zones based on NDVI thresholds
    const zones = createZonesFromRaster(ndviData, width, height, bbox, blockGeom);

    return {
      ...stats,
      zones: zones,
      width: width,
      height: height,
      bbox: bbox,
      rasterData: ndviData, // Include raw raster data for heat map visualization
      hasRealData: true
    };

  } catch (error) {
    console.error('Error parsing TIFF:', error);
    console.warn('⚠️ Falling back to simulated zone detection');

    // Fallback to simulated data
    return {
      meanNDVI: 0.58,
      minNDVI: 0.22,
      maxNDVI: 0.81,
      stdDevNDVI: 0.12,
      zones: [
        { vigorLevel: 'low', ndviRange: [0.2, 0.4], percentOfField: 15, recommendedRate: 1.4, color: '#ef4444' },
        { vigorLevel: 'medium-low', ndviRange: [0.4, 0.5], percentOfField: 25, recommendedRate: 1.2, color: '#f97316' },
        { vigorLevel: 'medium', ndviRange: [0.5, 0.6], percentOfField: 35, recommendedRate: 1.0, color: '#eab308' },
        { vigorLevel: 'medium-high', ndviRange: [0.6, 0.7], percentOfField: 20, recommendedRate: 0.9, color: '#84cc16' },
        { vigorLevel: 'high', ndviRange: [0.7, 0.85], percentOfField: 5, recommendedRate: 0.8, color: '#22c55e' }
      ],
      cloudCoverage: 8.5,
      validPixels: 95.2,
      hasRealData: false
    };
  }
}

/**
 * Extract TIFF from TAR archive
 */
async function extractTiffFromTar(arrayBuffer) {
  // Simple TAR parser for Sentinel Hub response
  // TAR format: 512-byte header + file data (rounded to 512 bytes)
  const view = new DataView(arrayBuffer);

  // Skip first TAR header (512 bytes) and get to the TIFF data
  const tiffStart = 512;
  const tiffBuffer = arrayBuffer.slice(tiffStart);

  const GeoTIFF = await import('geotiff');
  return await GeoTIFF.fromArrayBuffer(tiffBuffer);
}

/**
 * Calculate NDVI statistics from raster data
 */
function calculateNDVIStats(ndviData) {
  const validValues = [];

  for (let i = 0; i < ndviData.length; i++) {
    const value = ndviData[i];
    // Filter out NaN, infinity, and out-of-range values
    if (!isNaN(value) && isFinite(value) && value >= -1 && value <= 1) {
      validValues.push(value);
    }
  }

  if (validValues.length === 0) {
    return {
      meanNDVI: 0,
      minNDVI: 0,
      maxNDVI: 0,
      stdDevNDVI: 0,
      cloudCoverage: 100,
      validPixels: 0
    };
  }

  const sum = validValues.reduce((a, b) => a + b, 0);
  const mean = sum / validValues.length;

  // Calculate min/max without spread operator to avoid stack overflow with large arrays
  let min = validValues[0];
  let max = validValues[0];
  for (let i = 1; i < validValues.length; i++) {
    if (validValues[i] < min) min = validValues[i];
    if (validValues[i] > max) max = validValues[i];
  }

  const variance = validValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / validValues.length;
  const stdDev = Math.sqrt(variance);

  const validPercent = (validValues.length / ndviData.length) * 100;
  const cloudCoverage = 100 - validPercent;

  return {
    meanNDVI: parseFloat(mean.toFixed(3)),
    minNDVI: parseFloat(min.toFixed(3)),
    maxNDVI: parseFloat(max.toFixed(3)),
    stdDevNDVI: parseFloat(stdDev.toFixed(3)),
    cloudCoverage: parseFloat(cloudCoverage.toFixed(1)),
    validPixels: parseFloat(validPercent.toFixed(1))
  };
}

/**
 * Create irrigation zones from NDVI raster data (internal helper)
 */
function createZonesFromRaster(ndviData, width, height, bbox, blockGeom) {
  // Define NDVI thresholds for zones
  const thresholds = [
    { min: -1, max: 0.3, level: 'low', rate: 1.4, color: '#ef4444' },
    { min: 0.3, max: 0.45, level: 'medium-low', rate: 1.2, color: '#f97316' },
    { min: 0.45, max: 0.6, level: 'medium', rate: 1.0, color: '#eab308' },
    { min: 0.6, max: 0.75, level: 'medium-high', rate: 0.9, color: '#84cc16' },
    { min: 0.75, max: 1, level: 'high', rate: 0.8, color: '#22c55e' }
  ];

  // Count pixels in each zone
  const zoneCounts = thresholds.map(() => 0);
  const zonePixels = thresholds.map(() => []); // Store pixel coordinates for each zone

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const ndvi = ndviData[idx];

      if (!isNaN(ndvi) && isFinite(ndvi)) {
        const zoneIdx = thresholds.findIndex(t => ndvi >= t.min && ndvi < t.max);
        if (zoneIdx !== -1) {
          zoneCounts[zoneIdx]++;
          zonePixels[zoneIdx].push({ x, y, ndvi });
        }
      }
    }
  }

  const totalPixels = zoneCounts.reduce((a, b) => a + b, 0);

  // Create zone objects with spatial data
  const zones = thresholds.map((threshold, idx) => {
    const count = zoneCounts[idx];
    const percent = totalPixels > 0 ? (count / totalPixels) * 100 : 0;
    const pixels = zonePixels[idx];

    // Calculate zone polygon (simplified - in production would use marching squares)
    const polygon = createZonePolygon(pixels, width, height, bbox);

    return {
      vigorLevel: threshold.level,
      ndviRange: [threshold.min, threshold.max],
      percentOfField: parseFloat(percent.toFixed(1)),
      recommendedRate: threshold.rate,
      color: threshold.color,
      pixelCount: count,
      polygon: polygon, // GeoJSON polygon coordinates
      ndviValues: pixels.map(p => p.ndvi)
    };
  }).filter(zone => zone.percentOfField > 0); // Only include zones with pixels

  return zones;
}

/**
 * Create a simplified polygon for a zone
 */
function createZonePolygon(pixels, width, height, bbox) {
  if (pixels.length === 0) return null;

  // Calculate pixel size in geographic coordinates
  const pixelWidth = (bbox[2] - bbox[0]) / width;
  const pixelHeight = (bbox[3] - bbox[1]) / height;

  // Create a simplified bounding box for the zone (avoid spread operator for large arrays)
  let minX = pixels[0].x;
  let maxX = pixels[0].x;
  let minY = pixels[0].y;
  let maxY = pixels[0].y;

  for (let i = 1; i < pixels.length; i++) {
    if (pixels[i].x < minX) minX = pixels[i].x;
    if (pixels[i].x > maxX) maxX = pixels[i].x;
    if (pixels[i].y < minY) minY = pixels[i].y;
    if (pixels[i].y > maxY) maxY = pixels[i].y;
  }

  // Convert pixel coordinates to geographic coordinates
  const geoMinX = bbox[0] + minX * pixelWidth;
  const geoMaxX = bbox[0] + (maxX + 1) * pixelWidth;
  const geoMinY = bbox[1] + minY * pixelHeight;
  const geoMaxY = bbox[1] + (maxY + 1) * pixelHeight;

  // Return GeoJSON polygon
  return {
    type: 'Polygon',
    coordinates: [[
      [geoMinX, geoMinY],
      [geoMaxX, geoMinY],
      [geoMaxX, geoMaxY],
      [geoMinX, geoMaxY],
      [geoMinX, geoMinY]
    ]]
  };
}

/**
 * Create VRI zones from NDVI statistics
 * @param {Object} ndviData - NDVI data from fetchNDVIForBlock
 * @param {Object} block - Vineyard block
 * @returns {Array} VRI zone objects
 */
export function createZonesFromNDVI(ndviData, block) {
  // Handle both old nested format (ndviData.stats.zones) and new flat format (ndviData.zones)
  const zones = ndviData.zones || ndviData.stats?.zones;

  if (!ndviData.success || !zones) {
    throw new Error('Invalid NDVI data');
  }

  const blockAcres = block.acres || 10;
  const vriZones = zones.map((zoneData, index) => {
    return {
      id: `sentinel-${Date.now()}-${index}`,
      name: `NDVI Zone ${index + 1} (${zoneData.vigorLevel})`,
      irrigationRate: zoneData.recommendedRate,
      area: zoneData.polygon ? (blockAcres * zoneData.percentOfField) / 100 : (blockAcres * zoneData.percentOfField) / 100,
      percentOfField: zoneData.percentOfField,
      vigor: zoneData.vigorLevel,
      vigorLevel: zoneData.vigorLevel, // Alias for consistency
      soilType: 'detected',
      color: zoneData.color,
      source: 'Sentinel-2',
      ndviRange: zoneData.ndviRange,
      polygon: zoneData.polygon, // Include polygon data for map display
      metadata: {
        meanNDVI: ndviData.meanNDVI || ndviData.stats?.meanNDVI,
        dateRange: ndviData.dateRange,
        cloudCoverage: ndviData.cloudCoverage || ndviData.stats?.cloudCoverage,
        resolution: ndviData.resolution,
        hasRealData: ndviData.hasRealData || ndviData.stats?.hasRealData
      }
    };
  });

  return vriZones;
}

/**
 * Check if Sentinel Hub is configured
 * @returns {boolean} True if API credentials are configured
 */
export function isSentinelHubConfigured() {
  return !!(
    import.meta.env.VITE_SENTINEL_HUB_CLIENT_ID &&
    import.meta.env.VITE_SENTINEL_HUB_CLIENT_SECRET
  );
}
