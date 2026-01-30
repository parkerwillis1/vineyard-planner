import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  Copy,
  Check,
  Settings,
  AlertCircle,
  Loader,
  RefreshCw,
  ExternalLink,
  Power,
  PowerOff,
  BookOpen,
  ChevronLeft,
  Droplets,
  Waves,
  Gauge,
  Webhook
} from 'lucide-react';

// Map icon names to Lucide components
const DEVICE_ICONS = {
  Droplets,
  Waves,
  Gauge,
  Webhook
};
import { Card, CardContent } from '@/shared/components/ui/card';
import { useAuth } from '@/auth/AuthContext';
import { DocLink } from '@/shared/components/DocLink';
import {
  listIrrigationDevices,
  createIrrigationDevice,
  updateIrrigationDevice,
  deleteIrrigationDevice,
  DEVICE_TYPES,
  generateWebhookUrl
} from '@/shared/lib/hardwareApi';
import { HardwareIntegrationDocs } from './HardwareIntegrationDocs';
import { LoadingSpinner } from './LoadingSpinner';

export function HardwareIntegration() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);
  const [showDocs, setShowDocs] = useState(false);

  // New device form
  const [newDevice, setNewDevice] = useState({
    device_name: '',
    device_type: '',
    device_id: '',
    api_key: ''
  });

  // Load devices
  useEffect(() => {
    if (!user) return;
    loadDevices();
  }, [user]);

  async function loadDevices() {
    setLoading(true);
    try {
      const { data, error } = await listIrrigationDevices();
      if (error) {
        console.error('Error loading devices:', error);
        return;
      }
      setDevices(data || []);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDevice() {
    if (!newDevice.device_name || !newDevice.device_type || !newDevice.device_id) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await createIrrigationDevice({
        device_name: newDevice.device_name,
        device_type: newDevice.device_type,
        device_id: newDevice.device_id,
        api_key: newDevice.api_key || null,
        config: {},
        is_active: true
      });

      if (error) {
        console.error('Error creating device:', error);
        alert('Failed to create device: ' + error.message);
        return;
      }

      setDevices([data, ...devices]);
      setShowAddDevice(false);
      setNewDevice({ device_name: '', device_type: '', device_id: '', api_key: '' });
      setSelectedDeviceType(null);
    } catch (error) {
      console.error('Error creating device:', error);
      alert('Failed to create device');
    }
  }

  async function handleDeleteDevice(deviceId) {
    if (!confirm('Delete this device? This will also remove all zone mappings.')) return;

    try {
      const { error } = await deleteIrrigationDevice(deviceId);
      if (error) {
        console.error('Error deleting device:', error);
        alert('Failed to delete device');
        return;
      }

      setDevices(devices.filter(d => d.id !== deviceId));
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  }

  async function handleToggleDevice(device) {
    try {
      const { error } = await updateIrrigationDevice(device.id, {
        is_active: !device.is_active
      });

      if (error) {
        console.error('Error toggling device:', error);
        return;
      }

      setDevices(devices.map(d =>
        d.id === device.id ? { ...d, is_active: !d.is_active } : d
      ));
    } catch (error) {
      console.error('Error toggling device:', error);
    }
  }

  function copyWebhookUrl(device) {
    const webhookUrl = generateWebhookUrl(device.webhook_token);
    navigator.clipboard.writeText(webhookUrl);
    setCopiedToken(device.id);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  if (loading) {
    return <LoadingSpinner message="Loading devices..." />;
  }

  // If showing documentation, render it instead of devices
  if (showDocs) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={() => setShowDocs(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documentation & Setup Guides</h1>
            <p className="text-sm text-gray-500 mt-1">Complete guide for connecting irrigation hardware</p>
          </div>
        </div>
        <HardwareIntegrationDocs />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect irrigation controllers and flow meters to automatically log irrigation events. <DocLink docId="operations/devices" />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDocs(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
          >
            <BookOpen className="w-5 h-5" />
            Setup Guides & FAQs
          </button>
          <button
            onClick={() => setShowAddDevice(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Device
          </button>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddDevice && (
        <Card className="border-2 border-blue-500 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Device</h3>
              <button
                onClick={() => {
                  setShowAddDevice(false);
                  setSelectedDeviceType(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {!selectedDeviceType ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">Select your irrigation controller or flow meter type:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(DEVICE_TYPES).map(([key, type]) => {
                    const IconComponent = DEVICE_ICONS[type.iconName];
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedDeviceType(key);
                          setNewDevice({ ...newDevice, device_type: key });
                        }}
                        className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                      >
                        <div className={`w-14 h-14 rounded-xl ${type.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                          {IconComponent ? (
                            <IconComponent className={`w-7 h-7 ${type.iconColor}`} />
                          ) : (
                            <Webhook className="w-7 h-7 text-gray-500" />
                          )}
                        </div>
                        <div className="font-bold text-gray-900 mb-1">{type.name}</div>
                        <div className="text-xs text-gray-500">
                          {type.supportsWebhook && '✓ Webhook'}
                          {type.supportsApi && type.supportsWebhook && ' • '}
                          {type.supportsApi && '✓ API'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const selectedType = DEVICE_TYPES[selectedDeviceType];
                  const IconComponent = DEVICE_ICONS[selectedType.iconName];
                  return (
                    <div className={`p-4 ${selectedType.bgColor} rounded-lg border ${selectedType.iconColor.replace('text-', 'border-')}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center`}>
                          {IconComponent ? (
                            <IconComponent className={`w-6 h-6 ${selectedType.iconColor}`} />
                          ) : (
                            <Webhook className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">{selectedType.name}</h4>
                          <p className="text-sm text-gray-600">
                            {selectedType.setupInstructions}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Device Name *</label>
                  <input
                    type="text"
                    value={newDevice.device_name}
                    onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                    placeholder="e.g., Main Pump Station, Zone Controller A"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device ID * (Serial Number, MAC Address, etc.)
                  </label>
                  <input
                    type="text"
                    value={newDevice.device_id}
                    onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                    placeholder="e.g., RB-12345, 00:1A:2B:3C:4D:5E"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {DEVICE_TYPES[selectedDeviceType].supportsApi && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key (if required)
                    </label>
                    <input
                      type="password"
                      value={newDevice.api_key}
                      onChange={(e) => setNewDevice({ ...newDevice, api_key: e.target.value })}
                      placeholder="Enter API key from device manufacturer"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={handleAddDevice}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add Device
                  </button>
                  <button
                    onClick={() => setSelectedDeviceType(null)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Devices List */}
      {devices.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Devices Connected</h3>
              <p className="text-gray-600 mb-6">
                Connect your irrigation controllers or flow meters to automatically track irrigation events.
              </p>
              <button
                onClick={() => setShowAddDevice(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Your First Device
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {devices.map(device => {
            const deviceType = DEVICE_TYPES[device.device_type];
            const webhookUrl = generateWebhookUrl(device.webhook_token);

            return (
              <Card key={device.id} className={`border-2 ${device.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <CardContent className="pt-6">
                  {/* Device Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl ${deviceType?.bgColor || 'bg-gray-100'} flex items-center justify-center`}>
                        {(() => {
                          const IconComponent = DEVICE_ICONS[deviceType?.iconName];
                          return IconComponent ? (
                            <IconComponent className={`w-6 h-6 ${deviceType?.iconColor || 'text-gray-500'}`} />
                          ) : (
                            <Webhook className="w-6 h-6 text-gray-500" />
                          );
                        })()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{device.device_name}</h3>
                        <p className="text-sm text-gray-600">{deviceType?.name || device.device_type}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {device.device_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleDevice(device)}
                        className={`p-2 rounded-lg transition-colors ${
                          device.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={device.is_active ? 'Device Active' : 'Device Inactive'}
                      >
                        {device.is_active ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                    <div className={`w-2 h-2 rounded-full ${device.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm text-gray-600">
                      {device.is_active ? 'Active' : 'Inactive'}
                      {device.last_sync_at && (
                        <span className="text-gray-500 ml-2">
                          • Last sync: {new Date(device.last_sync_at).toLocaleString()}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Webhook URL */}
                  {deviceType?.supportsWebhook && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={webhookUrl}
                          readOnly
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono"
                        />
                        <button
                          onClick={() => copyWebhookUrl(device)}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Copy Webhook URL"
                        >
                          {copiedToken === device.id ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Configure your device to send POST requests to this URL
                      </p>
                    </div>
                  )}

                  {/* Configure Zones Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.location.href = `/vineyard?view=hardware-zones&device=${device.id}`}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Settings className="w-4 h-4" />
                      Configure Zones
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Need Help Getting Started?</h3>
                <ol className="space-y-2 text-sm text-gray-700 mb-4">
                  <li>1. Add your irrigation controller or flow meter above</li>
                  <li>2. Configure which zones map to which vineyard fields</li>
                  <li>3. Copy the webhook URL and configure your device to send data to it</li>
                  <li>4. Irrigation events will be automatically logged when your system runs</li>
                </ol>
                <button
                  onClick={() => setShowDocs(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <BookOpen className="w-4 h-4" />
                  View Complete Setup Guides & FAQs
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
