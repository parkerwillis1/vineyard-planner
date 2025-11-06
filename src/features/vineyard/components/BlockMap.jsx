import React, { useRef, useState, useMemo, useEffect } from 'react';
import { GoogleMap, useLoadScript, Polygon, Marker, Polyline, DrawingManager, Autocomplete, InfoWindow } from '@react-google-maps/api';
import { Map as MapIcon, Satellite, Pencil, Trash2, MapPin, Eye, EyeOff, RotateCw, ChevronUp, ChevronDown, Settings, Layers, Grid, MoreVertical, Save, X, Search, CloudRain, Droplet } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/shared/components/ui/dropdown-menu';
import {
  fetchFieldRainfall,
  fetchFieldForecast
} from '@/shared/lib/fieldWeatherService';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
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

// Calculate intersection point between two line segments
const lineIntersection = (p1, p2, p3, p4) => {
  const x1 = p1.lng, y1 = p1.lat;
  const x2 = p2.lng, y2 = p2.lat;
  const x3 = p3.lng, y3 = p3.lat;
  const x4 = p4.lng, y4 = p4.lat;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denom) < 1e-10) return null; // Lines are parallel

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      lat: y1 + t * (y2 - y1),
      lng: x1 + t * (x2 - x1)
    };
  }

  return null;
};

