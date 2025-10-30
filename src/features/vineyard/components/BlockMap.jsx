import React, { useRef, useState, useMemo, useEffect } from 'react';
import { GoogleMap, useLoadScript, Polygon, Marker, Polyline } from '@react-google-maps/api';
import { Map as MapIcon, Satellite, Pencil, Trash2, MapPin, Eye, EyeOff, RotateCw, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAEwV8iVPfyCuZDYaX8rstuSUMK8ZOF6V8';
const LIBRARIES = ['drawing', 'geometry', 'places'];

// Texas Hill Country default center (Fredericksburg area)
const DEFAULT_CENTER = {
  lat: 30.2672,
  lng: -98.8792
};

// Calculate acreage from GPS polygon coordinates
const calculatePolygonArea = (path) => {
  if (!window.google || !window.google.maps || !window.google.maps.geometry || !path || path.length < 3) {
    return 0;
  }

  const googlePath = path.map(point => new window.google.maps.LatLng(point.lat, point.lng));
  const polygon = new window.google.maps.Polygon({ paths: googlePath });
  const areaSquareMeters = window.google.maps.geometry.spherical.computeArea(polygon.getPath());

  // Convert square meters to acres (1 acre = 4046.86 square meters)
  const acres = areaSquareMeters / 4046.86;
  return acres;
};

// Calculate distance between two GPS points in feet
const calculateDistance = (point1, point2) => {
  if (!window.google || !window.google.maps || !window.google.maps.geometry) {
    return 0;
  }

  const lat1 = new window.google.maps.LatLng(point1.lat, point1.lng);
  const lat2 = new window.google.maps.LatLng(point2.lat, point2.lng);
  const distanceMeters = window.google.maps.geometry.spherical.computeDistanceBetween(lat1, lat2);

  // Convert meters to feet (1 meter = 3.28084 feet)
  return distanceMeters * 3.28084;
};

// Check if a point is inside a polygon (for row clipping)
const isPointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;

    const intersect = ((yi > point.lat) !== (yj > point.lat))
        && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Clip a line to polygon boundary
const clipLineToPolygon = (lineStart, lineEnd, polygon) => {
  const segments = [];
  const numSamples = 200;

  let currentSegment = null;

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const point = {
      lat: lineStart.lat + t * (lineEnd.lat - lineStart.lat),
      lng: lineStart.lng + t * (lineEnd.lng - lineStart.lng)
    };

    const isInside = isPointInPolygon(point, polygon);

    if (isInside) {
      if (!currentSegment) {
        currentSegment = [point];
      } else {
        currentSegment.push(point);
      }
    } else {
      if (currentSegment && currentSegment.length > 1) {
        segments.push(currentSegment);
        currentSegment = null;
      } else if (currentSegment) {
        currentSegment = null;
      }
    }
  }

  if (currentSegment && currentSegment.length > 1) {
    segments.push(currentSegment);
  }

  return segments;
};

