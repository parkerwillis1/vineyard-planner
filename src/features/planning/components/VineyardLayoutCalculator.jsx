// VineyardLayoutCalculator.jsx - Google Maps Based Vineyard Planner with Multiple Fields
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript, Polygon, Marker, Polyline, Autocomplete } from '@react-google-maps/api';
import { MaterialCostsVisualizer } from "@/features/planning/components/MaterialCostsVisualizer";
import { ChevronDown, MapPin, Trash2, Edit3, Plus, Eye, EyeOff, RotateCw, Settings, X, Grid, Check } from "lucide-react";
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAEwV8iVPfyCuZDYaX8rstuSUMK8ZOF6V8';
const LIBRARIES = ['drawing', 'geometry', 'places'];

// Helper function to format money without decimals
const formatMoney = (value) => Math.round(value).toLocaleString();

// Texas Hill Country default center (Fredericksburg area)
const DEFAULT_CENTER = {
  lat: 30.2672,
  lng: -98.8792
};

/* --------------------------------------------------------- */
/*  Collapsible Section Component                            */
/* --------------------------------------------------------- */
function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Card className="rounded-xl shadow-sm bg-white overflow-hidden mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-blue-50 px-6 py-4 border-b
                   focus:outline-none hover:bg-blue-100 transition-colors"
      >
        <h3 className="font-medium text-blue-700 text-lg">{title}</h3>
        <ChevronDown
          className={`h-5 w-5 text-blue-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && <CardContent className="p-6">{children}</CardContent>}
    </Card>
  );
}

// Standard spacing options used in commercial viticulture
export const VINE_SPACING_OPTIONS = [
  { key: "6x8", vine: 6, row: 8, label: "6' × 8' (High Density)", vinesPerAcre: Math.round(43560 / (6 * 8)) },  // = 908
  { key: "6x10", vine: 6, row: 10, label: "6' × 10' (Standard)", vinesPerAcre: Math.round(43560 / (6 * 10)) },  // = 726
  { key: "8x8", vine: 8, row: 8, label: "8' × 8' (Square)", vinesPerAcre: Math.round(43560 / (8 * 8)) },  // = 681
  { key: "8x10", vine: 8, row: 10, label: "8' × 10' (Wide Row)", vinesPerAcre: Math.round(43560 / (8 * 10)) },  // = 545
  { key: "8x12", vine: 8, row: 12, label: "8' × 12' (Mechanical)", vinesPerAcre: Math.round(43560 / (8 * 12)) },  // = 454
  { key: "custom", vine: 0, row: 0, label: "Custom Spacing", vinesPerAcre: 0 }
];

// Calculate acreage from GPS polygon coordinates
const calculatePolygonArea = (path) => {
  if (!window.google || !window.google.maps || !window.google.maps.geometry || !path || path.length < 3) {
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

// Calculate vineyard layout from actual GPS polygon
export const calculateVineyardLayout = (polygonPath, vineSpacing, rowSpacing, orientation = "horizontal") => {
  if (!polygonPath || polygonPath.length < 3) return null;

  const acres = calculatePolygonArea(polygonPath);

  // Find the longest edge to determine row direction
  let maxDistance = 0;
  let maxEdgeStart = null;
  let maxEdgeEnd = null;

  for (let i = 0; i < polygonPath.length; i++) {
    const nextIndex = (i + 1) % polygonPath.length;
    const distance = calculateDistance(polygonPath[i], polygonPath[nextIndex]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxEdgeStart = polygonPath[i];
      maxEdgeEnd = polygonPath[nextIndex];
    }
  }

  // Calculate approximate dimensions
  const perimeter = polygonPath.reduce((sum, point, i) => {
    const nextIndex = (i + 1) % polygonPath.length;
    return sum + calculateDistance(point, polygonPath[nextIndex]);
  }, 0);

  const avgSideLength = perimeter / polygonPath.length;
  const length = maxDistance;
  const width = avgSideLength;

  // Calculate vine layout
  let numberOfRows, vinesPerRow, rowLength;

  if (orientation === "vertical") {
    numberOfRows = Math.floor(width / rowSpacing);
    vinesPerRow = Math.floor(length / vineSpacing);
    rowLength = length;
  } else {
    numberOfRows = Math.floor(length / rowSpacing);
    vinesPerRow = Math.floor(width / vineSpacing);
    rowLength = width;
  }

  const totalVines = numberOfRows * vinesPerRow;
  const materials = calculateMaterials(numberOfRows, vinesPerRow, rowLength, rowSpacing);

  return {
    dimensions: { width, length, acres, perimeter },
    vineLayout: {
      numberOfRows,
      vinesPerRow,
      totalVines,
      vinesPerAcre: vineSpacing && rowSpacing ? Math.round(43560 / (vineSpacing * rowSpacing)) : 0
    },
    materials,
    spacing: { vine: vineSpacing, row: rowSpacing },
    orientation,
    polygonPath
  };
};

const calculateMaterials = (rows, vinesPerRow, length, rowSpacing) => {
  const LINE_POST_SPACING_FT = 20;
  const endPosts = rows * 2;
  const linePostsPerRow = Math.max(0, Math.floor(length / LINE_POST_SPACING_FT) - 1);
  const linePosts = rows * linePostsPerRow;
  const totalPosts = endPosts + linePosts;

  const earthAnchors = rows * 2;
  const wiresPerRow = 3;
  const wireLength = rows * length * wiresPerRow;
  const dripTubingLength = rows * length;
  const dripEmitters = vinesPerRow * rows;

  const wireClips = totalPosts * wiresPerRow * 2;
  const eyeBolts = endPosts * wiresPerRow;
  const staples = linePosts * wiresPerRow * 2;
  const tensioners = rows * wiresPerRow;
  const anchorRings = earthAnchors;

  return {
    posts: {
      endPosts,
      linePosts,
      total: totalPosts,
      description: `${endPosts} end posts + ${linePosts} line posts`
    },
    earthAnchors: {
      count: earthAnchors,
      description: `${earthAnchors} earth anchors (2 per row)`
    },
    wire: {
      totalFeet: Math.round(wireLength),
      gaugeRecommended: "12.5 gauge high-tensile",
      description: `${Math.round(wireLength)} feet (3 wires × ${rows} rows × ${Math.round(length)} ft)`
    },
    irrigation: {
      dripTubing: Math.round(dripTubingLength),
      emitters: dripEmitters,
      description: `${Math.round(dripTubingLength)} ft drip tubing + ${dripEmitters} emitters`
    },
    hardware: {
      wireClips,
      eyeBolts,
      staples,
      tensioners,
      anchorRings,
      description: "Wire clips, eye bolts, staples, tensioners, anchor rings"
    }
  };
};

// Cost estimation based on materials
export const calculateMaterialCosts = (materials, customPrices = {}) => {
  const defaultPrices = {
    endPost: 25,
    linePost: 15,
    earthAnchor: 45,
    wirePerFoot: 0.75,
    dripTubingPerFoot: 0.35,
    emitter: 1.20,
    wireClip: 0.15,
    eyeBolt: 2.50,
    staple: 0.05,
    tensioner: 8.00,
    anchorRing: 3.50,
    ...customPrices
  };

  return {
    posts: (materials.posts.endPosts * defaultPrices.endPost) +
           (materials.posts.linePosts * defaultPrices.linePost),
    earthAnchors: materials.earthAnchors.count * defaultPrices.earthAnchor,
    wire: materials.wire.totalFeet * defaultPrices.wirePerFoot,
    irrigation: (materials.irrigation.dripTubing * defaultPrices.dripTubingPerFoot) +
                (materials.irrigation.emitters * defaultPrices.emitter),
    hardware: (materials.hardware.wireClips * defaultPrices.wireClip) +
              (materials.hardware.eyeBolts * defaultPrices.eyeBolt) +
              (materials.hardware.staples * defaultPrices.staple) +
              (materials.hardware.tensioners * defaultPrices.tensioner) +
              (materials.hardware.anchorRings * defaultPrices.anchorRing)
  };
};

// Check if a point is inside a polygon using ray casting algorithm
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

// Generate row lines for a field based on spacing and orientation (degree-based)
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

// Google Maps Vineyard Visualizer Component with Multiple Fields Support
export const VineyardLayoutVisualizer = ({
  fields,
  currentFieldId,
  onFieldsChange,
  onFieldSelect,
  vineSpacing,
  rowSpacing,
  defaultOrientation = "horizontal"
}) => {
  const mapRef = useRef(null);
  const fieldMenuRef = useRef(null);

  // Initialize map center from first field with polygon, or use default
  const [mapCenter, setMapCenter] = useState(() => {
    const firstFieldWithPolygon = fields.find(f => f.polygonPath && f.polygonPath.length > 0);
    if (firstFieldWithPolygon) {
      const polygon = firstFieldWithPolygon.polygonPath;
      return {
        lat: polygon.reduce((sum, p) => sum + p.lat, 0) / polygon.length,
        lng: polygon.reduce((sum, p) => sum + p.lng, 0) / polygon.length
      };
    }
    return DEFAULT_CENTER;
  });

  const [mapZoom, setMapZoom] = useState(17);
  const [drawingMode, setDrawingMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tempPath, setTempPath] = useState([]);
  const [editingFieldName, setEditingFieldName] = useState(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // {x, y, edgeIndex, clickPosition}
  const [showRotationControls, setShowRotationControls] = useState(false);
  const [showRows, setShowRows] = useState(true);

  // No caching - match BlockMap.jsx exactly

  const mapOptions = {
    mapTypeId: 'satellite',
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
  };

  const currentField = fields.find(f => f.id === currentFieldId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fieldMenuRef.current && !fieldMenuRef.current.contains(event.target)) {
        setShowFieldMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update map center when fields change (e.g., when loading saved fields)
  // Use a ref to track last centered field to prevent infinite loops
  const lastCenteredFieldRef = useRef(null);

  useEffect(() => {
    const firstFieldWithPolygon = fields.find(f => f.polygonPath && f.polygonPath.length > 0);
    if (firstFieldWithPolygon && firstFieldWithPolygon.polygonPath.length > 0) {
      const fieldSignature = `${firstFieldWithPolygon.id}-${firstFieldWithPolygon.polygonPath.length}`;

      // Only update if this is a different field than last time
      if (lastCenteredFieldRef.current !== fieldSignature) {
        lastCenteredFieldRef.current = fieldSignature;

        const polygon = firstFieldWithPolygon.polygonPath;
        const center = {
          lat: polygon.reduce((sum, p) => sum + p.lat, 0) / polygon.length,
          lng: polygon.reduce((sum, p) => sum + p.lng, 0) / polygon.length
        };
        setMapCenter(center);
        if (mapRef.current) {
          mapRef.current.panTo(center);
          mapRef.current.setZoom(17);
        }
      }
    }
  }, [fields]);

  // Calculate rows for all fields - EXACTLY matching BlockMap.jsx
  // Also include tempPath for real-time editing
  const allFieldsRows = useMemo(() => {
    const rowsMap = {};
    fields.forEach(field => {
      // Use tempPath if we're editing this field, otherwise use saved polygonPath
      const isEditingThisField = editMode && field.id === currentFieldId;
      const pathToUse = isEditingThisField && tempPath.length >= 3 ? tempPath : field.polygonPath;

      if (pathToUse && pathToUse.length >= 3) {
        // Convert orientation to degrees
        let orientationDeg;
        if (typeof field.orientation === 'number') {
          orientationDeg = field.orientation;
        } else {
          orientationDeg = field.orientation === "vertical" ? 0 : 90;
        }
        rowsMap[field.id] = generateRowLines(pathToUse, rowSpacing, orientationDeg);
      }
    });
    return rowsMap;
  }, [fields, rowSpacing, editMode, currentFieldId, tempPath]);

  const handleMapClick = (e) => {
    if (!drawingMode) return;

    const newPoint = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };

    const newPath = [...tempPath, newPoint];

    // Check if clicked near first point to close polygon
    if (tempPath.length >= 3) {
      const firstPoint = tempPath[0];
      const distance = calculateDistance(newPoint, firstPoint);

      if (distance < 50) { // Within 50 feet of first point
        // Save the completed polygon to current field
        handleSavePolygon(tempPath);
        setTempPath([]);
        setDrawingMode(false);
        return;
      }
    }

    setTempPath(newPath);
  };

  const handleSavePolygon = (polygonPath) => {
    const updatedFields = fields.map(field =>
      field.id === currentFieldId
        ? { ...field, polygonPath }
        : field
    );
    onFieldsChange(updatedFields);
  };

  const handleStartDrawing = () => {
    // Save current map position before starting
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      setMapCenter({ lat: center.lat(), lng: center.lng() });
      setMapZoom(zoom);
    }
    setDrawingMode(true);
    setTempPath([]);
  };

  const handleClearPolygon = () => {
    // Save current map position before clearing
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      setMapCenter({ lat: center.lat(), lng: center.lng() });
      setMapZoom(zoom);
    }

    const updatedFields = fields.map(field =>
      field.id === currentFieldId
        ? { ...field, polygonPath: [] }
        : field
    );
    onFieldsChange(updatedFields);
    setTempPath([]);
    setDrawingMode(false);
  };

  const handleCancelDrawing = () => {
    setTempPath([]);
    setDrawingMode(false);
    setEditMode(false);
  };

  const handleCompletePolygon = () => {
    if (!currentFieldId || tempPath.length < 3) return;

    // Update the field's polygonPath with the edited boundary
    const updatedFields = fields.map(field =>
      field.id === currentFieldId
        ? { ...field, polygonPath: [...tempPath] }
        : field
    );

    onFieldsChange(updatedFields);
    setTempPath([]);
    setDrawingMode(false);
    setEditMode(false);
  };

  const handleStartEditing = () => {
    if (currentFieldId && currentField && currentField.polygonPath) {
      setTempPath([...currentField.polygonPath]);
      setEditMode(true);
      setDrawingMode(true);
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

    // Find which edge was clicked
    let closestEdgeIndex = 0;
    let closestDistance = Infinity;

    for (let i = 0; i < tempPath.length; i++) {
      const nextIndex = (i + 1) % tempPath.length;
      const edgeStart = tempPath[i];
      const edgeEnd = tempPath[nextIndex];

      // Calculate distance from click to edge
      const distance = calculateDistanceToEdge(clickPosition, edgeStart, edgeEnd);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEdgeIndex = i;
      }
    }

    // Get screen position for context menu
    const projection = mapRef.current.getProjection();
    if (projection) {
      const scale = Math.pow(2, mapRef.current.getZoom());
      const worldCoordinate = projection.fromLatLngToPoint(e.latLng);
      const pixelCoordinate = new window.google.maps.Point(
        worldCoordinate.x * scale,
        worldCoordinate.y * scale
      );

      setContextMenu({
        x: e.domEvent.clientX,
        y: e.domEvent.clientY,
        edgeIndex: closestEdgeIndex,
        clickPosition
      });
    }
  };

  const handleAddPointOnEdge = () => {
    if (!contextMenu) return;

    const newPath = [...tempPath];
    newPath.splice(contextMenu.edgeIndex + 1, 0, contextMenu.clickPosition);
    setTempPath(newPath);
    setContextMenu(null);
  };

  // Helper function to calculate distance from point to line segment
  const calculateDistanceToEdge = (point, edgeStart, edgeEnd) => {
    const A = point.lat - edgeStart.lat;
    const B = point.lng - edgeStart.lng;
    const C = edgeEnd.lat - edgeStart.lat;
    const D = edgeEnd.lng - edgeStart.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = edgeStart.lat;
      yy = edgeStart.lng;
    } else if (param > 1) {
      xx = edgeEnd.lat;
      yy = edgeEnd.lng;
    } else {
      xx = edgeStart.lat + param * C;
      yy = edgeStart.lng + param * D;
    }

    const dx = point.lat - xx;
    const dy = point.lng - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Close context menu when clicking anywhere
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const handleAddField = () => {
    const newField = {
      id: Date.now().toString(),
      name: `Field ${fields.length + 1}`,
      polygonPath: [],
      visible: true,
      orientation: defaultOrientation,
    };
    onFieldsChange([...fields, newField]);
    onFieldSelect(newField.id);
  };

  const handleDeleteField = (fieldId) => {
    const updatedFields = fields.filter(f => f.id !== fieldId);
    if (fieldId === currentFieldId && updatedFields.length > 0) {
      onFieldSelect(updatedFields[0].id);
    }
    onFieldsChange(updatedFields);
  };

  const handleToggleFieldVisibility = (fieldId) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId ? { ...field, visible: !field.visible } : field
    );
    onFieldsChange(updatedFields);
  };

  const handleRenameField = (fieldId, newName) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId ? { ...field, name: newName } : field
    );
    onFieldsChange(updatedFields);
    setEditingFieldName(null);
  };

  const handleSetOrientation = (angle) => {
    if (currentFieldId) {
      const updatedFields = fields.map(field =>
        field.id === currentFieldId ? { ...field, orientation: angle } : field
      );
      onFieldsChange(updatedFields);
    }
  };

  const handleRotateRows = () => {
    if (currentFieldId && currentField) {
      let currentOrientation;
      if (typeof currentField.orientation === 'number') {
        currentOrientation = currentField.orientation;
      } else {
        currentOrientation = currentField.orientation === "vertical" ? 0 : 90;
      }
      // Toggle between 0 (north-south) and 90 (east-west)
      const newOrientation = currentOrientation === 0 ? 90 : 0;
      handleSetOrientation(newOrientation);
    }
  };

  const handleGoToField = (field) => {
    if (field.polygonPath && field.polygonPath.length > 0) {
      const center = {
        lat: field.polygonPath.reduce((sum, p) => sum + p.lat, 0) / field.polygonPath.length,
        lng: field.polygonPath.reduce((sum, p) => sum + p.lng, 0) / field.polygonPath.length
      };
      setMapCenter(center);
      setMapZoom(17);
      if (mapRef.current) {
        mapRef.current.panTo(center);
        mapRef.current.setZoom(17);
      }
    }
    onFieldSelect(field.id);
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
        setMapZoom(17);
        if (mapRef.current) {
          mapRef.current.panTo(location);
          mapRef.current.setZoom(17);
        }
      }
    }
  };

  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  // Calculate center for map
  const displayCenter = useMemo(() => {
    if (currentField && currentField.polygonPath && currentField.polygonPath.length > 0) {
      return {
        lat: currentField.polygonPath.reduce((sum, p) => sum + p.lat, 0) / currentField.polygonPath.length,
        lng: currentField.polygonPath.reduce((sum, p) => sum + p.lng, 0) / currentField.polygonPath.length
      };
    }
    return mapCenter;
  }, [currentField, mapCenter]);

  return (
    <div className="space-y-4">
      {/* Address Search */}
      <Card>
        <CardContent className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search for Address or Location
          </label>
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
              componentRestrictions: { country: 'us' },
              fields: ['geometry', 'formatted_address', 'name']
            }}
          >
            <Input
              type="text"
              placeholder="Enter an address or location..."
              className="w-full"
            />
          </Autocomplete>
          <p className="text-xs text-gray-500 mt-2">
            Search for your vineyard location to center the map. If you see an error, check browser console (F12).
          </p>
        </CardContent>
      </Card>

      {/* Map Controls - Always visible */}
      <div className="flex gap-3 flex-wrap items-center">
        {/* Fields Dropdown */}
        <div className="relative" ref={fieldMenuRef}>
          <button
            onClick={() => setShowFieldMenu(!showFieldMenu)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-vine-green-500 transition-colors"
          >
            <span className="text-gray-700">
              {currentField?.name || 'Field 1'} ({fields.length} field{fields.length !== 1 ? 's' : ''})
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showFieldMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showFieldMenu && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
              {/* Field List */}
              <div className="px-3 py-2">
                <div className="space-y-2">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className={`p-3 rounded border ${
                        field.id === currentFieldId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            onClick={() => handleToggleFieldVisibility(field.id)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            {field.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          {editingFieldName === field.id ? (
                            <Input
                              value={newFieldName}
                              onChange={(e) => setNewFieldName(e.target.value)}
                              onBlur={() => handleRenameField(field.id, newFieldName)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleRenameField(field.id, newFieldName);
                              }}
                              className="text-sm h-8"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => {
                                handleGoToField(field);
                                setShowFieldMenu(false);
                              }}
                              className="font-medium text-sm hover:text-blue-600 flex-1 text-left"
                            >
                              {field.name}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingFieldName(field.id);
                              setNewFieldName(field.name);
                            }}
                            className="p-1 text-gray-600 hover:text-blue-600"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {fields.length > 1 && (
                            <button
                              onClick={() => handleDeleteField(field.id)}
                              className="p-1 text-gray-600 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {field.polygonPath && field.polygonPath.length >= 3 && (
                        <div className="mt-2 text-xs text-gray-600">
                          {calculatePolygonArea(field.polygonPath).toFixed(2)} acres
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>

              {/* Add Field Button */}
              <button
                onClick={() => {
                  handleAddField();
                  setShowFieldMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-vine-green-500 hover:bg-vine-green-50 font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Field
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons - Show based on field state */}
        {currentField && currentField.polygonPath && currentField.polygonPath.length > 0 ? (
          <>
            <button
              onClick={handleStartEditing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Field
            </button>
            <button
              onClick={handleStartDrawing}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Redraw Boundary
            </button>
            <button
              onClick={handleClearPolygon}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={() => setShowRows(!showRows)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showRows
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <Grid className="w-4 h-4" />
              {showRows ? 'Hide Rows' : 'Show Rows'}
            </button>
            {showRows && (
              <button
                onClick={() => setShowRotationControls(!showRotationControls)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  showRotationControls
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <RotateCw className="w-4 h-4" />
                Rotate Rows
              </button>
            )}
          </>
        ) : !drawingMode && (
          <button
            onClick={handleStartDrawing}
            className="px-6 py-2 bg-vine-green-500 text-white rounded-lg hover:bg-vine-green-600 transition-colors font-semibold"
          >
            Start Drawing
          </button>
        )}
      </div>

      {/* Action buttons when drawing/editing */}
      {drawingMode && (
        <div className="flex gap-3">
          {editMode ? (
            <>
              <button
                onClick={handleCompletePolygon}
                className="px-6 py-2 bg-vine-green-500 text-white rounded-lg hover:bg-vine-green-600 transition-colors font-semibold flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={handleCancelDrawing}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  if (tempPath.length >= 3) {
                    handleSavePolygon(tempPath);
                    setTempPath([]);
                    setDrawingMode(false);
                  }
                }}
                disabled={tempPath.length < 3}
                className="px-6 py-2 bg-vine-green-500 text-white rounded-lg hover:bg-vine-green-600 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Done Drawing
              </button>
              <button
                onClick={handleCancelDrawing}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* Drawing/Editing Instructions */}
      {drawingMode && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          {editMode ? (
            <>
              <p className="font-medium text-blue-900">
                Editing Field Boundary
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li><strong>Drag vertices</strong> to adjust the boundary</li>
                <li><strong>Right-click</strong> on edges to add new points</li>
                <li>Click "Save Changes" when done</li>
              </ul>
            </>
          ) : (
            <>
              <p className="font-medium text-blue-900">
                Drawing New Field
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li><strong>Click</strong> on the map to add points (need at least 3)</li>
                <li><strong>Drag vertices</strong> to adjust positions</li>
                <li><strong>Right-click</strong> on edges to add points</li>
                <li><strong>Click "Done Drawing"</strong> when finished, or click near the first point to auto-complete</li>
              </ul>
              <p className="text-sm text-blue-700 mt-2">
                Points placed: {tempPath.length} {tempPath.length >= 3 ? '✓ Ready to save' : ''}
              </p>
            </>
          )}
        </div>
      )}

      {/* Google Map */}
      <div className="relative h-[600px] rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={displayCenter}
          zoom={mapZoom}
          options={mapOptions}
          onClick={handleMapClick}
          onLoad={(map) => { mapRef.current = map; }}
        >
          {/* Render all visible field polygons (except when editing current field) */}
          {fields.map(field => {
            // Skip rendering saved polygon if we're editing this field
            const isEditingThisField = editMode && field.id === currentFieldId;
            if (isEditingThisField) return null;

            return field.visible && field.polygonPath && field.polygonPath.length >= 3 && (
              <Polygon
                key={field.id}
                paths={field.polygonPath}
                options={{
                  fillColor: field.id === currentFieldId ? '#10b981' : '#6b7280',
                  fillOpacity: field.id === currentFieldId ? 0.2 : 0.1,
                  strokeColor: field.id === currentFieldId ? '#059669' : '#4b5563',
                  strokeOpacity: 0.8,
                  strokeWeight: field.id === currentFieldId ? 3 : 2,
                }}
              />
            );
          })}

          {/* Render rows for all fields - EXACTLY matching BlockMap.jsx pattern */}
          {showRows && fields.map(field => {
            const rows = allFieldsRows[field.id];
            if (!rows) return null;

            const isCurrentField = field.id === currentFieldId;

            return rows.map((row, index) => (
              <Polyline
                key={`${field.id}-row-${index}`}
                path={row.path}
                options={{
                  strokeColor: isCurrentField ? '#ffff00' : '#cccc00',
                  strokeOpacity: isCurrentField ? 0.9 : 0.5,
                  strokeWeight: 2,
                }}
              />
            ));
          })}

          {/* Temporary drawing/editing path */}
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

              {/* Show polyline for incomplete polygons */}
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
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Point Here
            </button>
          </div>
        )}

        {/* Rotation Controls Panel */}
        {showRotationControls && currentFieldId && currentField && currentField.polygonPath && currentField.polygonPath.length >= 3 && (() => {
          let currentOrientation;
          if (typeof currentField.orientation === 'number') {
            currentOrientation = currentField.orientation;
          } else {
            currentOrientation = currentField.orientation === "vertical" ? 0 : 90;
          }

          return (
            <div className="absolute bottom-4 right-4 z-20 bg-white rounded-xl shadow-2xl border border-gray-300 p-4 w-[340px]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Row Rotation</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{currentField.name}</p>
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
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <div className="w-4 h-4 bg-vine-green-500 opacity-40 border-2 border-vine-green-700 rounded"></div>
          <span>Field Boundary</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <div className="w-8 h-1 bg-yellow-400"></div>
          <span>Trellis Rows</span>
        </div>
      </div>
    </div>
  );
};

// Main component for vineyard layout configuration
export const VineyardLayoutConfig = ({ acres, onLayoutChange, currentLayout, onAcresChange, savedFields, onFieldsChange, onConfigChange }) => {
  // Initialize from currentLayout or use defaults
  const [spacingOption, setSpacingOption] = useState(() => currentLayout?.spacingOption || "6x10");
  const [customVineSpacing, setCustomVineSpacing] = useState(() => currentLayout?.customVineSpacing || 6);
  const [customRowSpacing, setCustomRowSpacing] = useState(() => currentLayout?.customRowSpacing || 10);
  const initialOrientation = currentLayout?.rowOrientation === "vertical" ? "vertical" : "horizontal";
  const [defaultOrientation, setDefaultOrientation] = useState(initialOrientation);
  const [trellisSystem, setTrellisSystem] = useState(() => currentLayout?.trellisSystem || "VSP");

  // Sync with currentLayout when it changes (when loading a plan)
  // Only update if values actually change to prevent infinite loops
  // IMPORTANT: Only depend on currentLayout to prevent circular updates when user changes spacing
  useEffect(() => {
    if (currentLayout) {
      if (currentLayout.spacingOption && currentLayout.spacingOption !== spacingOption) {
        setSpacingOption(currentLayout.spacingOption);
      }
      if (currentLayout.customVineSpacing && currentLayout.customVineSpacing !== customVineSpacing) {
        setCustomVineSpacing(currentLayout.customVineSpacing);
      }
      if (currentLayout.customRowSpacing && currentLayout.customRowSpacing !== customRowSpacing) {
        setCustomRowSpacing(currentLayout.customRowSpacing);
      }
      if ((currentLayout.rowOrientation === "vertical" || currentLayout.rowOrientation === "horizontal") &&
          currentLayout.rowOrientation !== defaultOrientation) {
        setDefaultOrientation(currentLayout.rowOrientation);
      }
      if (currentLayout.trellisSystem && currentLayout.trellisSystem !== trellisSystem) {
        setTrellisSystem(currentLayout.trellisSystem);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLayout]);

  // Initialize fields from saved data or create default
  const [fields, setFields] = useState(() => {
    if (savedFields && savedFields.length > 0) {
      return savedFields.map(field => ({
        ...field,
        orientation: field.orientation || (currentLayout?.rowOrientation || defaultOrientation),
      }));
    }
    return [{
      id: Date.now().toString(),
      name: 'Field 1',
      polygonPath: [],
      visible: true,
      orientation: currentLayout?.rowOrientation || defaultOrientation,
    }];
  });

  const [currentFieldId, setCurrentFieldId] = useState(() => fields[0]?.id);
  const currentField = fields.find(f => f.id === currentFieldId);
  const lastFieldsRef = useRef(JSON.stringify(fields));

  // Track if we're syncing FROM parent to prevent circular updates
  const isSyncingFromParentRef = useRef(false);

  // Sync fields when savedFields changes (e.g., when loading a different plan)
  const lastSavedSignatureRef = useRef(JSON.stringify(savedFields ?? []));

  useEffect(() => {
    if (!savedFields || savedFields.length === 0) return;

    const incomingSignature = JSON.stringify(savedFields);
    if (incomingSignature === lastSavedSignatureRef.current) return;
    lastSavedSignatureRef.current = incomingSignature;

    const normalized = savedFields.map(field =>
      field.orientation ? field : { ...field, orientation: defaultOrientation }
    );

    const normalizedSignature = JSON.stringify(normalized);
    lastFieldsRef.current = normalizedSignature;

    // Mark that we're syncing FROM parent to prevent calling onFieldsChange
    isSyncingFromParentRef.current = true;
    setFields(normalized);

    if (normalized.length > 0 && !normalized.some(f => f.id === currentFieldId)) {
      setCurrentFieldId(normalized[0].id);
    }
  }, [savedFields, defaultOrientation, currentFieldId]);

  const selectedSpacing = VINE_SPACING_OPTIONS.find(opt => opt.key === spacingOption);
  const isCustom = spacingOption === "custom";

  const vineSpacing = isCustom ? customVineSpacing : selectedSpacing.vine;
  const rowSpacing = isCustom ? customRowSpacing : selectedSpacing.row;

  // Calculate individual field layouts
  const fieldLayouts = useMemo(() => {
    const layouts = {};
    fields.forEach(field => {
      if (field.polygonPath && field.polygonPath.length >= 3 && vineSpacing > 0 && rowSpacing > 0) {
        const orientation = field.orientation || defaultOrientation;
        const layout = calculateVineyardLayout(field.polygonPath, vineSpacing, rowSpacing, orientation);
        if (layout) {
          layouts[field.id] = {
            ...layout,
            orientation,
          };
        } else {
          console.warn(`⚠️ Layout calculation returned null for field ${field.name}`);
        }
      }
    });

    return layouts;
  }, [fields, vineSpacing, rowSpacing, defaultOrientation]);

  // Calculate aggregate layout (all fields combined)
  const aggregateLayout = useMemo(() => {
    const allLayouts = Object.values(fieldLayouts);

    if (allLayouts.length === 0) {
      console.warn('⚠️ aggregateLayout returning null - no field layouts available');
      return null;
    }

    const orientations = fields
      .filter(f => f.polygonPath && f.polygonPath.length >= 3)
      .map(f => f.orientation || defaultOrientation);
    const uniqueOrientations = new Set(orientations);
    const aggregateOrientation = uniqueOrientations.size === 1
      ? (uniqueOrientations.values().next().value || defaultOrientation)
      : 'mixed';

    const totalAcres = allLayouts.reduce((sum, layout) => sum + layout.dimensions.acres, 0);
    const totalVines = allLayouts.reduce((sum, layout) => sum + layout.vineLayout.totalVines, 0);
    const totalRows = allLayouts.reduce((sum, layout) => sum + layout.vineLayout.numberOfRows, 0);

    // Aggregate materials
    const aggregateMaterials = {
      posts: { endPosts: 0, linePosts: 0, total: 0, description: '' },
      earthAnchors: { count: 0, description: '' },
      wire: { totalFeet: 0, gaugeRecommended: "12.5 gauge high-tensile", description: '' },
      irrigation: { dripTubing: 0, emitters: 0, description: '' },
      hardware: { wireClips: 0, eyeBolts: 0, staples: 0, tensioners: 0, anchorRings: 0, description: '' }
    };

    allLayouts.forEach(layout => {
      const m = layout.materials;
      aggregateMaterials.posts.endPosts += m.posts.endPosts;
      aggregateMaterials.posts.linePosts += m.posts.linePosts;
      aggregateMaterials.posts.total += m.posts.total;
      aggregateMaterials.earthAnchors.count += m.earthAnchors.count;
      aggregateMaterials.wire.totalFeet += m.wire.totalFeet;
      aggregateMaterials.irrigation.dripTubing += m.irrigation.dripTubing;
      aggregateMaterials.irrigation.emitters += m.irrigation.emitters;
      aggregateMaterials.hardware.wireClips += m.hardware.wireClips;
      aggregateMaterials.hardware.eyeBolts += m.hardware.eyeBolts;
      aggregateMaterials.hardware.staples += m.hardware.staples;
      aggregateMaterials.hardware.tensioners += m.hardware.tensioners;
      aggregateMaterials.hardware.anchorRings += m.hardware.anchorRings;
    });

    aggregateMaterials.posts.description = `${aggregateMaterials.posts.endPosts} end posts + ${aggregateMaterials.posts.linePosts} line posts`;
    aggregateMaterials.earthAnchors.description = `${aggregateMaterials.earthAnchors.count} earth anchors`;
    aggregateMaterials.wire.description = `${Math.round(aggregateMaterials.wire.totalFeet)} feet total`;
    aggregateMaterials.irrigation.description = `${Math.round(aggregateMaterials.irrigation.dripTubing)} ft + ${aggregateMaterials.irrigation.emitters} emitters`;
    aggregateMaterials.hardware.description = "All hardware combined";

    const result = {
      dimensions: { acres: totalAcres },
      vineLayout: {
        numberOfRows: totalRows,
        totalVines: totalVines,
        vinesPerAcre: vineSpacing && rowSpacing ? Math.round(43560 / (vineSpacing * rowSpacing)) : 0
      },
      materials: aggregateMaterials,
      spacing: { vine: vineSpacing, row: rowSpacing },
      orientation: aggregateOrientation,
      fields: fields.length
    };


    return result;
  }, [fieldLayouts, fields, vineSpacing, rowSpacing, defaultOrientation]);

  const materialCosts = useMemo(() => {
    if (aggregateLayout) {
      return calculateMaterialCosts(aggregateLayout.materials);
    }
    return null;
  }, [aggregateLayout]);

  // Update acres when fields change
  const lastAcresRef = useRef(null);
  useEffect(() => {
    if (aggregateLayout && onAcresChange) {
      const newAcres = aggregateLayout.dimensions.acres.toFixed(2);
      if (lastAcresRef.current !== newAcres) {
        lastAcresRef.current = newAcres;
        onAcresChange(newAcres);
      }
    }
  }, [aggregateLayout, onAcresChange]);

  // Notify parent component of layout changes
  const lastLayoutRef = useRef(null);
  const hasInitializedLayout = useRef(false);

  useEffect(() => {
    if (aggregateLayout && materialCosts && onLayoutChange) {
      const layoutString = JSON.stringify(aggregateLayout);
      if (lastLayoutRef.current !== layoutString) {
        lastLayoutRef.current = layoutString;
        try {
          onLayoutChange(aggregateLayout, materialCosts);
          hasInitializedLayout.current = true;
        } catch (error) {
          console.error('Error calling onLayoutChange:', error);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggregateLayout, materialCosts]);

  // Force layout calculation on mount if we have saved fields
  useEffect(() => {
    if (!hasInitializedLayout.current && savedFields && savedFields.length > 0 && savedFields.some(f => f.polygonPath && f.polygonPath.length > 0)) {
      // Fields are loaded but layout hasn't been calculated yet
      // The aggregateLayout useMemo should trigger and then call onLayoutChange
    }
  }, [savedFields]);

  // Notify parent of fields changes (for saving)
  useEffect(() => {
    // Skip if we're syncing FROM parent to prevent circular updates
    if (isSyncingFromParentRef.current) {
      isSyncingFromParentRef.current = false;
      return;
    }

    if (onFieldsChange) {
      const fieldsString = JSON.stringify(fields);
      if (lastFieldsRef.current !== fieldsString) {
        lastFieldsRef.current = fieldsString;
        onFieldsChange(fields);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  // Sync config changes to parent - safe now because parent preserves calculatedLayout
  const lastConfigRef = useRef(null);
  useEffect(() => {
    if (onConfigChange) {
      const config = { spacingOption, customVineSpacing, customRowSpacing, rowOrientation: defaultOrientation, trellisSystem };
      const configString = JSON.stringify(config);
      if (lastConfigRef.current !== configString) {
        lastConfigRef.current = configString;
        onConfigChange(config);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spacingOption, customVineSpacing, customRowSpacing, defaultOrientation, trellisSystem]);

  const currentFieldLayout = currentFieldId ? fieldLayouts[currentFieldId] : null;

  // Load Google Maps script once
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  if (loadError) {
    return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">Loading maps...</div>;
  }

  return (
      <div className="space-y-6">
        {/* Basic Parameters */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold text-blue-600 mb-6">Vineyard Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Row Spacing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Row Spacing (ft)
                </label>
                <Input
                  type="number"
                  min="6"
                  max="16"
                  step="0.5"
                  value={rowSpacing}
                  onChange={(e) => {
                    setSpacingOption("custom");
                    setCustomRowSpacing(Number(e.target.value));
                  }}
                  className="text-lg"
                />
              </div>

              {/* Vine Spacing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vine Spacing (ft)
                </label>
                <Input
                  type="number"
                  min="4"
                  max="12"
                  step="0.5"
                  value={vineSpacing}
                  onChange={(e) => {
                    setSpacingOption("custom");
                    setCustomVineSpacing(Number(e.target.value));
                  }}
                  className="text-lg"
                />
              </div>

              {/* Trellis System */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trellis System
                </label>
                <select
                  value={trellisSystem}
                  onChange={(e) => setTrellisSystem(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-lg"
                >
                  <option value="VSP">Vertical Shoot Positioning (VSP)</option>
                  <option value="Geneva">Geneva Double Curtain</option>
                  <option value="Scott-Henry">Scott-Henry</option>
                  <option value="Lyre">Lyre System</option>
                </select>
              </div>

              {/* Row Orientation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Row Orientation (Selected Field)
                </label>
                <select
                  value={currentField?.orientation || defaultOrientation}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!currentFieldId) return;
                    setFields(prev => prev.map(field =>
                      field.id === currentFieldId
                        ? { ...field, orientation: value }
                        : field
                    ));
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md text-lg"
                >
                  <option value="horizontal">Horizontal (East-West)</option>
                  <option value="vertical">Vertical (North-South)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Stats */}
        {aggregateLayout && fields.some(f => f.polygonPath && f.polygonPath.length >= 3) && (
          <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Overall Statistics ({fields.length} Field{fields.length !== 1 ? 's' : ''})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Total Acreage</div>
                  <div className="text-2xl font-bold text-blue-900">{aggregateLayout.dimensions.acres.toFixed(2)}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Total Vines</div>
                  <div className="text-2xl font-bold text-vine-green-900">{aggregateLayout.vineLayout.totalVines.toLocaleString()}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Total Rows</div>
                  <div className="text-2xl font-bold text-purple-900">{aggregateLayout.vineLayout.numberOfRows}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Theoretical Density</div>
                  <div className="text-2xl font-bold text-amber-900">{Math.round(aggregateLayout.vineLayout.vinesPerAcre)}</div>
                  <div className="text-xs text-gray-500 mt-1">vines/acre (from spacing)</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Actual Density</div>
                  <div className="text-2xl font-bold text-emerald-900">
                    {Math.round(aggregateLayout.vineLayout.totalVines / aggregateLayout.dimensions.acres)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">actual vines/acre</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Planted Area</div>
                  <div className="text-2xl font-bold text-teal-900">
                    {((aggregateLayout.vineLayout.totalVines / aggregateLayout.vineLayout.vinesPerAcre)).toFixed(2)} ac
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {((aggregateLayout.vineLayout.totalVines / aggregateLayout.vineLayout.vinesPerAcre / aggregateLayout.dimensions.acres) * 100).toFixed(0)}% of total
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Field Stats */}
        {currentFieldLayout && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {fields.find(f => f.id === currentFieldId)?.name} Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-vine-green-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Acreage</div>
                  <div className="text-xl font-bold text-vine-green-900">{currentFieldLayout.dimensions.acres.toFixed(2)}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Vines</div>
                  <div className="text-xl font-bold text-purple-900">{currentFieldLayout.vineLayout.totalVines.toLocaleString()}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Rows</div>
                  <div className="text-xl font-bold text-blue-900">{currentFieldLayout.vineLayout.numberOfRows}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Theoretical Density</div>
                  <div className="text-xl font-bold text-amber-900">{Math.round(currentFieldLayout.vineLayout.vinesPerAcre)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">v/ac (spacing)</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Actual Density</div>
                  <div className="text-xl font-bold text-emerald-900">
                    {Math.round(currentFieldLayout.vineLayout.totalVines / currentFieldLayout.dimensions.acres)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">actual v/ac</div>
                </div>
                <div className="bg-teal-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Planted Area</div>
                  <div className="text-xl font-bold text-teal-900">
                    {((currentFieldLayout.vineLayout.totalVines / currentFieldLayout.vineLayout.vinesPerAcre)).toFixed(2)} ac
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {((currentFieldLayout.vineLayout.totalVines / currentFieldLayout.vineLayout.vinesPerAcre / currentFieldLayout.dimensions.acres) * 100).toFixed(0)}% of total
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Visualization */}
        <CollapsibleSection title="Vineyard Map & Fields" defaultOpen={true}>
          <VineyardLayoutVisualizer
            fields={fields}
            currentFieldId={currentFieldId}
            onFieldsChange={setFields}
            onFieldSelect={setCurrentFieldId}
            vineSpacing={vineSpacing}
            rowSpacing={rowSpacing}
            defaultOrientation={defaultOrientation}
          />
        </CollapsibleSection>

        {/* Material Costs */}
        {aggregateLayout && materialCosts && (
          <CollapsibleSection title="Material Cost Summary (All Fields)" defaultOpen={true}>
            <div className="space-y-6">
              {/* Aggregate Summary */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Total Materials (All Fields)</h4>
                <MaterialCostsVisualizer materialCosts={materialCosts} layout={aggregateLayout} />
              </div>

              {/* Individual Field Breakdown */}
              {fields.length > 1 && fields.some(f => f.polygonPath && f.polygonPath.length >= 3) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Materials by Field</h4>
                  <div className="space-y-3">
                    {fields.map(field => {
                      const layout = fieldLayouts[field.id];
                      if (!layout) return null;

                      const fieldCosts = calculateMaterialCosts(layout.materials);

                      return (
                        <details key={field.id} className="bg-gray-50 rounded-lg border border-gray-200">
                          <summary className="cursor-pointer p-4 font-medium text-gray-800 hover:bg-gray-100 rounded-lg">
                            {field.name} - ${formatMoney(Object.values(fieldCosts).reduce((sum, cost) => sum + cost, 0))}
                          </summary>
                          <div className="p-4 pt-0">
                            <MaterialCostsVisualizer materialCosts={fieldCosts} layout={layout} />
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Detailed Material Requirements */}
        {aggregateLayout && materialCosts && (
          <CollapsibleSection title="Detailed Material Requirements (All Fields)" defaultOpen={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="text-left p-3 font-medium text-blue-800">Category</th>
                    <th className="text-left p-3 font-medium text-blue-800">Quantity</th>
                    <th className="text-right p-3 font-medium text-blue-800">Est. Cost</th>
                    <th className="text-left p-3 font-medium text-blue-800">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="p-3 font-medium">Posts</td>
                    <td className="p-3">{aggregateLayout.materials.posts.total} total</td>
                    <td className="p-3 text-right">${formatMoney(materialCosts.posts)}</td>
                    <td className="p-3">{aggregateLayout.materials.posts.description}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Earth Anchors</td>
                    <td className="p-3">{aggregateLayout.materials.earthAnchors.count}</td>
                    <td className="p-3 text-right">${formatMoney(materialCosts.earthAnchors)}</td>
                    <td className="p-3">{aggregateLayout.materials.earthAnchors.description}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Trellis Wire</td>
                    <td className="p-3">{aggregateLayout.materials.wire.totalFeet.toLocaleString()} ft</td>
                    <td className="p-3 text-right">${formatMoney(materialCosts.wire)}</td>
                    <td className="p-3">{aggregateLayout.materials.wire.gaugeRecommended}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Drip Irrigation</td>
                    <td className="p-3">{aggregateLayout.materials.irrigation.dripTubing.toLocaleString()} ft + {aggregateLayout.materials.irrigation.emitters} emitters</td>
                    <td className="p-3 text-right">${formatMoney(materialCosts.irrigation)}</td>
                    <td className="p-3">Tubing + emitters</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Hardware</td>
                    <td className="p-3">Various</td>
                    <td className="p-3 text-right">${formatMoney(materialCosts.hardware)}</td>
                    <td className="p-3">{aggregateLayout.materials.hardware.description}</td>
                  </tr>
                  <tr className="bg-blue-50 font-semibold">
                    <td className="p-3">Total Materials</td>
                    <td className="p-3">-</td>
                    <td className="p-3 text-right">
                      ${formatMoney(Object.values(materialCosts).reduce((sum, cost) => sum + cost, 0))}
                    </td>
                    <td className="p-3">All fields combined</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        )}
      </div>
  );
};
