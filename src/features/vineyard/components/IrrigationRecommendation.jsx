import React from 'react';
import { Droplets, Clock, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

export function IrrigationRecommendation({
  deficitMm,
  blockAcres = 1,
  systemFlowRate = 50, // GPM
  forecastedET = 0, // Next 7 days
  allowedDepletionPercent = 50 // MAD - Maximum Allowed Depletion
}) {
  // Calculate recommendation based on deficit
  const calculateRecommendation = () => {
    // If surplus, no irrigation needed
    if (deficitMm <= 0) {
      return {
        needsIrrigation: false,
        urgency: 'none',
        message: 'No irrigation needed - soil moisture is adequate',
        amountMm: 0,
        amountInches: 0,
        gallons: 0,
        hours: 0
      };
    }

    // Add forecasted ET for the next 7 days
    const totalNeedMm = deficitMm + forecastedET;

    // Convert mm to inches (1 inch = 25.4mm)
    const totalNeedInches = totalNeedMm / 25.4;

    // Calculate gallons needed (1 acre-inch = 27,154 gallons)
    const gallonsNeeded = totalNeedInches * blockAcres * 27154;

    // Calculate irrigation time (hours) based on system flow rate
    const hoursNeeded = gallonsNeeded / (systemFlowRate * 60); // GPM to gallons/hour

    // Determine urgency
    let urgency, urgencyColor, urgencyBg, message, icon;
    if (deficitMm > 30) {
      urgency = 'critical';
      urgencyColor = 'text-red-700';
      urgencyBg = 'bg-red-50 border-red-300';
      message = 'Irrigate immediately - critical water stress';
      icon = <AlertCircle className="w-6 h-6 text-red-600" />;
    } else if (deficitMm > 15) {
      urgency = 'high';
      urgencyColor = 'text-orange-700';
      urgencyBg = 'bg-orange-50 border-orange-300';
      message = 'Irrigate within 24-48 hours';
      icon = <Zap className="w-6 h-6 text-orange-600" />;
    } else if (deficitMm > 8) {
      urgency = 'moderate';
      urgencyColor = 'text-yellow-700';
      urgencyBg = 'bg-yellow-50 border-yellow-300';
      message = 'Irrigation recommended within 3-5 days';
      icon = <Clock className="w-6 h-6 text-yellow-600" />;
    } else {
      urgency = 'low';
      urgencyColor = 'text-blue-700';
      urgencyBg = 'bg-blue-50 border-blue-300';
      message = 'Irrigation can wait - moisture adequate for now';
      icon = <CheckCircle2 className="w-6 h-6 text-blue-600" />;
    }

    return {
      needsIrrigation: true,
      urgency,
      urgencyColor,
      urgencyBg,
      message,
      icon,
      amountMm: totalNeedMm,
      amountInches: totalNeedInches,
      gallons: gallonsNeeded,
      hours: hoursNeeded
    };
  };

  const recommendation = calculateRecommendation();

  if (!recommendation.needsIrrigation) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-green-900 mb-1">No Irrigation Needed</h3>
            <p className="text-sm text-green-700">
              Your vineyard has adequate soil moisture. Continue monitoring ET trends.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${recommendation.urgencyBg}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {recommendation.icon}
        <div className="flex-1">
          <h3 className={`text-sm font-semibold ${recommendation.urgencyColor} uppercase tracking-wide mb-1`}>
            Irrigation Recommendation
          </h3>
          <p className={`text-base font-medium ${recommendation.urgencyColor}`}>
            {recommendation.message}
          </p>
        </div>
      </div>

      {/* Main Recommendation */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="text-center mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Apply This Week</div>
          <div className="text-4xl font-bold text-gray-900">
            {recommendation.amountInches.toFixed(2)}
            <span className="text-lg ml-1">inches</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            ({recommendation.amountMm.toFixed(1)} mm)
          </div>
        </div>

        {/* Detailed Application Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <div className="text-xs text-gray-500 mb-1">Total Water Needed</div>
            <div className="text-lg font-semibold text-gray-900">
              {(recommendation.gallons / 1000).toFixed(1)}k gal
            </div>
            <div className="text-xs text-gray-500">
              {recommendation.gallons.toLocaleString()} gallons
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Run Time @ {systemFlowRate} GPM</div>
            <div className="text-lg font-semibold text-blue-600">
              {recommendation.hours.toFixed(1)} hours
            </div>
            <div className="text-xs text-gray-500">
              {recommendation.hours > 100 ? (
                <span>Per zone - run multiple zones simultaneously</span>
              ) : (
                <span>≈ {(recommendation.hours / 24).toFixed(1)} days continuous</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between bg-white rounded px-3 py-2">
          <span className="text-gray-700">Current deficit</span>
          <span className="font-semibold text-gray-900">{deficitMm.toFixed(1)} mm</span>
        </div>
        <div className="flex items-center justify-between bg-white rounded px-3 py-2">
          <span className="text-gray-700">Forecasted ET (7 days)</span>
          <span className="font-semibold text-gray-900">{forecastedET.toFixed(1)} mm</span>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 text-xs text-gray-600 bg-white rounded p-3">
        <strong>💡 Irrigation Tips:</strong>
        <ul className="mt-2 space-y-1 ml-4 list-disc">
          <li>Irrigate early morning (4-10 AM) to minimize evaporation</li>
          <li>Split application into 2-3 cycles if possible for better infiltration</li>
          {recommendation.hours > 100 && (
            <li className="text-blue-600 font-semibold">Large vineyard: Run multiple zones simultaneously to reduce total time</li>
          )}
          {deficitMm > 40 && (
            <li className="text-amber-600">Note: Recommendation capped at 40mm - can't make up for all deficit at once</li>
          )}
          <li>Monitor soil moisture sensors to verify application</li>
          {recommendation.urgency === 'critical' && (
            <li className="text-red-600 font-semibold">⚠️ Avoid over-stressing vines - critical deficit detected</li>
          )}
        </ul>
      </div>
    </div>
  );
}
