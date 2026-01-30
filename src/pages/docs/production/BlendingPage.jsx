import React from 'react';
import { Wine, Beaker } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function BlendingPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Blending Calculator"
        subtitle="Create and manage blend trials"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Blending Calculator helps you design wine blends by selecting component lots and their
          percentages. The system calculates predicted chemistry based on the blend composition and
          tracks varietal percentages for labeling compliance.
        </p>
      </Section>

      <Section title="Creating a Blend">
        <Subsection title="Step 1: Name Your Blend">
          <p className="text-gray-700 leading-relaxed mb-4">
            Start by providing basic information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Blend Name:</strong> A unique name for this blend (e.g., "2024 Reserve Red")</li>
            <li><strong>Vintage:</strong> The vintage year</li>
            <li><strong>Target Volume:</strong> Total gallons desired</li>
          </ul>
        </Subsection>

        <Subsection title="Step 2: Add Components">
          <p className="text-gray-700 leading-relaxed mb-4">
            Select lots to include in the blend:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
            <li>Click "Add Component" to add a row</li>
            <li>Select a lot from available aging/pressed wines</li>
            <li>Enter the percentage for this component</li>
            <li>Repeat for additional components</li>
          </ol>
          <Callout type="warning" title="Percentage Total">
            Component percentages must total exactly 100% to create the blend.
          </Callout>
        </Subsection>

        <Subsection title="Step 3: Review Calculations">
          <p className="text-gray-700 leading-relaxed mb-4">
            The system shows calculated values in real-time:
          </p>
          <Table
            headers={['Calculation', 'Description']}
            rows={[
              ['Volume per Component', 'Gallons needed from each lot based on % and target volume'],
              ['Availability Check', 'Warning if a lot has insufficient volume'],
              ['Predicted Chemistry', 'Weighted average pH, TA, alcohol based on component values'],
              ['Varietal Composition', 'Percentage breakdown by grape variety'],
            ]}
          />
        </Subsection>
      </Section>

      <Section title="Predicted Chemistry">
        <p className="text-gray-700 leading-relaxed mb-4">
          Based on the current chemistry values of each component lot, the system predicts:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>pH:</strong> Weighted average pH of the blend</li>
          <li><strong>TA:</strong> Weighted average titratable acidity (g/L)</li>
          <li><strong>Alcohol:</strong> Weighted average alcohol percentage</li>
          <li><strong>Brix:</strong> Weighted average residual sugar (if present)</li>
        </ul>
        <Callout type="note" title="Chemistry Accuracy">
          Predicted values are calculated from recorded lot data. Keep lab results current
          for accurate blend predictions. Actual blended wine should be tested after assembly.
        </Callout>
      </Section>

      <Section title="Varietal Composition">
        <p className="text-gray-700 leading-relaxed mb-4">
          The varietal breakdown shows the grape variety percentages in your blend:
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 mb-2">Example composition:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Cabernet Sauvignon: 65%</li>
            <li>Merlot: 20%</li>
            <li>Petit Verdot: 10%</li>
            <li>Cabernet Franc: 5%</li>
          </ul>
        </div>
        <Callout type="tip" title="Labeling Requirements">
          In the US, a wine must contain at least 75% of a variety to be labeled as that varietal.
          The varietal composition helps ensure your blend meets labeling standards.
        </Callout>
      </Section>

      <Section title="Executing the Blend">
        <p className="text-gray-700 leading-relaxed mb-4">
          Once your blend design is complete and validated:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Review that percentages total 100%</li>
          <li>Confirm all lots have sufficient volume</li>
          <li>Optionally select a destination vessel</li>
          <li>Click "Execute Blend" to create the blend</li>
        </ol>
        <p className="text-gray-700 leading-relaxed mt-4">
          Executing the blend:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Creates a new "blend" lot with the specified name</li>
          <li>Records all component lots and their percentages</li>
          <li>Deducts volume from each source lot</li>
          <li>Calculates and records the blended chemistry</li>
          <li>Assigns to the destination vessel (if selected)</li>
        </ul>
      </Section>

      <Section title="Managing Existing Blends">
        <p className="text-gray-700 leading-relaxed mb-4">
          Switch to the "Manage Blends" view to see all created blends:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>View blend composition and component lots</li>
          <li>Check current volume and chemistry</li>
          <li>Edit blend name, status, or notes</li>
          <li>See the vessel assignment</li>
          <li>Track blend through aging to bottling</li>
        </ul>
      </Section>

      <Section title="Blend Detail View">
        <p className="text-gray-700 leading-relaxed mb-4">
          Clicking on a blend opens the detail view showing:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Header:</strong> Blend name, vintage, varietal, status</li>
          <li><strong>Component Chart:</strong> Visual breakdown of component percentages</li>
          <li><strong>Chemistry Panel:</strong> Current pH, TA, alcohol values</li>
          <li><strong>Component List:</strong> All source lots with volumes contributed</li>
          <li><strong>Vessel Info:</strong> Current container assignment</li>
        </ul>
      </Section>

      <Section title="Blend Statuses">
        <Table
          headers={['Status', 'Description']}
          rows={[
            ['Blending', 'Blend is being assembled or trialed'],
            ['Aging', 'Assembled blend is aging (barrel or tank)'],
            ['Filtering', 'Pre-bottling preparation'],
            ['Bottled', 'Blend has been bottled'],
          ]}
        />
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Bench Trials First:</strong> Create small-scale bench trials before committing to full-volume blends</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Keep Chemistry Current:</strong> Update lab values on component lots for accurate predictions</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Document Decisions:</strong> Use notes to record why certain lots/percentages were chosen</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Test After Blending:</strong> Always run lab tests on the actual blended wine</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Track Varietal %:</strong> Monitor varietal composition for label compliance</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production/aging" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Wine className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Aging Management</h4>
            </div>
            <p className="text-sm text-gray-600">Age blends in barrel or tank</p>
          </a>
          <a href="/docs/production/lab" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Beaker className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Wine Analysis</h4>
            </div>
            <p className="text-sm text-gray-600">Lab chemistry tracking</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
