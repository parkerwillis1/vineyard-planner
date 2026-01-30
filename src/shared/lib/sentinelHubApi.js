/**
 * Sentinel Hub API Integration for NDVI Data - V2 Caching
 *
 * Fetches satellite NDVI imagery from Sentinel-2 satellites
 * Free tier: 30,000 processing units/month
 * Resolution: 10m per pixel
 *
 * Uses Supabase Edge Function as proxy to avoid CORS issues
 *
 * V2 Caching Features:
 * - Data-aware cache keys (AOI hash, evalscript hash, processing params)
 * - In-flight request coalescing (concurrent requests share a single promise)
 * - Stale-while-revalidate (returns stale data immediately, refreshes in background)
 * - Extended cacheMeta in response payload
 */

import { supabase } from './supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SENTINEL_PROXY_URL = `${SUPABASE_URL}/functions/v1/sentinel-hub-proxy`;

// Cache TTL constants
const SCENE_CACHE_TTL_HOURS = 24;
const RESULT_CACHE_TTL_DAYS = 30;
const STALE_THRESHOLD_DAYS = 7; // Return stale data if older than this, trigger refresh

// Default processing parameters
const DEFAULT_RESOLUTION = 512;
const DEFAULT_CLOUD_THRESHOLD = 30;
const DEFAULT_DATA_COLLECTION = 'sentinel-2-l2a';

// In-flight request map for coalescing concurrent requests
const inFlightRequests = new Map();

// Background refresh tracking to prevent duplicate refreshes
const backgroundRefreshes = new Map();

// ============================================================================
// HASH VERSIONING
// Bump these when changing hash algorithms to avoid cross-version cache hits
// ============================================================================
const AOI_HASH_VERSION = 'v2';      // Bump when changing coordinate precision or algorithm
const EVAL_HASH_VERSION = 'v2';     // Bump when changing evalscript normalization

// ============================================================================
// HASHING UTILITIES
// ============================================================================

/**
 * Simple hash function for strings (djb2 algorithm)
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a versioned hash for AOI (Area of Interest) geometry
 * Rounds coordinates to 6 decimal places for stability
 * Returns versioned format: "v2:abc123"
 */
function hashAOI(geom) {
  if (!geom || !geom.coordinates) return `${AOI_HASH_VERSION}:no-geom`;

  // Flatten coordinates and round to 6 decimal places
  const coordStr = JSON.stringify(geom.coordinates, (key, val) =>
    typeof val === 'number' ? Math.round(val * 1000000) / 1000000 : val
  );
  return `${AOI_HASH_VERSION}:${hashString(coordStr)}`;
}

/**
 * Generate a versioned hash for the evalscript
 * Returns versioned format: "v2:xyz789"
 */
function hashEvalscript(evalscript) {
  // Remove whitespace for consistent hashing
  const normalized = evalscript.replace(/\s+/g, ' ').trim();
  return `${EVAL_HASH_VERSION}:${hashString(normalized)}`;
}

/**
 * Check if a hash is from a legacy version (bbox-based or old version)
 */
function isLegacyHash(hash) {
  if (!hash) return true;
  if (hash.startsWith('legacy')) return true;
  // Check for versioned format
  if (!hash.includes(':')) return true;
  // Check version prefix
  const version = hash.split(':')[0];
  return version !== AOI_HASH_VERSION && version !== EVAL_HASH_VERSION;
}

/**
 * Generate a composite cache key for result lookups
 */
function generateCacheKey(blockId, aoiHash, evalHash, resolution, cloudThreshold, fromDate, toDate, dataCollection = DEFAULT_DATA_COLLECTION) {
  return `${blockId}:${aoiHash}:${evalHash}:${resolution}:${cloudThreshold}:${fromDate}:${toDate}:${dataCollection}`;
}

// ============================================================================
// ERROR HANDLING & RETRY LOGIC
// ============================================================================

