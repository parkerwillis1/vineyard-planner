import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Thermometer, Plus, Edit, Trash2, X, Eye, EyeOff, Copy, CheckCircle,
  AlertTriangle, Activity, WifiOff, RefreshCw, Zap
} from 'lucide-react';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import {
  listSensors,
  createSensor,
  updateSensor,
  deleteSensor,
  regenerateSensorApiKey,
  listContainers,
  listLots
} from '@/shared/lib/productionApi';

const SENSOR_TYPES = {
  cellar: [
    { value: 'tilt', label: 'Tilt Hydrometer', icon: '🍺', category: 'cellar' },
    { value: 'plaato', label: 'PLAATO Keg', icon: '📊', category: 'cellar' },
    { value: 'inkbird', label: 'Inkbird WiFi Controller', icon: '🌡️', category: 'cellar' },
    { value: 'raspberry_pi_cellar', label: 'Raspberry Pi (Tank Probe)', icon: '🥧', category: 'cellar' },
    { value: 'esp32_cellar', label: 'ESP32/Arduino (Tank)', icon: '🔧', category: 'cellar' },
    { value: 'wifi_temp', label: 'WiFi Temperature Probe', icon: '📡', category: 'cellar' },
    { value: 'bluetooth_temp', label: 'Bluetooth Thermometer', icon: '📱', category: 'cellar' },
    { value: 'modbus_cellar', label: 'Modbus/Industrial (Cellar)', icon: '🏭', category: 'cellar' },
  ],
  field: [
    { value: 'davis_vantage', label: 'Davis Vantage Pro2', icon: '🌤️', category: 'field' },
    { value: 'atmos_41', label: 'ATMOS 41', icon: '🔬', category: 'field' },
    { value: 'tempest', label: 'WeatherFlow Tempest', icon: '⛈️', category: 'field' },
    { value: 'onset_hobo', label: 'Onset HOBO', icon: '📊', category: 'field' },
    { value: 'meter_teros', label: 'METER TEROS (Soil)', icon: '🌱', category: 'field' },
    { value: 'delta_t_sm150', label: 'Delta-T SM150T (Soil)', icon: '🌾', category: 'field' },
    { value: 'sentek_drill', label: 'Sentek Drill & Drop', icon: '⚡', category: 'field' },
    { value: 'acclima_tdr', label: 'Acclima TDR', icon: '📡', category: 'field' },
    { value: 'flow_meter', label: 'Flow Meter (Irrigation)', icon: '💧', category: 'field' },
    { value: 'pressure_sensor', label: 'Pressure Sensor', icon: '🔧', category: 'field' },
    { value: 'dendrometer', label: 'Dendrometer (Trunk)', icon: '🌳', category: 'field' },
    { value: 'raspberry_pi_field', label: 'Raspberry Pi (Weather)', icon: '🥧', category: 'field' },
    { value: 'esp32_field', label: 'ESP32/Arduino (Field)', icon: '🔌', category: 'field' },
  ],
  other: [
    { value: 'other', label: 'Other/Custom', icon: '⚙️', category: 'other' }
  ]
};

// Flatten for backwards compatibility
const ALL_SENSOR_TYPES = [
  ...SENSOR_TYPES.cellar,
  ...SENSOR_TYPES.field,
  ...SENSOR_TYPES.other
];

const STATUS_COLORS = {
  active: { bg: 'bg-green-100', text: 'text-green-700', icon: Activity },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-700', icon: WifiOff },
  error: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
  offline: { bg: 'bg-amber-100', text: 'text-amber-700', icon: WifiOff }
};

