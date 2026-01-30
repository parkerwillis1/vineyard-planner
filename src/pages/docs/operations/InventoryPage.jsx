import React from 'react';
import { History, DollarSign } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export default function InventoryPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Inventory Management"
        subtitle="Track supplies, chemicals, and materials"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Inventory Management module helps you track vineyard supplies including chemicals,
          fertilizers, packaging materials, and other consumables. Monitor stock levels, set reorder
          alerts, track lot numbers for compliance, and manage supplier information.
        </p>
      </Section>

      <Section title="Inventory Categories">
        <Table
          headers={['Category', 'Examples', 'Key Tracking']}
          rows={[
            ['Chemicals', 'Fungicides, insecticides, herbicides', 'EPA registration, lot #, PHI/REI'],
            ['Fertilizers', 'Nitrogen, potassium, organic amendments', 'Nutrient content, application rates'],
            ['Fuel', 'Diesel, gasoline, propane', 'Gallons, cost per gallon'],
            ['Supplies', 'Ties, clips, bird netting', 'Quantity, unit cost'],
            ['Parts', 'Filters, belts, sprayer nozzles', 'Part numbers, compatibility'],
            ['Safety Equipment', 'PPE, first aid, spill kits', 'Expiration dates, inspection'],
          ]}
        />
      </Section>

      <Section title="Adding Inventory Items">
        <p className="text-gray-700 leading-relaxed mb-4">
          Register items in your inventory:
        </p>
        <Table
          headers={['Field', 'Description']}
          rows={[
            ['Name', 'Product name or description'],
            ['Category', 'Type of item (chemical, supply, etc.)'],
            ['SKU/Part Number', 'Manufacturer identifier'],
            ['Unit', 'Measurement unit (gallons, lbs, each)'],
            ['Current Quantity', 'Stock on hand'],
            ['Reorder Level', 'Alert threshold for low stock'],
            ['Unit Cost', 'Cost per unit for tracking'],
            ['Supplier', 'Vendor or source'],
            ['Location', 'Storage location (shed, barn, etc.)'],
          ]}
        />
      </Section>

      <Section title="Chemical Tracking">
        <p className="text-gray-700 leading-relaxed mb-4">
          Agricultural chemicals require additional tracking:
        </p>
        <Table
          headers={['Field', 'Description', 'Why It Matters']}
          rows={[
            ['EPA Registration #', 'Federal registration number', 'Compliance verification'],
            ['Lot Number', 'Manufacturer batch ID', 'Traceability, recalls'],
            ['Expiration Date', 'Product shelf life', 'Efficacy, compliance'],
            ['PHI', 'Pre-Harvest Interval', 'Days before harvest allowed'],
            ['REI', 'Re-Entry Interval', 'Hours before workers can enter'],
            ['Signal Word', 'Caution/Warning/Danger', 'Safety classification'],
          ]}
        />
        <Callout type="warning" title="Compliance">
          Accurate chemical inventory records are required for regulatory compliance. Many certifications
          (organic, sustainable) require complete tracking of all inputs.
        </Callout>
      </Section>

      <Section title="Receiving Inventory">
        <p className="text-gray-700 leading-relaxed mb-4">
          When new inventory arrives:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Find the item or add a new one</li>
          <li>Click "Receive" or "Add Stock"</li>
          <li>Enter quantity received</li>
          <li>Record lot number and expiration (if applicable)</li>
          <li>Enter cost per unit</li>
          <li>Note the supplier and invoice number</li>
        </ol>
        <p className="text-gray-700 leading-relaxed">
          The system maintains a complete receipt history for auditing.
        </p>
      </Section>

      <Section title="Using Inventory">
        <p className="text-gray-700 leading-relaxed mb-4">
          Record inventory usage when you:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Log Spray Records:</strong> Chemical usage automatically deducts from inventory</li>
          <li><strong>Complete Tasks:</strong> Associate materials used with task completion</li>
          <li><strong>Manual Adjustment:</strong> Record usage for items not tied to tasks</li>
        </ul>
        <Callout type="tip" title="Automatic Deduction">
          When you log a spray application and select the chemical from inventory, the system
          calculates the amount used based on your application rate and acres treated.
        </Callout>
      </Section>

      <Section title="Low Stock Alerts">
        <p className="text-gray-700 leading-relaxed mb-4">
          Set reorder levels for automatic alerts:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Reorder Level:</strong> Quantity that triggers a low stock alert</li>
          <li><strong>Reorder Quantity:</strong> Suggested amount to order</li>
          <li><strong>Lead Time:</strong> Days needed to receive new stock</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          Low stock items appear on your dashboard and can be exported as a purchase list.
        </p>
      </Section>

      <Section title="Inventory Adjustments">
        <p className="text-gray-700 leading-relaxed mb-4">
          Make adjustments for:
        </p>
        <Table
          headers={['Reason', 'Description']}
          rows={[
            ['Physical Count', 'Correct discrepancies after physical inventory'],
            ['Damage/Spillage', 'Product lost to damage'],
            ['Expired', 'Remove expired products'],
            ['Return', 'Sent back to supplier'],
            ['Transfer', 'Moved to another location'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          All adjustments require a reason and are logged in the audit trail.
        </p>
      </Section>

      <Section title="Reporting">
        <p className="text-gray-700 leading-relaxed mb-4">
          Generate inventory reports:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Current Stock:</strong> All items with quantities on hand</li>
          <li><strong>Low Stock Report:</strong> Items below reorder level</li>
          <li><strong>Usage Report:</strong> Consumption over a date range</li>
          <li><strong>Chemical Inventory:</strong> Compliance report with lot numbers</li>
          <li><strong>Valuation Report:</strong> Total inventory value</li>
        </ul>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Regular Counts:</strong> Perform physical inventory at least quarterly</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Track Lot Numbers:</strong> Essential for compliance and traceability</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Set Reorder Levels:</strong> Prevent running out of critical supplies mid-season</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Check Expirations:</strong> Review chemical shelf life before each season</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Link to Spray Records:</strong> Ensure accurate usage tracking for compliance</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/operations/spray" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <History className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Spray Records</h4>
            </div>
            <p className="text-sm text-gray-600">Track chemical applications</p>
          </a>
          <a href="/docs/operations/analytics" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Analytics</h4>
            </div>
            <p className="text-sm text-gray-600">View cost analysis</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
