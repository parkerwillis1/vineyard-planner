// VineyardLayoutCalculator.jsx - Google Maps Based Vineyard Planner with Multiple Fields
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Polygon, Marker, Polyline, Autocomplete } from '@react-google-maps/api';
import { MaterialCostsVisualizer } from "@/features/planning/components/MaterialCostsVisualizer";
import { ChevronDown, MapPin, Trash2, Edit3, Plus, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAEwV8iVPfyCuZDYaX8rstuSUMK8ZOF6V8';
const LIBRARIES = ['drawing', 'geometry', 'places'];

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
  { key: "6x8", vine: 6, row: 8, label: "6' × 8' (High Density)", vinesPerAcre: 908 },
  { key: "6x10", vine: 6, row: 10, label: "6' × 10' (Standard)", vinesPerAcre: 726 },
  { key: "8x8", vine: 8, row: 8, label: "8' × 8' (Square)", vinesPerAcre: 681 },
  { key: "8x10", vine: 8, row: 10, label: "8' × 10' (Wide Row)", vinesPerAcre: 545 },
  { key: "8x12", vine: 8, row: 12, label: "8' × 12' (Mechanical)", vinesPerAcre: 454 },
  { key: "custom", vine: 0, row: 0, label: "Custom Spacing", vinesPerAcre: 0 }
];

// Calculate acreage from GPS polygon coordinates
const calculatePolygonArea = (path) => {
  if (!window.google || !path || path.length < 3) return 0;

  const googlePath = path.map(point => new window.google.maps.LatLng(point.lat, point.lng));
  const polygon = new window.google.maps.Polygon({ paths: googlePath });
  const areaSquareMeters = window.google.maps.geometry.spherical.computeArea(polygon.getPath());

  // Convert square meters to acres (1 acre = 4046.86 square meters)
  const acres = areaSquareMeters / 4046.86;
  return acres;
};

