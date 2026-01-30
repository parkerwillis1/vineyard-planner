import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, Polygon, Marker, Polyline, DrawingManager, Autocomplete, InfoWindow, GroundOverlay } from '@react-google-maps/api';
import { Map as MapIcon, Satellite, Pencil, Trash2, MapPin, Eye, EyeOff, RotateCw, ChevronUp, ChevronDown, Settings, Layers, Grid, MoreVertical, Save, X, Search, CloudRain, Droplet, Sun, Activity, Mountain, AlertTriangle, Thermometer, Download, GitCompare, Clock, Calendar, ChevronLeft, ChevronRight, Maximize2, Minimize2, Printer, Check, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
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
import {
  fetchNDVIForBlock,
  createZonesFromNDVI,
  fetchNDVIForBlockAtDate,
  computeNDVIDeltaRaster,
  computeNDVIStats,
  searchAvailableImageryDates
} from '@/shared/lib/sentinelHubApi';
import { getExportOptions } from '@/shared/lib/ndviExportUtils';
import {
  fetchOpenETData,
  getGrapeKc,
  applyKcToTimeseries,
  getDateRange
} from '@/shared/lib/openETApi';
import { sortByName } from '@/shared/lib/sortUtils';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ['drawing', 'geometry', 'places'];

// Default center: General United States view
const DEFAULT_CENTER = {
  lat: 39.8283,
  lng: -98.5795
};

// Default zoom for US overview (used only on initial load with no blocks)
const DEFAULT_ZOOM = 4;

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

/**
 * Calculate the perpendicular distance from a point to a line segment,
 * and return the closest point on the segment.
 *
 * This is used for detecting if a right-click is "on" an edge.
 *
 * @param {Object} point - The click point {lat, lng}
 * @param {Object} segStart - Start of segment {lat, lng}
 * @param {Object} segEnd - End of segment {lat, lng}
 * @returns {Object} { distance: number (in feet), projectedPoint: {lat, lng} }
 */
const pointToSegmentDistance = (point, segStart, segEnd) => {
  // Convert to simple x,y for calculation (using lng as x, lat as y)
  const px = point.lng;
  const py = point.lat;
  const ax = segStart.lng;
  const ay = segStart.lat;
  const bx = segEnd.lng;
  const by = segEnd.lat;

  // Vector from A to B
  const abx = bx - ax;
  const aby = by - ay;

  // Vector from A to P
  const apx = px - ax;
  const apy = py - ay;

  // Project AP onto AB, computing parameterized position t
  const ab2 = abx * abx + aby * aby; // |AB|^2

  if (ab2 === 0) {
    // Segment is a point
    return {
      distance: calculateDistance(point, segStart),
      projectedPoint: segStart
    };
  }

  let t = (apx * abx + apy * aby) / ab2;

  // Clamp t to [0, 1] to stay within the segment
  t = Math.max(0, Math.min(1, t));

  // Find the closest point on the segment
  const projectedPoint = {
    lat: ay + t * aby,
    lng: ax + t * abx
  };

  // Calculate distance from point to projected point
  const distance = calculateDistance(point, projectedPoint);

  return { distance, projectedPoint };
};

/**
 * Find the edge that was clicked, if any.
 * Returns the edge index and projected point if click is within tolerance of an edge.
 *
 * @param {Object} clickPoint - {lat, lng}
 * @param {Array} vertices - Array of {lat, lng} points forming the polygon
 * @param {number} toleranceFeet - Maximum distance in feet to consider "on" the edge
 * @returns {Object|null} { segmentIndex, projectedPoint } or null if not on any edge
 */
const findHitEdge = (clickPoint, vertices, toleranceFeet = 30) => {
  if (vertices.length < 2) return null;

  let closestEdge = null;
  let minDistance = Infinity;

  for (let i = 0; i < vertices.length; i++) {
    const nextI = (i + 1) % vertices.length;
    const { distance, projectedPoint } = pointToSegmentDistance(
      clickPoint,
      vertices[i],
      vertices[nextI]
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestEdge = {
        segmentIndex: i,
        projectedPoint,
        distance
      };
    }
  }

  // Only return if within tolerance
  if (closestEdge && closestEdge.distance <= toleranceFeet) {
    return closestEdge;
  }

  return null;
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

// Generate static map URL for a field polygon
// Uses Google Static Maps as primary, falls back to Geoapify (free tier)
const generateStaticMapUrl = (block, apiKey, options = {}) => {
  const {
    width = 800,
    height = 450,
    mapType = 'satellite',
    strokeColor = '7c3aed', // Purple
    strokeWeight = 3,
    fillColor = '7c3aed40', // Purple with transparency
    padding = 0.001, // Extra padding around bounds
    useGeoapify = false // Use free Geoapify API instead of Google
  } = options;

  if (!block.geom || !block.geom.coordinates || !block.geom.coordinates[0]) {
    console.log('❌ No geometry for block:', block.name);
    return null;
  }

  const coords = block.geom.coordinates[0];

  // Calculate bounds
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  coords.forEach(([lng, lat]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });

  // Add padding
  minLat -= padding;
  maxLat += padding;
  minLng -= padding;
  maxLng += padding;

  // Calculate center
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Calculate approximate zoom level based on bounds
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);

  // Approximate zoom calculation
  let zoom;
  if (maxDiff > 0.1) zoom = 13;
  else if (maxDiff > 0.05) zoom = 14;
  else if (maxDiff > 0.02) zoom = 15;
  else if (maxDiff > 0.01) zoom = 16;
  else if (maxDiff > 0.005) zoom = 17;
  else if (maxDiff > 0.002) zoom = 18;
  else zoom = 18;

  console.log('🗺️ Block:', block.name, 'Center:', centerLat.toFixed(4), centerLng.toFixed(4), 'Zoom:', zoom);

  // Calculate bounding box for ESRI
  const bboxBuffer = maxDiff * 0.3; // 30% buffer
  const esriBbox = `${minLng - bboxBuffer},${minLat - bboxBuffer},${maxLng + bboxBuffer},${maxLat + bboxBuffer}`;

  // Try multiple free satellite imagery sources
  // 1. ESRI World Imagery (free, high-quality)
  const esriUrl = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?` +
    `bbox=${encodeURIComponent(esriBbox)}` +
    `&bboxSR=4326` +
    `&size=${width}%2C${height}` +
    `&imageSR=4326` +
    `&format=jpg` +
    `&f=image`;

  // 2. OpenStreetMap tiles as fallback (road map style, always works)
  const osmTileUrl = `https://tile.openstreetmap.org/${zoom}/${Math.floor((centerLng + 180) / 360 * Math.pow(2, zoom))}/${Math.floor((1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}.png`;

  console.log('🗺️ ESRI URL:', esriUrl.substring(0, 120) + '...');
  console.log('🗺️ OSM tile URL:', osmTileUrl);

  // If Google API key is available, try Google first
  if (apiKey && !useGeoapify) {
    // Simplify coordinates to avoid URL length limits
    const maxPoints = 30;
    const step = Math.max(1, Math.floor(coords.length / maxPoints));
    const simplifiedCoords = coords.filter((_, i) => i % step === 0 || i === coords.length - 1);

    // Build path parameter for polygon outline
    const pathCoords = simplifiedCoords.map(([lng, lat]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join('|');
    const pathParam = `color:0x${strokeColor}FF|fillcolor:0x${fillColor}|weight:${strokeWeight}|${pathCoords}`;

    const googleUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${centerLat.toFixed(6)},${centerLng.toFixed(6)}` +
      `&zoom=${zoom}` +
      `&size=${width}x${height}` +
      `&scale=2` +
      `&maptype=${mapType}` +
      `&path=${encodeURIComponent(pathParam)}` +
      `&key=${apiKey}`;

    console.log('🗺️ Using Google Static Maps, URL length:', googleUrl.length);
    return { google: googleUrl, esri: esriUrl };
  }

  console.log('🗺️ Using ESRI fallback (no Google API key)');
  return { google: null, esri: esriUrl };
};

export function BlockMap({
  blocks = [],
  onBlockUpdate,
  onBlockCreate,
  selectedBlockId,
  onBlockSelect,
  autoStartDrawing = false,
  onDrawingModeChange,
  printModalOpen = false,
  onPrintModalClose,
  showAddressSearch = false,  // Show address search even in drawing mode (for drawing modal)
  isDrawingModal = false,     // True when used in the drawing modal - hides save/cancel buttons
  onDrawingProgress,          // Callback for drawing progress: {points: number, path: array, isComplete: boolean}
  editModeEnabled = false,    // When true in drawing modal, enables editing (drag vertices, right-click, midpoints)
  clearTrigger = 0            // Increment this to clear drawing state without remounting (preserves map camera)
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

  // Use close zoom if we have blocks, otherwise show US overview
  const [mapZoom, setMapZoom] = useState(() => {
    const hasBlockWithGeom = blocks.some(b => b.geom);
    return hasBlockWithGeom ? 17 : DEFAULT_ZOOM;
  });
  const [basemap, setBasemap] = useState('satellite'); // 'satellite' or 'roadmap'
  const [isFullscreen, setIsFullscreen] = useState(false); // Custom fullscreen mode
  const [drawingMode, setDrawingMode] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false); // Track if editing existing vs drawing new
  const [tempPath, setTempPath] = useState([]);
  const [polygonClosed, setPolygonClosed] = useState(false); // Track when user clicked near first point to close polygon
  const [hoverNearFirstPoint, setHoverNearFirstPoint] = useState(false); // Visual feedback when hovering near first point
  const [hasZoomedToBlocks, setHasZoomedToBlocks] = useState(false);
  const [showRows, setShowRows] = useState(true); // Toggle row visibility
  const [showBlocksList, setShowBlocksList] = useState(false); // Toggle blocks list visibility
  const [showRotationControls, setShowRotationControls] = useState(false); // Toggle rotation controls
  const [draggingVertexIndex, setDraggingVertexIndex] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // {x, y, edgeIndex, clickPosition}
  const [autocomplete, setAutocomplete] = useState(null); // For address search
  const [drawingManagerRef, setDrawingManagerRef] = useState(null);
  const [rainfallData, setRainfallData] = useState({}); // {blockId: {totalMm, totalInches, predictedMm, lastRainEvent, etc}}
  const [showRainfallOverlay, setShowRainfallOverlay] = useState(false); // Synced with rainfall layer toggle
  const [loadingRainfall, setLoadingRainfall] = useState(false);

  // Visualization layer state - all layers start off (user selects one at a time)
  const [activeLayers, setActiveLayers] = useState({
    ndvi: false,
    et: false,
    waterDeficit: false,
    topography: false,
    floodZones: false,
    rainfall: false // User must explicitly enable
  });
  const [layerData, setLayerData] = useState({
    ndvi: {}, // {blockId: {rasterData, width, height, bbox, stats}}
    et: {}, // {blockId: {timeseries, summary, rasterData, bbox}}
    waterDeficit: {}, // {blockId: {deficitMm, rasterData, bbox}}
    topography: {}, // {blockId: {elevationData, bbox}}
    floodZones: {} // {blockId: {zoneData, bbox}}
  });
  const [loadingLayers, setLoadingLayers] = useState({
    ndvi: false,
    et: false,
    waterDeficit: false,
    topography: false,
    floodZones: false
  });
  const [rainfallWeeks, setRainfallWeeks] = useState(1); // Number of weeks to fetch rainfall data

  // NDVI Compare mode state
  const [ndviCompareEnabled, setNdviCompareEnabled] = useState(false);
  const [ndviBaselineDate, setNdviBaselineDate] = useState(null);
  const [ndviCurrentDate, setNdviCurrentDate] = useState(null);
  const [ndviBaselineData, setNdviBaselineData] = useState({}); // {blockId: data}
  const [ndviCurrentData, setNdviCurrentData] = useState({}); // {blockId: data}
  const [ndviViewMode, setNdviViewMode] = useState('current'); // 'baseline' | 'current' | 'delta'
  const [ndviDeltaRasters, setNdviDeltaRasters] = useState({}); // {blockId: Float32Array}
  const [ndviDeltaStats, setNdviDeltaStats] = useState({}); // {blockId: stats}
  const [compareLoading, setCompareLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    selectedFields: {}, // {blockId: true/false}
    selectedLayers: {}, // {blockId: {ndvi: true, et: false, rainfall: true, base: false}}
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureBlockId, setCaptureBlockId] = useState(null); // Block being captured (uses transparent fill)
  const [captureProgress, setCaptureProgress] = useState({ current: 0, total: 0, message: '' });
  const [capturedImages, setCapturedImages] = useState({}); // {blockId_layer: dataUrl}
  const mapContainerRef = useRef(null);

  // Sync print modal with external prop
  useEffect(() => {
    if (printModalOpen) {
      // Initialize print config with all fields selected when opening from external trigger
      const fieldsWithGeom = blocks.filter(b => b.geom && b.geom.coordinates);
      const selectedFields = {};
      const selectedLayers = {};
      fieldsWithGeom.forEach(b => {
        selectedFields[b.id] = true;
        selectedLayers[b.id] = { base: true, ndvi: false, et: false, rainfall: false };
      });
      setPrintConfig({ selectedFields, selectedLayers });
      setShowPrintModal(true);
    }
  }, [printModalOpen, blocks]);

  // NDVI Timeline mode state
  const [ndviTimelineEnabled, setNdviTimelineEnabled] = useState(false);
  const [ndviTimelineYear, setNdviTimelineYear] = useState(new Date().getFullYear() - 1); // Default to last year for better imagery availability
  const [ndviAvailableDates, setNdviAvailableDates] = useState([]); // [{date, cloudCover, sceneId, qualityScore}]
  const [ndviSelectedDateIndex, setNdviSelectedDateIndex] = useState(0); // Committed index (triggers fetch)
  const [sliderPosition, setSliderPosition] = useState(0); // Visual slider position (updates immediately)
  const [ndviTimelineData, setNdviTimelineData] = useState({}); // {blockId: {dateStr: ndviData}}
  const ndviTimelineCacheRef = useRef({}); // Ref to avoid stale closure issues with cache
  const sliderDebounceRef = useRef(null); // Debounce timer for slider
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineScope, setTimelineScope] = useState('selected'); // 'selected' | 'all'

  // Function to capture map views for printing
  const captureMapForPrint = useCallback(async (block, layer) => {
    if (!mapRef.current || !mapContainerRef.current) {
      console.error('Map or container ref not available');
      return null;
    }

    // Store current state to restore later
    const originalLayers = { ...activeLayers };
    const originalSelectedBlock = selectedBlockId;
    const originalShowRows = showRows;

    try {
      // IMPORTANT: Disable row lines during capture (they show yellow and clutter the image)
      setShowRows(false);

      // Set capture block ID - this tells polygon rendering to use transparent fill
      setCaptureBlockId(block.id);

      // Set the appropriate layer based on what we're capturing
      const newLayers = {
        ndvi: layer === 'ndvi',
        et: layer === 'et',
        waterDeficit: false,
        topography: false,
        floodZones: false,
        rainfall: layer === 'rainfall'
      };
      setActiveLayers(newLayers);

      // Select the block and pan to it
      onBlockSelect?.(block.id);

      // Pan and zoom to the block - use consistent padding for all field sizes
      const path = geojsonToPath(block.geom);
      if (path.length > 0 && mapRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        path.forEach(point => bounds.extend(point));

        // Use larger padding to ensure field is fully visible with room to spare
        const padding = { top: 80, bottom: 80, left: 80, right: 80 };

        mapRef.current.fitBounds(bounds, padding);
      }

      // Wait for map tiles to load first
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For NDVI/ET layers, wait for the overlay data to be ready
      if (layer === 'ndvi' || layer === 'et') {
        // Additional wait for overlay images to render on the map canvas
        console.log(`⏳ Waiting for ${layer} overlay to render...`);
        await new Promise(resolve => setTimeout(resolve, 2500));
      } else {
        // Standard wait for satellite/base layer
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Capture the map container
      const canvas = await html2canvas(mapContainerRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // Higher resolution for print
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Hide elements marked for print hide (legends, search bar, etc.)
          const printHideElements = clonedDoc.querySelectorAll('[data-print-hide="true"]');
          printHideElements.forEach(el => {
            if (el && el.style) {
              el.style.display = 'none';
            }
          });

          // Hide specific Google Maps UI controls (but NOT the map tiles)
          const gmControls = clonedDoc.querySelectorAll(
            '.gmnoprint, ' +  // Google Maps no-print elements (controls)
            '.gm-style-cc, ' +  // Google copyright/terms
            '.gm-control-active, ' +  // Active controls
            'a[href*="google.com/maps"], ' +  // Google Maps links
            '[title="Open this area in Google Maps"], ' +  // Open in maps button
            '[title="Toggle fullscreen view"], ' +  // Fullscreen button
            '[title="Zoom in"], [title="Zoom out"], ' +  // Zoom controls
            '[title="Show street map"], [title="Show satellite imagery"]' // Map type controls
          );
          gmControls.forEach(el => {
            if (el && el.style) {
              el.style.display = 'none';
            }
          });
        }
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      console.log(`📸 Captured ${block.name} - ${layer}, size: ${Math.round(dataUrl.length / 1024)}KB`);

      return dataUrl;
    } catch (error) {
      console.error('Error capturing map:', error);
      return null;
    } finally {
      // Restore original state
      setCaptureBlockId(null);
      setShowRows(originalShowRows);
      setActiveLayers(originalLayers);
      if (originalSelectedBlock) {
        onBlockSelect?.(originalSelectedBlock);
      }
    }
  }, [activeLayers, selectedBlockId, onBlockSelect, showRows, layerData, loadingLayers]);

  const { isLoaded, loadError} = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const mapOptions = useMemo(() => ({
    mapTypeId: basemap,
    mapTypeControl: false, // Hide Google's default map type control
    streetViewControl: false,
    fullscreenControl: false, // Use our custom fullscreen instead
    zoomControl: true,
    // Cursor changes based on drawing state:
    // - crosshair: actively drawing (adding points)
    // - pointer: hovering near first point to close
    // - default: polygon closed or not drawing
    draggableCursor: drawingMode && !polygonClosed && !isEditingExisting
      ? (hoverNearFirstPoint ? 'pointer' : 'crosshair')
      : 'default',
  }), [basemap, drawingMode, polygonClosed, isEditingExisting, hoverNearFirstPoint]);

  // Calculate rows for all blocks (including tempPath during editing)
  const allBlockRows = useMemo(() => {
    const rowsMap = {};
    blocks.forEach(block => {
      // If we're editing this block, use tempPath instead of saved geometry
      if (drawingMode && block.id === selectedBlockId && tempPath.length >= 3) {
        if (block.row_spacing_ft) {
          const orientation = block.row_orientation_deg || 90; // Default to east-west
          rowsMap[block.id] = generateRowLines(tempPath, block.row_spacing_ft, orientation);
        }
      } else if (block.geom && block.geom.coordinates) {
        const path = geojsonToPath(block.geom);
        if (path.length >= 3 && block.row_spacing_ft) {
          const orientation = block.row_orientation_deg || 90; // Default to east-west
          rowsMap[block.id] = generateRowLines(path, block.row_spacing_ft, orientation);
        }
      }
    });
    return rowsMap;
  }, [blocks, drawingMode, selectedBlockId, tempPath]);

  // Compute centroids for blocks that have geometry but not lat/lng
  // This enables ET and Rainfall layers to work with any block
  const blocksWithCentroids = useMemo(() => {
    return blocks.map(block => {
      // If block already has lat/lng, return as-is
      if (block.lat && block.lng) return block;

      // Compute centroid from geometry
      if (block.geom && block.geom.coordinates && block.geom.coordinates[0]) {
        const coords = block.geom.coordinates[0];
        if (coords.length > 0) {
          // Calculate centroid of polygon
          let sumLat = 0, sumLng = 0;
          const numPoints = coords.length - 1; // Exclude closing point
          for (let i = 0; i < numPoints; i++) {
            sumLng += coords[i][0];
            sumLat += coords[i][1];
          }
          return {
            ...block,
            lat: sumLat / numPoints,
            lng: sumLng / numPoints
          };
        }
      }
      return block;
    });
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
      setPolygonClosed(false);
    }
  }, [autoStartDrawing]);

  // Handle clear trigger - clears drawing state WITHOUT remounting the map (preserves camera position)
  const prevClearTrigger = useRef(clearTrigger);
  useEffect(() => {
    if (clearTrigger !== prevClearTrigger.current) {
      prevClearTrigger.current = clearTrigger;
      // Clear all drawing-related state
      setTempPath([]);
      setPolygonClosed(false);
      setHoverNearFirstPoint(false);
      setContextMenu(null);
      setIsEditingExisting(false);
      // Restart drawing mode if in drawing modal
      if (isDrawingModal) {
        setDrawingMode(true);
      }
    }
  }, [clearTrigger, isDrawingModal]);

  // Notify parent when drawing mode changes
  useEffect(() => {
    if (onDrawingModeChange) {
      onDrawingModeChange(drawingMode);
    }
  }, [drawingMode, onDrawingModeChange]);

  // Notify parent of drawing progress (for showing save/clear buttons in parent)
  // State machine: DRAWING (adding points) → CLOSED (polygon complete) → EDITING (adjusting)
  useEffect(() => {
    if (onDrawingProgress && drawingMode) {
      const acres = tempPath.length >= 3 ? calculatePolygonArea(tempPath) : 0;
      // isComplete = true ONLY when user clicked near first point to close the polygon
      const isComplete = isDrawingModal ? (polygonClosed === true) : (tempPath.length >= 3);
      onDrawingProgress({
        points: tempPath.length,
        path: tempPath,
        acres: parseFloat(acres.toFixed(2)),
        isComplete
      });
    }
  }, [tempPath, drawingMode, onDrawingProgress, polygonClosed, isDrawingModal]);

  // Load rainfall data for all blocks when rainfall or waterDeficit layer is enabled
  useEffect(() => {
    async function loadAllRainfallData() {
      // Load rainfall for rainfall layer OR as dependency for waterDeficit
      if ((!activeLayers.rainfall && !activeLayers.waterDeficit) || !isLoaded) return;

      const blocksWithCoords = blocksWithCentroids.filter(b => b.lat && b.lng);
      if (blocksWithCoords.length === 0) {
        console.log('📭 No blocks with coordinates for rainfall');
        return;
      }

      const days = rainfallWeeks * 7;
      setLoadingRainfall(true);

      try {
        // Load rainfall data sequentially with small delay to avoid API rate limits
        const results = [];
        for (let i = 0; i < blocksWithCoords.length; i++) {
          const block = blocksWithCoords[i];

          // Skip if we already have data for this block with the same time period
          if (rainfallData[block.id] && rainfallData[block.id].days === days) {
            results.push({ blockId: block.id, data: rainfallData[block.id] });
            continue;
          }

          // Add small delay between requests to avoid rate limiting (except first)
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 150));
          }

          try {
            console.log(`🌧️ Fetching ${days}-day rainfall for ${block.name}`);
            const [rainfall, forecast] = await Promise.all([
              fetchFieldRainfall(block.lat, block.lng, days),
              fetchFieldForecast(block.lat, block.lng)
            ]);

            results.push({
              blockId: block.id,
              data: {
                days, // Store the time period for cache validation
                totalMm: rainfall.totalMm || 0,
                totalInches: rainfall.totalInches || 0,
                dailyRainfall: rainfall.dailyRainfall || {},
                lastRainEvent: rainfall.lastRainEvent,
                predictedMm: forecast.predictedRainfallMm || 0,
                predictedInches: forecast.predictedRainfallInches || 0,
                stationName: rainfall.stationName,
                dataSource: rainfall.source || 'unknown',
                error: rainfall.error || forecast.error
              }
            });
          } catch (error) {
            console.error(`Error loading rainfall for block ${block.id}:`, error);
            results.push({
              blockId: block.id,
              data: { days, totalMm: 0, dataSource: 'error', error: error.message }
            });
          }
        }

        // Convert array to object keyed by blockId
        const rainfallMap = {};
        results.forEach(({ blockId, data }) => {
          rainfallMap[blockId] = data;
        });

        setRainfallData(rainfallMap);
        console.log(`✅ Loaded ${days}-day rainfall data for`, blocksWithCoords.length, 'fields');
      } catch (error) {
        console.error('Error loading rainfall data:', error);
      } finally {
        setLoadingRainfall(false);
      }
    }

    loadAllRainfallData();
  }, [activeLayers.rainfall, activeLayers.waterDeficit, blocksWithCentroids, isLoaded, rainfallWeeks]);

  // Fetch NDVI data for all blocks when NDVI layer is enabled
  useEffect(() => {
    async function loadNDVIData() {
      console.log('🔍 NDVI useEffect triggered:', {
        ndviActive: activeLayers.ndvi,
        isLoaded,
        blockCount: blocks.length
      });

      if (!activeLayers.ndvi || !isLoaded) return;

      const blocksWithGeom = blocks.filter(b => b.geom && b.geom.coordinates);
      console.log(`📍 Blocks with geometry: ${blocksWithGeom.length}`);

      if (blocksWithGeom.length === 0) return;

      setLoadingLayers(prev => ({ ...prev, ndvi: true }));

      try {
        const ndviPromises = blocksWithGeom.map(async (block) => {
          try {
            // Check if we already have data for this block
            if (layerData.ndvi[block.id]) {
              console.log(`✓ Using cached NDVI data for ${block.name}`);
              return { blockId: block.id, data: layerData.ndvi[block.id] };
            }

            console.log(`🛰️ Fetching NDVI for ${block.name}`);
            const ndviData = await fetchNDVIForBlock(block, { days: 30 });
            console.log(`✓ Received NDVI data for ${block.name}:`, {
              hasRasterData: !!ndviData?.rasterData,
              width: ndviData?.width,
              height: ndviData?.height,
              bbox: ndviData?.bbox
            });

            return {
              blockId: block.id,
              data: ndviData
            };
          } catch (error) {
            console.error(`Error loading NDVI for block ${block.id}:`, error);
            return {
              blockId: block.id,
              data: null,
              error: error.message
            };
          }
        });

        const results = await Promise.all(ndviPromises);

        const ndviMap = {};
        results.forEach(({ blockId, data }) => {
          if (data) ndviMap[blockId] = data;
        });

        setLayerData(prev => ({
          ...prev,
          ndvi: { ...prev.ndvi, ...ndviMap }
        }));
        console.log('✅ Loaded NDVI data for', Object.keys(ndviMap).length, 'blocks');
      } catch (error) {
        console.error('Error loading NDVI data:', error);
      } finally {
        setLoadingLayers(prev => ({ ...prev, ndvi: false }));
      }
    }

    loadNDVIData();
  }, [activeLayers.ndvi, blocks, isLoaded]);

  // Fetch NDVI comparison data when compare mode is enabled and dates change
  useEffect(() => {
    async function loadComparisonData() {
      if (!ndviCompareEnabled || !activeLayers.ndvi || !isLoaded) return;

      const blocksWithGeom = blocks.filter(b => b.geom && b.geom.coordinates);
      if (blocksWithGeom.length === 0) return;

      console.log('🔄 Loading NDVI comparison data:', {
        baselineDate: ndviBaselineDate,
        currentDate: ndviCurrentDate
      });

      setCompareLoading(true);

      try {
        // Fetch baseline data if dates are set
        if (ndviBaselineDate?.start && ndviBaselineDate?.end) {
          console.log('📅 Fetching baseline NDVI for date range:', {
            start: ndviBaselineDate.start.toISOString(),
            end: ndviBaselineDate.end.toISOString()
          });

          const baselinePromises = blocksWithGeom.map(async (block) => {
            try {
              const data = await fetchNDVIForBlockAtDate(block, {
                startDate: ndviBaselineDate.start,
                endDate: ndviBaselineDate.end
              });
              console.log(`✅ Baseline data for ${block.name}:`, {
                hasRasterData: !!data?.rasterData,
                acquisitionDate: data?.acquisitionDate
              });
              return { blockId: block.id, data };
            } catch (error) {
              console.error(`❌ Error loading baseline for ${block.name}:`, error);
              return { blockId: block.id, data: null };
            }
          });

          const baselineResults = await Promise.all(baselinePromises);
          const baselineMap = {};
          baselineResults.forEach(({ blockId, data }) => {
            if (data && data.rasterData) baselineMap[blockId] = data;
          });
          console.log('📊 Baseline data loaded for blocks:', Object.keys(baselineMap));
          setNdviBaselineData(baselineMap);
        }

        // Fetch current data if dates are set
        if (ndviCurrentDate?.start && ndviCurrentDate?.end) {
          console.log('📅 Fetching current NDVI for date range:', {
            start: ndviCurrentDate.start.toISOString(),
            end: ndviCurrentDate.end.toISOString()
          });

          const currentPromises = blocksWithGeom.map(async (block) => {
            try {
              const data = await fetchNDVIForBlockAtDate(block, {
                startDate: ndviCurrentDate.start,
                endDate: ndviCurrentDate.end
              });
              console.log(`✅ Current data for ${block.name}:`, {
                hasRasterData: !!data?.rasterData,
                acquisitionDate: data?.acquisitionDate
              });
              return { blockId: block.id, data };
            } catch (error) {
              console.error(`❌ Error loading current for ${block.name}:`, error);
              return { blockId: block.id, data: null };
            }
          });

          const currentResults = await Promise.all(currentPromises);
          const currentMap = {};
          currentResults.forEach(({ blockId, data }) => {
            if (data && data.rasterData) currentMap[blockId] = data;
          });
          console.log('📊 Current data loaded for blocks:', Object.keys(currentMap));
          setNdviCurrentData(currentMap);
        }
      } catch (error) {
        console.error('Error loading comparison data:', error);
      } finally {
        setCompareLoading(false);
      }
    }

    loadComparisonData();
  }, [ndviCompareEnabled, ndviBaselineDate, ndviCurrentDate, activeLayers.ndvi, blocks, isLoaded]);

  // Compute delta rasters when both baseline and current data are available
  useEffect(() => {
    if (!ndviCompareEnabled) return;

    console.log('🧮 Computing delta rasters:', {
      baselineBlocks: Object.keys(ndviBaselineData),
      currentBlocks: Object.keys(ndviCurrentData)
    });

    const deltaMap = {};
    const statsMap = {};

    blocks.forEach(block => {
      const baseline = ndviBaselineData[block.id];
      const current = ndviCurrentData[block.id];

      console.log(`Block ${block.name}:`, {
        hasBaseline: !!baseline?.rasterData,
        hasCurrent: !!current?.rasterData
      });

      if (baseline?.rasterData && current?.rasterData) {
        try {
          const delta = computeNDVIDeltaRaster(baseline.rasterData, current.rasterData);
          deltaMap[block.id] = delta;
          statsMap[block.id] = computeNDVIStats(delta, { isDelta: true });
          console.log(`✅ Delta computed for ${block.name}:`, statsMap[block.id]);
        } catch (err) {
          console.error(`❌ Error computing delta for ${block.name}:`, err);
        }
      }
    });

    console.log('📊 Delta rasters computed for blocks:', Object.keys(deltaMap));
    setNdviDeltaRasters(deltaMap);
    setNdviDeltaStats(statsMap);
  }, [ndviCompareEnabled, ndviBaselineData, ndviCurrentData, blocks]);

  // Generate timeline dates based on Sentinel-2 revisit cycle (every 5 days)
  useEffect(() => {
    if (!ndviTimelineEnabled || !activeLayers.ndvi || !isLoaded) {
      setNdviAvailableDates([]);
      return;
    }

    // Determine which blocks to use
    const blocksToUse = timelineScope === 'all'
      ? blocks.filter(b => b.geom && b.geom.coordinates)
      : selectedBlockId
        ? blocks.filter(b => b.id === selectedBlockId && b.geom && b.geom.coordinates)
        : [];

    if (blocksToUse.length === 0) {
      console.log('No blocks selected for timeline');
      setNdviAvailableDates([]);
      return;
    }

    // Generate dates based on Sentinel-2 revisit cycle (approximately every 5 days)
    // Focus on growing season months (April - October) for better data
    const dates = [];
    const today = new Date();
    const isCurrentYear = ndviTimelineYear === today.getFullYear();

    // Start from April, end at October (or current date if current year)
    const startMonth = 3; // April (0-indexed)
    const endMonth = isCurrentYear ? Math.min(today.getMonth(), 9) : 9; // October or current month

    for (let month = startMonth; month <= endMonth; month++) {
      // Generate dates every 5 days for smooth timeline scrubbing
      const daysInMonth = new Date(ndviTimelineYear, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day += 5) {
        const dateObj = new Date(ndviTimelineYear, month, Math.min(day, daysInMonth));

        // Skip future dates
        if (dateObj > today) continue;

        const dateStr = dateObj.toISOString().split('T')[0];
        dates.push({
          date: dateStr,
          dateObj: dateObj,
          cloudCover: null, // Unknown until we fetch
          sceneId: null,
          qualityScore: null
        });
      }
    }

    console.log(`📅 Generated ${dates.length} timeline dates for year ${ndviTimelineYear}`);
    setNdviAvailableDates(dates);
    const startIndex = dates.length - 1;
    setNdviSelectedDateIndex(startIndex); // Start at most recent
    setSliderPosition(startIndex); // Sync slider position
  }, [ndviTimelineEnabled, ndviTimelineYear, timelineScope, selectedBlockId, activeLayers.ndvi, blocks, isLoaded]);

  // Fetch NDVI data for selected timeline date
  useEffect(() => {
    async function loadTimelineNDVI() {
      console.log('🔄 loadTimelineNDVI called:', {
        ndviTimelineEnabled,
        datesAvailable: ndviAvailableDates.length,
        ndviLayerActive: activeLayers.ndvi,
        selectedDateIndex: ndviSelectedDateIndex,
        timelineScope,
        selectedBlockId
      });

      if (!ndviTimelineEnabled || ndviAvailableDates.length === 0 || !activeLayers.ndvi) {
        console.log('⚠️ Timeline early return - preconditions not met');
        return;
      }

      const selectedDate = ndviAvailableDates[ndviSelectedDateIndex];
      if (!selectedDate) {
        console.log('⚠️ Timeline early return - no selected date');
        return;
      }

      // Determine which blocks to load
      // If scope is 'selected' but no block is selected, load ALL blocks with geometry
      const blocksWithGeom = blocks.filter(b => b.geom && b.geom.coordinates);
      const blocksToLoad = timelineScope === 'all'
        ? blocksWithGeom
        : selectedBlockId
          ? blocks.filter(b => b.id === selectedBlockId && b.geom && b.geom.coordinates)
          : blocksWithGeom; // Fallback to all blocks if none selected

      console.log(`📋 Timeline blocks to load: ${blocksToLoad.length}`, blocksToLoad.map(b => b.name));

      if (blocksToLoad.length === 0) {
        console.log('⚠️ Timeline early return - no blocks to load');
        return;
      }

      // Check if we already have this data cached (use ref to avoid stale closure)
      const dateStr = selectedDate.date;
      const cache = ndviTimelineCacheRef.current;

      // Debug: log cache state
      const cachedBlocks = blocksToLoad.filter(b => cache[b.id]?.[dateStr]?.rasterData);
      console.log(`🔍 Cache check for ${dateStr}:`, {
        blocksToLoad: blocksToLoad.length,
        cachedBlocks: cachedBlocks.length,
        cacheKeys: Object.keys(cache),
        cacheForDate: blocksToLoad.map(b => ({
          block: b.name,
          hasCacheEntry: !!cache[b.id],
          hasDateEntry: !!cache[b.id]?.[dateStr],
          hasRaster: !!cache[b.id]?.[dateStr]?.rasterData
        }))
      });

      const allCached = cachedBlocks.length === blocksToLoad.length;

      if (allCached) {
        // Update layerData with cached timeline data - use functional form
        console.log(`📦 Using cached timeline data for ${dateStr}`);
        setLayerData(prev => {
          const newNdvi = { ...prev.ndvi };
          blocksToLoad.forEach(block => {
            const cachedData = cache[block.id][dateStr];
            newNdvi[block.id] = cachedData;
            console.log(`📊 Cached data for block ${block.id}: mean=${cachedData.meanNDVI?.toFixed(3)}, date=${dateStr}`);
          });
          return { ...prev, ndvi: newNdvi };
        });
        // Sync slider position with cached data
        setSliderPosition(ndviSelectedDateIndex);
        return;
      }

      setTimelineLoading(true);

      try {
        const dateStart = new Date(selectedDate.date);
        const dateEnd = new Date(dateStart);
        dateEnd.setDate(dateEnd.getDate() + 10); // 10-day window to capture ~2 Sentinel-2 passes

        console.log(`📅 Loading timeline NDVI for ${dateStr}`);

        const ndviPromises = blocksToLoad.map(async (block) => {
          // Check block-specific cache first (use ref for current values)
          if (cache[block.id]?.[dateStr]?.rasterData) {
            console.log(`📦 Using cached data for ${block.name} at ${dateStr}`);
            return { blockId: block.id, data: cache[block.id][dateStr], cached: true };
          }

          try {
            console.log(`🛰️ Fetching timeline NDVI for ${block.name} from ${dateStart.toISOString().split('T')[0]} to ${dateEnd.toISOString().split('T')[0]}`);
            const data = await fetchNDVIForBlockAtDate(block, {
              startDate: dateStart,
              endDate: dateEnd
              // Don't skip cache - we want consistent results for the same date range
            });
            // Calculate valid pixel percentage (non-NaN pixels)
            let validPixelPercent = 0;
            if (data?.rasterData) {
              const totalPixels = data.rasterData.length;
              let validCount = 0;
              for (let i = 0; i < totalPixels; i++) {
                if (isFinite(data.rasterData[i]) && !isNaN(data.rasterData[i])) {
                  validCount++;
                }
              }
              validPixelPercent = (validCount / totalPixels) * 100;
            }

            // Validate data - reject if:
            // 1. No raster data
            // 2. Mean NDVI is 0 or invalid
            // 3. Less than 50% of pixels are valid (too cloudy)
            const isValidData = data?.rasterData &&
              data?.meanNDVI != null &&
              !isNaN(data.meanNDVI) &&
              Math.abs(data.meanNDVI) > 0.01 &&
              validPixelPercent >= 50; // At least 50% of field must have valid data

            // Create a simple fingerprint of the data to detect if it's the same scene
            const dataFingerprint = data?.rasterData
              ? `${data.meanNDVI?.toFixed(4)}-${data.minNDVI?.toFixed(4)}-${data.maxNDVI?.toFixed(4)}`
              : 'none';

            console.log(`📡 Received timeline data for ${block.name}:`, {
              requestedDate: dateStr,
              acquisitionDate: data?.acquisitionDate,
              meanNDVI: data?.meanNDVI?.toFixed(4),
              validPixelPercent: validPixelPercent.toFixed(1) + '%',
              fingerprint: dataFingerprint,
              isValid: isValidData
            });

            if (!isValidData) {
              console.warn(`⚠️ Rejecting cloudy/invalid data for ${block.name} at ${dateStr} - valid pixels: ${validPixelPercent.toFixed(1)}%, mean: ${data?.meanNDVI?.toFixed(3)}`);
              return { blockId: block.id, data: null, cached: false, rejected: true };
            }
            return { blockId: block.id, data, cached: false };
          } catch (error) {
            console.error(`Error loading timeline NDVI for ${block.name}:`, error);
            return { blockId: block.id, data: null, cached: false };
          }
        });

        const results = await Promise.all(ndviPromises);

        // Update timeline cache (both ref and state) - only cache valid data
        results.forEach(({ blockId, data, cached, rejected }) => {
          if (data && !cached && !rejected) {
            if (!cache[blockId]) cache[blockId] = {};
            cache[blockId][dateStr] = data;
            // Also track this as the "last good" data for this block
            cache[blockId]._lastGood = data;
            cache[blockId]._lastGoodDate = dateStr;
          }
        });
        // Also update state for any components that depend on it
        setNdviTimelineData({ ...cache });

        // Update main layer data - use functional form to avoid stale closure
        // For rejected/cloudy images, fall back to last good image
        setLayerData(prev => {
          const newNdvi = { ...prev.ndvi };
          results.forEach(({ blockId, data, rejected }) => {
            if (rejected || !data) {
              // Use last good image as fallback
              const lastGood = cache[blockId]?._lastGood;
              if (lastGood) {
                console.log(`🔄 Using last good image for ${blockId} (from ${cache[blockId]._lastGoodDate}) instead of cloudy ${dateStr}`);
                newNdvi[blockId] = lastGood;
              } else {
                // No fallback available - keep existing data
                console.log(`⚠️ No fallback available for ${blockId} at ${dateStr}`);
              }
            } else {
              // Valid data - use it
              newNdvi[blockId] = data;
              console.log(`📊 Timeline data for block ${blockId}: mean=${data.meanNDVI?.toFixed(3)}, date=${dateStr}`);
            }
          });
          return { ...prev, ndvi: newNdvi };
        });

        console.log(`✅ Timeline NDVI loaded for ${dateStr}`);
        // Sync slider position after successful load
        setSliderPosition(ndviSelectedDateIndex);
      } catch (error) {
        console.error('Error loading timeline NDVI:', error);
      } finally {
        setTimelineLoading(false);
      }
    }

    loadTimelineNDVI();
  }, [ndviTimelineEnabled, ndviSelectedDateIndex, ndviAvailableDates, timelineScope, selectedBlockId, blocks, activeLayers.ndvi]);

  // Fetch ET data for all blocks when ET or waterDeficit layer is enabled
  useEffect(() => {
    async function loadETData() {
      // Load ET for ET layer OR as dependency for waterDeficit
      if ((!activeLayers.et && !activeLayers.waterDeficit) || !isLoaded) return;

      const blocksWithCoords = blocksWithCentroids.filter(b => b.lat && b.lng);
      if (blocksWithCoords.length === 0) {
        console.log('📭 No blocks with coordinates for ET');
        return;
      }

      setLoadingLayers(prev => ({ ...prev, et: true }));

      try {
        const { startDate, endDate } = getDateRange('30days');

        const etPromises = blocksWithCoords.map(async (block) => {
          try {
            // Check if we already have data for this block
            if (layerData.et[block.id]) {
              return { blockId: block.id, data: layerData.et[block.id] };
            }

            console.log(`📡 Fetching ET for ${block.name} at (${block.lat.toFixed(4)}, ${block.lng.toFixed(4)})`);
            const etResponse = await fetchOpenETData({
              lat: block.lat,
              lng: block.lng,
              startDate,
              endDate,
              model: 'ensemble',
              interval: 'daily'
            });

            const timeseriesWithKc = applyKcToTimeseries(etResponse.timeseries, getGrapeKc);
            const totalET = timeseriesWithKc.reduce((sum, day) => sum + day.et, 0);
            const totalETc = timeseriesWithKc.reduce((sum, day) => sum + day.etc, 0);
            const avgET = totalET / timeseriesWithKc.length;

            return {
              blockId: block.id,
              data: {
                timeseries: timeseriesWithKc,
                summary: {
                  avgET: parseFloat(avgET.toFixed(2)),
                  totalET: parseFloat(totalET.toFixed(2)),
                  totalETc: parseFloat(totalETc.toFixed(2))
                },
                source: etResponse.source
              }
            };
          } catch (error) {
            console.error(`Error loading ET for block ${block.id}:`, error);
            return {
              blockId: block.id,
              data: null,
              error: error.message
            };
          }
        });

        const results = await Promise.all(etPromises);

        const etMap = {};
        results.forEach(({ blockId, data }) => {
          if (data) etMap[blockId] = data;
        });

        setLayerData(prev => ({
          ...prev,
          et: { ...prev.et, ...etMap }
        }));
        console.log('✅ Loaded ET data for', Object.keys(etMap).length, 'blocks');
      } catch (error) {
        console.error('Error loading ET data:', error);
      } finally {
        setLoadingLayers(prev => ({ ...prev, et: false }));
      }
    }

    loadETData();
  }, [activeLayers.et, activeLayers.waterDeficit, blocksWithCentroids, isLoaded]);

  // Water Deficit layer - calculated from ET and rainfall
  useEffect(() => {
    async function calculateWaterDeficit() {
      if (!activeLayers.waterDeficit || !isLoaded) return;

      const blocksWithData = blocks.filter(b =>
        layerData.et[b.id] && rainfallData[b.id]
      );

      if (blocksWithData.length === 0) return;

      setLoadingLayers(prev => ({ ...prev, waterDeficit: true }));

      try {
        const deficitMap = {};

        blocksWithData.forEach(block => {
          const etcMm = layerData.et[block.id].summary.totalETc || 0;
          const rainfallMm = rainfallData[block.id].totalMm || 0;
          const deficitMm = etcMm - rainfallMm; // Positive = deficit, Negative = surplus

          deficitMap[block.id] = {
            deficitMm,
            etcMm,
            rainfallMm
          };
        });

        setLayerData(prev => ({
          ...prev,
          waterDeficit: { ...prev.waterDeficit, ...deficitMap }
        }));
        console.log('✅ Calculated water deficit for', Object.keys(deficitMap).length, 'blocks');
      } catch (error) {
        console.error('Error calculating water deficit:', error);
      } finally {
        setLoadingLayers(prev => ({ ...prev, waterDeficit: false }));
      }
    }

    calculateWaterDeficit();
  }, [activeLayers.waterDeficit, layerData.et, rainfallData, blocks, isLoaded]);

  // Toggle layer function - Only one layer can be active at a time
  const toggleLayer = (layerName) => {
    // Turn off all layers first
    const allOff = {
      ndvi: false,
      et: false,
      waterDeficit: false,
      topography: false,
      floodZones: false,
      rainfall: false
    };

    // If the layer is already on, turn it off. Otherwise, turn it on (and all others off)
    const isCurrentlyOn = activeLayers[layerName];

    if (isCurrentlyOn) {
      // Turn off the layer
      setActiveLayers(allOff);
      setShowRainfallOverlay(false);
    } else {
      // Turn on only this layer
      setActiveLayers({
        ...allOff,
        [layerName]: true
      });

      // Sync rainfall overlay with rainfall layer
      setShowRainfallOverlay(layerName === 'rainfall');
    }
  };

  const handleMapClick = (e) => {
    if (!drawingMode) return;

    // When editing existing field, don't add points on click - only drag existing vertices
    if (isEditingExisting) return;

    // IMPORTANT: Once polygon is closed, left-click should NOT add vertices
    // In edit mode, only right-click on edges can add vertices
    if (polygonClosed) return;

    const newPoint = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };

    // Check if clicked near first point to close polygon (within 50 feet)
    if (tempPath.length >= 3) {
      const firstPoint = tempPath[0];
      const distance = calculateDistance(newPoint, firstPoint);

      if (distance < 50) {
        if (isDrawingModal) {
          // In drawing modal, mark as closed (transitions to CLOSED state)
          // User can then click Edit to enter EDITING state, or Save to confirm
          setPolygonClosed(true);
          setHoverNearFirstPoint(false); // Reset hover state
          return;
        } else {
          // On normal map, save immediately
          handleSavePolygon(tempPath);
          return;
        }
      }
    }

    // Only add new points while actively drawing (polygon not closed)
    const newPath = [...tempPath, newPoint];
    setTempPath(newPath);
  };

  // Handle mouse move to detect proximity to first point (for visual feedback)
  const handleMapMouseMove = (e) => {
    // Only check when in drawing mode, have 3+ points, and polygon not yet closed
    if (!drawingMode || tempPath.length < 3 || polygonClosed || isEditingExisting) {
      if (hoverNearFirstPoint) setHoverNearFirstPoint(false);
      return;
    }

    const mousePoint = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };

    const firstPoint = tempPath[0];
    const distance = calculateDistance(mousePoint, firstPoint);

    // Within 50 feet of first point = show "click to close" feedback
    const isNear = distance < 50;
    if (isNear !== hoverNearFirstPoint) {
      setHoverNearFirstPoint(isNear);
    }
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
        setIsEditingExisting(false);
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
    setIsEditingExisting(false);
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
    setIsEditingExisting(false);
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
      setIsEditingExisting(true); // Mark that we're editing, not drawing new

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
    // In drawing modal, only allow right-click when polygon is closed AND edit mode is enabled
    if (isDrawingModal && (!polygonClosed || !editModeEnabled)) return;

    e.stop(); // Prevent default map context menu

    const clickPosition = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };

    // Use proper point-to-segment distance to find if click is on an edge
    // Tolerance of 50 feet - generous tolerance to make it easier to click on edges
    const hitEdge = findHitEdge(clickPosition, tempPath, 50);

    if (!hitEdge) {
      // Click was not on an edge - do nothing
      // Could show a toast here: "Right-click on an edge to add a point"
      return;
    }

    setContextMenu({
      x: e.domEvent.clientX,
      y: e.domEvent.clientY,
      type: 'edge',
      edgeIndex: hitEdge.segmentIndex,
      // Use the projected point so the new vertex lands exactly on the edge
      projectedPoint: hitEdge.projectedPoint
    });
  };

  const handleAddPointOnEdge = () => {
    if (!contextMenu || contextMenu.type !== 'edge') return;

    const newPath = [...tempPath];
    // Insert the new point after the edge index, using the projected point on the edge
    newPath.splice(contextMenu.edgeIndex + 1, 0, contextMenu.projectedPoint);
    setTempPath(newPath);
    setContextMenu(null);
  };

  // Handle right-click on a vertex to show delete option
  const handleVertexRightClick = (e, vertexIndex) => {
    // Only allow in edit mode
    if (isDrawingModal && (!polygonClosed || !editModeEnabled)) return;
    if (!isDrawingModal && !drawingMode) return;

    // Prevent default context menu
    if (e.domEvent) {
      e.domEvent.preventDefault();
      e.domEvent.stopPropagation();
    }

    // Can't delete if it would leave less than 3 vertices (minimum for polygon)
    if (tempPath.length <= 3) return;

    setContextMenu({
      x: e.domEvent?.clientX || e.clientX,
      y: e.domEvent?.clientY || e.clientY,
      type: 'vertex',
      vertexIndex
    });
  };

  const handleDeleteVertex = () => {
    if (!contextMenu || contextMenu.type !== 'vertex') return;

    // Don't allow deletion if it would leave less than 3 vertices
    if (tempPath.length <= 3) {
      setContextMenu(null);
      return;
    }

    const newPath = [...tempPath];
    newPath.splice(contextMenu.vertexIndex, 1);
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

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

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

  // Helper function to create NDVI heat map canvas for a block
  const createNDVICanvas = (block) => {
    // Determine which data source to use based on compare mode
    let ndviBlockData;
    let isDelta = false;
    let customRaster = null;

    if (ndviCompareEnabled) {
      if (ndviViewMode === 'baseline') {
        ndviBlockData = ndviBaselineData[block.id];
      } else if (ndviViewMode === 'current') {
        ndviBlockData = ndviCurrentData[block.id] || layerData.ndvi[block.id];
      } else if (ndviViewMode === 'delta') {
        ndviBlockData = ndviCurrentData[block.id] || layerData.ndvi[block.id];
        customRaster = ndviDeltaRasters[block.id];
        isDelta = true;
      }
    } else {
      ndviBlockData = layerData.ndvi[block.id];
    }

    console.log(`🎨 createNDVICanvas for ${block.name}:`, {
      hasData: !!ndviBlockData,
      hasRasterData: !!ndviBlockData?.rasterData,
      meanNDVI: ndviBlockData?.meanNDVI?.toFixed(3),
      acquisitionDate: ndviBlockData?.acquisitionDate,
      isDelta,
      hasCustomRaster: !!customRaster,
      ndviTimelineEnabled
    });

    if (!ndviBlockData || (!ndviBlockData.rasterData && !customRaster)) {
      console.log(`No NDVI raster data for ${block.name}`);
      return null;
    }

    const rasterData = customRaster || ndviBlockData.rasterData;
    const { width, height, bbox } = ndviBlockData;
    const fieldCoords = block.geom.coordinates[0];

    // Point-in-polygon test
    const isPointInPolygon = (lat, lng) => {
      let inside = false;
      for (let i = 0, j = fieldCoords.length - 1; i < fieldCoords.length; j = i++) {
        const xi = fieldCoords[i][0], yi = fieldCoords[i][1];
        const xj = fieldCoords[j][0], yj = fieldCoords[j][1];
        const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    // Color mapping for delta values (diverging scale: red-white-green)
    const getColorForDelta = (delta) => {
      if (!isFinite(delta) || isNaN(delta)) return { r: 0, g: 0, b: 0, a: 0 };
      delta = Math.max(-0.5, Math.min(0.5, delta));
      if (delta < 0) {
        const t = Math.abs(delta) / 0.5;
        return { r: 255, g: Math.round(255 * (1 - t)), b: Math.round(255 * (1 - t)), a: 180 };
      } else if (delta > 0) {
        const t = delta / 0.5;
        return { r: Math.round(255 * (1 - t)), g: 255, b: Math.round(255 * (1 - t)), a: 180 };
      } else {
        return { r: 255, g: 255, b: 255, a: 180 };
      }
    };

    // Color mapping for NDVI
    const getColorForNDVI = (ndvi) => {
      if (!isFinite(ndvi) || isNaN(ndvi)) return { r: 0, g: 0, b: 0, a: 0 };
      ndvi = Math.max(-1, Math.min(1, ndvi));

      if (ndvi < 0) {
        const intensity = (ndvi + 1) * 128;
        return { r: intensity, g: 0, b: 0, a: 180 };
      } else if (ndvi < 0.3) {
        const t = ndvi / 0.3;
        return { r: 139 + (255 - 139) * t, g: 0, b: 0, a: 180 };
      } else if (ndvi < 0.5) {
        const t = (ndvi - 0.3) / 0.2;
        return { r: 255, g: 165 * t, b: 0, a: 180 };
      } else if (ndvi < 0.7) {
        const t = (ndvi - 0.5) / 0.2;
        return { r: 255, g: 165 + (255 - 165) * t, b: 0, a: 180 };
      } else if (ndvi < 0.85) {
        const t = (ndvi - 0.7) / 0.15;
        return { r: 255 - 128 * t, g: 255, b: 50 * t, a: 180 };
      } else {
        const t = (ndvi - 0.85) / 0.15;
        return { r: 127 - 93 * t, g: 255, b: 50, a: 180 };
      }
    };

    const getColor = isDelta ? getColorForDelta : getColorForNDVI;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const lng = bbox[0] + (x / width) * (bbox[2] - bbox[0]);
        const lat = bbox[3] - (y / height) * (bbox[3] - bbox[1]);
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
    return { dataUrl: canvas.toDataURL('image/png'), bbox };
  };

  // Helper function to create ET heat map for a block
  const createETCanvas = (block) => {
    const etBlockData = layerData.et[block.id];
    if (!etBlockData || !etBlockData.summary) return null;

    const avgET = etBlockData.summary.avgET;
    if (!block.geom || !block.geom.coordinates) return null;

    // For ET, we'll color the entire polygon based on average ET value
    // ET range for grapes: 0-10 mm/day
    const getColorForET = (et) => {
      const normalized = Math.max(0, Math.min(1, et / 10));
      if (normalized < 0.2) {
        // Very low: light blue
        return `rgba(191, 219, 254, 0.7)`;
      } else if (normalized < 0.4) {
        // Low: blue
        return `rgba(96, 165, 250, 0.7)`;
      } else if (normalized < 0.6) {
        // Medium: yellow
        return `rgba(253, 224, 71, 0.7)`;
      } else if (normalized < 0.8) {
        // High: orange
        return `rgba(251, 146, 60, 0.7)`;
      } else {
        // Very high: red
        return `rgba(239, 68, 68, 0.7)`;
      }
    };

    return { color: getColorForET(avgET), value: avgET };
  };

  // Helper function to create Water Deficit heat map for a block
  const createWaterDeficitCanvas = (block) => {
    const deficitBlockData = layerData.waterDeficit[block.id];
    if (!deficitBlockData) return null;

    const deficitMm = deficitBlockData.deficitMm;
    if (!block.geom || !block.geom.coordinates) return null;

    // Water deficit color scale
    const getColorForDeficit = (deficit) => {
      if (deficit < -20) {
        // Large surplus: dark blue (over-irrigated)
        return `rgba(30, 58, 138, 0.7)`;
      } else if (deficit < -10) {
        // Moderate surplus: blue
        return `rgba(59, 130, 246, 0.7)`;
      } else if (deficit < 0) {
        // Small surplus: light blue
        return `rgba(147, 197, 253, 0.7)`;
      } else if (deficit < 10) {
        // Small deficit: light yellow (good)
        return `rgba(254, 240, 138, 0.7)`;
      } else if (deficit < 20) {
        // Moderate deficit: yellow
        return `rgba(251, 191, 36, 0.7)`;
      } else if (deficit < 30) {
        // High deficit: orange
        return `rgba(249, 115, 22, 0.7)`;
      } else {
        // Critical deficit: red
        return `rgba(220, 38, 38, 0.7)`;
      }
    };

    return { color: getColorForDeficit(deficitMm), value: deficitMm };
  };

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
    <>
      {/* Capturing Progress Overlay - OUTSIDE mapContainerRef so it won't be captured */}
      {isCapturing && (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Capturing Maps...</h3>
            <p className="text-sm text-gray-600 mb-4">{captureProgress.message}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(captureProgress.current / captureProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {captureProgress.current} of {captureProgress.total} views captured
            </p>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full w-full'}`}>
        {/* Simplified Toolbar */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-300 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        {/* Primary Action - Drawing */}
        {!drawingMode && (() => {
          // Show "Draw Field" if no field selected, OR if selected field has no geometry
          const selectedBlock = selectedBlockId ? blocks.find(b => b.id === selectedBlockId) : null;
          return !selectedBlockId || (selectedBlock && !selectedBlock.geom);
        })() && (
          <button
            onClick={handleStartDrawing}
            className="px-2 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all hover:shadow-md"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">{selectedBlockId ? 'Draw Boundary' : 'Draw Field'}</span>
            <span className="sm:hidden">Draw</span>
          </button>
        )}
        {drawingMode && !isDrawingModal && (
          <>
            <button
              onClick={() => handleSavePolygon(tempPath)}
              disabled={tempPath.length < 3}
              className="px-2 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save Changes</span>
              <span className="sm:hidden">Save</span>
            </button>
            <button
              onClick={handleCancelDrawing}
              className="px-2 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 text-sm font-semibold bg-gray-600 text-white hover:bg-gray-700 shadow-sm transition-all"
            >
              <span className="hidden sm:inline">Cancel</span>
              <X className="w-4 h-4 sm:hidden" />
            </button>
          </>
        )}

        {/* Address Search */}
        {(!drawingMode || showAddressSearch) && (
          <div data-print-hide="true" className={`relative flex-1 min-w-0 ${showAddressSearch ? 'max-w-lg' : 'max-w-[120px] sm:max-w-md'}`}>
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                componentRestrictions: { country: 'us' },
                fields: ['geometry', 'formatted_address', 'name']
              }}
            >
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={showAddressSearch ? "Enter vineyard address to navigate..." : "Search..."}
                  className="pl-8 sm:pl-10 pr-2 sm:pr-4 py-2 w-full border-gray-300 rounded-lg shadow-sm text-sm"
                />
              </div>
            </Autocomplete>
          </div>
        )}

        {/* Map View Dropdown */}
        <DropdownMenu
          trigger={
            <DropdownMenuTrigger className="px-2 sm:px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 shadow-sm">
              {basemap === 'satellite' ? (
                <>
                  <Satellite className="w-4 h-4" />
                  <span className="hidden sm:inline">Satellite</span>
                </>
              ) : (
                <>
                  <MapIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Streets</span>
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
                <DropdownMenuTrigger className="px-2 sm:px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 shadow-sm">
                  <MoreVertical className="w-4 h-4" />
                  <span className="hidden sm:inline">Actions</span>
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
              <DropdownMenuTrigger className={`px-2 sm:px-4 py-2 rounded-lg border shadow-sm ${
                showRows
                  ? 'bg-yellow-100 border-yellow-300 text-yellow-900 hover:bg-yellow-200'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}>
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">{showRows ? 'Rows On' : 'Rows Off'}</span>
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

        {/* Visualization Layers Dropdown */}
        {blocks.some(b => b.geom || (b.lat && b.lng)) && (
          <DropdownMenu
            trigger={
              <DropdownMenuTrigger className={`px-2 sm:px-4 py-2 rounded-lg border shadow-sm transition-colors ${
                Object.values(activeLayers).some(v => v)
                  ? 'bg-purple-100 border-purple-300 text-purple-900 hover:bg-purple-200'
                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}>
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Layers</span>
                {Object.values(activeLayers).filter(v => v).length > 0 && (
                  <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                    {Object.values(activeLayers).filter(v => v).length}
                  </span>
                )}
              </DropdownMenuTrigger>
            }
          >
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                Visualization Layers
              </div>

              {/* NDVI Layer */}
              <button
                onClick={() => toggleLayer('ndvi')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  activeLayers.ndvi ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Activity className={`w-4 h-4 ${activeLayers.ndvi ? 'text-green-600' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <div className={`font-medium ${activeLayers.ndvi ? 'text-green-900' : 'text-gray-700'}`}>
                      NDVI
                    </div>
                    <div className="text-xs text-gray-500">Vegetation vigor</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {loadingLayers.ndvi && (
                    <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <input
                    type="checkbox"
                    checked={activeLayers.ndvi}
                    onChange={() => {}}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                </div>
              </button>

              {/* ET Layer */}
              <button
                onClick={() => toggleLayer('et')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  activeLayers.et ? 'bg-orange-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sun className={`w-4 h-4 ${activeLayers.et ? 'text-orange-600' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <div className={`font-medium ${activeLayers.et ? 'text-orange-900' : 'text-gray-700'}`}>
                      ET (Evapotranspiration)
                    </div>
                    <div className="text-xs text-gray-500">Crop water use</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {loadingLayers.et && (
                    <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <input
                    type="checkbox"
                    checked={activeLayers.et}
                    onChange={() => {}}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                </div>
              </button>

              {/* Water Deficit Layer */}
              <button
                onClick={() => toggleLayer('waterDeficit')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  activeLayers.waterDeficit ? 'bg-red-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Droplet className={`w-4 h-4 ${activeLayers.waterDeficit ? 'text-red-600' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <div className={`font-medium ${activeLayers.waterDeficit ? 'text-red-900' : 'text-gray-700'}`}>
                      Water Deficit
                    </div>
                    <div className="text-xs text-gray-500">Irrigation needs</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {loadingLayers.waterDeficit && (
                    <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <input
                    type="checkbox"
                    checked={activeLayers.waterDeficit}
                    onChange={() => {}}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                </div>
              </button>

              {/* Rainfall Layer */}
              <button
                onClick={() => toggleLayer('rainfall')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  activeLayers.rainfall ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <CloudRain className={`w-4 h-4 ${activeLayers.rainfall ? 'text-blue-600' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <div className={`font-medium ${activeLayers.rainfall ? 'text-blue-900' : 'text-gray-700'}`}>
                      Rainfall
                    </div>
                    <div className="text-xs text-gray-500">Precipitation data</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {loadingRainfall && (
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <input
                    type="checkbox"
                    checked={activeLayers.rainfall}
                    onChange={() => {}}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              </button>

              <DropdownMenuSeparator />

              {/* Topography Layer */}
              <button
                onClick={() => toggleLayer('topography')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  activeLayers.topography ? 'bg-amber-50' : ''
                }`}
                disabled
                title="Coming soon"
              >
                <div className="flex items-center gap-3">
                  <Mountain className={`w-4 h-4 text-gray-400`} />
                  <div className="text-left">
                    <div className="font-medium text-gray-400">
                      Topography
                    </div>
                    <div className="text-xs text-gray-400">Elevation/terrain (Coming soon)</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={activeLayers.topography}
                  onChange={() => {}}
                  disabled
                  className="w-4 h-4 text-gray-400 rounded cursor-not-allowed"
                />
              </button>

              {/* Flood Zones Layer */}
              <button
                onClick={() => toggleLayer('floodZones')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  activeLayers.floodZones ? 'bg-yellow-50' : ''
                }`}
                disabled
                title="Coming soon"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-4 h-4 text-gray-400`} />
                  <div className="text-left">
                    <div className="font-medium text-gray-400">
                      Flood Zones
                    </div>
                    <div className="text-xs text-gray-400">FEMA flood maps (Coming soon)</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={activeLayers.floodZones}
                  onChange={() => {}}
                  disabled
                  className="w-4 h-4 text-gray-400 rounded cursor-not-allowed"
                />
              </button>
            </div>
          </DropdownMenu>
        )}

        {/* Rainfall Overlay Toggle - Removed, now part of Layers dropdown */}

        {/* Stats - Right aligned */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <span>{blocks.filter(b => b.geom).length}</span>
            <span className="hidden sm:inline">Fields</span>
            <span className="text-gray-400">•</span>
            <span>{totalAcres.toFixed(1)}<span className="hidden sm:inline"> acres</span><span className="sm:hidden">ac</span></span>
          </div>

          {/* Field List Toggle */}
          {!drawingMode && blocks.filter(b => b.geom && b.geom.coordinates).length > 0 && (
            <button
              onClick={() => setShowBlocksList(!showBlocksList)}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 shadow-sm transition-all"
            >
              {showBlocksList ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              <span className="hidden sm:inline">{showBlocksList ? 'Hide' : 'Show'} List</span>
            </button>
          )}

          {/* Print/PDF Button */}
          {!drawingMode && blocks.filter(b => b.geom && b.geom.coordinates).length > 0 && (
            <button
              onClick={() => {
                // Initialize print config with all fields selected
                const fieldsWithGeom = blocks.filter(b => b.geom && b.geom.coordinates);
                const selectedFields = {};
                const selectedLayers = {};
                fieldsWithGeom.forEach(b => {
                  selectedFields[b.id] = true;
                  selectedLayers[b.id] = { base: true, ndvi: false, et: false, rainfall: false };
                });
                setPrintConfig({ selectedFields, selectedLayers });
                setShowPrintModal(true);
              }}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative flex-1">
        {/* Fullscreen Toggle Button */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-3 right-3 z-30 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg p-2 shadow-md transition-all"
          title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5 text-gray-700" /> : <Maximize2 className="w-5 h-5 text-gray-700" />}
        </button>

        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={displayCenter}
          zoom={mapZoom}
          options={mapOptions}
          onClick={handleMapClick}
          onMouseMove={handleMapMouseMove}
          onLoad={(map) => { mapRef.current = map; }}
        >
          {/* Drawing Manager for creating new polygons - disabled when editing existing or in drawing modal */}
          {drawingMode && !isEditingExisting && !isDrawingModal && (
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

          // Hide this block's polygon if we're currently editing it
          if (drawingMode && block.id === selectedBlockId && tempPath.length > 0) {
            return null;
          }

          // IMPORTANT: When capturing for print, HIDE all other fields
          // Only show the field being captured
          if (captureBlockId && block.id !== captureBlockId) {
            return null; // Don't render other fields during capture
          }

          const path = geojsonToPath(block.geom);
          if (path.length < 3) return null;

          const isSelected = block.id === selectedBlockId;
          const isBeingCaptured = block.id === captureBlockId;
          const rainfall = rainfallData[block.id];

          // Color-code by rainfall amount when rainfall overlay is enabled
          let fillColor = isSelected ? '#3b82f6' : '#8b5cf6';
          let strokeColor = isSelected ? '#2563eb' : '#7c3aed';
          let fillOpacity = isSelected ? 0.4 : 0.3;
          let strokeWeight = isSelected ? 3 : 2;

          // When capturing for print, use transparent fill with visible border
          // BUT keep fill visible if we're showing ET layer (ET uses polygon fill for visualization)
          if (isBeingCaptured) {
            if (activeLayers.et) {
              // Keep the ET fill visible - don't make it transparent
              fillOpacity = 0.6;
            } else {
              fillOpacity = 0.05; // Nearly transparent so satellite/NDVI overlays show through
            }
            strokeColor = '#3b82f6'; // Blue border
            strokeWeight = 4; // Thicker border for visibility
          }
          // When raster-based layers are active, make polygons transparent so overlays show through
          else if (activeLayers.ndvi || activeLayers.et || activeLayers.waterDeficit) {
            fillOpacity = 0.05; // Nearly transparent
            strokeColor = isSelected ? '#7c3aed' : '#8b5cf6';
          } else if (showRainfallOverlay && rainfall && rainfall.dataSource !== 'error') {
            const totalInches = rainfall.totalInches || 0;
            fillOpacity = 0.5;
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
                fillOpacity,
                strokeColor,
                strokeOpacity: 0.9,
                strokeWeight,
                clickable: true,
                zIndex: 1
              }}
              onClick={() => handleBlockClick(block.id)}
            />
          );
        })}

        {/* Render NDVI layer overlays */}
        {activeLayers.ndvi && blocks.map(block => {
          if (!block.geom) {
            console.log(`Block ${block.name} has no geometry`);
            return null;
          }

          // When capturing for print, only render overlay for the captured block
          if (captureBlockId && block.id !== captureBlockId) {
            return null;
          }

          // Check if we have NDVI data for this block
          const blockNdviData = layerData.ndvi[block.id];

          // In timeline mode, skip rendering if we're loading new data
          if (ndviTimelineEnabled && timelineLoading) {
            console.log(`⏳ Timeline loading, skipping overlay for ${block.name}`);
            return null;
          }

          const ndviCanvas = createNDVICanvas(block);
          if (!ndviCanvas) {
            console.log(`❌ No NDVI canvas created for block ${block.name}`);
            return null;
          }

          const { dataUrl, bbox } = ndviCanvas;

          // Create proper Google Maps LatLngBounds
          if (!window.google || !window.google.maps) {
            console.log('❌ Google Maps not loaded');
            return null;
          }

          const bounds = new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(bbox[1], bbox[0]), // SW corner
            new window.google.maps.LatLng(bbox[3], bbox[2])  // NE corner
          );

          // Use both acquisition date and mean NDVI in key to ensure overlay updates when data changes
          const dataAcquisitionDate = blockNdviData?.acquisitionDate || 'none';
          const dataMean = blockNdviData?.meanNDVI?.toFixed(4) || '0';
          console.log(`✅ Rendering NDVI overlay for ${block.name}`, {
            acquisitionDate: dataAcquisitionDate,
            meanNDVI: dataMean,
            dateRange: blockNdviData?.dateRange,
            ndviTimelineEnabled,
            selectedDateIndex: ndviSelectedDateIndex
          });

          // Include actual data signature in key to force re-render when data changes
          const overlayKey = ndviCompareEnabled
            ? `ndvi-${block.id}-${ndviViewMode}-${Object.keys(ndviDeltaRasters).length}`
            : ndviTimelineEnabled
              ? `ndvi-${block.id}-timeline-${ndviSelectedDateIndex}-${dataMean}`
              : `ndvi-${block.id}-default-${dataMean}`;

          return (
            <GroundOverlay
              key={overlayKey}
              url={dataUrl}
              bounds={bounds}
              opacity={0.85}
              options={{
                zIndex: 10
              }}
            />
          );
        })}

        {/* Render ET layer overlays */}
        {activeLayers.et && blocks.map(block => {
          if (!block.geom) return null;

          // When capturing for print, only render overlay for the captured block
          if (captureBlockId && block.id !== captureBlockId) {
            return null;
          }

          const etOverlay = createETCanvas(block);
          if (!etOverlay) return null;

          const path = geojsonToPath(block.geom);
          const isSelected = block.id === selectedBlockId;
          const isBeingCaptured = block.id === captureBlockId;

          return (
            <Polygon
              key={`et-${block.id}`}
              paths={path}
              options={{
                fillColor: etOverlay.color,
                fillOpacity: isBeingCaptured ? 0.7 : 0.6, // Slightly more visible during capture
                strokeColor: isBeingCaptured ? '#3b82f6' : (isSelected ? '#f59e0b' : '#6b7280'),
                strokeOpacity: 0.9,
                strokeWeight: isBeingCaptured ? 4 : (isSelected ? 3 : 2),
                clickable: true,
                zIndex: 5
              }}
              onClick={() => handleBlockClick(block.id)}
            />
          );
        })}

        {/* Render Water Deficit layer overlays */}
        {activeLayers.waterDeficit && blocks.map(block => {
          if (!block.geom) return null;
          const deficitOverlay = createWaterDeficitCanvas(block);
          if (!deficitOverlay) return null;

          const path = geojsonToPath(block.geom);
          const isSelected = block.id === selectedBlockId;

          return (
            <Polygon
              key={`deficit-${block.id}`}
              paths={path}
              options={{
                fillColor: deficitOverlay.color,
                fillOpacity: 0.6,
                strokeColor: isSelected ? '#f59e0b' : '#6b7280',
                strokeOpacity: 0.8,
                strokeWeight: isSelected ? 3 : 2,
                clickable: true,
                zIndex: 6
              }}
              onClick={() => handleBlockClick(block.id)}
            />
          );
        })}

        {/* Render rainfall badges on fields */}
        {activeLayers.rainfall && blocksWithCentroids.map(block => {
          if (!block.geom) return null;

          const rainfall = rainfallData[block.id];
          if (!rainfall || rainfall.dataSource === 'error') return null;

          const path = geojsonToPath(block.geom);
          if (path.length === 0) return null;

          // Use computed centroid for badge placement
          const center = {
            lat: block.lat || path.reduce((sum, p) => sum + p.lat, 0) / path.length,
            lng: block.lng || path.reduce((sum, p) => sum + p.lng, 0) / path.length
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
                    <div className="text-xs text-gray-600">
                      Last {rainfallWeeks === 1 ? '7 days' : `${rainfallWeeks} weeks`}
                    </div>
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
                {/* Last Rain Event */}
                <div className="mt-1 pt-1 border-t border-gray-200">
                  {rainfall.lastRainEvent?.date ? (() => {
                    const lastDate = new Date(rainfall.lastRainEvent.date);
                    const daysAgo = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                    const amountInches = (rainfall.lastRainEvent.amount || 0) / 25.4;
                    return (
                      <div className="text-xs">
                        <div className="text-gray-500">Last rain:</div>
                        <div className="font-medium text-gray-700">
                          {lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          <span className="text-gray-400 font-normal ml-1">
                            ({daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`})
                          </span>
                        </div>
                        {amountInches > 0.01 && (
                          <div className="text-gray-500">{amountInches.toFixed(2)}" recorded</div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="text-xs text-gray-400 italic">No rain recorded</div>
                  )}
                </div>
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
            {/*
              Drawing state visualization:
              - DRAWING (not closed): Show open polyline connecting points (no fill, no closing line)
              - CLOSED: Show filled polygon with all edges including closing line
            */}

            {/* Show filled polygon ONLY when polygon is closed (user clicked near first point) */}
            {tempPath.length >= 3 && (!isDrawingModal || polygonClosed) && (
              <Polygon
                paths={tempPath}
                options={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.2,
                  strokeColor: '#3b82f6',
                  strokeOpacity: 0.9,
                  strokeWeight: 3,
                  // Must be clickable to receive right-click events for adding nodes on edges
                  clickable: true,
                  editable: false,
                  draggable: false,
                  zIndex: 10
                }}
                onRightClick={handlePolygonRightClick}
              />
            )}

            {/* Show open polyline while drawing (before polygon is closed) - no fill, no closing line */}
            {tempPath.length >= 1 && isDrawingModal && !polygonClosed && (
              <Polyline
                path={tempPath}
                options={{
                  strokeColor: '#3b82f6',
                  strokeOpacity: 0.9,
                  strokeWeight: 3,
                  clickable: false,
                }}
              />
            )}

            {/* Show polyline for < 3 points on normal map */}
            {tempPath.length >= 1 && tempPath.length < 3 && !isDrawingModal && (
              <Polyline
                path={tempPath}
                options={{
                  strokeColor: '#3b82f6',
                  strokeOpacity: 0.9,
                  strokeWeight: 3,
                  clickable: false,
                }}
                onRightClick={handlePolygonRightClick}
              />
            )}

            {/* Vertex markers - only draggable when polygon is closed (in drawing modal) or in edit mode */}
            {tempPath.map((point, index) => {
              // In drawing modal: only allow dragging after polygon is closed AND edit mode is enabled
              // On normal map: always allow dragging
              const canDrag = isDrawingModal ? (polygonClosed && editModeEnabled) : true;

              // First point gets special styling and click-to-close when:
              // 1. We have 3+ points (minimum for closing)
              // 2. Polygon not yet closed
              // 3. We're in drawing modal
              const isFirstPoint = index === 0;
              const canClickToClose = isFirstPoint && tempPath.length >= 3 && !polygonClosed && isDrawingModal;
              const showCloseIndicator = canClickToClose && hoverNearFirstPoint;

              // Can right-click to delete when in edit mode and have more than 3 vertices
              const canRightClickDelete = (isDrawingModal ? (polygonClosed && editModeEnabled) : drawingMode) && tempPath.length > 3;

              return (
                <Marker
                  key={`vertex-${index}`}
                  position={point}
                  draggable={canDrag}
                  onDrag={canDrag ? (e) => handleVertexDrag(index, e.latLng) : undefined}
                  onClick={canClickToClose ? () => {
                    // Close the polygon when clicking on the first point
                    setPolygonClosed(true);
                    setHoverNearFirstPoint(false);
                  } : undefined}
                  onRightClick={canRightClickDelete ? (e) => handleVertexRightClick(e, index) : undefined}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: showCloseIndicator ? 14 : (canClickToClose ? 10 : 8), // Larger when can close, even larger when hovering
                    fillColor: showCloseIndicator ? '#f59e0b' : (canClickToClose ? '#f59e0b' : '#3b82f6'), // Blue for vertices, amber when can close
                    fillOpacity: showCloseIndicator ? 1 : (canClickToClose ? 0.7 : 1),
                    strokeColor: '#fff',
                    strokeWeight: showCloseIndicator ? 3 : 2.5,
                  }}
                  options={{
                    cursor: canDrag ? 'move' : (canClickToClose ? 'pointer' : 'default'),
                    zIndex: canClickToClose ? 1000 : 100 // Bring first point to front when it can close
                  }}
                  title={canClickToClose ? 'Click to close polygon' : (canRightClickDelete ? 'Right-click to delete' : undefined)}
                />
              );
            })}

            {/* Midpoint markers for adding new vertices - only show when polygon is closed and in edit mode (drawing modal) or on normal map */}
            {tempPath.length >= 3 && (!isDrawingModal || (polygonClosed && editModeEnabled)) && tempPath.map((point, index) => {
              const nextIndex = (index + 1) % tempPath.length;
              const nextPoint = tempPath[nextIndex];
              const midpoint = {
                lat: (point.lat + nextPoint.lat) / 2,
                lng: (point.lng + nextPoint.lng) / 2
              };

              return (
                <Marker
                  key={`midpoint-${index}`}
                  position={midpoint}
                  onClick={() => {
                    const newPath = [...tempPath];
                    newPath.splice(nextIndex, 0, midpoint);
                    setTempPath(newPath);
                  }}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 5,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.5,
                    strokeColor: '#fff',
                    strokeWeight: 1.5,
                  }}
                  options={{
                    cursor: 'pointer'
                  }}
                />
              );
            })}
          </>
        )}
        </GoogleMap>

        {/* Context Menu for Adding/Deleting Points */}
        {contextMenu && (
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-300 py-1 min-w-[160px]"
            style={{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'edge' ? (
              <button
                onClick={handleAddPointOnEdge}
                className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 hover:text-blue-700 flex items-center gap-2 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Add Point Here
              </button>
            ) : contextMenu.type === 'vertex' ? (
              <button
                onClick={handleDeleteVertex}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-gray-700 hover:text-red-700 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Point
              </button>
            ) : null}
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
                  {isEditingExisting ? (
                    <>
                      <p className="text-xs font-semibold text-blue-900 mb-2 pb-2 border-b border-blue-200">
                        Editing boundary: {selectedBlock?.name}
                      </p>
                      <p className="font-medium text-blue-900 mb-1">
                        Drag points to adjust boundary
                      </p>
                      <p className="text-sm text-blue-700 mb-2">
                        Click Save Changes when done
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        💡 Drag the green circles to move vertices
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Click the semi-transparent circles to add new points
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Right-click on the line to add a point anywhere
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        Points: {tempPath.length}
                      </p>
                    </>
                  ) : (
                    <>
                      {isUpdating && (
                        <p className="text-xs font-semibold text-blue-900 mb-2 pb-2 border-b border-blue-200">
                          Adding map to: {selectedBlock.name}
                        </p>
                      )}
                      <p className="font-medium text-blue-900 mb-1">
                        {isDrawingModal ? (
                          polygonClosed
                            ? (editModeEnabled ? 'Adjust boundary' : 'Boundary complete')
                            : 'Click to add points'
                        ) : (
                          tempPath.length === 0 ? 'Click to start drawing' : 'Click to add points'
                        )}
                      </p>
                      <p className="text-sm text-blue-700">
                        {isDrawingModal ? (
                          polygonClosed
                            ? (editModeEnabled ? 'Drag points to adjust, right-click edge to add point' : 'Click Edit to adjust, or Save to confirm')
                            : hoverNearFirstPoint
                              ? '🎯 Click now to close the boundary!'
                              : 'Click near start point to close'
                        ) : (
                          tempPath.length < 3
                            ? `Need ${3 - tempPath.length} more point${3 - tempPath.length !== 1 ? 's' : ''} to complete`
                            : 'Drag points to adjust or click Save Changes'
                        )}
                      </p>
                      {/* Show edit hints only when polygon is closed AND edit mode is enabled (drawing modal) or on normal map */}
                      {tempPath.length > 0 && (!isDrawingModal || (polygonClosed && editModeEnabled)) && (
                        <>
                          <p className="text-xs text-blue-600 mt-2">
                            💡 Drag the green circles to move vertices
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            💡 Click the semi-transparent circles to add new points
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            💡 Right-click on the line to add a point anywhere
                          </p>
                        </>
                      )}
                      <p className="text-xs text-blue-600 mt-2">
                        Points: {tempPath.length}
                      </p>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* NDVI Legend */}
        {!drawingMode && activeLayers.ndvi && (
          <div data-print-hide="true" className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-20 bg-white rounded-lg sm:rounded-xl shadow-2xl border-2 border-green-300 p-2 sm:p-4 w-[200px] sm:w-[320px]">
            {/* Header with Compare and Export buttons */}
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
              <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                  <span className="sm:hidden">NDVI</span>
                  <span className="hidden sm:inline">
                  {ndviCompareEnabled && ndviViewMode === 'delta'
                    ? 'NDVI Change (Delta)'
                    : ndviTimelineEnabled && ndviAvailableDates[sliderPosition]
                      ? `NDVI - ${ndviAvailableDates[sliderPosition].date}`
                      : (() => {
                          // Show date from loaded data if available
                          const firstBlockWithData = blocks.find(b => layerData.ndvi[b.id]?.dateRange);
                          const dateRange = firstBlockWithData ? layerData.ndvi[firstBlockWithData.id].dateRange : null;
                          if (dateRange) {
                            return `NDVI - ${dateRange.to}`;
                          }
                          return 'NDVI - Vegetation Vigor';
                        })()}
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                {/* Compare toggle */}
                <button
                  onClick={() => {
                    if (!ndviCompareEnabled) {
                      // Use growing season dates for more reliable imagery
                      // Current: recent 60-day window ending now
                      // Baseline: same window last year
                      const now = new Date();
                      const year = now.getFullYear();

                      // Current period: last 60 days
                      setNdviCurrentDate({
                        start: new Date(year, now.getMonth(), now.getDate() - 60),
                        end: now
                      });

                      // Baseline: same period last year (using growing season months for reliability)
                      // Use June-September of last year which typically has good imagery
                      setNdviBaselineDate({
                        start: new Date(year - 1, 5, 1),  // June 1 last year
                        end: new Date(year - 1, 8, 30)   // September 30 last year
                      });
                    }
                    setNdviCompareEnabled(!ndviCompareEnabled);
                    setNdviTimelineEnabled(false); // Disable timeline when compare is active
                    if (ndviCompareEnabled) setNdviViewMode('current');
                  }}
                  className={`p-1 sm:p-1.5 rounded transition-colors ${
                    ndviCompareEnabled ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title="Compare dates"
                >
                  <GitCompare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                {/* Timeline toggle */}
                <button
                  onClick={() => {
                    setNdviTimelineEnabled(!ndviTimelineEnabled);
                    setNdviCompareEnabled(false); // Disable compare when timeline is active
                  }}
                  className={`p-1 sm:p-1.5 rounded transition-colors ${
                    ndviTimelineEnabled ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title="Timeline view"
                >
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                {/* Export dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="p-1 sm:p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                    title="Export NDVI data"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      {sortByName(blocks.filter(b => b.geom)).map(block => {
                        const exportOpts = getExportOptions({
                          block,
                          zones: [],
                          ndviData: ndviCompareEnabled && ndviViewMode !== 'current'
                            ? (ndviViewMode === 'baseline' ? ndviBaselineData[block.id] : ndviCurrentData[block.id])
                            : layerData.ndvi[block.id],
                          mode: ndviCompareEnabled && ndviViewMode === 'delta' ? 'delta' : 'ndvi',
                          deltaRaster: ndviDeltaRasters[block.id],
                          baselineData: ndviBaselineData[block.id],
                          currentData: ndviCurrentData[block.id]
                        });
                        return exportOpts.length > 0 ? (
                          <div key={block.id} className="border-b border-gray-100 last:border-0">
                            <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">{block.name}</div>
                            {exportOpts.map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => { opt.handler(); setShowExportMenu(false); }}
                                className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Compare controls */}
            {ndviCompareEnabled && (
              <div className="mb-3 pb-3 border-b border-gray-200 space-y-2">
                {/* Date pickers */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Baseline</label>
                    <input
                      type="date"
                      value={ndviBaselineDate?.start ? new Date(ndviBaselineDate.start).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const d = new Date(e.target.value);
                        setNdviBaselineDate({ start: d, end: new Date(d.getTime() + 30*24*60*60*1000) });
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Current</label>
                    <input
                      type="date"
                      value={ndviCurrentDate?.start ? new Date(ndviCurrentDate.start).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const d = new Date(e.target.value);
                        setNdviCurrentDate({ start: d, end: new Date(d.getTime() + 30*24*60*60*1000) });
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                </div>
                {/* View mode toggle */}
                <div className="flex gap-1 bg-gray-100 rounded p-0.5">
                  {['baseline', 'current', 'delta'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setNdviViewMode(mode)}
                      disabled={mode === 'delta' && Object.keys(ndviDeltaRasters).length === 0}
                      className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                        ndviViewMode === mode ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                      } ${mode === 'delta' && Object.keys(ndviDeltaRasters).length === 0 ? 'opacity-50' : ''}`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
                {compareLoading && (
                  <div className="flex items-center gap-2 text-xs text-purple-600">
                    <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading comparison...</span>
                  </div>
                )}
              </div>
            )}

            {/* Timeline controls */}
            {ndviTimelineEnabled && (
              <div className="mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-200 space-y-1.5 sm:space-y-2">
                {/* Year selector and scope toggle */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        ndviTimelineCacheRef.current = {}; // Clear cache when changing year
                        setNdviTimelineData({});
                        setNdviTimelineYear(ndviTimelineYear - 1);
                      }}
                      className="p-0.5 sm:p-1 hover:bg-gray-100 rounded"
                      title="Previous year"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                    </button>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[40px] sm:min-w-[50px] text-center">
                      {ndviTimelineYear}
                    </span>
                    <button
                      onClick={() => {
                        ndviTimelineCacheRef.current = {}; // Clear cache when changing year
                        setNdviTimelineData({});
                        setNdviTimelineYear(ndviTimelineYear + 1);
                      }}
                      disabled={ndviTimelineYear >= new Date().getFullYear()}
                      className="p-0.5 sm:p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                      title="Next year"
                    >
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="flex bg-gray-100 rounded p-0.5 text-[10px] sm:text-xs">
                    <button
                      onClick={() => setTimelineScope('selected')}
                      className={`px-1.5 sm:px-2 py-0.5 rounded ${timelineScope === 'selected' ? 'bg-white shadow' : ''}`}
                    >
                      <span className="sm:hidden">Sel</span>
                      <span className="hidden sm:inline">Selected</span>
                    </button>
                    <button
                      onClick={() => setTimelineScope('all')}
                      className={`px-1.5 sm:px-2 py-0.5 rounded ${timelineScope === 'all' ? 'bg-white shadow' : ''}`}
                    >
                      <span className="sm:hidden">All</span>
                      <span className="hidden sm:inline">All Fields</span>
                    </button>
                  </div>
                </div>

                {/* Timeline slider */}
                {ndviAvailableDates.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      <span className="text-xs sm:text-sm font-medium text-gray-900">
                        {ndviAvailableDates[sliderPosition]?.date || 'Select date'}
                      </span>
                      {sliderPosition !== ndviSelectedDateIndex && (
                        <span className="text-[10px] sm:text-xs text-blue-500">(loading...)</span>
                      )}
                    </div>
                    {/* Show actual loaded data info - hidden on mobile */}
                    <div className="hidden sm:block">
                    {timelineScope === 'all' ? (
                      // Show aggregate info for all fields
                      <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                        {(() => {
                          const loadedBlocks = blocks.filter(b => layerData.ndvi[b.id]?.meanNDVI);
                          if (loadedBlocks.length === 0) return 'No data loaded';
                          const avgNDVI = loadedBlocks.reduce((sum, b) => sum + layerData.ndvi[b.id].meanNDVI, 0) / loadedBlocks.length;
                          const dateRange = layerData.ndvi[loadedBlocks[0]?.id]?.dateRange;
                          return (
                            <>
                              {dateRange && <>Range: {dateRange.from} to {dateRange.to} • </>}
                              {loadedBlocks.length} fields • Avg NDVI: {avgNDVI.toFixed(3)}
                            </>
                          );
                        })()}
                      </div>
                    ) : selectedBlockId && layerData.ndvi[selectedBlockId] ? (
                      // Show info for selected field
                      <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                        {layerData.ndvi[selectedBlockId].dateRange ? (
                          <>Range: {layerData.ndvi[selectedBlockId].dateRange.from} to {layerData.ndvi[selectedBlockId].dateRange.to}</>
                        ) : layerData.ndvi[selectedBlockId].acquisitionDate ? (
                          <>Date: {layerData.ndvi[selectedBlockId].acquisitionDate}</>
                        ) : (
                          <>Date: N/A</>
                        )}
                        {' '} • Mean: {layerData.ndvi[selectedBlockId].meanNDVI?.toFixed(3) || 'N/A'}
                      </div>
                    ) : null}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={ndviAvailableDates.length - 1}
                      value={sliderPosition}
                      onChange={(e) => {
                        const newPos = parseInt(e.target.value);
                        setSliderPosition(newPos); // Update visual immediately

                        // Debounce the actual fetch - wait for user to stop sliding
                        if (sliderDebounceRef.current) {
                          clearTimeout(sliderDebounceRef.current);
                        }
                        sliderDebounceRef.current = setTimeout(() => {
                          setNdviSelectedDateIndex(newPos); // This triggers the fetch
                        }, 300); // 300ms debounce
                      }}
                      onMouseUp={(e) => {
                        // Immediately commit on mouse release
                        if (sliderDebounceRef.current) {
                          clearTimeout(sliderDebounceRef.current);
                        }
                        setNdviSelectedDateIndex(parseInt(e.target.value));
                      }}
                      onTouchEnd={(e) => {
                        // Immediately commit on touch release
                        if (sliderDebounceRef.current) {
                          clearTimeout(sliderDebounceRef.current);
                        }
                        setNdviSelectedDateIndex(sliderPosition);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] sm:text-xs text-gray-400">
                      <span>{ndviAvailableDates[0]?.date?.slice(5)}</span>
                      <span className="hidden sm:inline">{ndviAvailableDates.length} images</span>
                      <span>{ndviAvailableDates[ndviAvailableDates.length - 1]?.date?.slice(5)}</span>
                    </div>
                  </div>
                ) : timelineLoading ? (
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-blue-600 py-1 sm:py-2">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  <div className="text-[10px] sm:text-xs text-gray-500 py-1 sm:py-2">
                    {timelineScope === 'selected' && !selectedBlockId
                      ? 'Select a field'
                      : 'No imagery found'}
                  </div>
                )}

                {timelineLoading && ndviAvailableDates.length > 0 && (
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-blue-600">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                )}
              </div>
            )}

            {/* Legend items */}
            <div className="space-y-2">
              {ndviCompareEnabled && ndviViewMode === 'delta' ? (
                // Delta legend
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border border-gray-400" style={{ background: 'linear-gradient(to right, #22c55e, #bbf7d0)' }} />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-green-700">Improvement (+)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border border-gray-400 bg-white" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-600">No Change (0)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border border-gray-400" style={{ background: 'linear-gradient(to right, #fecaca, #ef4444)' }} />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-red-700">Decline (-)</div>
                    </div>
                  </div>
                </>
              ) : (
                // Standard NDVI legend
                [
                  { color: '#22c55e', label: 'Very High', desc: '0.85 - 1.0' },
                  { color: '#7fff32', label: 'High', desc: '0.7 - 0.85' },
                  { color: '#ffff00', label: 'Moderate', desc: '0.5 - 0.7' },
                  { color: '#ffa500', label: 'Low', desc: '0.3 - 0.5' },
                  { color: '#ff0000', label: 'Very Low', desc: '< 0.3' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                    <div
                      className="w-4 h-4 sm:w-6 sm:h-6 rounded border border-gray-400 flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs font-semibold text-gray-900">{item.label}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{item.desc}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {loadingLayers.ndvi && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 flex items-center gap-2 text-[10px] sm:text-xs text-green-600">
                <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            )}
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 text-[10px] sm:text-xs text-gray-500 hidden sm:block">
              Satellite data from Sentinel-2
            </div>
          </div>
        )}

        {/* ET Legend */}
        {!drawingMode && activeLayers.et && (
          <div data-print-hide="true" className={`absolute z-20 bg-white rounded-lg sm:rounded-xl shadow-2xl border-2 border-orange-300 p-2 sm:p-4 w-[180px] sm:w-[280px] ${
            activeLayers.ndvi ? 'bottom-2 sm:bottom-4 left-[210px] sm:left-[340px]' : 'bottom-2 sm:bottom-4 left-2 sm:left-4'
          }`}>
            <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">ET - Water Use</h3>
            </div>
            <div className="space-y-1 sm:space-y-2">
              {[
                { color: 'rgba(239, 68, 68, 0.7)', label: 'Very High', desc: '> 8 mm/day' },
                { color: 'rgba(251, 146, 60, 0.7)', label: 'High', desc: '6-8 mm/day' },
                { color: 'rgba(253, 224, 71, 0.7)', label: 'Moderate', desc: '4-6 mm/day' },
                { color: 'rgba(96, 165, 250, 0.7)', label: 'Low', desc: '2-4 mm/day' },
                { color: 'rgba(191, 219, 254, 0.7)', label: 'Very Low', desc: '< 2 mm/day' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className="w-4 h-4 sm:w-6 sm:h-6 rounded border border-gray-400 flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] sm:text-xs font-semibold text-gray-900">{item.label}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {loadingLayers.et && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 flex items-center gap-2 text-[10px] sm:text-xs text-orange-600">
                <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            )}
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 text-[10px] sm:text-xs text-gray-500 hidden sm:block">
              Satellite data from OpenET
            </div>
          </div>
        )}

        {/* Water Deficit Legend */}
        {!drawingMode && activeLayers.waterDeficit && (
          <div data-print-hide="true" className={`absolute z-20 bg-white rounded-lg sm:rounded-xl shadow-2xl border-2 border-red-300 p-2 sm:p-4 w-[180px] sm:w-[280px] ${
            activeLayers.et && activeLayers.ndvi ? 'bottom-2 sm:bottom-4 left-[420px] sm:left-[660px]' :
            activeLayers.et || activeLayers.ndvi ? 'bottom-2 sm:bottom-4 left-[210px] sm:left-[340px]' :
            'bottom-2 sm:bottom-4 left-2 sm:left-4'
          }`}>
            <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <Droplet className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">Water Deficit</h3>
            </div>
            <div className="space-y-1 sm:space-y-2">
              {[
                { color: 'rgba(220, 38, 38, 0.7)', label: 'Critical', desc: '> 30 mm' },
                { color: 'rgba(249, 115, 22, 0.7)', label: 'High', desc: '20-30 mm' },
                { color: 'rgba(251, 191, 36, 0.7)', label: 'Moderate', desc: '10-20 mm' },
                { color: 'rgba(254, 240, 138, 0.7)', label: 'Good', desc: '0-10 mm' },
                { color: 'rgba(147, 197, 253, 0.7)', label: 'Surplus', desc: '< 0 mm' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className="w-4 h-4 sm:w-6 sm:h-6 rounded border border-gray-400 flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] sm:text-xs font-semibold text-gray-900">{item.label}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {loadingLayers.waterDeficit && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 flex items-center gap-2 text-[10px] sm:text-xs text-red-600">
                <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            )}
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 text-[10px] sm:text-xs text-gray-500 hidden sm:block">
              Calculated from ET and rainfall
            </div>
          </div>
        )}

        {/* Rainfall Legend */}
        {!drawingMode && activeLayers.rainfall && blocksWithCentroids.some(b => b.lat && b.lng) && (
          <div data-print-hide="true" className={`absolute z-20 bg-white rounded-lg sm:rounded-xl shadow-2xl border-2 border-blue-300 p-2 sm:p-4 w-[180px] sm:w-[280px] ${
            activeLayers.waterDeficit && activeLayers.et && activeLayers.ndvi ? 'bottom-2 sm:bottom-4 left-2 sm:left-[900px]' :
            activeLayers.et && activeLayers.ndvi ? 'bottom-2 sm:bottom-4 left-2 sm:left-[600px]' :
            (activeLayers.et || activeLayers.ndvi || activeLayers.waterDeficit) ? 'bottom-2 sm:bottom-4 left-2 sm:left-[300px]' :
            'bottom-2 sm:bottom-4 left-2 sm:left-4'
          }`}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <CloudRain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">Rainfall Map</h3>
            </div>

            {/* Time Period Selector */}
            <div className="mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-200">
              <div className="text-[10px] sm:text-xs font-medium text-gray-600 mb-1.5 sm:mb-2 hidden sm:block">Time Period</div>
              <div className="flex gap-0.5 sm:gap-1">
                {[
                  { weeks: 1, label: '1w' },
                  { weeks: 2, label: '2w' },
                  { weeks: 4, label: '4w' },
                  { weeks: 8, label: '8w' }
                ].map(({ weeks, label }) => (
                  <button
                    key={weeks}
                    onClick={() => setRainfallWeeks(weeks)}
                    className={`flex-1 px-1 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded transition-colors ${
                      rainfallWeeks === weeks
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-100 border border-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              {[
                { min: 2.0, color: '#1e3a8a', label: '≥ 2.0"', desc: 'Heavy rain' },
                { min: 1.0, color: '#2563eb', label: '1.0" - 2.0"', desc: 'Moderate rain' },
                { min: 0.5, color: '#60a5fa', label: '0.5" - 1.0"', desc: 'Light rain' },
                { min: 0.01, color: '#dbeafe', label: '< 0.5"', desc: 'Trace' },
                { min: 0, color: '#fef3c7', label: 'No rain', desc: 'Dry period' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className="w-4 h-4 sm:w-6 sm:h-6 rounded border border-gray-400 flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] sm:text-xs font-semibold text-gray-900">{item.label}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {loadingRainfall && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 flex items-center gap-2 text-[10px] sm:text-xs text-blue-600">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            )}
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 text-[10px] sm:text-xs text-gray-500 hidden sm:block">
              Data from Open-Meteo
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
                  {sortByName(blocksWithGeom).map(block => {
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

        {/* Print/PDF Modal */}
        {showPrintModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-800">
                <div className="flex items-center gap-3">
                  <Printer className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-lg font-bold text-white">Export Field Maps</h2>
                    <p className="text-sm text-slate-300">Select fields and layers to include</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    onPrintModalClose?.();
                  }}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {sortByName(blocks.filter(b => b.geom && b.geom.coordinates)).map(block => {
                    const isFieldSelected = printConfig.selectedFields[block.id];
                    const fieldLayers = printConfig.selectedLayers[block.id] || {};
                    const selectedLayerCount = Object.values(fieldLayers).filter(Boolean).length;

                    return (
                      <div
                        key={block.id}
                        className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                          isFieldSelected
                            ? 'border-slate-700 bg-slate-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setPrintConfig(prev => ({
                            ...prev,
                            selectedFields: {
                              ...prev.selectedFields,
                              [block.id]: !prev.selectedFields[block.id]
                            }
                          }));
                        }}
                      >
                        {/* Field Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${
                              isFieldSelected
                                ? 'bg-slate-700 border-slate-700 text-white'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isFieldSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{block.name}</div>
                            <div className="text-sm text-gray-500">{block.acres?.toFixed(1) || 'N/A'} acres</div>
                          </div>
                          {isFieldSelected && selectedLayerCount > 0 && (
                            <div className="text-xs bg-slate-700 text-white px-2.5 py-1 rounded-full font-medium">
                              {selectedLayerCount} {selectedLayerCount === 1 ? 'view' : 'views'}
                            </div>
                          )}
                        </div>

                        {/* Layer Selection */}
                        {isFieldSelected && (
                          <div className="ml-10 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                            {[
                              { key: 'base', label: 'Satellite View', icon: Satellite },
                              { key: 'ndvi', label: 'NDVI / Vigor', icon: Activity },
                              { key: 'et', label: 'ET / Water Use', icon: Sun },
                              { key: 'rainfall', label: 'Rainfall', icon: CloudRain },
                            ].map(layer => {
                              const isLayerSelected = fieldLayers[layer.key];
                              return (
                                <button
                                  key={layer.key}
                                  onClick={() => {
                                    setPrintConfig(prev => ({
                                      ...prev,
                                      selectedLayers: {
                                        ...prev.selectedLayers,
                                        [block.id]: {
                                          ...prev.selectedLayers[block.id],
                                          [layer.key]: !prev.selectedLayers[block.id]?.[layer.key]
                                        }
                                      }
                                    }));
                                  }}
                                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                                    isLayerSelected
                                      ? 'bg-slate-700 text-white shadow-sm'
                                      : 'bg-white text-gray-600 border border-gray-200 hover:border-slate-400 hover:text-slate-700'
                                  }`}
                                >
                                  <layer.icon className="w-4 h-4" />
                                  {layer.label}
                                  {isLayerSelected && <Check className="w-3.5 h-3.5 ml-auto" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                {(() => {
                  const totalViews = Object.entries(printConfig.selectedFields)
                    .filter(([_, selected]) => selected)
                    .reduce((sum, [blockId]) => {
                      const layers = printConfig.selectedLayers[blockId] || {};
                      return sum + Object.values(layers).filter(Boolean).length;
                    }, 0);

                  return totalViews > 0 ? (
                    <div className="mt-6 p-4 bg-slate-100 rounded-lg border border-slate-200">
                      <div className="text-sm text-slate-700">
                        <strong className="text-slate-900">{totalViews}</strong> map {totalViews === 1 ? 'view' : 'views'} will be generated.
                        Each selected layer for each field will appear on a separate page.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-sm text-amber-700">
                        Select at least one field and one layer to print.
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    onPrintModalClose?.();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // Generate printable views
                    const printViews = [];
                    Object.entries(printConfig.selectedFields).forEach(([blockId, selected]) => {
                      if (!selected) return;
                      const block = blocks.find(b => b.id === blockId);
                      if (!block) return;
                      const layers = printConfig.selectedLayers[blockId] || {};
                      Object.entries(layers).forEach(([layerKey, layerSelected]) => {
                        if (layerSelected) {
                          printViews.push({ block, layer: layerKey });
                        }
                      });
                    });

                    if (printViews.length === 0) {
                      alert('Please select at least one field and layer to print.');
                      return;
                    }

                    // Start capturing
                    setIsCapturing(true);
                    setCaptureProgress({ current: 0, total: printViews.length, message: 'Preparing...' });
                    setShowPrintModal(false); // Hide modal during capture

                    const captures = {};

                    // Capture each field/layer combination
                    for (let i = 0; i < printViews.length; i++) {
                      const view = printViews[i];
                      setCaptureProgress({
                        current: i + 1,
                        total: printViews.length,
                        message: `Capturing ${view.block.name} - ${view.layer}...`
                      });

                      const dataUrl = await captureMapForPrint(view.block, view.layer);
                      if (dataUrl) {
                        captures[`${view.block.id}_${view.layer}`] = dataUrl;
                      }
                    }

                    setIsCapturing(false);
                    setCapturedImages(captures);

                    // Open print window
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) {
                      alert('Please allow popups to print.');
                      return;
                    }

                    const layerLabels = {
                      base: 'Satellite View',
                      ndvi: 'NDVI / Vigor Map',
                      et: 'ET / Water Use',
                      rainfall: 'Rainfall Data'
                    };

                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Vineyard Field Maps - Print</title>
                        <style>
                          @page { size: letter landscape; margin: 0.5in; }
                          @media print {
                            .page-break { page-break-after: always; }
                            .no-print { display: none !important; visibility: hidden !important; height: 0 !important; margin: 0 !important; padding: 0 !important; }
                          }
                          body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            margin: 0;
                            padding: 20px;
                          }
                          .field-page {
                            page-break-after: always;
                            padding: 20px;
                            border: 2px solid #e5e7eb;
                            border-radius: 12px;
                            margin-bottom: 20px;
                          }
                          .field-page:last-child {
                            page-break-after: avoid;
                          }
                          .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 20px;
                            padding-bottom: 15px;
                            border-bottom: 2px solid #e5e7eb;
                          }
                          .field-name {
                            font-size: 24px;
                            font-weight: bold;
                            color: #1f2937;
                          }
                          .layer-badge {
                            display: inline-block;
                            padding: 6px 12px;
                            border-radius: 20px;
                            font-size: 14px;
                            font-weight: 600;
                          }
                          .layer-base { background: #f3f4f6; color: #374151; }
                          .layer-ndvi { background: #d1fae5; color: #065f46; }
                          .layer-et { background: #ffedd5; color: #9a3412; }
                          .layer-rainfall { background: #dbeafe; color: #1e40af; }
                          .map-container {
                            position: relative;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                          }
                          .map-image {
                            width: 100%;
                            height: 450px;
                            object-fit: cover;
                            display: block;
                          }
                          .map-fallback {
                            background: #f9fafb;
                            border: 2px dashed #d1d5db;
                            border-radius: 8px;
                            height: 450px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #6b7280;
                            font-size: 16px;
                          }
                          .layer-overlay {
                            position: absolute;
                            bottom: 15px;
                            left: 15px;
                            padding: 12px 16px;
                            background: rgba(255,255,255,0.95);
                            border-radius: 8px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                          }
                          .layer-title {
                            font-weight: 600;
                            font-size: 14px;
                            color: #374151;
                            margin-bottom: 4px;
                          }
                          .layer-value {
                            font-size: 24px;
                            font-weight: 700;
                          }
                          .layer-unit {
                            font-size: 12px;
                            color: #6b7280;
                          }
                          .field-info {
                            display: grid;
                            grid-template-columns: repeat(6, 1fr);
                            gap: 12px;
                            margin-top: 16px;
                          }
                          .info-card {
                            background: #f9fafb;
                            padding: 15px;
                            border-radius: 8px;
                          }
                          .info-label {
                            font-size: 12px;
                            color: #6b7280;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                          }
                          .info-value {
                            font-size: 18px;
                            font-weight: 600;
                            color: #1f2937;
                            margin-top: 4px;
                          }
                          .print-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 16px 24px;
                            background: #1f2937;
                            border-radius: 10px;
                            margin-bottom: 24px;
                          }
                          .print-header-title {
                            color: white;
                            font-size: 18px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                          }
                          .print-header-subtitle {
                            color: #9ca3af;
                            font-size: 13px;
                            margin-top: 2px;
                          }
                          .print-btn {
                            padding: 10px 20px;
                            background: #374151;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 14px;
                            font-weight: 500;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: background 0.2s;
                          }
                          .print-btn:hover { background: #4b5563; }
                          .compass {
                            width: 40px;
                            height: 40px;
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: white;
                            border-radius: 50%;
                            padding: 2px;
                          }
                          .date-printed {
                            font-size: 12px;
                            color: #9ca3af;
                          }
                          .print-legend {
                            position: absolute;
                            bottom: 15px;
                            right: 15px;
                            padding: 10px 12px;
                            background: rgba(255,255,255,0.95);
                            border-radius: 8px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                            max-width: 160px;
                          }
                          .legend-title {
                            font-weight: 600;
                            font-size: 11px;
                            color: #374151;
                            margin-bottom: 6px;
                          }
                          .legend-scale {
                            display: flex;
                            flex-direction: column;
                            gap: 3px;
                          }
                          .legend-item {
                            display: flex;
                            align-items: center;
                            gap: 6px;
                          }
                          .legend-color {
                            width: 18px;
                            height: 12px;
                            border-radius: 2px;
                            border: 1px solid rgba(0,0,0,0.15);
                            flex-shrink: 0;
                          }
                          .legend-label {
                            font-size: 9px;
                            color: #4b5563;
                            line-height: 1.2;
                          }
                        </style>
                      </head>
                      <body>
                        <div class="print-header no-print">
                          <div>
                            <div class="print-header-title">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                <path d="M2 17l10 5 10-5"></path>
                                <path d="M2 12l10 5 10-5"></path>
                              </svg>
                              Vineyard Field Maps
                            </div>
                            <div class="print-header-subtitle">${printViews.length} page${printViews.length !== 1 ? 's' : ''} ready to print</div>
                          </div>
                          <button class="print-btn" onclick="window.print()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="6 9 6 2 18 2 18 9"></polyline>
                              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                              <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
                            Print All Pages
                          </button>
                        </div>
                        ${(() => {
                          // Build print pages outside the template literal to avoid escaping issues
                          return printViews.map((view, idx) => {
                            const rainfall = rainfallData[view.block.id];
                            const ndvi = layerData.ndvi[view.block.id];
                            const et = layerData.et[view.block.id];

                            // Generate static map URLs for this block (Google + fallback)
                            const mapUrls = generateStaticMapUrl(view.block, GOOGLE_MAPS_API_KEY, {
                              width: 800,
                              height: 450,
                              mapType: 'satellite',
                              strokeColor: view.layer === 'ndvi' ? '22c55e' :
                                           view.layer === 'et' ? 'f97316' :
                                           view.layer === 'rainfall' ? '3b82f6' : '7c3aed',
                              strokeWeight: 4,
                              fillColor: view.layer === 'ndvi' ? '22c55e20' :
                                         view.layer === 'et' ? 'f9731620' :
                                         view.layer === 'rainfall' ? '3b82f620' : '7c3aed20'
                            });
                            const googleUrl = mapUrls?.google;
                            const fallbackUrl = mapUrls?.esri;

                            // Get layer-specific data display
                            let layerDataDisplay = '';
                            if (view.layer === 'rainfall' && rainfall && rainfall.totalInches !== undefined) {
                              layerDataDisplay = '<div class="layer-overlay" style="border-left: 4px solid #3b82f6;">' +
                                '<div class="layer-title">7-Day Rainfall</div>' +
                                '<div class="layer-value" style="color: #1e40af;">' + rainfall.totalInches.toFixed(2) + '"</div>' +
                                '<div class="layer-unit">' + (rainfall.daysWithPrecip || 0) + ' days with precipitation</div>' +
                                '</div>';
                            } else if (view.layer === 'ndvi' && ndvi && ndvi.meanNDVI !== undefined) {
                              const vigorLevel = ndvi.meanNDVI >= 0.6 ? 'High' : ndvi.meanNDVI >= 0.4 ? 'Medium' : 'Low';
                              const vigorColor = ndvi.meanNDVI >= 0.6 ? '#15803d' : ndvi.meanNDVI >= 0.4 ? '#ca8a04' : '#dc2626';
                              layerDataDisplay = '<div class="layer-overlay" style="border-left: 4px solid #22c55e;">' +
                                '<div class="layer-title">Vegetation Index (NDVI)</div>' +
                                '<div class="layer-value" style="color: ' + vigorColor + ';">' + ndvi.meanNDVI.toFixed(3) + '</div>' +
                                '<div class="layer-unit">' + vigorLevel + ' Vigor</div>' +
                                '</div>';
                            } else if (view.layer === 'et' && et && et.weeklyTotal !== undefined) {
                              layerDataDisplay = '<div class="layer-overlay" style="border-left: 4px solid #f97316;">' +
                                '<div class="layer-title">Evapotranspiration</div>' +
                                '<div class="layer-value" style="color: #9a3412;">' + et.weeklyTotal.toFixed(1) + ' mm</div>' +
                                '<div class="layer-unit">Weekly Water Use</div>' +
                                '</div>';
                            }

                            // Generate legend HTML for NDVI and ET layers
                            let legendHtml = '';
                            if (view.layer === 'ndvi') {
                              legendHtml = '<div class="print-legend" style="border-left: 3px solid #22c55e;">' +
                                '<div class="legend-title">NDVI Scale</div>' +
                                '<div class="legend-scale">' +
                                  '<div class="legend-item"><div class="legend-color" style="background:#15803d;"></div><span class="legend-label">High (>0.6)</span></div>' +
                                  '<div class="legend-item"><div class="legend-color" style="background:#22c55e;"></div><span class="legend-label">Good (0.4-0.6)</span></div>' +
                                  '<div class="legend-item"><div class="legend-color" style="background:#86efac;"></div><span class="legend-label">Moderate (0.3-0.4)</span></div>' +
                                  '<div class="legend-item"><div class="legend-color" style="background:#fde047;"></div><span class="legend-label">Low (0.2-0.3)</span></div>' +
                                  '<div class="legend-item"><div class="legend-color" style="background:#fca5a5;"></div><span class="legend-label">Stressed (<0.2)</span></div>' +
                                '</div>' +
                              '</div>';
                            } else if (view.layer === 'et') {
                              legendHtml = '<div class="print-legend" style="border-left: 3px solid #f97316;">' +
                                '<div class="legend-title">ET Water Use</div>' +
                                '<div class="legend-scale">' +
                                  '<div class="legend-item"><div class="legend-color" style="background:rgba(239,68,68,0.7);"></div><span class="legend-label">Very High (>8mm/day)</span></div>' +
                                  '<div class="legend-item"><div class="legend-color" style="background:rgba(251,146,60,0.7);"></div><span class="legend-label">High (6-8mm/day)</span></div>' +
                                  '<div class="legend-item"><div class="legend-color" style="background:rgba(253,224,71,0.7);"></div><span class="legend-label">Moderate (4-6mm)</span></div>' +
                                  '<div class="legend-item"><div class="legend-color" style="background:rgba(96,165,250,0.7);"></div><span class="legend-label">Low (2-4mm/day)</span></div>' +
                                  '<div class="legend-item"><div class="legend-color" style="background:rgba(191,219,254,0.7);"></div><span class="legend-label">Very Low (<2mm)</span></div>' +
                                '</div>' +
                              '</div>';
                            }

                            // Log the URLs for debugging
                            console.log('Print map URLs for ' + view.block.name + ':', { google: googleUrl?.substring(0, 100), fallback: fallbackUrl?.substring(0, 100) });

                            // Calculate center for fallback display
                            let centerLat = 0, centerLng = 0;
                            if (view.block.geom && view.block.geom.coordinates && view.block.geom.coordinates[0]) {
                              const coords = view.block.geom.coordinates[0];
                              coords.forEach(function(c) { centerLat += c[1]; centerLng += c[0]; });
                              centerLat /= coords.length;
                              centerLng /= coords.length;
                            }

                            // Build map HTML - use captured screenshot if available, fallback to ESRI
                            let mapHtml;
                            const capturedImage = captures[view.block.id + '_' + view.layer];

                            if (capturedImage) {
                              // Use captured screenshot (includes NDVI/ET overlays)
                              mapHtml = '<img src="' + capturedImage + '" alt="' + view.block.name + ' - ' + layerLabels[view.layer] + '" class="map-image" />';
                            } else {
                              // Fallback to ESRI satellite imagery
                              const mapSrc = fallbackUrl || googleUrl;
                              if (mapSrc) {
                                mapHtml = '<img src="' + mapSrc.replace(/&/g, '&amp;') + '" alt="' + view.block.name + '" class="map-image" ' +
                                  'onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';" />' +
                                  '<div class="map-fallback" style="display:none; flex-direction:column; gap:10px; text-align:center;">' +
                                    '<div style="font-size:16px; font-weight:600;">Map capture failed</div>' +
                                    '<a href="https://www.google.com/maps/@' + centerLat.toFixed(6) + ',' + centerLng.toFixed(6) + ',17z/data=!3m1!1e3" target="_blank" style="color:#7c3aed; font-size:13px;">View on Google Maps →</a>' +
                                  '</div>';
                              } else {
                                mapHtml = '<div class="map-fallback" style="flex-direction:column; gap:10px; text-align:center;">' +
                                  '<div style="font-size:16px; font-weight:600;">No map data available</div>' +
                                  '<div style="font-size:12px; color:#9ca3af;">Location: ' + centerLat.toFixed(5) + ', ' + centerLng.toFixed(5) + '</div>' +
                                '</div>';
                              }
                            }

                            return '<div class="field-page">' +
                              '<div class="header">' +
                                '<div>' +
                                  '<div class="field-name">' + view.block.name + '</div>' +
                                  '<div class="date-printed">Printed: ' + new Date().toLocaleDateString() + '</div>' +
                                '</div>' +
                                '<div class="layer-badge layer-' + view.layer + '">' + layerLabels[view.layer] + '</div>' +
                              '</div>' +
                              '<div class="map-container">' +
                                mapHtml +
                                '<svg class="compass" viewBox="0 0 100 100">' +
                                  '<circle cx="50" cy="50" r="45" fill="white" stroke="#d1d5db" stroke-width="2"/>' +
                                  '<polygon points="50,10 45,45 50,40 55,45" fill="#ef4444"/>' +
                                  '<polygon points="50,90 45,55 50,60 55,55" fill="#374151"/>' +
                                  '<text x="50" y="8" text-anchor="middle" font-size="10" font-weight="bold" fill="#ef4444">N</text>' +
                                '</svg>' +
                                layerDataDisplay +
                                legendHtml +
                              '</div>' +
                              '<div class="field-info">' +
                                '<div class="info-card"><div class="info-label">Field Size</div><div class="info-value">' + (view.block.acres?.toFixed(2) || 'N/A') + ' acres</div></div>' +
                                '<div class="info-card"><div class="info-label">Variety</div><div class="info-value">' + (view.block.variety || 'Not specified') + '</div></div>' +
                                '<div class="info-card"><div class="info-label">Rootstock</div><div class="info-value">' + (view.block.rootstock || 'Not specified') + '</div></div>' +
                                '<div class="info-card"><div class="info-label">Row Spacing</div><div class="info-value">' + (view.block.row_spacing_ft ? view.block.row_spacing_ft + ' ft' : 'N/A') + '</div></div>' +
                                '<div class="info-card"><div class="info-label">Vine Spacing</div><div class="info-value">' + (view.block.vine_spacing_ft ? view.block.vine_spacing_ft + ' ft' : 'N/A') + '</div></div>' +
                                '<div class="info-card"><div class="info-label">Year Planted</div><div class="info-value">' + (view.block.year_planted || 'Not specified') + '</div></div>' +
                              '</div>' +
                            '</div>';
                          }).join('');
                        })()}
                      </body>
                      </html>
                    `);
                    printWindow.document.close();
                    setShowPrintModal(false);
                    onPrintModalClose?.();
                  }}
                  disabled={!Object.entries(printConfig.selectedFields).some(([blockId, selected]) =>
                    selected && Object.values(printConfig.selectedLayers[blockId] || {}).some(Boolean)
                  )}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Generate PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