// Generate row lines for a block based on spacing and orientation
const generateRowLines = (polygonPath, rowSpacing, orientation) => {
  if (!polygonPath || polygonPath.length < 3 || !window.google) return [];

  // Find bounding box
  const lats = polygonPath.map(p => p.lat);
  const lngs = polygonPath.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const rows = [];

  // Convert row spacing from feet to approximate degrees
  const latDegPerFoot = 1 / 364000;
  const lngDegPerFoot = 1 / 300000;

  // Determine orientation: 0 deg = north-south (vertical), 90 deg = east-west (horizontal)
  const isVertical = orientation === 0 || orientation === 180;

  // Calculate max rows needed
  let maxRowsNeeded;
  if (isVertical) {
    const bboxWidthDeg = maxLng - minLng;
    const bboxWidthFeet = bboxWidthDeg / lngDegPerFoot;
    maxRowsNeeded = Math.ceil(bboxWidthFeet / rowSpacing) + 2;
  } else {
    const bboxHeightDeg = maxLat - minLat;
    const bboxHeightFeet = bboxHeightDeg / latDegPerFoot;
    maxRowsNeeded = Math.ceil(bboxHeightFeet / rowSpacing) + 2;
  }

  // Generate rows across bounding box
  for (let i = 0; i < maxRowsNeeded; i++) {
    let lineStart, lineEnd;

    if (isVertical) {
      // Rows run north-south
      const lngOffset = minLng + (i * rowSpacing * lngDegPerFoot);
      lineStart = { lat: minLat - 0.001, lng: lngOffset };
      lineEnd = { lat: maxLat + 0.001, lng: lngOffset };
    } else {
      // Rows run east-west
      const latOffset = minLat + (i * rowSpacing * latDegPerFoot);
      lineStart = { lat: latOffset, lng: minLng - 0.001 };
      lineEnd = { lat: latOffset, lng: maxLng + 0.001 };
    }

    // Clip line to polygon boundary
    const clippedSegments = clipLineToPolygon(lineStart, lineEnd, polygonPath);

    clippedSegments.forEach(segment => {
      if (segment.length >= 2) {
        rows.push({ path: segment });
      }
    });
  }

  return rows;
};

// Convert GeoJSON polygon to Google Maps path format
const geojsonToPath = (geojson) => {
  if (!geojson || !geojson.coordinates || !geojson.coordinates[0]) return [];
  return geojson.coordinates[0].map(coord => ({
    lat: coord[1],
    lng: coord[0]
  }));
};

// Convert Google Maps path to GeoJSON polygon
const pathToGeojson = (path) => {
  const coordinates = path.map(point => [point.lng, point.lat]);
  // Close the ring if not already closed
  if (coordinates.length > 0) {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push([...first]);
    }
  }
  return {
    type: 'Polygon',
    coordinates: [coordinates]
  };
};

