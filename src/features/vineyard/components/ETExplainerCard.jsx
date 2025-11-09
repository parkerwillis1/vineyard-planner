import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Droplets, Sun, Leaf } from 'lucide-react';

export function ETExplainerCard({ currentET, isRealData = false }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-blue-900 mb-1">
                Understanding Evapotranspiration (ET) Data
              </h3>
              <p className="text-sm text-blue-800">
                {isRealData ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live satellite data from OpenET
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Using sample data for demonstration
                  </span>
                )}
                {' • '}
                {currentET > 0 && (
                  <span>
                    Current: <strong>{currentET.toFixed(1)} mm/day</strong>
                    {currentET >= 2 && currentET <= 6 ? ' (Normal range ✓)' : currentET < 2 ? ' (Low)' : ' (High)'}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            className="text-blue-600 p-1 hover:bg-blue-200 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-blue-200 pt-4">
          {/* What is ET? */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-600" />
              What is Evapotranspiration (ET)?
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              ET measures the total water lost from your vineyard through:
            </p>
            <div className="space-y-2 ml-4">
              <div className="flex items-start gap-2 text-sm">
                <Sun className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Evaporation:</strong> Water evaporating from soil surface
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Leaf className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Transpiration:</strong> Water released by vine leaves
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-3">
              <strong>Why it matters:</strong> ET tells you exactly how much water your vines are using daily,
              measured by satellites. This lets you irrigate precisely what they need - no guessing!
            </p>
          </div>

          {/* Is High or Low ET Good? */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600" />
              Is High or Low ET Good?
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              <strong>Neither!</strong> ET is simply a measurement of how much water your vines are using.
            </p>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-orange-600 min-w-[60px]">High ET:</span>
                <div>Plants actively growing, hot/dry weather. Means you need to <strong>irrigate MORE</strong> to meet demand.</div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600 min-w-[60px]">Low ET:</span>
                <div>Cooler weather, less active growth. Means you need to <strong>irrigate LESS</strong>.</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-amber-300 bg-white rounded p-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">What You Should Really Watch: The DEFICIT</p>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Deficit = Crop Water Use - (Irrigation + Rainfall)</strong></p>
                <ul className="ml-4 mt-2 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>Near Zero:</strong> Perfectly managed - vines getting what they need</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">!</span>
                    <span><strong>Positive (deficit):</strong> Under-irrigated - vines are stressed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">~</span>
                    <span><strong>Negative (surplus):</strong> Over-irrigated - excess vegetative growth</span>
                  </li>
                </ul>
                <p className="mt-2 text-xs text-gray-600 italic">
                  For wine grapes, some controlled water stress (small positive deficit) during certain growth stages can improve fruit quality.
                </p>
              </div>
            </div>
          </div>

          {/* Normal Ranges */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Normal ET Ranges for Grapes</h4>

            {/* Visual Range Bar */}
            <div className="relative h-12 bg-gray-200 rounded-lg mb-3 overflow-hidden">
              {/* Color zones */}
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-blue-200"></div>
                <div className="flex-[2] bg-green-200"></div>
                <div className="flex-[2] bg-yellow-200"></div>
                <div className="flex-1 bg-orange-200"></div>
                <div className="flex-1 bg-red-200"></div>
              </div>

              {/* Labels */}
              <div className="absolute inset-0 flex items-center justify-around text-xs font-semibold">
                <span className="text-blue-800">0-2</span>
                <span className="text-green-800">2-4</span>
                <span className="text-yellow-800">4-6</span>
                <span className="text-orange-800">6-8</span>
                <span className="text-red-800">8+</span>
              </div>

              {/* Current marker */}
              {currentET > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-gray-900"
                  style={{ left: `${Math.min((currentET / 10) * 100, 100)}%` }}
                >
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap font-semibold">
                    You: {currentET.toFixed(1)}
                  </div>
                </div>
              )}
            </div>

            {/* Range explanations */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400 mt-1 flex-shrink-0"></div>
                <div>
                  <strong>0-2 mm/day:</strong> Dormant season (winter) or stressed vines
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400 mt-1 flex-shrink-0"></div>
                <div>
                  <strong>2-4 mm/day:</strong> Early season (budbreak, flowering) - normal range
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400 mt-1 flex-shrink-0"></div>
                <div>
                  <strong>4-6 mm/day:</strong> Peak season (fruit development, veraison) - healthy & active
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400 mt-1 flex-shrink-0"></div>
                <div>
                  <strong>6-8 mm/day:</strong> Very hot conditions or large canopy - high water demand
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 mt-1 flex-shrink-0"></div>
                <div>
                  <strong>8+ mm/day:</strong> Extreme heat or very large canopy - monitor closely
                </div>
              </div>
            </div>
          </div>

          {/* How Recommendations Work */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">How Irrigation Recommendations Work</h4>
            <div className="text-sm text-gray-700 space-y-2">
              <p>Our recommendations are based on the <strong>water balance method</strong> used by professional agronomists:</p>
              <div className="bg-gray-50 rounded p-3 font-mono text-xs">
                Water Deficit = (Crop ET × Days) - (Irrigation + Rainfall)
              </div>
              <ul className="space-y-1.5 ml-4 list-disc">
                <li><strong>Crop ET</strong>: Satellite-measured water use × crop coefficient (Kc) for grapes</li>
                <li><strong>Kc values</strong>: Adjusted by growth stage (0.30 dormant → 0.90 peak season)</li>
                <li><strong>Deficit thresholds</strong>: Based on UC Davis research for wine grape irrigation</li>
                <li><strong>Application timing</strong>: Accounts for soil type, root depth, and stress tolerance</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
                <strong>Note:</strong> These are science-based recommendations. Always adjust based on your
                specific vineyard conditions, soil moisture sensors, and quality goals (table vs. wine grapes).
              </p>
            </div>
          </div>

          {/* Data Source Info */}
          <div className="bg-blue-900 text-blue-50 rounded-lg p-3 text-xs">
            <strong>Data Source:</strong> {isRealData ? (
              <>
                OpenET provides satellite-based ET measurements using Landsat and Sentinel imagery.
                Data is updated daily and represents actual field conditions, not estimates from weather stations.
                Learn more at <a href="https://openetdata.org" target="_blank" rel="noopener noreferrer" className="underline">openetdata.org</a>
              </>
            ) : (
              <>
                Currently showing sample data for demonstration. Connect your OpenET API to see real satellite-based
                measurements for your vineyard.
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