// Calculate distance between two GPS points in feet
const calculateDistance = (point1, point2) => {
  if (!window.google) return 0;

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
    dimensions: { width, length, acres },
    vineLayout: {
      numberOfRows,
      vinesPerRow,
      totalVines,
      vinesPerAcre: acres > 0 ? (totalVines / acres) : 0
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

// Find intersection points where a line crosses the polygon boundary
const clipLineToPolygon = (lineStart, lineEnd, polygon) => {
  const segments = [];
  const numSamples = 200; // Sample points along the line

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

  // Add final segment if it exists
  if (currentSegment && currentSegment.length > 1) {
    segments.push(currentSegment);
  }

  return segments;
};

// Generate row lines based on polygon and spacing - clipped to polygon boundary
const generateRowLines = (polygonPath, numberOfRows, rowSpacing, orientation) => {
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

  // Calculate how many rows will fit across the entire bounding box
  let maxRowsNeeded;
  if (orientation === "vertical") {
    // For vertical orientation, rows span across the width (longitude)
    const bboxWidthDeg = maxLng - minLng;
    const bboxWidthFeet = bboxWidthDeg / lngDegPerFoot;
    maxRowsNeeded = Math.ceil(bboxWidthFeet / rowSpacing) + 2; // +2 for safety margin
  } else {
    // For horizontal orientation, rows span across the height (latitude)
    const bboxHeightDeg = maxLat - minLat;
    const bboxHeightFeet = bboxHeightDeg / latDegPerFoot;
    maxRowsNeeded = Math.ceil(bboxHeightFeet / rowSpacing) + 2; // +2 for safety margin
  }

  // Generate rows across the entire bounding box
  for (let i = 0; i < maxRowsNeeded; i++) {
    let lineStart, lineEnd;

    if (orientation === "vertical") {
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

    // Clip the line to polygon boundary
    const clippedSegments = clipLineToPolygon(lineStart, lineEnd, polygonPath);

    // Add each clipped segment as a separate row
    clippedSegments.forEach(segment => {
      if (segment.length >= 2) {
        rows.push({
          path: segment
        });
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
  orientation
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
  const [tempPath, setTempPath] = useState([]);
  const [editingFieldName, setEditingFieldName] = useState(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);

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
  useEffect(() => {
    const firstFieldWithPolygon = fields.find(f => f.polygonPath && f.polygonPath.length > 0);
    if (firstFieldWithPolygon && firstFieldWithPolygon.polygonPath.length > 0) {
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
  }, [fields]);

  // Calculate rows for all visible fields
  const allFieldsRows = useMemo(() => {
    const rowsMap = {};
    fields.forEach(field => {
      if (field.visible && field.polygonPath && field.polygonPath.length >= 3) {
        const layout = calculateVineyardLayout(field.polygonPath, vineSpacing, rowSpacing, orientation);
        if (layout) {
          rowsMap[field.id] = generateRowLines(field.polygonPath, layout.vineLayout.numberOfRows, rowSpacing, orientation);
        }
      }
    });
    return rowsMap;
  }, [fields, vineSpacing, rowSpacing, orientation]);

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
  };

  const handleAddField = () => {
    const newField = {
      id: Date.now().toString(),
      name: `Field ${fields.length + 1}`,
      polygonPath: [],
      visible: true
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
              onClick={handleStartDrawing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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

      {/* Cancel button when drawing */}
      {drawingMode && (
        <button
          onClick={handleCancelDrawing}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel Drawing
        </button>
      )}

      {/* Drawing Instructions */}
      {drawingMode && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="font-medium text-blue-900">
            Click on the map to add points. Click near the first point to complete the polygon.
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Points placed: {tempPath.length}
          </p>
        </div>
      )}

      {/* Google Map */}
      <div className="h-[600px] rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={displayCenter}
          zoom={mapZoom}
          options={mapOptions}
          onClick={handleMapClick}
          onLoad={(map) => { mapRef.current = map; }}
        >
          {/* Render all visible field polygons */}
          {fields.map(field => (
            field.visible && field.polygonPath && field.polygonPath.length >= 3 && (
              <React.Fragment key={field.id}>
                <Polygon
                  paths={field.polygonPath}
                  options={{
                    fillColor: field.id === currentFieldId ? '#10b981' : '#6b7280',
                    fillOpacity: field.id === currentFieldId ? 0.2 : 0.1,
                    strokeColor: field.id === currentFieldId ? '#059669' : '#4b5563',
                    strokeOpacity: 0.8,
                    strokeWeight: field.id === currentFieldId ? 3 : 2,
                  }}
                />
                {/* Render rows for this field */}
                {allFieldsRows[field.id]?.map((row, index) => (
                  <Polyline
                    key={`${field.id}-row-${index}`}
                    path={row.path}
                    options={{
                      strokeColor: field.id === currentFieldId ? '#ffff00' : '#cccc00',
                      strokeOpacity: field.id === currentFieldId ? 0.9 : 0.5,
                      strokeWeight: 2,
                    }}
                  />
                ))}
              </React.Fragment>
            )
          ))}

          {/* Temporary drawing path */}
          {tempPath.length > 0 && (
            <>
              <Polyline
                path={tempPath}
                options={{
                  strokeColor: '#3b82f6',
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
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                  }}
                />
              ))}
            </>
          )}
        </GoogleMap>
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
  const [rowOrientation, setRowOrientation] = useState(() => currentLayout?.rowOrientation || "horizontal");
  const [trellisSystem, setTrellisSystem] = useState(() => currentLayout?.trellisSystem || "VSP");

  // Sync with currentLayout when it changes (when loading a plan)
  useEffect(() => {
    if (currentLayout) {
      if (currentLayout.spacingOption) setSpacingOption(currentLayout.spacingOption);
      if (currentLayout.customVineSpacing) setCustomVineSpacing(currentLayout.customVineSpacing);
      if (currentLayout.customRowSpacing) setCustomRowSpacing(currentLayout.customRowSpacing);
      if (currentLayout.rowOrientation) setRowOrientation(currentLayout.rowOrientation);
      if (currentLayout.trellisSystem) setTrellisSystem(currentLayout.trellisSystem);
    }
  }, [currentLayout]);

  // Initialize fields from saved data or create default
  const [fields, setFields] = useState(() => {
    if (savedFields && savedFields.length > 0) {
      return savedFields;
    }
    return [{
      id: Date.now().toString(),
      name: 'Field 1',
      polygonPath: [],
      visible: true
    }];
  });

  // Sync fields when savedFields changes (e.g., when loading a different plan)
  useEffect(() => {
    if (savedFields && savedFields.length > 0) {
      setFields(savedFields);
    }
  }, [savedFields]);

  const [currentFieldId, setCurrentFieldId] = useState(() => fields[0]?.id);

  const selectedSpacing = VINE_SPACING_OPTIONS.find(opt => opt.key === spacingOption);
  const isCustom = spacingOption === "custom";

  const vineSpacing = isCustom ? customVineSpacing : selectedSpacing.vine;
  const rowSpacing = isCustom ? customRowSpacing : selectedSpacing.row;

  // Calculate individual field layouts
  const fieldLayouts = useMemo(() => {
    const layouts = {};
    fields.forEach(field => {
      if (field.polygonPath && field.polygonPath.length >= 3 && vineSpacing > 0 && rowSpacing > 0) {
        layouts[field.id] = calculateVineyardLayout(field.polygonPath, vineSpacing, rowSpacing, rowOrientation);
      }
    });
    return layouts;
  }, [fields, vineSpacing, rowSpacing, rowOrientation]);

  // Calculate aggregate layout (all fields combined)
  const aggregateLayout = useMemo(() => {
    const allLayouts = Object.values(fieldLayouts);
    if (allLayouts.length === 0) return null;

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

    return {
      dimensions: { acres: totalAcres },
      vineLayout: {
        numberOfRows: totalRows,
        totalVines: totalVines,
        vinesPerAcre: totalAcres > 0 ? (totalVines / totalAcres) : 0
      },
      materials: aggregateMaterials,
      spacing: { vine: vineSpacing, row: rowSpacing },
      orientation: rowOrientation,
      fields: fields.length
    };
  }, [fieldLayouts, fields, vineSpacing, rowSpacing, rowOrientation]);

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
  }, [aggregateLayout]);

  // Notify parent component of layout changes
  const lastLayoutRef = useRef(null);
  const hasInitializedLayout = useRef(false);

  useEffect(() => {
    if (aggregateLayout && materialCosts && onLayoutChange) {
      const layoutString = JSON.stringify(aggregateLayout);
      if (lastLayoutRef.current !== layoutString) {
        lastLayoutRef.current = layoutString;
        onLayoutChange(aggregateLayout, materialCosts);
        hasInitializedLayout.current = true;
      }
    }
  }, [aggregateLayout, materialCosts, onLayoutChange]);

  // Force layout calculation on mount if we have saved fields
  useEffect(() => {
    if (!hasInitializedLayout.current && savedFields && savedFields.length > 0 && savedFields.some(f => f.polygonPath && f.polygonPath.length > 0)) {
      // Fields are loaded but layout hasn't been calculated yet
      // The aggregateLayout useMemo should trigger and then call onLayoutChange
      console.log('🔄 Saved fields detected on mount, waiting for layout calculation...');
    }
  }, [savedFields]);

  // Notify parent of fields changes (for saving)
  const lastFieldsRef = useRef(null);
  useEffect(() => {
    if (onFieldsChange) {
      const fieldsString = JSON.stringify(fields);
      if (lastFieldsRef.current !== fieldsString) {
        lastFieldsRef.current = fieldsString;
        onFieldsChange(fields);
      }
    }
  }, [fields]);

  // Notify parent of config changes (for saving)
  const lastConfigRef = useRef(null);
  useEffect(() => {
    if (onConfigChange) {
      const config = {
        spacingOption,
        customVineSpacing,
        customRowSpacing,
        rowOrientation,
        trellisSystem
      };
      const configString = JSON.stringify(config);
      if (lastConfigRef.current !== configString) {
        lastConfigRef.current = configString;
        onConfigChange(config);
      }
    }
  }, [spacingOption, customVineSpacing, customRowSpacing, rowOrientation, trellisSystem, onConfigChange]);

  const currentFieldLayout = currentFieldId ? fieldLayouts[currentFieldId] : null;

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
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
                  Row Orientation
                </label>
                <select
                  value={rowOrientation}
                  onChange={(e) => setRowOrientation(e.target.value)}
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
                  <div className="text-sm text-gray-600">Avg Vines/Acre</div>
                  <div className="text-2xl font-bold text-amber-900">{Math.round(aggregateLayout.vineLayout.vinesPerAcre)}</div>
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
                  <div className="text-xs text-gray-600">Vines/Acre</div>
                  <div className="text-xl font-bold text-amber-900">{Math.round(currentFieldLayout.vineLayout.vinesPerAcre)}</div>
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
            orientation={rowOrientation}
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
                            {field.name} - ${Object.values(fieldCosts).reduce((sum, cost) => sum + cost, 0).toLocaleString()}
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
                    <td className="p-3 text-right">${materialCosts.posts.toLocaleString()}</td>
                    <td className="p-3">{aggregateLayout.materials.posts.description}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Earth Anchors</td>
                    <td className="p-3">{aggregateLayout.materials.earthAnchors.count}</td>
                    <td className="p-3 text-right">${materialCosts.earthAnchors.toLocaleString()}</td>
                    <td className="p-3">{aggregateLayout.materials.earthAnchors.description}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Trellis Wire</td>
                    <td className="p-3">{aggregateLayout.materials.wire.totalFeet.toLocaleString()} ft</td>
                    <td className="p-3 text-right">${materialCosts.wire.toLocaleString()}</td>
                    <td className="p-3">{aggregateLayout.materials.wire.gaugeRecommended}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Drip Irrigation</td>
                    <td className="p-3">{aggregateLayout.materials.irrigation.dripTubing.toLocaleString()} ft + {aggregateLayout.materials.irrigation.emitters} emitters</td>
                    <td className="p-3 text-right">${materialCosts.irrigation.toLocaleString()}</td>
                    <td className="p-3">Tubing + emitters</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Hardware</td>
                    <td className="p-3">Various</td>
                    <td className="p-3 text-right">${materialCosts.hardware.toLocaleString()}</td>
                    <td className="p-3">{aggregateLayout.materials.hardware.description}</td>
                  </tr>
                  <tr className="bg-blue-50 font-semibold">
                    <td className="p-3">Total Materials</td>
                    <td className="p-3">-</td>
                    <td className="p-3 text-right">
                      ${Object.values(materialCosts).reduce((sum, cost) => sum + cost, 0).toLocaleString()}
                    </td>
                    <td className="p-3">All fields combined</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        )}
      </div>
    </LoadScript>
  );
};
