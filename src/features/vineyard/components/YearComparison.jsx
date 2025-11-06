import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function YearComparison({ currentYearData, previousYearData }) {
  if (!currentYearData || !previousYearData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Year-over-Year Comparison</h3>
        <p className="text-sm text-gray-500">Historical data not available</p>
      </div>
    );
  }

  // Calculate totals and averages
  const currentTotal = currentYearData.reduce((sum, d) => sum + d.etc, 0);
  const previousTotal = previousYearData.reduce((sum, d) => sum + d.etc, 0);

  const currentAvg = currentTotal / currentYearData.length;
  const previousAvg = previousTotal / previousYearData.length;

  // Calculate changes
  const totalChange = currentTotal - previousTotal;
  const totalChangePercent = (totalChange / previousTotal) * 100;

  const avgChange = currentAvg - previousAvg;
  const avgChangePercent = (avgChange / previousAvg) * 100;

  // Determine trend
  const getTrendIcon = (change) => {
    if (change > 2) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (change < -2) return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (change) => {
    if (change > 2) return 'text-red-600';
    if (change < -2) return 'text-green-600';
    return 'text-gray-600';
  };

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900">Year-over-Year Comparison</h3>
      </div>

      {/* Main Comparison Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Current Year */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">{currentYear} (Current)</div>
          <div className="text-2xl font-bold text-blue-900">{currentTotal.toFixed(1)} mm</div>
          <div className="text-xs text-blue-700 mt-1">Avg: {currentAvg.toFixed(2)} mm/day</div>
        </div>

        {/* Previous Year */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">{previousYear}</div>
          <div className="text-2xl font-bold text-gray-900">{previousTotal.toFixed(1)} mm</div>
          <div className="text-xs text-gray-700 mt-1">Avg: {previousAvg.toFixed(2)} mm/day</div>
        </div>
      </div>

      {/* Change Indicators */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        {/* Total Change */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTrendIcon(totalChangePercent)}
            <span className="text-sm text-gray-700">Total ET Change</span>
          </div>
          <div className="text-right">
            <div className={`text-base font-semibold ${getTrendColor(totalChangePercent)}`}>
              {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(1)} mm
            </div>
            <div className={`text-xs ${getTrendColor(totalChangePercent)}`}>
              {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Average Change */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTrendIcon(avgChangePercent)}
            <span className="text-sm text-gray-700">Daily Avg Change</span>
          </div>
          <div className="text-right">
            <div className={`text-base font-semibold ${getTrendColor(avgChangePercent)}`}>
              {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)} mm/day
            </div>
            <div className={`text-xs ${getTrendColor(avgChangePercent)}`}>
              {avgChangePercent >= 0 ? '+' : ''}{avgChangePercent.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3">
        <div className="text-xs font-semibold text-gray-900 mb-2">What This Means</div>
        <div className="text-xs text-gray-700 space-y-1">
          {Math.abs(totalChangePercent) < 5 ? (
            <p>✓ ET levels are similar to last year - conditions are consistent</p>
          ) : totalChangePercent > 0 ? (
            <>
              <p>↑ Higher ET this year indicates:</p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>Warmer/drier conditions, OR</li>
                <li>Increased vine canopy size, OR</li>
                <li>Higher water demand</li>
              </ul>
            </>
          ) : (
            <>
              <p>↓ Lower ET this year indicates:</p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>Cooler/wetter conditions, OR</li>
                <li>Reduced canopy or stress, OR</li>
                <li>Lower water demand</li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
