import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

export function ChemistryCards({ lot, latestReading, sensor, onCardClick }) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  const readings = [
    {
      key: 'brix',
      label: 'Brix',
      value: lot?.current_brix,
      unit: '°',
      color: 'amber'
    },
    {
      key: 'ph',
      label: 'pH',
      value: lot?.current_ph,
      unit: '',
      color: 'purple'
    },
    {
      key: 'ta',
      label: 'TA',
      value: lot?.current_ta,
      unit: ' g/L',
      color: 'blue'
    },
    {
      key: 'abv',
      label: 'ABV',
      value: lot?.current_alcohol_pct,
      unit: '%',
      color: 'rose'
    }
  ];

  // Add temperature with live sensor data if available
  const tempValue = sensor?.status === 'active' && latestReading?.temp_f
    ? latestReading.temp_f
    : lot?.current_temp_f;
  const isLive = sensor?.status === 'active' && latestReading?.temp_f;

  const colorClasses = {
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      label: 'text-amber-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      label: 'text-purple-600'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      label: 'text-blue-600'
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      label: 'text-rose-600'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      label: 'text-red-600'
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '—';
    return typeof value === 'number' ? value.toFixed(1) : value;
  };

  const lastUpdated = lot?.updated_at ? new Date(lot.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  }) : null;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Current Readings</h3>
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Learn about wine chemistry targets"
            >
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-500">Last: {lastUpdated}</span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {readings.map(({ key, label, value, unit, color }) => {
            const classes = colorClasses[color];
            return (
              <button
                key={key}
                onClick={() => onCardClick?.(key)}
                className={`${classes.bg} ${classes.border} border rounded-xl p-4 text-center transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer`}
              >
                <div className={`text-2xl sm:text-3xl font-bold ${classes.text}`}>
                  {formatValue(value)}
                </div>
                <div className={`text-xs font-medium ${classes.label} mt-1 uppercase tracking-wider`}>
                  {label}{unit && value !== null && value !== undefined && <span className="normal-case">{unit}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Temperature Row (separate, may have live indicator) */}
        {(tempValue || isLive) && (
          <div className="mt-3">
            <button
              onClick={() => onCardClick?.('temp')}
              className={`w-full ${colorClasses.red.bg} ${colorClasses.red.border} border rounded-xl p-3 flex items-center justify-between transition-all hover:shadow-md cursor-pointer`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${colorClasses.red.label} uppercase tracking-wider`}>
                  Temperature
                </span>
                {isLive && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold uppercase rounded-full">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                )}
              </div>
              <span className={`text-xl font-bold ${colorClasses.red.text}`}>
                {formatValue(tempValue)}°F
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Info Modal */}
      {showInfoModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-slate-800 to-slate-700">
              <div>
                <h2 className="text-lg font-bold text-white">Wine Chemistry Guide</h2>
                <p className="text-slate-300 text-sm">Target ranges for aging and bottling</p>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors bg-transparent border-0"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Red vs White Overview */}
              <div className="bg-gradient-to-r from-[#7C203A]/10 to-amber-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Red vs White Wine Aging</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-[#7C203A]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full bg-[#7C203A]"></div>
                      <span className="font-semibold text-gray-900">Red Wines</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1.5">
                      <li><span className="font-medium">Light reds:</span> 6-12 months</li>
                      <li><span className="font-medium">Medium reds:</span> 12-18 months</li>
                      <li><span className="font-medium">Full-bodied:</span> 18-36 months</li>
                      <li><span className="font-medium">Barrel aging:</span> Adds tannin, oak flavor</li>
                      <li><span className="font-medium">Malolactic:</span> Usually done</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full bg-amber-300"></div>
                      <span className="font-semibold text-gray-900">White Wines</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1.5">
                      <li><span className="font-medium">Crisp whites:</span> 3-6 months</li>
                      <li><span className="font-medium">Oaked whites:</span> 6-12 months</li>
                      <li><span className="font-medium">Complex whites:</span> 12-18 months</li>
                      <li><span className="font-medium">Barrel aging:</span> Optional, adds richness</li>
                      <li><span className="font-medium">Malolactic:</span> Optional</li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">Aging times vary by grape variety, winemaking style, and desired outcome. Taste regularly to assess development.</p>
              </div>

              {/* Brix */}
              <div className="border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-700 font-bold text-sm">°Bx</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Brix (Sugar Content)</h3>
                    <p className="text-xs text-gray-500">Measures residual sugar in the wine</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Start of Aging</p>
                    <p className="font-semibold text-gray-900">-2° to 2°</p>
                    <p className="text-xs text-gray-600 mt-1">Dry wines fermented to dryness</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600 mb-1">Ready for Bottling</p>
                    <p className="font-semibold text-gray-900">-1° to 1°</p>
                    <p className="text-xs text-gray-600 mt-1">Stable, no further fermentation</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">Note: Sweet wines will have higher Brix (3-15°+) depending on style.</p>
              </div>

              {/* pH */}
              <div className="border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-700 font-bold text-sm">pH</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">pH (Acidity Level)</h3>
                    <p className="text-xs text-gray-500">Affects stability, color, and microbial safety</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Red Wines</p>
                    <p className="font-semibold text-gray-900">3.4 - 3.7</p>
                    <p className="text-xs text-gray-600 mt-1">Slightly higher for softer profile</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">White Wines</p>
                    <p className="font-semibold text-gray-900">3.1 - 3.4</p>
                    <p className="text-xs text-gray-600 mt-1">Lower for freshness and stability</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">Warning: pH above 3.8 increases spoilage risk. Below 3.0 may taste too sharp.</p>
              </div>

              {/* TA */}
              <div className="border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-sm">TA</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Titratable Acidity</h3>
                    <p className="text-xs text-gray-500">Total acid content, affects taste balance</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Red Wines</p>
                    <p className="font-semibold text-gray-900">5.5 - 7.5 g/L</p>
                    <p className="text-xs text-gray-600 mt-1">May decrease slightly during MLF</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">White Wines</p>
                    <p className="font-semibold text-gray-900">6.0 - 9.0 g/L</p>
                    <p className="text-xs text-gray-600 mt-1">Higher acidity for crispness</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">pH and TA together determine perceived acidity and balance.</p>
              </div>

              {/* ABV */}
              <div className="border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                    <span className="text-rose-700 font-bold text-sm">%</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">ABV (Alcohol by Volume)</h3>
                    <p className="text-xs text-gray-500">Percentage of alcohol in the wine</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Table Wines</p>
                    <p className="font-semibold text-gray-900">12% - 15%</p>
                    <p className="text-xs text-gray-600 mt-1">Most common range</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Full-bodied Reds</p>
                    <p className="font-semibold text-gray-900">14% - 16%</p>
                    <p className="text-xs text-gray-600 mt-1">Warmer climate varietals</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">ABV should remain stable during aging. Changes may indicate refermentation.</p>
              </div>

              {/* Temperature */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <span className="text-red-700 font-bold text-sm">°F</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Temperature</h3>
                    <p className="text-xs text-gray-500">Critical for proper aging and stability</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Red Wine Aging</p>
                    <p className="font-semibold text-gray-900">55°F - 65°F</p>
                    <p className="text-xs text-gray-600 mt-1">Ideal cellar temperature</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">White Wine Aging</p>
                    <p className="font-semibold text-gray-900">45°F - 55°F</p>
                    <p className="text-xs text-gray-600 mt-1">Cooler for freshness</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">Avoid temperature fluctuations. Consistent 55°F is ideal for most wines.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
              >
                Got It
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
