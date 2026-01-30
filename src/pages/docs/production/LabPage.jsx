import React from 'react';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function LabPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Wine Analysis"
        subtitle="Lab chemistry tracking and wine specs"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Wine Analysis module tracks laboratory chemistry results for your wines throughout production.
          Record pH, TA, SO₂, VA, alcohol, and other key parameters. Compare results against wine style
          specifications and visualize trends over time.
        </p>
      </Section>

      <Section title="Lab Parameters">
        <Table
          headers={['Parameter', 'Unit', 'Description']}
          rows={[
            ['pH', 'pH units', 'Acidity measure (lower = more acidic)'],
            ['TA (Titratable Acidity)', 'g/L', 'Total acid content'],
            ['Free SO₂', 'ppm', 'Active sulfur dioxide for protection'],
            ['Total SO₂', 'ppm', 'Total sulfur dioxide (free + bound)'],
            ['VA (Volatile Acidity)', 'g/L', 'Acetic acid content (spoilage indicator)'],
            ['Malic Acid', 'g/L', 'Pre-malolactic fermentation acid'],
            ['Lactic Acid', 'g/L', 'Post-malolactic fermentation acid'],
            ['Alcohol', '% ABV', 'Alcohol by volume'],
            ['Residual Sugar', 'g/L', 'Remaining fermentable sugars'],
          ]}
        />
      </Section>

      <Section title="Wine Style Profiles">
        <p className="text-gray-700 leading-relaxed mb-4">
          Compare your wine chemistry against target ranges for different wine styles:
        </p>

        <Subsection title="Dry White">
          <Table
            headers={['Parameter', 'Target Range', 'Ideal']}
            rows={[
              ['pH', '3.0 - 3.4', '3.1 - 3.3'],
              ['TA', '6 - 9 g/L', '7 - 8 g/L'],
              ['Free SO₂', '25 - 40 ppm', '30 - 35 ppm'],
              ['VA', '< 0.7 g/L', '< 0.5 g/L'],
              ['Alcohol', '11 - 14%', '12 - 13%'],
            ]}
          />
        </Subsection>

        <Subsection title="Sweet White">
          <Table
            headers={['Parameter', 'Target Range', 'Ideal']}
            rows={[
              ['pH', '3.0 - 3.5', '3.2 - 3.4'],
              ['TA', '6 - 10 g/L', '7 - 9 g/L'],
              ['Free SO₂', '30 - 50 ppm', '35 - 45 ppm'],
              ['VA', '< 0.6 g/L', '< 0.4 g/L'],
              ['Alcohol', '9 - 12%', '10 - 11%'],
            ]}
          />
        </Subsection>

        <Subsection title="Light Red (Pinot Noir style)">
          <Table
            headers={['Parameter', 'Target Range', 'Ideal']}
            rows={[
              ['pH', '3.4 - 3.8', '3.5 - 3.7'],
              ['TA', '5.5 - 7.5 g/L', '6 - 7 g/L'],
              ['Free SO₂', '20 - 35 ppm', '25 - 30 ppm'],
              ['VA', '< 0.8 g/L', '< 0.6 g/L'],
              ['Alcohol', '12 - 15%', '13 - 14%'],
            ]}
          />
        </Subsection>

        <Subsection title="Full-Bodied Red (Cabernet, Syrah)">
          <Table
            headers={['Parameter', 'Target Range', 'Ideal']}
            rows={[
              ['pH', '3.5 - 3.9', '3.6 - 3.8'],
              ['TA', '5 - 7 g/L', '5.5 - 6.5 g/L'],
              ['Free SO₂', '20 - 35 ppm', '25 - 30 ppm'],
              ['VA', '< 0.9 g/L', '< 0.7 g/L'],
              ['Alcohol', '13 - 16%', '14 - 15%'],
            ]}
          />
        </Subsection>

        <Subsection title="Sparkling Wine">
          <Table
            headers={['Parameter', 'Target Range', 'Ideal']}
            rows={[
              ['pH', '3.0 - 3.3', '3.0 - 3.2'],
              ['TA', '7 - 10 g/L', '8 - 9 g/L'],
              ['Free SO₂', '20 - 35 ppm', '25 - 30 ppm'],
              ['VA', '< 0.5 g/L', '< 0.3 g/L'],
              ['Alcohol', '11 - 13%', '~12%'],
            ]}
          />
        </Subsection>
      </Section>

      <Section title="Recording Lab Results">
        <p className="text-gray-700 leading-relaxed mb-4">
          To add a new lab analysis for a lot:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Select the lot from the lot list (filter by status)</li>
          <li>Click "Add Lab Result" to open the form</li>
          <li>Enter the measurement date</li>
          <li>Fill in available parameters (leave blank if not tested)</li>
          <li>Add any notes about the analysis</li>
          <li>Click "Save" to record the results</li>
        </ol>
        <Callout type="tip" title="Partial Results">
          You don't need to fill in every field. Enter only the parameters you tested - the system
          handles partial data gracefully.
        </Callout>
      </Section>

      <Section title="Lot Selection & Filtering">
        <p className="text-gray-700 leading-relaxed mb-4">
          Filter the lot list to find wines needing analysis:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Fermenting:</strong> Monitor active fermentations</li>
          <li><strong>Aging:</strong> Track wines in barrel (default view)</li>
          <li><strong>Pressed:</strong> Post-fermentation, pre-aging</li>
          <li><strong>Blending:</strong> Wines being assembled</li>
          <li><strong>Filtering:</strong> Pre-bottling preparation</li>
        </ul>
      </Section>

      <Section title="Chemistry Trends">
        <p className="text-gray-700 leading-relaxed mb-4">
          The lot detail view shows charts tracking parameters over time:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>pH trend:</strong> Watch for unexpected changes</li>
          <li><strong>TA trend:</strong> Monitor acid evolution through MLF</li>
          <li><strong>Free SO₂:</strong> Track sulfite depletion between additions</li>
          <li><strong>VA levels:</strong> Catch potential spoilage early</li>
        </ul>
        <Callout type="warning" title="VA Monitoring">
          Volatile acidity (VA) above 0.8 g/L indicates potential spoilage. Rising VA trends
          should be investigated immediately - check for acetic acid bacteria contamination.
        </Callout>
      </Section>

      <Section title="Lab History">
        <p className="text-gray-700 leading-relaxed mb-4">
          Each lot maintains a complete history of all lab results:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>View all historical results in reverse chronological order</li>
          <li>Edit past entries if corrections are needed</li>
          <li>See who recorded each result and when</li>
          <li>Export history for external reporting</li>
        </ul>
      </Section>

      <Section title="Updating Lot Chemistry">
        <p className="text-gray-700 leading-relaxed mb-4">
          When you save a lab result, the lot's current chemistry values are updated automatically.
          These values are used in:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Dashboard displays:</strong> Show current lot status</li>
          <li><strong>Blending calculator:</strong> Predict blend chemistry</li>
          <li><strong>Bottling readiness:</strong> Verify wine is ready for packaging</li>
        </ul>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Test at Key Stages:</strong> Test at crush, post-fermentation, pre-bottling minimum</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Monitor SO₂:</strong> Check free SO₂ monthly during aging</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Track MLF:</strong> Test malic acid regularly during malolactic fermentation</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Watch VA:</strong> Test VA if you notice off aromas or flavors</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Pre-Bottling Panel:</strong> Complete comprehensive analysis before bottling</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production/fermentation" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Fermentation Tracking</h4>
            </div>
            <p className="text-sm text-gray-600">Monitor active fermentations</p>
          </a>
          <a href="/docs/production/bottling" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Bottling</h4>
            </div>
            <p className="text-sm text-gray-600">Readiness checks and packaging</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
