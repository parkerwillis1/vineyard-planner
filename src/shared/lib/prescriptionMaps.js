/**
 * Prescription Map Generation
 * Convert NDVI or delta data into actionable zones for irrigation/spray/fertilizer
 */

// ============================================================================
// DEFAULT THRESHOLDS AND ACTIONS
// ============================================================================

export const DEFAULT_THRESHOLDS = {
  ndvi: {
    low: 0.35,
    high: 0.55
  },
  delta: {
    decline: -0.05,
    improve: 0.05
  }
};

export const DEFAULT_ACTIONS = {
  irrigation: {
    // For NDVI mode
    ndvi: {
      low: { action: 'increase', rate: '+20%', reason: 'Low vigor - increase water' },
      mid: { action: 'maintain', rate: '+0%', reason: 'Moderate vigor - maintain current' },
      high: { action: 'reduce', rate: '-10%', reason: 'High vigor - reduce to control growth' }
    },
    // For delta mode
    delta: {
      decline: { action: 'increase', rate: '+25%', reason: 'Declining health - increase water' },
      stable: { action: 'maintain', rate: '+0%', reason: 'Stable - maintain current' },
      improve: { action: 'maintain', rate: '+0%', reason: 'Improving - continue current' }
    }
  },
  spray: {
    ndvi: {
      low: { action: 'inspect', rate: 'Priority', reason: 'Low vigor - inspect for pests/disease' },
      mid: { action: 'standard', rate: 'Normal', reason: 'Standard application' },
      high: { action: 'skip', rate: 'Reduce', reason: 'Healthy canopy - may reduce' }
    },
    delta: {
      decline: { action: 'inspect', rate: 'Priority', reason: 'Declining - investigate cause' },
      stable: { action: 'standard', rate: 'Normal', reason: 'Standard application' },
      improve: { action: 'monitor', rate: 'Normal', reason: 'Improving - continue monitoring' }
    }
  },
  fertilizer: {
    ndvi: {
      low: { action: 'apply', rate: '+30%', reason: 'Low vigor - increase nutrients' },
      mid: { action: 'standard', rate: 'Normal', reason: 'Standard application' },
      high: { action: 'reduce', rate: '-20%', reason: 'Excessive vigor - reduce nitrogen' }
    },
    delta: {
      decline: { action: 'apply', rate: '+25%', reason: 'Declining - boost nutrients' },
      stable: { action: 'standard', rate: 'Normal', reason: 'Stable - maintain' },
      improve: { action: 'maintain', rate: 'Normal', reason: 'Improving - continue' }
    }
  }
};

// ============================================================================
// PRESCRIPTION GENERATION
// ============================================================================

/**
 * Generate a prescription map from NDVI zones or raster data
 *
 * @param {Object} options
 * @param {Array} options.zones - Existing NDVI zones (preferred)
 * @param {Float32Array} options.rasterData - Raw raster data (fallback)
 * @param {Object} options.ndviData - Full NDVI response for metadata
 * @param {string} options.mode - 'ndvi' | 'delta'
 * @param {string} options.strategy - 'irrigation' | 'spray' | 'fertilizer'
 * @param {Object} options.thresholds - Custom thresholds (optional)
 * @param {Object} options.block - Block info for area calculations
 * @returns {Object} - Prescription result { type, features, summary }
 */
export function generatePrescription(options) {
  const {
    zones,
    rasterData,
    ndviData,
    mode = 'ndvi',
    strategy = 'irrigation',
    thresholds = DEFAULT_THRESHOLDS,
    block
  } = options;

  const actions = DEFAULT_ACTIONS[strategy]?.[mode] || DEFAULT_ACTIONS.irrigation.ndvi;
  const modeThresholds = thresholds[mode] || DEFAULT_THRESHOLDS[mode];

  const prescriptionZones = [];
  let summary = {
    totalAcres: block?.acres || 0,
    byAction: {},
    strategy,
    mode,
    generatedAt: new Date().toISOString()
  };

  // Process existing zones if available
  if (zones && zones.length > 0) {
    zones.forEach((zone, idx) => {
      const prescription = classifyZone(zone, mode, modeThresholds, actions);

      const acres = zone.area || (block?.acres ? block.acres * zone.percentOfField / 100 : 0);

      prescriptionZones.push({
        ...zone,
        prescription: prescription,
        prescriptionId: `rx-${idx}`,
        acres: acres
      });

      // Accumulate summary
      const actionKey = prescription.action;
      if (!summary.byAction[actionKey]) {
        summary.byAction[actionKey] = { acres: 0, zones: 0, rate: prescription.rate, reason: prescription.reason };
      }
      summary.byAction[actionKey].acres += acres;
      summary.byAction[actionKey].zones += 1;
    });
  }
  // Fallback to raster classification if no zones
  else if (rasterData && ndviData) {
    const gridZones = classifyRasterToZones(rasterData, ndviData, mode, modeThresholds, actions, block);
    prescriptionZones.push(...gridZones);

    gridZones.forEach(zone => {
      const actionKey = zone.prescription.action;
      if (!summary.byAction[actionKey]) {
        summary.byAction[actionKey] = { acres: 0, zones: 0, rate: zone.prescription.rate, reason: zone.prescription.reason };
      }
      summary.byAction[actionKey].acres += zone.acres;
      summary.byAction[actionKey].zones += 1;
    });
  }

  return {
    type: 'prescription',
    strategy,
    mode,
    zones: prescriptionZones,
    summary,
    metadata: {
      blockId: block?.id,
      blockName: block?.name,
      acquisitionDate: ndviData?.acquisitionDate,
      thresholds: modeThresholds
    }
  };
}

/**
 * Classify a single zone into prescription category
 */
