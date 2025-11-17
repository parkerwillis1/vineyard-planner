import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Cpu, Plus, Edit, Trash2, RefreshCw, MapPin, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import {
  listControllers,
  createController,
  updateController,
  deleteController,
  syncBaselineController,
  syncHydrawiseController,
  syncRachioController,
  syncRainMachineController,
  listZoneMappings,
  createZoneMapping
} from '@/shared/lib/controllerIntegrations';

export default function ControllerManagement({ vineyardBlocks = [] }) {
  const [controllers, setControllers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingController, setEditingController] = useState(null);
  const [zoneMappingController, setZoneMappingController] = useState(null);

  useEffect(() => {
    loadControllers();
  }, []);

  async function loadControllers() {
    setLoading(true);
    try {
      const { data, error } = await listControllers(true);
      if (error) {
        console.error('Error loading controllers:', error);
        return;
      }
      setControllers(data || []);
    } catch (error) {
      console.error('Error loading controllers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(controller) {
    setSyncing(prev => ({ ...prev, [controller.id]: true }));

    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let result;

      switch (controller.controller_type) {
        case 'Baseline':
          result = await syncBaselineController(
            controller.id,
            controller.api_key_encrypted,
            controller.external_controller_id,
            startDate,
            endDate
          );
          break;

        case 'Hydrawise':
          result = await syncHydrawiseController(
            controller.id,
            controller.api_key_encrypted,
            startDate,
            endDate
          );
          break;

        case 'Rachio':
          result = await syncRachioController(
            controller.id,
            controller.api_key_encrypted,
            controller.external_controller_id,
            startDate,
            endDate
          );
          break;

        case 'RainMachine':
          result = await syncRainMachineController(
            controller.id,
            controller.ip_address,
            controller.api_key_encrypted, // password
            startDate,
            endDate
          );
          break;

        default:
          alert(`Sync not supported for ${controller.controller_type}`);
          return;
      }

      if (result.error) {
        alert(`Sync failed: ${result.error.message}`);
      } else {
        alert(`✅ Synced ${result.data.imported} irrigation events from controller`);
        await loadControllers();
      }
    } catch (error) {
      console.error('Error syncing controller:', error);
      alert(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(prev => ({ ...prev, [controller.id]: false }));
    }
  }

  async function handleDelete(controllerId) {
    if (!confirm('Are you sure you want to delete this controller? This will also delete all zone mappings.')) return;

    try {
      const { error } = await deleteController(controllerId);
      if (error) {
        alert(`Error deleting controller: ${error.message}`);
        return;
      }
      await loadControllers();
    } catch (error) {
      console.error('Error deleting controller:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cpu className="w-7 h-7 text-green-500" />
            Irrigation Controller Management
          </h2>
          <p className="text-gray-600 mt-1">
            Connect irrigation controllers to auto-import irrigation events
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Controller
        </Button>
      </div>

      {/* Controllers List */}
      {controllers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Controllers</h3>
            <p className="text-gray-600 mb-4">
              Add an irrigation controller to automatically import irrigation events
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Controller
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {controllers.map(controller => (
            <ControllerCard
              key={controller.id}
              controller={controller}
              onSync={handleSync}
              onEdit={() => setEditingController(controller)}
              onDelete={handleDelete}
              onManageZones={() => setZoneMappingController(controller)}
              isSyncing={syncing[controller.id] || false}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingController) && (
        <ControllerModal
          controller={editingController}
          onClose={() => {
            setShowAddModal(false);
            setEditingController(null);
          }}
          onSave={() => {
            loadControllers();
            setShowAddModal(false);
            setEditingController(null);
          }}
        />
      )}

      {/* Zone Mapping Modal */}
      {zoneMappingController && (
        <ZoneMappingModal
          controller={zoneMappingController}
          vineyardBlocks={vineyardBlocks}
          onClose={() => setZoneMappingController(null)}
        />
      )}
    </div>
  );
}

function ControllerCard({ controller, onSync, onEdit, onDelete, onManageZones, isSyncing }) {
  const lastSyncDate = controller.last_sync_at
    ? new Date(controller.last_sync_at).toLocaleDateString()
    : 'Never';

  const controllerTypeColors = {
    'Baseline': 'bg-blue-100 text-blue-800',
    'Hydrawise': 'bg-green-100 text-green-800',
    'Rachio': 'bg-purple-100 text-purple-800',
    'RainMachine': 'bg-orange-100 text-orange-800',
  };

  const colorClass = controllerTypeColors[controller.controller_type] || 'bg-gray-100 text-gray-800';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-green-500" />
              {controller.controller_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colorClass}`}>
                {controller.controller_type}
              </span>
              {controller.is_active ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-xs">Active</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-500">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-xs">Inactive</span>
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Controller ID */}
        {controller.external_controller_id && (
          <div className="text-sm">
            <span className="font-semibold text-gray-700">Controller ID:</span>{' '}
            <span className="text-gray-600 font-mono text-xs">
              {controller.external_controller_id}
            </span>
          </div>
        )}

        {/* IP Address (for local controllers) */}
        {controller.ip_address && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{controller.ip_address}</span>
          </div>
        )}

        {/* Last Sync */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Last Synced</div>
          <div className="text-lg font-bold text-gray-700">
            {lastSyncDate}
          </div>
        </div>

        {/* Notes */}
        {controller.notes && (
          <p className="text-xs text-gray-500 italic">
            {controller.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSync(controller)}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                Sync
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onManageZones}
          >
            <LinkIcon className="w-3 h-3 mr-1" />
            Zones
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(controller.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ControllerModal({ controller, onClose, onSave }) {
  const [formData, setFormData] = useState({
    controller_name: controller?.controller_name || '',
    controller_type: controller?.controller_type || 'Baseline',
    external_controller_id: controller?.external_controller_id || '',
    ip_address: controller?.ip_address || '',
    api_key_encrypted: controller?.api_key_encrypted || '',
    is_active: controller?.is_active ?? true,
    notes: controller?.notes || ''
  });

  const [saving, setSaving] = useState(false);

  const controllerTypes = [
    { value: 'Baseline', label: 'Baseline', requiresId: true, requiresIp: false },
    { value: 'Hydrawise', label: 'Hunter Hydrawise', requiresId: false, requiresIp: false },
    { value: 'Rachio', label: 'Rachio', requiresId: true, requiresIp: false },
    { value: 'RainMachine', label: 'RainMachine', requiresId: false, requiresIp: true }
  ];

  const selectedType = controllerTypes.find(t => t.value === formData.controller_type);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.controller_name) {
      alert('Please enter a controller name');
      return;
    }

    if (!formData.api_key_encrypted) {
      alert('Please enter an API key');
      return;
    }

    setSaving(true);
    try {
      if (controller) {
        const { error } = await updateController(controller.id, formData);
        if (error) throw error;
      } else {
        const { error } = await createController(formData);
        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving controller:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-gray-900">
            {controller ? 'Edit Controller' : 'Add Controller'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Controller Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Controller Name *
            </label>
            <input
              type="text"
              value={formData.controller_name}
              onChange={(e) => setFormData(prev => ({ ...prev, controller_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Main Vineyard Controller"
              required
            />
          </div>

          {/* Controller Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Controller Type
            </label>
            <select
              value={formData.controller_type}
              onChange={(e) => setFormData(prev => ({ ...prev, controller_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {controllerTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* External Controller ID (if required) */}
          {selectedType?.requiresId && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Controller ID *
              </label>
              <input
                type="text"
                value={formData.external_controller_id}
                onChange={(e) => setFormData(prev => ({ ...prev, external_controller_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter controller ID from manufacturer's system"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                Find this in your {formData.controller_type} account or app
              </p>
            </div>
          )}

          {/* IP Address (for local controllers) */}
          {selectedType?.requiresIp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                IP Address *
              </label>
              <input
                type="text"
                value={formData.ip_address}
                onChange={(e) => setFormData(prev => ({ ...prev, ip_address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., 192.168.1.100"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                Local network IP address of your RainMachine controller
              </p>
            </div>
          )}

          {/* API Key / Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {selectedType?.requiresIp ? 'Password' : 'API Key'} *
            </label>
            <input
              type="password"
              value={formData.api_key_encrypted}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key_encrypted: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={selectedType?.requiresIp ? 'Enter controller password' : 'Enter API key'}
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              {selectedType?.requiresIp
                ? 'Your RainMachine controller password'
                : `Get your API key from your ${formData.controller_type} account`
              }
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder="Optional notes about this controller..."
            />
          </div>

          {/* Active Status */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-green-600 rounded"
            />
            <span className="text-sm font-semibold text-gray-700">Active</span>
          </label>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : (controller ? 'Update Controller' : 'Add Controller')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function ZoneMappingModal({ controller, vineyardBlocks, onClose }) {
  const [zoneMappings, setZoneMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMapping, setNewMapping] = useState({
    zone_id_external: '',
    zone_name: '',
    block_id: '',
    flow_rate_gpm: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadZoneMappings();
  }, [controller.id]);

  async function loadZoneMappings() {
    setLoading(true);
    try {
      const { data, error } = await listZoneMappings(controller.id);
      if (error) {
        console.error('Error loading zone mappings:', error);
        return;
      }
      setZoneMappings(data || []);
    } catch (error) {
      console.error('Error loading zone mappings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMapping(e) {
    e.preventDefault();

    if (!newMapping.zone_id_external || !newMapping.block_id) {
      alert('Please enter zone ID and select a block');
      return;
    }

    setSaving(true);
    try {
      const { error } = await createZoneMapping(
        controller.id,
        newMapping.zone_id_external,
        newMapping.block_id,
        newMapping.zone_name || null
      );

      if (error) throw error;

      // Reset form
      setNewMapping({
        zone_id_external: '',
        zone_name: '',
        block_id: '',
        flow_rate_gpm: ''
      });

      await loadZoneMappings();
    } catch (error) {
      console.error('Error creating zone mapping:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Zone Mappings</h3>
              <p className="text-sm text-gray-600 mt-1">
                Map controller zones to vineyard blocks for {controller.controller_name}
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Add New Mapping Form */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-3">Add New Zone Mapping</h4>
            <form onSubmit={handleAddMapping} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Zone ID *
                </label>
                <input
                  type="text"
                  value={newMapping.zone_id_external}
                  onChange={(e) => setNewMapping(prev => ({ ...prev, zone_id_external: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 1, Zone1, relay_1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Zone Name (Optional)
                </label>
                <input
                  type="text"
                  value={newMapping.zone_name}
                  onChange={(e) => setNewMapping(prev => ({ ...prev, zone_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., North Block Drip"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Vineyard Block *
                </label>
                <select
                  value={newMapping.block_id}
                  onChange={(e) => setNewMapping(prev => ({ ...prev, block_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a block...</option>
                  {vineyardBlocks.map(block => (
                    <option key={block.id} value={block.id}>
                      {block.name} {block.variety && `(${block.variety})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? 'Adding...' : 'Add Mapping'}
                </Button>
              </div>
            </form>
          </div>

          {/* Existing Mappings */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Current Mappings</h4>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : zoneMappings.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
                <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">No zone mappings yet</p>
                <p className="text-sm text-gray-500">Add your first mapping above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {zoneMappings.map(mapping => (
                  <div
                    key={mapping.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        Zone {mapping.zone_id_external}
                        {mapping.zone_name && (
                          <span className="text-gray-600 font-normal ml-2">
                            ({mapping.zone_name})
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        → {mapping.vineyard_blocks?.name || 'Unknown Block'}
                        {mapping.vineyard_blocks?.variety && (
                          <span className="text-gray-500 ml-1">
                            ({mapping.vineyard_blocks.variety})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {mapping.flow_rate_gpm && (
                        <span className="text-xs text-gray-500">
                          {mapping.flow_rate_gpm} GPM
                        </span>
                      )}
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
