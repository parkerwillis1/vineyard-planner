import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function HardwarePage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Hardware Integration"
        subtitle="Connect weather stations, soil sensors, flow meters, and IoT devices to automate data collection and improve decision-making."
      />

      <Callout type="note" title="Coming in Q2 2025">
        Hardware integration is currently in development. This page documents the planned features and supported devices. Early access beta testing begins April 2025—email support@vinepioneer.com to join the waitlist.
      </Callout>

      <Section title="Overview">
        <p>
          Trellis will integrate with popular agricultural sensors and weather stations to automate data collection, reduce manual entry, and provide real-time alerts for critical conditions (frost, water stress, equipment failures).
        </p>
        <p>
          All supported devices communicate via standard protocols (WiFi, LoRaWAN, cellular) and sync data automatically to your vineyard dashboard. No manual downloads or data transfers required.
        </p>
      </Section>

      <Section title="Supported Devices">
        <Subsection title="Weather Stations">
          <p>
            On-site weather data for irrigation scheduling and frost protection:
          </p>
          <Table
            headers={["Device", "Manufacturer", "Price Range", "Features"]}
            rows={[
              ["Davis Vantage Pro2", "Davis Instruments", "$800-$1,200", "Temperature, humidity, wind, rain, solar radiation"],
              ["ATMOS 41", "METER Group", "$2,500-$3,000", "All-in-one sensor, research-grade accuracy"],
              ["WeatherFlow Tempest", "WeatherFlow", "$300-$400", "Consumer-grade, WiFi, real-time updates"],
              ["Onset HOBO", "Onset", "$500-$800", "Temperature/RH logger, cellular option"],
            ]}
          />
          <Callout type="tip" title="Placement">
            Install weather station in open area away from buildings, trees, and irrigation spray. Height: 5-6 feet for temperature, 10 feet for wind. Avoid heat islands (concrete, dark roofs).
          </Callout>
        </Subsection>

        <Subsection title="Soil Moisture Sensors">
          <p>
            Measure soil water content at multiple depths for precision irrigation:
          </p>
          <Table
            headers={["Device", "Type", "Price", "Depths"]}
            rows={[
              ["METER TEROS 12", "Capacitance", "$200-$300/sensor", "User-selectable (12, 24, 36 inches)"],
              ["Delta-T SM150T", "Capacitance", "$250-$350/sensor", "6, 12, 18 inch probes"],
              ["Sentek Drill & Drop", "Capacitance", "$800-$1,200/probe", "Multi-depth (up to 4 feet)"],
              ["Acclima TDR", "Time Domain Reflectometry", "$400-$600/sensor", "Research-grade accuracy"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            Install sensors in representative locations (1-2 per block). Pair with weather station for water balance calculations.
          </p>
        </Subsection>

        <Subsection title="Flow Meters">
          <p>
            Track water usage and detect leaks in irrigation systems:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Inline Flow Meters:</strong> Install on main irrigation line, measure gallons in real-time</li>
            <li><strong>Zone Meters:</strong> Separate meter per irrigation zone for block-level tracking</li>
            <li><strong>Wireless Transmission:</strong> Cellular or WiFi upload to Trellis</li>
            <li><strong>Leak Detection:</strong> Alerts when flow continues after valve close (pipe break)</li>
          </ul>
          <Table
            headers={["Model", "Size", "Price", "Accuracy"]}
            rows={[
              ["Badger M2000", "2-3 inch", "$400-$600", "±1.5% accuracy"],
              ["Seametrics IP67", "1-4 inch", "$500-$900", "±1% accuracy, pulse output"],
              ["McCrometer V-Cone", "2-6 inch", "$800-$1,500", "±0.5% accuracy, research-grade"],
            ]}
          />
        </Subsection>

        <Subsection title="Pressure Sensors">
          <p>
            Monitor irrigation system pressure to detect clogs and pump failures:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Main Line Pressure:</strong> Track pump output pressure (target: 30-50 PSI for drip)</li>
            <li><strong>Filter Differential:</strong> Measure pressure drop across filters (indicates clogging)</li>
            <li><strong>Zone Pressure:</strong> End-of-line pressure to verify even distribution</li>
            <li><strong>Alerts:</strong> Notify when pressure drops below/above thresholds</li>
          </ul>
        </Subsection>

        <Subsection title="Dendrometers">
          <p>
            Measure vine trunk diameter for precise water stress monitoring:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Tracks daily trunk shrinkage and expansion cycles</li>
            <li>Indicates water stress before visible symptoms appear</li>
            <li>Expensive ($500-$1,000 per sensor) but research-accurate</li>
            <li>Best for high-value premium wine grapes</li>
          </ul>
        </Subsection>

        <Subsection title="Frost Protection Sensors">
          <p>
            Early warning systems for freeze events:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Temperature Alarms:</strong> SMS/email alert when temp drops below 35°F</li>
            <li><strong>Wet Bulb Temperature:</strong> Indicates frost risk accounting for humidity</li>
            <li><strong>Canopy Temperature:</strong> Infrared sensors measure actual vine temp (colder than air)</li>
            <li><strong>Integration:</strong> Trigger wind machines or sprinklers automatically</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Device Setup & Configuration">
        <Subsection title="Initial Pairing">
          <p>
            Connect new devices to Trellis in 3 steps:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Physical Installation:</strong> Mount/bury sensor per manufacturer instructions</li>
            <li><strong>Network Connection:</strong> Connect device to WiFi, cellular, or LoRa gateway</li>
            <li><strong>Trellis Pairing:</strong>
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Go to Settings → Hardware Integration</li>
                <li>Click "Add Device"</li>
                <li>Select manufacturer and model</li>
                <li>Enter device ID or scan QR code</li>
                <li>Assign to vineyard block</li>
                <li>Confirm pairing (device appears in dashboard)</li>
              </ul>
            </li>
          </ol>
        </Subsection>

        <Subsection title="Data Sync Frequency">
          <p>
            Configure how often devices upload data:
          </p>
          <Table
            headers={["Device Type", "Default Interval", "Battery Life Impact"]}
            rows={[
              ["Weather Station", "5-15 minutes", "Moderate (AC power recommended)"],
              ["Soil Moisture", "1-6 hours", "Low (1-2 year battery)"],
              ["Flow Meter", "Real-time", "None (hardwired to pump controller)"],
              ["Dendrometer", "15-30 minutes", "Moderate (solar rechargeable)"],
            ]}
          />
          <Callout type="tip" title="Battery vs. AC Power">
            Battery-powered sensors last 1-3 years but upload less frequently. AC-powered or solar-rechargeable devices provide real-time data. Use battery for remote locations, AC/solar for critical monitoring.
          </Callout>
        </Subsection>

        <Subsection title="Alert Configuration">
          <p>
            Set thresholds for automated notifications:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Frost Alert:</strong> Notify when temperature drops below 33°F</li>
            <li><strong>Soil Moisture:</strong> Alert when moisture falls below 30% (wilting point)</li>
            <li><strong>Flow Rate:</strong> Warning if flow drops 20% (clog or leak)</li>
            <li><strong>Pressure:</strong> Alert if pressure exceeds 60 PSI (pipe burst risk)</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Alerts sent via: SMS, email, push notification (mobile app), or in-app dashboard banner.
          </p>
        </Subsection>

        <Subsection title="Calibration">
          <p>
            Ensure sensor accuracy with periodic calibration:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Soil Moisture:</strong> Calibrate to soil type (clay vs. sand) using manufacturer software</li>
            <li><strong>Flow Meters:</strong> Test against bucket fill method annually</li>
            <li><strong>Weather Stations:</strong> Replace rain gauge annually, check temperature against NIST thermometer</li>
            <li><strong>Pressure Sensors:</strong> Zero-point calibration before each season</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Automated Actions">
        <Subsection title="Irrigation Triggers">
          <p>
            Automatically start/stop irrigation based on sensor readings:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Soil Moisture-Based:</strong> Irrigate when moisture drops below 40%, stop at 80%</li>
            <li><strong>ET-Based:</strong> Apply water when cumulative ET reaches threshold (e.g., 15mm deficit)</li>
            <li><strong>Rain Shutoff:</strong> Pause irrigation if weather station detects rain</li>
            <li><strong>Pressure Safety:</strong> Auto-shutoff if pressure exceeds 70 PSI (prevent pipe damage)</li>
          </ul>
          <Callout type="warning" title="Manual Override">
            Always install manual shutoff valves as backup. Automated systems can malfunction—don't rely solely on software control for critical infrastructure.
          </Callout>
        </Subsection>

        <Subsection title="Frost Protection Activation">
          <p>
            Trigger wind machines or sprinklers when frost imminent:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Monitor canopy temperature sensors in frost-prone areas</li>
            <li>Activate wind machines when canopy temp drops to 32°F</li>
            <li>Turn on sprinkler frost protection at 30°F (ice formation protects buds)</li>
            <li>Send emergency SMS to grower when activated</li>
          </ul>
        </Subsection>

        <Subsection title="Task Generation">
          <p>
            Create tasks automatically based on sensor data:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Irrigation Maintenance:</strong> Generate "Check filter" task when pressure differential exceeds 10 PSI</li>
            <li><strong>Leak Repair:</strong> Create urgent task if flow meter shows flow with valves closed</li>
            <li><strong>Frost Damage Assessment:</strong> Task to inspect blocks after frost event</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Data Visualization">
        <Subsection title="Real-Time Dashboards">
          <p>
            View live sensor data on Operations dashboard:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Current temperature, humidity, wind speed (weather station)</li>
            <li>Soil moisture percentage by depth (soil sensors)</li>
            <li>Active flow rate in GPM (flow meters)</li>
            <li>System pressure in PSI (pressure sensors)</li>
          </ul>
        </Subsection>

        <Subsection title="Historical Charts">
          <p>
            Analyze trends over days, weeks, or seasons:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Temperature min/max/average over 7-30 days</li>
            <li>Soil moisture depletion and recharge cycles</li>
            <li>Cumulative water use (gallons) over irrigation season</li>
            <li>Pressure fluctuations indicating system issues</li>
          </ul>
        </Subsection>

        <Subsection title="Block-Level Maps">
          <p>
            Visualize sensor data spatially on vineyard map:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Color-coded blocks by soil moisture level (red = dry, green = adequate)</li>
            <li>Flow rate heatmap showing uneven irrigation zones</li>
            <li>Weather station coverage radius overlays</li>
            <li>Sensor placement pins with live readings</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Integrations">
        <Subsection title="OpenET (Satellite ET Data)">
          <p>
            Combine ground sensors with satellite evapotranspiration data:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Validate on-site weather station with regional satellite ET</li>
            <li>Fill gaps in weather station data during outages</li>
            <li>Compare actual irrigation (flow meter) to crop ET need (satellite)</li>
          </ul>
        </Subsection>

        <Subsection title="CIMIS / AgWeatherNet">
          <p>
            Import public weather network data for regional context:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>CIMIS (California): Free ETo reference data</li>
            <li>AgWeatherNet (Washington): Hourly weather from 180+ stations</li>
            <li>Use when on-site weather station unavailable</li>
          </ul>
        </Subsection>

        <Subsection title="Trellis IoT Controllers">
          <p>
            Smart irrigation controllers with API integration:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Galcon GSI (WiFi irrigation controller)</li>
            <li>Hunter Hydrawise Pro-HC (commercial irrigation)</li>
            <li>RainBird IQ4 (cellular controller)</li>
            <li>Send irrigation schedules from Trellis to controller</li>
            <li>Receive run-time confirmations and flow data back</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Cost-Benefit Analysis">
        <Subsection title="Sensor Investment ROI">
          <p>
            Typical payback periods for hardware investments:
          </p>
          <Table
            headers={["Device", "Cost", "Savings/Benefit", "Payback Period"]}
            rows={[
              ["Weather Station", "$800-$1,200", "$500-$1,500/yr water savings", "1-2 years"],
              ["Soil Moisture (3 sensors)", "$600-$900", "$800-$2,000/yr over-irrigation reduction", "6-12 months"],
              ["Flow Meter", "$500-$900", "$300-$1,000/yr leak detection", "1-2 years"],
              ["Frost Sensor", "$300-$600", "1 saved crop ($20,000+) pays for 10 years", "Immediate if frost occurs"],
            ]}
          />
          <Callout type="success" title="20% Water Savings">
            Vineyards using soil moisture sensors typically reduce water use 15-25% while maintaining or improving yield. At $500/acre-foot water cost, 20% savings on 10 acres = $1,000-$2,500/year.
          </Callout>
        </Subsection>

        <Subsection title="Labor Savings">
          <p>
            Automated data collection reduces manual field work:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>No daily manual soil moisture checks (save 30 min/day = 15 hrs/month)</li>
            <li>Automated weather data (vs. driving to station or relying on distant CIMIS)</li>
            <li>Flow meter leak alerts prevent major damage requiring emergency repairs</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Labor savings: 15-20 hours/month × $20/hr = $300-$400/month = $3,600-$4,800/year
          </p>
        </Subsection>
      </Section>

      <Section title="Troubleshooting">
        <Subsection title="Device Offline">
          <p>
            If sensor stops transmitting data:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Check battery level (replace if below 20%)</li>
            <li>Verify network connection (WiFi signal, cellular bars)</li>
            <li>Inspect for physical damage (animal chewing, weather exposure)</li>
            <li>Restart device (power cycle or reset button)</li>
            <li>Re-pair in Trellis if still offline</li>
          </ol>
        </Subsection>

        <Subsection title="Incorrect Readings">
          <p>
            If sensor data seems wrong:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Soil moisture too high/low:</strong> Re-calibrate to soil type, check for sensor burial depth</li>
            <li><strong>Temperature anomalies:</strong> Ensure weather station not in direct sun or near reflective surfaces</li>
            <li><strong>Flow rate inconsistent:</strong> Check for air bubbles in meter, verify pipe size matches meter spec</li>
          </ul>
        </Subsection>

        <Subsection title="Alert Fatigue">
          <p>
            Too many false alarms:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Widen alert thresholds (e.g., frost alert at 32°F instead of 35°F)</li>
            <li>Add delay timer (only alert if condition persists 15+ minutes)</li>
            <li>Disable non-critical alerts during off-season</li>
          </ul>
        </Subsection>
      </Section>

      <Callout type="note" title="Beta Testing Program">
        Trellis hardware integration launches in beta April 2025. Early adopters receive 50% discount on supported devices and free installation consulting. Limited to first 50 vineyards. Email support@vinepioneer.com with "Hardware Beta" subject line to apply.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Irrigation Management",
            description: "See how sensor data integrates with irrigation scheduling",
            href: "/docs/operations/irrigation",
          },
          {
            title: "Analytics Dashboard",
            description: "Visualize sensor data and trends",
            href: "/docs/operations/analytics",
          },
          {
            title: "Support & Contact",
            description: "Get help with hardware setup and troubleshooting",
            href: "/docs/support",
          },
        ]}
      />
    </DocsLayout>
  );
}