// Error codes from server
const ERROR_CODES = {
  RATE_LIMITED: 'RATE_LIMITED',
  UPSTREAM_RATE_LIMITED: 'UPSTREAM_RATE_LIMITED',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  INVALID_GEOMETRY: 'INVALID_GEOMETRY',
  PROCESS_FAILED: 'PROCESS_FAILED'
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000
};

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt, retryAfterSeconds = 0) {
  // Use server-suggested retry-after if available
  if (retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }
  // Otherwise use exponential backoff
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error) {
  if (!error) return false;

  // Rate limits are retryable after waiting
  if (error.code === ERROR_CODES.RATE_LIMITED) return true;
  if (error.code === ERROR_CODES.UPSTREAM_RATE_LIMITED) return true;

  // Upstream errors might be transient
  if (error.code === ERROR_CODES.UPSTREAM_ERROR) return true;

  // HTTP 5xx errors are retryable
  if (error.status >= 500 && error.status < 600) return true;

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// BINARY ENCODING UTILITIES
// ============================================================================

/**
 * Convert Float32Array to base64 string for storage
 */
function float32ArrayToBase64(float32Array) {
  const uint8 = new Uint8Array(float32Array.buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

/**
 * Convert base64 string back to Float32Array
 */
function base64ToFloat32Array(base64) {
  const binary = atob(base64);
  const uint8 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    uint8[i] = binary.charCodeAt(i);
  }
  return new Float32Array(uint8.buffer);
}

// ============================================================================
// CACHE AGE UTILITIES
// ============================================================================

/**
 * Calculate age of cache entry in hours
 */
function getCacheAgeHours(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  return (now - created) / (1000 * 60 * 60);
}

/**
 * Calculate age of cache entry in days
 */
function getCacheAgeDays(createdAt) {
  return getCacheAgeHours(createdAt) / 24;
}

/**
 * Check if a cache entry is expired (hard TTL)
 */
function isCacheExpired(createdAt, ttlHours) {
  return getCacheAgeHours(createdAt) > ttlHours;
}

/**
 * Check if a cache entry is stale (soft TTL - should refresh but can use)
 */
function isCacheStale(createdAt) {
  return getCacheAgeDays(createdAt) > STALE_THRESHOLD_DAYS;
}

// ============================================================================
// SCENE CACHE (Catalog API results)
// ============================================================================

/**
 * Get cached scene info with data-aware key validation
 * Treats legacy (non-versioned) cache entries as misses
 */
async function getCachedScene(blockId, fromDate, toDate, aoiHash, cloudThreshold, dataCollection = DEFAULT_DATA_COLLECTION) {
  try {
    const { data, error } = await supabase
      .from('ndvi_scene_cache')
      .select('*')
      .eq('block_id', blockId)
      .eq('from_date', fromDate)
      .eq('to_date', toDate)
      .eq('aoi_hash', aoiHash)
      .eq('cloud_threshold', cloudThreshold)
      .eq('data_collection', dataCollection)
      .single();

    if (error || !data) return null;

    // Check for legacy hash format - treat as miss and clean up
    if (isLegacyHash(data.aoi_hash)) {
      console.log('🔄 Legacy scene cache entry detected, treating as miss:', data.aoi_hash);
      // Delete legacy entry so it gets replaced on next fetch
      await supabase.from('ndvi_scene_cache').delete().eq('id', data.id);
      return null;
    }

    // Check if cache is expired (24 hours hard TTL)
    if (isCacheExpired(data.created_at, SCENE_CACHE_TTL_HOURS)) {
      console.log('📅 Scene cache expired, will refresh');
      await supabase.from('ndvi_scene_cache').delete().eq('id', data.id);
      return null;
    }

    console.log('✅ Scene cache hit:', data.scene_id);
    return {
      ...data,
      ageHours: getCacheAgeHours(data.created_at),
      quality_score: data.quality_score ? JSON.parse(data.quality_score) : null
    };
  } catch (err) {
    console.warn('Scene cache lookup error:', err);
    return null;
  }
}

/**
 * Store scene info in cache with data-aware keys
 */
async function setCachedScene(blockId, fromDate, toDate, sceneInfo, bbox, aoiHash, cloudThreshold, dataCollection = DEFAULT_DATA_COLLECTION) {
  try {
    const { error } = await supabase.from('ndvi_scene_cache').upsert({
      block_id: blockId,
      from_date: fromDate,
      to_date: toDate,
      scene_id: sceneInfo.tileId,
      acquisition_date: sceneInfo.acquisitionDate,
      cloud_cover: sceneInfo.cloudCover,
      bbox_json: bbox,
      available_images: sceneInfo.availableImages || 0,
      aoi_hash: aoiHash,
      cloud_threshold: cloudThreshold,
      data_collection: dataCollection,
      quality_score: sceneInfo.qualityScore ? JSON.stringify(sceneInfo.qualityScore) : null
    }, {
      onConflict: 'block_id,from_date,to_date,aoi_hash,cloud_threshold'
    });

    if (error) {
      console.warn('Failed to cache scene:', error);
    } else {
      console.log('💾 Scene cached:', sceneInfo.tileId);
    }
  } catch (err) {
    console.warn('Scene cache store error:', err);
  }
}

// ============================================================================
// RESULT CACHE (Process API results)
// ============================================================================

/**
 * Get cached NDVI result with data-aware key validation
 * Returns result with stale flag if older than STALE_THRESHOLD_DAYS
 * Treats legacy (non-versioned) cache entries as misses
 */
async function getCachedResult(blockId, sceneId, evalHash, aoiHash, resolution, dataCollection = DEFAULT_DATA_COLLECTION) {
  try {
    const { data, error } = await supabase
      .from('ndvi_result_cache')
      .select('*')
      .eq('block_id', blockId)
      .eq('scene_id', sceneId)
      .eq('evalscript_hash', evalHash)
      .eq('aoi_hash', aoiHash)
      .eq('resolution', resolution)
      .eq('data_collection', dataCollection)
      .single();

    if (error || !data) return null;

    // Check for legacy hash formats - treat as miss and clean up
    if (isLegacyHash(data.aoi_hash) || isLegacyHash(data.evalscript_hash)) {
      console.log('🔄 Legacy result cache entry detected, treating as miss');
      console.log('   aoi_hash:', data.aoi_hash, '| evalscript_hash:', data.evalscript_hash);
      // Delete legacy entry so it gets replaced on next fetch
      await supabase.from('ndvi_result_cache').delete().eq('id', data.id);
      return null;
    }

    const ageDays = getCacheAgeDays(data.created_at);

    // Check if cache is expired (30 days hard TTL)
    if (ageDays > RESULT_CACHE_TTL_DAYS) {
      console.log('📅 Result cache expired, will refresh');
      await supabase.from('ndvi_result_cache').delete().eq('id', data.id);
      return null;
    }

    const isStale = ageDays > STALE_THRESHOLD_DAYS;
    console.log(`✅ Result cache hit for scene: ${sceneId} (${isStale ? 'stale' : 'fresh'}, ${ageDays.toFixed(1)} days old)`);

    return {
      result: data.result_json,
      createdAt: data.created_at,
      ageDays: ageDays,
      stale: isStale
    };
  } catch (err) {
    console.warn('Result cache lookup error:', err);
    return null;
  }
}

/**
 * Store NDVI result in cache with data-aware keys
 */
async function setCachedResult(blockId, sceneId, result, evalHash, aoiHash, resolution, cloudThreshold, fromDate, toDate) {
  try {
    // Prepare result for storage - convert Float32Array to base64
    const storageResult = {
      ...result,
      rasterData: result.rasterData ? float32ArrayToBase64(result.rasterData) : null,
      rasterDataEncoding: result.rasterData ? 'base64-float32' : null
    };

    const { error } = await supabase.from('ndvi_result_cache').upsert({
      block_id: blockId,
      scene_id: sceneId,
      evalscript_version: 'v2', // Keep for backwards compat
      evalscript_hash: evalHash,
      result_json: storageResult,
      aoi_hash: aoiHash,
      resolution: resolution,
      cloud_threshold: cloudThreshold,
      data_collection: DEFAULT_DATA_COLLECTION,
      date_from: fromDate,
      date_to: toDate
    }, {
      onConflict: 'block_id,scene_id,evalscript_hash,aoi_hash,resolution'
    });

    if (error) {
      console.warn('Failed to cache result:', error);
    } else {
      console.log('💾 Result cached for scene:', sceneId);
    }
  } catch (err) {
    console.warn('Result cache store error:', err);
  }
}

/**
 * Restore cached result (decode rasterData from base64)
 */
function restoreCachedResult(cachedResult) {
  if (!cachedResult) return null;

  const result = { ...cachedResult };

  if (result.rasterData && result.rasterDataEncoding === 'base64-float32') {
    result.rasterData = base64ToFloat32Array(result.rasterData);
    delete result.rasterDataEncoding;
  }

  return result;
}

// ============================================================================
// SCENE QUALITY SCORING
// ============================================================================

/**
 * Quality scoring weights for scene selection
 * Adjust these to prioritize different factors
 */
const QUALITY_WEIGHTS = {
  cloudCover: 0.40,      // 40% weight on cloud cover (lower is better)
  recency: 0.25,         // 25% weight on how recent the image is
  growingSeason: 0.25,   // 25% weight on growing season relevance
  viewAngle: 0.10        // 10% weight on viewing angle (if available)
};

/**
 * Growing season months for Northern Hemisphere vineyards
 * April-October is peak growing season for NDVI relevance
 */
const GROWING_SEASON_MONTHS = [4, 5, 6, 7, 8, 9, 10];

/**
 * Calculate a quality score for a satellite scene
 * Returns { total: number (0-100), breakdown: { cloudScore, recencyScore, ... } }
 */
function calculateSceneQualityScore(feature) {
  const props = feature.properties;
  const datetime = new Date(props.datetime);

  // 1. Cloud Cover Score (0-100, lower cloud = higher score)
  const cloudCover = props['eo:cloud_cover'] ?? 50;
  const cloudScore = Math.max(0, 100 - cloudCover);

  // 2. Recency Score (0-100, more recent = higher score)
  // Decay over 90 days (3 months)
  const now = new Date();
  const daysSinceCapture = (now - datetime) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 100 - (daysSinceCapture / 90) * 100);

  // 3. Growing Season Score (0-100, in-season = higher score)
  const month = datetime.getMonth() + 1; // 1-indexed
  const isGrowingSeason = GROWING_SEASON_MONTHS.includes(month);
  // Peak months (June-August) get 100, shoulder months get 70, off-season gets 30
  let growingSeasonScore;
  if (month >= 6 && month <= 8) {
    growingSeasonScore = 100; // Peak growing season
  } else if (isGrowingSeason) {
    growingSeasonScore = 70;  // Shoulder season
  } else {
    growingSeasonScore = 30;  // Off-season (still usable for some purposes)
  }

  // 4. View Angle Score (0-100, lower angle = higher score)
  // Sentinel-2 provides view angles if available
  const viewAngle = props['view:off_nadir'] ?? props['s2:mean_solar_zenith'] ?? 0;
  const viewAngleScore = Math.max(0, 100 - viewAngle * 2); // Penalize high angles

  // Calculate weighted total
  const total =
    cloudScore * QUALITY_WEIGHTS.cloudCover +
    recencyScore * QUALITY_WEIGHTS.recency +
    growingSeasonScore * QUALITY_WEIGHTS.growingSeason +
    viewAngleScore * QUALITY_WEIGHTS.viewAngle;

  return {
    total,
    breakdown: {
      cloudScore: Math.round(cloudScore),
      recencyScore: Math.round(recencyScore),
      growingSeasonScore: Math.round(growingSeasonScore),
      viewAngleScore: Math.round(viewAngleScore),
      daysSinceCapture: Math.round(daysSinceCapture)
    }
  };
}

// ============================================================================
// AUTH & CATALOG
// ============================================================================

/**
 * Get OAuth token from Sentinel Hub
 * Credentials are stored securely on the server-side Edge Function
 */
async function getAuthToken() {
  const response = await fetch(SENTINEL_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ action: 'auth' })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Auth failed: ${errorData.error || response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Search the Sentinel Hub Catalog for available imagery
 * Credentials are stored securely on the server-side Edge Function
 */
async function searchCatalog(geom, startDate, endDate, token, cloudThreshold, dataCollection = DEFAULT_DATA_COLLECTION) {
  const catalogBody = {
    bbox: getBoundingBox(geom),
    datetime: `${startDate.toISOString().split('T')[0]}T00:00:00Z/${endDate.toISOString().split('T')[0]}T23:59:59Z`,
    collections: [dataCollection],
    limit: 20,
    filter: {
      op: '<=',
      args: [{ property: 'eo:cloud_cover' }, cloudThreshold]
    }
  };

  try {
    const response = await fetch(SENTINEL_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        action: 'catalog',
        token: token,
        body: catalogBody
      })
    });

    if (!response.ok) {
      console.warn('Catalog search failed');
      return null;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      // Score each scene using quality metrics
      const scoredScenes = data.features.map(feature => {
        const score = calculateSceneQualityScore(feature);
        return { feature, score };
      });

      // Sort by quality score (highest first)
      scoredScenes.sort((a, b) => b.score.total - a.score.total);

      const best = scoredScenes[0];
      console.log('📅 Best available image:', {
        date: best.feature.properties.datetime,
        cloudCover: best.feature.properties['eo:cloud_cover'],
        qualityScore: best.score.total.toFixed(2),
        scoreBreakdown: best.score.breakdown,
        totalFound: data.features.length
      });

      return {
        acquisitionDate: best.feature.properties.datetime,
        cloudCover: best.feature.properties['eo:cloud_cover'],
        tileId: best.feature.id,
        availableImages: data.features.length,
        qualityScore: best.score
      };
    }

    return null;
  } catch (error) {
    console.warn('Catalog search error:', error);
    return null;
  }
}

