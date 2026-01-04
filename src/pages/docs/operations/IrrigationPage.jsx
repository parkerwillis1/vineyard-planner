import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function IrrigationPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Irrigation Management"
        subtitle="Schedule irrigation, track water usage, and optimize vineyard hydration with satellite-based ET data and soil moisture modeling."
      />

      <Callout type="note" title="Beta v1.0">
        Irrigation Management is ready to use. We're actively improving features based on user feedback.
      </Callout>

      <Section title="Overview">
        <p>
          Irrigation Management combines satellite evapotranspiration (ET) data from OpenET with precision water tracking to help you irrigate exactly when and how much your vines need.
        </p>
        <p>
          Track irrigation events by block, create recurring schedules, monitor soil moisture across three root zone layers, and get science-based recommendations that account for growth stage, weather forecasts, and field-specific conditions.
        </p>
      </Section>

      <Section title="Evapotranspiration (ET) Data">
        <Subsection title="What is ET?">
          <p>
            Evapotranspiration measures total water loss from your vineyard through evaporation (soil surface) and transpiration (vine leaves). ET is measured in millimeters per day (mm/day) and tells you exactly how much water your vines are using.
          </p>
          <Table
            headers={["ET Range", "Meaning", "Season"]}
            rows={[
              ["0-2 mm/day", "Dormant or stressed vines", "Winter"],
              ["2-4 mm/day", "Early season, normal range", "Budbreak to flowering"],
              ["4-6 mm/day", "Peak season, healthy growth", "Fruit development to veraison"],
              ["6-8 mm/day", "High demand - hot conditions", "Peak summer"],
              ["8+ mm/day", "Extreme heat or large canopy", "Heat waves"],
            ]}
          />
        </Subsection>

        <Subsection title="OpenET Integration">
          <p>
            Trellis integrates with OpenET to provide satellite-based ET measurements using Landsat and Sentinel imagery. Data updates daily and represents actual field conditions from space—not estimates from distant weather stations.
          </p>
          <p>
            ET data is automatically adjusted by crop coefficient (Kc) values specific to grape growth stages, giving you crop-specific water use (ETc) instead of generic reference ET (ETo).
          </p>
        </Subsection>

        <Subsection title="Crop Coefficients (Kc) by Growth Stage">
          <p>
            The system automatically applies seasonal Kc values based on vineyard growth stage:
          </p>
          <Table
            headers={["Growth Stage", "Months", "Kc Value"]}
            rows={[
              ["Dormant", "December - March", "0.30"],
              ["Budbreak", "Early April", "0.45"],
              ["Flowering", "May - early June", "0.70"],
              ["Fruit Set", "Late June - July", "0.85"],
              ["Veraison", "August", "0.90"],
              ["Harvest", "September - October", "0.75"],
              ["Post-Harvest", "November", "0.50"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            Kc values are based on UC Davis research for California wine grape irrigation.
          </p>
        </Subsection>

        <Subsection title="ET Visualizations">
          <p>
            View ET data through multiple visualization tools:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>ET Heat Map:</strong> 7-day, 30-day, or full-season color-coded grid showing daily ET values with visual intensity</li>
            <li><strong>Trends Chart:</strong> Line graph of ET over time with rainfall overlay and moving averages</li>
            <li><strong>Year Comparison:</strong> Compare current season ET to previous years to identify patterns</li>
            <li><strong>All Fields Mode:</strong> View ET summary across all blocks simultaneously</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Water Balance & Soil Moisture">
        <Subsection title="Water Deficit Calculation">
          <p>
            The system tracks cumulative water deficit using the water balance method:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Water Deficit = (Crop ET × Days) - (Irrigation + Rainfall)
          </div>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Zero deficit:</strong> Perfectly managed - vines getting exactly what they need</li>
            <li><strong>Positive deficit:</strong> Under-irrigated - vines experiencing water stress</li>
            <li><strong>Negative deficit (surplus):</strong> Over-irrigated - excess vegetative growth</li>
          </ul>
          <Callout type="tip" title="Controlled Deficit Irrigation">
            For wine grapes, some water stress during certain growth stages (post-veraison) can improve fruit quality. The system accounts for Maximum Allowed Depletion (MAD) thresholds.
          </Callout>
        </Subsection>

        <Subsection title="3-Layer Soil Moisture Model">
          <p>
            Soil moisture is estimated across three root zone layers based on water balance, irrigation history, and rainfall:
          </p>
          <Table
            headers={["Layer", "Depth", "Characteristics"]}
            rows={[
              ["Surface", "0-12 inches", "Depletes fastest (evaporation + shallow roots)"],
              ["Mid", "12-24 inches", "Primary root zone for mature vines"],
              ["Deep", "24-36 inches", "Depletes slowest, reserves for drought"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            Moisture levels are shown as percentage of field capacity. Field capacity = 100%, permanent wilting point = 30%.
          </p>
        </Subsection>

        <Subsection title="Rainfall Integration">
          <p>
            The system automatically factors rainfall into water balance calculations. Rainfall data comes from field-specific weather stations or regional NOAA data.
          </p>
        </Subsection>
      </Section>

      <Section title="Irrigation Events">
        <Subsection title="Tracking Irrigation Applications">
          <p>
            Log every irrigation event with the following details:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Date:</strong> When irrigation occurred</li>
            <li><strong>Duration:</strong> Hours of irrigation runtime</li>
            <li><strong>Flow Rate:</strong> Gallons per minute (GPM) for the block or zone</li>
            <li><strong>Method:</strong> Drip, Sprinkler, Furrow, Flood, or Micro-Sprinkler</li>
            <li><strong>Total Water:</strong> Auto-calculated in gallons and mm</li>
            <li><strong>Notes:</strong> Optional field for observations</li>
          </ul>
        </Subsection>

        <Subsection title="Manual Entry vs. Scheduled Events">
          <p>
            You can track irrigation in two ways:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Manual Events:</strong> Add individual irrigation records after they happen</li>
            <li><strong>Scheduled Events:</strong> Create recurring irrigation schedules that auto-generate events</li>
          </ul>
        </Subsection>

        <Subsection title="Event History">
          <p>
            View irrigation history in two tabs:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Scheduled:</strong> Upcoming irrigation events from active schedules</li>
            <li><strong>Completed:</strong> Past irrigation applications with total water applied</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Completed events show gallons applied, mm equivalent, and running total for the season.
          </p>
        </Subsection>
      </Section>

      <Section title="Irrigation Schedules">
        <Subsection title="Creating Recurring Schedules">
          <p>
            Set up automated irrigation schedules with the following parameters:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Frequency:</strong> Daily, every 2 days, every 3 days, weekly, or bi-weekly</li>
            <li><strong>Start Date:</strong> When the schedule begins</li>
            <li><strong>End Date:</strong> When the schedule stops (optional - leave blank for ongoing)</li>
            <li><strong>Duration:</strong> Hours per irrigation cycle</li>
            <li><strong>Flow Rate:</strong> GPM for water application calculations</li>
            <li><strong>Method:</strong> Irrigation type (drip, sprinkler, etc.)</li>
            <li><strong>Backfill:</strong> Optionally generate historical events from start date to today</li>
          </ul>
        </Subsection>

        <Subsection title="Managing Active Schedules">
          <p>
            Once created, schedules can be:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Toggled On/Off:</strong> Pause schedules without deleting them</li>
            <li><strong>Edited:</strong> Update frequency, duration, or flow rate</li>
            <li><strong>Deleted:</strong> Remove schedule and optionally delete associated events</li>
            <li><strong>Extended:</strong> Change end date to continue or stop earlier</li>
          </ul>
        </Subsection>

        <Subsection title="Schedule-Generated Events">
          <p>
            Schedules automatically generate irrigation events into the future (next 90 days). When you view "Scheduled" events, you see all upcoming applications from active schedules.
          </p>
          <Callout type="tip" title="Best Practice">
            Use schedules for regular drip irrigation cycles (e.g., every 3 days during peak season) and manual events for one-off applications or adjustments.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Irrigation Recommendations">
        <Subsection title="Science-Based Recommendations">
          <p>
            The system provides irrigation recommendations based on current water deficit, forecasted ET, and soil conditions. Recommendations include:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Application Amount:</strong> Inches and millimeters to apply this week</li>
            <li><strong>Total Water Needed:</strong> Gallons required for the block</li>
            <li><strong>Runtime:</strong> Hours needed at your configured flow rate</li>
            <li><strong>Urgency Level:</strong> Critical, High, Moderate, or Low based on deficit</li>
          </ul>
        </Subsection>

        <Subsection title="Urgency Thresholds">
          <p>
            Recommendations are categorized by water deficit severity:
          </p>
          <Table
            headers={["Urgency", "Deficit Range", "Action"]}
            rows={[
              ["Critical", "&gt;30mm", "Irrigate immediately - severe water stress"],
              ["High", "15-30mm", "Irrigate within 24-48 hours"],
              ["Moderate", "8-15mm", "Irrigation recommended within 3-5 days"],
              ["Low", "&lt;8mm", "Irrigation can wait - moisture adequate"],
            ]}
          />
        </Subsection>

        <Subsection title="Runoff Prevention">
          <p>
            Recommendations are capped at 1.0 inch (25mm) per application to prevent runoff and promote deep root growth. If total deficit exceeds this, the system advises splitting application into multiple cycles 2-3 days apart.
          </p>
        </Subsection>
      </Section>

      <Section title="Variable Rate Irrigation (VRI)">
        <Subsection title="NDVI-Based VRI Zones">
          <p>
            Use satellite NDVI (Normalized Difference Vegetation Index) data to create VRI zones within each block. NDVI measures vine vigor from space, identifying areas of high and low canopy density.
          </p>
        </Subsection>

        <Subsection title="Creating VRI Zones">
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click "Load NDVI Data" for a block</li>
            <li>System fetches latest Sentinel-2 satellite imagery</li>
            <li>NDVI map displays with color-coded vigor levels (red = low, green = high)</li>
            <li>Click "Create VRI Zones" to auto-generate 3-5 management zones</li>
            <li>Adjust zone names, irrigation multipliers, and notes</li>
          </ol>
        </Subsection>

        <Subsection title="Vigor Levels">
          <p>
            NDVI values are classified into vigor categories:
          </p>
          <Table
            headers={["Vigor Level", "NDVI Range", "Color", "Irrigation Strategy"]}
            rows={[
              ["Low", "&lt;0.3", "Red", "Increase water - stressed vines"],
              ["Medium-Low", "0.3-0.5", "Orange", "Slight increase"],
              ["Medium", "0.5-0.6", "Yellow", "Standard application"],
              ["Medium-High", "0.6-0.7", "Light Green", "Slight reduction"],
              ["High", "&gt;0.7", "Dark Green", "Reduce water - excess vigor"],
            ]}
          />
        </Subsection>

        <Subsection title="Zone Management">
          <p>
            For each VRI zone, configure:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Zone Name:</strong> Descriptive label (e.g., "North High Vigor")</li>
            <li><strong>Irrigation Multiplier:</strong> Percentage adjustment (e.g., 80% for high vigor, 120% for low vigor)</li>
            <li><strong>Area:</strong> Acreage of the zone (auto-calculated from polygon)</li>
            <li><strong>Notes:</strong> Management observations or strategies</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="System Configuration">
        <Subsection title="Flow Rate Settings">
          <p>
            Configure flow rate at the block level to get accurate runtime and gallonage calculations. Flow rate is set in gallons per minute (GPM) and can differ by block or irrigation zone.
          </p>
        </Subsection>

        <Subsection title="Date Range Selection">
          <p>
            Choose the time window for ET and irrigation analysis:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>7 Days:</strong> Recent trends and immediate decisions</li>
            <li><strong>30 Days:</strong> Monthly patterns and water totals</li>
            <li><strong>Full Season:</strong> Complete growing season analysis</li>
          </ul>
        </Subsection>
      </Section>

      <Callout type="note" title="OpenET API Required">
        To use real satellite ET data, you need an OpenET API key. Contact OpenET at openetdata.org to request access. Without an API key, the system shows sample data for demonstration purposes.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Block Management",
            description: "Set up vineyard blocks with GPS boundaries",
            href: "/docs/operations/blocks",
          },
          {
            title: "Weather Dashboard",
            description: "Track rainfall, forecasts, and weather conditions",
            href: "/docs/operations/weather",
          },
          {
            title: "Task Management",
            description: "Schedule vineyard operations and track completion",
            href: "/docs/operations/tasks",
          },
        ]}
      />
    </DocsLayout>
  );
}
