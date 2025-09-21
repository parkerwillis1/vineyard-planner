// VineyardLayoutCalculator.js
import React, { useMemo, useState } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';

// Standard spacing options used in commercial viticulture
export const VINE_SPACING_OPTIONS = [
  { key: "6x8", vine: 6, row: 8, label: "6' × 8' (High Density)", vinesPerAcre: 908 },
  { key: "6x10", vine: 6, row: 10, label: "6' × 10' (Standard)", vinesPerAcre: 726 },
  { key: "8x8", vine: 8, row: 8, label: "8' × 8' (Square)", vinesPerAcre: 681 },
  { key: "8x10", vine: 8, row: 10, label: "8' × 10' (Wide Row)", vinesPerAcre: 545 },
  { key: "8x12", vine: 8, row: 12, label: "8' × 12' (Mechanical)", vinesPerAcre: 454 },
  { key: "custom", vine: 0, row: 0, label: "Custom Spacing", vinesPerAcre: 0 }
];

export const VINEYARD_SHAPES = [
  { key: "rectangle", label: "Rectangle", aspectRatios: [1, 1.5, 2, 2.5, 3] },
  { key: "square", label: "Square", aspectRatios: [1] },
  { key: "l_shape", label: "L-Shape", aspectRatios: [1.5, 2] },
  { key: "irregular", label: "Irregular", aspectRatios: [1.5] }
];

// Calculate actual vineyard dimensions and material requirements
export const calculateVineyardLayout = (acres, vineSpacing, rowSpacing, shape = "rectangle", aspectRatio = 2) => {
  const sqftPerAcre = 43560;
  const totalSqft = acres * sqftPerAcre;
  
  // Calculate basic dimensions
  let width, length;
  if (shape === "square") {
    width = length = Math.sqrt(totalSqft);
  } else {
    width = Math.sqrt(totalSqft / aspectRatio);
    length = width * aspectRatio;
  }
  
  // Calculate vine layout
  const rowSpacingFeet = rowSpacing;
  const vineSpacingFeet = vineSpacing;
  
  const numberOfRows = Math.floor(width / rowSpacingFeet);
  const vinesPerRow = Math.floor(length / vineSpacingFeet);
  const totalVines = numberOfRows * vinesPerRow;
  
  // Calculate material requirements
const materials = calculateMaterials(numberOfRows, vinesPerRow, length, rowSpacingFeet, shape);
  
  return {
    dimensions: { width, length, totalSqft },
    vineLayout: { numberOfRows, vinesPerRow, totalVines, vinesPerAcre: totalVines / acres },
    materials,
    spacing: { vine: vineSpacingFeet, row: rowSpacingFeet }
  };
};

const calculateMaterials = (rows, vinesPerRow, length, rowSpacing, shape) => {
  // Posts: End posts (2 per row) + Middle posts (every 20-24 feet)
  const endPosts = rows * 2;
  const postSpacing = 24; // feet between line posts
  const linePostsPerRow = Math.max(0, Math.floor(length / postSpacing) - 1);
  const linePosts = rows * linePostsPerRow;
  const totalPosts = endPosts + linePosts;
  
  // Earth anchors (typically 1 per row end, so 2 per row)
  const earthAnchors = rows * 2;
  
  // Wire: 3 wires per row (typical trellis system)
  const wiresPerRow = 3;
  const wireLength = rows * length * wiresPerRow; // feet
  
  // Drip irrigation: 1 line per row
  const dripTubingLength = rows * length; // feet
  const dripEmitters = vinesPerRow * rows; // 1 per vine
  
  // Hardware estimates
  const wireClips = totalPosts * wiresPerRow * 2; // 2 clips per wire per post
  const eyeBolts = endPosts * wiresPerRow; // eye bolts for end posts
  const staples = linePosts * wiresPerRow * 2; // staples for line posts
  
  // Trellis hardware
  const tensioners = rows * wiresPerRow; // 1 per wire per row
  const anchoreRings = earthAnchors;
  
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
      anchoreRings,
      description: "Wire clips, eye bolts, staples, tensioners, anchor rings"
    }
  };
};

