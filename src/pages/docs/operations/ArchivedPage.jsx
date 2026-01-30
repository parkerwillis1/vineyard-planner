import React from 'react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export default function ArchivedPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Archived Items"
        subtitle="View and restore archived records"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Archived Items section stores records that have been removed from active views but
          preserved for historical reference. You can restore archived items or permanently delete
          them when no longer needed.
        </p>
        <Callout type="note" title="Archive vs. Delete">
          Archiving preserves records for compliance and historical analysis while keeping your
          active views clean. Permanently deleting removes records entirely and cannot be undone.
        </Callout>
      </Section>

      <Section title="What Can Be Archived">
        <Table
          headers={['Item Type', 'When to Archive']}
          rows={[
            ['Blocks/Fields', 'Vineyard block removed from production, replanted, or sold'],
            ['Tasks', 'Completed tasks you want out of active lists'],
            ['Equipment', 'Machinery sold, retired, or no longer in use'],
            ['Team Members', 'Workers who have left the operation'],
            ['Spray Records', 'Historical applications from previous seasons'],
            ['Harvest Records', 'Completed vintages for reference'],
          ]}
        />
      </Section>

      <Section title="How to Archive Items">
        <p className="text-gray-700 leading-relaxed mb-4">
          Items can be archived from their respective management pages:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Navigate to the item you want to archive</li>
          <li>Open the item details or menu</li>
          <li>Click "Archive" (usually found in actions menu)</li>
          <li>Confirm the archive action</li>
        </ol>
        <p className="text-gray-700 leading-relaxed">
          The item is immediately removed from active views and moved to the archive.
        </p>
      </Section>

      <Section title="Viewing Archived Items">
        <p className="text-gray-700 leading-relaxed mb-4">
          Access archived items through the Archived section:
        </p>

        <Subsection title="Filtering">
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>By Type:</strong> Filter to see only blocks, tasks, equipment, etc.</li>
            <li><strong>By Date:</strong> Show items archived within a date range</li>
            <li><strong>Search:</strong> Find specific items by name</li>
          </ul>
        </Subsection>

        <Subsection title="Item Details">
          <p className="text-gray-700 leading-relaxed mb-4">
            Each archived item shows:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Original item name and type</li>
            <li>Date it was archived</li>
            <li>Who archived it (if tracked)</li>
            <li>Key details from the original record</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Restoring Items">
        <p className="text-gray-700 leading-relaxed mb-4">
          To restore an archived item to active status:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Find the item in the archive</li>
          <li>Click "Restore" or the restore icon</li>
          <li>Confirm the restoration</li>
          <li>The item returns to its original location in active views</li>
        </ol>
        <Callout type="tip" title="Restore Anytime">
          There's no time limit on restoring archived items. Historical records from years ago
          can still be restored if needed.
        </Callout>
      </Section>

      <Section title="Permanent Deletion">
        <p className="text-gray-700 leading-relaxed mb-4">
          To permanently delete an archived item:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Find the item in the archive</li>
          <li>Click "Delete Permanently" or the trash icon</li>
          <li>Confirm the deletion (this cannot be undone)</li>
        </ol>
        <Callout type="warning" title="Permanent Deletion">
          Permanently deleted items cannot be recovered. Ensure you no longer need the record
          before deleting. Consider keeping archived items for compliance and historical reference.
        </Callout>
      </Section>

      <Section title="Compliance Considerations">
        <p className="text-gray-700 leading-relaxed mb-4">
          Some records should be retained for compliance:
        </p>
        <Table
          headers={['Record Type', 'Recommended Retention']}
          rows={[
            ['Spray Records', '3-5 years (check state requirements)'],
            ['Harvest Records', '7+ years for traceability'],
            ['Equipment Service', 'Life of equipment + warranty period'],
            ['Labor Records', 'Per state/federal requirements'],
            ['Financial Records', '7 years for tax purposes'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          When in doubt, archive rather than delete. Storage costs are minimal, and historical
          data can be valuable for analysis and compliance.
        </p>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Archive Seasonally:</strong> Clean up completed tasks and old records at end of season</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Keep Spray Records:</strong> Retain for compliance and certification audits</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Archive, Don't Delete:</strong> When uncertain, archive first—you can always delete later</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Review Annually:</strong> Check archives annually for items that can be permanently removed</span>
          </li>
        </ul>
      </Section>
    </div>
    </DocsLayout>
  );
}
