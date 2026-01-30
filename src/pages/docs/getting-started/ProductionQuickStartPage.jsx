import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Callout, Steps, NextSteps } from "../DocsComponents";
import { Wine, Container, Thermometer, Beaker, Blend, Package } from "lucide-react";

export default function ProductionQuickStartPage() {
  const steps = [
    {
      title: "Add Your Vessels",
      description: "Go to Vessel Management and click 'Add Container'. Enter details for your tanks, barrels, and totes—name, type, capacity in gallons, material, and location. Print QR codes for quick mobile access.",
    },
    {
      title: "Record Your First Harvest",
      description: "Navigate to Harvest Intake. Select the source (imported from Vineyard Operations or manual entry), enter weight, Brix, pH, and TA readings. This creates your first production lot.",
    },
    {
      title: "Start Fermentation Tracking",
      description: "With a lot created, go to Fermentation Tracker. Log daily readings: Brix, temperature, pH. Record punchdowns/pumpovers and any additions. Watch the fermentation curve develop.",
    },
    {
      title: "Assign Lot to Container",
      description: "Once fermented, assign your lot to a vessel. The system tracks volume, shows fill levels, and updates vessel status. You can split or transfer lots between vessels.",
    },
    {
      title: "Set Up Lab Analysis",
      description: "Go to Wine Analysis to log chemistry results: SO2, alcohol, VA, malic/lactic acid levels. Track trends over time and compare to target specifications.",
    },
    {
      title: "Explore Analytics Dashboard",
      description: "Visit Analytics to see production overview: total volume by varietal, vintage comparison, capacity utilization, and fermentation metrics.",
    },
    {
      title: "Configure Sensor Alerts (Optional)",
      description: "Connect temperature sensors via the IoT Sensors section. Get real-time alerts if fermentation temperatures exceed thresholds.",
    },
  ];

  return (
    <DocsLayout>
      <DocsHeader
        title="Wine Production Quick Start"
        subtitle="Track your winery from harvest intake to bottle in minutes."
      />

      <Callout type="tip" title="What You'll Accomplish">
        By the end of this guide, you'll have vessels configured, your first lot created,
        fermentation tracking started, and analytics dashboards showing your production data.
      </Callout>

      <Section title="Getting Started">
        <p>
          Wine Production is your complete cellar management system. Track lots from harvest
          through fermentation, aging, blending, and bottling. Monitor vessel inventory,
          log chemistry, and generate compliance reports.
        </p>
        <p>
          This guide walks you through the essential setup to start tracking your current vintage
          and building your production history.
        </p>
      </Section>

      <Section title="Step-by-Step Setup">
        <Steps steps={steps} />
      </Section>

      <Section title="Key Features">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#7C203A]/10 rounded-lg flex items-center justify-center">
                <Wine className="w-5 h-5 text-[#7C203A]" />
              </div>
              <h4 className="font-semibold text-gray-900">Lot Tracking</h4>
            </div>
            <p className="text-sm text-gray-600">
              Track every lot from grape to bottle with complete history, chemistry data, and vessel assignments.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Container className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Vessel Management</h4>
            </div>
            <p className="text-sm text-gray-600">
              Manage tanks, barrels, and totes with QR codes for mobile access, volume tracking, and CIP schedules.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Fermentation Tracking</h4>
            </div>
            <p className="text-sm text-gray-600">
              Log daily Brix, temp, and pH. Visualize fermentation curves and set alerts for temperature excursions.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Beaker className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Lab Analysis</h4>
            </div>
            <p className="text-sm text-gray-600">
              Track chemistry over time: pH, TA, SO2, alcohol, VA, RS. Compare to target specs for each wine style.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Blend className="w-5 h-5 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Blending Calculator</h4>
            </div>
            <p className="text-sm text-gray-600">
              Create blend trials with percentage-based composition. Preview chemistry before committing.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Bottling Runs</h4>
            </div>
            <p className="text-sm text-gray-600">
              Plan bottling runs with lot selection, bottle counts, QC checkpoints, and lot code generation.
            </p>
          </div>
        </div>
      </Section>

      <Callout type="note" title="Import from Vineyard Operations">
        If you're using Vineyard Operations, completed harvests can be imported directly as production
        lots—no double data entry required. Block and harvest data carries through for traceability.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Vessel Management",
            description: "Learn to configure tanks, barrels, and QR code access",
            href: "/docs/production/vessels",
          },
          {
            title: "Fermentation Tracking",
            description: "Master daily logging and fermentation curve analysis",
            href: "/docs/production/fermentation",
          },
          {
            title: "Blending Calculator",
            description: "Create and execute blend trials with chemistry prediction",
            href: "/docs/production/blending",
          },
          {
            title: "IoT Sensors",
            description: "Connect temperature sensors for real-time monitoring",
            href: "/docs/production/sensors",
          },
        ]}
      />
    </DocsLayout>
  );
}
