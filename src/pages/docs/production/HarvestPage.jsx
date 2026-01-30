import React from 'react';
import { Beaker, Package } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function HarvestPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Harvest Intake"
        subtitle="Record incoming fruit and create production lots"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Harvest Intake module is where winemaking begins. Record incoming fruit with detailed information
          about weight, chemistry, quality, and source. Each harvest creates a production lot that tracks
          the wine through the entire winemaking process.
        </p>
        <Callout type="tip" title="Import from Vineyard Operations">
          If you use the Vineyard Operations module to track harvest picking, you can import completed
          harvests directly into production lots - no manual re-entry required!
        </Callout>
      </Section>

      <Section title="Creating a Harvest Lot">
        <Subsection title="Basic Information">
          <p className="text-gray-700 leading-relaxed mb-4">
            Every harvest lot requires this core information:
          </p>
          <Table
            headers={['Field', 'Description', 'Example']}
            rows={[
              ['Lot Name', 'Unique identifier for this lot', '2024 Cab Sauv Block A'],
              ['Vintage', 'Harvest year', '2024'],
              ['Varietal', 'Grape variety', 'Cabernet Sauvignon'],
              ['Appellation', 'Wine region or AVA (optional)', 'Napa Valley'],
              ['Harvest Date', 'Date grapes were picked', '2024-10-15'],
            ]}
          />
        </Subsection>

        <Subsection title="Timing & Logistics">
          <p className="text-gray-700 leading-relaxed mb-4">
            Track the logistics of when fruit was picked and received:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Pick Start Time:</strong> When picking began in the vineyard</li>
            <li><strong>Pick End Time:</strong> When picking was completed</li>
            <li><strong>Arrival Time:</strong> When fruit arrived at the crush pad</li>
          </ul>
          <Callout type="note" title="Why Track Times?">
            Recording pick and arrival times helps you analyze fruit quality correlations.
            Hot fruit that sat in the sun may ferment differently than cool, early-morning picks.
          </Callout>
        </Subsection>

        <Subsection title="Weight & Chemistry">
          <p className="text-gray-700 leading-relaxed mb-4">
            Record the initial measurements for your fruit:
          </p>
          <Table
            headers={['Measurement', 'Unit', 'Typical Range']}
            rows={[
              ['Initial Weight', 'lbs', 'Varies by lot'],
              ['Initial Brix', '°Brix', '22-28°'],
              ['Initial pH', 'pH', '3.2-3.8'],
              ['Initial TA', 'g/L', '5-8 g/L'],
            ]}
          />
          <p className="text-gray-700 leading-relaxed mt-4">
            These initial readings become the baseline for tracking throughout fermentation and aging.
            The system automatically converts weight to estimated gallons (1 ton ≈ 160 gallons).
          </p>
        </Subsection>

        <Subsection title="Fruit Quality Metrics">
          <p className="text-gray-700 leading-relaxed mb-4">
            Assess the quality of incoming fruit:
          </p>
          <Table
            headers={['Metric', 'Description', 'Target']}
            rows={[
              ['MOG %', 'Material Other than Grapes (leaves, stems, debris)', '<1%'],
              ['Rot %', 'Percentage of bunch rot present', '<2%'],
              ['Mildew %', 'Percentage of powdery mildew', '0%'],
              ['Sunburn %', 'Percentage of sunburned berries', '<5%'],
            ]}
          />
          <p className="text-gray-700 leading-relaxed mt-4">
            These quality metrics help you make processing decisions (e.g., more aggressive sorting for higher rot)
            and track vineyard performance over time.
          </p>
        </Subsection>

        <Subsection title="Sorting & Processing">
          <p className="text-gray-700 leading-relaxed mb-4">
            Specify how the fruit was processed at receiving:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>None:</strong> No sorting performed</li>
            <li><strong>Vibrating Table:</strong> Mechanical sorting to remove debris</li>
            <li><strong>Hand Sort:</strong> Manual inspection and removal of defects</li>
            <li><strong>Optical Sort:</strong> Automated optical sorting technology</li>
          </ul>
        </Subsection>

        <Subsection title="Container Assignment">
          <p className="text-gray-700 leading-relaxed mb-4">
            Optionally assign the lot to a vessel immediately:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Select from available (empty) containers</li>
            <li>Container status automatically updates to "in use"</li>
            <li>Vessel history logs the assignment</li>
          </ul>
          <Callout type="tip" title="Assign Later">
            You don't have to assign a container at harvest time. Many winemakers prefer to
            wait until after crushing to assign to fermentation vessels.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Importing from Vineyard Operations">
        <p className="text-gray-700 leading-relaxed mb-4">
          If you track harvest picking in Vineyard Operations, you can import completed harvests:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Click the "Import Harvest" button</li>
          <li>Select completed harvest records that haven't been imported yet</li>
          <li>Review the data (block, weight, chemistry are pre-filled)</li>
          <li>Confirm to create production lots</li>
        </ol>
        <p className="text-gray-700 leading-relaxed">
          Imported lots maintain a link to the original vineyard block, enabling end-to-end traceability
          from vine to bottle.
        </p>
      </Section>

      <Section title="Crush Operations">
        <p className="text-gray-700 leading-relaxed mb-4">
          After recording a harvest lot, you can log the crush/destem process:
        </p>

        <Subsection title="Processing Options">
          <Table
            headers={['Setting', 'Options']}
            rows={[
              ['Processing Style', 'Red (ferment on skins) or White (press immediately)'],
              ['Destem Mode', 'Fully destemmed, Partially destemmed, or Whole cluster'],
              ['Whole Cluster %', 'Percentage retained for whole-cluster fermentation'],
            ]}
          />
        </Subsection>

        <Subsection title="Crush Details">
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Crush Date/Time:</strong> When processing occurred</li>
            <li><strong>Crushed Weight:</strong> Weight after stemming (accounts for stem loss)</li>
            <li><strong>Stem Loss:</strong> Weight of stems removed</li>
            <li><strong>Receiving Container:</strong> Tank or vessel for fermentation</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Lot Hierarchy">
        <p className="text-gray-700 leading-relaxed mb-4">
          Production lots can have parent-child relationships:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Parent Lots:</strong> The original harvest lot</li>
          <li><strong>Child Lots:</strong> Created when splitting (e.g., free-run vs. press fractions)</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          Parent lots can be collapsed/expanded to organize your lot list. The system automatically
          syncs parent lot status based on children's statuses.
        </p>
      </Section>

      <Section title="Lot Statuses">
        <p className="text-gray-700 leading-relaxed mb-4">
          Harvest lots progress through these statuses:
        </p>
        <Table
          headers={['Status', 'Meaning']}
          rows={[
            ['Harvested', 'Fruit received but not yet processed'],
            ['Crushing', 'Currently being crushed/destemmed'],
            ['Fermenting', 'Active fermentation in progress'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          Once fermentation begins, the lot moves to the Fermentation Tracker for ongoing management.
        </p>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Record Immediately:</strong> Enter harvest data as fruit arrives - don't wait until end of day when details are forgotten</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Consistent Naming:</strong> Develop a lot naming convention (e.g., Year-Variety-Block-PickNum) for easy sorting and searching</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Use Notes:</strong> Add any observations about fruit condition, weather at pick, or handling decisions</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Quality Assessment:</strong> Record quality metrics honestly - this data helps improve vineyard practices over time</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production/fermentation" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Beaker className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Fermentation Tracking</h4>
            </div>
            <p className="text-sm text-gray-600">Continue tracking after crush</p>
          </a>
          <a href="/docs/production/vessels" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Vessel Management</h4>
            </div>
            <p className="text-sm text-gray-600">Set up tanks and barrels</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
