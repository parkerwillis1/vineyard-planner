import React from 'react';
import { Wine, Grape, Sparkles, Warehouse, BarChart3, FlaskConical, Thermometer, Container } from 'lucide-react';
import { Section, Subsection, Callout } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function ProductionOverview() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-rose-600 rounded-xl flex items-center justify-center">
            <Wine className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Winery Production</h1>
            <p className="text-lg text-gray-600 mt-1">Track wine from crush to bottle</p>
          </div>
        </div>
      </div>

      <Callout type="note" title="Professional Tier Feature">
        Winery Production requires the Professional subscription tier. This comprehensive system manages your entire winemaking process from harvest intake through bottling.
      </Callout>

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Winery Production module provides a complete cellar management system for tracking wine lots,
          fermentations, vessels, lab chemistry, aging, blending, and bottling operations.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Integrated with IoT sensors for real-time temperature monitoring and automated alerts during
          critical fermentation stages.
        </p>
      </Section>

      <Section title="Key Features">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all">
            <Grape className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Harvest Intake</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Record incoming fruit with weights, brix, pH, TA, and source information. Create production lots and assign to vessels.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all">
            <Sparkles className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fermentation Tracking</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Monitor active fermentations with daily logs, temperature tracking, and fermentation timers. Set profiles for optimal temperature ranges.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all">
            <Thermometer className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">IoT Sensor Integration</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Connect unlimited temperature sensors to tanks and barrels. Real-time monitoring with customizable alerts for out-of-range temperatures.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all">
            <Container className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vessel Management</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Track tanks, barrels, totes, and other containers. Monitor capacity, contents, and cleaning schedules.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all">
            <FlaskConical className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lab Chemistry</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Record lab tests for alcohol, pH, TA, SO2, malic acid, VA, and more. Track results over time with charting.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all">
            <Warehouse className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aging Management</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Monitor barrel aging with topping schedules, racking dates, and oak regimen tracking.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all">
            <BarChart3 className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Visualize production metrics, lot histories, and vessel utilization with comprehensive dashboards.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all">
            <Wine className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Blending & Bottling</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Create blend trials, calculate components, and manage bottling runs with label tracking.</p>
          </div>
        </div>
      </Section>

      <Section title="Getting Started">
        <Subsection title="1. Set Up Vessels">
          <p className="text-gray-700 mb-4">
            Start by adding your production containers (tanks, barrels, totes) in the Vessels section.
            Include capacity, type, and location information.
          </p>
        </Subsection>

        <Subsection title="2. Record Harvest Intake">
          <p className="text-gray-700 mb-4">
            As fruit arrives, create harvest lots with weights, chemistry, and source information.
            Assign lots to vessels for fermentation or aging.
          </p>
        </Subsection>

        <Subsection title="3. Monitor Fermentations">
          <p className="text-gray-700 mb-4">
            Track active fermentations with the Fermentation Tracker. Log daily temperatures, brix readings,
            and punch-downs or pump-overs.
          </p>
        </Subsection>

        <Subsection title="4. Connect Sensors (Optional)">
          <p className="text-gray-700 mb-4">
            For automated monitoring, connect temperature sensors to your tanks. See the{' '}
            <a href="/docs/production/sensors" className="text-purple-600 hover:text-purple-700 font-medium">
              IoT Sensors documentation
            </a>{' '}
            for setup instructions.
          </p>
        </Subsection>
      </Section>

      <Section title="Production Workflow">
        <div className="bg-gradient-to-r from-purple-50 to-rose-50 rounded-lg p-6 border border-purple-200">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Harvest Intake</h4>
                <p className="text-sm text-gray-700">Receive fruit, record weights and chemistry, create lots</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Primary Fermentation</h4>
                <p className="text-sm text-gray-700">Monitor temperature, brix, cap management, 10-21 days</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Press & Settle</h4>
                <p className="text-sm text-gray-700">Press wine off skins, settle free-run and press fractions</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Aging</h4>
                <p className="text-sm text-gray-700">Barrel or tank aging, racking, topping, SO₂ management</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">5</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Blending</h4>
                <p className="text-sm text-gray-700">Create trials, finalize blend recipe, assemble final lot</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">6</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Bottling</h4>
                <p className="text-sm text-gray-700">Package finished wine, apply labels, track case goods</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Daily Fermentation Logs:</strong> Record temperature, brix, and cap management activities every day during active fermentation</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Lab Testing Schedule:</strong> Test pH, TA, and SO₂ at critical stages: post-crush, post-fermentation, pre-bottling</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Vessel Tracking:</strong> Keep vessel assignments updated as lots move through production stages</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Temperature Monitoring:</strong> Use IoT sensors for critical fermentations to catch temperature excursions 24/7</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Lot Documentation:</strong> Add detailed notes about vineyard source, yeast strain, fermentation observations</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production/sensors" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Thermometer className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">IoT Sensors</h4>
            </div>
            <p className="text-sm text-gray-600">Connect temperature sensors for real-time monitoring</p>
          </a>
          <a href="/docs/production/fermentation" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Fermentation Tracking</h4>
            </div>
            <p className="text-sm text-gray-600">Monitor active fermentations and daily logs</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