export function BlockMap({
  blocks = [],
  onBlockUpdate,
  onBlockCreate,
  selectedBlockId,
  onBlockSelect,
  autoStartDrawing = false,
  onDrawingModeChange
}) {
  const mapRef = useRef(null);
  const [mapCenter, setMapCenter] = useState(() => {
    // Try to center on first block with geometry
    const firstBlockWithGeom = blocks.find(b => b.geom);
    if (firstBlockWithGeom) {
      const path = geojsonToPath(firstBlockWithGeom.geom);
      if (path.length > 0) {
        return {
          lat: path.reduce((sum, p) => sum + p.lat, 0) / path.length,
          lng: path.reduce((sum, p) => sum + p.lng, 0) / path.length
        };
      }
    }
    return DEFAULT_CENTER;
  });

  const [mapZoom, setMapZoom] = useState(17);
  const [basemap, setBasemap] = useState('satellite'); // 'satellite' or 'roadmap'
  const [drawingMode, setDrawingMode] = useState(false);
  const [tempPath, setTempPath] = useState([]);
  const [hasZoomedToBlocks, setHasZoomedToBlocks] = useState(false);
  const [showRows, setShowRows] = useState(true); // Toggle row visibility
  const [showBlocksList, setShowBlocksList] = useState(false); // Toggle blocks list visibility

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const mapOptions = {
    mapTypeId: basemap,
    mapTypeControl: false, // Hide Google's default map type control
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
  };

  // Calculate rows for all blocks
  const allBlockRows = useMemo(() => {
    const rowsMap = {};
    blocks.forEach(block => {
      if (block.geom && block.geom.coordinates) {
        const path = geojsonToPath(block.geom);
        if (path.length >= 3 && block.row_spacing_ft) {
          const orientation = block.row_orientation_deg || 90; // Default to east-west
          rowsMap[block.id] = generateRowLines(path, block.row_spacing_ft, orientation);
        }
      }
    });
    return rowsMap;
  }, [blocks]);

  // Auto-zoom to fit all blocks with geometry when map loads or blocks change
  useEffect(() => {
    if (!mapRef.current || !isLoaded || hasZoomedToBlocks) return;

    const blocksWithGeom = blocks.filter(b => b.geom && b.geom.coordinates);
    if (blocksWithGeom.length === 0) return;

    // Create bounds that encompass all blocks
    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    blocksWithGeom.forEach(block => {
      const path = geojsonToPath(block.geom);
      path.forEach(point => {
        bounds.extend(point);
        hasPoints = true;
      });
    });

    if (hasPoints) {
      mapRef.current.fitBounds(bounds, 50); // 50px padding
      setHasZoomedToBlocks(true);
    }
  }, [blocks, isLoaded, hasZoomedToBlocks]);

  // Auto-start drawing mode when requested
  useEffect(() => {
    if (autoStartDrawing && !drawingMode) {
      setDrawingMode(true);
      setTempPath([]);
    }
  }, [autoStartDrawing]);

  // Notify parent when drawing mode changes
  useEffect(() => {
    if (onDrawingModeChange) {
      onDrawingModeChange(drawingMode);
    }
  }, [drawingMode, onDrawingModeChange]);

  const handleMapClick = (e) => {
    if (!drawingMode) return;

    const newPoint = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };

    const newPath = [...tempPath, newPoint];

    // Check if clicked near first point to close polygon (within 50 feet)
    if (tempPath.length >= 3) {
      const firstPoint = tempPath[0];
      const distance = calculateDistance(newPoint, firstPoint);

      if (distance < 50) {
        // Complete the polygon
        handleSavePolygon(tempPath);
        return;
      }
    }

    setTempPath(newPath);
  };

  const handleSavePolygon = (polygonPath) => {
    if (polygonPath.length < 3) return;

    const geom = pathToGeojson(polygonPath);
    const acres = calculatePolygonArea(polygonPath);

    // If a block is selected and it has no geometry, update it
    if (selectedBlockId) {
      const block = blocks.find(b => b.id === selectedBlockId);
      if (block && !block.geom) {
        if (onBlockUpdate) {
          onBlockUpdate(selectedBlockId, {
            geom,
            acres: parseFloat(acres.toFixed(2))
          });
        }
        setTempPath([]);
        setDrawingMode(false);
        return;
      }
    }

    // Otherwise create a new block
    if (onBlockCreate) {
      onBlockCreate({
        geom,
        acres: parseFloat(acres.toFixed(2)),
        name: `Block ${blocks.length + 1}` // Default name
      });
    }

    setTempPath([]);
    setDrawingMode(false);
  };

  const handleStartDrawing = () => {
    setDrawingMode(true);
    setTempPath([]);
  };

  const handleCancelDrawing = () => {
    setTempPath([]);
    setDrawingMode(false);
  };

  const handleBlockClick = (blockId) => {
    if (!drawingMode && onBlockSelect) {
      onBlockSelect(blockId);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedBlockId && onBlockUpdate) {
      if (confirm('Are you sure you want to delete this block?')) {
        // This will be handled by parent - we just need to clear the geometry
        onBlockUpdate(selectedBlockId, { geom: null });
      }
    }
  };

  const handleEditSelected = () => {
    const block = blocks.find(b => b.id === selectedBlockId);
    if (block && block.geom) {
      const path = geojsonToPath(block.geom);
      setTempPath(path);
      setDrawingMode(true);

      // When editing, save will update instead of create
      // We'll handle this in handleSavePolygon
    }
  };

  const handleRotateRows = () => {
    if (selectedBlockId && onBlockUpdate) {
      const block = blocks.find(b => b.id === selectedBlockId);
      if (block) {
        const currentOrientation = block.row_orientation_deg || 90;
        // Toggle between 0 (north-south) and 90 (east-west)
        const newOrientation = currentOrientation === 0 ? 90 : 0;
        onBlockUpdate(selectedBlockId, { row_orientation_deg: newOrientation });
      }
    }
  };

  const handleGoToBlock = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.geom) {
      const path = geojsonToPath(block.geom);
      if (path.length > 0) {
        const center = {
          lat: path.reduce((sum, p) => sum + p.lat, 0) / path.length,
          lng: path.reduce((sum, p) => sum + p.lng, 0) / path.length
        };

        if (mapRef.current) {
          mapRef.current.panTo(center);
          mapRef.current.setZoom(18);
        }
      }
    }
    onBlockSelect(blockId);
  };

  const handleDeleteBlock = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && confirm(`Are you sure you want to delete "${block.name}"?`)) {
      onBlockUpdate(blockId, { geom: null });
      if (selectedBlockId === blockId) {
        onBlockSelect(null);
      }
    }
  };

  // Calculate center for map when blocks change
  const displayCenter = useMemo(() => {
    const selectedBlock = blocks.find(b => b.id === selectedBlockId);
    if (selectedBlock && selectedBlock.geom) {
      const path = geojsonToPath(selectedBlock.geom);
      if (path.length > 0) {
        return {
          lat: path.reduce((sum, p) => sum + p.lat, 0) / path.length,
          lng: path.reduce((sum, p) => sum + p.lng, 0) / path.length
        };
      }
    }
    return mapCenter;
  }, [selectedBlockId, blocks, mapCenter]);

  // Calculate total acreage
  const totalAcres = useMemo(() => {
    return blocks
      .filter(b => b.geom)
      .reduce((sum, b) => sum + (parseFloat(b.acres) || 0), 0);
  }, [blocks]);

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center p-4">
          <p className="text-red-800 font-medium">Error loading Google Maps</p>
          <p className="text-red-600 text-sm mt-1">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-center p-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-blue-800 font-medium">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Controls Bar */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-3 flex-wrap">
        {/* Basemap Toggle */}
        <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setBasemap('satellite')}
            className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium transition-colors ${
              basemap === 'satellite'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Satellite className="w-4 h-4" />
            Satellite
          </button>
          <button
            onClick={() => setBasemap('roadmap')}
            className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium transition-colors ${
              basemap === 'roadmap'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Streets
          </button>
        </div>

        {/* Drawing Tools */}
        <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
          {!drawingMode ? (
            <>
              <button
                onClick={handleStartDrawing}
                className="px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Draw Block
              </button>

              {selectedBlockId && (
                <>
                  <button
                    onClick={handleEditSelected}
                    className="px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium bg-white text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              onClick={handleCancelDrawing}
              className="px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel Drawing
            </button>
          )}
        </div>

        {/* Row Controls */}
        <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setShowRows(!showRows)}
            className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium transition-colors ${
              showRows
                ? 'bg-yellow-100 text-yellow-900'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {showRows ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showRows ? 'Rows On' : 'Rows Off'}
          </button>

          {selectedBlockId && blocks.find(b => b.id === selectedBlockId && b.geom) && (
            <button
              onClick={handleRotateRows}
              className="px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              Rotate
            </button>
          )}
        </div>

        {/* Stats & Toggle */}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">{blocks.filter(b => b.geom).length} Mapped</span>
            <span>•</span>
            <span>{totalAcres.toFixed(1)} acres</span>
          </div>

          {/* Toggle Blocks List */}
          {!drawingMode && blocks.filter(b => b.geom && b.geom.coordinates).length > 0 && (
            <button
              onClick={() => setShowBlocksList(!showBlocksList)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg flex items-center gap-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {showBlocksList ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide List
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show List
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={displayCenter}
          zoom={mapZoom}
          options={mapOptions}
          onClick={handleMapClick}
          onLoad={(map) => { mapRef.current = map; }}
        >
        {/* Render all block polygons */}
        {blocks.map(block => {
          if (!block.geom) return null;
          const path = geojsonToPath(block.geom);
          if (path.length < 3) return null;

          const isSelected = block.id === selectedBlockId;

          return (
            <Polygon
              key={block.id}
              paths={path}
              options={{
                fillColor: isSelected ? '#3b82f6' : '#8b5cf6',
                fillOpacity: isSelected ? 0.4 : 0.3,
                strokeColor: isSelected ? '#2563eb' : '#7c3aed',
                strokeOpacity: 0.9,
                strokeWeight: isSelected ? 3 : 2,
                clickable: true
              }}
              onClick={() => handleBlockClick(block.id)}
            />
          );
        })}

        {/* Render rows for all blocks */}
        {showRows && blocks.map(block => {
          const rows = allBlockRows[block.id];
          if (!rows) return null;

          const isSelected = block.id === selectedBlockId;

          return rows.map((row, index) => (
            <Polyline
              key={`${block.id}-row-${index}`}
              path={row.path}
              options={{
                strokeColor: isSelected ? '#ffff00' : '#cccc00',
                strokeOpacity: isSelected ? 0.9 : 0.5,
                strokeWeight: isSelected ? 2 : 1.5,
              }}
            />
          ));
        })}

        {/* Temporary drawing path */}
        {tempPath.length > 0 && (
          <>
            <Polyline
              path={tempPath}
              options={{
                strokeColor: '#10b981',
                strokeOpacity: 0.8,
                strokeWeight: 3,
              }}
            />
            {tempPath.map((point, index) => (
              <Marker
                key={index}
                position={point}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 6,
                  fillColor: '#10b981',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                }}
              />
            ))}
          </>
        )}
        </GoogleMap>

        {/* Drawing Instructions Overlay */}
        {drawingMode && (
          <div className="absolute top-4 right-4 z-10 bg-blue-50 border-2 border-blue-500 rounded-lg p-4 max-w-xs shadow-lg">
            {(() => {
              const selectedBlock = selectedBlockId && blocks.find(b => b.id === selectedBlockId);
              const isUpdating = selectedBlock && !selectedBlock.geom;

              return (
                <>
                  {isUpdating && (
                    <p className="text-xs font-semibold text-blue-900 mb-2 pb-2 border-b border-blue-200">
                      Adding map to: {selectedBlock.name}
                    </p>
                  )}
                  <p className="font-medium text-blue-900 mb-1">
                    {tempPath.length === 0 ? 'Click to start drawing' : 'Click to add points'}
                  </p>
                  <p className="text-sm text-blue-700">
                    {tempPath.length < 3
                      ? `Need ${3 - tempPath.length} more point${3 - tempPath.length !== 1 ? 's' : ''} to complete`
                      : 'Click near the first point to complete the polygon'}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Points: {tempPath.length}
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {/* Blocks List Dropdown Overlay */}
        {!drawingMode && showBlocksList && (() => {
          const blocksWithGeom = blocks.filter(b => b.geom && b.geom.coordinates);
          if (blocksWithGeom.length === 0) return null;

          return (
            <div className="absolute top-4 left-4 right-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">Mapped Blocks</h3>
                    <span className="text-xs text-gray-500">
                      ({blocksWithGeom.length} mapped)
                    </span>
                  </div>
                  <button
                    onClick={() => setShowBlocksList(false)}
                    className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {blocksWithGeom.map(block => {
                    const isSelected = block.id === selectedBlockId;
                    const orientation = block.row_orientation_deg === 0 ? 'N-S' : 'E-W';

                    return (
                      <div
                        key={block.id}
                        className={`flex-shrink-0 border rounded-lg p-2 min-w-[180px] transition-colors ${
                          isSelected
                            ? 'bg-blue-100 border-blue-500'
                            : 'bg-gray-50 border-gray-300 hover:border-blue-400 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => handleGoToBlock(block.id)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center gap-1.5">
                              <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${
                                isSelected ? 'text-blue-600' : 'text-purple-600'
                              }`} />
                              <span className={`font-medium text-sm ${
                                isSelected ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {block.name}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              {block.variety && <div className="truncate">{block.variety}</div>}
                              <div className="flex items-center gap-2">
                                <span>{block.acres} ac</span>
                                {block.row_spacing_ft && (
                                  <>
                                    <span>•</span>
                                    <span>{block.row_spacing_ft}' • {orientation}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                            title="Delete map"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
