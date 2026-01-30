import React from 'react';
import { BarChart3, Package } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function ReportsPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Reports"
        subtitle="Generate and export production reports"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Reports module provides comprehensive reporting capabilities for your winery operations.
          Generate inventory snapshots, production analytics, compliance documents, and more in
          PDF, Excel, or CSV formats.
        </p>
        <Callout type="tip" title="Date Range Filtering">
          All reports support date range filtering. Choose from preset ranges (30 days, 90 days,
          current year) or set a custom date range for precise reporting periods.
        </Callout>
      </Section>

      <Section title="Report Categories">
        <Subsection title="Inventory Reports">
          <Table
            headers={['Report', 'Description', 'Formats']}
            rows={[
              ['Current Inventory', 'Snapshot of all lots, volumes, and containers', 'PDF, Excel, CSV'],
              ['Inventory by Varietal', 'Breakdown of current stock by grape variety', 'PDF, Excel'],
              ['Inventory by Vintage', 'Volume and lot count by vintage year', 'PDF, Excel'],
              ['Container Utilization', 'Tank, barrel, and tote usage and capacity', 'PDF, Excel'],
            ]}
          />
        </Subsection>

        <Subsection title="Production Reports">
          <Table
            headers={['Report', 'Description', 'Formats']}
            rows={[
              ['Fermentation Log', 'Complete fermentation history with Brix, temp, pH', 'PDF, Excel, CSV'],
              ['Volume Tracking', 'Volume changes, transfers, and losses', 'PDF, Excel'],
              ['Production Timeline', 'Lot status progression from harvest to bottling', 'PDF'],
              ['Yield Analysis', 'Grape to wine yields by varietal and vintage', 'PDF, Excel'],
            ]}
          />
        </Subsection>

        <Subsection title="Analytics Reports">
          <Table
            headers={['Report', 'Description', 'Formats']}
            rows={[
              ['Vintage Comparison', 'Year-over-year production metrics', 'PDF, Excel'],
              ['Varietal Performance', 'Analysis of production by grape variety', 'PDF, Excel'],
              ['Fermentation Metrics', 'Average fermentation times and success rates', 'PDF, Excel'],
            ]}
          />
        </Subsection>

        <Subsection title="Compliance & Labels">
          <Table
            headers={['Report', 'Description', 'Formats']}
            rows={[
              ['TTB Wine Report', 'Excise tax reporting format for federal compliance', 'PDF'],
              ['Label Information', 'Lot details for wine label compliance', 'PDF, Excel'],
              ['Audit Trail', 'Complete activity and change log', 'PDF, CSV'],
            ]}
          />
        </Subsection>
      </Section>

      <Section title="Generating Reports">
        <p className="text-gray-700 leading-relaxed mb-4">
          To generate a report:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Navigate to the Reports section in Wine Production</li>
          <li>Optionally set a date range filter at the top</li>
          <li>Find the report you want in its category section</li>
          <li>Click the format button (PDF, Excel, or CSV)</li>
          <li>The file will download automatically</li>
        </ol>
        <Callout type="note" title="Report Data">
          Reports use your current data filtered by the selected date range. For accurate reports,
          ensure your lots and containers have complete and up-to-date information.
        </Callout>
      </Section>

      <Section title="Export Formats">
        <Table
          headers={['Format', 'Best For', 'Notes']}
          rows={[
            ['PDF', 'Printing, sharing, archiving', 'Formatted with headers, logos, page breaks'],
            ['Excel', 'Analysis, filtering, pivot tables', 'Full data with formatted columns'],
            ['CSV', 'Data import, bulk processing', 'Raw comma-separated values for any software'],
          ]}
        />
      </Section>

      <Section title="Quick Exports">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Quick Exports section at the bottom of the Reports page provides one-click access to
          common export operations:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Export All Lots (Excel):</strong> Complete lot inventory spreadsheet</li>
          <li><strong>Export All Containers (Excel):</strong> All tanks, barrels, and totes</li>
          <li><strong>Export Fermentation Logs (CSV):</strong> All fermentation data for analysis</li>
          <li><strong>Print Key Reports (PDF):</strong> Generates inventory, varietal, and vintage reports</li>
        </ul>
      </Section>

      <Section title="Report Use Cases">
        <Table
          headers={['Scenario', 'Recommended Report']}
          rows={[
            ['End of month inventory check', 'Current Inventory (PDF)'],
            ['Preparing for audit', 'Audit Trail + Label Information'],
            ['Analyzing vintage performance', 'Vintage Comparison + Yield Analysis'],
            ['Planning barrel needs', 'Container Utilization'],
            ['Reviewing fermentation history', 'Fermentation Log + Metrics'],
            ['Tax reporting', 'TTB Wine Report'],
          ]}
        />
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-[#7C203A] font-bold mt-1">•</span>
            <span><strong>Regular Exports:</strong> Generate monthly inventory reports for records</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#7C203A] font-bold mt-1">•</span>
            <span><strong>Backup Data:</strong> Use Quick Exports periodically to backup all data to Excel</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#7C203A] font-bold mt-1">•</span>
            <span><strong>Vintage Archives:</strong> Generate comprehensive reports before archiving lots</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#7C203A] font-bold mt-1">•</span>
            <span><strong>Pre-Audit Prep:</strong> Run TTB and Audit Trail reports before compliance reviews</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production/analytics" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-[#7C203A]/30 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-[#7C203A]" />
              <h4 className="font-semibold text-gray-900">Analytics</h4>
            </div>
            <p className="text-sm text-gray-600">View production metrics and trends</p>
          </a>
          <a href="/docs/production/archives" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-[#7C203A]/30 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-[#7C203A]" />
              <h4 className="font-semibold text-gray-900">Archives</h4>
            </div>
            <p className="text-sm text-gray-600">View archived lots by vintage</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
