import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Zap,
  Wifi,
  CheckCircle,
  AlertCircle,
  Info,
  Code,
  Clock,
  Radio
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';

export function HardwareIntegrationDocs() {
  const [expandedSection, setExpandedSection] = useState('overview');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const Section = ({ id, title, icon: Icon, children }) => {
    const isExpanded = expandedSection === id;
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <button
            onClick={() => toggleSection(id)}
            className="w-full flex items-center justify-between text-left mb-4"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {isExpanded && <div className="text-gray-700 space-y-4">{children}</div>}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-start gap-4">
          <BookOpen className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Hardware Integration Documentation
            </h2>
            <p className="text-gray-700">
              Connect your irrigation controllers to automatically log irrigation events, track water usage,
              and keep your water balance calculations accurate without manual data entry.
            </p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Section id="overview" title="How It Works" icon={Info}>
        <div className="space-y-4">
          <p className="text-gray-700">
            The hardware integration system connects your physical irrigation controllers to Vineyard Planner
            using two different methods:
          </p>

          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-500 mb-4">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Controllers That Work RIGHT NOW
            </h4>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Rachio Smart Sprinkler (Recommended)</strong> - Native webhook support.
                  Perfect for small to medium vineyards. Install and connect in minutes.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Radio className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Hunter Hydrawise</strong> - API polling support (checks every 15 min).
                  Widely used in agriculture. <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">REQUIRES DEPLOYMENT</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Commercial Vineyard Controllers (No Public API)
            </h4>
            <div className="text-sm text-gray-700 mb-2">
              Most commercial vineyard irrigation systems don't offer public APIs yet:
            </div>
            <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
              <li><strong>Galcon GALILEO Cloud</strong> - Cloud platform, no developer API</li>
              <li><strong>Baseline AG 1000</strong> - BaseManager cloud, no developer API</li>
              <li><strong>Verdi</strong> - Vineyard automation system, no public API</li>
              <li><strong>Mottech IRRInet</strong> - Enterprise irrigation control, no public API</li>
              <li><strong>eVineyard/Vinduino</strong> - LoRaWAN sensors, limited API access</li>
            </ul>
            <p className="text-xs text-gray-600 mt-2 italic">
              We're actively working on partnerships with these manufacturers. Contact us if you use one of these systems.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
            <h4 className="font-bold text-gray-900 mb-2">Automatic Workflow:</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>Your irrigation controller runs a zone (e.g., Zone 1 for 2 hours)</li>
              <li>Controller sends data to Vineyard Planner (webhook) OR we poll the API (Hunter)</li>
              <li>System finds your zone mapping (e.g., Zone 1 → Dino Block)</li>
              <li>Irrigation event is created automatically</li>
              <li>Event appears in Irrigation History with purple "⚡ Auto Z#" badge</li>
              <li>Water Balance is updated instantly with the new irrigation data</li>
            </ol>
          </div>
        </div>
      </Section>

      {/* Webhook Setup */}
      <Section id="webhook-setup" title="Webhook Setup (Rachio, Flow Meters, Custom)" icon={Zap}>
        <div className="space-y-6">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                <strong>Prerequisites:</strong> Your irrigation controller must support webhook/HTTP notifications.
                Check your controller's manual or contact the manufacturer.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Step 1: Add Your Device</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside ml-4">
              <li>Click the <strong>"Add Device"</strong> button on the Devices page</li>
              <li>Select your device type (Rain Bird, Toro, Flow Meter, or Custom Webhook)</li>
              <li>Enter a device name (e.g., "Main Pump Station")</li>
              <li>Enter your device ID (serial number or MAC address)</li>
              <li>Click <strong>"Add Device"</strong></li>
            </ol>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Step 2: Copy Webhook URL</h4>
            <p className="text-sm text-gray-700 mb-2">
              After adding your device, you'll see a device card with your unique webhook URL:
            </p>
            <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
              https://ewxbxojwmdhoeybqmewi.supabase.co/functions/v1/irrigation-webhook?token=abc123-xyz...
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Click the <strong>"Copy"</strong> button to copy this URL. Each device gets a unique token. You'll need it for the next step.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Step 3: Configure Zone Mappings</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside ml-4">
              <li>Click <strong>"Configure Zones"</strong> on your device card</li>
              <li>Click <strong>"Add Zone Mapping"</strong></li>
              <li>Enter the zone number from your controller (e.g., 1-10)</li>
              <li>Select which vineyard field this zone irrigates</li>
              <li>Enter the flow rate (GPM) for this zone</li>
              <li>Select irrigation method (drip, micro-sprinkler, etc.)</li>
              <li>Click <strong>"Save Zone"</strong></li>
              <li>Repeat for all zones on your controller</li>
            </ol>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Step 4: Configure Your Controller</h4>

            <div className="space-y-4 mt-4">
              {/* Rachio */}
              <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                <h5 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  💧 Rachio Smart Sprinkler (Recommended)
                  <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">TESTED & WORKING</span>
                </h5>
                <p className="text-sm text-gray-700 mb-3">
                  Rachio has native webhook support and is the easiest controller to set up. Perfect for vineyards up to 50 acres.
                </p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside ml-4">
                  <li>Add a <strong>"Rachio"</strong> device in Vineyard Planner</li>
                  <li>Copy your webhook URL</li>
                  <li>Go to <a href="https://app.rach.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">app.rach.io</a></li>
                  <li>Click <strong>Settings</strong> → <strong>Get API Key</strong></li>
                  <li>Copy your API key and paste it in Vineyard Planner when adding the device</li>
                  <li>Go to <a href="https://rachio.readme.io/reference/webhooks" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Rachio Webhook Settings</a></li>
                  <li>Add your webhook URL</li>
                  <li>Enable <strong>ZONE_STARTED</strong> and <strong>ZONE_STOPPED</strong> events</li>
                  <li>Configure zone mappings in Vineyard Planner</li>
                </ol>
                <div className="bg-white p-3 rounded mt-3 border border-green-300">
                  <p className="text-xs text-gray-700">
                    <strong>✅ Why Rachio:</strong> Native webhooks, easy setup, works with vineyards up to 16 zones.
                    Widely available at hardware stores. $200-$400 depending on model.
                  </p>
                </div>
              </div>

              {/* Custom Webhook for Other Systems */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-bold text-gray-900 mb-2">🔌 Other Controllers (Custom Webhook)</h5>
                <p className="text-sm text-gray-700 mb-3">
                  If your controller isn't listed but can send HTTP POST requests, use the "Custom Webhook" device type.
                </p>
                <div className="bg-yellow-50 p-3 rounded mb-3 text-sm text-gray-700">
                  <strong>Note:</strong> Most commercial vineyard controllers (Galcon, Baseline, Verdi, Mottech) don't support webhooks yet.
                  We're working on partnerships. For now, use manual logging or switch to Rachio/Hydrawise.
                </div>
              </div>

              {/* Flow Meter */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-bold text-gray-900 mb-2">📊 Network-Enabled Flow Meter</h5>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside ml-4">
                  <li>Add a <strong>"Flow Meter"</strong> or <strong>"Custom Webhook"</strong> device in Vineyard Planner</li>
                  <li>Copy the webhook URL from your device card</li>
                  <li>Access your flow meter's web interface</li>
                  <li>Find the <strong>"HTTP Notification"</strong> or <strong>"Webhook"</strong> settings</li>
                  <li>Paste your webhook URL</li>
                  <li>Configure it to send a POST request when irrigation ends</li>
                  <li>Set the data format to JSON (see required format below)</li>
                  <li>Test using the <strong>Webhook Tester</strong> before connecting hardware</li>
                </ol>
                <div className="bg-blue-50 p-3 rounded mt-3 text-xs text-gray-700">
                  <strong>Required JSON Payload:</strong>
                  <pre className="mt-2 bg-white p-2 rounded text-xs overflow-x-auto">
{`{
  "zone_number": 1,                    // Required
  "start_time": "2025-11-05T06:00:00Z", // Required (ISO 8601)
  "end_time": "2025-11-05T08:30:00Z",   // Required (ISO 8601)
  "total_gallons": 42500                // Optional (calculated if not provided)
}`}
                  </pre>
                  <p className="mt-2 text-xs">
                    <strong>✅ Verified:</strong> This payload format is tested and working. Use the Webhook Tester to verify before connecting hardware.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Step 5: Test Your Setup</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside ml-4">
              <li>Navigate to <strong>Hardware → Webhook Tester</strong></li>
              <li>Select your device from the dropdown</li>
              <li>Configure test payload (zone, times, flow rate)</li>
              <li>Click <strong>"Send Test Webhook"</strong></li>
              <li>You should see a success message with an event ID</li>
              <li>Go to <strong>Irrigation History</strong> and verify the event appears with a purple "⚡ Auto Z#" badge</li>
            </ol>
          </div>
        </div>
      </Section>

      {/* API Polling Setup */}
      <Section id="api-setup" title="API Polling Setup (Hunter Hydrawise)" icon={Radio}>
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">How It Works for You:</p>
                <p>
                  Hunter Hydrawise doesn't support webhooks, so Vineyard Planner automatically connects to
                  your Hydrawise cloud account every 15 minutes and imports new irrigation events. You just
                  need to add your Hydrawise API key once, and everything happens automatically after that.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-500">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1 text-gray-900">✅ Setup Time: 5 Minutes</p>
                <p>
                  No hardware configuration needed! Just get your Hydrawise API key, add it to Vineyard Planner,
                  map your zones, and you're done. Irrigation events will automatically appear within 15 minutes
                  of completion.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Step 1: Get Your Hydrawise API Key</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside ml-4">
              <li>Go to <a href="https://hydrawise.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Hydrawise.com</a> and log in to your account</li>
              <li>Click on your name in the top-right corner</li>
              <li>Select <strong>My Account</strong> → <strong>Account Details</strong></li>
              <li>Scroll down to the <strong>API Settings</strong> section</li>
              <li>Click <strong>"Generate API Key"</strong> (or copy existing key if you already have one)</li>
              <li>Copy the API key - it looks like: <code className="bg-gray-100 px-2 py-1 rounded text-xs">ABC123XYZ456...</code></li>
            </ol>
            <div className="bg-yellow-50 p-3 rounded mt-3 text-xs text-gray-700">
              <strong>💡 Tip:</strong> Keep your API key secure. Don't share it publicly or commit it to code repositories.
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Step 2: Add Hydrawise Device in Vineyard Planner</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside ml-4">
              <li>Go to <strong>Hardware → Devices</strong> in Vineyard Planner</li>
              <li>Click the <strong>"Add Device"</strong> button</li>
              <li>Select <strong>"Hunter Hydrawise"</strong> as the device type</li>
              <li>Enter a device name (e.g., "North Block Controller" or "Hydrawise HC12")</li>
              <li>Enter your controller ID (found in Hydrawise mobile app: <strong>Menu → Controllers → [Controller Name]</strong>)</li>
              <li>Paste your API key in the <strong>"API Key"</strong> field</li>
              <li>Click <strong>"Add Device"</strong></li>
            </ol>
            <p className="text-sm text-gray-600 mt-2">
              ✅ Your device is now connected! Vineyard Planner will start checking for irrigation events automatically.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Step 3: Map Zones to Vineyard Fields</h4>
            <p className="text-sm text-gray-700 mb-2">
              Tell Vineyard Planner which zone on your Hydrawise controller irrigates which vineyard field:
            </p>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside ml-4">
              <li>On your device card, click <strong>"Configure Zones"</strong></li>
              <li>Click <strong>"Add Zone Mapping"</strong></li>
              <li>Enter the <strong>zone number</strong> from your Hydrawise controller (e.g., 1, 2, 3...)</li>
              <li>Give the zone a name (optional, e.g., "Chardonnay Block")</li>
              <li>Select which <strong>vineyard field</strong> this zone irrigates from the dropdown</li>
              <li>Enter the <strong>flow rate in GPM</strong> for this zone (critical for water calculations)</li>
              <li>Select the <strong>irrigation method</strong> (drip, micro-sprinkler, etc.)</li>
              <li>Click <strong>"Save Zone"</strong></li>
              <li>Repeat for each zone on your controller</li>
            </ol>
            <div className="bg-blue-50 p-3 rounded mt-3 text-xs text-gray-700">
              <strong>📌 Important:</strong> Flow rate is critical for accurate water balance calculations. Find this in your
              Hydrawise zone settings or measure it with a flow meter.
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Step 4: That's It! Automatic Sync is Active</h4>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 mb-3">
                <strong>What Happens Next:</strong>
              </p>
              <ul className="text-sm text-gray-700 space-y-2 ml-4 list-disc list-inside">
                <li>Every <strong>15 minutes</strong>, Vineyard Planner checks your Hydrawise cloud account for new irrigation events</li>
                <li>When your Hydrawise controller runs a zone, it gets logged to Vineyard Planner automatically</li>
                <li>Events appear in <strong>Irrigation History</strong> with a purple <strong>"⚡ Auto Z#"</strong> badge</li>
                <li>Your <strong>Water Balance</strong> updates automatically with the new irrigation data</li>
                <li>The "Last Sync" time shows on your device card so you know it's working</li>
              </ul>
            </div>
            <div className="bg-green-50 p-3 rounded mt-3 text-sm text-gray-700 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>No manual data entry needed!</strong> From now on, every time your Hydrawise runs irrigation,
                it will automatically log to your vineyard within 15 minutes.
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-2">Things to Remember:</p>
                <ul className="space-y-1 ml-4 list-disc list-inside">
                  <li><strong>15-minute delay:</strong> Events can take up to 15 minutes to appear after irrigation completes (this is normal)</li>
                  <li><strong>Keep API key secure:</strong> Don't share your Hydrawise API key with anyone</li>
                  <li><strong>API key changed?</strong> If you regenerate your API key in Hydrawise, update it in Vineyard Planner</li>
                  <li><strong>Check "Last Sync":</strong> The device card shows when we last checked for events</li>
                  <li><strong>Historical data:</strong> Only new events are imported (past events must be manually logged)</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">How to Verify It's Working:</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside ml-4">
              <li>Run a manual irrigation on your Hydrawise controller (use Quick Run or start a zone manually)</li>
              <li>Wait 15-20 minutes for the next sync cycle</li>
              <li>Check <strong>Irrigation History</strong> in Vineyard Planner</li>
              <li>Look for the event with a purple <strong>"⚡ Auto Z#"</strong> badge</li>
              <li>Verify the zone number, duration, and water amount are correct</li>
            </ol>
            <p className="text-sm text-gray-600 mt-2">
              If the event appears correctly, you're all set! 🎉
            </p>
          </div>
        </div>
      </Section>

      {/* FAQs */}
      <Section id="faqs" title="Frequently Asked Questions" icon={BookOpen}>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: Can I use both manual logging and automatic hardware logging?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> Yes! You can still manually log irrigation events anytime. Automatic events
              show a purple "⚡ Auto Z#" badge, while manual events don't have a badge. Both are included in
              water balance calculations.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: What if my controller isn't listed?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> Use the "Custom Webhook" option. If your controller can send HTTP POST
              requests, it will work. Contact your controller manufacturer to ask if they support webhooks
              or HTTP notifications.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: Can one zone irrigate multiple fields?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> No, currently one zone can only map to one field. If you need to irrigate
              multiple fields from one zone, you'll need to manually split the water usage or create separate
              zones on your controller.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: What happens if I delete a device?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> Deleting a device removes it and all its zone mappings, but it does
              <strong> NOT</strong> delete historical irrigation events that were already logged. Those remain
              in your history.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: How secure is the webhook URL?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> Very secure. Each device has a unique UUID token that's impossible to guess.
              The webhook is rate-limited to 1000 requests/day. You can disable or delete a device anytime to
              revoke access.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: Can I import historical irrigation data?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> Not automatically. Webhooks only log new events going forward. For historical
              data, you'll need to manually log past irrigation events using the "Log Irrigation" button.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: What if my controller sends data in a different format?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> The system is flexible and calculates missing values. Required fields are:
              zone_number, start_time, end_time. Optional fields: flow_rate_avg, total_gallons, notes. If
              flow_rate isn't provided, we use the rate from your zone mapping.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: How do I know if my hardware is working?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> Use the Webhook Tester first. After connecting real hardware, check the
              "Last Sync" time on your device card. For webhooks, run a manual test irrigation on your
              controller and check if it appears in Irrigation History within 1 minute.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: Does this work offline?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> No, your irrigation controller needs an internet connection to send webhooks
              or for API polling to work. Most modern controllers connect via WiFi or cellular.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: What's the difference between webhook and API polling?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> <strong>Webhooks</strong> = Your controller pushes data to us instantly when
              a zone runs (real-time). <strong>API Polling</strong> = We pull data from your controller's cloud
              every 15 minutes (slight delay). Rain Bird and Toro use webhooks. Hunter Hydrawise uses API polling.
            </p>
          </div>
        </div>
      </Section>

      {/* Troubleshooting */}
      <Section id="troubleshooting" title="Troubleshooting" icon={AlertCircle}>
        <div className="space-y-6">
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Problem: Webhook returns 401 Unauthorized</h4>
            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>Check that the webhook token in the URL is correct</li>
              <li>Verify the device is active (not disabled)</li>
              <li>Make sure you're using the complete webhook URL with the token parameter</li>
            </ul>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Problem: Webhook returns 404 Zone Not Found</h4>
            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>Verify the zone number in the webhook payload matches your zone mapping</li>
              <li>Check that you've configured zone mappings for this device</li>
              <li>Ensure the zone is mapped to a valid vineyard field</li>
            </ul>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Problem: Events not appearing in Irrigation History</h4>
            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>Use the Webhook Tester to check for detailed error messages</li>
              <li>Verify your Supabase Edge Function is deployed (check Supabase dashboard)</li>
              <li>Check browser console for JavaScript errors</li>
              <li>Ensure the irrigation_events table has the new event (check Supabase table editor)</li>
            </ul>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Problem: Flow rate or water total seems wrong</h4>
            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>Verify the flow_rate_gpm in your zone mapping is correct</li>
              <li>Check if your controller is sending flow_rate_avg in the webhook</li>
              <li>Ensure your controller's flow sensor is calibrated properly</li>
              <li>For flow meters: verify total_gallons calculation is accurate</li>
            </ul>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Problem: Hydrawise events not syncing</h4>
            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>Verify your API key is correct (regenerate if needed)</li>
              <li>Check the "Last Sync" time on your device card</li>
              <li>Ensure your Hydrawise controller is online and connected to cloud</li>
              <li>Wait up to 15 minutes for the next sync cycle</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Still having issues?</p>
                <p>
                  Check the <strong>Webhook Tester</strong> for detailed error messages. The tester shows
                  exactly what's happening when data is sent to your webhook endpoint.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* DIY Setup */}
      <Section id="diy" title="DIY Arduino/ESP32 Setup" icon={Code}>
        <div className="space-y-6">
          <p className="text-gray-700">
            Build your own irrigation monitor using affordable hardware. Perfect if your controller
            doesn't support webhooks or you want a standalone flow monitoring system.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3">Required Hardware (~$45):</h4>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>ESP32 Development Board - $8 (Amazon)</li>
              <li>YF-S201 Flow Sensor - $12 (Amazon)</li>
              <li>12V Power Supply - $10 (Amazon)</li>
              <li>Weatherproof Enclosure - $15 (Amazon)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Setup Instructions:</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside ml-4">
              <li>Install Arduino IDE and ESP32 board support</li>
              <li>Connect YF-S201 flow sensor to ESP32 GPIO pin 2</li>
              <li>Copy the Arduino sketch code (see below)</li>
              <li>Update WiFi credentials and webhook URL in the code</li>
              <li>Upload sketch to ESP32</li>
              <li>Install in weatherproof enclosure near your irrigation valve</li>
              <li>Connect flow sensor inline with your irrigation line</li>
            </ol>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Arduino Code Snippet:</h4>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
              <pre>{`#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* webhookUrl = "YOUR_WEBHOOK_URL";

const int flowSensorPin = 2;
volatile int pulseCount = 0;
float flowRate = 0.0;
unsigned long startTime = 0;

void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

void setup() {
  Serial.begin(115200);
  pinMode(flowSensorPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(flowSensorPin), pulseCounter, FALLING);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
}

void sendWebhook(unsigned long duration, float totalGallons) {
  HTTPClient http;
  http.begin(webhookUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\\"zone_number\\": 1,";
  payload += "\\"start_time\\": \\"" + getISOTime(startTime) + "\\",";
  payload += "\\"end_time\\": \\"" + getISOTime(millis()) + "\\",";
  payload += "\\"total_gallons\\": " + String(totalGallons);
  payload += "}";

  int httpCode = http.POST(payload);
  Serial.println("Webhook sent: " + String(httpCode));
  http.end();
}

// Full code available in documentation...`}</pre>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Complete Arduino code with WiFi setup, flow calculation, and webhook sending is available
              in the full documentation PDF.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
