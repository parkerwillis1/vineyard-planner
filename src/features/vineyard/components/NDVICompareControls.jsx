import React, { useState, useEffect } from 'react';
import { GitCompare, Calendar, Loader, ChevronDown } from 'lucide-react';

/**
 * NDVI Compare Controls - Date pickers and view mode toggle for historical comparison
 */
export function NDVICompareControls({
  enabled,
  onToggle,
  baselineDate,
  currentDate,
  onBaselineDateChange,
  onCurrentDateChange,
  viewMode, // 'baseline' | 'current' | 'delta'
  onViewModeChange,
  isLoading,
  baselineData,
  currentData
}) {
  // Default date ranges (last growing season for baseline, recent for current)
  const getDefaultDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Current: last 30 days
    const currentEnd = new Date(year, month, now.getDate());
    const currentStart = new Date(year, month, now.getDate() - 30);

    // Baseline: same period last year
    const baselineEnd = new Date(year - 1, month, now.getDate());
    const baselineStart = new Date(year - 1, month, now.getDate() - 30);

    return {
      baseline: { start: baselineStart, end: baselineEnd },
      current: { start: currentStart, end: currentEnd }
    };
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // View mode options
  const viewModes = [
    { value: 'baseline', label: 'Baseline', color: 'text-blue-600' },
    { value: 'current', label: 'Current', color: 'text-green-600' },
    { value: 'delta', label: 'Delta (Change)', color: 'text-purple-600' }
  ];

  if (!enabled) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <GitCompare className="w-4 h-4" />
        <span>Compare</span>
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-sm">Historical Comparison</span>
        </div>
        <button
          onClick={onToggle}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>

      {/* Date Pickers Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Baseline Date */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Baseline
          </label>
          <div className="flex gap-1">
            <input
              type="date"
              value={formatDateForInput(baselineDate?.start)}
              onChange={(e) => onBaselineDateChange({
                start: new Date(e.target.value),
                end: baselineDate?.end || new Date(e.target.value)
              })}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-400 self-center">-</span>
            <input
              type="date"
              value={formatDateForInput(baselineDate?.end)}
              onChange={(e) => onBaselineDateChange({
                start: baselineDate?.start || new Date(e.target.value),
                end: new Date(e.target.value)
              })}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {baselineData?.acquisitionDate && (
            <div className="text-xs text-blue-600">
              Image: {formatDateDisplay(baselineData.acquisitionDate)}
            </div>
          )}
        </div>

        {/* Current Date */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Current
          </label>
          <div className="flex gap-1">
            <input
              type="date"
              value={formatDateForInput(currentDate?.start)}
              onChange={(e) => onCurrentDateChange({
                start: new Date(e.target.value),
                end: currentDate?.end || new Date(e.target.value)
              })}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <span className="text-gray-400 self-center">-</span>
            <input
              type="date"
              value={formatDateForInput(currentDate?.end)}
              onChange={(e) => onCurrentDateChange({
                start: currentDate?.start || new Date(e.target.value),
                end: new Date(e.target.value)
              })}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          {currentData?.acquisitionDate && (
            <div className="text-xs text-green-600">
              Image: {formatDateDisplay(currentData.acquisitionDate)}
            </div>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {viewModes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onViewModeChange(mode.value)}
            disabled={mode.value === 'delta' && (!baselineData || !currentData)}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === mode.value
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            } ${mode.value === 'delta' && (!baselineData || !currentData) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader className="w-4 h-4 animate-spin" />
          <span>Loading imagery...</span>
        </div>
      )}

      {/* Delta stats summary when viewing delta */}
      {viewMode === 'delta' && baselineData && currentData && (
        <div className="text-xs text-gray-600 bg-purple-50 rounded p-2">
          <div className="font-medium text-purple-700 mb-1">
            NDVI Change (Current - Baseline)
          </div>
          <div className="text-gray-500">
            Positive (green) = improvement | Negative (red) = decline
          </div>
        </div>
      )}
    </div>
  );
}

export default NDVICompareControls;