function classifyZone(zone, mode, thresholds, actions) {
  // Calculate zone mean NDVI
  let zoneMean;
  if (zone.ndviValues && zone.ndviValues.length > 0) {
    zoneMean = zone.ndviValues.reduce((a, b) => a + b, 0) / zone.ndviValues.length;
  } else if (zone.ndviRange) {
    zoneMean = (zone.ndviRange[0] + zone.ndviRange[1]) / 2;
  } else {
    zoneMean = 0.5; // Default
  }

  if (mode === 'ndvi') {
    if (zoneMean < thresholds.low) {
      return { ...actions.low, category: 'low', value: zoneMean };
    } else if (zoneMean > thresholds.high) {
      return { ...actions.high, category: 'high', value: zoneMean };
    } else {
      return { ...actions.mid, category: 'mid', value: zoneMean };
    }
  } else {
    // Delta mode
    if (zoneMean < thresholds.decline) {
      return { ...actions.decline, category: 'decline', value: zoneMean };
    } else if (zoneMean > thresholds.improve) {
      return { ...actions.improve, category: 'improve', value: zoneMean };
    } else {
      return { ...actions.stable, category: 'stable', value: zoneMean };
    }
  }
}

/**
 * Classify raster data into grid-based prescription zones
 */
function classifyRasterToZones(rasterData, ndviData, mode, thresholds, actions, block) {
  const { width, height, bbox } = ndviData;
  const totalPixels = width * height;
  const totalAcres = block?.acres || 0;

  // Count pixels in each category
  const counts = { low: 0, mid: 0, high: 0 };

  for (let i = 0; i < rasterData.length; i++) {
    const val = rasterData[i];
    if (!isFinite(val) || isNaN(val)) continue;

    if (mode === 'ndvi') {
      if (val < thresholds.low) counts.low++;
      else if (val > thresholds.high) counts.high++;
      else counts.mid++;
    } else {
      if (val < thresholds.decline) counts.low++;
      else if (val > thresholds.improve) counts.high++;
      else counts.mid++;
    }
  }

  const validPixels = counts.low + counts.mid + counts.high;

  // Create simplified zones based on pixel counts
  const zones = [];

  const categories = mode === 'ndvi'
    ? [{ key: 'low', action: actions.low }, { key: 'mid', action: actions.mid }, { key: 'high', action: actions.high }]
    : [{ key: 'low', action: actions.decline }, { key: 'mid', action: actions.stable }, { key: 'high', action: actions.improve }];

  categories.forEach(({ key, action }, idx) => {
    const pixelCount = counts[key];
    if (pixelCount === 0) return;

    const pct = (pixelCount / validPixels) * 100;
    const acres = (totalAcres * pct) / 100;

    zones.push({
      id: `grid-${key}`,
      vigorLevel: key,
      percentOfField: pct,
      pixelCount,
      acres,
      prescription: {
        ...action,
        category: key
      },
      // No polygon for grid zones - they're distributed
      polygon: null
    });
  });

  return zones;
}

// ============================================================================
// PRESCRIPTION EXPORT
// ============================================================================

/**
 * Export prescription as GeoJSON
 */
export function exportPrescriptionGeoJSON(prescription, block) {
  const features = [];

  prescription.zones.forEach((zone, idx) => {
    const geometry = zone.polygon || block?.geom;
    if (!geometry) return;

    features.push({
      type: 'Feature',
      geometry: geometry,
      properties: {
        featureType: 'prescription_zone',
        prescriptionId: zone.prescriptionId || `rx-${idx}`,
        zoneId: zone.id,
        blockId: block?.id,
        blockName: block?.name,
        strategy: prescription.strategy,
        mode: prescription.mode,
        action: zone.prescription.action,
        rate: zone.prescription.rate,
        reason: zone.prescription.reason,
        category: zone.prescription.category,
        ndviValue: zone.prescription.value,
        percentOfField: zone.percentOfField,
        acres: zone.acres,
        vigorLevel: zone.vigorLevel
      }
    });
  });

  const geojson = {
    type: 'FeatureCollection',
    properties: {
      exportedAt: new Date().toISOString(),
      type: 'prescription',
      strategy: prescription.strategy,
      mode: prescription.mode,
      blockId: block?.id,
      blockName: block?.name,
      summary: prescription.summary
    },
    features
  };

  return geojson;
}

/**
 * Download prescription GeoJSON
 */
export function downloadPrescriptionGeoJSON(prescription, block) {
  const geojson = exportPrescriptionGeoJSON(prescription, block);
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });

  const date = new Date().toISOString().split('T')[0];
  const blockName = (block?.name || 'block').replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
  const filename = `trellis_prescription_${prescription.strategy}_${blockName}_${date}.geojson`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// PRESCRIPTION COLORS
// ============================================================================

export const PRESCRIPTION_COLORS = {
  irrigation: {
    increase: '#ef4444', // Red - needs water
    maintain: '#eab308', // Yellow - ok
    reduce: '#22c55e'    // Green - high vigor
  },
  spray: {
    inspect: '#ef4444',  // Red - priority
    standard: '#eab308', // Yellow - normal
    skip: '#22c55e',     // Green - can skip
    monitor: '#3b82f6'   // Blue - watch
  },
  fertilizer: {
    apply: '#ef4444',    // Red - needs nutrients
    standard: '#eab308', // Yellow - normal
    reduce: '#22c55e',   // Green - reduce
    maintain: '#3b82f6'  // Blue - maintain
  }
};

/**
 * Get color for a prescription action
 */
export function getPrescriptionColor(strategy, action) {
  return PRESCRIPTION_COLORS[strategy]?.[action] || '#6b7280';
}
