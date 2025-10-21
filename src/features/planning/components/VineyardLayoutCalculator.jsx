// VineyardLayoutCalculator.jsx - Google Maps Based Vineyard Planner
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Polygon, Marker, Polyline } from '@react-google-maps/api';
import { MaterialCostsVisualizer } from "@/features/planning/components/MaterialCostsVisualizer";
import { ChevronDown, MapPin, Trash2, Edit3 } from "lucide-react";
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAEwV8iVPfyCuZDYaX8rstuSUMK8ZOF6V8';
const LIBRARIES = ['drawing', 'geometry'];

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

// Google Maps Vineyard Visualizer Component
export const VineyardLayoutVisualizer = ({ layout, acres, orientation, polygonPath, vineSpacing, rowSpacing, onPolygonChange }) => {
  const mapRef = useRef(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [tempPath, setTempPath] = useState([]);
  const [rows, setRows] = useState([]);

  const mapOptions = {
    mapTypeId: 'satellite',
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
  };

  // Calculate row lines when polygon or spacing changes
  useEffect(() => {
    if (!polygonPath || polygonPath.length < 3 || !layout) return;

    const newRows = generateRowLines(polygonPath, layout.vineLayout.numberOfRows, rowSpacing, orientation);
    setRows(newRows);
  }, [polygonPath, layout, rowSpacing, orientation]);

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
        onPolygonChange(tempPath);
        setTempPath([]);
        setDrawingMode(false);
        return;
      }
    }

    setTempPath(newPath);
  };

  const handleStartDrawing = () => {
    setDrawingMode(true);
    setTempPath([]);
  };

  const handleClearPolygon = () => {
    onPolygonChange([]);
    setTempPath([]);
    setDrawingMode(false);
  };

  const handleCancelDrawing = () => {
    setTempPath([]);
    setDrawingMode(false);
  };

  // Calculate center of polygon for map centering
  const center = polygonPath && polygonPath.length > 0
    ? {
        lat: polygonPath.reduce((sum, p) => sum + p.lat, 0) / polygonPath.length,
        lng: polygonPath.reduce((sum, p) => sum + p.lng, 0) / polygonPath.length
      }
    : DEFAULT_CENTER;

  const hasPolygon = polygonPath && polygonPath.length > 0;

  return (
    <div className="space-y-4">
      {/* Initial prompt when no polygon */}
      {!hasPolygon && !drawingMode && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border-2 border-green-200">
          <div className="flex items-center gap-4">
            <MapPin className="w-12 h-12 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Map Your Vineyard</h3>
              <p className="text-gray-600 text-sm">Click "Start Drawing" below, then click points on the satellite map to outline your vineyard boundary.</p>
            </div>
            <button
              onClick={handleStartDrawing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold whitespace-nowrap"
            >
              Start Drawing
            </button>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {hasPolygon && (
        <div className="flex gap-3">
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
        </div>
      )}

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

      {/* Layout Stats */}
      {layout && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="font-semibold text-green-700">Acreage</div>
            <div className="text-2xl font-bold text-green-900">{layout.dimensions.acres.toFixed(2)}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="font-semibold text-purple-700">Total Vines</div>
            <div className="text-2xl font-bold text-purple-900">{layout.vineLayout.totalVines.toLocaleString()}</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-semibold text-blue-700">Rows</div>
            <div className="text-2xl font-bold text-blue-900">{layout.vineLayout.numberOfRows}</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="font-semibold text-amber-700">Vines/Acre</div>
            <div className="text-2xl font-bold text-amber-900">{Math.round(layout.vineLayout.vinesPerAcre)}</div>
          </div>
        </div>
      )}

      {/* Google Map */}
      <div className="h-[600px] rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={17}
          options={mapOptions}
          onClick={handleMapClick}
          onLoad={(map) => { mapRef.current = map; }}
        >
          {/* Main Polygon */}
          {polygonPath.length >= 3 && (
            <Polygon
              paths={polygonPath}
              options={{
                fillColor: '#10b981',
                fillOpacity: 0.2,
                strokeColor: '#059669',
                strokeOpacity: 0.8,
                strokeWeight: 3,
              }}
            />
          )}

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

          {/* Row Lines - simplified, no individual post markers */}
          {rows.map((row, index) => (
            <Polyline
              key={`row-${index}`}
              path={row.path}
              options={{
                strokeColor: '#8b4513',
                strokeOpacity: 0.6,
                strokeWeight: 1.5,
              }}
            />
          ))}
        </GoogleMap>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <div className="w-4 h-4 bg-green-500 opacity-40 border-2 border-green-700 rounded"></div>
          <span>Vineyard Boundary</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <div className="w-8 h-1 bg-amber-700"></div>
          <span>Trellis Rows</span>
        </div>
      </div>
    </div>
  );
};

// Generate row lines based on polygon and spacing (simplified - no post markers)
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
  // At this latitude, approximately 1 degree lat = 364,000 feet
  // 1 degree lng varies by latitude, approximately 300,000 feet at 30° lat
  const latDegPerFoot = 1 / 364000;
  const lngDegPerFoot = 1 / 300000;

  for (let i = 0; i < numberOfRows; i++) {
    let start, end;

    if (orientation === "vertical") {
      // Rows run north-south
      const lngOffset = minLng + (i * rowSpacing * lngDegPerFoot);
      start = { lat: minLat, lng: lngOffset };
      end = { lat: maxLat, lng: lngOffset };
    } else {
      // Rows run east-west
      const latOffset = minLat + (i * rowSpacing * latDegPerFoot);
      start = { lat: latOffset, lng: minLng };
      end = { lat: latOffset, lng: maxLng };
    }

    rows.push({
      path: [start, end]
    });
  }

  return rows;
};

