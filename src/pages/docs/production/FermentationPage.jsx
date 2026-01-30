import React from 'react';
import { Thermometer, Activity, Lightbulb, AlertTriangle, Pill, Zap, Wind } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function FermentationPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Fermentation Tracking"
        subtitle="Monitor active fermentations with daily logs"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Fermentation Tracker is your central hub for monitoring active fermentations. Track daily
          Brix and temperature readings, log cellar work (punchdowns, pumpovers), add nutrients, and watch
          your fermentation progress in real-time with charts and sensor data.
        </p>
      </Section>

      <Section title="Fermentation Profiles">
        <p className="text-gray-700 leading-relaxed mb-4">
          Choose a fermentation profile to set temperature targets and expected duration:
        </p>
        <Table
          headers={['Profile', 'Temp Range', 'Target Days', 'Best For']}
          rows={[
            ['Cool White', '50-60°F (ideal: 55°F)', '14 days', 'Aromatic whites, preserve fruit character'],
            ['Warm White', '60-70°F (ideal: 65°F)', '10 days', 'Fuller whites, more body'],
            ['Cool Red', '70-80°F (ideal: 75°F)', '12 days', 'Lighter reds, Pinot Noir style'],
            ['Warm Red', '80-90°F (ideal: 85°F)', '8 days', 'Full-bodied reds, maximum extraction'],
            ['Carbonic Maceration', '85-95°F (ideal: 90°F)', '14 days', 'Whole-cluster, Beaujolais style'],
          ]}
        />
        <Callout type="tip" title="Temperature Profiles">
          Selecting a profile sets recommended temperature ranges that display on charts and trigger
          alerts if readings fall outside the target range.
        </Callout>
      </Section>

      <Section title="Starting Fermentation">
        <p className="text-gray-700 leading-relaxed mb-4">
          To start fermentation on a lot that's ready (crushed/harvested status):
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Click "Start Fermentation" on the lot card</li>
          <li>Enter starting volume in gallons</li>
          <li>Optionally add initial SO₂ dosage</li>
          <li>Select yeast strain and enter grams pitched</li>
          <li>Add nutrient type and amount (optional)</li>
          <li>Assign to a fermentation vessel</li>
          <li>Set target fermentation days</li>
          <li>Click "Start Fermentation" to begin tracking</li>
        </ol>
      </Section>

      <Section title="Yeast Strains">
        <p className="text-gray-700 leading-relaxed mb-4">
          The system includes common commercial yeast strains with recommendations:
        </p>
        <Table
          headers={['Strain', 'Temp Range', 'Best For']}
          rows={[
            ['EC-1118 (Prise de Mousse)', '50-86°F', 'Universal, clean, reliable finisher'],
            ['D47 (Côte des Blancs)', '59-86°F', 'White wines, tropical fruit notes'],
            ['RC-212 (Bourgovin)', '68-86°F', 'Pinot Noir, fruity complexity'],
            ['BM 4x4', '64-86°F', 'Bordeaux reds, deep color'],
            ['BDX (Pasteur Red)', '59-86°F', 'Syrah, Merlot, robust structure'],
            ['D254 (Assmanshausen)', '60-90°F', 'Zinfandel, big jammy reds'],
            ['QA23', '59-86°F', 'Aromatic whites, citrus/floral'],
            ['71B-1122', '59-86°F', 'Reduces acidity, semi-sweet wines'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          The system recommends yeast based on varietal - for example, suggesting RC-212 for Pinot Noir
          or BM 4x4 for Cabernet Sauvignon.
        </p>
      </Section>

      <Section title="SO₂ Calculator">
        <p className="text-gray-700 leading-relaxed mb-4">
          The built-in SO₂ calculator helps you determine proper dosing based on pH:
        </p>
        <Table
          headers={['pH Range', 'Recommended SO₂']}
          rows={[
            ['< 3.0', '30 ppm'],
            ['3.0 - 3.3', '40 ppm'],
            ['3.3 - 3.5', '50 ppm'],
            ['3.5 - 3.7', '60 ppm'],
            ['> 3.7', '75 ppm (high pH requires more)'],
          ]}
        />
        <p className="text-gray-700 leading-relaxed mt-4">
          Enter the target PPM and wine volume, and the calculator shows grams of potassium metabisulfite needed.
        </p>
        <Callout type="note" title="SO₂ Formula">
          Grams K₂S₂O₅ = (PPM × Gallons × 3.785) ÷ 570
        </Callout>
      </Section>

      <Section title="Daily Fermentation Logs">
        <p className="text-gray-700 leading-relaxed mb-4">
          Record daily readings and cellar work for each fermenting lot:
        </p>

        <Subsection title="Measurements">
          <Table
            headers={['Field', 'Unit', 'Purpose']}
            rows={[
              ['Brix', '°Brix', 'Track sugar depletion (fermentation progress)'],
              ['Temperature', '°F', 'Monitor fermentation temperature'],
              ['Ambient Temp', '°F', 'Cellar/room temperature'],
              ['pH', 'pH', 'Track acidity changes'],
              ['TA', 'g/L', 'Titratable acidity'],
            ]}
          />
        </Subsection>

        <Subsection title="Cellar Work Options">
          <p className="text-gray-700 leading-relaxed mb-4">
            Log the work performed during each check:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Punchdown:</strong> Manual cap submersion (red wines)</li>
            <li><strong>Pumpover:</strong> Circulating juice over the cap</li>
            <li><strong>Rack:</strong> Moving wine off sediment</li>
            <li><strong>Add Nutrient:</strong> Yeast nutrient addition</li>
            <li><strong>Add SO₂:</strong> Sulfite addition</li>
            <li><strong>Taste:</strong> Sensory evaluation</li>
          </ul>
        </Subsection>

        <Subsection title="Sensory Notes">
          <p className="text-gray-700 leading-relaxed mb-4">
            Record observations during fermentation:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Smell Notes:</strong> Aromas observed during the check</li>
            <li><strong>Taste Notes:</strong> Flavor impressions from tasting</li>
            <li><strong>Cap Condition:</strong> Appearance of the cap (for red wines)</li>
            <li><strong>Visual Notes:</strong> Color, clarity, bubble activity</li>
          </ul>
        </Subsection>

        <Subsection title="Additions">
          <p className="text-gray-700 leading-relaxed mb-4">
            Log any additions made during fermentation:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Addition type (nutrient, enzyme, acid, etc.)</li>
            <li>Product name</li>
            <li>Amount and unit (g/hL, ppm, etc.)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Events & Interventions">
        <p className="text-gray-700 leading-relaxed mb-4">
          Track important fermentation events beyond daily logs. The Events system provides comprehensive
          traceability for nutrient additions, issues/deviations, interventions, and oxygen management.
        </p>

        <Subsection title="Event Types">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Pill className="w-5 h-5 text-emerald-600" />
                <h4 className="font-semibold text-emerald-800">Nutrient Additions</h4>
              </div>
              <p className="text-sm text-gray-700">Track DAP, Fermaid K, Fermaid O, and other nutrient additions with precise dosing records.</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-red-800">Issues/Deviations</h4>
              </div>
              <p className="text-sm text-gray-700">Log problems like stuck fermentation, H2S, temperature spikes, or off-aromas with severity levels.</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-amber-800">Interventions</h4>
              </div>
              <p className="text-sm text-gray-700">Record corrective actions taken: splash racking, acid adjustments, re-inoculation, or cold soak.</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wind className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800">O2/Extraction</h4>
              </div>
              <p className="text-sm text-gray-700">Track delestage, rack & return, and other oxygen management for color and tannin extraction.</p>
            </div>
          </div>
        </Subsection>

        <Subsection title="Event Details">
          <p className="text-gray-700 leading-relaxed mb-4">
            Each event captures:
          </p>
          <Table
            headers={['Field', 'Description']}
            rows={[
              ['Category', 'Specific type within the event (e.g., DAP, Fermaid K, stuck ferment, H2S)'],
              ['Dosage & Unit', 'Amount added (for nutrients) in g, g/hL, mL, ppm, etc.'],
              ['Severity', 'For issues: Low, Medium, High, or Critical'],
              ['Readings at Event', 'Snapshot of Brix, temperature, and pH when the event occurred'],
              ['Notes', 'Detailed observations and context'],
              ['Resolution', 'For issues: mark as resolved with outcome notes'],
            ]}
          />
        </Subsection>

        <Subsection title="Issue Resolution">
          <p className="text-gray-700 leading-relaxed mb-4">
            When you log a deviation or issue, it remains flagged as "Unresolved" until you mark it resolved.
            The system tracks:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Resolution date and notes</li>
            <li>Effectiveness rating (1-5) for learning</li>
            <li>Unresolved count badge on the Events section</li>
          </ul>
          <Callout type="tip" title="Learning from Issues">
            Rating intervention effectiveness helps build knowledge across vintages. Over time, you'll
            see which approaches work best for specific problems.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Automatic Problem Detection">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Fermentation Tracker continuously analyzes your data and <strong>automatically detects problems</strong> as
          they occur. When an issue is found, both the problem AND the recommended solutions are displayed
          immediately - no manual logging required.
        </p>

        <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-gray-900">Issues Detected Automatically</h4>
          </div>
          <p className="text-sm text-gray-700">
            When problems are detected, you'll see an alert box with the issue clearly labeled as
            "Problem Detected" along with a green "Recommended Solutions" panel showing exactly what to do.
            Urgent issues pulse to grab your attention.
          </p>
        </div>

        <Subsection title="What Gets Auto-Detected">
          <Table
            headers={['Problem', 'How It\'s Detected', 'Priority']}
            rows={[
              ['Stuck Fermentation', 'Brix dropping less than 0.5° between readings when still > 5° Brix', 'URGENT'],
              ['Temperature Too High/Low', 'Readings outside your fermentation profile range', 'URGENT/Medium'],
              ['H2S Development', 'Sulfur/rotten egg smell mentioned in sensory notes', 'URGENT'],
              ['Nutrient Timing', 'Sugar depletion reaches 1/3 or 2/3 marks', 'Medium'],
              ['Missing Daily Log', 'No log entry in 36+ hours during active fermentation', 'Low'],
              ['Press Ready', 'Brix approaches dryness (0-2°)', 'Medium'],
            ]}
          />
        </Subsection>

        <Subsection title="How It Works">
          <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Automatic Analysis:</strong> Every time you view a lot, the system analyzes Brix trends, temperature, sensory notes, and event history</li>
            <li><strong>Problem Detection:</strong> Issues are identified and labeled as "Problem Detected" with urgency levels</li>
            <li><strong>Solutions Displayed:</strong> Recommended fixes appear in a green panel right below the problem</li>
            <li><strong>Record Your Response:</strong> After taking action, click "Record Action Taken" to log what you did for traceability</li>
          </ol>
        </Subsection>

        <Subsection title="Alert Types">
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong className="text-red-700">Problems (Red):</strong> Auto-detected issues with solutions - requires attention</li>
            <li><strong className="text-blue-700">Suggestions (Blue):</strong> Proactive recommendations like nutrient timing</li>
            <li><strong className="text-emerald-700">Status (Green):</strong> Positive updates like approaching press readiness</li>
          </ul>
        </Subsection>

        <Callout type="tip" title="No Manual Detection Needed">
          You don't need to manually identify or log problems - the system does this for you. Just check
          the Alerts section when viewing a lot, and any issues will be waiting with solutions ready.
        </Callout>
      </Section>

      <Section title="Fermentation Charts">
        <p className="text-gray-700 leading-relaxed mb-4">
          Visual charts help you monitor fermentation progress:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Brix Curve:</strong> Sugar depletion over time - watch for stalls</li>
          <li><strong>Temperature:</strong> Overlaid with target range from profile</li>
          <li><strong>Reference Lines:</strong> Show ideal temperature bounds</li>
        </ul>
        <Callout type="warning" title="Fermentation Stalls">
          If Brix stops dropping for more than 2-3 days, you may have a stuck fermentation.
          Check temperature, nutrient levels, and consider restarting with fresh yeast.
        </Callout>
      </Section>

      <Section title="Sensor Integration">
        <p className="text-gray-700 leading-relaxed mb-4">
          If you have IoT temperature sensors connected to your vessels:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Real-time temperature readings appear on lot cards</li>
          <li>Sensor data is overlaid on fermentation charts</li>
          <li>Automatic alerts if temperature leaves target range</li>
          <li>Last reading timestamp shows data freshness</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          See the <a href="/docs/production/sensors" className="text-purple-600 hover:text-purple-700 font-medium">IoT Sensors documentation</a> to set up real-time monitoring.
        </p>
      </Section>

      <Section title="Moving to Next Stage">
        <p className="text-gray-700 leading-relaxed mb-4">
          When fermentation is complete (Brix reaches 0 or below):
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Optionally press the wine (for red wines)</li>
          <li>Update lot status to "Pressed" or "Aging"</li>
          <li>Reassign to aging vessel if needed</li>
          <li>Continue tracking in Wine Analysis or Aging Management</li>
        </ol>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Log Daily:</strong> Consistent daily readings catch problems early</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Check at Same Time:</strong> Take readings at the same time each day for accurate trends</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Use Sensors:</strong> Real-time monitoring catches temperature spikes overnight</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Record Sensory:</strong> Tasting notes help you compare vintages and lots later</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Log All Additions:</strong> Complete records are essential for consistency and troubleshooting</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Track Events:</strong> Use the Events system to log nutrients at 1/3 and 2/3 sugar depletion for healthier ferments</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Check Auto-Alerts:</strong> Problems are detected automatically - just review the Alerts section and follow the solutions provided</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Resolve Issues:</strong> Mark deviations as resolved with effectiveness ratings to build institutional knowledge</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production/harvest" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Harvest Intake</h4>
            </div>
            <p className="text-sm text-gray-600">Recording incoming fruit</p>
          </a>
          <a href="/docs/production/sensors" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Thermometer className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">IoT Sensors</h4>
            </div>
            <p className="text-sm text-gray-600">Real-time temperature monitoring</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
