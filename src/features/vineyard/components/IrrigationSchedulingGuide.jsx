import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Calendar, Droplets, Sun, ThermometerSun, Eye, TrendingUp } from 'lucide-react';

export function IrrigationSchedulingGuide() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-green-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-green-900 mb-1">
                Vineyard Irrigation Scheduling Guidelines
              </h3>
              <p className="text-sm text-green-800">
                Best practices for irrigation timing based on vine age, growth stage, and environmental factors
              </p>
            </div>
          </div>
          <button
            className="text-green-600 p-1 hover:bg-green-200 rounded transition-colors"
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
        <div className="px-4 pb-4 space-y-4 border-t border-green-200 pt-4">

          {/* Key Principle */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              Key Principle: Monitor, Don't Guess
            </h4>
            <p className="text-sm text-gray-700">
              <strong>Instead of a rigid calendar schedule</strong>, successful growers use a combination of monitoring methods:
              visual inspection, soil moisture sensors, weather data (ET), and plant-based measurements to determine
              the right time and amount of water.
            </p>
          </div>

          {/* Vine Age */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              Vine Age Considerations
            </h4>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-400 pl-4">
                <h5 className="font-semibold text-blue-900 mb-1">Young Vines (Years 1-2)</h5>
                <p className="text-sm text-gray-700 mb-2">
                  Need <strong>frequent, shallow watering</strong> to establish root systems.
                </p>
                <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                  <li>Typical: 0.5-1 inch (5-10 gallons) per week</li>
                  <li>Focus on building a healthy root system</li>
                  <li>Monitor closely to avoid drought stress</li>
                </ul>
              </div>

              <div className="border-l-4 border-green-400 pl-4">
                <h5 className="font-semibold text-green-900 mb-1">Mature Vines (Year 3+)</h5>
                <p className="text-sm text-gray-700 mb-2">
                  Develop deep roots and require <strong>less frequent, deep irrigation</strong>.
                </p>
                <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                  <li>Can thrive with little to no supplemental water in some regions</li>
                  <li>Focus on water quality (deficit irrigation) rather than quantity</li>
                  <li>Allow controlled stress for better fruit quality</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Growth Stage Guidelines */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-600" />
              Growth Stage Water Strategy
            </h4>
            <div className="space-y-3 text-sm">

              <div className="bg-blue-50 rounded p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                  <div>
                    <h5 className="font-semibold text-gray-900">Budbreak to Flowering/Fruit Set</h5>
                    <p className="text-gray-700 mt-1">
                      <strong>Avoid water stress</strong> during this critical period to ensure:
                    </p>
                    <ul className="ml-4 mt-1 space-y-0.5 list-disc text-gray-700">
                      <li>Good vine growth and shoot development</li>
                      <li>Successful fruit set</li>
                      <li>Strong canopy establishment</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1 flex-shrink-0"></div>
                  <div>
                    <h5 className="font-semibold text-gray-900">Fruit Set to Veraison (Berry Softening)</h5>
                    <p className="text-gray-700 mt-1">
                      <strong>Mild water stress</strong> (regulated deficit irrigation) can be beneficial:
                    </p>
                    <ul className="ml-4 mt-1 space-y-0.5 list-disc text-gray-700">
                      <li>Limits excessive vegetative growth</li>
                      <li>Results in smaller berries with higher skin-to-pulp ratio</li>
                      <li>Enhances color, tannins, and overall fruit quality</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mt-1 flex-shrink-0"></div>
                  <div>
                    <h5 className="font-semibold text-gray-900">Veraison to Harvest</h5>
                    <p className="text-gray-700 mt-1">
                      <strong>Very mild stress</strong> with strategic cut-off:
                    </p>
                    <ul className="ml-4 mt-1 space-y-0.5 list-disc text-gray-700">
                      <li>Early irrigation cut-off (2-6 weeks before harvest depending on soil)</li>
                      <li>Stops shoot growth and encourages cane maturity</li>
                      <li>Prevents berries from cracking due to sudden re-watering</li>
                      <li>Concentrates sugars and flavors</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                  <div>
                    <h5 className="font-semibold text-gray-900">Post-Harvest</h5>
                    <p className="text-gray-700 mt-1">
                      <strong>Replenish soil moisture</strong>, especially in dry climates:
                    </p>
                    <ul className="ml-4 mt-1 space-y-0.5 list-disc text-gray-700">
                      <li>Prevents vine weakening going into dormancy</li>
                      <li>Restores carbohydrate reserves</li>
                      <li>Prepares vines for winter and next season</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Factors */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4 text-orange-600" />
              Environmental Factors
            </h4>
            <div className="space-y-3 text-sm">

              <div className="flex items-start gap-3">
                <ThermometerSun className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-semibold text-gray-900">Climate & Weather</h5>
                  <p className="text-gray-700 mt-1">
                    Hot, dry, and windy conditions increase evapotranspiration rates, requiring more water.
                    Always monitor rainfall and factor it into your irrigation schedule.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-amber-700 font-bold mt-0.5 flex-shrink-0">⛰️</div>
                <div>
                  <h5 className="font-semibold text-gray-900">Soil Type</h5>
                  <div className="text-gray-700 mt-1 space-y-2">
                    <div>
                      <strong>Sandy Soils:</strong> Hold less water, need more frequent but shorter irrigations
                    </div>
                    <div>
                      <strong>Clay Soils:</strong> Hold more water, can go longer between irrigations but need deeper watering
                    </div>
                    <div>
                      <strong>Loamy Soils:</strong> Ideal balance, moderate frequency and depth
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-purple-600 font-bold mt-0.5 flex-shrink-0">🍷</div>
                <div>
                  <h5 className="font-semibold text-gray-900">Desired Wine Style</h5>
                  <p className="text-gray-700 mt-1">
                    Different wine styles may require different levels of controlled water stress to achieve
                    specific sugar, acid, and flavor profiles. Premium wines often benefit from more deficit irrigation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Monitoring Methods */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-600" />
              Monitoring Methods
            </h4>
            <div className="grid gap-3 text-sm">

              <div className="border border-gray-200 rounded p-3">
                <h5 className="font-semibold text-gray-900 mb-1">1. Visual Inspection</h5>
                <p className="text-gray-700">
                  Observe vine vigor, shoot growth, and signs of water stress (drooping tendrils, yellowing leaves).
                  The most practical daily check.
                </p>
              </div>

              <div className="border border-gray-200 rounded p-3">
                <h5 className="font-semibold text-gray-900 mb-1">2. Soil Moisture Monitoring</h5>
                <p className="text-gray-700">
                  Use tensiometers, gypsum blocks, or soil moisture sensors to check water content in the root zone
                  (ideally 18-36 inches deep). Provides objective data.
                </p>
              </div>

              <div className="border border-gray-200 rounded p-3">
                <h5 className="font-semibold text-gray-900 mb-1">3. Weather Data (ET Method)</h5>
                <p className="text-gray-700">
                  Use weather station data for evapotranspiration estimates to calculate daily water loss from the vineyard.
                  The "checkbook" method tracks water in vs. water out.
                </p>
              </div>

              <div className="border border-gray-200 rounded p-3">
                <h5 className="font-semibold text-gray-900 mb-1">4. Plant-Based Monitoring</h5>
                <p className="text-gray-700">
                  Measure plant water status using pressure chambers or porometers. Most accurate but requires
                  specialized equipment and training.
                </p>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-green-600" />
              Best Practices
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <strong>Use Drip Irrigation:</strong> Delivers water directly to root zone with 90-95% efficiency,
                  avoids wetting canopy (which can encourage disease)
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <strong>Water Deeply and Thoroughly:</strong> Ensure water reaches the entire root zone
                  (typically 18-36 inches deep for mature vines)
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <strong>Water at Night/Early Morning:</strong> Minimizes evaporation loss and takes advantage
                  of lower wind speeds
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <strong>Adjust for Deficit Irrigation:</strong> If practicing deficit irrigation for quality,
                  use care to avoid excessive stress that could reduce yield or injure vines
                </div>
              </li>
            </ul>
          </div>

          {/* Summary Note */}
          <div className="bg-blue-900 text-blue-50 rounded-lg p-3 text-xs">
            <strong>Remember:</strong> A successful irrigation schedule is highly variable and depends on multiple factors.
            The guidelines above are general recommendations. Always adjust based on your specific vineyard conditions,
            actual soil moisture measurements, and your quality goals (table grapes vs. wine grapes, style preferences).
          </div>
        </div>
      )}
    </div>
  );
}
