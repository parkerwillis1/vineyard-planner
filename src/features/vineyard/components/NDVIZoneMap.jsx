import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader, Download, ChevronDown } from 'lucide-react';
import { NDVICompareControls } from './NDVICompareControls';
import { NDVIPrescriptionPanel } from './NDVIPrescriptionPanel';
import {
  fetchNDVIForBlockAtDate,
  computeNDVIDeltaRaster,
  computeNDVIStats
} from '@/shared/lib/sentinelHubApi';
import { getExportOptions } from '@/shared/lib/ndviExportUtils';

// LocalStorage key for persisting compare dates
const getCompareStorageKey = (blockId) => `ndvi_compare_dates_${blockId}`;

/**
 * NDVI Zone Map Component
 * Displays vineyard field with NDVI-based irrigation zones overlaid
 * Supports historical comparison and export
 */
export function NDVIZoneMap({ block, zones, ndviData, height = '500px' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const overlayRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Compare mode state
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [baselineDate, setBaselineDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);
  const [baselineData, setBaselineData] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [viewMode, setViewMode] = useState('current'); // 'baseline' | 'current' | 'delta'
  const [compareLoading, setCompareLoading] = useState(false);
  const [deltaRaster, setDeltaRaster] = useState(null);
  const [deltaStats, setDeltaStats] = useState(null);

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Load saved compare dates from localStorage
  useEffect(() => {
    if (block?.id) {
      const saved = localStorage.getItem(getCompareStorageKey(block.id));
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.baseline) setBaselineDate(parsed.baseline);
          if (parsed.current) setCurrentDate(parsed.current);
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [block?.id]);

  // Save compare dates to localStorage
  useEffect(() => {
    if (block?.id && (baselineDate || currentDate)) {
      localStorage.setItem(getCompareStorageKey(block.id), JSON.stringify({
        baseline: baselineDate,
        current: currentDate
      }));
    }
  }, [block?.id, baselineDate, currentDate]);

  // Fetch comparison data when dates change
  const fetchComparisonData = useCallback(async (dateRange, setter) => {
    if (!block || !dateRange?.start || !dateRange?.end) return;

    setCompareLoading(true);
    try {
      const data = await fetchNDVIForBlockAtDate(block, {
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      setter(data);
    } catch (err) {
      console.error('Failed to fetch comparison data:', err);
    } finally {
      setCompareLoading(false);
    }
  }, [block]);

  // Compute delta when both datasets are available
  useEffect(() => {
    if (baselineData?.rasterData && currentData?.rasterData) {
      try {
        const delta = computeNDVIDeltaRaster(baselineData.rasterData, currentData.rasterData);
        setDeltaRaster(delta);
        setDeltaStats(computeNDVIStats(delta, { isDelta: true }));
      } catch (err) {
        console.error('Failed to compute delta:', err);
        setDeltaRaster(null);
        setDeltaStats(null);
      }
    }
  }, [baselineData, currentData]);

  // Redraw map when view mode changes (for compare feature)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !block) return;

    const activeData = getActiveNDVIData();
    const activeRaster = getActiveRaster();
    const isDelta = compareEnabled && viewMode === 'delta';

    if (activeData && activeRaster) {
      // Clear existing overlays by removing and re-adding
      drawNDVIHeatMap(map, activeData, isDelta, isDelta ? activeRaster : null);

      // Clear existing legend and add new one
      map.controls[window.google.maps.ControlPosition.LEFT_BOTTOM].clear();
      addLegend(map, zones, isDelta, isDelta ? deltaStats : null);
    }
  }, [viewMode, compareEnabled, baselineData, currentData, deltaRaster]);

  // Handle compare toggle
  const handleCompareToggle = () => {
    if (!compareEnabled) {
      // Initialize with defaults when enabling
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      if (!currentDate) {
        setCurrentDate({
          start: new Date(year, month, now.getDate() - 30),
          end: new Date(year, month, now.getDate())
        });
      }
      if (!baselineDate) {
        setBaselineDate({
          start: new Date(year - 1, month, now.getDate() - 30),
          end: new Date(year - 1, month, now.getDate())
        });
      }
    }
    setCompareEnabled(!compareEnabled);
    if (!compareEnabled) {
      setViewMode('current');
    }
  };

  // Get active NDVI data based on view mode
  const getActiveNDVIData = () => {
    if (!compareEnabled) return ndviData;
    if (viewMode === 'baseline') return baselineData;
    if (viewMode === 'current') return currentData || ndviData;
    return currentData || ndviData; // Delta uses current for metadata
  };

  const getActiveRaster = () => {
    if (!compareEnabled) return ndviData?.rasterData;
    if (viewMode === 'baseline') return baselineData?.rasterData;
    if (viewMode === 'current') return (currentData || ndviData)?.rasterData;
    if (viewMode === 'delta') return deltaRaster;
    return ndviData?.rasterData;
  };

  useEffect(() => {
    if (!block || !zones || zones.length === 0) {
      setIsLoading(false);
      return;
    }

    // Check if Google Maps API is loaded
    if (!window.google) {
      setError('Google Maps API not loaded');
      setIsLoading(false);
      return;
    }

    // Retry initialization until map container is ready (max 10 attempts)
    let attempts = 0;
    const maxAttempts = 10;

    const tryInitialize = () => {
      if (mapRef.current) {
        initializeMap();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryInitialize, 50);
      } else {
        setError('Map container failed to initialize');
        setIsLoading(false);
      }
    };

    tryInitialize();
  }, [block, zones]);

  const initializeMap = () => {
    try {
      // Ensure map container is ready
      if (!mapRef.current) {
        console.error('❌ Map container not ready (mapRef.current is null)');
        setError('Map container not ready');
        setIsLoading(false);
        return;
      }

      // Calculate center of the field
      const center = calculateCenter(block.geom);

      // Initialize Google Map
      const map = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: 16,
        mapTypeId: 'satellite',
        tilt: 0,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: ['satellite', 'roadmap', 'hybrid']
        },
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Draw field boundary
      drawFieldBoundary(map, block.geom);

      // Draw NDVI heat map overlay if we have the raster data
      if (ndviData && ndviData.rasterData && ndviData.width && ndviData.height && ndviData.bbox) {
        drawNDVIHeatMap(map, ndviData);
      }

      // Note: Zone polygons are not drawn because they're simplified bounding boxes
      // that extend beyond field boundaries. The heat map already shows all NDVI variation.

      // Add legend
      addLegend(map, zones);

      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to load map');
      setIsLoading(false);
    }
  };

  const calculateCenter = (geom) => {
    if (!geom || !geom.coordinates || !geom.coordinates[0]) {
      return { lat: 0, lng: 0 };
    }

    const coords = geom.coordinates[0];
    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);

    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    return { lat: centerLat, lng: centerLng };
  };

  const drawNDVIHeatMap = (map, ndviData, isDelta = false, customRaster = null) => {
    const rasterData = customRaster || ndviData.rasterData;
    const { width, height, bbox } = ndviData;

    // Get field polygon coordinates for clipping
    const fieldCoords = block.geom.coordinates[0];

    // Point-in-polygon test (ray casting algorithm)
    const isPointInPolygon = (lat, lng) => {
      let inside = false;
      for (let i = 0, j = fieldCoords.length - 1; i < fieldCoords.length; j = i++) {
        const xi = fieldCoords[i][0], yi = fieldCoords[i][1];
        const xj = fieldCoords[j][0], yj = fieldCoords[j][1];

        const intersect = ((yi > lat) !== (yj > lat))
          && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    // Create a canvas to draw the NDVI heat map
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Create image data
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Color mapping function for delta values (diverging scale: red-white-green)
    const getColorForDelta = (delta) => {
      if (!isFinite(delta) || isNaN(delta)) {
        return { r: 0, g: 0, b: 0, a: 0 };
      }
      // Clamp delta to -0.5 to 0.5 range for visualization
      delta = Math.max(-0.5, Math.min(0.5, delta));

      if (delta < 0) {
        // Negative (decline): white to red
        const t = Math.abs(delta) / 0.5;
        return { r: 255, g: Math.round(255 * (1 - t)), b: Math.round(255 * (1 - t)), a: 200 };
      } else if (delta > 0) {
        // Positive (improvement): white to green
        const t = delta / 0.5;
        return { r: Math.round(255 * (1 - t)), g: 255, b: Math.round(255 * (1 - t)), a: 200 };
      } else {
        // Zero: white
        return { r: 255, g: 255, b: 255, a: 200 };
      }
    };

    // Color mapping function: NDVI value to RGB color
    const getColorForNDVI = (ndvi) => {
      // Handle invalid values
      if (!isFinite(ndvi) || isNaN(ndvi)) {
        return { r: 0, g: 0, b: 0, a: 0 }; // Transparent for invalid
      }

      // Clamp NDVI to -1 to 1 range
      ndvi = Math.max(-1, Math.min(1, ndvi));

      // Color scale: Red (low NDVI) -> Yellow -> Green (high NDVI)
      if (ndvi < 0) {
        // Negative NDVI: black to dark red
        const intensity = (ndvi + 1) * 128;
        return { r: intensity, g: 0, b: 0, a: 200 };
      } else if (ndvi < 0.3) {
        // Low NDVI: dark red to red (0-0.3)
        const t = ndvi / 0.3;
        return { r: 139 + (255 - 139) * t, g: 0, b: 0, a: 200 };
      } else if (ndvi < 0.5) {
        // Medium-low: red to orange (0.3-0.5)
        const t = (ndvi - 0.3) / 0.2;
        return { r: 255, g: 165 * t, b: 0, a: 200 };
      } else if (ndvi < 0.7) {
        // Medium: orange to yellow (0.5-0.7)
        const t = (ndvi - 0.5) / 0.2;
        return { r: 255, g: 165 + (255 - 165) * t, b: 0, a: 200 };
      } else if (ndvi < 0.85) {
        // Medium-high: yellow to lime green (0.7-0.85)
        const t = (ndvi - 0.7) / 0.15;
        return { r: 255 - 128 * t, g: 255, b: 50 * t, a: 200 };
      } else {
        // High: lime green to bright green (0.85-1.0)
        const t = (ndvi - 0.85) / 0.15;
        return { r: 127 - 93 * t, g: 255, b: 50, a: 200 };
      }
    };

    // Select color function based on mode
    const getColor = isDelta ? getColorForDelta : getColorForNDVI;

    // Draw each pixel, but only if it's inside the field boundary
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Convert pixel coordinates to lat/lng
        const lng = bbox[0] + (x / width) * (bbox[2] - bbox[0]);
        const lat = bbox[3] - (y / height) * (bbox[3] - bbox[1]);

        // Check if this pixel is inside the field boundary
        const insideField = isPointInPolygon(lat, lng);

        const idx = y * width + x;
        const val = rasterData[idx];
        const color = insideField ? getColor(val) : { r: 0, g: 0, b: 0, a: 0 };

        const pixelIdx = (y * width + x) * 4;
        data[pixelIdx] = color.r;
        data[pixelIdx + 1] = color.g;
        data[pixelIdx + 2] = color.b;
        data[pixelIdx + 3] = color.a;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to data URL
    const imageUrl = canvas.toDataURL('image/png');

    // Create bounds for the overlay
    const bounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(bbox[1], bbox[0]), // SW corner
      new window.google.maps.LatLng(bbox[3], bbox[2])  // NE corner
    );

    // Create ground overlay
    new window.google.maps.GroundOverlay(imageUrl, bounds, {
      map: map,
      opacity: 0.7
    });
  };

  const drawFieldBoundary = (map, geom) => {
    if (!geom || !geom.coordinates || !geom.coordinates[0]) {
      return;
    }

    const path = geom.coordinates[0].map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));

    new window.google.maps.Polygon({
      map: map,
      paths: path,
      strokeColor: '#ffffff',
      strokeOpacity: 1,
      strokeWeight: 3,
      fillColor: 'transparent',
      fillOpacity: 0,
      zIndex: 100
    });
  };

  const drawNDVIZones = (map, zones) => {
    zones.forEach((zone, index) => {
      if (!zone.polygon || !zone.polygon.coordinates) {
        return;
      }

      const path = zone.polygon.coordinates[0].map(coord => ({
        lat: coord[1],
        lng: coord[0]
      }));

      const polygon = new window.google.maps.Polygon({
        map: map,
        paths: path,
        strokeColor: zone.color,
        strokeOpacity: 0.9,
        strokeWeight: 3,
        fillColor: zone.color,
        fillOpacity: 0.15,
        zIndex: 10 + index
      });

      // Add click listener for zone info
      polygon.addListener('click', () => {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: system-ui;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${zone.color};">
                ${zone.name || `NDVI Zone ${index + 1} (${zone.vigorLevel})`}
              </h3>
              <div style="font-size: 12px; line-height: 1.5;">
                <div><strong>Vigor:</strong> ${zone.vigorLevel}</div>
                <div><strong>NDVI Range:</strong> ${zone.ndviRange[0].toFixed(2)} - ${zone.ndviRange[1].toFixed(2)}</div>
                <div><strong>Area:</strong> ${zone.area ? zone.area.toFixed(1) : (zone.percentOfField / 100 * block.acres).toFixed(1)} acres (${zone.percentOfField.toFixed(1)}%)</div>
                <div><strong>Irrigation Rate:</strong> ${zone.irrigationRate.toFixed(2)} gal/hr/ac</div>
              </div>
            </div>
          `,
          position: calculateCenter(zone.polygon)
        });
        infoWindow.open(map);
      });
    });
  };

  const addLegend = (map, zones, isDelta = false, stats = null) => {
    const legend = document.createElement('div');
    legend.style.cssText = `
      background: white;
      padding: 12px;
      margin: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      font-family: system-ui;
      font-size: 12px;
    `;

    // Format acquisition date if available
    const activeData = getActiveNDVIData();
    let dateInfo = '';
    const isCached = activeData?.cacheHit?.ndvi;
    const isStale = activeData?.cacheMeta?.stale;
    const isRefreshing = activeData?.cacheMeta?.refreshing;

    // Build cache status label
    let cacheLabel = '';
    if (isCached) {
      if (isStale && isRefreshing) {
        cacheLabel = ' <span style="color: #d97706; font-size: 10px;">(cached • refreshing)</span>';
      } else if (isStale) {
        cacheLabel = ' <span style="color: #d97706; font-size: 10px;">(cached • stale)</span>';
      } else {
        cacheLabel = ' <span style="color: #059669; font-size: 10px;">(cached)</span>';
      }
    }

    if (isDelta && baselineData?.acquisitionDate && currentData?.acquisitionDate) {
      const baseDate = new Date(baselineData.acquisitionDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
      const currDate = new Date(currentData.acquisitionDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
      dateInfo = `
        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-size: 11px; color: #6b7280;">NDVI Change</div>
          <div style="font-weight: 500; color: #1f2937; font-size: 11px;">${baseDate} → ${currDate}</div>
        </div>
      `;
    } else if (activeData?.acquisitionDate) {
      const date = new Date(activeData.acquisitionDate);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      dateInfo = `
        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-size: 11px; color: #6b7280;">Satellite Image Date${cacheLabel}</div>
          <div style="font-weight: 600; color: #1f2937;">${formattedDate}</div>
        </div>
      `;
    } else if (activeData?.dateRange) {
      dateInfo = `
        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-size: 11px; color: #6b7280;">Image Period${cacheLabel}</div>
          <div style="font-weight: 500; color: #1f2937; font-size: 11px;">${activeData.dateRange.from} to ${activeData.dateRange.to}</div>
        </div>
      `;
    }

    // Delta legend (diverging scale)
    if (isDelta) {
      legend.innerHTML = `
        ${dateInfo}
        <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">NDVI Change (Delta)</div>
        <div style="display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 14px; background: linear-gradient(to right, #22c55e, #bbf7d0); border: 1px solid #ddd; border-radius: 2px;"></div>
            <span style="color: #166534;">Improvement (+)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 14px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 2px;"></div>
            <span style="color: #6b7280;">No Change (0)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 14px; background: linear-gradient(to right, #fecaca, #ef4444); border: 1px solid #ddd; border-radius: 2px;"></div>
            <span style="color: #991b1b;">Decline (-)</span>
          </div>
        </div>
        ${stats ? `
          <div style="padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 11px;">
            <div style="color: #6b7280;">Mean Δ: <span style="font-weight: 600; color: ${stats.mean >= 0 ? '#166534' : '#991b1b'};">${stats.mean >= 0 ? '+' : ''}${stats.mean?.toFixed(3) || 'N/A'}</span></div>
            <div style="color: #6b7280;">Range: ${stats.min?.toFixed(3) || 'N/A'} to ${stats.max?.toFixed(3) || 'N/A'}</div>
          </div>
        ` : ''}
      `;
    } else {
      // Standard NDVI legend
      legend.innerHTML = `
        ${dateInfo}
        <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">NDVI Vigor Zones</div>
        ${zones.map((zone, idx) => `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <div style="width: 20px; height: 14px; background-color: ${zone.color}; border: 1px solid #ddd; border-radius: 2px;"></div>
            <span>${zone.vigorLevel} (${zone.percentOfField?.toFixed(0) || 0}%)</span>
          </div>
        `).join('')}
        ${activeData?.meanNDVI ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">
            Mean NDVI: <span style="font-weight: 600; color: #1f2937;">${activeData.meanNDVI.toFixed(2)}</span>
          </div>
        ` : ''}
      `;
    }

    map.controls[window.google.maps.ControlPosition.LEFT_BOTTOM].push(legend);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg" style={{ height }}>
        <div className="text-center p-6">
          <p className="text-red-600 font-semibold mb-2">Map Error</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg" style={{ height }}>
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!block || !zones || zones.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg" style={{ height }}>
        <p className="text-gray-500">No zone data to display</p>
      </div>
    );
  }

  // Get export options based on current state
  const exportOptions = getExportOptions({
    block,
    zones,
    ndviData: getActiveNDVIData(),
    mode: compareEnabled && viewMode === 'delta' ? 'delta' : 'ndvi',
    deltaRaster,
    baselineData,
    currentData
  });

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        {/* Compare controls */}
        <NDVICompareControls
          enabled={compareEnabled}
          onToggle={handleCompareToggle}
          baselineDate={baselineDate}
          currentDate={currentDate}
          onBaselineDateChange={(dates) => {
            setBaselineDate(dates);
            fetchComparisonData(dates, setBaselineData);
          }}
          onCurrentDateChange={(dates) => {
            setCurrentDate(dates);
            fetchComparisonData(dates, setCurrentData);
          }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isLoading={compareLoading}
          baselineData={baselineData}
          currentData={currentData}
        />

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {exportOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    opt.handler();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.description}</div>
                </button>
              ))}
              {exportOptions.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No export options available</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border border-gray-200"
      />

      {/* Prescription panel (side by side on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <NDVIPrescriptionPanel
          block={block}
          zones={zones}
          ndviData={getActiveNDVIData()}
          mode={compareEnabled && viewMode === 'delta' ? 'delta' : 'ndvi'}
          deltaRaster={deltaRaster}
        />
      </div>
    </div>
  );
}
