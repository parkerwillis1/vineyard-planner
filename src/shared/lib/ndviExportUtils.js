/**
 * NDVI Export Utilities
 * Export NDVI data to GeoJSON, CSV, and raster JSON formats
 */

// ============================================================================
// DOWNLOAD HELPER
// ============================================================================

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name) {
  return (name || 'block').replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
}

// ============================================================================
// GEOJSON EXPORT
// ============================================================================

/**
 * Export NDVI zones as GeoJSON FeatureCollection
 *
 * @param {Object} options
 * @param {Object} options.block - Block info (id, name, acres, geom)
 * @param {Array} options.zones - NDVI zones array
 * @param {Object} options.ndviData - Full NDVI response payload
 * @param {string} options.mode - 'ndvi' | 'delta'
 * @param {Object} options.baselineData - Baseline data (for delta mode)
 * @param {Object} options.currentData - Current data (for delta mode)
 * @returns {Object} - GeoJSON FeatureCollection
 */
export function createNDVIGeoJSON(options) {
  const { block, zones, ndviData, mode = 'ndvi', baselineData, currentData } = options;

  const features = [];

  // Add block boundary as a feature
  if (block?.geom) {
    features.push({
      type: 'Feature',
      geometry: block.geom,
      properties: {
        featureType: 'block_boundary',
        blockId: block.id,
        blockName: block.name,
        acres: block.acres
      }
    });
  }

  // Add zone features
  if (zones && zones.length > 0) {
    zones.forEach((zone, idx) => {
      // Use zone polygon if available, otherwise create from block geom
      const geometry = zone.polygon || block?.geom;
      if (!geometry) return;

      const properties = {
        featureType: 'ndvi_zone',
        zoneId: zone.id || `zone-${idx}`,
        blockId: block?.id,
        blockName: block?.name,
        vigorLevel: zone.vigorLevel,
        ndviRange: zone.ndviRange,
        ndviMean: zone.ndviValues ? (zone.ndviValues.reduce((a, b) => a + b, 0) / zone.ndviValues.length) : null,
        percentOfField: zone.percentOfField,
        acres: zone.area || (block?.acres ? (block.acres * zone.percentOfField / 100) : null),
        irrigationRate: zone.irrigationRate,
        color: zone.color,
        mode: mode,
        acquisitionDate: ndviData?.acquisitionDate,
        sceneId: ndviData?.sceneId,
        cloudCover: ndviData?.cloudCover
      };

      // Add delta-specific properties
      if (mode === 'delta' && baselineData && currentData) {
        properties.baselineDate = baselineData.acquisitionDate;
        properties.currentDate = currentData.acquisitionDate;
      }

      features.push({
        type: 'Feature',
        geometry: geometry,
        properties: properties
      });
    });
  }

  return {
    type: 'FeatureCollection',
    properties: {
      exportedAt: new Date().toISOString(),
      mode: mode,
      blockId: block?.id,
      blockName: block?.name,
      meanNDVI: ndviData?.meanNDVI,
      acquisitionDate: ndviData?.acquisitionDate,
      source: ndviData?.source || 'sentinel-2-l2a'
    },
    features: features
  };
}

/**
 * Export zones as GeoJSON file download
 */
export function exportNDVIGeoJSON(options) {
  const geojson = createNDVIGeoJSON(options);
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });

  const date = options.ndviData?.acquisitionDate
    ? new Date(options.ndviData.acquisitionDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const filename = `trellis_ndvi_${sanitizeFilename(options.block?.name)}_${date}.geojson`;
  downloadBlob(blob, filename);
}

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Export NDVI zones summary as CSV
 */
