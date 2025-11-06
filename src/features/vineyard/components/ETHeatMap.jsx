import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useLoadScript, Polygon } from '@react-google-maps/api';
import { Loader2, Map as MapIcon, Calendar, Droplets } from 'lucide-react';
import { fetchOpenETData } from '@/shared/lib/openETApi';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES = [];

// Color scale for ET values (mm/day) - matching OpenET color scheme
const getETColor = (et, alpha = 0.5) => {
  if (et < 2) {
    // Low ET - Blue/Cyan
    const intensity = et / 2;
    return `rgba(0, ${Math.round(191 * intensity)}, 255, ${alpha})`;
  } else if (et < 4) {
    // Medium ET - Cyan to Yellow
    const t = (et - 2) / 2;
    return `rgba(${Math.round(255 * t)}, 191, ${Math.round(255 * (1 - t))}, ${alpha})`;
  } else if (et < 6) {
    // High ET - Yellow to Orange/Red
    const t = (et - 4) / 2;
    return `rgba(255, ${Math.round(191 * (1 - t))}, 0, ${alpha})`;
  } else {
    // Very high ET - Red
    return `rgba(255, 0, 0, ${alpha})`;
  }
};

// Get ET category label
const getETCategory = (et) => {
  if (et < 2) return 'Low';
  if (et < 4) return 'Medium';
  if (et < 6) return 'High';
  return 'Very High';
};

export function ETHeatMap({ block, selectedDate }) {
  const [etData, setEtData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // Convert GeoJSON to lat/lng array and calculate center
  const { polygonCoords, mapCenter } = useMemo(() => {
    if (!block?.geom?.coordinates?.[0]) return { polygonCoords: [], mapCenter: null };

    const coords = block.geom.coordinates[0].map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));

    const avgLat = coords.reduce((sum, p) => sum + p.lat, 0) / coords.length;
    const avgLng = coords.reduce((sum, p) => sum + p.lng, 0) / coords.length;

    return {
      polygonCoords: coords,
      mapCenter: { lat: avgLat, lng: avgLng }
    };
  }, [block]);

  // Fetch ET data for center point when block or date changes
  useEffect(() => {
    if (!block || !selectedDate || !mapCenter) return;

    const fetchET = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`🌡️ Fetching ET data for ${block.name} center point on ${selectedDate}`);

        const data = await fetchOpenETData({
          lat: mapCenter.lat,
          lng: mapCenter.lng,
          startDate: selectedDate,
          endDate: selectedDate,
          model: 'ensemble',
          interval: 'daily'
        });

        // Extract ET value for the selected date
        const etValue = data.timeseries?.[0]?.et || 0;

        console.log(`✅ ET data fetched: ${etValue} mm/day`);
        setEtData({
          value: etValue,
          date: selectedDate,
          source: data.source,
          category: getETCategory(etValue)
        });
      } catch (err) {
        console.error('❌ Failed to fetch ET data:', err);
        setError('Failed to load ET data');
      } finally {
        setLoading(false);
      }
    };

    fetchET();
  }, [block, selectedDate, mapCenter]);

  // Calculate polygon fill color based on ET value
  const polygonOptions = useMemo(() => {
    if (!etData) {
      return {
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeWeight: 2,
      };
    }

    const fillColor = getETColor(etData.value, 0.6);
    const strokeColor = getETColor(etData.value, 1);

    return {
      fillColor: strokeColor.replace(/rgba?\(([^)]+)\)/, 'rgb($1)').replace(/,\s*[\d.]+\s*\)/, ')'),
      fillOpacity: 0.5,
      strokeColor: strokeColor.replace(/rgba?\(([^)]+)\)/, 'rgb($1)').replace(/,\s*[\d.]+\s*\)/, ')'),
      strokeOpacity: 0.9,
      strokeWeight: 3,
    };
  }, [etData]);

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading map</p>
      </div>
    );
  }

  if (!isLoaded || !mapCenter) {
    return (
      <div className="h-full flex items-center justify-center bg-blue-50 border border-blue-200 rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white rounded-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Evapotranspiration (ET)</h3>
          {block && <span className="text-sm text-gray-600">• {block.name}</span>}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading ET data...
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={17}
          options={{
            mapTypeId: 'satellite',
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          }}
          onLoad={(map) => { mapRef.current = map; }}
        >
          {/* Color-coded field boundary based on ET */}
          <Polygon
            paths={polygonCoords}
            options={polygonOptions}
          />
        </GoogleMap>

        {/* ET Value Display */}
        {etData && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-300 p-4 min-w-[180px]">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Current ET Rate</div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold" style={{ color: getETColor(etData.value, 1).replace(/rgba?\(([^)]+)\)/, 'rgb($1)').replace(/,\s*[\d.]+\s*\)/, ')') }}>
                {etData.value.toFixed(2)}
              </span>
              <span className="text-sm text-gray-600">mm/day</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getETColor(etData.value, 1).replace(/rgba?\(([^)]+)\)/, 'rgb($1)').replace(/,\s*[\d.]+\s*\)/, ')') }}
              />
              <span className="text-sm font-medium text-gray-700">{etData.category}</span>
            </div>
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              <Calendar className="w-3 h-3 inline mr-1" />
              {selectedDate}
            </div>
            {etData.source === 'mock-data' && (
              <div className="text-xs text-orange-600 mt-2 pt-2 border-t border-orange-200">
                ⚠️ Using sample data
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-300 p-3">
          <div className="text-xs font-semibold text-gray-900 mb-2">ET Categories</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getETColor(1, 1).replace(/rgba?\(([^)]+)\)/, 'rgb($1)').replace(/,\s*[\d.]+\s*\)/, ')') }} />
              <span className="text-xs text-gray-700">Low (0-2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getETColor(3, 1).replace(/rgba?\(([^)]+)\)/, 'rgb($1)').replace(/,\s*[\d.]+\s*\)/, ')') }} />
              <span className="text-xs text-gray-700">Medium (2-4)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getETColor(5, 1).replace(/rgba?\(([^)]+)\)/, 'rgb($1)').replace(/,\s*[\d.]+\s*\)/, ')') }} />
              <span className="text-xs text-gray-700">High (4-6)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getETColor(7, 1).replace(/rgba?\(([^)]+)\)/, 'rgb($1)').replace(/,\s*[\d.]+\s*\)/, ')') }} />
              <span className="text-xs text-gray-700">Very High (6+)</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
