import React, { useState, useEffect } from 'react';
import { createIrrigationDevice, generateFlowMeterWebhookUrl, createZoneMapping } from '@/shared/lib/hardwareApi';
import { listVineyardBlocks } from '@/shared/lib/vineyardApi';

/**
 * DeviceSetupWizard - Guided device registration flow
 *
 * Steps:
 * 1. Select Device Type
 * 2. Get Webhook URL
 * 3. Configure Device (device-specific instructions)
 * 4. Test Connection
 * 5. Map Zones
 */
export default function DeviceSetupWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [deviceType, setDeviceType] = useState(null);
  const [deviceName, setDeviceName] = useState('');
  const [device, setDevice] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testStatus, setTestStatus] = useState('waiting'); // waiting, testing, success, failed
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [zoneNumber, setZoneNumber] = useState(1);
  const [flowRateGpm, setFlowRateGpm] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const deviceTypes = [
    {
      id: 'esp32_flow',
      name: 'ESP32 + Flow Meter',
      icon: '🔌',
      description: 'DIY flow meter using ESP32 and pulse-output sensor',
      difficulty: 'Intermediate',
      price: '$25-$50'
    },
    {
      id: 'dragino',
      name: 'Dragino LoRaWAN',
      icon: '📡',
      description: 'Industrial LoRaWAN flow meter (SW3L or similar)',
      difficulty: 'Easy',
      price: '$100-$150'
    },
    {
      id: 'rachio',
      name: 'Rachio Controller',
      icon: '💧',
      description: 'Smart sprinkler controller with zone tracking',
      difficulty: 'Easy',
      price: '$150-$300'
    },
    {
      id: 'custom',
      name: 'Custom Webhook',
      icon: '🛠️',
      description: 'Any device that can send HTTP POST requests',
      difficulty: 'Advanced',
      price: 'Varies'
    }
  ];

  // Load blocks for zone mapping
  useEffect(() => {
    if (step === 5) {
      loadBlocks();
    }
  }, [step]);

  const loadBlocks = async () => {
    const { data, error } = await listVineyardBlocks();
    if (!error) {
      setBlocks(data || []);
    }
  };

  const handleCreateDevice = async () => {
    if (!deviceName.trim()) {
      setError('Please enter a device name');
      return;
    }

    setError(null);

    const { data, error: createError } = await createIrrigationDevice({
      device_name: deviceName.trim(),
      device_type: deviceType === 'esp32_flow' ? 'flow_meter' : deviceType,
      device_id: `${deviceType}_${Date.now()}`,
      webhook_token: crypto.randomUUID()
    });

    if (createError) {
      setError(createError.message);
      return;
    }

    setDevice(data);
    setWebhookUrl(generateFlowMeterWebhookUrl(data.webhook_token));
    setStep(3);
  };

  const handleCopyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    // In a real implementation, we'd poll for recent readings
    // For now, simulate a test
    setTimeout(() => {
      setTestStatus('success');
    }, 3000);
  };

  const handleCreateZoneMapping = async () => {
    if (!selectedBlock) {
      setError('Please select a vineyard field');
      return;
    }

    const { error: mappingError } = await createZoneMapping({
      device_id: device.id,
      zone_number: zoneNumber,
      zone_name: `Zone ${zoneNumber}`,
      block_id: selectedBlock,
      flow_rate_gpm: parseFloat(flowRateGpm) || null,
      irrigation_method: 'drip'
    });

    if (mappingError) {
      setError(mappingError.message);
      return;
    }

    onComplete?.(device);
  };

  // Step 1: Select Device Type
  if (step === 1) {
    return (
      <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Flow Meter</h2>
          <p className="text-sm text-gray-500 mt-1">Step 1 of 5: Select your device type</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deviceTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setDeviceType(type.id);
                  setStep(2);
                }}
                className={`
                  text-left p-4 rounded-lg border-2 transition-all
                  hover:border-emerald-500 hover:shadow-md
                  ${deviceType === type.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-gray-400">Difficulty: {type.difficulty}</span>
                      <span className="text-gray-400">{type.price}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Name Your Device
  if (step === 2) {
    return (
      <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Flow Meter</h2>
          <p className="text-sm text-gray-500 mt-1">Step 2 of 5: Name your device</p>
        </div>

        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Device Name
          </label>
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="e.g., Block A Flow Meter"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="text-xs text-gray-400 mt-2">
            Choose a descriptive name to identify this device
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Back
          </button>
          <button
            onClick={handleCreateDevice}
            disabled={!deviceName.trim()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Device
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Configure Device
  if (step === 3) {
    return (
      <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Flow Meter</h2>
          <p className="text-sm text-gray-500 mt-1">Step 3 of 5: Configure your device</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Webhook URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
              />
              <button
                onClick={handleCopyWebhook}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Device-specific instructions */}
          {deviceType === 'esp32_flow' && (
            <ESP32Instructions webhookUrl={webhookUrl} token={device?.webhook_token} />
          )}

          {deviceType === 'dragino' && (
            <DraginoInstructions webhookUrl={webhookUrl} />
          )}

          {deviceType === 'rachio' && (
            <RachioInstructions webhookUrl={webhookUrl} />
          )}

          {deviceType === 'custom' && (
            <CustomWebhookInstructions webhookUrl={webhookUrl} />
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => setStep(2)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Back
          </button>
          <button
            onClick={() => setStep(4)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            I've Configured My Device
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Test Connection
  if (step === 4) {
    return (
      <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Flow Meter</h2>
          <p className="text-sm text-gray-500 mt-1">Step 4 of 5: Test your connection</p>
        </div>

        <div className="p-6">
          <div className="text-center py-8">
            {testStatus === 'waiting' && (
              <>
                <div className="text-4xl mb-4">📡</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test</h3>
                <p className="text-gray-500 mb-6">
                  Make sure your device is powered on and connected to WiFi, then click the button below to test the connection.
                </p>
                <button
                  onClick={handleTestConnection}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Test Connection
                </button>
              </>
            )}

            {testStatus === 'testing' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Testing Connection...</h3>
                <p className="text-gray-500">
                  Waiting for data from your device. This may take up to 60 seconds.
                </p>
              </>
            )}

            {testStatus === 'success' && (
              <>
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-green-600 mb-2">Connection Successful!</h3>
                <p className="text-gray-500 mb-6">
                  Your device is sending data to Trellis. You can now map it to a vineyard zone.
                </p>
              </>
            )}

            {testStatus === 'failed' && (
              <>
                <div className="text-4xl mb-4">❌</div>
                <h3 className="text-lg font-medium text-red-600 mb-2">Connection Failed</h3>
                <p className="text-gray-500 mb-4">
                  We didn't receive any data from your device. Please check:
                </p>
                <ul className="text-left text-sm text-gray-500 space-y-1 mb-6">
                  <li>• Device is powered on</li>
                  <li>• WiFi connection is working</li>
                  <li>• Webhook URL is correctly configured</li>
                </ul>
                <button
                  onClick={() => setTestStatus('waiting')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => setStep(3)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(5)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Skip Test
            </button>
            {testStatus === 'success' && (
              <button
                onClick={() => setStep(5)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Map Zone
  if (step === 5) {
    return (
      <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Flow Meter</h2>
          <p className="text-sm text-gray-500 mt-1">Step 5 of 5: Map to vineyard zone</p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Associate this flow meter with a vineyard field so irrigation events are logged correctly.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vineyard Field *
            </label>
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a field...</option>
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.name} ({block.variety || 'No variety'}, {block.acres?.toFixed(1) || '?'} acres)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone Number
              </label>
              <input
                type="number"
                value={zoneNumber}
                onChange={(e) => setZoneNumber(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Flow Rate (GPM)
              </label>
              <input
                type="number"
                value={flowRateGpm}
                onChange={(e) => setFlowRateGpm(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => setStep(4)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onComplete?.(device)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Skip for Now
            </button>
            <button
              onClick={handleCreateZoneMapping}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Complete Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// =====================================================
// DEVICE-SPECIFIC INSTRUCTION COMPONENTS
// =====================================================

function ESP32Instructions({ webhookUrl, token }) {
  const [showFirmware, setShowFirmware] = useState(false);

  const firmwareCode = `// Trellis Flow Meter - ESP32 Firmware
// Sends flow readings to your Trellis webhook

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// === CONFIGURATION ===
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* WEBHOOK_URL = "${webhookUrl.split('?')[0]}";
const char* DEVICE_TOKEN = "${token}";
const int FLOW_PIN = 27;
const int READING_INTERVAL_SEC = 30;

volatile int pulseCount = 0;
float totalGallons = 0;

void IRAM_ATTR countPulse() {
  pulseCount++;
}

void setup() {
  Serial.begin(115200);
  pinMode(FLOW_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), countPulse, FALLING);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Connected!");
}