export function exportNDVICSV(options) {
  const { block, zones, ndviData, mode = 'ndvi', baselineData, currentData } = options;

  if (!zones || zones.length === 0) {
    alert('No zone data to export');
    return;
  }

  // Build CSV headers
  const headers = [
    'block_id',
    'block_name',
    'zone_id',
    'vigor_level',
    'ndvi_min',
    'ndvi_max',
    'percent_of_field',
    'acres',
    'irrigation_rate',
    'mode',
    'acquisition_date',
    'scene_id',
    'cloud_cover'
  ];

  if (mode === 'delta') {
    headers.push('baseline_date', 'current_date');
  }

  // Build CSV rows
  const rows = zones.map((zone, idx) => {
    const row = [
      block?.id || '',
      block?.name || '',
      zone.id || `zone-${idx}`,
      zone.vigorLevel,
      zone.ndviRange?.[0]?.toFixed(3) || '',
      zone.ndviRange?.[1]?.toFixed(3) || '',
      zone.percentOfField?.toFixed(1) || '',
      zone.area?.toFixed(2) || (block?.acres ? (block.acres * zone.percentOfField / 100).toFixed(2) : ''),
      zone.irrigationRate?.toFixed(2) || '',
      mode,
      ndviData?.acquisitionDate || '',
      ndviData?.sceneId || '',
      ndviData?.cloudCover?.toFixed(1) || ''
    ];

    if (mode === 'delta') {
      row.push(baselineData?.acquisitionDate || '', currentData?.acquisitionDate || '');
    }

    return row;
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${val}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const date = ndviData?.acquisitionDate
    ? new Date(ndviData.acquisitionDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const filename = `trellis_ndvi_${sanitizeFilename(block?.name)}_${date}.csv`;
  downloadBlob(blob, filename);
}

// ============================================================================
// RASTER JSON EXPORT (Compact Format)
// ============================================================================

/**
 * Convert Float32Array to base64 string
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
 * Export raster data as compact JSON
 */
export function exportNDVIRasterJSON(options) {
  const { block, ndviData, mode = 'ndvi', deltaRaster, baselineData, currentData } = options;

  if (!ndviData?.rasterData && !deltaRaster) {
    alert('No raster data to export');
    return;
  }

  const rasterToExport = mode === 'delta' && deltaRaster ? deltaRaster : ndviData?.rasterData;

  if (!rasterToExport) {
    alert('No raster data available for selected mode');
    return;
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    blockId: block?.id,
    blockName: block?.name,
    mode: mode,
    width: ndviData?.width,
    height: ndviData?.height,
    bbox: ndviData?.bbox, // [minLng, minLat, maxLng, maxLat]
    crs: 'EPSG:4326',
    nodataValue: NaN,
    encoding: 'base64-float32',
    valuesBase64: float32ArrayToBase64(rasterToExport),
    statistics: {
      mean: ndviData?.meanNDVI,
      min: ndviData?.minNDVI,
      max: ndviData?.maxNDVI,
      std: ndviData?.stdDevNDVI
    },
    acquisitionDate: ndviData?.acquisitionDate,
    sceneId: ndviData?.sceneId,
    source: ndviData?.source || 'sentinel-2-l2a'
  };

  // Add delta-specific metadata
  if (mode === 'delta' && baselineData && currentData) {
    exportData.baselineDate = baselineData.acquisitionDate;
    exportData.currentDate = currentData.acquisitionDate;
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });

  const date = ndviData?.acquisitionDate
    ? new Date(ndviData.acquisitionDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const suffix = mode === 'delta' ? '_delta' : '';
  const filename = `trellis_ndvi${suffix}_${sanitizeFilename(block?.name)}_${date}.json`;
  downloadBlob(blob, filename);
}

// ============================================================================
// EXPORT ALL
// ============================================================================

/**
 * Show export menu options and handle selection
 * Returns available export options based on data
 */
export function getExportOptions(options) {
  const { zones, ndviData, deltaRaster, mode } = options;

  const exports = [];

  // GeoJSON always available if we have zones or block geom
  if (zones?.length > 0 || options.block?.geom) {
    exports.push({
      id: 'geojson',
      label: 'Zones (GeoJSON)',
      description: 'Vector polygons with properties',
      handler: () => exportNDVIGeoJSON(options)
    });
  }

  // CSV available if we have zones
  if (zones?.length > 0) {
    exports.push({
      id: 'csv',
      label: 'Summary (CSV)',
      description: 'Zone statistics spreadsheet',
      handler: () => exportNDVICSV(options)
    });
  }

  // Raster JSON available if we have raster data
  if (ndviData?.rasterData || deltaRaster) {
    exports.push({
      id: 'raster',
      label: mode === 'delta' ? 'Delta Raster (JSON)' : 'NDVI Raster (JSON)',
      description: 'Raw pixel values (base64)',
      handler: () => exportNDVIRasterJSON(options)
    });
  }

  return exports;
}
