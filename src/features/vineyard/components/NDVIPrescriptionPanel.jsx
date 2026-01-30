import React, { useState, useMemo } from 'react';
import { Leaf, Droplet, Bug, ChevronDown, Download, Settings } from 'lucide-react';
import {
  generatePrescription,
  downloadPrescriptionGeoJSON,
  getPrescriptionColor,
  DEFAULT_THRESHOLDS
} from '@/shared/lib/prescriptionMaps';

/**
 * NDVI Prescription Panel - Generate actionable zones from NDVI data
 */
export function NDVIPrescriptionPanel({
  block,
  zones,
  ndviData,
  mode = 'ndvi', // 'ndvi' | 'delta'
  deltaRaster,
  onPrescriptionGenerated
}) {
  const [strategy, setStrategy] = useState('irrigation');
  const [showSettings, setShowSettings] = useState(false);
  const [customThresholds, setCustomThresholds] = useState(DEFAULT_THRESHOLDS);
  const [prescription, setPrescription] = useState(null);

  const strategies = [
    { id: 'irrigation', label: 'Irrigation', icon: Droplet, color: 'blue' },
    { id: 'spray', label: 'Spray', icon: Bug, color: 'orange' },
    { id: 'fertilizer', label: 'Fertilizer', icon: Leaf, color: 'green' }
  ];

  // Generate prescription when inputs change
  const handleGenerate = () => {
    if (!zones?.length && !ndviData?.rasterData) {
      alert('No NDVI data available to generate prescription');
      return;
    }

    const result = generatePrescription({
      zones,
      rasterData: mode === 'delta' && deltaRaster ? deltaRaster : ndviData?.rasterData,
      ndviData,
      mode,
      strategy,
      thresholds: customThresholds,
      block
    });

    setPrescription(result);

    if (onPrescriptionGenerated) {
      onPrescriptionGenerated(result);
    }
  };

  const handleExport = () => {
    if (!prescription) {
      alert('Generate a prescription first');
      return;
    }
    downloadPrescriptionGeoJSON(prescription, block);
  };

  // Format acres display
  const formatAcres = (acres) => {
    if (!acres && acres !== 0) return 'N/A';
    return acres.toFixed(1);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm text-gray-700">Prescription Map</span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Strategy Selection */}
        <div className="flex gap-1">
          {strategies.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setStrategy(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                strategy === id
                  ? `bg-${color}-100 text-${color}-700 border border-${color}-300`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Settings Panel (collapsed by default) */}
        {showSettings && (
          <div className="bg-gray-50 rounded p-2 space-y-2 text-xs">
            <div className="font-medium text-gray-700">Thresholds ({mode})</div>
            {mode === 'ndvi' ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500">Low (&lt;)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={customThresholds.ndvi.low}
                    onChange={(e) => setCustomThresholds({
                      ...customThresholds,
                      ndvi: { ...customThresholds.ndvi, low: parseFloat(e.target.value) }
                    })}
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-gray-500">High (&gt;)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={customThresholds.ndvi.high}
                    onChange={(e) => setCustomThresholds({
                      ...customThresholds,
                      ndvi: { ...customThresholds.ndvi, high: parseFloat(e.target.value) }
                    })}
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500">Decline (&lt;)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customThresholds.delta.decline}
                    onChange={(e) => setCustomThresholds({
                      ...customThresholds,
                      delta: { ...customThresholds.delta, decline: parseFloat(e.target.value) }
                    })}
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-gray-500">Improve (&gt;)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customThresholds.delta.improve}
                    onChange={(e) => setCustomThresholds({
                      ...customThresholds,
                      delta: { ...customThresholds.delta, improve: parseFloat(e.target.value) }
                    })}
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!zones?.length && !ndviData?.rasterData}
          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate Prescription
        </button>

        {/* Results */}
        {prescription && (
          <div className="space-y-2">
            {/* Summary Card */}
            <div className="bg-gray-50 rounded p-2">
              <div className="text-xs font-medium text-gray-700 mb-2">
                {strategy.charAt(0).toUpperCase() + strategy.slice(1)} Prescription
                <span className="text-gray-400 font-normal ml-1">
                  ({mode === 'delta' ? 'Change-based' : 'NDVI-based'})
                </span>
              </div>

              {/* Action Breakdown */}
              <div className="space-y-1.5">
                {Object.entries(prescription.summary.byAction).map(([action, data]) => (
                  <div key={action} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: getPrescriptionColor(strategy, action) }}
                    />
                    <div className="flex-1 text-xs">
                      <span className="font-medium capitalize">{action}</span>
                      <span className="text-gray-500 ml-1">({data.rate})</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatAcres(data.acres)} ac
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-xs">
                <span className="text-gray-500">Total</span>
                <span className="font-medium">{formatAcres(prescription.summary.totalAcres)} acres</span>
              </div>
            </div>

            {/* Zone Details (collapsible) */}
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                Zone Details ({prescription.zones.length})
              </summary>
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {prescription.zones.map((zone, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-1 border-b border-gray-100">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getPrescriptionColor(strategy, zone.prescription.action) }}
                    />
                    <span className="flex-1 truncate">{zone.vigorLevel}</span>
                    <span className="text-gray-500">{zone.prescription.rate}</span>
                    <span className="text-gray-400">{formatAcres(zone.acres)} ac</span>
                  </div>
                ))}
              </div>
            </details>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Prescription (GeoJSON)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NDVIPrescriptionPanel;