// ============================================================================
// GEOMETRY UTILITIES
// ============================================================================

function getBoundingBox(geom) {
  const coords = geom.coordinates[0];
  let minLng = coords[0][0], maxLng = coords[0][0];
  let minLat = coords[0][1], maxLat = coords[0][1];

  for (const coord of coords) {
    if (coord[0] < minLng) minLng = coord[0];
    if (coord[0] > maxLng) maxLng = coord[0];
    if (coord[1] < minLat) minLat = coord[1];
    if (coord[1] > maxLat) maxLat = coord[1];
  }

  return [minLng, minLat, maxLng, maxLat];
}

function formatGeometry(geom) {
  if (!geom || !geom.coordinates) {
    throw new Error('Invalid geometry');
  }
  return { type: geom.type, coordinates: geom.coordinates };
}

// ============================================================================
// EVALSCRIPT
// ============================================================================

const NDVI_EVALSCRIPT = `
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
  if (sample.SCL === 0 || sample.SCL === 1 || sample.SCL === 9 || sample.SCL === 10) {
    return [NaN];
  }

  let nir = sample.B08;
  let red = sample.B04;

  if (nir > 1 || red > 1) {
    nir = nir / 10000.0;
    red = red / 10000.0;
  }

  if (nir + red === 0) {
    return [NaN];
  }

  let ndvi = (nir - red) / (nir + red);
  ndvi = Math.max(-1, Math.min(1, ndvi));

  return [ndvi];
}
`;

const EVALSCRIPT_HASH = hashEvalscript(NDVI_EVALSCRIPT);

// ============================================================================
// MAIN FETCH FUNCTION
// ============================================================================

/**
 * Fetch NDVI data for a vineyard block with v2 caching
 *
 * @param {Object} block - Vineyard block with geom property
 * @param {Object} options - Options for the request
 * @param {boolean} options.skipCache - Force refresh, ignore cache
 * @param {number} options.resolution - Output resolution (default 512)
 * @param {number} options.cloudThreshold - Max cloud cover % (default 30)
 * @param {Date} options.startDate - Start of search range
 * @param {Date} options.endDate - End of search range
 * @returns {Promise<Object>} NDVI data with cache metadata
 */
