import React, { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import {
  Plus,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Play,
  Filter,
  ChevronDown,
  Grape,
  X
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import {
  listHarvestTracking,
  listVineyardBlocks,
  getHarvestStatistics,
  createHarvestTracking,
  startHarvest,
  getHarvestTracking
} from '@/shared/lib/vineyardApi';

export function HarvestTracking() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedSeason, setSelectedSeason] = useState(currentYear);
  const [harvests, setHarvests] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVariety, setFilterVariety] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    block_id: '',
    target_pick_date: '',
    estimated_tons: '',
    estimated_tons_per_acre: '',
    target_brix: '',
    target_ta: '',
    target_ph: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadHarvestData();
    }
  }, [user, selectedSeason]);

  const loadHarvestData = async () => {
    setLoading(true);
    console.log('Loading harvest data for season:', selectedSeason);

    const [harvestsRes, blocksRes, statsRes] = await Promise.all([
      listHarvestTracking(selectedSeason),
      listVineyardBlocks(),
      getHarvestStatistics(selectedSeason)
    ]);

    if (harvestsRes.error) {
      console.error('Error loading harvests:', harvestsRes.error);
    } else {
      console.log('Loaded harvests:', harvestsRes.data);
      setHarvests(harvestsRes.data || []);
    }

    if (blocksRes.error) {
      console.error('Error loading blocks:', blocksRes.error);
    } else {
      setBlocks(blocksRes.data || []);
    }

    if (statsRes.error) {
      console.error('Error loading statistics:', statsRes.error);
    } else {
      setStatistics(statsRes.data);
    }

    setLoading(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      planned: 'gray',
      in_progress: 'blue',
      completed: 'green'
    };
    return colors[status] || 'gray';
  };

  const getStatusIcon = (status) => {
    const icons = {
      planned: AlertCircle,
      in_progress: Play,
      completed: CheckCircle2
    };
    return icons[status] || AlertCircle;
  };

  const getStatusLabel = (status) => {
    const labels = {
      planned: 'Planned',
      in_progress: 'In Progress',
      completed: 'Completed'
    };
    return labels[status] || status;
  };

  const handleAddHarvest = async (e) => {
    e.preventDefault();
    setSaving(true);

    const selectedBlock = blocks.find(b => b.id === formData.block_id);

    const harvestData = {
      block_id: formData.block_id,
      season: selectedSeason,
      target_pick_date: formData.target_pick_date || null,
      estimated_tons: formData.estimated_tons ? parseFloat(formData.estimated_tons) : null,
      estimated_tons_per_acre: formData.estimated_tons_per_acre ? parseFloat(formData.estimated_tons_per_acre) : null,
      target_brix: formData.target_brix ? parseFloat(formData.target_brix) : null,
      target_ta: formData.target_ta ? parseFloat(formData.target_ta) : null,
      target_ph: formData.target_ph ? parseFloat(formData.target_ph) : null,
      notes: formData.notes || null,
      status: 'planned'
    };

    console.log('Creating harvest tracking:', harvestData);
    const { data, error } = await createHarvestTracking(harvestData);

    if (error) {
      console.error('Error creating harvest:', error);
      alert(`Error creating harvest: ${error.message}`);
    } else {
      console.log('Harvest created successfully:', data);
      setShowAddModal(false);
      setFormData({
        block_id: '',
        target_pick_date: '',
        estimated_tons: '',
        estimated_tons_per_acre: '',
        target_brix: '',
        target_ta: '',
        target_ph: '',
        notes: ''
      });
      await loadHarvestData();
    }

    setSaving(false);
  };

  const handleBlockChange = (blockId) => {
    setFormData({ ...formData, block_id: blockId });

    const block = blocks.find(b => b.id === blockId);
    if (block && block.acres && formData.estimated_tons) {
      const tonsPerAcre = parseFloat(formData.estimated_tons) / parseFloat(block.acres);
      setFormData(prev => ({
        ...prev,
        block_id: blockId,
        estimated_tons_per_acre: tonsPerAcre.toFixed(2)
      }));
    }
  };

  const handleEstimatedTonsChange = (tons) => {
    setFormData({ ...formData, estimated_tons: tons });

    const block = blocks.find(b => b.id === formData.block_id);
    if (block && block.acres && tons) {
      const tonsPerAcre = parseFloat(tons) / parseFloat(block.acres);
      setFormData(prev => ({
        ...prev,
        estimated_tons: tons,
        estimated_tons_per_acre: tonsPerAcre.toFixed(2)
      }));
    }
  };

  const handleStartHarvest = async (harvestId) => {
    if (!confirm('Start this harvest? This will mark it as in progress.')) return;

    const { error } = await startHarvest(harvestId);
    if (error) {
      alert(`Error starting harvest: ${error.message}`);
    } else {
      await loadHarvestData();
    }
  };

  const handleViewHarvest = async (harvestId) => {
    const { data, error } = await getHarvestTracking(harvestId);
    if (error) {
      alert(`Error loading harvest details: ${error.message}`);
    } else if (data) {
      setSelectedHarvest(data);
      setShowViewModal(true);
    }
  };

  const filteredHarvests = harvests.filter(harvest => {
    if (filterStatus !== 'all' && harvest.status !== filterStatus) return false;
    if (filterVariety !== 'all' && harvest.vineyard_blocks?.variety !== filterVariety) return false;
    return true;
  });

  const varieties = [...new Set(blocks.map(b => b.variety).filter(Boolean))];

  const seasons = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vine-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading harvest data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Harvest Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track harvest planning, loads, and yield data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
          >
            {seasons.map(year => (
              <option key={year} value={year}>{year} Season</option>
            ))}
          </select>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-vine-green-500 hover:bg-vine-green-600"
          >
            <Plus className="w-4 h-4" />
            Add Block to Harvest
          </Button>
        </div>
      </div>

      {/* Season Summary */}
      {statistics && (
        <Card className="bg-gradient-to-r from-vine-green-50 to-amber-50 border-vine-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Grape className="w-6 h-6 text-vine-green-600" />
              <h3 className="text-lg font-bold text-gray-900">{selectedSeason} Season Summary</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Blocks Planned</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.planned}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.inProgress}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{statistics.completed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tons</p>
                <p className="text-2xl font-bold text-amber-600">
                  {statistics.totalActualTons.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
        >
          <option value="all">All Statuses</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={filterVariety}
          onChange={(e) => setFilterVariety(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
        >
          <option value="all">All Varieties</option>
          {varieties.map(variety => (
            <option key={variety} value={variety}>{variety}</option>
          ))}
        </select>
      </div>

      {/* Harvest Table */}
      {filteredHarvests.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No harvest records for {selectedSeason}</p>
            <p className="text-sm text-gray-500 mb-4">
              Start planning your harvest by adding blocks to track
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-vine-green-500 hover:bg-vine-green-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Block to Harvest
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Block</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Variety</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Acres</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Est. Tons</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actual Tons</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Yield/Acre</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHarvests.map((harvest) => {
                    const StatusIcon = getStatusIcon(harvest.status);
                    const statusColor = getStatusColor(harvest.status);

                    return (
                      <tr key={harvest.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">
                            {harvest.vineyard_blocks?.name || 'Unknown Block'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">
                            {harvest.vineyard_blocks?.variety || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm text-gray-900">
                            {harvest.vineyard_blocks?.acres?.toFixed(1) || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {harvest.estimated_tons?.toFixed(1) || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <StatusIcon className={`w-4 h-4 text-${statusColor}-600`} />
                            <span className={`text-sm font-medium text-${statusColor}-700`}>
                              {getStatusLabel(harvest.status)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm font-bold text-gray-900">
                            {harvest.actual_tons > 0 ? harvest.actual_tons.toFixed(1) : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm text-gray-900">
                            {harvest.actual_tons_per_acre > 0
                              ? harvest.actual_tons_per_acre.toFixed(2)
                              : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-1">
                            {harvest.status === 'planned' && (
                              <Button
                                size="sm"
                                onClick={() => handleStartHarvest(harvest.id)}
                                className="text-xs bg-blue-600 hover:bg-blue-700"
                              >
                                Start
                              </Button>
                            )}
                            {harvest.status === 'in_progress' && (
                              <Button
                                size="sm"
                                className="text-xs bg-amber-600 hover:bg-amber-700"
                              >
                                Add Load
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewHarvest(harvest.id)}
                              className="text-xs"
                            >
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variety Breakdown */}
      {statistics && Object.keys(statistics.byVariety).length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yield by Variety</h3>
            <div className="space-y-3">
              {Object.entries(statistics.byVariety).map(([variety, data]) => (
                <div key={variety} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{variety}</p>
                    <p className="text-sm text-gray-600">{data.blocks} blocks</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {data.actualTons.toFixed(1)} tons
                    </p>
                    <p className="text-sm text-gray-600">
                      Est: {data.estimatedTons.toFixed(1)} tons
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Harvest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="sticky top-0 bg-gradient-to-r from-vine-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Add Block to Harvest</h2>
                <p className="text-sm text-green-100">{selectedSeason} Season</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleAddHarvest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Block *
                </label>
                <select
                  required
                  value={formData.block_id}
                  onChange={(e) => handleBlockChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                >
                  <option value="">Choose a block...</option>
                  {blocks.map(block => (
                    <option key={block.id} value={block.id}>
                      {block.name} - {block.variety} ({block.acres} acres)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Target Pick Date
                  </label>
                  <Input
                    type="date"
                    value={formData.target_pick_date}
                    onChange={(e) => setFormData({ ...formData, target_pick_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Total Tons
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.estimated_tons}
                    onChange={(e) => handleEstimatedTonsChange(e.target.value)}
                    placeholder="e.g., 45.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Tons/Acre
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.estimated_tons_per_acre}
                    onChange={(e) => setFormData({ ...formData, estimated_tons_per_acre: e.target.value })}
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Target Quality Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Brix
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.target_brix}
                      onChange={(e) => setFormData({ ...formData, target_brix: e.target.value })}
                      placeholder="e.g., 24.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target TA (g/L)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.target_ta}
                      onChange={(e) => setFormData({ ...formData, target_ta: e.target.value })}
                      placeholder="e.g., 6.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target pH
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.target_ph}
                      onChange={(e) => setFormData({ ...formData, target_ph: e.target.value })}
                      placeholder="e.g., 3.45"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                  placeholder="Any additional notes about this harvest plan..."
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-vine-green-500 hover:bg-vine-green-600"
                >
                  {saving ? 'Adding...' : 'Add to Harvest Plan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Harvest Details Modal */}
      {showViewModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-white">Harvest Details</h2>
                <p className="text-sm text-slate-400">
                  {selectedHarvest.vineyard_blocks?.name || 'Unknown Block'} • {selectedHarvest.vineyard_blocks?.variety}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedHarvest(null);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedHarvest.status === 'planned' ? 'bg-gray-100 text-gray-800' :
                  selectedHarvest.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {getStatusLabel(selectedHarvest.status)}
                </span>
                <span className="text-sm text-gray-500">{selectedHarvest.season} Season</span>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-1">Target Pick Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedHarvest.target_pick_date
                        ? new Date(selectedHarvest.target_pick_date).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-1">Estimated Tons</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedHarvest.estimated_tons?.toFixed(1) || '-'} tons
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedHarvest.estimated_tons_per_acre?.toFixed(2) || '-'} tons/acre
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-1">Actual Tons</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedHarvest.actual_tons > 0 ? selectedHarvest.actual_tons.toFixed(1) : '-'} tons
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedHarvest.actual_tons_per_acre > 0
                        ? `${selectedHarvest.actual_tons_per_acre.toFixed(2)} tons/acre`
                        : '-'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-1">Total Bins</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedHarvest.total_bins || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quality Targets */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quality Targets</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Target Brix</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedHarvest.target_brix ? `${selectedHarvest.target_brix}°` : '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Target TA</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedHarvest.target_ta ? `${selectedHarvest.target_ta} g/L` : '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Target pH</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedHarvest.target_ph || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedHarvest.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedHarvest.notes}
                  </p>
                </div>
              )}

              {/* Close Button */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedHarvest(null);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
