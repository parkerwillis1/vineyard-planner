import React, { useState, useEffect } from 'react';
import {
  Map,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Droplet,
  Loader,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '@/auth/AuthContext';
import { listVineyardBlocks } from '@/shared/lib/vineyardApi';
import { sortByName } from '@/shared/lib/sortUtils';
import {
  getIrrigationDevice,
  listDeviceZoneMappings,
  createZoneMapping,
  updateZoneMapping,
  deleteZoneMapping
} from '@/shared/lib/hardwareApi';

export function DeviceZoneMapping({ deviceId, onBack }) {
  const { user } = useAuth();
  const [device, setDevice] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [zoneMappings, setZoneMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);

  // New zone form
  const [newZone, setNewZone] = useState({
    zone_number: '',
    zone_name: '',
    block_id: '',
    flow_rate_gpm: '',
    irrigation_method: 'drip'
  });

  // Load device and mappings
  useEffect(() => {
    if (!user || !deviceId) return;
    loadData();
  }, [user, deviceId]);

  async function loadData() {
    setLoading(true);
    try {
      // Load device
      const { data: deviceData, error: deviceError } = await getIrrigationDevice(deviceId);
      if (deviceError) {
        console.error('Error loading device:', deviceError);
        return;
      }
      setDevice(deviceData);

      // Load vineyard blocks
      const { data: blocksData, error: blocksError } = await listVineyardBlocks();
      if (blocksError) {
        console.error('Error loading blocks:', blocksError);
        return;
      }
      setBlocks(blocksData || []);

      // Load zone mappings
      const { data: mappingsData, error: mappingsError } = await listDeviceZoneMappings(deviceId);
      if (mappingsError) {
        console.error('Error loading mappings:', mappingsError);
        return;
      }
      setZoneMappings(mappingsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddZone() {
    if (!newZone.zone_number || !newZone.block_id || !newZone.flow_rate_gpm) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if zone number already exists
    if (zoneMappings.some(m => m.zone_number === parseInt(newZone.zone_number))) {
      alert('This zone number is already mapped');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await createZoneMapping({
        device_id: deviceId,
        zone_number: parseInt(newZone.zone_number),
        zone_name: newZone.zone_name || null,
        block_id: newZone.block_id,
        flow_rate_gpm: parseFloat(newZone.flow_rate_gpm),
        irrigation_method: newZone.irrigation_method
      });

      if (error) {
        console.error('Error creating zone mapping:', error);
        alert('Failed to create zone mapping: ' + error.message);
        return;
      }

      // Reload mappings to get full block details
      await loadData();

      setShowAddZone(false);
      setNewZone({
        zone_number: '',
        zone_name: '',
        block_id: '',
        flow_rate_gpm: '',
        irrigation_method: 'drip'
      });
    } catch (error) {
      console.error('Error creating zone mapping:', error);
      alert('Failed to create zone mapping');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteZone(mappingId) {
    if (!confirm('Delete this zone mapping?')) return;

    try {
      const { error } = await deleteZoneMapping(mappingId);
      if (error) {
        console.error('Error deleting zone mapping:', error);
        alert('Failed to delete zone mapping');
        return;
      }

      setZoneMappings(zoneMappings.filter(m => m.id !== mappingId));
    } catch (error) {
      console.error('Error deleting zone mapping:', error);
    }
  }

  async function handleUpdateZone(mappingId, updates) {
    try {
      const { error } = await updateZoneMapping(mappingId, updates);
      if (error) {
        console.error('Error updating zone mapping:', error);
        return;
      }

      setZoneMappings(zoneMappings.map(m =>
        m.id === mappingId ? { ...m, ...updates } : m
      ));
    } catch (error) {
      console.error('Error updating zone mapping:', error);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading zone mappings..." />;
  }

  if (!device) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Device not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configure Zones</h2>
          <p className="text-gray-600">{device.device_name}</p>
        </div>
      </div>

      {/* Add Zone Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddZone(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Zone Mapping
        </button>
      </div>

      {/* Add Zone Form */}
      {showAddZone && (
        <Card className="border-2 border-blue-500 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">New Zone Mapping</h3>
              <button
                onClick={() => setShowAddZone(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone Number *
                </label>
                <input
                  type="number"
                  min="1"
                  value={newZone.zone_number}
                  onChange={(e) => setNewZone({ ...newZone, zone_number: e.target.value })}
                  placeholder="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone Name (optional)
                </label>
                <input
                  type="text"
                  value={newZone.zone_name}
                  onChange={(e) => setNewZone({ ...newZone, zone_name: e.target.value })}
                  placeholder="Front Field Drip"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vineyard Field *
                </label>
                <select
                  value={newZone.block_id}
                  onChange={(e) => setNewZone({ ...newZone, block_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a field</option>
                  {sortByName(blocks).map(block => (
                    <option key={block.id} value={block.id}>
                      {block.name} {block.variety ? `(${block.variety})` : ''} - {block.acres} ac
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flow Rate (GPM) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newZone.flow_rate_gpm}
                  onChange={(e) => setNewZone({ ...newZone, flow_rate_gpm: e.target.value })}
                  placeholder="150"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Irrigation Method
                </label>
                <select
                  value={newZone.irrigation_method}
                  onChange={(e) => setNewZone({ ...newZone, irrigation_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="drip">Drip</option>
                  <option value="micro-sprinkler">Micro-sprinkler</option>
                  <option value="overhead">Overhead</option>
                  <option value="flood">Flood</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleAddZone}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Zone
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAddZone(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zone Mappings List */}
      {zoneMappings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Zones Configured</h3>
              <p className="text-gray-600 mb-6">
                Map your irrigation controller zones to vineyard fields
              </p>
              <button
                onClick={() => setShowAddZone(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add First Zone
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zoneMappings
            .sort((a, b) => a.zone_number - b.zone_number)
            .map(mapping => (
              <Card key={mapping.id} className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Droplet className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">Zone {mapping.zone_number}</div>
                        {mapping.zone_name && (
                          <div className="text-sm text-gray-600">{mapping.zone_name}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteZone(mapping.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Mapped to Field</div>
                      <div className="font-semibold text-gray-900">
                        {mapping.block?.name || 'Unknown Field'}
                      </div>
                      {mapping.block?.variety && (
                        <div className="text-sm text-gray-600">{mapping.block.variety}</div>
                      )}
                      {mapping.block?.acres && (
                        <div className="text-xs text-gray-500">{mapping.block.acres} acres</div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Flow Rate</div>
                        <div className="font-semibold text-gray-900">{mapping.flow_rate_gpm} GPM</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Method</div>
                        <div className="font-semibold text-gray-900 capitalize">
                          {mapping.irrigation_method?.replace('-', ' ') || 'Drip'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Ready to receive data</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-2">Zone Mapping Instructions:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Each zone on your irrigation controller should map to one vineyard field</li>
                <li>Set the flow rate (GPM) for accurate water volume calculations</li>
                <li>When your controller runs a zone, it will automatically log irrigation to the mapped field</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