export async function fetchNDVIForBlock(block, options = {}) {
  console.log('🛰️ Fetching NDVI data from Sentinel-2 for block:', block.name);

  if (!block.geom || !block.geom.coordinates) {
    throw new Error('Block must have geometry to fetch NDVI data');
  }

  // Extract options with defaults
  const resolution = options.resolution || DEFAULT_RESOLUTION;
  const cloudThreshold = options.cloudThreshold || DEFAULT_CLOUD_THRESHOLD;
  const skipCache = options.skipCache || false;

  // Calculate date range - default to last 30 days for most recent imagery
  let startDate, endDate;
  if (options.startDate && options.endDate) {
    startDate = options.startDate;
    endDate = options.endDate;
  } else {
    // Default: last 30 days to get the most current satellite imagery
    const now = new Date();
    endDate = new Date(now);
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    console.log(`📅 Using default date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} (last 30 days)`);
  }

  const fromDateStr = startDate.toISOString().split('T')[0];
  const toDateStr = endDate.toISOString().split('T')[0];

  // Generate data-aware cache keys
  const aoiHash = hashAOI(block.geom);
  const evalHash = EVALSCRIPT_HASH;
  const dataCollection = options.dataCollection || DEFAULT_DATA_COLLECTION;
  const cacheKey = generateCacheKey(block.id, aoiHash, evalHash, resolution, cloudThreshold, fromDateStr, toDateStr, dataCollection);

  // Key parts for cacheMeta response
  const keyParts = {
    aoiHash,
    evalHash,
    resolution,
    cloudThreshold,
    dataCollection,
    dateRange: { from: fromDateStr, to: toDateStr }
  };

  console.log('🔑 Cache key parts:', keyParts);

  // =========================================================================
  // IN-FLIGHT REQUEST COALESCING
  // =========================================================================
  if (!skipCache && inFlightRequests.has(cacheKey)) {
    console.log('🔄 Coalescing with in-flight request for:', cacheKey);
    return inFlightRequests.get(cacheKey);
  }

  // Create the fetch promise
  const fetchPromise = (async () => {
    try {
      return await _fetchNDVIForBlockInternal(
        block,
        { ...options, resolution, cloudThreshold, startDate, endDate },
        { fromDateStr, toDateStr, aoiHash, evalHash, cacheKey, keyParts }
      );
    } finally {
      // Clean up in-flight tracking
      inFlightRequests.delete(cacheKey);
    }
  })();

  // Track in-flight request
  if (!skipCache) {
    inFlightRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

/**
 * Internal fetch implementation
 */
async function _fetchNDVIForBlockInternal(block, options, cacheParams) {
  const { resolution, cloudThreshold, startDate, endDate, skipCache, dataCollection } = options;
  const { fromDateStr, toDateStr, aoiHash, evalHash, cacheKey, keyParts } = cacheParams;
  const collection = dataCollection || DEFAULT_DATA_COLLECTION;

  // Initialize response tracking
  const cacheHit = { scene: false, ndvi: false };
  const cacheMeta = {
    sceneAgeHours: null,
    ndviAgeDays: null,
    stale: false,
    refreshing: false,
    keyParts
  };

  // =========================================================================
  // STEP 1: Check scene cache
  // =========================================================================
  let sceneId = null;
  let acquisitionDate = null;
  let cloudCover = null;
  let availableImages = 0;
  let qualityScore = null;

  if (!skipCache) {
    const cachedScene = await getCachedScene(block.id, fromDateStr, toDateStr, aoiHash, cloudThreshold, collection);
    if (cachedScene) {
      cacheHit.scene = true;
      cacheMeta.sceneAgeHours = cachedScene.ageHours;
      sceneId = cachedScene.scene_id;
      acquisitionDate = cachedScene.acquisition_date;
      cloudCover = cachedScene.cloud_cover;
      availableImages = cachedScene.available_images;
      qualityScore = cachedScene.quality_score || null;
      console.log('📅 Using cached scene:', sceneId);
    }
  }

  // If no cached scene, fetch from Catalog API
  if (!sceneId) {
    const token = await getAuthToken();
    const catalogResult = await searchCatalog(block.geom, startDate, endDate, token, cloudThreshold, collection);

    if (catalogResult) {
      sceneId = catalogResult.tileId;
      acquisitionDate = catalogResult.acquisitionDate;
      cloudCover = catalogResult.cloudCover;
      availableImages = catalogResult.availableImages;
      qualityScore = catalogResult.qualityScore || null;

      const bbox = getBoundingBox(block.geom);
      await setCachedScene(block.id, fromDateStr, toDateStr, catalogResult, bbox, aoiHash, cloudThreshold, collection);
    }
  }

  // =========================================================================
  // STEP 2: Check result cache with stale-while-revalidate
  // =========================================================================
  if (sceneId && !skipCache) {
    const cachedResult = await getCachedResult(block.id, sceneId, evalHash, aoiHash, resolution, collection);

    if (cachedResult) {
      cacheHit.ndvi = true;
      cacheMeta.ndviAgeDays = cachedResult.ageDays;
      cacheMeta.stale = cachedResult.stale;

      const restored = restoreCachedResult(cachedResult.result);

      // If stale, trigger background refresh (but return cached data immediately)
      if (cachedResult.stale) {
        const refreshKey = `refresh:${cacheKey}`;

        if (!backgroundRefreshes.has(refreshKey)) {
          console.log('🔄 Triggering background refresh for stale data');
          cacheMeta.refreshing = true;

          // Start background refresh
          const refreshPromise = _refreshNDVIInBackground(
            block, sceneId, options, cacheParams
          ).finally(() => {
            backgroundRefreshes.delete(refreshKey);
          });

          backgroundRefreshes.set(refreshKey, refreshPromise);
        } else {
          console.log('🔄 Background refresh already in progress');
          cacheMeta.refreshing = true;
        }
      }

      console.log('✅ Returning cached NDVI result', cacheMeta.stale ? '(stale)' : '(fresh)');
      return _buildResponse(block, {
        fromDateStr, toDateStr, acquisitionDate, sceneId, cloudCover, availableImages,
        cacheHit, cacheMeta, result: restored, qualityScore
      });
    }
  }

  // =========================================================================
  // STEP 3: Fetch fresh data from Process API
  // =========================================================================
  const result = await _fetchFreshNDVI(block, sceneId, options, cacheParams);

  return _buildResponse(block, {
    fromDateStr, toDateStr, acquisitionDate, sceneId, cloudCover, availableImages,
    cacheHit, cacheMeta, result, qualityScore
  });
}

/**
 * Fetch fresh NDVI data from Process API with retry logic
 */
async function _fetchFreshNDVI(block, sceneId, options, cacheParams) {
  const { resolution, cloudThreshold, startDate, endDate, dataCollection } = options;
  const { fromDateStr, toDateStr, aoiHash, evalHash } = cacheParams;
  const collection = dataCollection || DEFAULT_DATA_COLLECTION;

  const requestBody = {
    input: {
      bounds: {
        geometry: formatGeometry(block.geom),
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' }
      },
      data: [{
        type: collection,
        dataFilter: {
          timeRange: {
            from: startDate.toISOString().split('T')[0] + 'T00:00:00Z',
            to: endDate.toISOString().split('T')[0] + 'T23:59:59Z'
          },
          maxCloudCoverage: cloudThreshold,
          mosaickingOrder: 'leastCC' // Use least cloud cover for consistent scene selection
        }
      }]
    },
    output: {
      width: resolution,
      height: resolution,
      responses: [
        { identifier: 'default', format: { type: 'image/tiff' } },
        { identifier: 'userdata', format: { type: 'application/json' } }
      ]
    },
    evalscript: NDVI_EVALSCRIPT
  };

  // Retry loop with exponential backoff
  let lastError = null;
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      // Get fresh token for each attempt (tokens might expire)
      const token = await getAuthToken();

      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${RETRY_CONFIG.maxRetries}...`);
      }

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
          body: requestBody
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = {
          code: errorData.code || 'UNKNOWN',
          message: errorData.error || response.statusText,
          status: response.status,
          retryAfter: parseInt(response.headers.get('Retry-After') || '0', 10)
        };

        // Check if this error is retryable
        if (isRetryableError(error) && attempt < RETRY_CONFIG.maxRetries) {
          const delay = getBackoffDelay(attempt, error.retryAfter);
          console.log(`⏳ Rate limited or transient error. Waiting ${delay}ms before retry...`);
          await sleep(delay);
          lastError = error;
          continue;
        }

        // Non-retryable error or max retries reached
        const enhancedError = new Error(`Sentinel Hub API failed: ${error.message}`);
        enhancedError.code = error.code;
        enhancedError.status = error.status;
        enhancedError.retryable = isRetryableError(error);
        throw enhancedError;
      }

      const blob = await response.blob();
      const ndviStats = await parseNDVITiff(blob, block.geom);

      if (attempt > 0) {
        console.log(`✅ NDVI data fetched successfully after ${attempt} retries`);
      } else {
        console.log('✅ NDVI data fetched successfully');
      }

      const result = {
        ...ndviStats,
        fetchedAt: new Date().toISOString(),
        retryAttempts: attempt
      };

      // Cache the result
      if (sceneId) {
        await setCachedResult(block.id, sceneId, result, evalHash, aoiHash, resolution, cloudThreshold, fromDateStr, toDateStr);
      }

      return result;

    } catch (err) {
      // Network errors or other unexpected errors
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = getBackoffDelay(attempt);
        console.log(`⏳ Request failed: ${err.message}. Waiting ${delay}ms before retry...`);
        await sleep(delay);
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  // If we get here, all retries failed
  const finalError = new Error(`NDVI fetch failed after ${RETRY_CONFIG.maxRetries} retries: ${lastError?.message || 'Unknown error'}`);
  finalError.code = lastError?.code || 'MAX_RETRIES_EXCEEDED';
  finalError.retryable = false;
  throw finalError;
}

/**
 * Background refresh for stale data
 * Dispatches 'ndvi-refreshed' event when complete so UI can update
 */
async function _refreshNDVIInBackground(block, sceneId, options, cacheParams) {
  try {
    console.log('🔄 Background refresh starting...');
    const result = await _fetchFreshNDVI(block, sceneId, options, cacheParams);
    console.log('✅ Background refresh complete');

    // Dispatch event so UI components can update
    const payload = _buildResponse(block, {
      fromDateStr: cacheParams.fromDateStr,
      toDateStr: cacheParams.toDateStr,
      acquisitionDate: null, // Will be filled from cache
      sceneId,
      cloudCover: null,
      availableImages: 0,
      cacheHit: { scene: true, ndvi: false }, // Fresh fetch
      cacheMeta: { ...cacheParams.keyParts, stale: false, refreshing: false },
      result
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ndvi-refreshed', {
        detail: { blockId: block.id, payload }
      }));
    }
  } catch (err) {
    console.warn('⚠️ Background refresh failed:', err);

    // Dispatch error event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ndvi-refresh-failed', {
        detail: { blockId: block.id, error: err.message }
      }));
    }
  }
}

/**
 * Build the response object
 */
function _buildResponse(block, params) {
  const {
    fromDateStr, toDateStr, acquisitionDate, sceneId, cloudCover, availableImages,
    cacheHit, cacheMeta, result, qualityScore
  } = params;

  return {
    success: true,
    blockId: block.id,
    blockName: block.name,
    dateRange: { from: fromDateStr, to: toDateStr },
    acquisitionDate,
    sceneId,
    cloudCover,
    availableImages,
    qualityScore: qualityScore || null,
    source: DEFAULT_DATA_COLLECTION,
    resolution: `${DEFAULT_RESOLUTION}px`,
    fetchedAt: result.fetchedAt,
    cacheHit,
    cacheMeta,
    ...result
  };
}

// ============================================================================
// TIFF PARSING
// ============================================================================

async function parseNDVITiff(blob, blockGeom) {
  try {
    const GeoTIFF = await import('geotiff');
    const arrayBuffer = await blob.arrayBuffer();

    let tiffData;
    try {
      tiffData = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    } catch (tarError) {
      tiffData = await extractTiffFromTar(arrayBuffer);
    }

    const image = await tiffData.getImage();
    const width = image.getWidth();
    const height = image.getHeight();
    const bbox = image.getBoundingBox();

    const rasters = await image.readRasters();
    const ndviData = rasters[0];

    const stats = calculateNDVIStats(ndviData);
    const zones = createZonesFromRaster(ndviData, width, height, bbox, blockGeom);

    return {
      ...stats,
      zones,
      width,
      height,
      bbox,
      rasterData: ndviData,
      hasRealData: true
    };
  } catch (error) {
    console.error('Error parsing TIFF:', error);
    return {
      meanNDVI: 0.58, minNDVI: 0.22, maxNDVI: 0.81, stdDevNDVI: 0.12,
      zones: [
        { vigorLevel: 'low', ndviRange: [0.2, 0.4], percentOfField: 15, recommendedRate: 1.4, color: '#ef4444' },
        { vigorLevel: 'medium-low', ndviRange: [0.4, 0.5], percentOfField: 25, recommendedRate: 1.2, color: '#f97316' },
        { vigorLevel: 'medium', ndviRange: [0.5, 0.6], percentOfField: 35, recommendedRate: 1.0, color: '#eab308' },
        { vigorLevel: 'medium-high', ndviRange: [0.6, 0.7], percentOfField: 20, recommendedRate: 0.9, color: '#84cc16' },
        { vigorLevel: 'high', ndviRange: [0.7, 0.85], percentOfField: 5, recommendedRate: 0.8, color: '#22c55e' }
      ],
      cloudCoverage: 8.5, validPixels: 95.2, hasRealData: false
    };
  }
}

async function extractTiffFromTar(arrayBuffer) {
  const tiffStart = 512;
  const tiffBuffer = arrayBuffer.slice(tiffStart);
  const GeoTIFF = await import('geotiff');
  return await GeoTIFF.fromArrayBuffer(tiffBuffer);
}

function calculateNDVIStats(ndviData) {
  const validValues = [];
  for (let i = 0; i < ndviData.length; i++) {
    const value = ndviData[i];
    if (!isNaN(value) && isFinite(value) && value >= -1 && value <= 1) {
      validValues.push(value);
    }
  }

  if (validValues.length === 0) {
    return { meanNDVI: 0, minNDVI: 0, maxNDVI: 0, stdDevNDVI: 0, cloudCoverage: 100, validPixels: 0 };
  }

  const sum = validValues.reduce((a, b) => a + b, 0);
  const mean = sum / validValues.length;

  let min = validValues[0], max = validValues[0];
  for (let i = 1; i < validValues.length; i++) {
    if (validValues[i] < min) min = validValues[i];
    if (validValues[i] > max) max = validValues[i];
  }

  const variance = validValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / validValues.length;
  const stdDev = Math.sqrt(variance);

  const validPercent = (validValues.length / ndviData.length) * 100;

  return {
    meanNDVI: parseFloat(mean.toFixed(3)),
    minNDVI: parseFloat(min.toFixed(3)),
    maxNDVI: parseFloat(max.toFixed(3)),
    stdDevNDVI: parseFloat(stdDev.toFixed(3)),
    cloudCoverage: parseFloat((100 - validPercent).toFixed(1)),
    validPixels: parseFloat(validPercent.toFixed(1))
  };
}

function createZonesFromRaster(ndviData, width, height, bbox, blockGeom) {
  const thresholds = [
    { min: -1, max: 0.3, level: 'low', rate: 1.4, color: '#ef4444' },
    { min: 0.3, max: 0.45, level: 'medium-low', rate: 1.2, color: '#f97316' },
    { min: 0.45, max: 0.6, level: 'medium', rate: 1.0, color: '#eab308' },
    { min: 0.6, max: 0.75, level: 'medium-high', rate: 0.9, color: '#84cc16' },
    { min: 0.75, max: 1, level: 'high', rate: 0.8, color: '#22c55e' }
  ];

  const zoneCounts = thresholds.map(() => 0);
  const zonePixels = thresholds.map(() => []);

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

  return thresholds.map((threshold, idx) => {
    const count = zoneCounts[idx];
    const percent = totalPixels > 0 ? (count / totalPixels) * 100 : 0;
    const pixels = zonePixels[idx];
    const polygon = createZonePolygon(pixels, width, height, bbox);

    return {
      vigorLevel: threshold.level,
      ndviRange: [threshold.min, threshold.max],
      percentOfField: parseFloat(percent.toFixed(1)),
      recommendedRate: threshold.rate,
      color: threshold.color,
      pixelCount: count,
      polygon,
      ndviValues: pixels.map(p => p.ndvi)
    };
  }).filter(zone => zone.percentOfField > 0);
}

function createZonePolygon(pixels, width, height, bbox) {
  if (pixels.length === 0) return null;

  const pixelWidth = (bbox[2] - bbox[0]) / width;
  const pixelHeight = (bbox[3] - bbox[1]) / height;

  let minX = pixels[0].x, maxX = pixels[0].x;
  let minY = pixels[0].y, maxY = pixels[0].y;

  for (let i = 1; i < pixels.length; i++) {
    if (pixels[i].x < minX) minX = pixels[i].x;
    if (pixels[i].x > maxX) maxX = pixels[i].x;
    if (pixels[i].y < minY) minY = pixels[i].y;
    if (pixels[i].y > maxY) maxY = pixels[i].y;
  }

  const geoMinX = bbox[0] + minX * pixelWidth;
  const geoMaxX = bbox[0] + (maxX + 1) * pixelWidth;
  const geoMinY = bbox[1] + minY * pixelHeight;
  const geoMaxY = bbox[1] + (maxY + 1) * pixelHeight;

  return {
    type: 'Polygon',
    coordinates: [[
      [geoMinX, geoMinY], [geoMaxX, geoMinY], [geoMaxX, geoMaxY], [geoMinX, geoMaxY], [geoMinX, geoMinY]
    ]]
  };
}

// ============================================================================
// PUBLIC UTILITIES
// ============================================================================

/**
 * Create VRI zones from NDVI statistics
 */
export function createZonesFromNDVI(ndviData, block) {
  const zones = ndviData.zones || ndviData.stats?.zones;
  if (!ndviData.success || !zones) {
    throw new Error('Invalid NDVI data');
  }

  const blockAcres = block.acres || 10;
  return zones.map((zoneData, index) => ({
    id: `sentinel-${Date.now()}-${index}`,
    name: `NDVI Zone ${index + 1} (${zoneData.vigorLevel})`,
    irrigationRate: zoneData.recommendedRate,
    area: (blockAcres * zoneData.percentOfField) / 100,
    percentOfField: zoneData.percentOfField,
    vigor: zoneData.vigorLevel,
    vigorLevel: zoneData.vigorLevel,
    soilType: 'detected',
    color: zoneData.color,
    source: 'Sentinel-2',
    ndviRange: zoneData.ndviRange,
    polygon: zoneData.polygon,
    metadata: {
      meanNDVI: ndviData.meanNDVI || ndviData.stats?.meanNDVI,
      dateRange: ndviData.dateRange,
      cloudCoverage: ndviData.cloudCoverage || ndviData.stats?.cloudCoverage,
      resolution: ndviData.resolution,
      hasRealData: ndviData.hasRealData || ndviData.stats?.hasRealData
    }
  }));
}

/**
 * Check if Sentinel Hub is configured
 * Note: Actual credentials are stored server-side in Edge Function secrets
 * This just checks if the feature is enabled via environment variable
 */
export function isSentinelHubConfigured() {
  // The client ID can be public and is used as a feature flag
  // The secret is stored server-side only
  return !!import.meta.env.VITE_SENTINEL_HUB_ENABLED || !!import.meta.env.VITE_SENTINEL_HUB_CLIENT_ID;
}

/**
 * Clear NDVI cache for a specific block
 */
export async function clearNDVICache(blockId) {
  const results = { sceneDeleted: 0, resultDeleted: 0 };

  try {
    const { data: sceneData, error: sceneError } = await supabase
      .from('ndvi_scene_cache')
      .delete()
      .eq('block_id', blockId)
      .select();

    if (!sceneError && sceneData) results.sceneDeleted = sceneData.length;

    const { data: resultData, error: resultError } = await supabase
      .from('ndvi_result_cache')
      .delete()
      .eq('block_id', blockId)
      .select();

    if (!resultError && resultData) results.resultDeleted = resultData.length;

    console.log(`🗑️ Cleared NDVI cache for block ${blockId}:`, results);
    return results;
  } catch (err) {
    console.warn('Error clearing cache:', err);
    return results;
  }
}

/**
 * Get detailed cache status for a block (for debug panel)
 */
export async function getNDVICacheStatus(blockId) {
  try {
    const { data: scenes } = await supabase
      .from('ndvi_scene_cache')
      .select('*')
      .eq('block_id', blockId)
      .order('created_at', { ascending: false });

    const { data: results } = await supabase
      .from('ndvi_result_cache')
      .select('*')
      .eq('block_id', blockId)
      .order('created_at', { ascending: false });

    // Calculate ages
    const now = new Date();
    const scenesWithAge = (scenes || []).map(s => ({
      ...s,
      ageHours: (now - new Date(s.created_at)) / (1000 * 60 * 60)
    }));
    const resultsWithAge = (results || []).map(r => ({
      ...r,
      ageDays: (now - new Date(r.created_at)) / (1000 * 60 * 60 * 24),
      stale: (now - new Date(r.created_at)) / (1000 * 60 * 60 * 24) > STALE_THRESHOLD_DAYS
    }));

    return {
      hasCachedScene: scenes && scenes.length > 0,
      hasCachedResult: results && results.length > 0,
      scenes: scenesWithAge,
      results: resultsWithAge
    };
  } catch (err) {
    console.warn('Error getting cache status:', err);
    return { hasCachedScene: false, hasCachedResult: false, scenes: [], results: [] };
  }
}

// ============================================================================
// DEBOUNCE & COST PROTECTION
// ============================================================================

// Debounce map for preventing rapid repeated calls
const debounceTimers = new Map();

/**
 * Debounced version of fetchNDVIForBlock
 * Waits for user to stop changing block/params before fetching
 * @param {number} delay - Debounce delay in ms (default 500)
 */
export function fetchNDVIForBlockDebounced(block, options = {}, delay = 500) {
  const key = block.id;

  return new Promise((resolve, reject) => {
    // Clear existing timer for this block
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key));
    }

    // Set new timer
    const timer = setTimeout(async () => {
      debounceTimers.delete(key);
      try {
        const result = await fetchNDVIForBlock(block, options);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }, delay);

    debounceTimers.set(key, timer);
  });
}

/**
 * Calculate AOI area in square kilometers
 */
function calculateAOIArea(geom) {
  if (!geom || !geom.coordinates || !geom.coordinates[0]) return 0;

  const coords = geom.coordinates[0];
  // Shoelace formula for polygon area (approximate for small areas)
  let area = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    area += coords[i][0] * coords[i + 1][1];
    area -= coords[i + 1][0] * coords[i][1];
  }
  area = Math.abs(area) / 2;

  // Convert from degrees² to km² (rough approximation at mid-latitudes)
  // 1 degree ≈ 111 km at equator
  const kmPerDegree = 111;
  return area * kmPerDegree * kmPerDegree;
}

// Maximum AOI area limits by resolution
const AOI_LIMITS = {
  256: 100,   // 100 km² max for low res
  512: 50,    // 50 km² max for medium res
  1024: 25,   // 25 km² max for high res
  2048: 10    // 10 km² max for very high res
};

/**
 * Validate AOI size and suggest appropriate resolution
 * Returns { valid, suggestedResolution, areaKm2, maxArea }
 */
export function validateAOIForNDVI(geom, requestedResolution = DEFAULT_RESOLUTION) {
  const areaKm2 = calculateAOIArea(geom);
  const maxArea = AOI_LIMITS[requestedResolution] || AOI_LIMITS[512];

  if (areaKm2 <= maxArea) {
    return { valid: true, suggestedResolution: requestedResolution, areaKm2, maxArea };
  }

  // Find the best resolution for this area
  const resolutions = Object.keys(AOI_LIMITS).map(Number).sort((a, b) => a - b);
  let suggestedResolution = resolutions[0]; // Start with lowest

  for (const res of resolutions) {
    if (areaKm2 <= AOI_LIMITS[res]) {
      suggestedResolution = res;
      break;
    }
  }

  return {
    valid: false,
    suggestedResolution,
    areaKm2,
    maxArea,
    message: `Area (${areaKm2.toFixed(1)} km²) exceeds limit (${maxArea} km²) for ${requestedResolution}px resolution. Suggested: ${suggestedResolution}px`
  };
}

// ============================================================================
// CACHE INVALIDATION TRIGGERS
// ============================================================================

/**
 * Invalidate cache when block geometry changes
 * Call this from BlockManagement when user edits polygon
 */
export async function invalidateCacheOnGeometryChange(blockId) {
  console.log('🗑️ Invalidating NDVI cache due to geometry change:', blockId);
  return clearNDVICache(blockId);
}

/**
 * Invalidate cache when date range changes significantly
 * Call this when user changes date preset
 */
export async function invalidateCacheOnDateChange(blockId) {
  console.log('🗑️ Invalidating NDVI cache due to date range change:', blockId);
  return clearNDVICache(blockId);
}

/**
 * Subscribe to block geometry changes (call from component mount)
 * Returns unsubscribe function
 */
export function subscribeToBlockChanges(callback) {
  const channel = supabase
    .channel('block-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'vineyard_blocks',
      filter: 'geom=neq.null' // Only when geom changes
    }, async (payload) => {
      const blockId = payload.new.id;
      console.log('📡 Block geometry changed, invalidating cache:', blockId);
      await invalidateCacheOnGeometryChange(blockId);
      if (callback) callback(blockId);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get current evalscript hash (for debugging)
 */
export function getEvalscriptHash() {
  return EVALSCRIPT_HASH;
}

/**
 * Get current AOI hash version (for debugging)
 */
export function getAOIHashVersion() {
  return AOI_HASH_VERSION;
}

/**
 * Clean up all legacy cache entries (call this after migration)
 * Returns count of deleted entries
 */
export async function cleanupLegacyCacheEntries() {
  const results = { scenesDeleted: 0, resultsDeleted: 0 };

  try {
    // Clean up scene cache entries without versioned hashes
    // Legacy entries either have null aoi_hash or don't start with version prefix
    const { data: legacyScenes, error: sceneQueryError } = await supabase
      .from('ndvi_scene_cache')
      .select('id, aoi_hash')
      .or('aoi_hash.is.null,aoi_hash.not.like.v%:%');

    if (!sceneQueryError && legacyScenes && legacyScenes.length > 0) {
      const ids = legacyScenes.map(s => s.id);
      const { error: deleteError } = await supabase
        .from('ndvi_scene_cache')
        .delete()
        .in('id', ids);

      if (!deleteError) {
        results.scenesDeleted = ids.length;
        console.log(`🗑️ Cleaned up ${ids.length} legacy scene cache entries`);
      }
    }

    // Clean up result cache entries without versioned hashes
    const { data: legacyResults, error: resultQueryError } = await supabase
      .from('ndvi_result_cache')
      .select('id, aoi_hash, evalscript_hash')
      .or('aoi_hash.is.null,aoi_hash.not.like.v%:%,evalscript_hash.is.null,evalscript_hash.not.like.v%:%');

    if (!resultQueryError && legacyResults && legacyResults.length > 0) {
      const ids = legacyResults.map(r => r.id);
      const { error: deleteError } = await supabase
        .from('ndvi_result_cache')
        .delete()
        .in('id', ids);

      if (!deleteError) {
        results.resultsDeleted = ids.length;
        console.log(`🗑️ Cleaned up ${ids.length} legacy result cache entries`);
      }
    }

    console.log('✅ Legacy cache cleanup complete:', results);
    return results;
  } catch (err) {
    console.warn('Error cleaning up legacy cache:', err);
    return results;
  }
}

/**
 * Listen for NDVI refresh events (for UI components)
 */
export function onNDVIRefreshed(callback) {
  const handler = (event) => callback(event.detail);
  window.addEventListener('ndvi-refreshed', handler);
  return () => window.removeEventListener('ndvi-refreshed', handler);
}

/**
 * Listen for NDVI refresh failure events
 */
export function onNDVIRefreshFailed(callback) {
  const handler = (event) => callback(event.detail);
  window.addEventListener('ndvi-refresh-failed', handler);
  return () => window.removeEventListener('ndvi-refresh-failed', handler);
}

/**
 * Manually retry a failed NDVI fetch for a block
 * Use this for "Retry" buttons in the UI after a failure
 *
 * @param {Object} block - Vineyard block to retry
 * @param {Object} options - Same options as fetchNDVIForBlock
 * @returns {Promise<Object>} - NDVI data
 */
export async function retryNDVIFetch(block, options = {}) {
  console.log('🔄 Manual retry requested for block:', block.name);

  // Force a fresh fetch by skipping cache
  return fetchNDVIForBlock(block, { ...options, skipCache: true });
}

/**
 * Get retry status for a block (checks if currently retrying)
 */
export function isBlockRetrying(blockId) {
  // Check if there's an in-flight request for this block
  for (const [key] of inFlightRequests) {
    if (key.startsWith(`${blockId}:`)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if an error can be fixed by retrying
 * Returns { retryable: boolean, suggestion: string }
 */
export function analyzeNDVIError(error) {
  if (!error) {
    return { retryable: false, suggestion: 'Unknown error' };
  }

  const errorCode = error.code || '';
  const errorMessage = error.message || '';

  // Rate limiting - can retry after waiting
  if (errorCode === ERROR_CODES.RATE_LIMITED || errorCode === ERROR_CODES.UPSTREAM_RATE_LIMITED) {
    return {
      retryable: true,
      suggestion: 'Rate limit exceeded. Wait a few minutes and try again.',
      waitTime: error.retryAfter || 60
    };
  }

  // Upstream service error - can retry
  if (errorCode === ERROR_CODES.UPSTREAM_ERROR || (error.status >= 500 && error.status < 600)) {
    return {
      retryable: true,
      suggestion: 'Satellite service temporarily unavailable. Try again in a few minutes.'
    };
  }

  // Invalid geometry - not retryable without fixing
  if (errorCode === ERROR_CODES.INVALID_GEOMETRY || errorMessage.includes('geometry')) {
    return {
      retryable: false,
      suggestion: 'Block geometry is invalid. Please check and redraw the block boundaries.'
    };
  }

  // Authentication error - not retryable without config fix
  if (error.status === 401 || error.status === 403 || errorMessage.includes('Auth')) {
    return {
      retryable: false,
      suggestion: 'Authentication failed. Please check your Sentinel Hub credentials.'
    };
  }

  // Max retries exceeded
  if (errorCode === 'MAX_RETRIES_EXCEEDED') {
    return {
      retryable: true,
      suggestion: 'Multiple attempts failed. The service may be experiencing issues. Try again later.'
    };
  }

  // Default fallback
  return {
    retryable: true,
    suggestion: 'An error occurred. You can try again.'
  };
}

// ============================================================================
// HISTORICAL COMPARISON (NDVI CHANGE OVER TIME)
// ============================================================================

/**
 * Search for all available imagery dates for a block within a date range
 * Returns sorted array of dates with metadata (cloud cover, quality score)
 *
 * @param {Object} block - Vineyard block with geom
 * @param {Object} options
 * @param {Date|string} options.startDate - Start of search range
 * @param {Date|string} options.endDate - End of search range
 * @param {number} options.cloudThreshold - Max cloud cover % (default 50)
 * @param {number} options.limit - Max number of results (default 100)
 * @returns {Promise<Array>} - Array of { date, cloudCover, sceneId, qualityScore }
 */
export async function searchAvailableImageryDates(block, options = {}) {
  console.log('🔍 Searching for available imagery dates for block:', block.name);

  if (!block.geom || !block.geom.coordinates) {
    throw new Error('Block must have geometry to search for imagery');
  }

  const cloudThreshold = options.cloudThreshold || 50; // Allow more cloud cover for broader search
  const limit = options.limit || 100;

  // Parse dates
  const startDate = options.startDate instanceof Date ? options.startDate : new Date(options.startDate);
  const endDate = options.endDate instanceof Date ? options.endDate : new Date(options.endDate);

  const catalogBody = {
    bbox: getBoundingBox(block.geom),
    datetime: `${startDate.toISOString().split('T')[0]}T00:00:00Z/${endDate.toISOString().split('T')[0]}T23:59:59Z`,
    collections: [DEFAULT_DATA_COLLECTION],
    limit: limit,
    filter: {
      op: '<=',
      args: [{ property: 'eo:cloud_cover' }, cloudThreshold]
    }
  };

  try {
    const token = await getAuthToken();

    console.log('🔍 Catalog search request:', {
      bbox: catalogBody.bbox,
      datetime: catalogBody.datetime,
      collections: catalogBody.collections,
      limit: catalogBody.limit
    });

    const response = await fetch(SENTINEL_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        action: 'catalog',
        token: token,
        body: catalogBody
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Catalog search failed:', response.status, errorData);
      return [];
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.log('No imagery found in date range');
      return [];
    }

    // Process and score each scene
    const results = data.features.map(feature => {
      const score = calculateSceneQualityScore(feature);
      const dateStr = feature.properties.datetime.split('T')[0];

      return {
        date: dateStr,
        dateObj: new Date(dateStr),
        cloudCover: feature.properties['eo:cloud_cover'],
        sceneId: feature.id,
        qualityScore: score.total,
        qualityBreakdown: score.breakdown
      };
    });

    // Sort by date (newest first)
    results.sort((a, b) => b.dateObj - a.dateObj);

    // Deduplicate by date (keep best quality for each date)
    const byDate = new Map();
    for (const r of results) {
      if (!byDate.has(r.date) || byDate.get(r.date).qualityScore < r.qualityScore) {
        byDate.set(r.date, r);
      }
    }

    const uniqueDates = Array.from(byDate.values());
    console.log(`📅 Found ${uniqueDates.length} unique imagery dates`);

    return uniqueDates;
  } catch (error) {
    console.error('Error searching imagery dates:', error);
    return [];
  }
}

/**
 * Fetch NDVI for a block at a specific date range
 * Wrapper around fetchNDVIForBlock with explicit date control
 *
 * @param {Object} block - Vineyard block with geom
 * @param {Object} options
 * @param {Date|string} options.startDate - Start of date range
 * @param {Date|string} options.endDate - End of date range
 * @returns {Promise<Object>} - NDVI data payload
 */
export async function fetchNDVIForBlockAtDate(block, options = {}) {
  const { startDate, endDate, ...restOptions } = options;

  // Parse dates
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  return fetchNDVIForBlock(block, {
    ...restOptions,
    startDate: start,
    endDate: end
  });
}

/**
 * Compute delta (change) between two NDVI rasters
 * Returns: currentRaster - baselineRaster
 *
 * @param {Float32Array} baselineRaster - Baseline NDVI values
 * @param {Float32Array} currentRaster - Current NDVI values
 * @returns {Float32Array} - Delta values (positive = improvement, negative = decline)
 */
export function computeNDVIDeltaRaster(baselineRaster, currentRaster) {
  if (!baselineRaster || !currentRaster) {
    throw new Error('Both baseline and current rasters are required');
  }

  if (baselineRaster.length !== currentRaster.length) {
    throw new Error('Raster dimensions must match');
  }

  const delta = new Float32Array(baselineRaster.length);

  for (let i = 0; i < baselineRaster.length; i++) {
    const baseline = baselineRaster[i];
    const current = currentRaster[i];

    // Handle NaN values - if either is NaN, delta is NaN
    if (!isFinite(baseline) || !isFinite(current)) {
      delta[i] = NaN;
    } else {
      delta[i] = current - baseline;
    }
  }

  return delta;
}

/**
 * Compute statistics from an NDVI or delta raster
 *
 * @param {Float32Array} raster - NDVI or delta values
 * @param {Object} options
 * @param {boolean} options.isDelta - If true, uses delta thresholds
 * @returns {Object} - Statistics object
 */
export function computeNDVIStats(raster, options = {}) {
  const { isDelta = false } = options;

  if (!raster || raster.length === 0) {
    return {
      mean: 0, median: 0, min: 0, max: 0, std: 0,
      validPixels: 0, totalPixels: 0, validPercent: 0,
      pctHealthy: 0, pctModerate: 0, pctStressed: 0
    };
  }

  // Filter valid values
  const validValues = [];
  for (let i = 0; i < raster.length; i++) {
    const val = raster[i];
    if (isFinite(val) && !isNaN(val)) {
      validValues.push(val);
    }
  }

  if (validValues.length === 0) {
    return {
      mean: 0, median: 0, min: 0, max: 0, std: 0,
      validPixels: 0, totalPixels: raster.length, validPercent: 0,
      pctHealthy: 0, pctModerate: 0, pctStressed: 0
    };
  }

  // Sort for median and percentiles
  validValues.sort((a, b) => a - b);

  const sum = validValues.reduce((a, b) => a + b, 0);
  const mean = sum / validValues.length;
  const median = validValues[Math.floor(validValues.length / 2)];
  const min = validValues[0];
  const max = validValues[validValues.length - 1];

  // Standard deviation
  const variance = validValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / validValues.length;
  const std = Math.sqrt(variance);

  // Category percentages based on thresholds
  let pctHealthy, pctModerate, pctStressed;

  if (isDelta) {
    // Delta thresholds: decline < -0.05, stable -0.05..+0.05, improve > +0.05
    const declined = validValues.filter(v => v < -0.05).length;
    const stable = validValues.filter(v => v >= -0.05 && v <= 0.05).length;
    const improved = validValues.filter(v => v > 0.05).length;

    pctStressed = (declined / validValues.length) * 100;
    pctModerate = (stable / validValues.length) * 100;
    pctHealthy = (improved / validValues.length) * 100;
  } else {
    // NDVI thresholds: stressed < 0.35, moderate 0.35-0.55, healthy > 0.55
    const stressed = validValues.filter(v => v < 0.35).length;
    const moderate = validValues.filter(v => v >= 0.35 && v <= 0.55).length;
    const healthy = validValues.filter(v => v > 0.55).length;

    pctStressed = (stressed / validValues.length) * 100;
    pctModerate = (moderate / validValues.length) * 100;
    pctHealthy = (healthy / validValues.length) * 100;
  }

  return {
    mean: parseFloat(mean.toFixed(4)),
    median: parseFloat(median.toFixed(4)),
    min: parseFloat(min.toFixed(4)),
    max: parseFloat(max.toFixed(4)),
    std: parseFloat(std.toFixed(4)),
    validPixels: validValues.length,
    totalPixels: raster.length,
    validPercent: parseFloat(((validValues.length / raster.length) * 100).toFixed(1)),
    pctHealthy: parseFloat(pctHealthy.toFixed(1)),
    pctModerate: parseFloat(pctModerate.toFixed(1)),
    pctStressed: parseFloat(pctStressed.toFixed(1))
  };
}