export function SensorManager() {
  const [sensors, setSensors] = useState([]);
  const [containers, setContainers] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);
  const [showApiKey, setShowApiKey] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });

  const [formData, setFormData] = useState({
    name: '',
    sensor_type: '',
    location_type: 'cellar', // 'field' or 'cellar'
    manufacturer: '',
    model: '',
    serial_number: '',
    assignment_type: 'container', // 'container' or 'lot'
    container_id: null,
    lot_id: null,
    connection_interval_minutes: 15,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sensorsResult, containersResult, lotsResult] = await Promise.all([
        listSensors(),
        listContainers(),
        listLots({ status: 'fermenting' })
      ]);

      if (sensorsResult.error) throw sensorsResult.error;
      if (containersResult.error) throw containersResult.error;
      if (lotsResult.error) throw lotsResult.error;

      setSensors(sensorsResult.data || []);
      setContainers(containersResult.data || []);
      setLots(lotsResult.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (sensor = null) => {
    if (sensor) {
      setEditingSensor(sensor);
      setFormData({
        name: sensor.name,
        sensor_type: sensor.sensor_type,
        location_type: sensor.location_type || 'cellar',
        manufacturer: sensor.manufacturer || '',
        model: sensor.model || '',
        serial_number: sensor.serial_number || '',
        assignment_type: sensor.container_id ? 'container' : 'lot',
        container_id: sensor.container_id,
        lot_id: sensor.lot_id,
        connection_interval_minutes: sensor.connection_interval_minutes || 15,
        notes: sensor.notes || ''
      });
    } else {
      setEditingSensor(null);
      setFormData({
        name: '',
        sensor_type: '',
        location_type: 'cellar',
        manufacturer: '',
        model: '',
        serial_number: '',
        assignment_type: 'container',
        container_id: null,
        lot_id: null,
        connection_interval_minutes: 15,
        notes: ''
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const sensorData = {
        name: formData.name,
        sensor_type: formData.sensor_type,
        location_type: formData.location_type,
        manufacturer: formData.manufacturer || null,
        model: formData.model || null,
        serial_number: formData.serial_number || null,
        container_id: formData.assignment_type === 'container' ? formData.container_id : null,
        lot_id: formData.assignment_type === 'lot' ? formData.lot_id : null,
        connection_interval_minutes: parseInt(formData.connection_interval_minutes) || 15,
        notes: formData.notes || null
      };

      if (editingSensor) {
        const { error: updateError } = await updateSensor(editingSensor.id, sensorData);
        if (updateError) throw updateError;
        setSuccess('Sensor updated successfully');
      } else {
        const { error: createError } = await createSensor(sensorData);
        if (createError) throw createError;
        setSuccess('Sensor registered successfully');
      }

      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Error saving sensor:', err);
      setError(err.message);
    }
  };

  const handleDelete = (sensor) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Sensor',
      message: `Are you sure you want to delete "${sensor.name}"? All temperature readings from this sensor will be preserved.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error: deleteError } = await deleteSensor(sensor.id);
          if (deleteError) throw deleteError;
          setSuccess('Sensor deleted successfully');
          loadData();
        } catch (err) {
          console.error('Error deleting sensor:', err);
          setError(err.message);
        }
      }
    });
  };

  const handleRegenerateApiKey = (sensor) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Regenerate API Key',
      message: `Are you sure you want to regenerate the API key for "${sensor.name}"? The old key will stop working immediately.`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          const { error: regenError } = await regenerateSensorApiKey(sensor.id);
          if (regenError) throw regenError;
          setSuccess('API key regenerated successfully');
          loadData();
        } catch (err) {
          console.error('Error regenerating API key:', err);
          setError(err.message);
        }
      }
    });
  };

  const copyApiKey = (sensorId, apiKey) => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(sensorId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getAssignmentDisplay = (sensor) => {
    if (sensor.container) {
      return `${sensor.container.name} (${sensor.container.type})`;
    }
    if (sensor.lot) {
      return `${sensor.lot.name} (${sensor.lot.varietal})`;
    }
    return 'Unassigned';
  };

  const getSensorTypeDisplay = (type) => {
    const sensorType = ALL_SENSOR_TYPES.find(t => t.value === type);
    return sensorType ? `${sensorType.icon} ${sensorType.label}` : type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading sensors...</div>
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Temperature Sensors</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor tanks and fermentations with IoT sensors</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Sensor
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Sensors List */}
      {sensors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Thermometer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sensors Registered</h3>
          <p className="text-gray-600 mb-6">Connect IoT temperature sensors to monitor your fermentations in real-time.</p>
          <button
            onClick={() => handleOpenForm()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Sensor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sensors.map((sensor) => {
            const StatusIcon = STATUS_COLORS[sensor.status]?.icon || Activity;
            const statusColor = STATUS_COLORS[sensor.status] || STATUS_COLORS.inactive;

            return (
              <div key={sensor.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{sensor.name}</h3>
                      <span className={`px-2 py-0.5 ${statusColor.bg} ${statusColor.text} text-xs rounded font-medium flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {sensor.status}
                      </span>
                      {sensor.location_type && (
                        <span className={`px-2 py-0.5 text-xs rounded font-medium flex items-center gap-1 ${
                          sensor.location_type === 'field'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-purple-100 text-purple-700 border border-purple-200'
                        }`}>
                          {sensor.location_type === 'field' ? '🌱 Field' : '🍷 Cellar'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{getSensorTypeDisplay(sensor.sensor_type)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenForm(sensor)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit sensor"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(sensor)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete sensor"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Assigned To</p>
                    <p className="font-medium text-gray-900">{getAssignmentDisplay(sensor)}</p>
                  </div>
                  {sensor.last_reading_temp_f && (
                    <div>
                      <p className="text-gray-500">Current Temp</p>
                      <p className="font-medium text-gray-900">{sensor.last_reading_temp_f}°F</p>
                    </div>
                  )}
                  {sensor.last_reading_at && (
                    <div>
                      <p className="text-gray-500">Last Reading</p>
                      <p className="font-medium text-gray-900">
                        {new Date(sensor.last_reading_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Check-in Interval</p>
                    <p className="font-medium text-gray-900">{sensor.connection_interval_minutes} min</p>
                  </div>
                </div>

                {/* API Key */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600 uppercase">API Key</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowApiKey(prev => ({ ...prev, [sensor.id]: !prev[sensor.id] }))}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title={showApiKey[sensor.id] ? "Hide API key" : "Show API key"}
                      >
                        {showApiKey[sensor.id] ? (
                          <EyeOff className="w-3 h-3 text-gray-600" />
                        ) : (
                          <Eye className="w-3 h-3 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRegenerateApiKey(sensor)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Regenerate API key"
                      >
                        <RefreshCw className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-xs font-mono overflow-hidden">
                      {showApiKey[sensor.id] ? sensor.api_key : '••••••••••••••••••••••••••••••••'}
                    </code>
                    {showApiKey[sensor.id] && (
                      <button
                        onClick={() => copyApiKey(sensor.id, sensor.api_key)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Copy API key"
                      >
                        {copiedKey === sensor.id ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Sensor Modal */}
      {showForm && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="bg-purple-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {editingSensor ? 'Edit Sensor' : 'Add New Sensor'}
                </h3>
                <p className="text-purple-100 text-sm">Register an IoT temperature sensor</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Location Type - FIRST */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sensor Location *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, location_type: 'field', sensor_type: '' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.location_type === 'field'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">🌱</div>
                    <p className="font-semibold text-gray-900">Field/Vineyard</p>
                    <p className="text-xs text-gray-600 mt-1">Weather, soil, irrigation sensors</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, location_type: 'cellar', sensor_type: '' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.location_type === 'cellar'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">🍷</div>
                    <p className="font-semibold text-gray-900">Cellar/Production</p>
                    <p className="text-xs text-gray-600 mt-1">Tank, barrel, fermentation sensors</p>
                  </button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sensor Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder={formData.location_type === 'field' ? 'e.g., Block 3 Weather Station' : 'e.g., Tank 1 Temperature Probe'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sensor Type *</label>
                  <select
                    value={formData.sensor_type}
                    onChange={(e) => setFormData({ ...formData, sensor_type: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select type...</option>
                    {formData.location_type === 'cellar' && (
                      <optgroup label="🍷 Cellar/Production Sensors">
                        {SENSOR_TYPES.cellar.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {formData.location_type === 'field' && (
                      <optgroup label="🌱 Field/Vineyard Sensors">
                        {SENSOR_TYPES.field.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="⚙️ Other">
                      {SENSOR_TYPES.other.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Manufacturer & Model */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial #</label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Assignment */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignment_type"
                      value="container"
                      checked={formData.assignment_type === 'container'}
                      onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value, lot_id: null })}
                      className="text-purple-600"
                    />
                    <span className="text-sm">Tank/Barrel</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignment_type"
                      value="lot"
                      checked={formData.assignment_type === 'lot'}
                      onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value, container_id: null })}
                      className="text-purple-600"
                    />
                    <span className="text-sm">Specific Lot</span>
                  </label>
                </div>

                {formData.assignment_type === 'container' ? (
                  <select
                    value={formData.container_id || ''}
                    onChange={(e) => setFormData({ ...formData, container_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select tank or barrel...</option>
                    {containers.map(container => (
                      <option key={container.id} value={container.id}>
                        {container.name} ({container.type}, {container.capacity_gallons} gal)
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={formData.lot_id || ''}
                    onChange={(e) => setFormData({ ...formData, lot_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select lot...</option>
                    {lots.map(lot => (
                      <option key={lot.id} value={lot.id}>
                        {lot.name} ({lot.varietal})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Interval (minutes)
                </label>
                <input
                  type="number"
                  value={formData.connection_interval_minutes}
                  onChange={(e) => setFormData({ ...formData, connection_interval_minutes: e.target.value })}
                  min="1"
                  max="1440"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">How often sensor should send data (used for offline detection)</p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Location, installation details, etc."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingSensor ? 'Update Sensor' : 'Register Sensor'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
