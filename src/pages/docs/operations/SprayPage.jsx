import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function SprayPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Spray Records & Compliance"
        subtitle="Track chemical applications, monitor PHI/REI restrictions, maintain compliance records, and manage chemical inventory."
      />

      <Callout type="note" title="Beta v1.0">
        Spray Records is ready to use. We're actively improving features based on user feedback.
      </Callout>

      <Section title="Overview">
        <p>
          Spray Records helps you maintain complete, compliant documentation of all pesticide, fungicide, and herbicide applications in your vineyard. Track tank mixes, applicator details, weather conditions, and equipment settings to meet regulatory requirements and optimize spray programs.
        </p>
        <p>
          The system automatically enforces Pre-Harvest Interval (PHI) and Re-Entry Interval (REI) restrictions, preventing harvest or worker entry violations. Generate compliance reports for audits, certifications, and regulatory submissions.
        </p>
      </Section>

      <Section title="Creating Spray Applications">
        <Subsection title="3-Step Application Wizard">
          <p>
            Record spray applications using the guided wizard that captures all required compliance information:
          </p>
          <div className="space-y-4 ml-4">
            <div>
              <h5 className="font-semibold text-gray-900 mb-2">Step 1: Blocks & Chemicals (Tank Mix)</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Select one or more blocks to spray</li>
                <li>Specify acres treated per block (can be partial acreage)</li>
                <li>Add chemicals from inventory to create tank mix</li>
                <li>Set application rate per acre for each chemical</li>
                <li>Choose unit (oz/acre, lb/acre, gal/acre, etc.)</li>
                <li>System auto-calculates total quantity needed</li>
                <li>Specify purpose (fungicide, insecticide, herbicide, growth regulator, etc.)</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 mb-2">Step 2: Weather & Applicator Info</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Application date and time window (start/end)</li>
                <li>Applicator name and license number (DPR/state certification)</li>
                <li>Wind speed (mph) and direction</li>
                <li>Temperature (°F) and humidity (%)</li>
                <li>Cloud cover description</li>
                <li>Inversion risk assessment (None, Low, Moderate, High)</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 mb-2">Step 3: Application Details</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Spray method (Airblast, Boom, Handgun, Backpack, Drone)</li>
                <li>Nozzle type and size</li>
                <li>Spray pressure (PSI)</li>
                <li>Gallons per acre (GPA) application rate</li>
                <li>Total tank size (gallons)</li>
                <li>Target pest or disease</li>
                <li>Vine growth stage at application</li>
                <li>Buffer zone compliance confirmation</li>
                <li>Additional notes or observations</li>
              </ul>
            </div>
          </div>
        </Subsection>

        <Subsection title="Quick Spray Entry">
          <p>
            For routine applications with minimal detail requirements, use Quick Spray mode:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Select blocks and chemicals only</li>
            <li>Set application date and applicator</li>
            <li>Skip detailed weather and equipment settings</li>
            <li>Faster entry for frequent, standard applications</li>
          </ul>
          <Callout type="warning" title="Compliance Note">
            Quick Spray records may not meet full regulatory compliance requirements. Use the full wizard for certified organic operations, state reporting, or audit documentation.
          </Callout>
        </Subsection>
      </Section>

      <Section title="PHI & REI Restrictions">
        <Subsection title="Pre-Harvest Interval (PHI)">
          <p>
            PHI is the number of days required between the last chemical application and harvest. The system:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Stores PHI days for each chemical in your inventory</li>
            <li>Automatically calculates PHI expiration dates when you log applications</li>
            <li>Locks blocks from harvest until PHI expires</li>
            <li>Shows visual countdown on block cards ("PHI: 7 days remaining")</li>
            <li>Warns if you attempt to create harvest records during PHI period</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            PHI values come from the EPA product label and vary by chemical and crop. Always verify PHI from the official label.
          </p>
        </Subsection>

        <Subsection title="Re-Entry Interval (REI)">
          <p>
            REI is the minimum time workers must wait before entering a treated area. The system:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Stores REI hours for each chemical (typically 12-48 hours)</li>
            <li>Locks blocks from worker entry until REI expires</li>
            <li>Displays warning banners on task assignments to restricted blocks</li>
            <li>Prevents task completion records during REI period</li>
            <li>Shows REI countdown timer on block and task views</li>
          </ul>
          <Callout type="warning" title="Worker Safety">
            REI violations can result in serious health risks and regulatory penalties. Never allow workers into treated areas during REI period, even with protective equipment.
          </Callout>
        </Subsection>

        <Subsection title="Active Restrictions Dashboard">
          <p>
            View all current PHI and REI locks across your vineyard on the Spray Records dashboard. This "Active Restrictions" panel shows:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Which blocks are currently restricted</li>
            <li>Restriction type (PHI or REI)</li>
            <li>Chemical applied causing the restriction</li>
            <li>Expiration date/time</li>
            <li>Days or hours remaining</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Chemical Inventory Integration">
        <Subsection title="Adding Chemicals to Inventory">
          <p>
            Before recording spray applications, add chemicals to your inventory with required compliance data:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Product Name:</strong> Commercial name (e.g., "Rally 40WSP")</li>
            <li><strong>Active Ingredient:</strong> Chemical name (e.g., "Myclobutanil")</li>
            <li><strong>EPA Registration Number:</strong> Required for compliance reporting</li>
            <li><strong>Manufacturer:</strong> Company name</li>
            <li><strong>PHI Days:</strong> Pre-harvest interval from label</li>
            <li><strong>REI Hours:</strong> Re-entry interval from label</li>
            <li><strong>Purpose:</strong> Fungicide, insecticide, herbicide, etc.</li>
            <li><strong>Application Restrictions:</strong> Special label requirements</li>
            <li><strong>Restricted Use:</strong> Flag if DPR/state license required</li>
          </ul>
        </Subsection>

        <Subsection title="Chemical Usage Tracking">
          <p>
            The system tracks chemical depletion from inventory based on spray records. View usage summaries showing:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Total quantity used per chemical per season</li>
            <li>Number of applications per block</li>
            <li>Average rate per application</li>
            <li>Total cost of chemical applications (if inventory costs entered)</li>
            <li>Remaining inventory balance</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Click "Usage Summary" on the Spray Records dashboard to view detailed chemical consumption reports.
          </p>
        </Subsection>
      </Section>

      <Section title="Spray Methods">
        <Subsection title="Application Equipment">
          <p>
            Track spray method and equipment settings for efficacy analysis and calibration records:
          </p>
          <Table
            headers={["Spray Method", "Typical Use Cases"]}
            rows={[
              ["Airblast", "Standard vineyard sprayer - high volume, full canopy coverage"],
              ["Boom", "Pre-emergence herbicides, under-vine weed control"],
              ["Handgun", "Spot treatments, small blocks, hard-to-reach areas"],
              ["Backpack", "Manual spot spraying for isolated pest pressure"],
              ["Drone", "Aerial application for large vineyards or steep terrain"],
            ]}
          />
        </Subsection>

        <Subsection title="Equipment Calibration">
          <p>
            Record nozzle type, size, pressure, and gallons per acre (GPA) for each application. This data helps:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Verify proper calibration over time</li>
            <li>Diagnose spray coverage issues</li>
            <li>Ensure consistent application rates</li>
            <li>Meet regulatory documentation requirements</li>
            <li>Train new applicators on equipment settings</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Weather Conditions">
        <Subsection title="Why Weather Matters">
          <p>
            Recording weather at application time is critical for:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Drift Prevention:</strong> High winds (&gt;10 mph) increase off-target drift</li>
            <li><strong>Efficacy:</strong> Rain within 24 hours can wash off contact sprays</li>
            <li><strong>Compliance:</strong> Many labels prohibit application above certain wind speeds</li>
            <li><strong>Liability:</strong> Weather records prove responsible application practices</li>
            <li><strong>Inversion Risk:</strong> Temperature inversions trap spray droplets, causing drift hours later</li>
          </ul>
        </Subsection>

        <Subsection title="Inversion Risk Assessment">
          <p>
            Temperature inversions occur when warm air traps cooler air near the ground, preventing spray droplets from settling. Assess inversion risk before spraying:
          </p>
          <Table
            headers={["Risk Level", "Conditions", "Action"]}
            rows={[
              ["None", "Normal daytime mixing, wind present", "Safe to spray"],
              ["Low", "Light wind, mid-morning", "Acceptable with caution"],
              ["Moderate", "Calm conditions, early morning/late evening", "Delay if possible"],
              ["High", "Still air, clear sky, sunrise/sunset", "Do not spray"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            Use smoke bombs or observe dust/pollen movement to detect inversions in real time.
          </p>
        </Subsection>
      </Section>

      <Section title="Compliance Reports">
        <Subsection title="Generating Reports">
          <p>
            Export compliance-ready spray records for regulatory submissions, organic certifications, and third-party audits. Reports include:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>All spray applications for date range</li>
            <li>Chemical details (EPA#, active ingredient, rates)</li>
            <li>Applicator licenses and certifications</li>
            <li>Weather conditions at application time</li>
            <li>PHI/REI compliance verification</li>
            <li>Buffer zone documentation</li>
            <li>Total acres treated per chemical</li>
          </ul>
        </Subsection>

        <Subsection title="Filtering & Search">
          <p>
            Find specific spray records quickly using filters:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Date Range:</strong> Show applications within specific timeframe</li>
            <li><strong>Block:</strong> Filter by vineyard block</li>
            <li><strong>Chemical:</strong> Show all applications of specific product</li>
            <li><strong>Applicator:</strong> View records by licensed applicator</li>
            <li><strong>Search:</strong> Text search across notes, target pests, and growth stages</li>
          </ul>
        </Subsection>
      </Section>

      <Callout type="tip" title="Best Practice">
        Record spray applications immediately after completion while details are fresh. Take photos of weather station readings, empty product containers, and spray equipment settings for additional documentation.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Field Management",
            description: "Set up fields with PHI/REI lock tracking",
            href: "/docs/operations/blocks",
          },
          {
            title: "Inventory Management",
            description: "Manage chemical inventory and track usage",
            href: "/docs/operations/inventory",
          },
          {
            title: "Task Management",
            description: "Create spray prep tasks and assign to crew",
            href: "/docs/operations/tasks",
          },
        ]}
      />
    </DocsLayout>
  );
}
