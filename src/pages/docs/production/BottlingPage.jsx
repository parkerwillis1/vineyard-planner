import React from 'react';
import { Calendar, Beaker } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function BottlingPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Bottling Management"
        subtitle="Manage bottling runs and packaging"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Bottling Management module guides you through the bottling process with a step-by-step
          wizard. Select a lot, configure packaging, validate readiness, execute the run, and track
          QC checkpoints throughout.
        </p>
      </Section>

      <Section title="Bottling Workflow">
        <p className="text-gray-700 leading-relaxed mb-4">
          The bottling wizard consists of five steps:
        </p>
        <div className="bg-gradient-to-r from-purple-50 to-rose-50 rounded-lg p-6 border border-purple-200 mb-4">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Select Lot</h4>
                <p className="text-sm text-gray-700">Choose the wine lot to bottle, view readiness status</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Run Setup</h4>
                <p className="text-sm text-gray-700">Configure bottle size, closure, labels, case pack</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Validate</h4>
                <p className="text-sm text-gray-700">Review calculations, verify lot data, confirm ready</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Execute Run</h4>
                <p className="text-sm text-gray-700">Track bottles filled, complete QC checks, log issues</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">5</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Complete</h4>
                <p className="text-sm text-gray-700">Finalize run, update lot status, export report</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Step 1: Select Lot">
        <p className="text-gray-700 leading-relaxed mb-4">
          Choose which wine lot to bottle:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Search:</strong> Filter lots by name</li>
          <li><strong>Status Filter:</strong> Eligible, aging, blocked lots</li>
          <li><strong>Varietal/Vintage:</strong> Filter by variety or year</li>
          <li><strong>Sort:</strong> By readiness, aging time, volume</li>
        </ul>

        <Subsection title="Lot Readiness">
          <p className="text-gray-700 leading-relaxed mb-4">
            Each lot shows a readiness indicator:
          </p>
          <Table
            headers={['Status', 'Meaning']}
            rows={[
              ['Eligible (Green)', 'Ready to bottle - all requirements met'],
              ['Nearly Ready (Yellow)', 'Close but missing minor requirements'],
              ['Blocked (Red)', 'Cannot bottle - critical requirements missing'],
            ]}
          />
          <p className="text-gray-700 leading-relaxed mt-4">
            Click on a lot to see specific blockers or requirements.
          </p>
        </Subsection>

        <Subsection title="Readiness Requirements">
          <Table
            headers={['Requirement', 'Description']}
            rows={[
              ['Minimum Volume', 'At least 10 gallons (configurable)'],
              ['Aging Time', 'Minimum months in barrel/tank'],
              ['Lab Chemistry', 'Recent pH, TA, SO₂, alcohol tests'],
              ['Status', 'Lot must be in aging/filtering status'],
            ]}
          />
        </Subsection>
      </Section>

      <Section title="Step 2: Run Setup">
        <Subsection title="Packaging Configuration">
          <Table
            headers={['Setting', 'Options']}
            rows={[
              ['Bottle Size', 'Split (187ml), Half (375ml), Standard (750ml), Magnum (1.5L), Double Magnum (3L)'],
              ['Closure Type', 'Natural Cork, DIAM Cork, Synthetic, Screw Cap, Glass Stopper'],
              ['Capsule Color', 'Free text for capsule description'],
              ['Case Pack', '6 or 12 bottles per case'],
              ['Pallet Cases', 'Cases per pallet for pallet count calculation'],
            ]}
          />
        </Subsection>

        <Subsection title="Volume & Loss">
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Bulk Volume:</strong> Starting wine volume in gallons</li>
            <li><strong>Loss %:</strong> Expected bottling line loss (default 2.5%)</li>
            <li><strong>Headspace Loss:</strong> Additional loss for headspace in partial vessels</li>
          </ul>
        </Subsection>

        <Subsection title="Calculated Outputs">
          <p className="text-gray-700 leading-relaxed mb-4">
            Based on your inputs, the system calculates:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Net Volume:</strong> Volume after losses</li>
            <li><strong>Estimated Bottles:</strong> Total bottles expected</li>
            <li><strong>Estimated Cases:</strong> Total cases</li>
            <li><strong>Estimated Pallets:</strong> Total pallets (if configured)</li>
          </ul>
        </Subsection>

        <Subsection title="Label Information">
          <Table
            headers={['Field', 'Description']}
            rows={[
              ['Label Name', 'Product name for the label'],
              ['Varietal', 'Grape variety (from lot data)'],
              ['Vintage', 'Harvest year'],
              ['Appellation', 'Wine region/AVA'],
              ['ABV', 'Alcohol percentage for label'],
              ['Lot Code', 'Production tracking code'],
            ]}
          />
        </Subsection>
      </Section>

      <Section title="Step 3: Validate">
        <p className="text-gray-700 leading-relaxed mb-4">
          The validation step confirms everything is ready:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Review all packaging configuration</li>
          <li>Verify calculated quantities</li>
          <li>Check label information accuracy</li>
          <li>Confirm lot chemistry is current</li>
          <li>Set run date and operator name</li>
        </ul>
        <Callout type="warning" title="Data Autosaves">
          Your bottling run configuration is automatically saved as a draft. You can leave and
          return to continue setup later.
        </Callout>
      </Section>

      <Section title="Step 4: Execute Run">
        <Subsection title="Live Counters">
          <p className="text-gray-700 leading-relaxed mb-4">
            During the run, track:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Actual Bottles:</strong> Increment as bottles are filled</li>
            <li><strong>Actual Cases:</strong> Track cases packed</li>
          </ul>
        </Subsection>

        <Subsection title="QC Checkpoints">
          <p className="text-gray-700 leading-relaxed mb-4">
            Complete quality checkpoints during the run:
          </p>
          <Table
            headers={['Checkpoint', 'What to Check']}
            rows={[
              ['Fill Height', 'Consistent wine level in bottles'],
              ['Cork Insertion', 'Proper cork seating depth'],
              ['Label Placement', 'Labels centered and straight'],
              ['Closure Torque', 'Screw cap torque within spec'],
              ['Oxygen Check', 'Headspace oxygen levels acceptable'],
              ['Sample Retained', 'Retain samples for library'],
            ]}
          />
        </Subsection>

        <Subsection title="Issue Logging">
          <p className="text-gray-700 leading-relaxed mb-4">
            Record any issues that occur during bottling:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Describe the issue</li>
            <li>Set severity (minor, major, critical)</li>
            <li>Issues are tracked with timestamps</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Step 5: Complete">
        <p className="text-gray-700 leading-relaxed mb-4">
          Finishing the run:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Review final bottle/case counts</li>
          <li>Calculate actual yield vs. estimated</li>
          <li>Lot status updates to "Bottled"</li>
          <li>Export bottling report (PDF)</li>
        </ul>
        <Callout type="success" title="Inventory Creation">
          Completed runs can create inventory items for bottle tracking. Set whether bottles
          go to "Available," "Quarantine," or "Needs Lab" status.
        </Callout>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Lab Before Bottling:</strong> Complete final chemistry panel 1-2 weeks before bottling</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Track All Issues:</strong> Log even minor issues for quality improvement</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Complete QC Checks:</strong> Don't skip checkpoints - they catch problems early</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Retain Samples:</strong> Always keep library samples from each run</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Export Reports:</strong> Save bottling reports for compliance records</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production/lab" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Beaker className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Wine Analysis</h4>
            </div>
            <p className="text-sm text-gray-600">Pre-bottling chemistry requirements</p>
          </a>
          <a href="/docs/production/aging" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Aging Management</h4>
            </div>
            <p className="text-sm text-gray-600">Age wine before bottling</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
