import React from 'react';
import { Droplet, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, CloudRain } from 'lucide-react';

export function WaterBalanceCard({ etData, irrigationEvents, rainfall = 0, blockAcres = 1 }) {
  if (!etData || !etData.summary) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Water Balance</h3>
        <p className="text-sm text-gray-500">No data available</p>
      </div>
    );
  }

  // Calculate total irrigation applied (convert gallons to mm)
  const totalGallons = irrigationEvents.reduce((sum, event) => sum + (event.totalWater || 0), 0);
  // 1 acre-inch = 27,154 gallons; 1 inch = 25.4 mm
  const irrigationMm = (totalGallons / (blockAcres * 27154)) * 25.4;

  // Get ETc from data
  const etcMm = etData.summary.totalETc || 0;

  // Calculate water balance: (Irrigation + Rainfall) - ETc
  const waterBalance = (irrigationMm + rainfall) - etcMm;
  const deficitMm = -waterBalance; // Positive means deficit, negative means surplus

  // Calculate percentage of ET requirement met
  const percentageMet = etcMm > 0 ? ((irrigationMm + rainfall) / etcMm) * 100 : 0;

  // Status determination
  let status, statusColor, statusIcon, statusBg;
  if (deficitMm > 25) {
    status = 'Critical Deficit';
    statusColor = 'text-red-600';
    statusBg = 'bg-red-50 border-red-200';
    statusIcon = <AlertTriangle className="w-5 h-5 text-red-600" />;
  } else if (deficitMm > 12) {
    status = 'Moderate Deficit';
    statusColor = 'text-orange-600';
    statusBg = 'bg-orange-50 border-orange-200';
    statusIcon = <TrendingDown className="w-5 h-5 text-orange-600" />;
  } else if (deficitMm < -12) {
    status = 'Excess Water';
    statusColor = 'text-blue-600';
    statusBg = 'bg-blue-50 border-blue-200';
    statusIcon = <TrendingUp className="w-5 h-5 text-blue-600" />;
  } else {
    status = 'Optimal';
    statusColor = 'text-green-600';
    statusBg = 'bg-green-50 border-green-200';
    statusIcon = <CheckCircle className="w-5 h-5 text-green-600" />;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Water Balance</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusBg}`}>
          {statusIcon}
          <span className={`text-sm font-medium ${statusColor}`}>{status}</span>
        </div>
      </div>

      {/* Main Balance Display */}
      <div className="mb-6">
        <div className="text-center mb-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {deficitMm > 0 ? 'Water Deficit' : 'Water Surplus'}
          </div>
          <div className={`text-4xl font-bold ${deficitMm > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
            {Math.abs(deficitMm).toFixed(1)}
            <span className="text-lg ml-1">mm</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            ({(Math.abs(deficitMm) / 25.4).toFixed(2)} inches)
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>ET Requirement Met</span>
            <span className="font-semibold">{percentageMet.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                percentageMet >= 90 ? 'bg-green-500' :
                percentageMet >= 70 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(percentageMet, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        {/* Crop Water Use (ETc) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-700">Crop Water Use (ETc)</span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {etcMm.toFixed(1)} mm
          </div>
        </div>

        {/* Irrigation Applied */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-sm text-gray-700">Irrigation Applied</span>
          </div>
          <div className="text-sm font-semibold text-green-600">
            +{irrigationMm.toFixed(1)} mm
          </div>
        </div>

        {/* Rainfall */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-700">Rainfall</span>
          </div>
          <div className="text-sm font-semibold text-blue-600">
            +{rainfall.toFixed(1)} mm
          </div>
        </div>

        {/* Net Balance */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Net Balance</span>
          <div className={`text-sm font-bold ${waterBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {waterBalance >= 0 ? '+' : ''}{waterBalance.toFixed(1)} mm
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded p-2">
        <strong>Formula:</strong> (Irrigation + Rainfall) - Crop ET = Water Balance
      </div>
    </div>
  );
}
