import React from 'react';
import { Wine, Calendar } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function ArchivesPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Archives"
        subtitle="Historical records and vintage summaries"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Archives section stores production lots that have been completed, bottled, or otherwise
          removed from active production. This provides a historical reference for past vintages
          while keeping your active lot list clean and focused on current work.
        </p>
        <Callout type="note" title="Archiving vs. Deleting">
          Archiving preserves all lot data for historical reference and compliance. Permanently
          deleting removes the lot entirely and cannot be undone.
        </Callout>
      </Section>

      <Section title="What Gets Archived">
        <p className="text-gray-700 leading-relaxed mb-4">
          Lots are typically archived when they reach end-of-life:
        </p>
        <Table
          headers={['Scenario', 'When to Archive']}
          rows={[
            ['Bottled Wine', 'After bottling run is complete and lot is empty'],
            ['Sold in Bulk', 'After bulk wine is transferred out to buyer'],
            ['Blended Away', 'When a lot is fully incorporated into another lot'],
            ['End of Vintage', 'Seasonal cleanup to start fresh'],
            ['Failed Lot', 'Dumped wine or production failure (keep for records)'],
          ]}
        />
      </Section>

      <Section title="How to Archive a Lot">
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Navigate to the lot you want to archive</li>
          <li>Open the lot menu (three dots or actions menu)</li>
          <li>Select "Archive Lot"</li>
          <li>Confirm the archive action</li>
        </ol>
        <p className="text-gray-700 leading-relaxed">
          The lot is immediately moved to Archives with an archive timestamp. It no longer appears
          in active lot lists or dashboards.
        </p>
      </Section>

      <Section title="Viewing Archives">
        <Subsection title="Vintage Snapshots">
          <p className="text-gray-700 leading-relaxed mb-4">
            The Archives page displays vintage summary cards at the top showing:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Vintage year</li>
            <li>Number of archived lots from that vintage</li>
            <li>Total volume from that vintage</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            This gives you a quick overview of your production history by year.
          </p>
        </Subsection>

        <Subsection title="Filtering Archives">
          <p className="text-gray-700 leading-relaxed mb-4">
            Use the filter controls to narrow down archived lots:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>By Vintage:</strong> Show only lots from a specific year</li>
            <li><strong>By Varietal:</strong> Filter to a specific grape variety</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Filters can be combined to find specific archived lots quickly.
          </p>
        </Subsection>

        <Subsection title="Archived Lot Details">
          <p className="text-gray-700 leading-relaxed mb-4">
            Each archived lot card displays:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Lot name and varietal</li>
            <li>Vintage year</li>
            <li>Archive date (when it was archived)</li>
            <li>Final volume at archive time</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Restoring Archived Lots">
        <p className="text-gray-700 leading-relaxed mb-4">
          If you need to bring an archived lot back to active status:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Find the lot in the Archives list</li>
          <li>Click "Restore" or the restore icon</li>
          <li>Confirm the restoration</li>
        </ol>
        <p className="text-gray-700 leading-relaxed">
          The lot returns to your active lot list with all its original data intact.
        </p>
        <Callout type="tip" title="When to Restore">
          Restore a lot if you need to log additional activity (late fermentation data entry,
          corrections) or if the lot was archived by mistake.
        </Callout>
      </Section>

      <Section title="Archive Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-[#7C203A] font-bold mt-1">•</span>
            <span><strong>Complete Data First:</strong> Ensure all fermentation logs, chemistry data, and notes are entered before archiving</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#7C203A] font-bold mt-1">•</span>
            <span><strong>End of Season Cleanup:</strong> Archive all completed lots at vintage end to start fresh</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#7C203A] font-bold mt-1">•</span>
            <span><strong>Generate Reports First:</strong> Export key reports for archived vintages before cleanup</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#7C203A] font-bold mt-1">•</span>
            <span><strong>Keep Failed Lots:</strong> Archive rather than delete failed lots for historical record</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#7C203A] font-bold mt-1">•</span>
            <span><strong>Review Annually:</strong> Check archives annually to verify data completeness</span>
          </li>
        </ul>
      </Section>

      <Section title="Compliance Considerations">
        <p className="text-gray-700 leading-relaxed mb-4">
          For regulatory compliance, maintain archived records for:
        </p>
        <Table
          headers={['Record Type', 'Recommended Retention']}
          rows={[
            ['Production lots', '7+ years (TTB requirement)'],
            ['Fermentation data', '7+ years'],
            ['Bottling records', '7+ years or life of product'],
            ['Lab analysis', '7+ years'],
            ['Blend records', '7+ years'],
          ]}
        />
        <Callout type="warning" title="Data Retention">
          Archived data is retained indefinitely in Trellis. Do not permanently delete lots
          that may be needed for compliance or audit purposes.
        </Callout>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production/reports" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-[#7C203A]/30 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Wine className="w-5 h-5 text-[#7C203A]" />
              <h4 className="font-semibold text-gray-900">Reports</h4>
            </div>
            <p className="text-sm text-gray-600">Generate reports for archived vintages</p>
          </a>
          <a href="/docs/production/analytics" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-[#7C203A]/30 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-[#7C203A]" />
              <h4 className="font-semibold text-gray-900">Analytics</h4>
            </div>
            <p className="text-sm text-gray-600">View vintage comparison analytics</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
