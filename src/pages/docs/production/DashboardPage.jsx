import React from 'react';
import { Wine, Thermometer, Droplet, Package, Sparkles } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function DashboardPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Cellar Dashboard"
        subtitle="Production overview and real-time monitoring"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Cellar Dashboard provides a comprehensive overview of your wine production operation at a glance.
          It displays key metrics, active fermentations, temperature monitoring, recent activity, and production
          pipeline status to help you stay on top of your winemaking operations.
        </p>
      </Section>

      <Section title="Summary Statistics">
        <p className="text-gray-700 leading-relaxed mb-4">
          The top of the dashboard displays four key metrics cards:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wine className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Total Lots</h4>
            </div>
            <p className="text-sm text-gray-600">Number of active production lots currently in your cellar.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Total Volume</h4>
            </div>
            <p className="text-sm text-gray-600">Combined volume in gallons across all lots, with barrel equivalent.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Capacity Utilization</h4>
            </div>
            <p className="text-sm text-gray-600">Percentage of vessel capacity in use, with empty vessel count.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Active Fermentations</h4>
            </div>
            <p className="text-sm text-gray-600">Number of lots currently undergoing fermentation.</p>
          </div>
        </div>
      </Section>

      <Section title="Critical Alerts">
        <Callout type="warning" title="Temperature Alerts">
          When any vessel's temperature exceeds its configured threshold, a critical alert banner appears
          at the top of the dashboard requiring immediate attention.
        </Callout>
        <p className="text-gray-700 leading-relaxed mb-4">
          Alerts are generated from:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Temperature sensors:</strong> Out-of-range readings from connected IoT sensors</li>
          <li><strong>Alert rules:</strong> Custom thresholds you've configured in the Sensors section</li>
          <li><strong>System alerts:</strong> Fermentation stall detection and other automated monitoring</li>
        </ul>
      </Section>

      <Section title="Temperature Monitoring">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Temperature Monitoring panel shows real-time readings from your connected sensors:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Sensor name:</strong> The vessel or location being monitored</li>
          <li><strong>Current temperature:</strong> Latest reading in °F</li>
          <li><strong>Target range:</strong> The configured acceptable temperature range</li>
          <li><strong>Status indicator:</strong> Green (normal), yellow (warning), or red (critical)</li>
          <li><strong>Last updated:</strong> When the reading was received</li>
        </ul>
        <Callout type="tip" title="No Sensors?">
          If you haven't configured sensors yet, the panel will show a prompt to add sensors.
          See the <a href="/docs/production/sensors" className="text-purple-600 hover:text-purple-700 font-medium">IoT Sensors documentation</a> for setup instructions.
        </Callout>
      </Section>

      <Section title="Recent Activity">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Recent Activity feed shows the latest fermentation logs from your active fermentations:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Lot name and description of activity</li>
          <li>Temperature and Brix readings</li>
          <li>Who performed the activity and when</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          This helps you track what work has been done recently without navigating to individual lots.
        </p>
      </Section>

      <Section title="Production Pipeline">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Production Pipeline visualizes your lots by status across the winemaking process:
        </p>
        <Table
          headers={['Status', 'Description']}
          rows={[
            ['Planning', 'Pre-harvest lots scheduled for upcoming vintage'],
            ['Harvested', 'Fruit received but not yet processed'],
            ['Crushing', 'Fruit being crushed/destemmed'],
            ['Fermenting', 'Active primary or secondary fermentation'],
            ['Pressed', 'Wine pressed off skins, settling or racking'],
            ['Aging', 'Wine in barrel or tank for maturation'],
            ['Blending', 'Lots being evaluated or assembled as blends'],
            ['Filtering', 'Pre-bottling filtration stage'],
            ['Bottled', 'Wine packaged and in bottle storage'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          Click on any status card to filter and view lots in that stage.
        </p>
      </Section>

      <Section title="Active Blends">
        <p className="text-gray-700 leading-relaxed mb-4">
          If you have any active blends, they appear in a dedicated widget showing:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Blend name and varietal composition</li>
          <li>Number of component lots</li>
          <li>Total volume in gallons</li>
          <li>Current pH reading</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          Click "View All" to navigate to the Blending Calculator for detailed management.
        </p>
      </Section>

      <Section title="Vintage Comparison">
        <p className="text-gray-700 leading-relaxed mb-4">
          Compare your current vintage production to the previous year:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Current Year:</strong> Total volume and lot count for this vintage</li>
          <li><strong>Previous Year:</strong> Last year's totals for comparison</li>
          <li><strong>Change metrics:</strong> Percentage change in volume and lot count</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          Trending indicators (up/down arrows) show whether production is increasing or decreasing year-over-year.
        </p>
      </Section>

      <Section title="Active Fermentations Table">
        <p className="text-gray-700 leading-relaxed mb-4">
          The detailed fermentations table shows your actively fermenting lots with:
        </p>
        <Table
          headers={['Column', 'Information']}
          rows={[
            ['Lot', 'Lot name and vintage year'],
            ['Varietal', 'Grape variety'],
            ['Days', 'Days since fermentation started'],
            ['Brix', 'Current sugar level (°Brix)'],
            ['Temp', 'Current temperature (°F)'],
            ['Volume', 'Current volume in gallons'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          Click any row to navigate directly to that lot's fermentation tracker.
        </p>
      </Section>

      <Section title="Quick Actions">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Quick Actions panel at the bottom provides shortcuts to common tasks:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-700">New Harvest</p>
            <p className="text-xs text-gray-500">Create intake lot</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-700">Log Fermentation</p>
            <p className="text-xs text-gray-500">Add daily reading</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-700">Manage Vessels</p>
            <p className="text-xs text-gray-500">View containers</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-700">Lab Work</p>
            <p className="text-xs text-gray-500">Record chemistry</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-700">Create Blend</p>
            <p className="text-xs text-gray-500">Start new blend</p>
          </div>
        </div>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production/fermentation" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Fermentation Tracking</h4>
            </div>
            <p className="text-sm text-gray-600">Monitor fermentations and log daily readings</p>
          </a>
          <a href="/docs/production/sensors" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Thermometer className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">IoT Sensors</h4>
            </div>
            <p className="text-sm text-gray-600">Set up real-time temperature monitoring</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
