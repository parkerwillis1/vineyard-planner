import React, { useState, useEffect } from 'react';
import { CloudRain, Plus, Edit, Trash2, RefreshCw, MapPin, Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import {
  listRainGauges,
  createRainGauge,
  updateRainGauge,
  deleteRainGauge,
  getBlockRainfall
} from '@/shared/lib/rainGaugeApi';
import {
  fetchNWSRainfall,
  fetchOpenWeatherMapRainfall,
  fetchNOAARainfall,
  fetchVisualCrossingRainfall,
  autoSyncRainfallFromAPI,
  getRecommendedWeatherAPI
} from '@/shared/lib/weatherApiIntegrations';

export default function RainGaugeManagement({ vineyardBlocks = [] }) {
  const [gauges, setGauges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGauge, setEditingGauge] = useState(null);

  // Load rain gauges on mount
  useEffect(() => {
    loadGauges();
  }, []);

  async function loadGauges() {
    setLoading(true);
    try {
      const { data, error } = await listRainGauges(true);
      if (error) {
        console.error('Error loading rain gauges:', error);
        return;
      }
      setGauges(data || []);
    } catch (error) {
      console.error('Error loading rain gauges:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(gaugeId) {
    setSyncing(prev => ({ ...prev, [gaugeId]: true }));

    try {
      const gauge = gauges.find(g => g.id === gaugeId);
      if (!gauge) return;

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result = await autoSyncRainfallFromAPI(gaugeId, gauge, startDate, endDate);

      if (result.error) {
        alert(`Sync failed: ${result.error}`);
      } else {
        alert(`✅ Synced ${result.imported} rainfall readings from ${result.source}`);
        await loadGauges();
      }
    } catch (error) {
      console.error('Error syncing gauge:', error);
      alert(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(prev => ({ ...prev, [gaugeId]: false }));
    }
  }

  async function handleDelete(gaugeId) {
    if (!confirm('Are you sure you want to delete this rain gauge?')) return;

    try {
      const { error } = await deleteRainGauge(gaugeId);
      if (error) {
        alert(`Error deleting gauge: ${error.message}`);
        return;
      }
      await loadGauges();
    } catch (error) {
      console.error('Error deleting gauge:', error);
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
            <CloudRain className="w-7 h-7 text-blue-500" />
            Rainfall Tracking
          </h2>
          <p className="text-gray-600 mt-1">
            Connect to free weather APIs to automatically track rainfall for your vineyard
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Weather Station
        </Button>
      </div>

      {/* Rain Gauges List */}
      {gauges.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CloudRain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Weather Stations Connected</h3>
            <p className="text-gray-600 mb-4">
              Connect to a free weather API to automatically track rainfall for your vineyard blocks
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Connect Weather API
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gauges.map(gauge => (
            <RainGaugeCard
              key={gauge.id}
              gauge={gauge}
              onSync={handleSync}
              onEdit={() => setEditingGauge(gauge)}
              onDelete={handleDelete}
              isSyncing={syncing[gauge.id] || false}
              vineyardBlocks={vineyardBlocks}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingGauge) && (
        <RainGaugeModal
          gauge={editingGauge}
          vineyardBlocks={vineyardBlocks}
          onClose={() => {
            setShowAddModal(false);
            setEditingGauge(null);
          }}
          onSave={() => {
            loadGauges();
            setShowAddModal(false);
            setEditingGauge(null);
          }}
        />
      )}
    </div>
  );
}

function RainGaugeCard({ gauge, onSync, onEdit, onDelete, isSyncing, vineyardBlocks }) {
  const [recentRainfall, setRecentRainfall] = useState(null);
  const [loadingRainfall, setLoadingRainfall] = useState(false);

  // Get block names this gauge covers
  const coveredBlocks = vineyardBlocks.filter(b =>
    gauge.primary_for_blocks?.includes(b.id)
  );

  // Load recent rainfall for first covered block
  useEffect(() => {
    async function loadRecentRainfall() {
      if (coveredBlocks.length === 0) return;

      setLoadingRainfall(true);
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data } = await getBlockRainfall(coveredBlocks[0].id, startDate, endDate);

        if (data && data.length > 0) {
          const totalMm = data.reduce((sum, reading) => sum + (parseFloat(reading.total_rainfall_mm) || 0), 0);
          setRecentRainfall(totalMm);
        }
      } catch (error) {
        console.error('Error loading recent rainfall:', error);
      } finally {
        setLoadingRainfall(false);
      }
    }

    loadRecentRainfall();
  }, [gauge.id, coveredBlocks.length]);

  const isWeatherAPI = ['NWS', 'OpenWeatherMap', 'NOAA', 'VisualCrossing'].includes(gauge.station_type);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {isWeatherAPI ? (
                <Wifi className="w-5 h-5 text-blue-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-gray-500" />
              )}
              {gauge.station_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                isWeatherAPI ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {gauge.station_type || 'Manual'}
              </span>
              {gauge.is_active ? (
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
        {/* Location */}
        {gauge.lat && gauge.lng && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{gauge.lat.toFixed(4)}, {gauge.lng.toFixed(4)}</span>
          </div>
        )}

        {/* Covered Blocks */}
        {coveredBlocks.length > 0 && (
          <div className="text-sm">
            <span className="font-semibold text-gray-700">Covers:</span>{' '}
            <span className="text-gray-600">
              {coveredBlocks.map(b => b.name).join(', ')}
            </span>
          </div>
        )}

        {/* Recent Rainfall */}
        {!loadingRainfall && recentRainfall !== null && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Last 7 Days</div>
            <div className="text-2xl font-bold text-blue-700">
              {recentRainfall.toFixed(1)} <span className="text-sm font-normal">mm</span>
            </div>
            <div className="text-xs text-gray-600">
              {(recentRainfall / 25.4).toFixed(2)} inches
            </div>
          </div>
        )}

        {/* Notes */}
        {gauge.notes && (
          <p className="text-xs text-gray-500 italic">
            {gauge.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {isWeatherAPI && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSync(gauge.id)}
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
          )}
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
            onClick={() => onDelete(gauge.id)}
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

function RainGaugeModal({ gauge, vineyardBlocks, onClose, onSave }) {
  const [formData, setFormData] = useState({
    station_name: gauge?.station_name || '',
    station_type: gauge?.station_type || 'NWS',
    lat: gauge?.lat || '',
    lng: gauge?.lng || '',
    is_active: gauge?.is_active ?? true,
    measures_rainfall: gauge?.measures_rainfall ?? true,
    primary_for_blocks: gauge?.primary_for_blocks || [],
    api_key_encrypted: gauge?.api_key_encrypted || '',
    notes: gauge?.notes || ''
  });

  const [saving, setSaving] = useState(false);

  const stationTypes = [
    { value: 'NWS', label: 'National Weather Service (FREE - USA Only)', requiresApi: false },
    { value: 'NOAA', label: 'NOAA Climate Data Online (FREE)', requiresApi: true },
    { value: 'OpenWeatherMap', label: 'OpenWeatherMap (1000 calls/day free)', requiresApi: true },
    { value: 'VisualCrossing', label: 'Visual Crossing (1000 records/day free)', requiresApi: true }
  ];

  const selectedType = stationTypes.find(t => t.value === formData.station_type);
  const requiresApiKey = selectedType?.requiresApi || false;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.station_name) {
      alert('Please enter a station name');
      return;
    }

    setSaving(true);
    try {
      if (gauge) {
        // Update existing gauge
        const { error } = await updateRainGauge(gauge.id, formData);
        if (error) throw error;
      } else {
        // Create new gauge
        const { error } = await createRainGauge(formData);
        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving rain gauge:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  function handleBlockToggle(blockId) {
    setFormData(prev => ({
      ...prev,
      primary_for_blocks: prev.primary_for_blocks.includes(blockId)
        ? prev.primary_for_blocks.filter(id => id !== blockId)
        : [...prev.primary_for_blocks, blockId]
    }));
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-gray-900">
            {gauge ? 'Edit Weather Station' : 'Connect Weather API'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Connect to a free weather service to track rainfall automatically
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Station Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Station Name *
            </label>
            <input
              type="text"
              value={formData.station_name}
              onChange={(e) => setFormData(prev => ({ ...prev, station_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., North Field Weather"
              required
            />
          </div>

          {/* Station Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Weather Service *
            </label>
            <select
              value={formData.station_type}
              onChange={(e) => setFormData(prev => ({ ...prev, station_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {stationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {formData.station_type === 'NWS' && (
              <p className="text-xs text-green-600 mt-1">
                ✅ Free, no API key required! Best for USA locations.
              </p>
            )}
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.lat}
                onChange={(e) => setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="32.3199"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.lng}
                onChange={(e) => setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="-106.7637"
              />
            </div>
          </div>

          {/* API Key (if required) */}
          {requiresApiKey && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={formData.api_key_encrypted}
                onChange={(e) => setFormData(prev => ({ ...prev, api_key_encrypted: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your API key"
              />
              <p className="text-xs text-gray-600 mt-1">
                Get your API key from the {formData.station_type} website
              </p>
            </div>
          )}

          {/* Vineyard Blocks Coverage */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Covers Vineyard Blocks
            </label>
            <div className="border border-gray-300 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
              {vineyardBlocks.length === 0 ? (
                <p className="text-sm text-gray-500">No vineyard blocks available</p>
              ) : (
                vineyardBlocks.map(block => (
                  <label key={block.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.primary_for_blocks.includes(block.id)}
                      onChange={() => handleBlockToggle(block.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      {block.name} {block.variety && `(${block.variety})`}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Optional notes about this rain gauge..."
            />
          </div>

          {/* Active Status */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-semibold text-gray-700">Active</span>
          </label>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : (gauge ? 'Update Station' : 'Connect Weather API')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
