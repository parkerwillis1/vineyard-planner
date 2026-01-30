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
  Radio,
  Activity,
  Gauge,
  StopCircle,
  RefreshCw,
  Terminal,
  Shield,
  Settings,
  Play,
  Square
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
            Trellis connects your physical irrigation hardware to automatically track water usage in real-time.
            No more manual data entry - your irrigation events are logged automatically with accurate flow data.
          </p>

          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border-2 border-emerald-500 mb-4">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Two Integration Methods
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <strong className="text-sm">Real-Time Webhooks</strong>
                </div>
                <p className="text-xs text-gray-600">
                  Your device sends data directly to Trellis. See flow rates update live, track active irrigation
                  sessions, and get instant event logging.
                </p>
                <div className="mt-2 text-xs text-emerald-700 font-medium">
                  Best for: Flow meters, ESP32/Arduino, Rachio
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <strong className="text-sm">API Polling</strong>
                </div>
                <p className="text-xs text-gray-600">
                  Trellis checks your controller's cloud API every 15 minutes to import new irrigation events automatically.
                </p>
                <div className="mt-2 text-xs text-blue-700 font-medium">
                  Best for: Hunter Hydrawise
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-500 mb-4">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Supported Devices
            </h4>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex items-start gap-2">
                <Gauge className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Flow Meters (Recommended)</strong> - ESP32, Arduino, or any network-enabled flow meter.
                  Real-time monitoring with automatic session detection.
                  <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">LIVE MONITORING</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Rachio Smart Sprinkler</strong> - Native webhook support.
                  Perfect for small to medium vineyards. Install and connect in minutes.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Radio className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Hunter Hydrawise</strong> - API polling support (checks every 15 min).
                  Widely used in agriculture.
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
            <h4 className="font-bold text-gray-900 mb-2">How It Works:</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li><strong>Connect</strong> - Add your device and get a unique webhook URL</li>
              <li><strong>Map Zones</strong> - Tell Trellis which zone waters which vineyard block</li>
              <li><strong>Monitor</strong> - Watch real-time flow rates in the Live Flow Monitor</li>
              <li><strong>Auto-Log</strong> - Sessions are detected automatically and logged when complete</li>
              <li><strong>Review</strong> - Find auto-logged events in Irrigation History with the "Webhook" badge</li>
            </ol>
          </div>
        </div>
      </Section>

      {/* Live Flow Monitor */}
      <Section id="live-monitor" title="Live Flow Monitor" icon={Activity}>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
            <div className="flex items-start gap-3">
              <Gauge className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Real-Time Irrigation Monitoring</h4>
                <p className="text-sm text-gray-700">
                  The Live Flow Monitor shows real-time data from your connected flow meters. Watch flow rates update live,
                  see active irrigation sessions, and monitor device status - all in one dashboard.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">What You'll See:</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <strong className="text-sm">Flow Rate Chart</strong>
                </div>
                <p className="text-xs text-gray-600">
                  Live updating chart showing GPM (gallons per minute) over time. See exactly when irrigation starts,
                  peaks, and stops.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="w-4 h-4 text-blue-600" />
                  <strong className="text-sm">Active Sessions</strong>
                </div>
                <p className="text-xs text-gray-600">
                  Shows currently running irrigation with duration, gallons used so far, and which block is being watered.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <strong className="text-sm">Device Status</strong>
                </div>
                <p className="text-xs text-gray-600">
                  Online/offline status, last reading time, battery level (if applicable), and connection health.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <strong className="text-sm">Alerts</strong>
                </div>
                <p className="text-xs text-gray-600">
                  Get notified of issues like device offline, unexpected flow, or battery low.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Understanding Session Detection</h4>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-3">
                Trellis uses a <strong>state machine</strong> to automatically detect when irrigation starts and stops.
                This prevents false events from brief pressure spikes, pump cycling, or sensor noise.
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">1</div>
                  <div><strong>Session Starts</strong> when flow exceeds threshold for 2-3 consecutive readings</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">2</div>
                  <div><strong>Session Running</strong> - flow data accumulated, gallons and duration tracked</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">3</div>
                  <div><strong>Session Ends</strong> when flow drops below threshold for 3-5 consecutive readings</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">4</div>
                  <div><strong>Event Created</strong> - irrigation event logged automatically to your history</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Active Tab in Irrigation Management</h4>
            <p className="text-sm text-gray-700 mb-3">
              The <strong>"Active"</strong> tab shows all currently running irrigation sessions. You'll see:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>Which device and zone is irrigating</li>
              <li>Duration so far (live updating)</li>
              <li>Gallons used so far</li>
              <li>Current flow rate</li>
              <li>A <strong>Stop</strong> button to manually end stuck sessions</li>
            </ul>
            <div className="bg-yellow-50 p-3 rounded mt-3 text-xs text-gray-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Note:</strong> Sessions appear as "Active" until the device sends readings showing flow has stopped.
                If your device goes offline mid-irrigation, the session may appear stuck until manually stopped.
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <StopCircle className="w-5 h-5 text-red-500" />
              Stopping Stuck Sessions
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              If a session shows as running but irrigation has actually stopped (device went offline, WiFi dropped, etc.),
              you can manually end it:
            </p>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside ml-4">
              <li>Go to the <strong>Irrigation → Active</strong> tab</li>
              <li>Find the stuck session</li>
              <li>Click the <strong>"Stop"</strong> button</li>
              <li>The session will be ended and an irrigation event logged with the data collected so far</li>
            </ol>
            <div className="bg-gray-50 p-3 rounded mt-3 text-xs text-gray-700">
              <strong>Device stuck in "Irrigating" state?</strong> Go to Hardware → Devices, find the device,
              and click "Reset State" to clear its current session.
            </div>
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
              https://api.trellisag.com/functions/v1/flow-meter-webhook?token=YOUR_TOKEN
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

              {/* Flow Meter - Real-Time */}
              <div className="border-2 border-emerald-500 rounded-lg p-4 bg-emerald-50">
                <h5 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-emerald-600" />
                  Real-Time Flow Meter
                  <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">LIVE MONITORING</span>
                </h5>
                <p className="text-sm text-gray-700 mb-3">
                  For real-time monitoring with automatic session detection. Your flow meter sends readings every 10-30 seconds,
                  and Trellis automatically detects when irrigation starts and stops.
                </p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside ml-4">
                  <li>Add a <strong>"Flow Meter"</strong> device in Trellis</li>
                  <li>Copy the <strong>Flow Meter Webhook URL</strong>:
                    <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs my-2 overflow-x-auto">
                      https://api.trellisag.com/functions/v1/flow-meter-webhook?token=YOUR_TOKEN
                    </div>
                  </li>
                  <li>Configure your device to POST every 10-30 seconds</li>
                  <li>Configure zone mappings</li>
                  <li>Watch real-time data in the <strong>Live Flow Monitor</strong></li>
                </ol>
                <div className="bg-white p-3 rounded mt-3 text-xs text-gray-700 border border-emerald-300">
                  <strong>Real-Time JSON Payload (send every 10-30 seconds):</strong>
                  <pre className="mt-2 bg-gray-900 text-green-400 p-2 rounded text-xs overflow-x-auto">
{`{
  "flow_rate_gpm": 15.5,              // Required: Current flow rate
  "zone_number": 1,                    // Optional: Zone identifier
  "cumulative_gallons": 1250.5,        // Optional: Total gallons since device start
  "timestamp": "2025-11-05T14:30:00Z"  // Optional: Device time (uses server time if omitted)
}`}
                  </pre>
                  <p className="mt-2">
                    <strong>How it works:</strong> When flow_rate exceeds threshold, a session starts. When it drops below
                    threshold for several readings, the session ends and an irrigation event is logged automatically.
                  </p>
                </div>
              </div>

              {/* Flow Meter - Event-Based */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-bold text-gray-900 mb-2">Event-Based Flow Meter</h5>
                <p className="text-sm text-gray-700 mb-3">
                  For devices that send a single notification when irrigation completes (not real-time monitoring).
                </p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside ml-4">
                  <li>Add a <strong>"Flow Meter"</strong> or <strong>"Custom Webhook"</strong> device</li>
                  <li>Copy the <strong>Irrigation Webhook URL</strong>:
                    <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs my-2 overflow-x-auto">
                      https://api.trellisag.com/functions/v1/irrigation-webhook?token=YOUR_TOKEN
                    </div>
                  </li>
                  <li>Configure your device to POST when irrigation ends</li>
                  <li>Test using the Webhook Tester</li>
                </ol>
                <div className="bg-blue-50 p-3 rounded mt-3 text-xs text-gray-700">
                  <strong>Event-Based JSON Payload (send once when irrigation ends):</strong>
                  <pre className="mt-2 bg-white p-2 rounded text-xs overflow-x-auto">
{`{
  "zone_number": 1,                    // Required
  "start_time": "2025-11-05T06:00:00Z", // Required (ISO 8601)
  "end_time": "2025-11-05T08:30:00Z",   // Required (ISO 8601)
  "total_gallons": 42500                // Optional (calculated if not provided)
}`}
                  </pre>
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
              or for API polling to work. However, the production ESP32 firmware includes store-and-forward -
              it queues readings during WiFi outages and sends them when connection is restored.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: What's the difference between webhook and API polling?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> <strong>Webhooks</strong> = Your controller pushes data to us instantly when
              a zone runs (real-time). <strong>API Polling</strong> = We pull data from your controller's cloud
              every 15 minutes (slight delay). Flow meters use webhooks. Hunter Hydrawise uses API polling.
            </p>
          </div>

          <div className="border-t pt-6 mt-6">
            <h4 className="font-bold text-gray-900 mb-4 text-lg">Live Flow Monitor Questions</h4>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: What's the difference between the Active, Scheduled, and Completed tabs?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong>
            </p>
            <ul className="text-sm text-gray-700 space-y-1 ml-8 list-disc list-inside">
              <li><strong>Active</strong> - Currently running irrigation sessions (real-time from flow meters)</li>
              <li><strong>Scheduled</strong> - Future irrigation you've planned but hasn't happened yet</li>
              <li><strong>Completed</strong> - Past irrigation events, including auto-logged webhook events</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: Why does my session still show as "Active" after irrigation stopped?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> The system detects session end when it receives several consecutive low-flow
              readings. If your device goes offline or stops sending data before the flow stopped, the session
              appears stuck. Use the <strong>Stop</strong> button on the Active tab to manually end it.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: How often should my flow meter send readings?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> Every <strong>10-30 seconds</strong> is ideal for real-time monitoring. This gives
              smooth charts and responsive session detection. Sending more frequently than 10 seconds adds unnecessary
              load without much benefit. Sending less frequently than 60 seconds may delay session detection.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: What flow rate triggers a new irrigation session?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> Default threshold is <strong>0.5 GPM</strong> to start a session and
              <strong> 0.2 GPM</strong> to end it. The different thresholds (hysteresis) prevent rapid start/stop
              cycles from minor fluctuations. Sessions shorter than 3 minutes or less than 5 gallons are automatically
              dropped to filter out false positives.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: How do I reset a device stuck in "Irrigating" state?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> Go to <strong>Hardware → Devices</strong>, find the device card, and click
              <strong> "Reset State"</strong>. This clears the current session and sets the device back to idle.
              You can also stop individual sessions from the <strong>Irrigation → Active</strong> tab.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: Where do auto-logged events appear after irrigation ends?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> Auto-logged events appear in the <strong>Completed</strong> tab of Irrigation History.
              They're marked with a <strong>"Webhook"</strong> badge and show the zone number. They're also included
              in your Water Balance calculations automatically.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: Can I edit auto-logged irrigation events?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> Yes, you can edit any irrigation event including auto-logged ones. Click on the
              event to open details, then edit duration, gallons, or notes as needed. The source will still show
              as "webhook" to indicate it was auto-logged.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              Q: What does the "cumulative_gallons" field do?
            </h4>
            <p className="text-sm text-gray-700 ml-4">
              <strong>A:</strong> This optional field tracks total gallons since your flow meter was installed.
              It's useful for auditing and detecting sensor drift. If your device supports it, include it in
              each reading. It persists across ESP32 deep sleep cycles if stored in RTC memory.
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

          <div className="border-t pt-6 mt-6">
            <h4 className="font-bold text-gray-900 mb-4 text-lg">Live Flow Monitor Issues</h4>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Problem: Session stuck in "Active" state</h4>
            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>This happens when the device stops sending data before flow ended</li>
              <li>Go to <strong>Irrigation → Active</strong> tab and click <strong>"Stop"</strong> on the session</li>
              <li>Or go to <strong>Hardware → Devices</strong> and click <strong>"Reset State"</strong> on the device</li>
              <li>Check your ESP32 - it may have lost WiFi or power</li>
            </ul>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Problem: Device shows "Offline"</h4>
            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>Check your device's power and WiFi connection</li>
              <li>Verify the webhook URL and token are correct</li>
              <li>Check your device's serial output for error messages</li>
              <li>If using deep sleep, the device may appear offline between readings</li>
            </ul>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Problem: Flow rate readings are erratic or too high</h4>
            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>Check your sensor's calibration factor (YF-S201 uses ~7.5 pulses/liter)</li>
              <li>Ensure the sensor is fully filled with water (air bubbles cause false readings)</li>
              <li>Install the sensor on a straight pipe section, away from valves and elbows</li>
              <li>For field sensors: check for debris or sediment blocking the impeller</li>
            </ul>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Problem: Sessions starting and stopping rapidly</h4>
            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>This is usually caused by water hammer or pressure fluctuations</li>
              <li>The system has built-in debounce (requires consecutive readings to start/stop)</li>
              <li>If issue persists, you may need to adjust the flow threshold settings</li>
              <li>Consider installing a pressure tank or check valve to smooth pressure spikes</li>
            </ul>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Problem: ESP32 keeps disconnecting from WiFi</h4>
            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>Use the production firmware with reconnection logic</li>
              <li>Ensure your WiFi signal is strong at the device location</li>
              <li>Consider a WiFi extender or mesh network</li>
              <li>Check power supply - ESP32 WiFi requires stable voltage</li>
            </ul>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Problem: Stop button doesn't work</h4>
            <p className="text-sm text-gray-700 mb-2"><strong>Solution:</strong></p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li>This is usually a database permission issue</li>
              <li>Contact support to verify RLS policies are configured correctly</li>
              <li>As a workaround, try the "Reset State" button on the device instead</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Still having issues?</p>
                <p>
                  Check the <strong>Webhook Tester</strong> for detailed error messages. The tester shows
                  exactly what's happening when data is sent to your webhook endpoint. For ESP32 issues,
                  check the Serial Monitor output (115200 baud) for error details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* DIY Setup */}
      <Section id="diy" title="DIY ESP32 Flow Meter Setup" icon={Code}>
        <div className="space-y-6">
          <p className="text-gray-700">
            Build your own real-time flow monitor using affordable hardware. This connects directly to Trellis's
            Live Flow Monitor for real-time irrigation tracking.
          </p>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <strong>Bench Testing vs Field Deployment</strong>
                <p className="mt-1">
                  The YF-S201 sensor below is great for testing but <strong>not recommended for field use</strong>.
                  For real vineyard deployment, use industrial sensors like Seametrics IP800/810 or Badger M-Series
                  ($150-$400) that can handle debris, pressure spikes, and outdoor conditions.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3">Bench Test Hardware (~$25):</h4>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li><strong>ESP32 DevKit v1</strong> - $12 (Amazon) - WiFi + webhook posting</li>
              <li><strong>YF-S201 1/2" Flow Sensor</strong> - $10 (Amazon) - Pulse output for testing</li>
              <li>USB cable for power and programming</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              This setup validates your webhook connection before investing in field-grade equipment.
            </p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <h4 className="font-bold text-gray-900 mb-3">Field-Ready Hardware ($200-$500):</h4>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li><strong>Seametrics IP800/810</strong> - $150-400 - Paddle wheel, pulse output, rugged</li>
              <li><strong>Badger M-Series</strong> - $200-500 - Brass body, accurate, pulse/analog</li>
              <li><strong>ESP32 in weatherproof enclosure</strong> - $30</li>
              <li><strong>12V power supply or solar panel</strong> - $20-50</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Wiring Diagram</h4>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <pre className="text-xs text-gray-700 font-mono">
{`YF-S201 Flow Sensor    ESP32 DevKit
─────────────────────────────────────
Red Wire (VCC) ──────► 3.3V (or 5V)
Black Wire (GND) ────► GND
Yellow Wire (Signal) ─► GPIO 27 (or any GPIO)`}
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                The signal wire outputs pulses as water flows. The ESP32 counts pulses to calculate flow rate.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Bench Test Firmware (Simple)
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              For initial testing - validates the webhook connection. Copy this code to Arduino IDE:
            </p>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto max-h-96">
              <pre>{`// Trellis Flow Meter - BENCH TEST VERSION
// For testing webhook connectivity only

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============ CONFIGURATION - UPDATE THESE ============
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* WEBHOOK_URL = "https://api.trellisag.com/functions/v1/flow-meter-webhook";
const char* DEVICE_TOKEN = "YOUR_TOKEN_FROM_TRELLIS";
// ======================================================

const int FLOW_PIN = 27;
volatile int pulseCount = 0;

void IRAM_ATTR countPulse() {
  pulseCount++;
}

void setup() {
  Serial.begin(115200);
  pinMode(FLOW_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), countPulse, FALLING);

  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  delay(30000);  // Send reading every 30 seconds

  // Calculate flow (YF-S201: ~7.5 pulses per liter)
  float liters = pulseCount / 7.5;
  float gallons = liters * 0.264172;
  float gpm = gallons * 2;  // 30 seconds = 0.5 min, so multiply by 2
  pulseCount = 0;

  Serial.print("Flow rate: ");
  Serial.print(gpm);
  Serial.println(" GPM");

  // Send to Trellis
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
}`}</pre>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Production Firmware (Field-Hardened)
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              For real vineyard deployment with WiFi reconnection, store-and-forward, and deep sleep:
            </p>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto max-h-96">
              <pre>{`// Trellis Flow Meter - PRODUCTION VERSION
// Field-hardened with reconnection, store-and-forward, deep sleep

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <time.h>
#include <esp_task_wdt.h>

// ============ CONFIGURATION ============
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* WEBHOOK_URL = "https://api.trellisag.com/functions/v1/flow-meter-webhook";
const char* DEVICE_TOKEN = "YOUR_TOKEN";
const char* NTP_SERVER = "pool.ntp.org";
const int READING_INTERVAL_SEC = 30;
const int DEEP_SLEEP_SEC = 300;  // 5 min sleep when idle
const int MAX_QUEUE_SIZE = 100;
// =======================================

Preferences prefs;
volatile int pulseCount = 0;
RTC_DATA_ATTR float totalGallons = 0;  // Survives deep sleep
RTC_DATA_ATTR int queuedReadings = 0;

void IRAM_ATTR countPulse() { pulseCount++; }

bool sendReading(String payload) {
  HTTPClient http;
  String url = String(WEBHOOK_URL) + "?token=" + DEVICE_TOKEN;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  int code = http.POST(payload);
  http.end();
  return (code >= 200 && code < 300);
}

void queueReading(String payload) {
  if (queuedReadings >= MAX_QUEUE_SIZE) return;
  prefs.begin("queue", false);
  prefs.putString(("r" + String(queuedReadings)).c_str(), payload);
  queuedReadings++;
  prefs.putInt("count", queuedReadings);
  prefs.end();
}

void flushQueue() {
  prefs.begin("queue", false);
  for (int i = 0; i < queuedReadings; i++) {
    String payload = prefs.getString(("r" + String(i)).c_str(), "");
    if (payload.length() > 0 && sendReading(payload)) {
      prefs.remove(("r" + String(i)).c_str());
    }
  }
  prefs.putInt("count", 0);
  queuedReadings = 0;
  prefs.end();
}

void setup() {
  esp_task_wdt_init(30, true);
  esp_task_wdt_add(NULL);

  Serial.begin(115200);
  pinMode(27, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(27), countPulse, FALLING);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    configTime(0, 0, NTP_SERVER);
    flushQueue();
  }
}

void loop() {
  esp_task_wdt_reset();
  delay(READING_INTERVAL_SEC * 1000);

  float gallons = pulseCount / 7.5 * 0.264172;
  float gpm = gallons * (60.0 / READING_INTERVAL_SEC);
  totalGallons += gallons;
  pulseCount = 0;

  time_t now;
  time(&now);

  StaticJsonDocument<256> doc;
  doc["flow_rate_gpm"] = gpm;
  doc["cumulative_gallons"] = totalGallons;
  doc["zone_number"] = 1;

  String payload;
  serializeJson(doc, payload);

  if (WiFi.status() == WL_CONNECTED) {
    if (!sendReading(payload)) queueReading(payload);
  } else {
    queueReading(payload);
  }

  // Deep sleep when no flow (save battery)
  if (gpm < 0.1) {
    esp_sleep_enable_timer_wakeup(DEEP_SLEEP_SEC * 1000000ULL);
    esp_deep_sleep_start();
  }
}`}</pre>
            </div>
            <div className="bg-blue-50 p-3 rounded mt-3">
              <h5 className="font-bold text-gray-900 text-sm mb-2">Production Features:</h5>
              <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc list-inside">
                <li><strong>NTP Time Sync</strong> - Accurate timestamps for irrigation records</li>
                <li><strong>Store-and-Forward</strong> - Queues readings during WiFi outages</li>
                <li><strong>Deep Sleep</strong> - Battery devices last months, not days</li>
                <li><strong>Watchdog Timer</strong> - Auto-reboot if firmware hangs</li>
                <li><strong>Cumulative Gallons</strong> - Tracks total water through sensor</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Setup Steps</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside ml-4">
              <li>Install <a href="https://www.arduino.cc/en/software" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Arduino IDE</a></li>
              <li>Add ESP32 board support (File → Preferences → Additional Boards Manager URLs):
                <div className="bg-gray-100 p-2 rounded text-xs mt-1 font-mono">
                  https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
                </div>
              </li>
              <li>Install libraries: ArduinoJson, WiFi (built-in), HTTPClient (built-in)</li>
              <li>Wire the flow sensor to GPIO 27</li>
              <li>In Trellis: Add a Flow Meter device, copy the token</li>
              <li>Update the firmware with your WiFi and token</li>
              <li>Upload to ESP32</li>
              <li>Open Serial Monitor (115200 baud) to see output</li>
              <li>Run water through the sensor and watch it appear in Live Flow Monitor</li>
            </ol>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Testing Without Hardware
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              You can test the complete data flow using the <strong>Webhook Tester</strong> in Trellis before
              building any hardware. This validates your device setup and zone mappings.
            </p>
            <p className="text-sm text-gray-700">
              For automated testing, use the Node.js simulator script (contact support for access).
            </p>
          </div>
        </div>
      </Section>

      {/* Quick Reference */}
      <Section id="reference" title="Quick Reference" icon={Settings}>
        <div className="space-y-6">
          <p className="text-gray-700">
            Technical reference for developers integrating with the Trellis hardware APIs.
          </p>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Webhook Endpoints</h4>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <strong className="text-sm">Real-Time Flow Meter Webhook</strong>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">RECOMMENDED</span>
                </div>
                <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs overflow-x-auto">
                  POST https://api.trellisag.com/functions/v1/flow-meter-webhook?token=YOUR_TOKEN
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  For devices sending readings every 10-30 seconds. Automatic session detection.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <strong className="text-sm">Event-Based Irrigation Webhook</strong>
                </div>
                <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs overflow-x-auto">
                  POST https://api.trellisag.com/functions/v1/irrigation-webhook?token=YOUR_TOKEN
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  For devices that send a single notification when irrigation completes.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Payload Formats</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <strong className="text-sm text-gray-900">Real-Time Flow Reading</strong>
                <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
{`{
  "flow_rate_gpm": 15.5,        // Required
  "zone_number": 1,              // Optional
  "cumulative_gallons": 1250.5,  // Optional
  "timestamp": "ISO8601"         // Optional
}`}
                </pre>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <strong className="text-sm text-gray-900">Irrigation Event</strong>
                <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
{`{
  "zone_number": 1,              // Required
  "start_time": "ISO8601",       // Required
  "end_time": "ISO8601",         // Required
  "total_gallons": 42500         // Optional
}`}
                </pre>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Response Codes</h4>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold">Code</th>
                    <th className="text-left p-3 font-semibold">Meaning</th>
                    <th className="text-left p-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3"><code className="bg-green-100 text-green-800 px-2 py-0.5 rounded">200</code></td>
                    <td className="p-3">Success</td>
                    <td className="p-3 text-gray-600">Data recorded</td>
                  </tr>
                  <tr>
                    <td className="p-3"><code className="bg-red-100 text-red-800 px-2 py-0.5 rounded">401</code></td>
                    <td className="p-3">Unauthorized</td>
                    <td className="p-3 text-gray-600">Check token, device may be deactivated</td>
                  </tr>
                  <tr>
                    <td className="p-3"><code className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">404</code></td>
                    <td className="p-3">Zone not found</td>
                    <td className="p-3 text-gray-600">Configure zone mapping in Trellis</td>
                  </tr>
                  <tr>
                    <td className="p-3"><code className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">429</code></td>
                    <td className="p-3">Rate limited</td>
                    <td className="p-3 text-gray-600">Slow down request frequency</td>
                  </tr>
                  <tr>
                    <td className="p-3"><code className="bg-red-100 text-red-800 px-2 py-0.5 rounded">500</code></td>
                    <td className="p-3">Server error</td>
                    <td className="p-3 text-gray-600">Queue locally and retry</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Default Thresholds</h4>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold">Setting</th>
                    <th className="text-left p-3 font-semibold">Default</th>
                    <th className="text-left p-3 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3">Start threshold</td>
                    <td className="p-3"><code>0.5 GPM</code></td>
                    <td className="p-3 text-gray-600">Flow above this starts a session</td>
                  </tr>
                  <tr>
                    <td className="p-3">Stop threshold</td>
                    <td className="p-3"><code>0.2 GPM</code></td>
                    <td className="p-3 text-gray-600">Flow below this ends a session</td>
                  </tr>
                  <tr>
                    <td className="p-3">Min session duration</td>
                    <td className="p-3"><code>3 min</code></td>
                    <td className="p-3 text-gray-600">Sessions shorter are dropped</td>
                  </tr>
                  <tr>
                    <td className="p-3">Min session gallons</td>
                    <td className="p-3"><code>5 gal</code></td>
                    <td className="p-3 text-gray-600">Sessions smaller are dropped</td>
                  </tr>
                  <tr>
                    <td className="p-3">Consecutive readings to start</td>
                    <td className="p-3"><code>2-3</code></td>
                    <td className="p-3 text-gray-600">Debounce for session start</td>
                  </tr>
                  <tr>
                    <td className="p-3">Consecutive readings to stop</td>
                    <td className="p-3"><code>3-5</code></td>
                    <td className="p-3 text-gray-600">Debounce for session end</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Rate Limits</h4>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc list-inside">
              <li><strong>Flow readings:</strong> Max 1 per 10 seconds per device</li>
              <li><strong>Daily limit:</strong> 1000 requests per device per day</li>
              <li><strong>Burst:</strong> Up to 10 requests in 10 seconds allowed for queue flushing</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Need Help?
            </h4>
            <p className="text-sm text-gray-700">
              For integration support, custom threshold configuration, or help with hardware setup,
              contact us at <strong>support@trellisag.com</strong>
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
