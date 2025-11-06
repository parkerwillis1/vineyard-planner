import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle,
  XCircle,
  Loader,
  Code,
  Copy,
  Check
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { listIrrigationDevices, listDeviceZoneMappings } from '@/shared/lib/hardwareApi';

export function WebhookTester() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [zoneMappings, setZoneMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Test payload
  const [testPayload, setTestPayload] = useState({
    zone_number: 1,
    start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    end_time: new Date().toISOString(),
    flow_rate_avg: 150,
    total_gallons: null,
    notes: 'Test irrigation event from webhook tester'
  });

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadZoneMappings();
    }
  }, [selectedDevice]);

  async function loadDevices() {
    setLoading(true);
    try {
      const { data, error } = await listIrrigationDevices();
      if (error) {
        console.error('Error loading devices:', error);
        return;
      }
      setDevices(data || []);
      if (data && data.length > 0) {
        setSelectedDevice(data[0]);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadZoneMappings() {
    if (!selectedDevice) return;

    try {
      const { data, error } = await listDeviceZoneMappings(selectedDevice.id);
      if (error) {
        console.error('Error loading zone mappings:', error);
        return;
      }
      setZoneMappings(data || []);

      // Auto-select first zone
      if (data && data.length > 0) {
        setTestPayload(prev => ({ ...prev, zone_number: data[0].zone_number }));
      }
    } catch (error) {
      console.error('Error loading zone mappings:', error);
    }
  }

  async function sendTestWebhook() {
    if (!selectedDevice) {
      alert('Please select a device');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const webhookUrl = `${baseUrl}/functions/v1/irrigation-webhook?token=${selectedDevice.webhook_token}`;

      console.log('Sending test webhook to:', webhookUrl);
      console.log('Payload:', testPayload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(testPayload)
      });

      const result = await response.json();

      setTestResult({
        success: response.ok,
        status: response.status,
        data: result
      });

      console.log('Webhook response:', result);

    } catch (error) {
      console.error('Error sending webhook:', error);
      setTestResult({
        success: false,
        status: 500,
        data: { error: error.message }
      });
    } finally {
      setTesting(false);
    }
  }

  function copyPayload() {
    navigator.clipboard.writeText(JSON.stringify(testPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function generateCurlCommand() {
    if (!selectedDevice) return '';

    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const webhookUrl = `${baseUrl}/functions/v1/irrigation-webhook?token=${selectedDevice.webhook_token}`;
    const payload = JSON.stringify(testPayload, null, 2);
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    return `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${anonKey}" \\
  -d '${payload}'`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Devices Found</h3>
            <p className="text-gray-600">
              Add an irrigation device first to test webhooks
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <Code className="w-8 h-8 text-blue-600" />
          Webhook Tester
        </h2>
        <p className="text-gray-600">
          Test your irrigation hardware webhook integration before connecting real devices
        </p>
      </div>

      {/* Device Selection */}
      <Card>
        <CardContent className="pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Device to Test
            </label>
            <select
              value={selectedDevice?.id || ''}
              onChange={(e) => {
                const device = devices.find(d => d.id === e.target.value);
                setSelectedDevice(device);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.device_name} ({device.device_type})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Test Payload Configuration */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Test Payload</h3>
            <button
              onClick={copyPayload}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy JSON
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone Number *
              </label>
              <select
                value={testPayload.zone_number}
                onChange={(e) => setTestPayload({ ...testPayload, zone_number: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {zoneMappings.length > 0 ? (
                  zoneMappings.map(mapping => (
                    <option key={mapping.id} value={mapping.zone_number}>
                      Zone {mapping.zone_number} → {mapping.block?.name}
                    </option>
                  ))
                ) : (
                  <option value={1}>Zone 1 (No mappings configured)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flow Rate (GPM)
              </label>
              <input
                type="number"
                step="0.1"
                value={testPayload.flow_rate_avg}
                onChange={(e) => setTestPayload({ ...testPayload, flow_rate_avg: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={new Date(testPayload.start_time).toISOString().slice(0, 16)}
                onChange={(e) => setTestPayload({ ...testPayload, start_time: new Date(e.target.value).toISOString() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={new Date(testPayload.end_time).toISOString().slice(0, 16)}
                onChange={(e) => setTestPayload({ ...testPayload, end_time: new Date(e.target.value).toISOString() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={testPayload.notes}
                onChange={(e) => setTestPayload({ ...testPayload, notes: e.target.value })}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Send Test Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={sendTestWebhook}
              disabled={testing}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending Test Webhook...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Test Webhook
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <Card className={`border-2 ${testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              {testResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div>
                <h3 className={`font-bold ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {testResult.success ? 'Webhook Test Successful!' : 'Webhook Test Failed'}
                </h3>
                <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'} mt-1`}>
                  Status Code: {testResult.status}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-xs font-semibold text-gray-600 mb-2">Response:</div>
              <pre className="text-xs text-gray-700 overflow-x-auto">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>

            {testResult.success && testResult.data.event_id && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                <div className="text-sm text-green-800">
                  ✅ Irrigation event created with ID: <strong>{testResult.data.event_id}</strong>
                  <br />
                  Check the Irrigation History to see the new event!
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* cURL Command */}
      {selectedDevice && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">cURL Command</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateCurlCommand());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy
              </button>
            </div>
            <pre className="text-xs text-gray-700 bg-white p-4 rounded-lg border border-gray-300 overflow-x-auto">
              {generateCurlCommand()}
            </pre>
            <p className="text-xs text-gray-600 mt-2">
              Use this cURL command to test the webhook from your terminal or configure it in your irrigation controller
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
