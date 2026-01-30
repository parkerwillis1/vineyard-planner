import React from 'react';
import { Clock, Thermometer } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function VesselsPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Vessel Management"
        subtitle="Manage tanks, barrels, and containers"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Vessel Management module tracks all your production containers - tanks, barrels, totes, and
          other vessels. Monitor capacity, status, cleaning schedules, and generate QR codes for easy
          identification on the cellar floor.
        </p>
      </Section>

      <Section title="Container Types">
        <Table
          headers={['Type', 'Description', 'Common Use']}
          rows={[
            ['Tank', 'Stainless steel tanks', 'Fermentation, cold stabilization, blending'],
            ['Barrel', 'Oak barrels (French, American, Hungarian)', 'Aging, malolactic fermentation'],
            ['Tote', 'Plastic IBC totes', 'Temporary storage, transfers'],
            ['Bin', 'Harvest bins or picking containers', 'Receiving, cold soak'],
            ['Other', 'Custom container types', 'Specialty equipment'],
          ]}
        />
      </Section>

      <Section title="Container Attributes">
        <Subsection title="Basic Information">
          <Table
            headers={['Field', 'Description']}
            rows={[
              ['Name', 'Unique identifier (e.g., "Tank 1", "Barrel 45")'],
              ['Type', 'Tank, barrel, tote, etc.'],
              ['Material', 'Stainless, oak, plastic, concrete'],
              ['Capacity', 'Volume in gallons'],
              ['Location', 'Physical location in cellar'],
            ]}
          />
        </Subsection>

        <Subsection title="Barrel-Specific Attributes">
          <p className="text-gray-700 leading-relaxed mb-4">
            Barrels have additional tracking fields:
          </p>
          <Table
            headers={['Field', 'Description']}
            rows={[
              ['Cooperage', 'Barrel maker (e.g., Seguin Moreau, Taransaud)'],
              ['Toast Level', 'Light, Medium, Medium+, Heavy'],
              ['Purchase Date', 'When the barrel was acquired'],
              ['Total Fills', 'Number of times wine has been in this barrel'],
            ]}
          />
          <Callout type="note" title="Barrel Age Tracking">
            Oak influence diminishes with each fill. Most winemakers replace barrels after 4-5 fills
            or 5+ years. The system tracks this to help plan barrel purchases.
          </Callout>
        </Subsection>

        <Subsection title="Cleaning & Maintenance">
          <Table
            headers={['Field', 'Description']}
            rows={[
              ['Last CIP Date', 'When container was last cleaned in place'],
              ['CIP Product', 'Cleaning product used (e.g., PBW, citric acid)'],
              ['Notes', 'Any maintenance notes or observations'],
            ]}
          />
        </Subsection>
      </Section>

      <Section title="Container Status">
        <Table
          headers={['Status', 'Description']}
          rows={[
            ['Empty', 'Available for use'],
            ['In Use', 'Contains wine (lot assigned)'],
            ['Cleaning', 'Currently being cleaned'],
            ['Maintenance', 'Under repair or inspection'],
            ['Retired', 'No longer in active use'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          Status updates automatically when lots are assigned or removed. You can also manually change
          status for cleaning and maintenance cycles.
        </p>
      </Section>

      <Section title="View Modes">
        <p className="text-gray-700 leading-relaxed mb-4">
          Switch between different views to manage your vessels:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Grid View:</strong> Visual cards showing capacity utilization</li>
          <li><strong>List View:</strong> Compact table with sortable columns</li>
          <li><strong>Map View:</strong> Cellar layout visualization (if locations configured)</li>
        </ul>
      </Section>

      <Section title="Filtering & Sorting">
        <p className="text-gray-700 leading-relaxed mb-4">
          Filter vessels by:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Type:</strong> Show only tanks, barrels, etc.</li>
          <li><strong>Status:</strong> Filter by empty, in use, cleaning, etc.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mb-4">
          Sort by:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Name (A-Z or Z-A)</li>
          <li>Capacity (largest or smallest first)</li>
          <li>Location</li>
          <li>Last CIP date</li>
        </ul>
      </Section>

      <Section title="Bulk Operations">
        <Subsection title="Bulk Create">
          <p className="text-gray-700 leading-relaxed mb-4">
            Quickly add multiple similar vessels:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
            <li>Click "Bulk Create" button</li>
            <li>Enter a template name (e.g., "Barrel")</li>
            <li>Set how many to create</li>
            <li>Preview generated names (Barrel 1, Barrel 2, etc.)</li>
            <li>All vessels will share the same attributes</li>
          </ol>
        </Subsection>

        <Subsection title="Smart Naming">
          <p className="text-gray-700 leading-relaxed mb-4">
            The system detects naming patterns and continues them:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>"Tank 1" → creates Tank 2, Tank 3, etc.</li>
            <li>"Barrel A" → creates Barrel B, Barrel C, etc.</li>
            <li>Existing names are checked to avoid duplicates</li>
          </ul>
        </Subsection>

        <Subsection title="Duplicate">
          <p className="text-gray-700 leading-relaxed mb-4">
            Create copies of an existing vessel:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
            <li>Click the duplicate icon on any vessel</li>
            <li>Enter how many copies to create</li>
            <li>New vessels inherit all attributes (capacity, location, etc.)</li>
            <li>Names are auto-incremented</li>
          </ol>
        </Subsection>
      </Section>

      <Section title="QR Codes">
        <p className="text-gray-700 leading-relaxed mb-4">
          Each vessel can display a QR code for quick identification:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Click the QR icon on any vessel card</li>
          <li>Print the QR code label</li>
          <li>Attach to the physical vessel</li>
          <li>Scan to quickly view vessel details on mobile</li>
        </ul>
        <Callout type="tip" title="QR Code Labels">
          Printed labels include the vessel name and QR code that links directly to the vessel
          detail page. Great for cellar staff to quickly look up contents or log work.
        </Callout>
      </Section>

      <Section title="Vessel Detail Page">
        <p className="text-gray-700 leading-relaxed mb-4">
          Clicking a vessel opens its detail page showing:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Current contents (assigned lot information)</li>
          <li>Volume fill level visualization</li>
          <li>Latest sensor readings (if connected)</li>
          <li>Activity timeline and history</li>
          <li>Quick actions (log CIP, transfer, etc.)</li>
        </ul>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Consistent Naming:</strong> Use a clear naming scheme (Tank 1-10, Barrel A1-A20)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Track CIP Dates:</strong> Log cleaning dates to maintain sanitation schedules</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Use Locations:</strong> Set physical locations to quickly find vessels in the cellar</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Print QR Labels:</strong> QR codes speed up data entry and reduce errors</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Track Barrel Fills:</strong> Monitor oak age to plan replacement purchases</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production/aging" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Aging Management</h4>
            </div>
            <p className="text-sm text-gray-600">Barrel aging and topping schedules</p>
          </a>
          <a href="/docs/production/sensors" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Thermometer className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">IoT Sensors</h4>
            </div>
            <p className="text-sm text-gray-600">Connect temperature sensors to vessels</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
