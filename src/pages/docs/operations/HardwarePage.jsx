import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function HardwarePage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Hardware Integration"
        subtitle="Connect irrigation controllers, flow meters, and IoT devices to automatically track water usage in real-time."
      />

      <Callout type="success" title="Now Available">
        Hardware integration is live. Connect your devices to get automatic irrigation logging, real-time flow monitoring, and accurate water balance calculations without manual data entry.
      </Callout>

      <Section title="Overview">
        <p>
          Trellis connects directly to your irrigation hardware to automatically track every irrigation event.
          When your system runs, the data flows straight into Trellis - no manual logging required.
        </p>
        <p className="mt-3">
          <strong>Two integration methods:</strong>
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
          <li><strong>Real-Time Webhooks:</strong> Your device sends data directly to Trellis. See flow rates update live, track active sessions, and get instant event logging. Best for flow meters and ESP32/Arduino devices.</li>
          <li><strong>API Polling:</strong> Trellis checks your controller's cloud API every 15 minutes to import new irrigation events. Best for Hunter Hydrawise.</li>
        </ul>
      </Section>

      <Section title="How Devices Connect to Trellis">
        <p>
          Your irrigation equipment needs an internet connection to send data to Trellis. Here are the options, from simplest to most remote:
        </p>

        <Subsection title="Option 1: WiFi from Your House/Barn (Most Common)">
          <p>
            For most 5-15 acre vineyards, your pump house or equipment shed is close enough to reach with WiFi:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Direct WiFi:</strong> If your controller is within ~100 feet of your router, it may connect directly</li>
            <li><strong>WiFi Extender:</strong> A $30-50 extender in your barn can boost signal to the pump house</li>
            <li><strong>Outdoor Access Point:</strong> For better range, mount an outdoor AP like Ubiquiti NanoStation ($80-100) - reaches 500+ feet line-of-sight</li>
            <li><strong>Mesh Network:</strong> Systems like Google Nest or Eero can extend coverage across your property</li>
          </ul>
          <Callout type="tip" title="Where's Your Controller?">
            Most irrigation controllers are installed in the pump house, equipment shed, or garage - not in the middle of the field. If you have power there, you can usually get WiFi there too.
          </Callout>
        </Subsection>

        <Subsection title="Option 2: Cellular (No WiFi Needed)">
          <p>
            For remote locations without WiFi, cellular is the most reliable option:
          </p>
          <Table
            headers={["Device", "Monthly Cost", "Setup", "Best For"]}
            rows={[
              ["Hunter Hydrawise + LTE module", "$10-15/mo", "Easy - plug in module", "Already have Hydrawise"],
              ["Cellular modem + any controller", "$10-20/mo", "Moderate", "Any WiFi device"],
              ["ESP32 + SIM7000 LTE module", "$5-15/mo", "DIY", "Custom flow meters"],
              ["Hologram or Particle IoT SIM", "$3-10/mo", "Varies", "Low-data IoT devices"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-2">
            <strong>Cellular modems:</strong> A device like the Netgear LB1120 ($100-150) creates a WiFi hotspot from cellular signal. Your controller connects to it like normal WiFi.
          </p>
        </Subsection>

        <Subsection title="Option 3: LoRaWAN (Miles of Range, No Monthly Fee)">
          <p>
            LoRaWAN is designed for exactly this problem - sensors in remote fields that need to reach the internet:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Range:</strong> 2-10+ miles line-of-sight, 1-3 miles through terrain</li>
            <li><strong>Power:</strong> Battery lasts 2-10 years (no solar or wiring needed)</li>
            <li><strong>Cost:</strong> No monthly fees if you run your own gateway</li>
          </ul>
          <p className="font-semibold mt-3">How it works:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4 text-sm">
            <li>LoRaWAN sensor in field reads flow meter pulses</li>
            <li>Sensor transmits to a LoRaWAN gateway (at your house, has internet)</li>
            <li>Gateway sends data to The Things Network (free)</li>
            <li>The Things Network forwards to Trellis via webhook</li>
          </ol>
          <Table
            headers={["Component", "Price", "Notes"]}
            rows={[
              ["Dragino LWL02 pulse counter", "$50-80", "Connects to any flow meter"],
              ["Dragino LPS8 gateway", "$150-200", "Place at house, covers whole property"],
              ["The Things Network", "Free", "Routes data to Trellis"],
            ]}
          />
          <Callout type="success" title="Best for Remote Vineyards">
            LoRaWAN is ideal if your vineyard is far from buildings, has no power at the pump, or you want battery-powered sensors that last years without maintenance.
          </Callout>
        </Subsection>

        <Subsection title="What About Sensors in the Middle of the Field?">
          <p>
            Flow meters and controllers are almost always near your pump station - not in the middle of vines. But if you want soil moisture sensors or weather stations in the field:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Solar + Cellular:</strong> Self-powered weather stations like Davis Vantage Pro2 or Tempest</li>
            <li><strong>LoRaWAN sensors:</strong> Battery-powered, transmit miles to your gateway</li>
            <li><strong>Bluetooth/Zigbee mesh:</strong> Short-range sensors relay data to a hub with internet</li>
          </ul>
        </Subsection>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 my-4">
          <h4 className="font-bold text-gray-900 mb-2">Quick Decision Guide</h4>
          <ul className="text-sm text-gray-700 space-y-2">
            <li><strong>Pump house within 500 ft of house?</strong> → WiFi extender or outdoor AP ($30-100)</li>
            <li><strong>Pump house has cell signal?</strong> → Cellular modem ($100 + $10-20/mo)</li>
            <li><strong>Remote location, no cell signal?</strong> → LoRaWAN ($200-300 one-time)</li>
            <li><strong>Already have Hydrawise?</strong> → Hunter sells an LTE add-on module</li>
          </ul>
        </div>
      </Section>

      <Section title="What Most Vineyards Use">
        <p>
          For a typical 5-15 acre vineyard with drip irrigation, here's what we see most often:
        </p>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 my-4">
          <h4 className="font-bold text-gray-900 mb-2">Typical Setup (5-15 Acres)</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
            <li><strong>Controller:</strong> Hunter Hydrawise HC or Rain Bird ESP-TM2 (6-12 zones)</li>
            <li><strong>Mainline:</strong> 1.5" to 2" PVC or poly pipe</li>
            <li><strong>Flow Meter:</strong> 1.5" or 2" inline meter on main pump output</li>
            <li><strong>Pump:</strong> 1-3 HP with 15-40 GPM output</li>
          </ul>
        </div>
      </Section>

      <Section title="Irrigation Controllers">
        <p>
          These are the controllers we see most often in small-medium vineyards. All can integrate with Trellis.
        </p>

        <Subsection title="Hunter Hydrawise (Recommended)">
          <p>
            The most popular choice for serious vineyard operations. Commercial-grade with excellent cloud connectivity.
          </p>
          <Table
            headers={["Model", "Zones", "Price", "Best For"]}
            rows={[
              ["HC-600", "6 zones", "$180-220", "Small vineyard, single block"],
              ["HC-1200", "12 zones", "$250-300", "5-10 acres, multiple blocks"],
              ["Pro-HC", "Up to 24 zones", "$350-500", "10-20 acres, commercial"],
            ]}
          />
          <ul className="list-disc list-inside space-y-1 ml-4 mt-3 text-sm">
            <li>WiFi or hardwired ethernet connection</li>
            <li>Flow sensor input for leak detection</li>
            <li>Trellis syncs automatically via API - no webhook setup needed</li>
            <li>Weather-based smart scheduling built in</li>
          </ul>
          <Callout type="success" title="Easiest Integration">
            Just add your Hydrawise API key to Trellis. Events sync automatically every 15 minutes - no controller configuration needed.
          </Callout>
        </Subsection>

        <Subsection title="Rain Bird ESP-TM2 / ESP-ME3">
          <p>
            Reliable, affordable controllers found in many vineyards. Requires a LNK WiFi module for cloud connectivity.
          </p>
          <Table
            headers={["Model", "Zones", "Price", "Notes"]}
            rows={[
              ["ESP-TM2 (4 station)", "4 zones", "$80-100", "Add modules for more zones"],
              ["ESP-TM2 (8 station)", "8 zones", "$100-130", "Most common for small vineyards"],
              ["ESP-ME3", "4-22 zones", "$120-200", "Modular, expandable"],
              ["LNK WiFi Module", "-", "$80-100", "Required for cloud/Trellis connection"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-2">
            <strong>Note:</strong> Requires Rain Bird LNK WiFi module ($80) for cloud connectivity. Works with Rain Bird app, webhook integration available.
          </p>
        </Subsection>

        <Subsection title="Rachio 3">
          <p>
            Consumer-smart controller that's surprisingly capable for small vineyards. Native webhook support makes integration seamless.
          </p>
          <Table
            headers={["Model", "Zones", "Price", "Best For"]}
            rows={[
              ["Rachio 3 (8 zone)", "8 zones", "$200-230", "Small vineyard, 1-5 acres"],
              ["Rachio 3 (16 zone)", "16 zones", "$280-330", "Medium vineyard, 5-10 acres"],
            ]}
          />
          <ul className="list-disc list-inside space-y-1 ml-4 mt-3 text-sm">
            <li>WiFi built-in, no extra modules needed</li>
            <li>Native webhook support - real-time event notifications</li>
            <li>Great mobile app</li>
            <li>Weather Intelligence auto-adjusts schedules</li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">
            <strong>Limitation:</strong> Designed for residential/light commercial. May not handle high-amperage solenoids for large valves.
          </p>
        </Subsection>

        <Subsection title="Galcon (Common but Limited)">
          <p>
            Very popular in vineyards, especially the Galcon GSI series. Unfortunately, no public API available yet.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Galcon GSI</strong> - WiFi irrigation controller, common in agriculture</li>
            <li><strong>Galcon AC-4/6/8</strong> - Battery-powered, no cloud connectivity</li>
          </ul>
          <Callout type="warning" title="No API Available">
            Galcon doesn't offer a public API. If you use Galcon, you'll need to add a flow meter for automatic logging,
            or log irrigation manually. We're working on a partnership - contact us if interested.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Flow Meters">
        <p>
          Flow meters provide the most accurate irrigation tracking. Install on your main irrigation line to automatically log every irrigation event with exact water usage.
        </p>

        <Subsection title="Recommended for 5-15 Acre Vineyards">
          <Table
            headers={["Meter", "Pipe Size", "Flow Range", "Price", "Notes"]}
            rows={[
              ["DAE AS250U-100P", "1\"", "1-25 GPM", "$70-90", "Budget-friendly, pulse output"],
              ["DAE AS250U-150P", "1.5\"", "3-50 GPM", "$90-120", "Most common for small vineyards"],
              ["DAE AS250U-200P", "2\"", "5-100 GPM", "$110-150", "Larger mainlines"],
              ["Flomec QS200", "1-2\"", "1-100 GPM", "$150-250", "Agriculture-focused, very accurate"],
              ["Seametrics AG2000", "1-3\"", "5-200 GPM", "$250-400", "Commercial grade, pulse output"],
            ]}
          />
          <Callout type="tip" title="How to Choose">
            Match meter size to your mainline pipe. For drip irrigation on 5-15 acres, you'll typically have 1.5" or 2" mainline with 15-40 GPM flow rate. A DAE AS250U-150P or AS250U-200P is usually the right choice.
          </Callout>
        </Subsection>

        <Subsection title="Connecting Flow Meters to Trellis">
          <p>
            Flow meters output pulses (electrical signals) as water flows. You need a device to count these pulses and send data to Trellis:
          </p>
          <Table
            headers={["Option", "Price", "Difficulty", "Best For"]}
            rows={[
              ["ESP32 + pulse counter", "$15-30", "Moderate (DIY)", "Tech-savvy users, flexible"],
              ["Dragino LoRaWAN logger", "$80-120", "Easy", "Remote locations, no WiFi"],
              ["Atlas Scientific WiFi logger", "$150-200", "Easy", "Plug-and-play, reliable"],
              ["Hunter Hydrawise flow input", "Included", "Easy", "If you already have Hydrawise"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            <strong>Already have Hydrawise?</strong> Hunter controllers have a built-in flow sensor input. Connect your meter's pulse output directly - no additional hardware needed.
          </p>
        </Subsection>

        <Subsection title="Installation Tips">
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Location:</strong> Install after pump, before any branching. Straight pipe run: 10 pipe diameters upstream, 5 downstream.</li>
            <li><strong>Orientation:</strong> Most meters work in any orientation, but check your model's specs.</li>
            <li><strong>Air:</strong> Air bubbles cause false readings. Install at low point or add air release valve upstream.</li>
            <li><strong>Wiring:</strong> Pulse output wires can run 100+ feet to your logger. Use shielded cable for long runs.</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Budget Options">
        <p>
          Not ready to invest in a full flow meter setup? Here are lower-cost ways to get started:
        </p>

        <Subsection title="Option 1: Controller Integration Only ($0-100)">
          <p>
            If you have Hunter Hydrawise or Rachio, you can integrate with Trellis immediately:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li>Events logged automatically when zones run</li>
            <li>Water usage calculated from zone flow rates you enter</li>
            <li>No additional hardware needed</li>
            <li>Limitation: Relies on estimated flow rates, not actual measurement</li>
          </ul>
        </Subsection>

        <Subsection title="Option 2: DIY Flow Meter ($25-50)">
          <p>
            Build a test setup to validate the system before investing in commercial equipment:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li>ESP32 DevKit - $12</li>
            <li>YF-S201 flow sensor - $10</li>
            <li>Basic wiring and USB power - $5</li>
          </ul>
          <Callout type="warning" title="For Testing Only">
            The YF-S201 is a plastic sensor meant for testing. It won't survive outdoor conditions or debris in irrigation lines. Use it to validate your webhook setup, then upgrade to a commercial meter.
          </Callout>
        </Subsection>

        <Subsection title="Option 3: Commercial Flow Meter ($150-300)">
          <p>
            The best long-term investment for accurate water tracking:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li>DAE or Flomec meter - $90-150</li>
            <li>ESP32 pulse counter - $15-30</li>
            <li>Weatherproof enclosure - $20-40</li>
            <li>Total: $150-250 for accurate, real-time water monitoring</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="DIY & Custom Devices">
        <Subsection title="ESP32/Arduino">
          <p>
            Any device that can send HTTP POST requests can integrate with Trellis. The ESP32 is the most popular choice for DIY projects:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Built-in WiFi, no shields needed</li>
            <li>Multiple GPIO pins for pulse counting</li>
            <li>Deep sleep for battery-powered applications</li>
            <li>$8-15 for development boards</li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">
            See the DIY ESP32 Setup section below for complete wiring and firmware code.
          </p>
        </Subsection>

        <Subsection title="LoRaWAN Devices">
          <p>
            For vineyards without WiFi coverage, LoRaWAN sensors can transmit data miles to a gateway:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Dragino SW3L</strong> - Water meter sensor, 10-year battery, $80-120</li>
            <li><strong>Dragino LWL02</strong> - Pulse counter, works with any meter, $50-80</li>
            <li><strong>SenseCAP S2120</strong> - Weather station with flow input, $200-300</li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">
            LoRaWAN devices send data to The Things Network, which can forward to Trellis via webhook.
          </p>
        </Subsection>

        <Callout type="note" title="Commercial Controllers">
          Most commercial vineyard systems (Galcon, Baseline, Verdi, Mottech, Netafim GrowSphere) don't offer public APIs yet. We're actively working on partnerships. Contact support@trellisag.com if you use one of these systems.
        </Callout>
      </Section>

      <Section title="Setting Up Your Device">
        <Subsection title="Step 1: Add Device in Trellis">
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to <strong>Operations → Hardware → Devices</strong></li>
            <li>Click <strong>"Add Device"</strong></li>
            <li>Select your device type (Flow Meter, Rachio, Hydrawise, or Custom)</li>
            <li>Enter a name for your device (e.g., "Main Pump Flow Meter")</li>
            <li>Click <strong>"Create Device"</strong></li>
          </ol>
        </Subsection>

        <Subsection title="Step 2: Copy Your Webhook URL">
          <p>
            After adding your device, you'll see a unique webhook URL on the device card:
          </p>
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm my-3 overflow-x-auto">
            https://api.trellisag.com/functions/v1/flow-meter-webhook?token=YOUR_TOKEN
          </div>
          <p>
            Click the <strong>"Copy"</strong> button to copy this URL. Each device has a unique token.
          </p>
        </Subsection>

        <Subsection title="Step 3: Configure Zone Mappings">
          <p>
            Tell Trellis which irrigation zone waters which vineyard block:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click <strong>"Configure Zones"</strong> on your device card</li>
            <li>Click <strong>"Add Zone Mapping"</strong></li>
            <li>Enter the zone number from your controller (1, 2, 3, etc.)</li>
            <li>Select which vineyard block this zone irrigates</li>
            <li>Enter the flow rate in GPM for this zone</li>
            <li>Select the irrigation method (drip, micro-sprinkler, etc.)</li>
            <li>Click <strong>"Save"</strong></li>
          </ol>
          <Callout type="tip" title="Flow Rate is Critical">
            Accurate flow rate ensures correct water balance calculations. Measure with a bucket test or check your pump specifications.
          </Callout>
        </Subsection>

        <Subsection title="Step 4: Configure Your Hardware">
          <p>
            Configure your device to send data to the Trellis webhook URL. This varies by device:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Rachio:</strong> Add webhook URL in Rachio app settings, enable ZONE_STARTED and ZONE_STOPPED events</li>
            <li><strong>Hydrawise:</strong> Just add your API key in Trellis - no controller configuration needed</li>
            <li><strong>ESP32/Arduino:</strong> Update the webhook URL and token in your firmware code</li>
            <li><strong>Custom devices:</strong> Configure HTTP POST to the webhook URL</li>
          </ul>
        </Subsection>

        <Subsection title="Step 5: Test Your Setup">
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to <strong>Hardware → Webhook Tester</strong></li>
            <li>Select your device from the dropdown</li>
            <li>Configure a test payload (zone, flow rate, etc.)</li>
            <li>Click <strong>"Send Test"</strong></li>
            <li>Verify the event appears in Irrigation History</li>
          </ol>
        </Subsection>
      </Section>

      <Section title="Live Flow Monitor">
        <p>
          The Live Flow Monitor shows real-time data from your connected flow meters:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Flow Rate Chart:</strong> Live updating chart showing GPM over time</li>
          <li><strong>Active Sessions:</strong> Currently running irrigation with duration and gallons used</li>
          <li><strong>Device Status:</strong> Online/offline status, last reading time, connection health</li>
          <li><strong>Alerts:</strong> Notifications for device offline, unexpected flow, or anomalies</li>
        </ul>

        <Subsection title="Automatic Session Detection">
          <p>
            Trellis automatically detects when irrigation starts and stops using a state machine:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Session Starts</strong> when flow exceeds 0.5 GPM for 2-3 consecutive readings</li>
            <li><strong>Session Running</strong> - flow data is accumulated, gallons and duration tracked</li>
            <li><strong>Session Ends</strong> when flow drops below 0.2 GPM for 3-5 consecutive readings</li>
            <li><strong>Event Created</strong> - irrigation event logged automatically to your history</li>
          </ol>
          <p className="mt-3 text-sm text-gray-600">
            This debouncing prevents false events from brief pressure spikes or sensor noise.
          </p>
        </Subsection>

        <Subsection title="Managing Active Sessions">
          <p>
            The <strong>"Active"</strong> tab in Irrigation Management shows all currently running irrigation sessions.
            If a session appears stuck (device went offline mid-irrigation), you can manually stop it:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to <strong>Irrigation → Active</strong> tab</li>
            <li>Find the stuck session</li>
            <li>Click the <strong>"Stop"</strong> button</li>
            <li>The session ends and an event is logged with the data collected so far</li>
          </ol>
        </Subsection>
      </Section>

      <Section title="Webhook API Reference">
        <Subsection title="Real-Time Flow Readings">
          <p>
            For devices sending readings every 10-30 seconds (recommended for live monitoring):
          </p>
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm my-3 overflow-x-auto">
            POST https://api.trellisag.com/functions/v1/flow-meter-webhook?token=YOUR_TOKEN
          </div>
          <p className="font-semibold mt-3">JSON Payload:</p>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mt-2">
{`{
  "flow_rate_gpm": 15.5,              // Required: Current flow rate
  "zone_number": 1,                    // Optional: Zone identifier
  "cumulative_gallons": 1250.5,        // Optional: Total since device start
  "timestamp": "2025-11-05T14:30:00Z"  // Optional: Device time
}`}
          </pre>
        </Subsection>

        <Subsection title="Event-Based Notifications">
          <p>
            For devices that send a single notification when irrigation completes:
          </p>
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm my-3 overflow-x-auto">
            POST https://api.trellisag.com/functions/v1/irrigation-webhook?token=YOUR_TOKEN
          </div>
          <p className="font-semibold mt-3">JSON Payload:</p>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mt-2">
{`{
  "zone_number": 1,                     // Required
  "start_time": "2025-11-05T06:00:00Z", // Required (ISO 8601)
  "end_time": "2025-11-05T08:30:00Z",   // Required (ISO 8601)
  "total_gallons": 42500                // Optional
}`}
          </pre>
        </Subsection>

        <Subsection title="Response Codes">
          <Table
            headers={["Code", "Meaning", "Action"]}
            rows={[
              ["200", "Success", "Data recorded"],
              ["401", "Unauthorized", "Check token, device may be deactivated"],
              ["404", "Zone not found", "Configure zone mapping in Trellis"],
              ["429", "Rate limited", "Slow down request frequency"],
              ["500", "Server error", "Queue locally and retry"],
            ]}
          />
        </Subsection>
      </Section>

      <Section title="DIY ESP32 Setup">
        <p>
          Build your own flow meter with an ESP32 and connect it directly to Trellis.
        </p>

        <Subsection title="Hardware Required (~$25 for testing)">
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>ESP32 DevKit v1</strong> - $12 (Amazon)</li>
            <li><strong>YF-S201 Flow Sensor</strong> - $10 (Amazon)</li>
            <li>USB cable for power and programming</li>
          </ul>
          <Callout type="warning" title="For Bench Testing Only">
            The YF-S201 is great for testing your webhook connection but not suitable for field deployment.
            For production, use industrial sensors like Seametrics IP800/810 ($150-400).
          </Callout>
        </Subsection>

        <Subsection title="Wiring">
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`YF-S201 Flow Sensor    ESP32 DevKit
─────────────────────────────────────
Red Wire (VCC) ──────► 3.3V (or 5V)
Black Wire (GND) ────► GND
Yellow Wire (Signal) ─► GPIO 27`}
          </pre>
        </Subsection>

        <Subsection title="Arduino Firmware">
          <p>
            Install Arduino IDE, add ESP32 board support, then upload this sketch:
          </p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-96">
{`#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// UPDATE THESE VALUES
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* WEBHOOK_URL = "https://api.trellisag.com/functions/v1/flow-meter-webhook";
const char* DEVICE_TOKEN = "YOUR_TOKEN_FROM_TRELLIS";

const int FLOW_PIN = 27;
volatile int pulseCount = 0;

void IRAM_ATTR countPulse() {
  pulseCount++;
}

void setup() {
  Serial.begin(115200);
  pinMode(FLOW_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), countPulse, FALLING);

  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Connected!");
}

void loop() {
  delay(30000);  // Send reading every 30 seconds

  float liters = pulseCount / 7.5;
  float gallons = liters * 0.264172;
  float gpm = gallons * 2;  // 30 sec interval
  pulseCount = 0;

  Serial.print("Flow rate: ");
  Serial.print(gpm);
  Serial.println(" GPM");

  HTTPClient http;
  String url = String(WEBHOOK_URL) + "?token=" + DEVICE_TOKEN;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["flow_rate_gpm"] = gpm;
  doc["zone_number"] = 1;

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  Serial.print("Response: ");
  Serial.println(httpCode);

  http.end();
}`}
          </pre>
          <p className="mt-3 text-sm text-gray-600">
            Open Serial Monitor (115200 baud) to see output. Run water through the sensor and watch readings appear in the Live Flow Monitor.
          </p>
        </Subsection>
      </Section>

      <Section title="Troubleshooting">
        <Subsection title="Device Shows Offline">
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Check device power and WiFi connection</li>
            <li>Verify webhook URL and token are correct</li>
            <li>Check device serial output for error messages</li>
            <li>If using deep sleep, device may appear offline between readings</li>
          </ul>
        </Subsection>

        <Subsection title="Session Stuck in Active State">
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>This happens when device stops sending data before flow ended</li>
            <li>Go to <strong>Irrigation → Active</strong> tab and click <strong>"Stop"</strong></li>
            <li>Or go to <strong>Hardware → Devices</strong> and click <strong>"Reset State"</strong></li>
          </ul>
        </Subsection>

        <Subsection title="Webhook Returns 401 Unauthorized">
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Check that the webhook token is correct</li>
            <li>Verify the device is active (not disabled)</li>
            <li>Make sure you're using the complete URL with token parameter</li>
          </ul>
        </Subsection>

        <Subsection title="Events Not Appearing in History">
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Use the Webhook Tester for detailed error messages</li>
            <li>Verify zone mappings are configured</li>
            <li>Check that the zone number in the payload matches your mapping</li>
          </ul>
        </Subsection>

        <Subsection title="Flow Readings Are Erratic">
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Check sensor calibration factor (YF-S201 uses ~7.5 pulses/liter)</li>
            <li>Ensure sensor is fully filled with water (air bubbles cause false readings)</li>
            <li>Install on straight pipe section, away from valves and elbows</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Frequently Asked Questions">
        <Subsection title="How often should my device send readings?">
          <p>
            Every <strong>10-30 seconds</strong> is ideal for real-time monitoring. This gives smooth charts
            and responsive session detection without unnecessary load.
          </p>
        </Subsection>

        <Subsection title="What flow rate triggers a new session?">
          <p>
            Default threshold is <strong>0.5 GPM</strong> to start a session and <strong>0.2 GPM</strong> to end it.
            Sessions shorter than 3 minutes or less than 5 gallons are automatically filtered out.
          </p>
        </Subsection>

        <Subsection title="Where do auto-logged events appear?">
          <p>
            Auto-logged events appear in the <strong>Completed</strong> tab of Irrigation History with a
            <strong> "Webhook"</strong> badge. They're included in Water Balance calculations automatically.
          </p>
        </Subsection>

        <Subsection title="Can I still log irrigation manually?">
          <p>
            Yes. Manual and automatic logging work together. Manual events don't have the webhook badge,
            but both types are included in water balance calculations.
          </p>
        </Subsection>

        <Subsection title="Is the webhook URL secure?">
          <p>
            Yes. Each device has a unique UUID token that's impossible to guess. Webhooks are rate-limited
            to 1000 requests/day. You can disable or delete a device anytime to revoke access.
          </p>
        </Subsection>
      </Section>

      <Callout type="note" title="Need Help?">
        For integration support, custom threshold configuration, or help with hardware setup,
        contact us at <strong>support@trellisag.com</strong>
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
            title: "Operations Overview",
            description: "Learn about all vineyard operations features",
            href: "/docs/operations",
          },
        ]}
      />
    </DocsLayout>
  );
}
