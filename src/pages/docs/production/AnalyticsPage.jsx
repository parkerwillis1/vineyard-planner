import React from 'react';
import { TrendingUp, Wine, Package, Droplet, Clock } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function AnalyticsPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Production Analytics"
        subtitle="Key metrics and trend analysis"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Production Analytics dashboard provides insights into your winemaking operation. Track
          volume metrics, capacity utilization, production velocity, and breakdowns by vintage and varietal.
        </p>
      </Section>

      <Section title="Key Metrics">
        <p className="text-gray-700 leading-relaxed mb-4">
          The top metrics cards show critical production indicators:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wine className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Total Volume</h4>
            </div>
            <p className="text-sm text-gray-600">Combined volume across all lots in gallons and barrel equivalents (60 gal/barrel).</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Capacity Used</h4>
            </div>
            <p className="text-sm text-gray-600">Percentage of total vessel capacity in use, with available gallons remaining.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Volume Loss</h4>
            </div>
            <p className="text-sm text-gray-600">Average percentage of wine lost to evaporation, racking, sampling, etc.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Avg Fermentation Time</h4>
            </div>
            <p className="text-sm text-gray-600">Average days lots spend in active fermentation.</p>
          </div>
        </div>
      </Section>

      <Section title="Vintage Breakdown">
        <p className="text-gray-700 leading-relaxed mb-4">
          The vintage chart shows total volume by harvest year:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Bar chart with volume in gallons per vintage</li>
          <li>Most recent vintages displayed first</li>
          <li>Helpful for tracking inventory age</li>
        </ul>
        <Callout type="tip" title="Inventory Planning">
          Use the vintage breakdown to identify older inventory that may need to be bottled
          or blended before taking on new vintage.
        </Callout>
      </Section>

      <Section title="Varietal Breakdown">
        <p className="text-gray-700 leading-relaxed mb-4">
          See your production distributed by grape variety:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Volume in gallons per varietal</li>
          <li>Identify your dominant varieties</li>
          <li>Track production focus over time</li>
        </ul>
      </Section>

      <Section title="Production Trends">
        <p className="text-gray-700 leading-relaxed mb-4">
          Monthly production trends show:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Harvest Months:</strong> Volume received by month (shows harvest timing)</li>
          <li><strong>Production Velocity:</strong> Lots created per month</li>
          <li><strong>Seasonal Patterns:</strong> Identify busy vs. quiet periods</li>
        </ul>
      </Section>

      <Section title="Status Distribution">
        <p className="text-gray-700 leading-relaxed mb-4">
          Lot count breakdown by production status:
        </p>
        <Table
          headers={['Status', 'What It Shows']}
          rows={[
            ['Harvested', 'Fruit received, not yet processed'],
            ['Crushing', 'Currently being crushed'],
            ['Fermenting', 'Active fermentation'],
            ['Pressed', 'Post-fermentation, pre-aging'],
            ['Aging', 'In barrel or tank aging'],
            ['Blending', 'Being assembled into blends'],
            ['Filtering', 'Pre-bottling preparation'],
            ['Bottled', 'Packaged and complete'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          This gives you a quick view of where your lots are in the production pipeline.
        </p>
      </Section>

      <Section title="Capacity Metrics">
        <Subsection title="Utilization Analysis">
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Total Capacity:</strong> Sum of all vessel capacities in gallons</li>
            <li><strong>Current Volume:</strong> Total wine in production</li>
            <li><strong>Available Capacity:</strong> Room for new wine</li>
            <li><strong>Utilization %:</strong> How full your cellar is</li>
          </ul>
        </Subsection>

        <Subsection title="Planning Insights">
          <p className="text-gray-700 leading-relaxed mb-4">
            Use capacity metrics to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Plan harvest receiving capacity</li>
            <li>Decide when to bottle to free space</li>
            <li>Identify need for additional vessels</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Loss Tracking">
        <p className="text-gray-700 leading-relaxed mb-4">
          Volume loss analytics help you understand wine losses:
        </p>
        <Table
          headers={['Loss Type', 'Typical Range']}
          rows={[
            ['Fermentation', '5-10% (CO2, foam, lees)'],
            ['Racking', '1-2% per rack'],
            ['Barrel Evaporation', '2-4% per year'],
            ['Bottling', '1-3% per run'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          The system calculates loss by comparing initial volume to current volume for lots
          that have both values recorded.
        </p>
        <Callout type="note" title="Loss Benchmarking">
          Industry-average total loss from grape to bottle is typically 15-25%. Higher losses
          may indicate process improvement opportunities.
        </Callout>
      </Section>

      <Section title="Fermentation Metrics">
        <p className="text-gray-700 leading-relaxed mb-4">
          Track fermentation performance:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Average Duration:</strong> Days in fermentation across all lots</li>
          <li><strong>Active Count:</strong> Number currently fermenting</li>
          <li><strong>Completion Rate:</strong> Lots that finished fermentation vs. stuck</li>
        </ul>
      </Section>

      <Section title="Using Analytics">
        <p className="text-gray-700 leading-relaxed mb-4">
          Practical applications for analytics data:
        </p>

        <Subsection title="Harvest Planning">
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Check available capacity before harvest</li>
            <li>Review last year's volumes for timing estimates</li>
            <li>Identify vessels needing cleaning/prep</li>
          </ul>
        </Subsection>

        <Subsection title="Production Decisions">
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Prioritize bottling based on inventory age</li>
            <li>Balance varietal mix with market demand</li>
            <li>Track fermentation success rates</li>
          </ul>
        </Subsection>

        <Subsection title="Business Planning">
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Project case goods from current inventory</li>
            <li>Plan barrel purchases based on utilization</li>
            <li>Track year-over-year production changes</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Keep Data Current:</strong> Analytics are only as good as your data - log activities promptly</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Track Volumes:</strong> Update lot volumes after racking and transfers</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Review Monthly:</strong> Check analytics monthly to catch trends early</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Compare Vintages:</strong> Use year-over-year data to improve processes</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production/dashboard" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Cellar Dashboard</h4>
            </div>
            <p className="text-sm text-gray-600">Real-time production overview</p>
          </a>
          <a href="/docs/production/vessels" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Vessel Management</h4>
            </div>
            <p className="text-sm text-gray-600">Manage production capacity</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
