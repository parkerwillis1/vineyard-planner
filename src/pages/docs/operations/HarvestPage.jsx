import React from 'react';
import { Grape, Beaker } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export default function HarvestPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Harvest Tracking"
        subtitle="Plan, schedule, and record grape harvests"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Harvest Tracking module helps you plan picking schedules, track field sampling as grapes
          ripen, record harvest weights and quality data, and seamlessly transfer harvest data to the
          Wine Production module for winemaking.
        </p>
        <Callout type="tip" title="Integration with Wine Production">
          Completed harvests can be imported directly into Wine Production as production lots,
          eliminating double data entry and maintaining traceability from vine to bottle.
        </Callout>
      </Section>

      <Section title="Harvest Planning">
        <Subsection title="Creating Harvest Plans">
          <p className="text-gray-700 leading-relaxed mb-4">
            Plan your harvest by block:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
            <li>Select the block to harvest</li>
            <li>Set a target harvest date based on sampling data</li>
            <li>Specify estimated tons to pick</li>
            <li>Assign picking crew or contractor</li>
            <li>Add any special instructions or notes</li>
          </ol>
        </Subsection>

        <Subsection title="Harvest Schedule">
          <p className="text-gray-700 leading-relaxed mb-4">
            View all planned harvests in a timeline or calendar view:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>See upcoming picks for the next 2-3 weeks</li>
            <li>Color-coded by varietal or status</li>
            <li>Drag-and-drop to reschedule as conditions change</li>
            <li>Weather integration shows optimal picking windows</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Field Sampling">
        <p className="text-gray-700 leading-relaxed mb-4">
          Track ripeness as grapes approach harvest:
        </p>
        <Table
          headers={['Measurement', 'Unit', 'Harvest Target Range']}
          rows={[
            ['Brix', '°Brix', '22-26° (variety dependent)'],
            ['pH', 'pH', '3.2-3.6 (reds higher)'],
            ['TA (Titratable Acidity)', 'g/L', '6-9 g/L'],
            ['Berry Weight', 'grams', 'Variety dependent'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          Sample entries show trends over time, helping you predict optimal harvest dates.
        </p>
        <Callout type="note" title="Sampling Protocol">
          For accurate results, sample from multiple locations in each block. Take 100-200 berries
          randomly from different rows, heights, and exposures. Sample at the same time of day.
        </Callout>
      </Section>

      <Section title="Recording Harvests">
        <p className="text-gray-700 leading-relaxed mb-4">
          When picking is complete, record the harvest details:
        </p>

        <Subsection title="Basic Information">
          <Table
            headers={['Field', 'Description']}
            rows={[
              ['Harvest Date', 'When the block was picked'],
              ['Block', 'Which vineyard block'],
              ['Varietal', 'Grape variety (auto-filled from block)'],
              ['Picking Method', 'Hand pick or machine harvest'],
            ]}
          />
        </Subsection>

        <Subsection title="Weight & Volume">
          <Table
            headers={['Field', 'Description']}
            rows={[
              ['Gross Weight', 'Total weight including bins/containers'],
              ['Tare Weight', 'Weight of empty containers'],
              ['Net Weight', 'Actual grape weight (calculated)'],
              ['Number of Bins', 'Bin count for verification'],
            ]}
          />
        </Subsection>

        <Subsection title="Quality Metrics">
          <Table
            headers={['Field', 'Description']}
            rows={[
              ['Final Brix', 'Sugar level at harvest'],
              ['Final pH', 'Acidity measurement'],
              ['Final TA', 'Titratable acidity'],
              ['Condition Notes', 'Fruit quality observations'],
            ]}
          />
        </Subsection>

        <Subsection title="Logistics">
          <Table
            headers={['Field', 'Description']}
            rows={[
              ['Pick Crew', 'Who performed the harvest'],
              ['Start Time', 'When picking began'],
              ['End Time', 'When picking finished'],
              ['Destination', 'Where fruit was delivered (winery, buyer)'],
            ]}
          />
        </Subsection>
      </Section>

      <Section title="Yield Tracking">
        <p className="text-gray-700 leading-relaxed mb-4">
          The system automatically calculates yields:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Tons per Acre:</strong> Block yield compared to target</li>
          <li><strong>Lbs per Vine:</strong> Average yield per plant</li>
          <li><strong>Season Totals:</strong> Cumulative harvest by varietal</li>
          <li><strong>Historical Comparison:</strong> This year vs. previous years</li>
        </ul>
        <Callout type="tip" title="Yield Analysis">
          Compare yields against your Financial Planner projections to validate assumptions
          and improve future planning accuracy.
        </Callout>
      </Section>

      <Section title="Transfer to Wine Production">
        <p className="text-gray-700 leading-relaxed mb-4">
          When you use the Wine Production module:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Completed harvests appear in the "Import Harvest" list</li>
          <li>Select harvests to create production lots</li>
          <li>All data (weight, brix, pH, source block) transfers automatically</li>
          <li>Harvest is marked as "imported" to prevent duplicates</li>
        </ol>
        <p className="text-gray-700 leading-relaxed">
          This maintains complete traceability from vineyard block to finished bottle.
        </p>
      </Section>

      <Section title="Reports & Export">
        <p className="text-gray-700 leading-relaxed mb-4">
          Generate harvest reports including:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Harvest Summary:</strong> All picks with weights, dates, and quality</li>
          <li><strong>Yield Report:</strong> Tons per acre by block and varietal</li>
          <li><strong>Sampling History:</strong> Brix, pH, TA progression by block</li>
          <li><strong>Seasonal Comparison:</strong> This vintage vs. previous years</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          Export to CSV or PDF for record-keeping and reporting to buyers or partners.
        </p>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Sample Regularly:</strong> Begin sampling 2-3 weeks before expected harvest, then every few days as brix approaches target</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Log Immediately:</strong> Record harvest data on the same day while details are fresh</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Note Conditions:</strong> Document weather, fruit condition, and any issues for future reference</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Verify Weights:</strong> Double-check scale calibration and tare weights for accurate records</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/operations/blocks" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Grape className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Field Management</h4>
            </div>
            <p className="text-sm text-gray-600">Manage vineyard fields and varietals</p>
          </a>
          <a href="/docs/production/harvest" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Beaker className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Wine Production - Harvest Intake</h4>
            </div>
            <p className="text-sm text-gray-600">Import harvests into production lots</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
