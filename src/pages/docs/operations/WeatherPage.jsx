import React from 'react';
import { Wind, Thermometer } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export default function WeatherPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Weather Dashboard"
        subtitle="Forecasts, GDD tracking, and spray condition planning"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Weather Dashboard provides comprehensive weather data for your vineyard location.
          Track current conditions, view forecasts, accumulate Growing Degree Days (GDD), and plan
          spray applications around optimal weather windows.
        </p>
      </Section>

      <Section title="Current Conditions">
        <p className="text-gray-700 leading-relaxed mb-4">
          The dashboard shows real-time weather data:
        </p>
        <Table
          headers={['Metric', 'Description']}
          rows={[
            ['Temperature', 'Current air temperature in °F'],
            ['Humidity', 'Relative humidity percentage'],
            ['Wind Speed', 'Wind speed in mph with direction'],
            ['Precipitation', 'Current rainfall conditions'],
            ['UV Index', 'Solar radiation level'],
            ['Feels Like', 'Apparent temperature accounting for wind/humidity'],
          ]}
        />
      </Section>

      <Section title="7-Day Forecast">
        <p className="text-gray-700 leading-relaxed mb-4">
          Plan your week with the extended forecast showing:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Daily high and low temperatures</li>
          <li>Precipitation probability and amount</li>
          <li>Wind conditions for each day</li>
          <li>Weather icons for quick visual reference</li>
        </ul>
        <Callout type="tip" title="Spray Planning">
          Use the forecast to plan spray applications during optimal conditions:
          low wind (&lt;10 mph), no rain expected for 4-6 hours, and temperatures
          between 50-85°F.
        </Callout>
      </Section>

      <Section title="Hourly Forecast">
        <p className="text-gray-700 leading-relaxed mb-4">
          The hourly breakdown helps with precision timing:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Temperature by hour for the next 24-48 hours</li>
          <li>Rain probability by hour</li>
          <li>Wind speed variations throughout the day</li>
          <li>Optimal spray windows highlighted</li>
        </ul>
      </Section>

      <Section title="Growing Degree Days (GDD)">
        <p className="text-gray-700 leading-relaxed mb-4">
          Track heat accumulation to predict vine development:
        </p>

        <Subsection title="What are GDD?">
          <p className="text-gray-700 leading-relaxed mb-4">
            Growing Degree Days measure accumulated heat above a base temperature (typically 50°F for grapes).
            GDD help predict phenological stages like budbreak, bloom, veraison, and harvest timing.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-mono text-gray-700">
              Daily GDD = [(High + Low) / 2] - 50°F (if positive)
            </p>
          </div>
        </Subsection>

        <Subsection title="GDD Tracking">
          <p className="text-gray-700 leading-relaxed mb-4">
            The dashboard shows:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Season Total:</strong> Accumulated GDD from April 1st</li>
            <li><strong>Monthly Totals:</strong> GDD by month for comparison</li>
            <li><strong>Historical Comparison:</strong> This year vs. previous years</li>
            <li><strong>Variety Benchmarks:</strong> Typical GDD for ripening different varietals</li>
          </ul>
        </Subsection>

        <Subsection title="GDD Benchmarks">
          <Table
            headers={['Varietal', 'GDD to Harvest', 'Region']}
            rows={[
              ['Chardonnay', '2,200-2,500', 'Cool-Moderate'],
              ['Pinot Noir', '2,000-2,400', 'Cool-Moderate'],
              ['Merlot', '2,800-3,200', 'Moderate-Warm'],
              ['Cabernet Sauvignon', '3,000-3,500', 'Warm'],
              ['Zinfandel', '3,200-3,800', 'Warm-Hot'],
            ]}
          />
        </Subsection>
      </Section>

      <Section title="Alerts & Warnings">
        <p className="text-gray-700 leading-relaxed mb-4">
          Receive notifications for critical weather events:
        </p>
        <Table
          headers={['Alert', 'Threshold', 'Action']}
          rows={[
            ['Frost Warning', 'Below 32°F forecast', 'Enable frost protection, cover sensitive areas'],
            ['Heat Advisory', 'Above 100°F', 'Increase irrigation, monitor leaf burn'],
            ['High Wind', 'Above 20 mph', 'Postpone spraying, secure equipment'],
            ['Heavy Rain', '>1 inch expected', 'Check drainage, postpone fieldwork'],
          ]}
        />
      </Section>

      <Section title="Spray Conditions">
        <p className="text-gray-700 leading-relaxed mb-4">
          The spray conditions indicator shows optimal windows:
        </p>
        <Table
          headers={['Condition', 'Optimal', 'Marginal', 'Poor']}
          rows={[
            ['Wind', '<5 mph', '5-10 mph', '>10 mph'],
            ['Temperature', '60-80°F', '50-60°F or 80-90°F', '<50°F or >90°F'],
            ['Humidity', '40-70%', '30-40% or 70-80%', '<30% or >80%'],
            ['Rain Forecast', 'None in 6+ hrs', 'Possible in 4-6 hrs', 'Expected within 4 hrs'],
          ]}
        />
        <Callout type="warning" title="Spray Timing">
          Always check the PHI (Pre-Harvest Interval) and REI (Re-Entry Interval) for any chemical
          applications. Weather may force delays that affect your spray schedule.
        </Callout>
      </Section>

      <Section title="Data Sources">
        <p className="text-gray-700 leading-relaxed mb-4">
          Weather data is sourced from:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>National Weather Service (NWS) forecasts</li>
          <li>Your vineyard's exact GPS coordinates</li>
          <li>Connected weather stations (if configured in Hardware)</li>
          <li>Historical data from nearby weather stations</li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/operations/spray" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Wind className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Spray Records</h4>
            </div>
            <p className="text-sm text-gray-600">Log chemical applications</p>
          </a>
          <a href="/docs/operations/hardware" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Thermometer className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Hardware Integration</h4>
            </div>
            <p className="text-sm text-gray-600">Connect weather stations</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