void loop() {
  delay(READING_INTERVAL_SEC * 1000);

  // Calculate flow rate (YF-S201: ~7.5 pulses per liter)
  float liters = pulseCount / 7.5;
  float gallons = liters * 0.264172;
  float gpm = gallons * (60.0 / READING_INTERVAL_SEC);
  totalGallons += gallons;
  pulseCount = 0;

  // Send to Trellis
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(WEBHOOK_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);

    StaticJsonDocument<200> doc;
    doc["flow_rate_gpm"] = gpm;
    doc["cumulative_gallons"] = totalGallons;
    doc["timestamp"] = millis() / 1000;

    String payload;
    serializeJson(doc, payload);

    int httpCode = http.POST(payload);
    Serial.printf("POST: %d - %.2f GPM\\n", httpCode, gpm);
    http.end();
  }
}`;

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">ESP32 Setup Instructions</h4>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-800 mb-2">Parts Needed</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• ESP32 DevKit v1 (~$12)</li>
          <li>• YF-S201 Flow Sensor (~$10) - for bench testing only</li>
          <li>• USB cable for power</li>
          <li>• Jumper wires</li>
        </ul>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-800 mb-2">Wiring</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• YF-S201 Red wire → ESP32 3.3V</li>
          <li>• YF-S201 Black wire → ESP32 GND</li>
          <li>• YF-S201 Yellow wire → ESP32 GPIO 27</li>
        </ul>
      </div>

      <div>
        <button
          onClick={() => setShowFirmware(!showFirmware)}
          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
        >
          {showFirmware ? 'Hide Firmware Code' : 'Show Firmware Code'}
        </button>

        {showFirmware && (
          <div className="mt-2 relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
              {firmwareCode}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(firmwareCode)}
              className="absolute top-2 right-2 px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
            >
              Copy
            </button>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> The YF-S201 is suitable for bench testing only. For field deployment, use industrial-grade pulse meters like Seametrics IP810.
        </p>
      </div>
    </div>
  );
}

function DraginoInstructions({ webhookUrl }) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Dragino LoRaWAN Setup</h4>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-800 mb-2">Requirements</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Dragino SW3L or similar LoRaWAN flow meter</li>
          <li>• The Things Network account</li>
          <li>• LoRaWAN gateway within range</li>
        </ul>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-800 mb-2">Configuration Steps</h5>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Register your device on The Things Network</li>
          <li>Configure a webhook integration pointing to your Trellis URL</li>
          <li>Set the payload formatter to decode flow data</li>
          <li>Install the device on your irrigation mainline</li>
        </ol>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Dragino devices have 10+ year battery life and are weatherproof, making them ideal for field deployment.
        </p>
      </div>
    </div>
  );
}

function RachioInstructions({ webhookUrl }) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Rachio Setup</h4>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-800 mb-2">Configuration Steps</h5>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Open your Rachio app and go to Controller Settings</li>
          <li>Enable "Webhooks" in the Developer section</li>
          <li>Add a new webhook with your Trellis URL</li>
          <li>Select "Zone Run Started" and "Zone Run Completed" events</li>
          <li>Save and test the configuration</li>
        </ol>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Rachio sends zone start/stop events rather than flow readings. Trellis will calculate duration and estimated water usage.
        </p>
      </div>
    </div>
  );
}

function CustomWebhookInstructions({ webhookUrl }) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Custom Webhook Format</h4>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-800 mb-2">HTTP Request</h5>
        <pre className="text-sm text-gray-600 bg-white p-2 rounded border">
{`POST ${webhookUrl.split('?')[0]}
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "flow_rate_gpm": 5.25,
  "cumulative_gallons": 1250.5,
  "timestamp": "2024-01-15T10:30:00Z",
  "battery_level": 85,
  "zone_number": 1
}`}
        </pre>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-800 mb-2">Required Fields</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <code className="bg-gray-200 px-1 rounded">flow_rate_gpm</code> - Current flow rate in gallons per minute</li>
        </ul>
        <h5 className="font-medium text-gray-800 mt-3 mb-2">Optional Fields</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <code className="bg-gray-200 px-1 rounded">cumulative_gallons</code> - Total gallons since device reset</li>
          <li>• <code className="bg-gray-200 px-1 rounded">timestamp</code> - ISO 8601 or Unix timestamp</li>
          <li>• <code className="bg-gray-200 px-1 rounded">battery_level</code> - 0-100 percentage</li>
          <li>• <code className="bg-gray-200 px-1 rounded">signal_strength</code> - RSSI in dBm</li>
          <li>• <code className="bg-gray-200 px-1 rounded">zone_number</code> - For multi-zone devices</li>
        </ul>
      </div>
    </div>
  );
}
