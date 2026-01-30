import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  X,
  Pause,
  Edit2,
  Save,
  Eye
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { DocLink } from '@/shared/components/DocLink';
import { LoadingSpinner } from './LoadingSpinner';
import { Input } from '@/shared/components/ui/input';
import { sortByName } from '@/shared/lib/sortUtils';
import { useToast } from '@/shared/components/Toast';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/shared/components/ui/dropdown-menu';
import {
  listHarvestTracking,
  listVineyardBlocks,
  getHarvestStatistics,
  createHarvestTracking,
  startHarvest,
  getHarvestTracking,
  createHarvestLoad,
  listHarvestLoads,
  updateHarvestTracking
} from '@/shared/lib/vineyardApi';

export function HarvestTracking() {
  const { user } = useAuth();
  const toast = useToast();
  const currentYear = new Date().getFullYear();
  const [selectedSeason, setSelectedSeason] = useState(currentYear);
  const [harvests, setHarvests] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVariety, setFilterVariety] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddLoadModal, setShowAddLoadModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showEditCompletionModal, setShowEditCompletionModal] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState(null);
  const [selectedHarvestForLoad, setSelectedHarvestForLoad] = useState(null);
  const [editingHarvest, setEditingHarvest] = useState(null);
  const [harvestToComplete, setHarvestToComplete] = useState(null);
  const [editingCompletionHarvest, setEditingCompletionHarvest] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [completionData, setCompletionData] = useState({
    actual_tons: '',
    actual_pick_date: new Date().toISOString().split('T')[0],
    avg_brix: '',
    avg_ph: '',
    avg_ta: '',
    notes: ''
  });
  const [loadFormData, setLoadFormData] = useState({
    tons: '',
    bin_count: '',
    brix: '',
    ph: '',
    ta: '',
    picked_at: new Date().toISOString().slice(0, 16),
    notes: ''
  });
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

  const handleStartHarvest = (harvest) => {
    setConfirmAction({
      type: 'start',
      harvest,
      title: 'Start Harvest',
      message: `Start harvesting ${harvest.vineyard_blocks?.name}? This will mark the harvest as in progress.`,
      confirmText: 'Start Harvest',
      variant: 'info'
    });
  };

  const handlePauseHarvest = (harvest) => {
    setConfirmAction({
      type: 'pause',
      harvest,
      title: 'Pause Harvest',
      message: `Pause harvesting ${harvest.vineyard_blocks?.name}? You can resume later.`,
      confirmText: 'Pause',
      variant: 'warning'
    });
  };

  const handleStartCompleteHarvest = (harvest) => {
    setConfirmAction({
      type: 'complete',
      harvest,
      title: 'Complete Harvest',
      message: `Mark ${harvest.vineyard_blocks?.name} harvest as completed?`,
      confirmText: 'Complete',
      variant: 'info'
    });
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    const { type, harvest } = confirmAction;

    try {
      let error;

      if (type === 'start') {
        ({ error } = await startHarvest(harvest.id));
      } else if (type === 'pause') {
        ({ error } = await updateHarvestTracking(harvest.id, { status: 'planned' }));
      } else if (type === 'complete') {
        // Instead of completing immediately, show the completion form
        setHarvestToComplete(harvest);
        setCompletionData({
          actual_tons: harvest.estimated_tons || '',
          actual_pick_date: new Date().toISOString().split('T')[0],
          avg_brix: harvest.target_brix || '',
          avg_ph: harvest.target_ph || '',
          avg_ta: harvest.target_ta || '',
          notes: ''
        });
        setShowCompleteModal(true);
        setConfirmAction(null);
        return; // Don't proceed with immediate completion
      }

      if (error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.success(`Harvest ${type}ed successfully`);
        await loadHarvestData();
      }
    } catch (err) {
      toast.error(`Failed to ${type} harvest`);
    }

    setConfirmAction(null);
  };

  // Handle harvest completion with actual harvest data
  const handleCompleteHarvest = async () => {
    if (!harvestToComplete) return;

    setSaving(true);
    try {
      const { error } = await updateHarvestTracking(harvestToComplete.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        actual_pick_date: completionData.actual_pick_date,
        actual_tons: parseFloat(completionData.actual_tons) || 0,
        avg_brix: parseFloat(completionData.avg_brix) || null,
        avg_ph: parseFloat(completionData.avg_ph) || null,
        avg_ta: parseFloat(completionData.avg_ta) || null,
        completion_notes: completionData.notes
      });

      if (error) {
        toast.error(`Error completing harvest: ${error.message}`);
      } else {
        toast.success('Harvest completed successfully with actual data');
        setShowCompleteModal(false);
        setHarvestToComplete(null);
        await loadHarvestData();
      }
    } catch (err) {
      toast.error('Failed to complete harvest');
    } finally {
      setSaving(false);
    }
  };

  const handleEditHarvest = async (harvest) => {
    setEditingHarvest({
      id: harvest.id,
      block_id: harvest.block_id,
      target_pick_date: harvest.target_pick_date || '',
      estimated_tons: harvest.estimated_tons || '',
      estimated_tons_per_acre: harvest.estimated_tons_per_acre || '',
      target_brix: harvest.target_brix || '',
      target_ta: harvest.target_ta || '',
      target_ph: harvest.target_ph || '',
      notes: harvest.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await updateHarvestTracking(editingHarvest.id, {
      target_pick_date: editingHarvest.target_pick_date || null,
      estimated_tons: parseFloat(editingHarvest.estimated_tons) || null,
      estimated_tons_per_acre: parseFloat(editingHarvest.estimated_tons_per_acre) || null,
      target_brix: parseFloat(editingHarvest.target_brix) || null,
      target_ta: parseFloat(editingHarvest.target_ta) || null,
      target_ph: parseFloat(editingHarvest.target_ph) || null,
      notes: editingHarvest.notes
    });

    if (error) {
      toast.error(`Error updating harvest: ${error.message}`);
    } else {
      toast.success('Harvest plan updated successfully');
      setShowEditModal(false);
      setEditingHarvest(null);
      await loadHarvestData();
    }

    setSaving(false);
  };

  const handleEditCompletion = (harvest) => {
    setEditingCompletionHarvest(harvest);
    setCompletionData({
      actual_tons: harvest.actual_tons || '',
      actual_pick_date: harvest.actual_pick_date || new Date().toISOString().split('T')[0],
      avg_brix: harvest.avg_brix || '',
      avg_ph: harvest.avg_ph || '',
      avg_ta: harvest.avg_ta || '',
      notes: harvest.completion_notes || ''
    });
    setShowEditCompletionModal(true);
  };

  const handleSaveCompletionEdit = async () => {
    if (!editingCompletionHarvest) return;

    setSaving(true);
    try {
      const { error } = await updateHarvestTracking(editingCompletionHarvest.id, {
        actual_pick_date: completionData.actual_pick_date,
        actual_tons: parseFloat(completionData.actual_tons) || 0,
        avg_brix: parseFloat(completionData.avg_brix) || null,
        avg_ph: parseFloat(completionData.avg_ph) || null,
        avg_ta: parseFloat(completionData.avg_ta) || null,
        completion_notes: completionData.notes
      });

      if (error) {
        toast.error(`Error updating harvest data: ${error.message}`);
      } else {
        toast.success('Harvest data updated successfully');
        setShowEditCompletionModal(false);
        setEditingCompletionHarvest(null);
        await loadHarvestData();
      }
    } catch (err) {
      toast.error('Failed to update harvest data');
    } finally {
      setSaving(false);
    }
  };

  const handleViewHarvest = async (harvestId) => {
    const { data, error } = await getHarvestTracking(harvestId);
    if (error) {
      toast.error(`Error loading harvest details: ${error.message}`);
    } else if (data) {
      setSelectedHarvest(data);
      setShowViewModal(true);
    }
  };

  const handleOpenAddLoad = (harvest) => {
    setSelectedHarvestForLoad(harvest);
    setLoadFormData({
      tons: '',
      bin_count: '',
      brix: '',
      ph: '',
      ta: '',
      picked_at: new Date().toISOString().slice(0, 16),
      notes: ''
    });
    setShowAddLoadModal(true);
  };

  const handleAddLoad = async (e) => {
    e.preventDefault();

    if (!selectedHarvestForLoad) return;

    setSaving(true);

    // Convert tons to pounds (tons * 2000 = gross_weight_lbs)
    const tonsValue = parseFloat(loadFormData.tons) || 0;
    const grossWeightLbs = tonsValue * 2000;

    const { error } = await createHarvestLoad({
      harvest_id: selectedHarvestForLoad.id,
      gross_weight_lbs: grossWeightLbs,
      tare_weight_lbs: 0, // Default to 0, tons will be auto-calculated
      bin_count: parseInt(loadFormData.bin_count) || 0,
      brix: parseFloat(loadFormData.brix) || null,
      ph: parseFloat(loadFormData.ph) || null,
      ta: parseFloat(loadFormData.ta) || null,
      picked_at: loadFormData.picked_at,
      notes: loadFormData.notes
    });

    if (error) {
      toast.error(`Error adding load: ${error.message}`);
    } else {
      toast.success('Harvest load added successfully');
      setShowAddLoadModal(false);
      await loadHarvestData();
    }

    setSaving(false);
  };

  const filteredHarvests = harvests.filter(harvest => {
    if (filterStatus !== 'all' && harvest.status !== filterStatus) return false;
    if (filterVariety !== 'all' && harvest.vineyard_blocks?.variety !== filterVariety) return false;
    return true;
  });

  const varieties = [...new Set(blocks.map(b => b.variety).filter(Boolean))];

  const seasons = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return <LoadingSpinner message="Loading harvest data..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 sm:pt-4 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Harvest Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
            Track harvest planning, loads, and yield data. <DocLink docId="operations/harvest" />
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
            className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
          >
            {seasons.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 sm:gap-2 bg-vine-green-500 hover:bg-vine-green-600 text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Add Block to Harvest</span>
            <span className="sm:hidden">Add Block</span>
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
                        <td className="py-4 px-4 relative">
                          <div className="flex items-center justify-end">
                            <DropdownMenu
                              trigger={
                                <DropdownMenuTrigger className="hover:bg-gray-100">
                                  <ChevronDown className="w-5 h-5 text-gray-600" />
                                </DropdownMenuTrigger>
                              }
                            >
                              {/* View Details - always available */}
                              <DropdownMenuItem
                                icon={Eye}
                                onClick={() => handleViewHarvest(harvest.id)}
                              >
                                View Details
                              </DropdownMenuItem>

                              {/* Edit - always available */}
                              <DropdownMenuItem
                                icon={Edit2}
                                onClick={() => handleEditHarvest(harvest)}
                              >
                                Edit Plan
                              </DropdownMenuItem>

                              {/* Edit Actual Data - only for completed harvests */}
                              {harvest.status === 'completed' && (
                                <DropdownMenuItem
                                  icon={Edit2}
                                  onClick={() => handleEditCompletion(harvest)}
                                  variant="primary"
                                >
                                  Edit Actual Data
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {/* Status-specific actions */}
                              {harvest.status === 'planned' && (
                                <DropdownMenuItem
                                  icon={Play}
                                  onClick={() => handleStartHarvest(harvest)}
                                  variant="primary"
                                >
                                  Start Harvest
                                </DropdownMenuItem>
                              )}

                              {harvest.status === 'in_progress' && (
                                <>
                                  <DropdownMenuItem
                                    icon={Plus}
                                    onClick={() => handleOpenAddLoad(harvest)}
                                    variant="warning"
                                  >
                                    Add Load
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    icon={CheckCircle2}
                                    onClick={() => handleStartCompleteHarvest(harvest)}
                                    variant="info"
                                  >
                                    Complete Harvest
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    icon={Pause}
                                    onClick={() => handlePauseHarvest(harvest)}
                                    variant="warning"
                                  >
                                    Pause Harvest
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenu>
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
                  {sortByName(blocks).map(block => (
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

      {/* Add Load Modal */}
      {showAddLoadModal && selectedHarvestForLoad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-white">Add Harvest Load</h2>
                <p className="text-sm text-slate-400">
                  {selectedHarvestForLoad.vineyard_blocks?.name || 'Unknown Block'} • {selectedHarvestForLoad.vineyard_blocks?.variety}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddLoadModal(false);
                  setSelectedHarvestForLoad(null);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleAddLoad} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tons Harvested *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={loadFormData.tons}
                    onChange={(e) => setLoadFormData({ ...loadFormData, tons: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bin Count
                  </label>
                  <input
                    type="number"
                    value={loadFormData.bin_count}
                    onChange={(e) => setLoadFormData({ ...loadFormData, bin_count: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brix
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={loadFormData.brix}
                    onChange={(e) => setLoadFormData({ ...loadFormData, brix: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    pH
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loadFormData.ph}
                    onChange={(e) => setLoadFormData({ ...loadFormData, ph: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TA (g/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={loadFormData.ta}
                    onChange={(e) => setLoadFormData({ ...loadFormData, ta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pick Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={loadFormData.picked_at}
                  onChange={(e) => setLoadFormData({ ...loadFormData, picked_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={loadFormData.notes}
                  onChange={(e) => setLoadFormData({ ...loadFormData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                  placeholder="Any notes about this load..."
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-700 flex items-center justify-center"
                >
                  {saving ? 'Adding...' : 'Add Load'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddLoadModal(false);
                    setSelectedHarvestForLoad(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Harvest Modal */}
      {showEditModal && editingHarvest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5" />
                  Edit Harvest Plan
                </h2>
                <p className="text-sm text-slate-400">
                  Update harvest targets and quality metrics
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingHarvest(null);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Pick Date
                </label>
                <input
                  type="date"
                  value={editingHarvest.target_pick_date}
                  onChange={(e) => setEditingHarvest({ ...editingHarvest, target_pick_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Tons
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingHarvest.estimated_tons}
                    onChange={(e) => setEditingHarvest({ ...editingHarvest, estimated_tons: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tons per Acre
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingHarvest.estimated_tons_per_acre}
                    onChange={(e) => setEditingHarvest({ ...editingHarvest, estimated_tons_per_acre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Brix
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingHarvest.target_brix}
                    onChange={(e) => setEditingHarvest({ ...editingHarvest, target_brix: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target pH
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingHarvest.target_ph}
                    onChange={(e) => setEditingHarvest({ ...editingHarvest, target_ph: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target TA (g/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingHarvest.target_ta}
                    onChange={(e) => setEditingHarvest({ ...editingHarvest, target_ta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editingHarvest.notes}
                  onChange={(e) => setEditingHarvest({ ...editingHarvest, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                  placeholder="Any notes about this harvest plan..."
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-vine-green-500 hover:bg-vine-green-600 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingHarvest(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Harvest Modal */}
      {showCompleteModal && harvestToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Complete Harvest</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {harvestToComplete.vineyard_blocks?.name} - {harvestToComplete.vineyard_blocks?.variety}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setHarvestToComplete(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                Enter the actual harvest data collected in the field. This data will be used when importing to the Production module.
              </p>

              <div className="space-y-4">
                {/* Actual Tons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Tons Harvested *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={completionData.actual_tons}
                    onChange={(e) => setCompletionData({...completionData, actual_tons: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vine-green-500 focus:border-transparent"
                    placeholder="e.g., 12.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated: {harvestToComplete.estimated_tons || 'N/A'} tons
                  </p>
                </div>

                {/* Actual Pick Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Pick Date *
                  </label>
                  <input
                    type="date"
                    value={completionData.actual_pick_date}
                    onChange={(e) => setCompletionData({...completionData, actual_pick_date: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vine-green-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Average Brix */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Average Brix
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={completionData.avg_brix}
                      onChange={(e) => setCompletionData({...completionData, avg_brix: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vine-green-500 focus:border-transparent"
                      placeholder="e.g., 24.5"
                    />
                  </div>

                  {/* Average pH */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Average pH
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={completionData.avg_ph}
                      onChange={(e) => setCompletionData({...completionData, avg_ph: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vine-green-500 focus:border-transparent"
                      placeholder="e.g., 3.45"
                    />
                  </div>

                  {/* Average TA */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Average TA (g/L)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={completionData.avg_ta}
                      onChange={(e) => setCompletionData({...completionData, avg_ta: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vine-green-500 focus:border-transparent"
                      placeholder="e.g., 6.5"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Completion Notes
                  </label>
                  <textarea
                    value={completionData.notes}
                    onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vine-green-500 focus:border-transparent"
                    placeholder="Weather conditions, crew notes, quality observations..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={handleCompleteHarvest}
                  disabled={saving || !completionData.actual_tons}
                  className="flex-1 px-6 py-3 bg-vine-green-500 text-white rounded-lg hover:bg-vine-green-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Complete Harvest
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setHarvestToComplete(null);
                  }}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Completion Data Modal */}
      {showEditCompletionModal && editingCompletionHarvest && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700 rounded-t-2xl flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5" />
                  Edit Actual Data
                </h2>
                <p className="text-sm text-slate-400">
                  Update actual harvest data and quality metrics
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditCompletionModal(false);
                  setEditingCompletionHarvest(null);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-white rounded-b-2xl">
              <div className="p-6 space-y-4">
              {/* Actual Pick Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Pick Date
                </label>
                <input
                  type="date"
                  value={completionData.actual_pick_date}
                  onChange={(e) => setCompletionData({...completionData, actual_pick_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                />
              </div>

              {/* Actual Tons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Tons
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={completionData.actual_tons}
                  onChange={(e) => setCompletionData({...completionData, actual_tons: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Average Brix */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Brix
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={completionData.avg_brix}
                    onChange={(e) => setCompletionData({...completionData, avg_brix: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0.0"
                  />
                </div>

                {/* Average pH */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual pH
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={completionData.avg_ph}
                    onChange={(e) => setCompletionData({...completionData, avg_ph: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Average TA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual TA (g/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={completionData.avg_ta}
                    onChange={(e) => setCompletionData({...completionData, avg_ta: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                    placeholder="0.0"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={completionData.notes}
                  onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                  placeholder="Any notes about this harvest data..."
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={handleSaveCompletionEdit}
                  disabled={saving}
                  className="bg-vine-green-500 hover:bg-vine-green-600 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditCompletionModal(false);
                    setEditingCompletionHarvest(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText || 'Confirm'}
        variant={confirmAction?.variant || 'info'}
      />
    </div>
  );
}
