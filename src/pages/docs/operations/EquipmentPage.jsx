import React from 'react';
import { Clock, DollarSign } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export default function EquipmentPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Equipment Management"
        subtitle="Track machinery, maintenance, and usage"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Equipment Management module helps you track your vineyard machinery, schedule maintenance,
          log usage hours, and manage repair history. Keep your equipment running smoothly and extend
          its useful life with proactive maintenance scheduling.
        </p>
      </Section>

      <Section title="Adding Equipment">
        <p className="text-gray-700 leading-relaxed mb-4">
          Register each piece of equipment with detailed information:
        </p>
        <Table
          headers={['Field', 'Description', 'Example']}
          rows={[
            ['Name', 'Descriptive identifier', 'John Deere 5055E Tractor'],
            ['Type', 'Equipment category', 'Tractor, Sprayer, Mower, ATV'],
            ['Make/Model', 'Manufacturer and model', 'John Deere 5055E'],
            ['Serial Number', 'Unique identifier', 'LV5055E123456'],
            ['Year', 'Year of manufacture', '2022'],
            ['Purchase Date', 'When acquired', '2022-03-15'],
            ['Purchase Price', 'Original cost', '$45,000'],
            ['Current Hours', 'Hour meter reading', '1,250 hrs'],
          ]}
        />
      </Section>

      <Section title="Equipment Categories">
        <p className="text-gray-700 leading-relaxed mb-4">
          Common vineyard equipment types:
        </p>
        <Table
          headers={['Category', 'Examples', 'Typical Maintenance']}
          rows={[
            ['Tractors', 'Utility, narrow-row, compact', 'Oil/filter changes, inspections'],
            ['Sprayers', 'Air blast, electrostatic, backpack', 'Nozzle cleaning, calibration'],
            ['Mowers', 'Flail, rotary, undervine', 'Blade replacement, belt checks'],
            ['ATVs/UTVs', 'Utility vehicles, side-by-sides', 'Regular service intervals'],
            ['Implements', 'Discs, cultivators, hedgers', 'Blade sharpening, wear parts'],
            ['Irrigation', 'Pumps, controllers, sensors', 'Winterization, filter cleaning'],
          ]}
        />
      </Section>

      <Section title="Maintenance Scheduling">
        <Subsection title="Scheduled Maintenance">
          <p className="text-gray-700 leading-relaxed mb-4">
            Set up recurring maintenance based on:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Hours:</strong> Service every X hours (e.g., oil change every 250 hours)</li>
            <li><strong>Time:</strong> Service every X months (e.g., annual inspection)</li>
            <li><strong>Season:</strong> Pre-season prep, post-season storage</li>
          </ul>
        </Subsection>

        <Subsection title="Maintenance Types">
          <Table
            headers={['Type', 'Description']}
            rows={[
              ['Oil/Filter Change', 'Engine oil and filter replacement'],
              ['Inspection', 'Comprehensive safety and operation check'],
              ['Calibration', 'Sprayer output and accuracy verification'],
              ['Winterization', 'Preparing equipment for off-season storage'],
              ['Spring Prep', 'Pre-season startup and readiness check'],
              ['Repair', 'Unscheduled fix for breakdown or issue'],
            ]}
          />
        </Subsection>
      </Section>

      <Section title="Maintenance Records">
        <p className="text-gray-700 leading-relaxed mb-4">
          Log all maintenance and repairs:
        </p>
        <Table
          headers={['Field', 'Description']}
          rows={[
            ['Date', 'When service was performed'],
            ['Type', 'Category of maintenance'],
            ['Hours at Service', 'Equipment hour reading'],
            ['Description', 'What was done'],
            ['Parts Used', 'Replacement parts and quantities'],
            ['Cost', 'Total cost (parts + labor)'],
            ['Performed By', 'Technician or shop name'],
            ['Notes', 'Additional observations or issues found'],
          ]}
        />
      </Section>

      <Section title="Usage Tracking">
        <p className="text-gray-700 leading-relaxed mb-4">
          Track how equipment is used:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Hour Logs:</strong> Record hours used per session or day</li>
          <li><strong>Task Association:</strong> Link usage to specific vineyard tasks</li>
          <li><strong>Operator:</strong> Track who used the equipment</li>
          <li><strong>Fuel Usage:</strong> Log fuel consumption for cost analysis</li>
        </ul>
        <Callout type="tip" title="Link to Tasks">
          When you complete a task (spraying, mowing, etc.), you can associate the equipment used.
          This builds a complete history of both task completion and equipment utilization.
        </Callout>
      </Section>

      <Section title="Alerts & Reminders">
        <p className="text-gray-700 leading-relaxed mb-4">
          The system alerts you when:
        </p>
        <Table
          headers={['Alert', 'Trigger']}
          rows={[
            ['Service Due', 'Approaching scheduled maintenance hours/date'],
            ['Overdue Service', 'Past scheduled maintenance window'],
            ['Inspection Required', 'Annual safety inspection coming up'],
            ['Warranty Expiring', 'Equipment warranty ending soon'],
            ['High Hours', 'Equipment approaching replacement threshold'],
          ]}
        />
      </Section>

      <Section title="Cost Analysis">
        <p className="text-gray-700 leading-relaxed mb-4">
          Track the true cost of equipment ownership:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Total Maintenance Cost:</strong> All service and repairs to date</li>
          <li><strong>Cost per Hour:</strong> Maintenance cost divided by usage hours</li>
          <li><strong>Annual Cost:</strong> Yearly maintenance and operating expenses</li>
          <li><strong>Replacement Analysis:</strong> When repair costs exceed replacement value</li>
        </ul>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Update Hours Regularly:</strong> Log hour readings at least weekly for accurate tracking</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Log All Service:</strong> Even minor repairs and adjustments should be recorded</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Pre-Season Check:</strong> Review all equipment before busy seasons</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Keep Receipts:</strong> Attach receipts/invoices to maintenance records for warranty claims</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Track Operators:</strong> Identify training needs or equipment misuse patterns</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/operations/tasks" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Task Management</h4>
            </div>
            <p className="text-sm text-gray-600">Link equipment to vineyard tasks</p>
          </a>
          <a href="/docs/operations/analytics" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Analytics</h4>
            </div>
            <p className="text-sm text-gray-600">View equipment cost analysis</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
