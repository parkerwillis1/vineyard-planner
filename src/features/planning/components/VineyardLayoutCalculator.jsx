// VineyardLayoutCalculator.js - Fixed version with Collapsible Sections
import React, { useMemo, useState, useCallback } from 'react';
import { MaterialCostsVisualizer } from "@/features/planning/components/MaterialCostsVisualizer";
import { ChevronDown } from "lucide-react";

import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';

/* --------------------------------------------------------- */
/*  Collapsible Section Component                            */
/* --------------------------------------------------------- */
function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Card className="rounded-xl shadow-sm bg-white overflow-hidden mb-6">
      {/* clickable header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-blue-50 px-6 py-4 border-b
                   focus:outline-none hover:bg-blue-100 transition-colors"
      >
        <h3 className="font-medium text-blue-700 text-lg">{title}</h3>

        {/* chevron */}
        <ChevronDown
          className={`h-5 w-5 text-blue-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* body – only rendered when open */}
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

export const VINEYARD_SHAPES = [
  { key: "rectangle", label: "Rectangle", aspectRatios: [1, 1.5, 2, 2.5, 3] },
  { key: "square", label: "Square", aspectRatios: [1] },
  { key: "l_shape", label: "L-Shape", aspectRatios: [1.5, 2] },
  { key: "irregular", label: "Irregular", aspectRatios: [1.5] }
];

// Calculate actual vineyard dimensions and material requirements
export const calculateVineyardLayout = (acres, vineSpacing, rowSpacing, shape = "rectangle", aspectRatio = 2, orientation = "horizontal") => {
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
  
  // Calculate vine layout based on orientation
  const rowSpacingFeet = rowSpacing;
  const vineSpacingFeet = vineSpacing;
  
    let numberOfRows, vinesPerRow;

    if (orientation === "vertical") {
    // Vertical: fewer rows (across width), more vines per row (down length)
    numberOfRows = Math.floor(width / rowSpacingFeet);
    vinesPerRow = Math.floor(length / vineSpacingFeet);
    } else {
    // Horizontal: more rows (down length), fewer vines per row (across width)
    numberOfRows = Math.floor(length / rowSpacingFeet);
    vinesPerRow = Math.floor(width / vineSpacingFeet);
    }

  const totalVines = numberOfRows * vinesPerRow;
  
  // Calculate material requirements based on orientation
  const rowLength = orientation === "vertical" ? length : width;
  const materials = calculateMaterials(numberOfRows, vinesPerRow, rowLength, rowSpacingFeet, shape);
  
  return {
    dimensions: { width, length, totalSqft },
    vineLayout: { numberOfRows, vinesPerRow, totalVines, vinesPerAcre: totalVines / acres },
    materials,
    spacing: { vine: vineSpacingFeet, row: rowSpacingFeet },
    orientation
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

// VINEYARD LAYOUT VISUALIZER — accurate 20ft line posts + true-scale spacing
export const VineyardLayoutVisualizer = ({ layout, acres, orientation = "horizontal" }) => {
  if (!layout) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-xl border-2 border-green-200 shadow-lg">
        <div className="text-center">
          <div className="text-6xl mb-4">🍇</div>
          <p className="text-gray-600 text-lg">Configure your vineyard layout to see visualization</p>
          <p className="text-gray-500 text-sm mt-2">Set acreage and spacing to begin planning</p>
        </div>
      </div>
    );
  }

  const { dimensions, vineLayout, spacing } = layout; // dimensions.width/length are in FEET

  // Scene scale: convert feet -> pixels so the whole parcel fits
  const maxWidthPx = 1200;
  const maxHeightPx = 800;
  const scale = Math.min(maxWidthPx / dimensions.width, maxHeightPx / dimensions.length); // px/ft

  const scaledWidth = dimensions.width * scale;   // px
  const scaledHeight = dimensions.length * scale; // px
  const padding = 80;                              // px frame padding

  // -------- spacing between rows / vines (no clamps) --------
  // Use "fit-first" but without caps, so the drawing matches the true ratio.
  let rowCenterSpacingPx;     // distance between row centers (px)
  let vineCenterSpacingPx;    // distance between vine centers within a row (px)

  if (orientation === "vertical") {
    // rows across width, vines go down the length
    rowCenterSpacingPx  = scaledWidth  / Math.max(1, vineLayout.numberOfRows);
    vineCenterSpacingPx = scaledHeight / Math.max(1, vineLayout.vinesPerRow);
  } else {
    // rows down the length, vines go across the width
    rowCenterSpacingPx  = scaledHeight / Math.max(1, vineLayout.numberOfRows);
    vineCenterSpacingPx = scaledWidth  / Math.max(1, vineLayout.vinesPerRow);
  }

  // ---------- <defs> ----------
  const defs = (
    <defs>
      <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f0fdf4" />
        <stop offset="50%" stopColor="#dcfce7" />
        <stop offset="100%" stopColor="#bbf7d0" />
      </linearGradient>
      <linearGradient id="boundaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#16a34a" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#15803d" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="postGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d2691e" />
        <stop offset="50%" stopColor="#8b4513" />
        <stop offset="100%" stopColor="#654321" />
      </linearGradient>
      <radialGradient id="vineGradient" cx="50%" cy="30%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="70%" stopColor="#16a34a" />
        <stop offset="100%" stopColor="#15803d" />
      </radialGradient>
      <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8b4513" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#a0522d" stopOpacity="1" />
        <stop offset="100%" stopColor="#8b4513" stopOpacity="0.9" />
      </linearGradient>
      <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="rgba(0,0,0,0.2)" />
      </filter>

      {/* patterns sized by current (true-scale) spacing */}
      <pattern id="vineRowPattern" patternUnits="userSpaceOnUse" width={vineCenterSpacingPx} height="20">
        <circle cx={vineCenterSpacingPx/2} cy="10" r="3.5" fill="url(#vineGradient)" />
        <circle cx={vineCenterSpacingPx/2 - 1} cy="8" r="2" fill="#22c55e" opacity="0.8" />
        <circle cx={vineCenterSpacingPx/2 + 1} cy="8" r="2" fill="#16a34a" opacity="0.7" />
        <circle cx={vineCenterSpacingPx/2 - 0.5} cy="8.5" r="1.2" fill="rgba(255,255,255,0.4)" />
      </pattern>

      <pattern id="verticalVinePattern" patternUnits="userSpaceOnUse" width="20" height={vineCenterSpacingPx}>
        <circle cx="10" cy={vineCenterSpacingPx/2} r="3.5" fill="url(#vineGradient)" />
        <circle cx="8" cy={vineCenterSpacingPx/2 - 1} r="2" fill="#22c55e" opacity="0.8" />
        <circle cx="8" cy={vineCenterSpacingPx/2 + 1} r="2" fill="#16a34a" opacity="0.7" />
        <circle cx="8.5" cy={vineCenterSpacingPx/2 - 0.5} r="1.2" fill="rgba(255,255,255,0.4)" />
      </pattern>

      <clipPath id="vineyardClip">
        <rect x={padding} y={padding} width={scaledWidth} height={scaledHeight} rx="8" />
      </clipPath>
    </defs>
  );

  return (
    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-6 rounded-xl border-2 border-green-200 shadow-xl">
      <div className="mb-6">
        <h4 className="text-2xl font-bold text-green-800 mb-3 flex items-center gap-2">🍇 Vineyard Layout Visualization</h4>
        <div className="flex flex-wrap gap-6 text-sm text-gray-700 bg-white/50 p-3 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2"><span className="text-blue-600">📐</span><span className="font-medium">{Math.round(dimensions.width)}' × {Math.round(dimensions.length)}'</span></div>
          <div className="flex items-center gap-2"><span className="text-green-600">🍇</span><span className="font-medium">{vineLayout.totalVines.toLocaleString()} vines</span></div>
          <div className="flex items-center gap-2"><span className="text-purple-600">📏</span><span className="font-medium">{spacing.vine}' × {spacing.row}' spacing</span></div>
          <div className="flex items-center gap-2"><span className="text-amber-600">🚜</span><span className="font-medium">{vineLayout.numberOfRows} rows</span></div>
          <div className="flex items-center gap-2"><span className="text-emerald-600">📊</span><span className="font-medium">{Math.round(vineLayout.vinesPerAcre)} vines/acre</span></div>
        </div>
      </div>

      <div className="bg-white/70 p-4 rounded-xl shadow-inner backdrop-blur-sm border border-green-200/50">
        <svg
          width="100%"
          height="900"
          viewBox={`0 0 ${Math.max(1200, scaledWidth + padding * 2)} ${Math.max(950, scaledHeight + padding * 2)}`}
          className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg"
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
        >
          {defs}

          <rect width="100%" height="100%" fill="url(#groundGradient)" />

          {/* title bg then text */}
          <rect x={padding + scaledWidth/2 - 60} y={padding - 45} width="120" height="20" fill="rgba(255,255,255,0.9)" rx="4" />
          <text x={padding + scaledWidth/2} y={padding - 30} fontSize="16" fill="#065f46" fontWeight="700" textAnchor="middle" fontFamily="serif">
            {acres} Acre Vineyard
          </text>

          {/* boundary */}
          <rect x={padding} y={padding} width={scaledWidth} height={scaledHeight} fill="none" stroke="url(#boundaryGradient)" strokeWidth="2" rx="8" strokeDasharray="5,3" />

          {/* ROWS */}
          {Array.from({ length: vineLayout.numberOfRows }, (_, i) => {
            let rowLengthPx, rowLengthFt, rowPosPx;

            if (orientation === "vertical") {
              // rows vertical: run along length; posts on top/bottom
              rowLengthFt = dimensions.length;      // feet
              rowLengthPx = scaledHeight;           // pixels
              const x = padding + i * rowCenterSpacingPx + rowCenterSpacingPx / 2;
              rowPosPx = { x, y: null };

              // End posts
              const start = { x: x - 4, y: padding - 25 };
              const end   = { x: x - 4, y: padding + scaledHeight + 5 };

              // Wires
              const wire = { x1: x, y1: padding - 12, x2: x, y2: padding + scaledHeight + 12 };

              // ----- MIDDLE POSTS EVERY 20 FT (by FEET) -----
              const sections = Math.max(1, Math.floor(rowLengthFt / 20));     // 20 ft spacing
              const linePostsCount = Math.max(0, sections - 1);
              const segmentPx = rowLengthPx / sections;

              return (
                <g key={i}>
                  {/* end posts */}
                  <g transform={`translate(${start.x}, ${start.y})`}>
                    <rect width="8" height="20" fill="url(#postGradient)" rx="2" filter="url(#dropShadow)"/>
                    <rect x="1" y="1" width="2" height="18" fill="rgba(255,255,255,0.3)" rx="1"/>
                  </g>
                  <g transform={`translate(${end.x}, ${end.y})`}>
                    <rect width="8" height="20" fill="url(#postGradient)" rx="2" filter="url(#dropShadow)"/>
                    <rect x="1" y="1" width="2" height="18" fill="rgba(255,255,255,0.3)" rx="1"/>
                  </g>

                  {/* line posts */}
                  {Array.from({ length: linePostsCount }, (_, p) => {
                    const py = padding + (p + 1) * segmentPx - 6;
                    return (
                      <g key={p} transform={`translate(${x - 2}, ${py})`}>
                        <rect width="4" height="12" fill="url(#postGradient)" rx="1" opacity="0.9" />
                      </g>
                    );
                  })}

                  {/* wires */}
                  {[0,1,2].map(w => (
                    <line key={w} x1={wire.x1 + w*2 - 2} y1={wire.y1} x2={wire.x2 + w*2 - 2} y2={wire.y2}
                      stroke="url(#wireGradient)" strokeWidth="2" opacity="0.8" />
                  ))}

                  {/* vines */}
                  <rect x={x - 10} y={padding + 1} width="20" height={scaledHeight - 2} fill="url(#verticalVinePattern)" opacity="0.9" clipPath="url(#vineyardClip)"/>

                  {/* labels */}
                  <text x={x + 3} y={padding - 30} fontSize="11" fill="#15803d" fontWeight="600">{vineLayout.vinesPerRow}</text>
                  <text x={x} y={padding + scaledHeight + 35} fontSize="10" fill="#6b7280" fontWeight="500" textAnchor="middle">{i + 1}</text>
                </g>
              );
            }

            // HORIZONTAL ROWS: run across width; posts left/right
            rowLengthFt = dimensions.width;   // feet
            rowLengthPx = scaledWidth;        // pixels
            const y = padding + i * rowCenterSpacingPx + rowCenterSpacingPx / 2;
            rowPosPx = { x: null, y };

            const start = { x: padding - 25, y: y - 10 };
            const end   = { x: padding + scaledWidth + 5, y: y - 10 };
            const wire  = { x1: padding - 12, y1: y, x2: padding + scaledWidth + 12, y2: y };

            // ----- MIDDLE POSTS EVERY 20 FT (by FEET) -----
            const sections = Math.max(1, Math.floor(rowLengthFt / 20));  // 20 ft spacing
            const linePostsCount = Math.max(0, sections - 1);
            const segmentPx = rowLengthPx / sections;

            return (
              <g key={i}>
                {/* end posts */}
                <g transform={`translate(${start.x}, ${start.y})`}>
                  <rect width="8" height="20" fill="url(#postGradient)" rx="2" filter="url(#dropShadow)"/>
                  <rect x="1" y="1" width="2" height="18" fill="rgba(255,255,255,0.3)" rx="1"/>
                </g>
                <g transform={`translate(${end.x}, ${end.y})`}>
                  <rect width="8" height="20" fill="url(#postGradient)" rx="2" filter="url(#dropShadow)"/>
                  <rect x="1" y="1" width="2" height="18" fill="rgba(255,255,255,0.3)" rx="1"/>
                </g>

                {/* line posts */}
                {Array.from({ length: linePostsCount }, (_, p) => {
                  const px = padding + (p + 1) * segmentPx - 2;
                  return (
                    <g key={p} transform={`translate(${px}, ${y - 6})`}>
                      <rect width="4" height="12" fill="url(#postGradient)" rx="1" opacity="0.9" />
                    </g>
                  );
                })}

                {/* wires */}
                {[0,1,2].map(w => (
                  <line key={w} x1={wire.x1} y1={wire.y1 + w*2 - 2} x2={wire.x2} y2={wire.y2 + w*2 - 2}
                    stroke="url(#wireGradient)" strokeWidth="2" opacity="0.8" />
                ))}

                {/* vines */}
                <rect x={padding + 1} y={y - 10} width={scaledWidth - 2} height="20" fill="url(#vineRowPattern)" opacity="0.9" clipPath="url(#vineyardClip)"/>

                {/* labels */}
                <text x={padding + scaledWidth + 10} y={y + 3} fontSize="11" fill="#15803d" fontWeight="600">
                  {vineLayout.vinesPerRow} vines
                </text>
                <text x={padding - 35} y={y + 3} fontSize="10" fill="#6b7280" fontWeight="500" textAnchor="middle">
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* bottom width scale */}
          <g transform={`translate(${padding}, ${padding + scaledHeight + 45})`}>
            <line x1="0" y1="0" x2={scaledWidth} y2="0" stroke="#374151" strokeWidth="1" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="#374151" strokeWidth="1" />
            <line x1={scaledWidth} y1="-3" x2={scaledWidth} y2="3" stroke="#374151" strokeWidth="1" />
            <text x={scaledWidth / 2} y="15" fontSize="12" fill="#374151" fontWeight="600" textAnchor="middle">
              {Math.round(dimensions.width)}'
            </text>
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg backdrop-blur-sm">
          <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-sm"></div>
          <span className="font-medium text-gray-700">Vine Plants</span>
        </div>
        <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg backdrop-blur-sm">
          <div className="w-3 h-6 bg-gradient-to-br from-amber-600 to-amber-800 rounded-sm shadow-sm"></div>
          <span className="font-medium text-gray-700">Posts</span>
        </div>
        <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg backdrop-blur-sm">
          <div className="w-8 h-1 bg-gradient-to-r from-amber-700 to-amber-600 rounded-full shadow-sm"></div>
          <span className="font-medium text-gray-700">Trellis Wire</span>
        </div>
        <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg backdrop-blur-sm">
          <div className="w-4 h-4 border-2 border-green-500 rounded bg-green-100"></div>
          <span className="font-medium text-gray-700">Vineyard Boundary</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 p-5 rounded-xl text-white shadow-lg">
        <h5 className="font-bold text-lg mb-3 flex items-center gap-2">📊 Layout Statistics</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
            <div className="text-green-100 text-xs uppercase tracking-wide">Density</div>
            <div className="text-xl font-bold">{Math.round(vineLayout.vinesPerAcre)}</div>
            <div className="text-green-100 text-xs">vines/acre</div>
          </div>
          <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
            <div className="text-green-100 text-xs uppercase tracking-wide">Total Area</div>
            <div className="text-xl font-bold">{acres}</div>
            <div className="text-green-100 text-xs">acres</div>
          </div>
          <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
            <div className="text-green-100 text-xs uppercase tracking-wide">Row Length</div>
            <div className="text-xl font-bold">{Math.round(dimensions.length)}'</div>
            <div className="text-green-100 text-xs">feet</div>
          </div>
          <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
            <div className="text-green-100 text-xs uppercase tracking-wide">Total Vines</div>
            <div className="text-xl font-bold">{vineLayout.totalVines.toLocaleString()}</div>
            <div className="text-green-100 text-xs">plants</div>
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
  const [rowOrientation, setRowOrientation] = useState("horizontal");

  const selectedSpacing = VINE_SPACING_OPTIONS.find(opt => opt.key === spacingOption);
  const isCustom = spacingOption === "custom";
  
  const vineSpacing = isCustom ? customVineSpacing : selectedSpacing.vine;
  const rowSpacing = isCustom ? customRowSpacing : selectedSpacing.row;
  
  const layout = useMemo(() => {
    if (acres > 0 && vineSpacing > 0 && rowSpacing > 0) {
      return calculateVineyardLayout(acres, vineSpacing, rowSpacing, shape, aspectRatio, rowOrientation);
    }
    return null;
  }, [acres, vineSpacing, rowSpacing, shape, aspectRatio, rowOrientation]); 

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
      <CollapsibleSection title="Vine Spacing Configuration" defaultOpen={true}>
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
          
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              Row Orientation
            </label>
            <select
              value={rowOrientation}
              onChange={(e) => setRowOrientation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="horizontal">Horizontal (posts on short sides)</option>
              <option value="vertical">Vertical (posts on long sides)</option>
            </select>
          </div>
        </div>
      </CollapsibleSection>
      
      {/* Layout Visualization */}
      {layout && (
        <CollapsibleSection title="Vineyard Layout Visualization" defaultOpen={true}>
          <VineyardLayoutVisualizer layout={layout} acres={acres} orientation={rowOrientation} />
        </CollapsibleSection>
      )}
      
      {/* Enhanced Material Costs */}
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
  );
};