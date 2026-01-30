import React from 'react';
import { Wine, Layers } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function AgingPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Aging Management"
        subtitle="Track barrel aging and topping schedules"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Aging Management module focuses on barrel cellar operations. Track which lots are in which
          barrels, monitor topping schedules, track barrel fill counts, and manage your oak inventory.
        </p>
        <Callout type="note" title="Barrel Focus">
          While lots can age in any vessel type (tank, barrel, tote), this module is specifically designed
          for managing barrel programs where topping, fill tracking, and oak age are critical.
        </Callout>
      </Section>

      <Section title="Barrel Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The main view shows your barrel inventory organized by:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Varietal:</strong> Filter by grape variety</li>
          <li><strong>Vintage:</strong> Filter by wine vintage year</li>
          <li><strong>Parent Lot:</strong> Group by original harvest lot</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          Each barrel card shows the barrel name, contents (lot name, varietal, vintage),
          days since last topping, and fill count.
        </p>
      </Section>

      <Section title="Assigning Lots to Barrels">
        <p className="text-gray-700 leading-relaxed mb-4">
          Move pressed or post-fermentation wine into barrels:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Go to the <strong>Fermentation</strong> page</li>
          <li>Click on the pressed/ready lot you want to barrel down</li>
          <li>In the lot details panel, click "Assign to Vessel"</li>
          <li>Select an available (empty) barrel from the list</li>
          <li>Confirm the assignment</li>
        </ol>
        <Callout type="tip" title="Finding Your Lot">
          Lots ready for barrel aging will show as "Pressed" status on the Fermentation page.
          Click on the lot card to expand it and see the vessel assignment options.
        </Callout>
        <p className="text-gray-700 leading-relaxed mt-4">
          When assigned:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Lot status changes to "Aging"</li>
          <li>Barrel status changes to "In Use"</li>
          <li>Barrel fill count increments by 1</li>
          <li>Assignment is logged in vessel history</li>
        </ul>
      </Section>

      <Section title="Auto-Fill Feature">
        <p className="text-gray-700 leading-relaxed mb-4">
          For large lots that need multiple barrels, use auto-fill:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Select a parent lot with more volume than one barrel</li>
          <li>Click "Auto Fill Barrels"</li>
          <li>Select multiple empty barrels</li>
          <li>The system creates child lots for each barrel</li>
          <li>Each child lot gets ~60 gallons (standard barrel capacity)</li>
        </ol>
        <Callout type="tip" title="Child Lots">
          Auto-fill creates child lots linked to the parent. This maintains traceability while
          tracking each barrel individually for topping and chemistry.
        </Callout>
      </Section>

      <Section title="Topping Schedule">
        <p className="text-gray-700 leading-relaxed mb-4">
          Barrels lose wine to evaporation (the "angel's share") and must be topped regularly:
        </p>
        <Table
          headers={['Indicator', 'Meaning']}
          rows={[
            ['Green', 'Topped within last 30 days'],
            ['Yellow', 'Approaching 30 days since topping'],
            ['Red', 'Overdue for topping (> 30 days)'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          The "Needs Topping" panel shows all barrels overdue for topping, sorted by barrel number.
        </p>
      </Section>

      <Section title="Bulk Topping">
        <p className="text-gray-700 leading-relaxed mb-4">
          Record topping for multiple barrels at once:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Select barrels using the checkboxes</li>
          <li>Click "Mark Selected as Topped"</li>
          <li>The system records today's date as the topping date</li>
          <li>All selected barrels reset their topping timer</li>
        </ol>
      </Section>

      <Section title="Barrel Retirement">
        <p className="text-gray-700 leading-relaxed mb-4">
          The system tracks barrel age and fill count to identify barrels approaching retirement:
        </p>
        <Table
          headers={['Criteria', 'Threshold']}
          rows={[
            ['Total Fills', '≥ 4 fills (oak contribution diminishes)'],
            ['Age', '≥ 5 years from purchase date'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          The "Barrels for Replacement" panel shows barrels meeting either criterion,
          helping you plan oak inventory purchases.
        </p>
        <Callout type="note" title="Oak Influence">
          New barrels provide the most oak flavor. By the 4th fill, a barrel is essentially
          "neutral" and used primarily for controlled oxidation rather than oak influence.
        </Callout>
      </Section>

      <Section title="Sorting Options">
        <p className="text-gray-700 leading-relaxed mb-4">
          Sort the barrel list by:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Barrel Number:</strong> Numerical order by name</li>
          <li><strong>Age (Newest):</strong> Most recently barreled first</li>
          <li><strong>Age (Oldest):</strong> Longest aging first</li>
          <li><strong>Name (A-Z):</strong> Alphabetical by lot name</li>
          <li><strong>Name (Z-A):</strong> Reverse alphabetical</li>
        </ul>
      </Section>

      <Section title="Typical Aging Workflow">
        <div className="bg-gradient-to-r from-purple-50 to-rose-50 rounded-lg p-6 border border-purple-200 mb-4">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Barrel Down</h4>
                <p className="text-sm text-gray-700">Assign pressed wine to barrels, auto-fill for large lots</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Regular Topping</h4>
                <p className="text-sm text-gray-700">Top barrels every 3-4 weeks to prevent oxidation</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Periodic Racking</h4>
                <p className="text-sm text-gray-700">Move wine off sediment (logged in fermentation notes)</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Lab Testing</h4>
                <p className="text-sm text-gray-700">Monitor chemistry in Wine Analysis module</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">5</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Blend or Bottle</h4>
                <p className="text-sm text-gray-700">Create blends from aged lots or proceed to bottling</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Regular Topping:</strong> Top every 3-4 weeks to minimize ullage and oxidation risk</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Track Fill Counts:</strong> Monitor oak contribution by knowing barrel history</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Plan Replacements:</strong> Order new barrels before peak harvest season</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Use Sensors:</strong> Monitor barrel room temperature with IoT sensors</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Sample Regularly:</strong> Taste and test barrels to guide blending decisions</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production/vessels" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Wine className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Vessel Management</h4>
            </div>
            <p className="text-sm text-gray-600">Set up barrels and track details</p>
          </a>
          <a href="/docs/production/blending" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Blending Calculator</h4>
            </div>
            <p className="text-sm text-gray-600">Create blends from aged lots</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
