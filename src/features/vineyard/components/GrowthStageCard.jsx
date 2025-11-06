import React from 'react';
import { Leaf, Target, TrendingUp, Info } from 'lucide-react';

// Growth stage definitions for grapes
const GROWTH_STAGES = {
  dormant: {
    name: 'Dormant',
    months: [11, 0, 1, 2], // Dec, Jan, Feb, Mar
    kc: 0.30,
    targetETRange: [0.5, 1.5],
    description: 'Vines are dormant, minimal water needed',
    managementTip: 'Minimal irrigation required. Focus on pruning and vineyard prep.',
    color: 'gray'
  },
  budbreak: {
    name: 'Budbreak',
    months: [3], // April
    kc: 0.45,
    targetETRange: [1.5, 2.5],
    description: 'Buds are swelling and breaking',
    managementTip: 'Begin regular irrigation. Monitor for frost risk.',
    color: 'green'
  },
  flowering: {
    name: 'Flowering',
    months: [4, 5], // May-June
    kc: 0.70,
    targetETRange: [3.0, 4.5],
    description: 'Flowering and fruit set occurring',
    managementTip: 'Maintain consistent moisture. Avoid water stress during fruit set.',
    color: 'yellow'
  },
  fruitset: {
    name: 'Fruit Development',
    months: [6, 7], // July-Aug
    kc: 0.85,
    targetETRange: [4.0, 6.0],
    description: 'Berries growing and developing',
    managementTip: 'Peak water demand period. May begin controlled deficit for wine quality.',
    color: 'orange'
  },
  veraison: {
    name: 'Veraison',
    months: [8], // September
    kc: 0.90,
    targetETRange: [4.5, 6.5],
    description: 'Berries changing color and ripening',
    managementTip: 'Moderate deficit irrigation can improve wine quality and color.',
    color: 'purple'
  },
  harvest: {
    name: 'Pre-Harvest',
    months: [9], // October
    kc: 0.75,
    targetETRange: [3.0, 5.0],
    description: 'Final ripening before harvest',
    managementTip: 'Reduce irrigation 1-2 weeks before harvest to concentrate flavors.',
    color: 'red'
  },
  postharvest: {
    name: 'Post-Harvest',
    months: [10], // November
    kc: 0.50,
    targetETRange: [2.0, 3.5],
    description: 'Post-harvest recovery',
    managementTip: 'Maintain adequate moisture for carbohydrate storage.',
    color: 'amber'
  }
};

// Color mapping
const COLOR_CLASSES = {
  gray: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    icon: 'text-gray-600'
  },
  green: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-700',
    icon: 'text-green-600'
  },
  yellow: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
    icon: 'text-yellow-600'
  },
  orange: {
    bg: 'bg-orange-100',
    border: 'border-orange-300',
    text: 'text-orange-700',
    icon: 'text-orange-600'
  },
  purple: {
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-700',
    icon: 'text-purple-600'
  },
  red: {
    bg: 'bg-red-100',
    border: 'border-red-300',
    text: 'text-red-700',
    icon: 'text-red-600'
  },
  amber: {
    bg: 'bg-amber-100',
    border: 'border-amber-300',
    text: 'text-amber-700',
    icon: 'text-amber-600'
  }
};

function getCurrentGrowthStage() {
  const month = new Date().getMonth();

  for (const [key, stage] of Object.entries(GROWTH_STAGES)) {
    if (stage.months.includes(month)) {
      return { key, ...stage };
    }
  }

  return { key: 'dormant', ...GROWTH_STAGES.dormant };
}

export function GrowthStageCard({ currentETc = 0 }) {
  const currentStage = getCurrentGrowthStage();
  const colors = COLOR_CLASSES[currentStage.color];

  // Determine if ET is in target range
  const [minTarget, maxTarget] = currentStage.targetETRange;
  const isInRange = currentETc >= minTarget && currentETc <= maxTarget;
  const isLow = currentETc < minTarget;
  const isHigh = currentETc > maxTarget;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Leaf className={`w-5 h-5 ${colors.icon}`} />
        <h3 className="text-sm font-semibold text-gray-900">Growth Stage & Water Needs</h3>
      </div>

      {/* Current Stage Badge */}
      <div className={`rounded-lg border-2 p-4 mb-4 ${colors.bg} ${colors.border}`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Current Stage</div>
            <div className={`text-2xl font-bold ${colors.text}`}>{currentStage.name}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600 mb-1">Crop Coefficient (Kc)</div>
            <div className={`text-xl font-bold ${colors.text}`}>{currentStage.kc.toFixed(2)}</div>
          </div>
        </div>
        <p className="text-sm text-gray-700">{currentStage.description}</p>
      </div>

      {/* Target ET Range */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Target ET Range</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {minTarget.toFixed(1)} - {maxTarget.toFixed(1)} mm/day
          </span>
        </div>

        {/* Visual Range Indicator */}
        <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
          {/* Target range */}
          <div
            className="absolute h-full bg-green-300"
            style={{
              left: `${(minTarget / 8) * 100}%`,
              width: `${((maxTarget - minTarget) / 8) * 100}%`
            }}
          />

          {/* Current ET marker */}
          {currentETc > 0 && (
            <div
              className="absolute top-0 h-full w-1 bg-blue-600"
              style={{ left: `${Math.min((currentETc / 8) * 100, 100)}%` }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                {currentETc.toFixed(1)} mm/day
              </div>
            </div>
          )}

          {/* Scale markers */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-xs text-gray-600">
            <span>0</span>
            <span>2</span>
            <span>4</span>
            <span>6</span>
            <span>8</span>
          </div>
        </div>

        {/* Status Message */}
        {currentETc > 0 && (
          <div className="mt-2 text-sm">
            {isInRange && (
              <div className="flex items-center gap-2 text-green-700">
                <TrendingUp className="w-4 h-4" />
                <span>Current ET is within optimal range for {currentStage.name}</span>
              </div>
            )}
            {isLow && (
              <div className="flex items-center gap-2 text-orange-700">
                <Info className="w-4 h-4" />
                <span>ET is below target - vines may not be using enough water</span>
              </div>
            )}
            {isHigh && (
              <div className="flex items-center gap-2 text-blue-700">
                <Info className="w-4 h-4" />
                <span>ET is above target - high water demand or stress</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Management Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">
          Management Tip
        </div>
        <p className="text-sm text-blue-800">{currentStage.managementTip}</p>
      </div>
    </div>
  );
}