// Cost estimation based on materials
export const calculateMaterialCosts = (materials, customPrices = {}) => {
  const defaultPrices = {
    endPost: 25,        // $ per post (treated wood)
    linePost: 15,       // $ per post
    earthAnchor: 45,    // $ per anchor
    wirePerFoot: 0.75,  // $ per foot
    dripTubingPerFoot: 0.35, // $ per foot
    emitter: 1.20,      // $ per emitter
    wireClip: 0.15,     // $ per clip
    eyeBolt: 2.50,      // $ per bolt
    staple: 0.05,       // $ per staple
    tensioner: 8.00,    // $ per tensioner
    anchorRing: 3.50,   // $ per ring
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
              (materials.hardware.anchoreRings * defaultPrices.anchorRing)
  };
};

// React component for vineyard layout visualization
export const VineyardLayoutVisualizer = ({ layout, acres }) => {
  if (!layout) return null;
  
  const { dimensions, vineLayout, materials } = layout;
  const scale = Math.min(300 / dimensions.width, 200 / dimensions.length);
  
  return (
    <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
      <h4 className="text-lg font-semibold text-green-800 mb-4">Vineyard Layout Visualization</h4>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* SVG Diagram */}
        <div className="flex-1">
          <svg 
            width="320" 
            height="220" 
            viewBox="0 0 320 220" 
            className="border border-green-300 bg-white rounded"
          >
            {/* Background */}
            <rect width="320" height="220" fill="#f0f9ff"/>
            
            {/* Vineyard plot */}
            <rect 
              x="10" 
              y="10" 
              width={dimensions.width * scale} 
              height={dimensions.length * scale}
              fill="#dcfce7" 
              stroke="#16a34a" 
              strokeWidth="2"
            />
            
            {/* Vine rows */}
            {Array.from({ length: vineLayout.numberOfRows }, (_, i) => (
              <g key={i}>
                {/* Row line */}
                <line
                  x1="10"
                  y1={10 + (i * layout.spacing.row * scale)}
                  x2={10 + dimensions.width * scale}
                  y2={10 + (i * layout.spacing.row * scale)}
                  stroke="#15803d"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                
                {/* Vine markers */}
                {Array.from({ length: Math.min(vineLayout.vinesPerRow, 20) }, (_, j) => (
                  <circle
                    key={j}
                    cx={10 + (j * layout.spacing.vine * scale)}
                    cy={10 + (i * layout.spacing.row * scale)}
                    r="1.5"
                    fill="#16a34a"
                  />
                ))}
                
                {vineLayout.vinesPerRow > 20 && (
                  <text
                    x={10 + dimensions.width * scale - 40}
                    y={10 + (i * layout.spacing.row * scale) + 3}
                    fontSize="8"
                    fill="#15803d"
                  >
                    ...{vineLayout.vinesPerRow} vines
                  </text>
                )}
              </g>
            ))}
            
            {/* Dimensions labels */}
            <text x="10" y="200" fontSize="10" fill="#374151">
              {Math.round(dimensions.width)}' × {Math.round(dimensions.length)}'
            </text>
            <text x="10" y="215" fontSize="10" fill="#374151">
              {acres} acres • {vineLayout.totalVines} vines
            </text>
          </svg>
        </div>
        
        {/* Layout Stats */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-800">Dimensions:</span>
              <div>{Math.round(dimensions.width)}' × {Math.round(dimensions.length)}'</div>
            </div>
            <div>
              <span className="font-medium text-green-800">Total Vines:</span>
              <div>{vineLayout.totalVines.toLocaleString()}</div>
            </div>
            <div>
              <span className="font-medium text-green-800">Rows:</span>
              <div>{vineLayout.numberOfRows} rows</div>
            </div>
            <div>
              <span className="font-medium text-green-800">Vines/Row:</span>
              <div>{vineLayout.vinesPerRow}</div>
            </div>
            <div>
              <span className="font-medium text-green-800">Vine Density:</span>
              <div>{Math.round(vineLayout.vinesPerAcre)} vines/acre</div>
            </div>
            <div>
              <span className="font-medium text-green-800">Spacing:</span>
              <div>{layout.spacing.vine}' × {layout.spacing.row}'</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component for vineyard layout configuration
export const VineyardLayoutConfig = ({ acres, onLayoutChange, currentLayout }) => {
  const [spacingOption, setSpacingOption] = useState("6x10");
  const [customVineSpacing, setCustomVineSpacing] = useState(6);
  const [customRowSpacing, setCustomRowSpacing] = useState(10);
  const [shape, setShape] = useState("rectangle");
  const [aspectRatio, setAspectRatio] = useState(2);
  
  const selectedSpacing = VINE_SPACING_OPTIONS.find(opt => opt.key === spacingOption);
  const isCustom = spacingOption === "custom";
  
  const vineSpacing = isCustom ? customVineSpacing : selectedSpacing.vine;
  const rowSpacing = isCustom ? customRowSpacing : selectedSpacing.row;
  
  const layout = useMemo(() => {
    if (acres > 0 && vineSpacing > 0 && rowSpacing > 0) {
      return calculateVineyardLayout(acres, vineSpacing, rowSpacing, shape, aspectRatio);
    }
    return null;
  }, [acres, vineSpacing, rowSpacing, shape, aspectRatio]);
  
  const materialCosts = useMemo(() => {
    if (layout) {
      return calculateMaterialCosts(layout.materials);
    }
    return null;
  }, [layout]);
  
  // Notify parent component of layout changes
  React.useEffect(() => {
    if (layout && materialCosts && onLayoutChange) {
      onLayoutChange(layout, materialCosts);
    }
  }, [layout, materialCosts, onLayoutChange]);
  
  return (
    <div className="space-y-6">
      {/* Spacing Configuration */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Vine Spacing Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Spacing Pattern
              </label>
              <select
                value={spacingOption}
                onChange={(e) => setSpacingOption(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {VINE_SPACING_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} {opt.vinesPerAcre > 0 && `(${opt.vinesPerAcre} vines/acre)`}
                  </option>
                ))}
              </select>
            </div>
            
            {isCustom && (
              <>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Vine Spacing (feet)
                  </label>
                  <Input
                    type="number"
                    min="4"
                    max="12"
                    step="0.5"
                    value={customVineSpacing}
                    onChange={(e) => setCustomVineSpacing(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Row Spacing (feet)
                  </label>
                  <Input
                    type="number"
                    min="6"
                    max="16"
                    step="0.5"
                    value={customRowSpacing}
                    onChange={(e) => setCustomRowSpacing(Number(e.target.value))}
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Vineyard Shape
              </label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {VINEYARD_SHAPES.map(shapeOpt => (
                  <option key={shapeOpt.key} value={shapeOpt.key}>
                    {shapeOpt.label}
                  </option>
                ))}
              </select>
            </div>
            
            {shape !== "square" && (
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Length:Width Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {VINEYARD_SHAPES.find(s => s.key === shape)?.aspectRatios.map(ratio => (
                    <option key={ratio} value={ratio}>
                      {ratio}:1 {ratio === 1 ? "(Square)" : ratio === 1.5 ? "(Moderate)" : ratio >= 2.5 ? "(Long)" : "(Wide)"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Layout Visualization */}
      {layout && <VineyardLayoutVisualizer layout={layout} acres={acres} />}
      
      {/* Material Requirements */}
      {layout && materialCosts && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Material Requirements & Costs</h3>
            
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};