// Main component for vineyard layout configuration
export const VineyardLayoutConfig = ({ acres, onLayoutChange, currentLayout, onAcresChange }) => {
  const [spacingOption, setSpacingOption] = useState("6x10");
  const [customVineSpacing, setCustomVineSpacing] = useState(6);
  const [customRowSpacing, setCustomRowSpacing] = useState(10);
  const [rowOrientation, setRowOrientation] = useState("horizontal");
  const [trellisSystem, setTrellisSystem] = useState("VSP");
  const [polygonPath, setPolygonPath] = useState([]);

  const selectedSpacing = VINE_SPACING_OPTIONS.find(opt => opt.key === spacingOption);
  const isCustom = spacingOption === "custom";

  const vineSpacing = isCustom ? customVineSpacing : selectedSpacing.vine;
  const rowSpacing = isCustom ? customRowSpacing : selectedSpacing.row;

  const layout = useMemo(() => {
    if (polygonPath.length >= 3 && vineSpacing > 0 && rowSpacing > 0) {
      return calculateVineyardLayout(polygonPath, vineSpacing, rowSpacing, rowOrientation);
    }
    return null;
  }, [polygonPath, vineSpacing, rowSpacing, rowOrientation]);

  const materialCosts = useMemo(() => {
    if (layout) {
      return calculateMaterialCosts(layout.materials);
    }
    return null;
  }, [layout]);

  // Update acres when polygon changes (avoid infinite loop with ref)
  const lastAcresRef = useRef(null);
  useEffect(() => {
    if (layout && onAcresChange) {
      const newAcres = layout.dimensions.acres.toFixed(2);
      if (lastAcresRef.current !== newAcres) {
        lastAcresRef.current = newAcres;
        onAcresChange(newAcres);
      }
    }
  }, [layout]);

  // Notify parent component of layout changes (avoid infinite loop)
  const lastLayoutRef = useRef(null);
  useEffect(() => {
    if (layout && materialCosts && onLayoutChange) {
      const layoutString = JSON.stringify(layout);
      if (lastLayoutRef.current !== layoutString) {
        lastLayoutRef.current = layoutString;
        onLayoutChange(layout, materialCosts);
      }
    }
  }, [layout, materialCosts]);

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

        {/* Map Visualization */}
        <CollapsibleSection title="Vineyard Map & Boundary" defaultOpen={true}>
          <VineyardLayoutVisualizer
            layout={layout}
            acres={acres}
            orientation={rowOrientation}
            polygonPath={polygonPath}
            vineSpacing={vineSpacing}
            rowSpacing={rowSpacing}
            onPolygonChange={setPolygonPath}
          />
        </CollapsibleSection>

        {/* Material Costs */}
        {layout && materialCosts && (
          <CollapsibleSection title="Material Cost Summary" defaultOpen={true}>
            <MaterialCostsVisualizer materialCosts={materialCosts} layout={layout} />
          </CollapsibleSection>
        )}

        {/* Detailed Material Requirements */}
        {layout && materialCosts && (
          <CollapsibleSection title="Detailed Material Requirements" defaultOpen={false}>
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
                    <td className="p-3">{layout.materials.posts.total} total</td>
                    <td className="p-3 text-right">${materialCosts.posts.toLocaleString()}</td>
                    <td className="p-3">{layout.materials.posts.description}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Earth Anchors</td>
                    <td className="p-3">{layout.materials.earthAnchors.count}</td>
                    <td className="p-3 text-right">${materialCosts.earthAnchors.toLocaleString()}</td>
                    <td className="p-3">{layout.materials.earthAnchors.description}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Trellis Wire</td>
                    <td className="p-3">{layout.materials.wire.totalFeet.toLocaleString()} ft</td>
                    <td className="p-3 text-right">${materialCosts.wire.toLocaleString()}</td>
                    <td className="p-3">{layout.materials.wire.gaugeRecommended}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Drip Irrigation</td>
                    <td className="p-3">{layout.materials.irrigation.dripTubing.toLocaleString()} ft + {layout.materials.irrigation.emitters} emitters</td>
                    <td className="p-3 text-right">${materialCosts.irrigation.toLocaleString()}</td>
                    <td className="p-3">Tubing + emitters</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Hardware</td>
                    <td className="p-3">Various</td>
                    <td className="p-3 text-right">${materialCosts.hardware.toLocaleString()}</td>
                    <td className="p-3">{layout.materials.hardware.description}</td>
                  </tr>
                  <tr className="bg-blue-50 font-semibold">
                    <td className="p-3">Total Materials</td>
                    <td className="p-3">-</td>
                    <td className="p-3 text-right">
                      ${Object.values(materialCosts).reduce((sum, cost) => sum + cost, 0).toLocaleString()}
                    </td>
                    <td className="p-3">Trellis & irrigation materials</td>
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