// Clip a line to polygon boundary using exact intersection points
const clipLineToPolygon = (lineStart, lineEnd, polygon) => {
  // Find all intersection points with polygon edges
  const intersections = [];

  for (let i = 0; i < polygon.length; i++) {
    const edgeStart = polygon[i];
    const edgeEnd = polygon[(i + 1) % polygon.length];
    const intersection = lineIntersection(lineStart, lineEnd, edgeStart, edgeEnd);

    if (intersection) {
      // Calculate distance from line start for sorting
      const dx = intersection.lng - lineStart.lng;
      const dy = intersection.lat - lineStart.lat;
      const distance = Math.sqrt(dx * dx + dy * dy);
      intersections.push({ point: intersection, distance });
    }
  }

  // Sort intersections by distance from line start
  intersections.sort((a, b) => a.distance - b.distance);

  // Check if line endpoints are inside polygon
  const startInside = isPointInPolygon(lineStart, polygon);
  const endInside = isPointInPolygon(lineEnd, polygon);

  const segments = [];

  if (intersections.length === 0) {
    // No intersections - line is either completely inside or completely outside
    if (startInside) {
      segments.push([lineStart, lineEnd]);
    }
  } else {
    // Build segments from intersection points
    const points = [lineStart, ...intersections.map(i => i.point), lineEnd];

    for (let i = 0; i < points.length - 1; i++) {
      const segmentStart = points[i];
      const segmentEnd = points[i + 1];

      // Check if segment midpoint is inside polygon
      const midpoint = {
        lat: (segmentStart.lat + segmentEnd.lat) / 2,
        lng: (segmentStart.lng + segmentEnd.lng) / 2
      };

      if (isPointInPolygon(midpoint, polygon)) {
        segments.push([segmentStart, segmentEnd]);
      }
    }
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

  // Convert orientation to radians (0° = North, 90° = East)
  const angleRad = (orientation * Math.PI) / 180;

  // Calculate bounding box dimensions
  const bboxWidthDeg = maxLng - minLng;
  const bboxHeightDeg = maxLat - minLat;
  const bboxWidthFeet = bboxWidthDeg / lngDegPerFoot;
  const bboxHeightFeet = bboxHeightDeg / latDegPerFoot;

  // Calculate the diagonal size to ensure we cover the entire area when rotated
  const diagonalFeet = Math.sqrt(bboxWidthFeet * bboxWidthFeet + bboxHeightFeet * bboxHeightFeet);
  const maxRowsNeeded = Math.ceil(diagonalFeet / rowSpacing) + 2;

  // Center point of bounding box
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Direction perpendicular to rows (this is the direction between rows)
  const perpAngleRad = angleRad + Math.PI / 2;
  const perpDirLat = Math.cos(perpAngleRad);
  const perpDirLng = Math.sin(perpAngleRad);

  // Direction along rows
  const rowDirLat = Math.cos(angleRad);
  const rowDirLng = Math.sin(angleRad);

  // Generate rows
  for (let i = -maxRowsNeeded / 2; i < maxRowsNeeded / 2; i++) {
    // Calculate offset from center for this row
    const offsetFeet = i * rowSpacing;
    const offsetLat = (perpDirLat * offsetFeet) * latDegPerFoot;
    const offsetLng = (perpDirLng * offsetFeet) * lngDegPerFoot;

    // Calculate row center point
    const rowCenterLat = centerLat + offsetLat;
    const rowCenterLng = centerLng + offsetLng;

    // Calculate row endpoints (extend far beyond bounding box)
    const extensionFeet = diagonalFeet;
    const extensionLat = (rowDirLat * extensionFeet) * latDegPerFoot;
    const extensionLng = (rowDirLng * extensionFeet) * lngDegPerFoot;

    const lineStart = {
      lat: rowCenterLat - extensionLat,
      lng: rowCenterLng - extensionLng
    };
    const lineEnd = {
      lat: rowCenterLat + extensionLat,
      lng: rowCenterLng + extensionLng
    };

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
  const [showRotationControls, setShowRotationControls] = useState(false); // Toggle rotation controls
  const [draggingVertexIndex, setDraggingVertexIndex] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // {x, y, edgeIndex, clickPosition}
  const [autocomplete, setAutocomplete] = useState(null); // For address search
  const [drawingManagerRef, setDrawingManagerRef] = useState(null);
  const [rainfallData, setRainfallData] = useState({}); // {blockId: {totalMm, totalInches, predictedMm, lastRainEvent, etc}}
  const [showRainfallOverlay, setShowRainfallOverlay] = useState(true); // Toggle rainfall badges
  const [loadingRainfall, setLoadingRainfall] = useState(false);

  const { isLoaded, loadError} = useLoadScript({
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

  // Load rainfall data for all blocks with coordinates
  useEffect(() => {
    async function loadAllRainfallData() {
      if (!isLoaded) return;

      const blocksWithCoords = blocks.filter(b => b.lat && b.lng);
      if (blocksWithCoords.length === 0) return;

      setLoadingRainfall(true);

      try {
        // Load rainfall data for all blocks in parallel
        const rainfallPromises = blocksWithCoords.map(async (block) => {
          try {
            const [rainfall, forecast] = await Promise.all([
              fetchFieldRainfall(block.lat, block.lng, 7), // Last 7 days
              fetchFieldForecast(block.lat, block.lng)
            ]);

            return {
              blockId: block.id,
              data: {
                totalMm: rainfall.totalMm || 0,
                totalInches: rainfall.totalInches || 0,
                dailyRainfall: rainfall.dailyRainfall || {},
                lastRainEvent: rainfall.lastRainEvent,
                predictedMm: forecast.predictedRainfallMm || 0,
                predictedInches: forecast.predictedRainfallInches || 0,
                stationName: rainfall.stationName,
                dataSource: rainfall.error ? 'error' : 'nws_api',
                error: rainfall.error || forecast.error
              }
            };
          } catch (error) {
            console.error(`Error loading rainfall for block ${block.id}:`, error);
            return {
              blockId: block.id,
              data: { totalMm: 0, dataSource: 'error', error: error.message }
            };
          }
        });

        const results = await Promise.all(rainfallPromises);

        // Convert array to object keyed by blockId
        const rainfallMap = {};
        results.forEach(({ blockId, data }) => {
          rainfallMap[blockId] = data;
        });

        setRainfallData(rainfallMap);
        console.log('✅ Loaded rainfall data for', blocksWithCoords.length, 'fields');
      } catch (error) {
        console.error('Error loading rainfall data:', error);
      } finally {
        setLoadingRainfall(false);
      }
    }

    loadAllRainfallData();
  }, [blocks, isLoaded]);

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

    // If a block is selected, update it (whether it has geometry or not)
    if (selectedBlockId) {
      const block = blocks.find(b => b.id === selectedBlockId);
      if (block) {
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

  // Autocomplete handlers
  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setMapCenter(location);
        setMapZoom(18);
        if (mapRef.current) {
          mapRef.current.panTo(location);
          mapRef.current.setZoom(18);
        }
      }
    }
  };

  // Drawing Manager complete handler
  const onPolygonComplete = (polygon) => {
    const path = polygon.getPath().getArray().map(point => ({
      lat: point.lat(),
      lng: point.lng()
    }));

    setTempPath(path);
    polygon.setMap(null); // Remove the drawn polygon since we'll show tempPath
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

      // Remove the closing point if it's a duplicate of the first point
      // (GeoJSON polygons have first point repeated at end, but we don't want that during editing)
      const editPath = path.length > 1 &&
        path[0].lat === path[path.length - 1].lat &&
        path[0].lng === path[path.length - 1].lng
        ? path.slice(0, -1)
        : path;

      setTempPath(editPath);
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

  const handleSetOrientation = (angle) => {
    if (selectedBlockId && onBlockUpdate) {
      onBlockUpdate(selectedBlockId, { row_orientation_deg: angle });
    }
  };

  const handleVertexDrag = (index, newPosition) => {
    const newPath = [...tempPath];
    newPath[index] = {
      lat: newPosition.lat(),
      lng: newPosition.lng()
    };
    setTempPath(newPath);
  };

  const handlePolygonRightClick = (e) => {
    if (!drawingMode || tempPath.length < 2) return;

    e.stop(); // Prevent default map context menu

    const clickPosition = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };

    // Find which edge was clicked (closest edge to click point)
    let closestEdge = 0;
    let minDistance = Infinity;

    for (let i = 0; i < tempPath.length; i++) {
      const nextI = (i + 1) % tempPath.length;
      const dist = calculateDistance(clickPosition, tempPath[i]) + calculateDistance(clickPosition, tempPath[nextI]);
      if (dist < minDistance) {
        minDistance = dist;
        closestEdge = i;
      }
    }

    setContextMenu({
      x: e.domEvent.clientX,
      y: e.domEvent.clientY,
      edgeIndex: closestEdge,
      clickPosition
    });
  };

  const handleAddPointOnEdge = () => {
    if (!contextMenu) return;

    const newPath = [...tempPath];
    // Insert the new point after the edge index
    newPath.splice(contextMenu.edgeIndex + 1, 0, contextMenu.clickPosition);
    setTempPath(newPath);
    setContextMenu(null);
  };

  // Close context menu when clicking anywhere
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

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
      {/* Simplified Toolbar */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-300 px-4 py-3 flex items-center gap-3">
        {/* Primary Action - Drawing */}
        {!drawingMode && (() => {
          // Show "Draw Field" if no field selected, OR if selected field has no geometry
          const selectedBlock = selectedBlockId ? blocks.find(b => b.id === selectedBlockId) : null;
          return !selectedBlockId || (selectedBlock && !selectedBlock.geom);
        })() && (
          <button
            onClick={handleStartDrawing}
            className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all hover:shadow-md"
          >
            <Pencil className="w-4 h-4" />
            {selectedBlockId ? 'Draw Boundary' : 'Draw Field'}
          </button>
        )}
        {drawingMode && (
          <>
            <button
              onClick={() => handleSavePolygon(tempPath)}
              disabled={tempPath.length < 3}
              className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={handleCancelDrawing}
              className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold bg-gray-600 text-white hover:bg-gray-700 shadow-sm transition-all"
            >
              Cancel
            </button>
          </>
        )}

        {/* Address Search */}
        {!drawingMode && (
          <div className="relative flex-1 max-w-md">
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                componentRestrictions: { country: 'us' },
                fields: ['geometry', 'formatted_address', 'name']
              }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search address or location..."
                  className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg shadow-sm"
                />
              </div>
            </Autocomplete>
          </div>
        )}

        {/* Map View Dropdown */}
        <DropdownMenu
          trigger={
            <DropdownMenuTrigger className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 shadow-sm">
              {basemap === 'satellite' ? (
                <>
                  <Satellite className="w-4 h-4" />
                  Satellite
                </>
              ) : (
                <>
                  <MapIcon className="w-4 h-4" />
                  Streets
                </>
              )}
            </DropdownMenuTrigger>
          }
        >
          <DropdownMenuItem
            icon={Satellite}
            onClick={() => setBasemap('satellite')}
            variant={basemap === 'satellite' ? 'primary' : 'default'}
          >
            Satellite View
          </DropdownMenuItem>
          <DropdownMenuItem
            icon={MapIcon}
            onClick={() => setBasemap('roadmap')}
            variant={basemap === 'roadmap' ? 'primary' : 'default'}
          >
            Street Map
          </DropdownMenuItem>
        </DropdownMenu>

        {/* Field Actions - Only when field selected */}
        {selectedBlockId && !drawingMode && (() => {
          const selectedBlock = blocks.find(b => b.id === selectedBlockId);
          const hasGeometry = selectedBlock?.geom;

          return (
            <DropdownMenu
              trigger={
                <DropdownMenuTrigger className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 shadow-sm">
                  <MoreVertical className="w-4 h-4" />
                  Actions
                </DropdownMenuTrigger>
              }
            >
              {hasGeometry ? (
                <>
                  <DropdownMenuItem
                    icon={Pencil}
                    onClick={handleEditSelected}
                  >
                    Edit Boundary
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    icon={RotateCw}
                    onClick={handleRotateRows}
                  >
                    Rotate Rows to {(selectedBlock?.row_orientation_deg || 90) === 0 ? 'East-West' : 'North-South'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    icon={Settings}
                    onClick={() => setShowRotationControls(!showRotationControls)}
                    variant={showRotationControls ? 'primary' : 'default'}
                  >
                    Custom Rotation ({selectedBlock?.row_orientation_deg || 90}°)
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  icon={Pencil}
                  onClick={handleStartDrawing}
                >
                  Draw Boundary
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                icon={Trash2}
                onClick={handleDeleteSelected}
                variant="danger"
              >
                Delete Field
              </DropdownMenuItem>
            </DropdownMenu>
          );
        })()}

        {/* Row Controls Dropdown - Smart visibility */}
        {blocks.some(b => b.geom && b.row_spacing_ft) && (
          <DropdownMenu
            trigger={
              <DropdownMenuTrigger className={`px-4 py-2 rounded-lg border shadow-sm ${
                showRows
                  ? 'bg-yellow-100 border-yellow-300 text-yellow-900 hover:bg-yellow-200'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}>
                <Grid className="w-4 h-4" />
                {showRows ? 'Rows On' : 'Rows Off'}
              </DropdownMenuTrigger>
            }
          >
            <DropdownMenuItem
              icon={showRows ? EyeOff : Eye}
              onClick={() => setShowRows(!showRows)}
              variant={showRows ? 'warning' : 'default'}
            >
              {showRows ? 'Hide Rows' : 'Show Rows'}
            </DropdownMenuItem>

            {selectedBlockId && (() => {
              const selectedBlock = blocks.find(b => b.id === selectedBlockId);
              if (!selectedBlock?.geom) return null;
              const currentOrientation = selectedBlock?.row_orientation_deg || 90;
              return (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    icon={RotateCw}
                    onClick={handleRotateRows}
                  >
                    Rotate to {currentOrientation === 0 ? 'East-West' : 'North-South'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    icon={Settings}
                    onClick={() => setShowRotationControls(!showRotationControls)}
                    variant={showRotationControls ? 'primary' : 'default'}
                  >
                    Custom Rotation ({currentOrientation}°)
                  </DropdownMenuItem>
                </>
              );
            })()}
          </DropdownMenu>
        )}

        {/* Rainfall Overlay Toggle - Show when blocks have coordinates */}
        {blocks.some(b => b.lat && b.lng) && (
          <button
            onClick={() => setShowRainfallOverlay(!showRainfallOverlay)}
            className={`px-4 py-2 rounded-lg border shadow-sm transition-colors ${
              showRainfallOverlay
                ? 'bg-blue-100 border-blue-300 text-blue-900 hover:bg-blue-200'
                : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
            title={showRainfallOverlay ? 'Hide rainfall data' : 'Show rainfall data'}
          >
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4" />
              <span className="text-sm font-medium">
                {showRainfallOverlay ? 'Rainfall On' : 'Rainfall Off'}
              </span>
            </div>
          </button>
        )}

        {/* Stats - Right aligned */}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>{blocks.filter(b => b.geom).length} Fields</span>
            <span className="text-gray-400">•</span>
            <span>{totalAcres.toFixed(1)} acres</span>
          </div>

          {/* Field List Toggle */}
          {!drawingMode && blocks.filter(b => b.geom && b.geom.coordinates).length > 0 && (
            <button
              onClick={() => setShowBlocksList(!showBlocksList)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700 shadow-sm transition-all"
            >
              {showBlocksList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showBlocksList ? 'Hide' : 'Show'} List
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
          {/* Drawing Manager for creating new polygons */}
          {drawingMode && (
            <DrawingManager
              onLoad={(drawingManager) => setDrawingManagerRef(drawingManager)}
              onPolygonComplete={onPolygonComplete}
              options={{
                drawingMode: window.google?.maps?.drawing?.OverlayType?.POLYGON,
                drawingControl: false,
                polygonOptions: {
                  fillColor: '#3b82f6',
                  fillOpacity: 0.4,
                  strokeColor: '#2563eb',
                  strokeOpacity: 0.9,
                  strokeWeight: 2,
                  clickable: true,
                  editable: false,
                  zIndex: 1
                }
              }}
            />
          )}

        {/* Render all block polygons */}
        {blocks.map(block => {
          if (!block.geom) return null;
          const path = geojsonToPath(block.geom);
          if (path.length < 3) return null;

          const isSelected = block.id === selectedBlockId;
          const rainfall = rainfallData[block.id];

          // Color-code by rainfall amount when rainfall overlay is enabled
          let fillColor = isSelected ? '#3b82f6' : '#8b5cf6';
          let strokeColor = isSelected ? '#2563eb' : '#7c3aed';

          if (showRainfallOverlay && rainfall && rainfall.dataSource === 'nws_api') {
            const totalInches = rainfall.totalInches || 0;
            // Color gradient from light blue (low) to dark blue (high)
            if (totalInches >= 2.0) {
              fillColor = '#1e3a8a'; // Deep blue (heavy rain)
              strokeColor = '#1e40af';
            } else if (totalInches >= 1.0) {
              fillColor = '#2563eb'; // Medium blue
              strokeColor = '#3b82f6';
            } else if (totalInches >= 0.5) {
              fillColor = '#60a5fa'; // Light blue
              strokeColor = '#93c5fd';
            } else if (totalInches > 0) {
              fillColor = '#dbeafe'; // Very light blue (light rain)
              strokeColor = '#bfdbfe';
            } else {
              fillColor = '#fef3c7'; // Light yellow (no rain)
              strokeColor = '#fde68a';
            }

            // Selected block gets brighter stroke
            if (isSelected) {
              strokeColor = '#f59e0b';
            }
          }

          return (
            <Polygon
              key={block.id}
              paths={path}
              options={{
                fillColor,
                fillOpacity: showRainfallOverlay && rainfall ? 0.5 : (isSelected ? 0.4 : 0.3),
                strokeColor,
                strokeOpacity: 0.9,
                strokeWeight: isSelected ? 3 : 2,
                clickable: true
              }}
              onClick={() => handleBlockClick(block.id)}
            />
          );
        })}

        {/* Render rainfall badges on fields */}
        {showRainfallOverlay && blocks.map(block => {
          if (!block.geom || !block.lat || !block.lng) return null;

          const rainfall = rainfallData[block.id];
          if (!rainfall || rainfall.dataSource !== 'nws_api') return null;

          const path = geojsonToPath(block.geom);
          if (path.length === 0) return null;

          // Calculate center of polygon for badge placement
          const center = {
            lat: path.reduce((sum, p) => sum + p.lat, 0) / path.length,
            lng: path.reduce((sum, p) => sum + p.lng, 0) / path.length
          };

          const totalInches = rainfall.totalInches || 0;
          const predictedInches = rainfall.predictedInches || 0;

          return (
            <InfoWindow
              key={`rainfall-${block.id}`}
              position={center}
              options={{
                disableAutoPan: true,
                closeBoxURL: '',
                enableEventPropagation: true
              }}
            >
              <div className="bg-white rounded-lg shadow-lg border-2 border-blue-400 px-3 py-2 min-w-[140px]">
                <div className="text-xs font-semibold text-gray-700 mb-1 truncate">
                  {block.name}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <CloudRain className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-bold text-blue-900">
                      {totalInches.toFixed(2)}"
                    </div>
                    <div className="text-xs text-gray-600">Last 7 days</div>
                  </div>
                </div>
                {predictedInches > 0 && (
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                    <Droplet className="w-3.5 h-3.5 text-blue-400" />
                    <div className="text-xs text-gray-700">
                      +{predictedInches.toFixed(2)}" forecast
                    </div>
                  </div>
                )}
                {rainfall.lastRainEvent?.date && (
                  <div className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-200">
                    Last: {new Date(rainfall.lastRainEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            </InfoWindow>
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
            {/* Show filled polygon when we have enough points */}
            {tempPath.length >= 3 && (
              <Polygon
                paths={tempPath}
                options={{
                  fillColor: '#10b981',
                  fillOpacity: 0.2,
                  strokeColor: '#10b981',
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                  clickable: true,
                }}
                onRightClick={handlePolygonRightClick}
              />
            )}

            {/* Show polyline for incomplete polygons or during editing */}
            {tempPath.length < 3 && (
              <Polyline
                path={tempPath}
                options={{
                  strokeColor: '#10b981',
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                  clickable: true,
                }}
                onRightClick={handlePolygonRightClick}
              />
            )}

            {/* Draggable vertex markers */}
            {tempPath.map((point, index) => (
              <Marker
                key={index}
                position={point}
                draggable={true}
                onDrag={(e) => handleVertexDrag(index, e.latLng)}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillColor: '#10b981',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                }}
                options={{
                  cursor: 'move'
                }}
              />
            ))}
          </>
        )}
        </GoogleMap>

        {/* Context Menu for Adding Points */}
        {contextMenu && (
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-300 py-1 min-w-[160px]"
            style={{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleAddPointOnEdge}
              className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 flex items-center gap-2 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Add Point Here
            </button>
          </div>
        )}

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
                      : 'Drag points to adjust or click Save Changes'}
                  </p>
                  {tempPath.length > 0 && (
                    <>
                      <p className="text-xs text-blue-600 mt-2">
                        💡 Drag the green circles to adjust the boundary
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Right-click on the line to add a new point
                      </p>
                    </>
                  )}
                  <p className="text-xs text-blue-600 mt-2">
                    Points: {tempPath.length}
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {/* Rainfall Legend */}
        {!drawingMode && showRainfallOverlay && blocks.some(b => b.lat && b.lng) && (
          <div className="absolute bottom-4 left-4 z-20 bg-white rounded-xl shadow-2xl border border-gray-300 p-4 w-[280px]">
            <div className="flex items-center gap-2 mb-3">
              <CloudRain className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">Rainfall Map (7 days)</h3>
            </div>
            <div className="space-y-2">
              {[
                { min: 2.0, color: '#1e3a8a', label: '≥ 2.0"', desc: 'Heavy rain' },
                { min: 1.0, color: '#2563eb', label: '1.0" - 2.0"', desc: 'Moderate rain' },
                { min: 0.5, color: '#60a5fa', label: '0.5" - 1.0"', desc: 'Light rain' },
                { min: 0.01, color: '#dbeafe', label: '< 0.5"', desc: 'Trace' },
                { min: 0, color: '#fef3c7', label: 'No rain', desc: 'Dry period' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border-2 border-gray-400 flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {loadingRainfall && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-xs text-blue-600">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading weather data...</span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
              Data from National Weather Service
            </div>
          </div>
        )}

        {/* Rotation Controls Panel */}
        {!drawingMode && showRotationControls && selectedBlockId && (() => {
          const selectedBlock = blocks.find(b => b.id === selectedBlockId);
          if (!selectedBlock?.geom) return null;
          const currentOrientation = selectedBlock.row_orientation_deg || 90;

          return (
            <div className="absolute bottom-4 right-4 z-20 bg-white rounded-xl shadow-2xl border border-gray-300 p-4 w-[340px]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Row Rotation</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedBlock.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRotationControls(false)}
                  className="p-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Angle Display */}
              <div className="mb-5 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Current Angle:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-yellow-700">{currentOrientation.toFixed(1)}°</span>
                    <div className="text-xs text-gray-600">
                      {currentOrientation === 0 && '(North)'}
                      {currentOrientation === 45 && '(NE)'}
                      {currentOrientation === 90 && '(East)'}
                      {currentOrientation === 135 && '(SE)'}
                      {currentOrientation === 180 && '(South)'}
                      {currentOrientation === 225 && '(SW)'}
                      {currentOrientation === 270 && '(West)'}
                      {currentOrientation === 315 && '(NW)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Angle Slider */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Drag to rotate (0° = North, 90° = East, 0.25° increments)
                </label>
                <input
                  type="range"
                  min="0"
                  max="359.75"
                  step="0.25"
                  value={currentOrientation}
                  onChange={(e) => handleSetOrientation(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #fbbf24 0%, #f59e0b ${(currentOrientation / 359.75) * 100}%, #e5e7eb ${(currentOrientation / 359.75) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                  <span>0° N</span>
                  <span>90° E</span>
                  <span>180° S</span>
                  <span>270° W</span>
                  <span>359.75°</span>
                </div>
              </div>

              {/* Preset Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Presets:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { angle: 0, label: 'N', desc: 'North' },
                    { angle: 45, label: 'NE', desc: 'Northeast' },
                    { angle: 90, label: 'E', desc: 'East' },
                    { angle: 135, label: 'SE', desc: 'Southeast' },
                    { angle: 180, label: 'S', desc: 'South' },
                    { angle: 225, label: 'SW', desc: 'Southwest' },
                    { angle: 270, label: 'W', desc: 'West' },
                    { angle: 315, label: 'NW', desc: 'Northwest' },
                  ].map(({ angle, label, desc }) => (
                    <button
                      key={angle}
                      type="button"
                      onClick={() => {
                        handleSetOrientation(angle);
                        // Auto-close panel after preset selection with brief delay to show change
                        setTimeout(() => setShowRotationControls(false), 300);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        currentOrientation === angle
                          ? 'bg-yellow-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-yellow-100 hover:text-yellow-700'
                      }`}
                      title={`${desc} (${angle}°)`}
                    >
                      {label}
                      <div className="text-xs font-normal opacity-80">{angle}°</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

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
                    const rainfall = rainfallData[block.id];

                    return (
                      <div
                        key={block.id}
                        className={`flex-shrink-0 border rounded-lg p-2 min-w-[200px] transition-colors ${
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
                              {/* Rainfall data */}
                              {rainfall && rainfall.dataSource === 'nws_api' && (
                                <div className="flex items-center gap-1 mt-1 pt-1 border-t border-gray-300">
                                  <CloudRain className="w-3 h-3 text-blue-500" />
                                  <span className="font-semibold text-blue-700">
                                    {rainfall.totalInches?.toFixed(2)}"
                                  </span>
                                  <span className="text-gray-500">rainfall (7d)</span>
                                </div>
                              )}
                              {block.lat && block.lng && (!rainfall || loadingRainfall) && (
                                <div className="flex items-center gap-1 mt-1 pt-1 border-t border-gray-300">
                                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-gray-500 text-xs">Loading weather...</span>
                                </div>
                              )}
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
