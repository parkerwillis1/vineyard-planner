// VineyardLayoutCalculator.js
import React, { useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
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

// Custom vine node component
const VineNode = ({ data }) => {
  const { spacing, isEndPost, isVine, rowNumber, vineNumber } = data;
  
  if (isEndPost) {
    return (
      <div className="vine-post">
        <div 
          className="w-2 h-8 bg-amber-700 rounded-sm shadow-sm"
          title={`End post - Row ${rowNumber}`}
        />
      </div>
    );
  }
  
  if (isVine) {
    return (
      <div className="vine-plant">
        <div 
          className="w-3 h-3 bg-green-600 rounded-full shadow-sm border border-green-700"
          title={`Vine ${vineNumber} - Row ${rowNumber}`}
        />
      </div>
    );
  }
  
  return null;
};

// Custom trellis wire edge component
const TrellisWire = ({ 
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}) => {
  const edgePath = `M${sourceX},${sourceY}L${targetX},${targetY}`;
  
  return (
    <>
      <path
        id={id}
        style={{ ...style, strokeWidth: 2, stroke: '#8B4513' }}
        className="react-flow__edge-path"
        d={edgePath}
      />
    </>
  );
};

const nodeTypes = {
  vine: VineNode,
};

const edgeTypes = {
  trellis: TrellisWire,
};

// Enhanced material costs visualization
export const MaterialCostsVisualizer = ({ materialCosts, layout }) => {
  if (!materialCosts || !layout) return null;
  
  const totalCost = Object.values(materialCosts).reduce((sum, cost) => sum + cost, 0);
  
  const costBreakdown = [
    { category: 'Posts', cost: materialCosts.posts, color: 'bg-amber-500', icon: '🏗️' },
    { category: 'Trellis Wire', cost: materialCosts.wire, color: 'bg-orange-500', icon: '🔗' },
    { category: 'Irrigation', cost: materialCosts.irrigation, color: 'bg-blue-500', icon: '💧' },
    { category: 'Hardware', cost: materialCosts.hardware, color: 'bg-gray-500', icon: '🔧' },
    { category: 'Earth Anchors', cost: materialCosts.earthAnchors, color: 'bg-stone-600', icon: '⚓' },
  ].sort((a, b) => b.cost - a.cost);
  
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">Material Cost Breakdown</h3>
      
      <div className="mb-6">
        <div className="text-center mb-4">
          <span className="text-3xl font-bold text-blue-800">${totalCost.toLocaleString()}</span>
          <p className="text-gray-600">Total Material Cost</p>
        </div>
        
        <div className="space-y-3">
          {costBreakdown.map((item, index) => {
            const percentage = (item.cost / totalCost) * 100;
            return (
              <div key={item.category} className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.category}</span>
                    <span className="font-semibold">${item.cost.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(1)}% of total cost
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
        <div>
          <span className="text-gray-600">Cost per vine:</span>
          <span className="ml-2 font-medium">${(totalCost / layout.vineLayout.totalVines).toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-600">Cost per acre:</span>
          <span className="ml-2 font-medium">${(totalCost / layout.dimensions.totalSqft * 43560).toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};

// Simplified vineyard layout visualization (temporarily removing React Flow)
export const VineyardLayoutVisualizer = ({ layout, acres }) => {
  if (!layout) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-200">
        <p className="text-gray-600 text-center">Configure your vineyard layout to see visualization</p>
      </div>
    );
  }
  
  const { dimensions, vineLayout, spacing } = layout;
  const scale = Math.min(400 / dimensions.width, 300 / dimensions.length);
  
  return (
    <div className="bg-white p-6 rounded-lg border-2 border-green-200 shadow-lg">
      <div className="mb-4">
        <h4 className="text-xl font-semibold text-green-800 mb-2">
          Vineyard Layout Visualization
        </h4>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>📐 {Math.round(dimensions.width)}' × {Math.round(dimensions.length)}'</span>
          <span>🍇 {vineLayout.totalVines.toLocaleString()} vines</span>
          <span>📏 {spacing.vine}' × {spacing.row}' spacing</span>
          <span>🚜 {vineLayout.numberOfRows} rows</span>
        </div>
      </div>
      
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-green-50">
        <svg 
          width="100%" 
          height="350" 
          viewBox={`0 0 ${Math.max(400, dimensions.width * scale)} ${Math.max(300, dimensions.length * scale)}`}
          className="bg-green-50"
        >
          {/* Background */}
          <rect 
            width="100%" 
            height="100%" 
            fill="#f0fdf4"
          />
          
          {/* Vineyard boundary */}
          <rect 
            x="20" 
            y="20" 
            width={dimensions.width * scale} 
            height={dimensions.length * scale}
            fill="#dcfce7" 
            stroke="#16a34a" 
            strokeWidth="2"
            rx="4"
          />
          
          {/* Vine rows */}
          {Array.from({ length: vineLayout.numberOfRows }, (_, i) => (
            <g key={i}>
              {/* Row guidelines */}
              <line
                x1="20"
                y1={20 + (i * spacing.row * scale)}
                x2={20 + dimensions.width * scale}
                y2={20 + (i * spacing.row * scale)}
                stroke="#15803d"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.6"
              />
              
              {/* End posts */}
              <rect
                x="15"
                y={15 + (i * spacing.row * scale)}
                width="4"
                height="10"
                fill="#8B4513"
                rx="1"
              />
              <rect
                x={21 + dimensions.width * scale}
                y={15 + (i * spacing.row * scale)}
                width="4"
                height="10"
                fill="#8B4513"
                rx="1"
              />
              
              {/* Trellis wire */}
              <line
                x1="17"
                y1={20 + (i * spacing.row * scale)}
                x2={23 + dimensions.width * scale}
                y2={20 + (i * spacing.row * scale)}
                stroke="#8B4513"
                strokeWidth="2"
              />
              
              {/* Vine markers - show up to 25 per row to avoid overcrowding */}
              {Array.from({ length: Math.min(vineLayout.vinesPerRow, 25) }, (_, j) => (
                <circle
                  key={j}
                  cx={20 + (j * spacing.vine * scale)}
                  cy={20 + (i * spacing.row * scale)}
                  r="2"
                  fill="#16a34a"
                  stroke="#15803d"
                  strokeWidth="0.5"
                />
              ))}
              
              {/* Show count if more vines than displayed */}
              {vineLayout.vinesPerRow > 25 && (
                <text
                  x={20 + dimensions.width * scale - 60}
                  y={25 + (i * spacing.row * scale)}
                  fontSize="10"
                  fill="#15803d"
                  fontWeight="500"
                >
                  {vineLayout.vinesPerRow} vines
                </text>
              )}
            </g>
          ))}
          
          {/* Dimensions labels */}
          <text x="20" y={40 + dimensions.length * scale} fontSize="12" fill="#374151" fontWeight="500">
            {Math.round(dimensions.width)}' × {Math.round(dimensions.length)}' ({acres} acres)
          </text>
        </svg>
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded-full border border-green-700"></div>
          <span>Vine Plants</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-amber-700 rounded-sm"></div>
          <span>End Posts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-amber-700"></div>
          <span>Trellis Wire</span>
        </div>
        <div className="text-gray-600">
          Scalable SVG diagram
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <h5 className="font-medium text-green-800 mb-2">Layout Statistics</h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-green-700">Density:</span>
            <span className="ml-1 font-medium">{Math.round(vineLayout.vinesPerAcre)} vines/acre</span>
          </div>
          <div>
            <span className="text-green-700">Total Area:</span>
            <span className="ml-1 font-medium">{acres} acres</span>
          </div>
          <div>
            <span className="text-green-700">Row Length:</span>
            <span className="ml-1 font-medium">{Math.round(dimensions.length)}'</span>
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
      
      {/* Enhanced Material Costs */}
      {layout && materialCosts && <MaterialCostsVisualizer materialCosts={materialCosts} layout={layout} />}
      
      {/* Detailed Material Requirements */}
      {layout && materialCosts && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Detailed Material Requirements</h3>
            
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