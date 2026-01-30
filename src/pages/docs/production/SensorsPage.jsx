import React from 'react';
import { Activity, Bell, Wifi, Zap, Database, Lock, Settings } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, CodeBlock } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export function SensorsPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="IoT Sensors"
        subtitle="Real-time temperature monitoring"
      />

      <Callout type="success" title="Hardware-Agnostic System">
        Connect unlimited sensors of any type. Supports field sensors (weather, soil) and cellar sensors (tanks, barrels) with clear categorization.
      </Callout>

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The IoT Sensor system enables real-time temperature monitoring for fermentation tanks, barrels,
          and vineyard fields. Connect any sensor hardware that can send HTTP requests to our webhook API.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Each sensor gets a unique API key for secure data transmission. Set up custom alert rules to
          receive notifications when temperatures go out of range.
        </p>
      </Section>

      <Section title="Key Features">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-md transition-all">
            <Activity className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Monitoring</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Live temperature display with automatic updates. See current temp and last reading timestamp.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-md transition-all">
            <Bell className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Alerts</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Set min/max temperature thresholds. Receive email/SMS notifications when limits are exceeded.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-md transition-all">
            <Lock className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure API Keys</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Each sensor has a unique 64-character API key. Regenerate keys anytime for security.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-md transition-all">
            <Database className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Historical Data</h3>
            <p className="text-sm text-gray-600 leading-relaxed">All readings are stored for trending analysis. View temperature charts and fermentation curves.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-md transition-all">
            <Wifi className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Any Hardware</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Works with Tilt, PLAATO, Raspberry Pi, ESP32, Arduino, industrial sensors, and more.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-md transition-all">
            <Zap className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unlimited Sensors</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Connect as many sensors as you need. No limits on number of tanks or fields monitored.</p>
          </div>
        </div>
      </Section>

      <Section title="Supported Sensor Types">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-2xl">🍷</div>
              <h3 className="text-lg font-semibold text-gray-900">Cellar/Production Sensors</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span><strong>Tilt Hydrometer</strong> - Wireless temperature + specific gravity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span><strong>PLAATO Keg</strong> - Fermentation monitoring system</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span><strong>Inkbird WiFi Controllers</strong> - Temperature control + logging</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span><strong>Raspberry Pi + DHT22/DS18B20</strong> - DIY tank probes ($50)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span><strong>ESP32/Arduino + Sensors</strong> - Ultra-budget option ($15)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span><strong>WiFi/Bluetooth Thermometers</strong> - Generic probes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span><strong>Modbus/Industrial Sensors</strong> - Professional PLCs</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-2xl">🌱</div>
              <h3 className="text-lg font-semibold text-gray-900">Field/Vineyard Sensors</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span><strong>Davis Vantage Pro2</strong> - Professional weather station</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span><strong>ATMOS 41</strong> - All-in-one weather sensor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span><strong>Tempest Weather System</strong> - Haptic rain sensor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span><strong>METER TEROS</strong> - Soil moisture + temperature</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span><strong>Delta-T SM150T</strong> - Soil moisture probe</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span><strong>Flow Meters</strong> - Irrigation monitoring</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span><strong>Dendrometers</strong> - Trunk growth measurement</span>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Quick Start Guide">
        <Subsection title="1. Register Your Sensor">
          <p className="text-gray-700 mb-4">
            Navigate to <strong>Production → IoT Sensors</strong> and click "Add Sensor". Fill out the form:
          </p>
          <ul className="space-y-2 text-gray-700 ml-6">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1.5 text-xs">▸</span>
              <span><strong>Location Type:</strong> Choose Field (🌱) or Cellar (🍷)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1.5 text-xs">▸</span>
              <span><strong>Sensor Name:</strong> E.g., "Tank 1 Temperature Probe"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1.5 text-xs">▸</span>
              <span><strong>Sensor Type:</strong> Select your hardware from the dropdown</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1.5 text-xs">▸</span>
              <span><strong>Assign To:</strong> Select a tank, barrel, or lot</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1.5 text-xs">▸</span>
              <span><strong>Check-in Interval:</strong> How often sensor should report (default: 15 min)</span>
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            After clicking "Register Sensor", copy your unique API key (click the 👁️ eye icon to reveal it).
          </p>
        </Subsection>

        <Subsection title="2. Configure Your Hardware">
          <p className="text-gray-700 mb-4">
            Your sensor needs to send temperature data to our webhook endpoint using your API key.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Webhook URL:</p>
            <code className="text-xs bg-white px-3 py-2 rounded border border-gray-300 block font-mono">
              https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-temperature
            </code>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Request Format:</p>
            <CodeBlock language="bash">
{`curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-temperature \\
  -H "X-API-Key: YOUR_64_CHAR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "temp_f": 72.5,
    "humidity_percent": 55.0,
    "timestamp": "2024-11-18T14:30:00Z"
  }'`}
            </CodeBlock>
          </div>

          <Callout type="note" title="Need detailed setup instructions?">
            See the <a href="https://github.com/your-repo/docs/operations/hardware/Connecting-Temperature-Sensor-Guide.md" className="text-purple-600 hover:text-purple-700 font-medium">Hardware Connection Guide</a> for step-by-step wiring diagrams and copy-paste code for Raspberry Pi and ESP32.
          </Callout>
        </Subsection>

        <Subsection title="3. Verify Live Data">
          <p className="text-gray-700 mb-4">
            Once your sensor starts sending data:
          </p>
          <ul className="space-y-2 text-gray-700 ml-6">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1.5 text-xs">▸</span>
              <span>Check <strong>Production → IoT Sensors</strong> - sensor status should show "Active" (green)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1.5 text-xs">▸</span>
              <span>View <strong>Production → Fermentation</strong> - assigned lot shows "LIVE" badge with current temp</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1.5 text-xs">▸</span>
              <span>Temperature updates automatically as sensor sends new readings</span>
            </li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Setting Up Alerts">
        <p className="text-gray-700 mb-4">
          Create alert rules to get notified when temperatures go out of safe ranges:
        </p>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">SQL Example (run in Supabase SQL Editor):</p>
          <CodeBlock language="sql">
{`INSERT INTO temperature_alert_rules (
  user_id,
  sensor_id,
  name,
  min_temp_f,
  max_temp_f,
  alert_email,
  enabled
)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your@email.com'),
  'YOUR_SENSOR_ID',
  'Tank 1 Fermentation Alert',
  50,  -- Alert if below 50°F
  85,  -- Alert if above 85°F
  ARRAY['your@email.com'],
  true
);`}
          </CodeBlock>
        </div>

        <Callout type="warning" title="Alert Cooldown">
          Alerts have a 1-hour cooldown by default to prevent notification spam. You'll receive one alert when temperature goes out of range, then no more alerts for that sensor for 1 hour.
        </Callout>
      </Section>

      <Section title="Example Hardware Setups">
        <Subsection title="Raspberry Pi + DHT22 ($50 total)">
          <p className="text-gray-700 mb-3">Best for: Multiple tanks, reliable, expandable</p>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <CodeBlock language="python">
{`import time, requests, adafruit_dht, board
from datetime import datetime

API_KEY = "YOUR_API_KEY_HERE"
WEBHOOK_URL = "https://YOUR_PROJECT.supabase.co/functions/v1/ingest-temperature"
dhtDevice = adafruit_dht.DHT22(board.D4)

while True:
    temp_c = dhtDevice.temperature
    temp_f = (temp_c * 9/5) + 32

    payload = {"temp_f": round(temp_f, 2), "timestamp": datetime.utcnow().isoformat() + "Z"}
    headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

    requests.post(WEBHOOK_URL, json=payload, headers=headers)
    time.sleep(300)  # Send every 5 minutes`}
            </CodeBlock>
          </div>
        </Subsection>

        <Subsection title="ESP32 + DHT22 ($15 total)">
          <p className="text-gray-700 mb-3">Best for: Ultra-budget, compact, WiFi built-in</p>
          <p className="text-sm text-gray-600">
            See the{' '}
            <a href="https://github.com/your-repo/docs/operations/hardware/Connecting-Temperature-Sensor-Guide.md#option-b-esp32-setup" className="text-purple-600 hover:text-purple-700 font-medium">
              full Arduino sketch
            </a>{' '}
            in the Hardware Connection Guide.
          </p>
        </Subsection>

        <Subsection title="Tilt Hydrometer ($150)">
          <p className="text-gray-700 mb-3">Best for: Temperature + gravity monitoring</p>
          <p className="text-sm text-gray-600">
            Requires Bluetooth bridge (Raspberry Pi or TiltPi). Measures both temperature and specific gravity
            wirelessly from inside the fermenter.
          </p>
        </Subsection>
      </Section>

      <Section title="Troubleshooting">
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Sensor shows "Offline"</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Check that sensor hardware is powered on and connected to WiFi</li>
              <li>• Verify sensor script is running (for Raspberry Pi/ESP32)</li>
              <li>• Check that check-in interval hasn't been exceeded</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">No data appearing</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Verify API key is correct (no spaces or line breaks)</li>
              <li>• Check webhook URL uses your correct Supabase project reference</li>
              <li>• Test with curl command to verify endpoint is working</li>
              <li>• Check sensor logs for error messages</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">"Invalid API key" error</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Go to Production → IoT Sensors and click eye icon to reveal API key</li>
              <li>• Copy the entire 64-character string</li>
              <li>• Ensure no extra whitespace in your code</li>
              <li>• If needed, regenerate the API key using the refresh icon</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Probe Placement:</strong> Install at mid-level of tank, avoid grape solids, use thermowell if available</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Reading Frequency:</strong> Active fermentation: 5-10 min, slow fermentation: 15-30 min, cold storage: 1 hour</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Multiple Sensors:</strong> Large tanks (&gt;1000 gal) use 2-3 sensors, small tanks (&lt;500 gal) use 1 sensor</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Power Backup:</strong> Use UPS for Raspberry Pi, battery backup for WiFi router during harvest</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span><strong>Security:</strong> Regenerate API keys annually, never commit keys to git repositories</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/production" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Production Overview</h4>
            </div>
            <p className="text-sm text-gray-600">Learn about the full Production module</p>
          </a>
          <a href="/docs/production/fermentation" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Fermentation Tracking</h4>
            </div>
            <p className="text-sm text-gray-600">Monitor fermentations with sensor integration</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
