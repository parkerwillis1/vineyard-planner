import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

/**
 * NDVI Zone Map Component
 * Displays vineyard field with NDVI-based irrigation zones overlaid
 */
export function NDVIZoneMap({ block, zones, ndviData, height = '500px' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false); // Start false so div renders immediately
  const [error, setError] = useState(null);

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

  const drawNDVIHeatMap = (map, ndviData) => {
    const { rasterData, width, height, bbox } = ndviData;

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

    // Draw each pixel, but only if it's inside the field boundary
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Convert pixel coordinates to lat/lng
        const lng = bbox[0] + (x / width) * (bbox[2] - bbox[0]);
        const lat = bbox[3] - (y / height) * (bbox[3] - bbox[1]);

        // Check if this pixel is inside the field boundary
        const insideField = isPointInPolygon(lat, lng);

        const idx = y * width + x;
        const ndvi = rasterData[idx];
        const color = insideField ? getColorForNDVI(ndvi) : { r: 0, g: 0, b: 0, a: 0 };

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

  const addLegend = (map, zones) => {
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

    legend.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">NDVI Irrigation Zones</div>
      ${zones.map((zone, idx) => `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <div style="width: 20px; height: 14px; background-color: ${zone.color}; border: 1px solid #ddd; border-radius: 2px;"></div>
          <span>${zone.name || `Zone ${idx + 1}`} (${zone.vigorLevel})</span>
        </div>
      `).join('')}
    `;

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

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%' }}
      className="rounded-lg overflow-hidden border border-gray-200"
    />
  );
}
