import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, Grape, AlertCircle, Check, Download, Calendar, Container, X, ChevronRight, ChevronDown } from 'lucide-react';
import { listLots, createLot, updateLot, deleteLot, updateContainer, logLotAssignment } from '@/shared/lib/productionApi';
import { listVineyardBlocks, listHarvestTracking, getHarvestTracking } from '@/shared/lib/vineyardApi';
import { getAvailableContainers } from '@/shared/lib/productionApi';
import { supabase } from '@/shared/lib/supabaseClient';
import { sortByName } from '@/shared/lib/sortUtils';
import { WINE_TYPE_LABELS, determineTTBTaxClass } from '@/shared/lib/ttbUtils';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DocLink } from '@/shared/components/DocLink';

export const HarvestIntake = () => {
  const [lots, setLots] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [availableHarvests, setAvailableHarvests] = useState([]);
  const [selectedHarvests, setSelectedHarvests] = useState([]);
  const [showCrushModal, setShowCrushModal] = useState(false);
  const [crushingLot, setCrushingLot] = useState(null);
  const [crushData, setCrushData] = useState({
    crush_date: new Date().toISOString().slice(0, 16),
    crushed_weight_lbs: '',
    processing_style: 'red',
    destem_mode: 'fully_destemmed',
    whole_cluster_percent: '',
    stem_loss_lbs: '',
    receiving_container_id: null
  });

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'warning'
  });

  // Collapsed parent lots state
  const [collapsedParents, setCollapsedParents] = useState(new Set());

  // Collapsed fields state
  const [collapsedFields, setCollapsedFields] = useState(new Set());

  const [formData, setFormData] = useState({
    name: '',
    vintage: new Date().getFullYear(),
    varietal: '',
    appellation: '',
    wine_type: 'still',
    block_id: null,
    harvest_date: new Date().toISOString().split('T')[0],
    pick_start_time: '',
    pick_end_time: '',
    arrival_time: '',
    initial_weight_lbs: '',
    initial_brix: '',
    initial_ph: '',
    initial_ta: '',
    mog_percent: '',
    rot_percent: '',
    mildew_percent: '',
    sunburn_percent: '',
    sorting: 'none',
    container_id: null,
    status: 'crushing',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotsData, blocksData, containersData] = await Promise.all([
        listLots({ status: 'harvested,crushing,fermenting' }),
        listVineyardBlocks(),
        getAvailableContainers()
      ]);

      if (lotsData.error) throw lotsData.error;
      if (blocksData.error) throw blocksData.error;

      // Sort lots to show parent lots with their children grouped together
      const allLots = lotsData.data || [];
      const parentLots = allLots.filter(lot => !lot.parent_lot_id);
      const childLots = allLots.filter(lot => lot.parent_lot_id);

      // Build organized list: parent followed by its children
      const organizedLots = [];
      parentLots.forEach(parent => {
        organizedLots.push(parent);
        const children = childLots.filter(child => child.parent_lot_id === parent.id);
        organizedLots.push(...children);
      });

      // Add any orphaned children at the end
      const orphanedChildren = childLots.filter(child =>
        !parentLots.some(parent => parent.id === child.parent_lot_id)
      );
      organizedLots.push(...orphanedChildren);

      setLots(organizedLots);
      setBlocks(blocksData.data || []);
      setContainers(containersData.data || []);

      // Keep all lots expanded by default (users can manually collapse if needed)
      // This ensures all lots are visible on initial load
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Calculate initial volume (rough estimate: 1 ton ≈ 160 gallons)
      const weightTons = parseFloat(formData.initial_weight_lbs) / 2000;
      const estimatedVolume = weightTons * 160;

      // Clean data: convert empty strings to null for timestamps, numbers, and UUIDs
      // Calculate TTB tax class based on wine type (alcohol not yet known at harvest)
      const taxClass = determineTTBTaxClass(null, formData.wine_type);

      const lotData = {
        ...formData,
        pick_start_time: formData.pick_start_time || null,
        pick_end_time: formData.pick_end_time || null,
        arrival_time: formData.arrival_time || null,
        initial_weight_lbs: formData.initial_weight_lbs || null,
        initial_brix: formData.initial_brix || null,
        initial_ph: formData.initial_ph || null,
        initial_ta: formData.initial_ta || null,
        mog_percent: formData.mog_percent || null,
        rot_percent: formData.rot_percent || null,
        mildew_percent: formData.mildew_percent || null,
        sunburn_percent: formData.sunburn_percent || null,
        block_id: formData.block_id || null,
        container_id: formData.container_id || null,
        current_volume_gallons: estimatedVolume,
        current_brix: formData.initial_brix || null,
        current_ph: formData.initial_ph || null,
        current_ta: formData.initial_ta || null,
        wine_type: formData.wine_type,
        ttb_tax_class: taxClass
      };

      let savedLotId = editingLot?.id;

      if (editingLot) {
        const { error: updateError } = await updateLot(editingLot.id, lotData);
        if (updateError) throw updateError;
        setSuccess('Lot updated successfully');
      } else {
        const { data: newLot, error: createError } = await createLot(lotData);
        if (createError) throw createError;
        savedLotId = newLot?.id;
        setSuccess('Lot created successfully');
      }

      // Update container status to "in_use" if a container was assigned
      if (formData.container_id && savedLotId) {
        const { error: containerError } = await updateContainer(formData.container_id, {
          status: 'in_use'
        });
        if (containerError) {
          console.error('Error updating container status:', containerError);
          // Don't throw - this is non-critical, lot was still created/updated successfully
        }

        // Log vessel history event
        try {
          await logLotAssignment(formData.container_id, savedLotId, estimatedVolume);
        } catch (historyError) {
          console.error('Error logging vessel history:', historyError);
          // Don't throw - this is non-critical
        }
      }

      resetForm();
      loadData();
    } catch (err) {
      console.error('Error saving lot:', err);
      setError(err.message);
    }
  };

  const handleEdit = (lot) => {
    // If already editing this lot, close the form
    if (editingLot?.id === lot.id) {
      resetForm();
      return;
    }

    setEditingLot(lot);
    setShowForm(false); // Close the "New Harvest" form if open
    setFormData({
      name: lot.name,
      vintage: lot.vintage,
      varietal: lot.varietal,
      appellation: lot.appellation || '',
      wine_type: lot.wine_type || 'still',
      block_id: lot.block_id,
      harvest_date: lot.harvest_date || new Date().toISOString().split('T')[0],
      pick_start_time: lot.pick_start_time ? new Date(lot.pick_start_time).toISOString().slice(0, 16) : '',
      pick_end_time: lot.pick_end_time ? new Date(lot.pick_end_time).toISOString().slice(0, 16) : '',
      arrival_time: lot.arrival_time ? new Date(lot.arrival_time).toISOString().slice(0, 16) : '',
      initial_weight_lbs: lot.initial_weight_lbs || '',
      initial_brix: lot.initial_brix || '',
      initial_ph: lot.initial_ph || '',
      initial_ta: lot.initial_ta || '',
      mog_percent: lot.mog_percent || '',
      rot_percent: lot.rot_percent || '',
      mildew_percent: lot.mildew_percent || '',
      sunburn_percent: lot.sunburn_percent || '',
      sorting: lot.sorting || 'none',
      container_id: lot.container_id,
      status: lot.status,
      notes: lot.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (lotId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Lot',
      message: 'Are you sure you want to delete this lot? This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error: deleteError } = await deleteLot(lotId);
          if (deleteError) throw deleteError;
          setSuccess('Lot deleted successfully');
          loadData();
        } catch (err) {
          console.error('Error deleting lot:', err);
          setError(err.message);
        }
      }
    });
  };

  const handleOpenCrushModal = (lot) => {
    setCrushingLot(lot);

    // Detect processing style from varietal
    const varietal = (lot.varietal || '').toLowerCase();
    let processingStyle = 'red';
    if (varietal.includes('chardonnay') || varietal.includes('sauvignon') || varietal.includes('riesling') || varietal.includes('pinot gris') || varietal.includes('pinot grigio')) {
      processingStyle = 'white';
    }

    setCrushData({
      crush_date: new Date().toISOString().slice(0, 16),
      crushed_weight_lbs: lot.initial_weight_lbs || '',
      processing_style: processingStyle,
      destem_mode: 'fully_destemmed',
      whole_cluster_percent: '',
      stem_loss_lbs: '',
      receiving_container_id: lot.container_id || null
    });
    setShowCrushModal(true);
  };

  // Removed old handleStartFermentation - users should use Fermentation Tracker
  // to properly start fermentation with vessel selection, SO2, yeast, etc.

  const handleCrushSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Calculate stem loss
      const initialWeight = parseFloat(crushingLot.initial_weight_lbs || 0);
      const crushedWeight = parseFloat(crushData.crushed_weight_lbs || initialWeight);
      const stemLoss = initialWeight - crushedWeight;
      const stemLossPercent = initialWeight > 0 ? (stemLoss / initialWeight) * 100 : 0;

      // Calculate estimated volume (tons * ~160 gal/ton, adjust for white vs red)
      const tons = crushedWeight / 2000;
      const conversionFactor = crushData.processing_style === 'white' ? 150 : 160; // whites typically yield less
      const estimatedVolume = tons * conversionFactor;

      // Build structured crush notes
      const crushNotes = `--- CRUSH RECORD ---
Date: ${new Date(crushData.crush_date).toLocaleString()}
Processing: ${crushData.processing_style.toUpperCase()} wine
Destem Mode: ${crushData.destem_mode.replace('_', ' ')}${crushData.whole_cluster_percent ? `\nWhole Cluster: ${crushData.whole_cluster_percent}%` : ''}
Harvest Weight: ${initialWeight.toLocaleString()} lbs
Crushed Weight: ${crushedWeight.toLocaleString()} lbs
Stem Loss: ${stemLoss.toFixed(1)} lbs (${stemLossPercent.toFixed(1)}%)
Estimated Volume: ${estimatedVolume.toFixed(0)} gallons${crushData.receiving_container_id ? `\nVessel: Assigned` : ''}`;

      const updates = {
        status: 'crushing',
        crush_date: crushData.crush_date,
        crushed_weight_lbs: crushedWeight,
        stem_loss_lbs: stemLoss,
        stem_loss_percent: stemLossPercent,
        processing_style: crushData.processing_style,
        destem_mode: crushData.destem_mode,
        whole_cluster_percent: crushData.whole_cluster_percent ? parseFloat(crushData.whole_cluster_percent) : null,
        current_volume_gallons: estimatedVolume,
        container_id: crushData.receiving_container_id || null,
        notes: crushingLot.notes ? `${crushingLot.notes}\n\n${crushNotes}` : crushNotes
      };

      const { error: updateError } = await updateLot(crushingLot.id, updates);
      if (updateError) throw updateError;

      // Update container status to "in_use" if a container was assigned
      if (crushData.receiving_container_id) {
        const { error: containerError } = await updateContainer(crushData.receiving_container_id, {
          status: 'in_use'
        });
        if (containerError) {
          console.error('Error updating container status:', containerError);
          // Don't throw - this is non-critical, lot was still updated successfully
        }

        // Log vessel history event
        try {
          await logLotAssignment(crushData.receiving_container_id, crushingLot.id, estimatedVolume);
        } catch (historyError) {
          console.error('Error logging vessel history:', historyError);
          // Don't throw - this is non-critical
        }
      }

      setSuccess('Crush recorded successfully');
      setShowCrushModal(false);
      setCrushingLot(null);
      loadData();
    } catch (err) {
      console.error('Error recording crush:', err);
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      vintage: new Date().getFullYear(),
      varietal: '',
      appellation: '',
      wine_type: 'still',
      block_id: null,
      harvest_date: new Date().toISOString().split('T')[0],
      initial_weight_lbs: '',
      initial_brix: '',
      initial_ph: '',
      initial_ta: '',
      container_id: null,
      status: 'crushing',
      notes: ''
    });
    setEditingLot(null);
    setShowForm(false);
  };

  const toggleParentCollapse = (parentId) => {
    setCollapsedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  const toggleFieldCollapse = (fieldName) => {
    setCollapsedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Prevent manually setting status to "fermenting" - must use Fermentation Tracker
    if (name === 'status' && value === 'fermenting' && formData.status !== 'fermenting') {
      setError('Cannot manually set status to "fermenting". Please use the Fermentation Tracker to properly start fermentation with vessel, SO₂, yeast, and volume selection.');
      return;
    }

    // Warn when changing status away from "fermenting"
    if (name === 'status' && formData.status === 'fermenting' && value !== 'fermenting') {
      setConfirmDialog({
        isOpen: true,
        title: 'Change Fermentation Status?',
        message: 'Changing the status will clear fermentation start date, target duration, yeast strain, and SO₂ data. This action cannot be undone. Are you sure?',
        variant: 'warning',
        onConfirm: () => {
          setFormData(prev => ({ ...prev, [name]: value }));
        }
      });
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Load available harvests from operations
  const loadAvailableHarvests = async () => {
    try {
      const { data: harvests, error: harvestError } = await listHarvestTracking();
      if (harvestError) throw harvestError;

      // Only show completed harvests that haven't been imported yet
      const completedHarvests = (harvests || []).filter(h =>
        h.status === 'completed' && !h.imported_to_production
      );

      setAvailableHarvests(completedHarvests);
      setShowImportModal(true);
    } catch (err) {
      console.error('Error loading harvests:', err);
      setError('Failed to load harvests from operations');
    }
  };

  // Import selected harvests as production lots
  const handleImportHarvests = async () => {
    if (selectedHarvests.length === 0) {
      setError('Please select at least one harvest to import');
      return;
    }

    try {
      setError(null);
      let importedCount = 0;
      const errors = [];

      for (const harvestId of selectedHarvests) {
        const harvest = availableHarvests.find(h => h.id === harvestId);
        if (!harvest) continue;

        const block = harvest.vineyard_blocks || {};

        // Check if lot already exists for this block/vintage combination
        const { data: existingLots } = await supabase
          .from('production_lots')
          .select('id, name')
          .eq('block_id', harvest.block_id)
          .eq('vintage', harvest.season || new Date().getFullYear())
          .is('archived_at', null);

        if (existingLots && existingLots.length > 0) {
          errors.push(`${block.name || 'Unknown'}: Already imported (lot: ${existingLots[0].name})`);
          continue;
        }

        // Create production lot from harvest data
        const lotData = {
          name: `${harvest.season || new Date().getFullYear()} ${block.variety || 'Unknown'} ${block.name || ''}`.trim(),
          vintage: harvest.season || new Date().getFullYear(),
          varietal: block.variety || 'Unknown',
          appellation: block.appellation || '',
          block_id: harvest.block_id,
          harvest_date: harvest.actual_pick_date || harvest.target_pick_date || new Date().toISOString().split('T')[0],
          initial_weight_lbs: (parseFloat(harvest.actual_tons) || 0) * 2000,
          initial_brix: harvest.avg_brix || null,
          initial_ph: harvest.avg_ph || null,
          initial_ta: harvest.avg_ta || null,
          status: 'crushing',
          notes: harvest.completion_notes || `Imported from operations. Original harvest ID: ${harvest.id}`,
          current_volume_gallons: ((parseFloat(harvest.actual_tons) || 0) * 2000) / 2000 * 160, // Rough estimate
          current_brix: harvest.avg_brix || null,
          current_ph: harvest.avg_ph || null,
          current_ta: harvest.avg_ta || null
        };

        const { error: createError } = await createLot(lotData);
        if (createError) {
          console.error('Error importing harvest:', harvest.id, createError);
          errors.push(`${block.name || 'Unknown'}: ${createError.message}`);
          continue;
        }

        // Mark harvest as imported
        const { error: updateError } = await supabase
          .from('harvest_tracking')
          .update({ imported_to_production: true })
          .eq('id', harvestId);

        if (updateError) {
          console.error('Error marking harvest as imported:', updateError);
          // Don't fail the import if we can't mark it - the lot was created successfully
        }

        importedCount++;
      }

      if (errors.length > 0) {
        setError(`Imported ${importedCount} lot(s) with ${errors.length} error(s): ${errors.join('; ')}`);
      } else {
        setSuccess(`Successfully imported ${importedCount} harvest(s) as production lot(s)`);
      }

      setShowImportModal(false);
      setSelectedHarvests([]);
      loadData();

      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    } catch (err) {
      console.error('Error importing harvests:', err);
      setError('Failed to import harvests: ' + err.message);
    }
  };

  // Toggle harvest selection
  const toggleHarvestSelection = (harvestId) => {
    setSelectedHarvests(prev =>
      prev.includes(harvestId)
        ? prev.filter(id => id !== harvestId)
        : [...prev, harvestId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading harvest data...</div>
      </div>
    );
  }

  // Calculate summary stats
  const totalTons = lots.reduce((sum, lot) => sum + (parseFloat(lot.initial_weight_lbs || 0) / 2000), 0);
  const avgBrix = lots.length > 0
    ? lots.reduce((sum, lot) => sum + parseFloat(lot.initial_brix || 0), 0) / lots.filter(l => l.initial_brix).length
    : 0;
  const harvestedCount = lots.filter(l => l.status === 'harvested').length;
  const crushingCount = lots.filter(l => l.status === 'crushing').length;
  const totalVolume = lots.reduce((sum, lot) => sum + parseFloat(lot.current_volume_gallons || 0), 0);

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Harvest Intake</h1>
          <p className="text-sm text-gray-500 mt-1">Track incoming fruit from vineyard to crush pad. <DocLink docId="production/harvest-intake" /></p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAvailableHarvests}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Import from Operations
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Harvest
          </button>
        </div>
      </div>

      {/* Summary Stats Bar */}
      {lots.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Total Tons</p>
              <p className="text-2xl font-bold text-gray-900">{totalTons.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Avg Brix</p>
              <p className="text-2xl font-bold text-gray-900">{avgBrix > 0 ? avgBrix.toFixed(1) : '—'}°</p>
            </div>
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">Harvested</p>
              <p className="text-2xl font-bold text-amber-900">{harvestedCount}</p>
              <p className="text-xs text-amber-700">Awaiting crush</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Crushing</p>
              <p className="text-2xl font-bold text-gray-900">{crushingCount}</p>
              <p className="text-xs text-gray-700">Ready to ferment</p>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Total Volume</p>
              <p className="text-2xl font-bold text-blue-900">{Math.round(totalVolume)} gal</p>
              <p className="text-xs text-blue-700">Estimated must</p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Harvest Intake Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingLot ? 'Edit Lot' : 'New Harvest Intake'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lot Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lot Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 2024 Pinot Block 3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Vintage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vintage *
                </label>
                <input
                  type="number"
                  name="vintage"
                  value={formData.vintage}
                  onChange={handleChange}
                  required
                  min="2000"
                  max="2100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Varietal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Varietal *
                </label>
                <input
                  type="text"
                  name="varietal"
                  value={formData.varietal}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Pinot Noir"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Appellation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appellation
                </label>
                <input
                  type="text"
                  name="appellation"
                  value={formData.appellation}
                  onChange={handleChange}
                  placeholder="e.g., Willamette Valley"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Wine Type - TTB Classification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wine Type (TTB)
                </label>
                <select
                  name="wine_type"
                  value={formData.wine_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  {Object.entries(WINE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Used for TTB tax class determination</p>
              </div>

              {/* Block */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vineyard Block
                </label>
                <select
                  name="block_id"
                  value={formData.block_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="">None</option>
                  {sortByName(blocks).map(block => (
                    <option key={block.id} value={block.id}>
                      {block.name} - {block.varietal}
                    </option>
                  ))}
                </select>
              </div>

              {/* Harvest Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harvest Date *
                </label>
                <input
                  type="date"
                  name="harvest_date"
                  value={formData.harvest_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Pick Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pick Start Time
                </label>
                <input
                  type="datetime-local"
                  name="pick_start_time"
                  value={formData.pick_start_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Pick End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pick End Time
                </label>
                <input
                  type="datetime-local"
                  name="pick_end_time"
                  value={formData.pick_end_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Arrival Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arrival at Crush Pad
                </label>
                <input
                  type="datetime-local"
                  name="arrival_time"
                  value={formData.arrival_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (lbs) *
                </label>
                <input
                  type="number"
                  name="initial_weight_lbs"
                  value={formData.initial_weight_lbs}
                  onChange={handleChange}
                  required
                  step="0.1"
                  placeholder="e.g., 4000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Brix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brix
                </label>
                <input
                  type="number"
                  name="initial_brix"
                  value={formData.initial_brix}
                  onChange={handleChange}
                  step="0.1"
                  placeholder="e.g., 24.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* pH */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  pH
                </label>
                <input
                  type="number"
                  name="initial_ph"
                  value={formData.initial_ph}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="e.g., 3.45"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* TA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TA (g/L)
                </label>
                <input
                  type="number"
                  name="initial_ta"
                  value={formData.initial_ta}
                  onChange={handleChange}
                  step="0.1"
                  placeholder="e.g., 6.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Container */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receiving Container
                </label>
                <select
                  name="container_id"
                  value={formData.container_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="">None</option>
                  {containers.map(container => (
                    <option key={container.id} value={container.id}>
                      {container.name} ({container.capacity_gallons} gal {container.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sorting Method
                </label>
                <select
                  name="sorting"
                  value={formData.sorting}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="none">None</option>
                  <option value="hand_sort">Hand Sort</option>
                  <option value="optical_sort">Optical Sort</option>
                  <option value="vibrating_table">Vibrating Table</option>
                </select>
              </div>

              {/* MOG % */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MOG % (Material Other than Grapes)
                </label>
                <input
                  type="number"
                  name="mog_percent"
                  value={formData.mog_percent}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g., 2.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Rot % */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rot %
                </label>
                <input
                  type="number"
                  name="rot_percent"
                  value={formData.rot_percent}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g., 1.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Mildew % */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mildew %
                </label>
                <input
                  type="number"
                  name="mildew_percent"
                  value={formData.mildew_percent}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g., 0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Sunburn % */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sunburn %
                </label>
                <input
                  type="number"
                  name="sunburn_percent"
                  value={formData.sunburn_percent}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g., 1.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="harvested">Harvested</option>
                  <option value="crushing">Crushing</option>
                  {/* Fermenting status can only be set via Fermentation Tracker */}
                  {formData.status === 'fermenting' && (
                    <option value="fermenting">Fermenting (change via Fermentation Tracker)</option>
                  )}
                </select>
                {formData.status !== 'fermenting' && (
                  <p className="text-xs text-gray-500 mt-1">
                    To start fermentation, use the Fermentation Tracker tab
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Optional notes about this harvest..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vine-green-500 focus:border-transparent"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm"
              >
                {editingLot ? 'Update Lot' : 'Create Lot'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Harvest Lots List - Improved Layout */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Harvest Lots</h3>
            <p className="text-sm text-gray-500">{lots.length} lot{lots.length !== 1 ? 's' : ''}</p>
          </div>

          {lots.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Grape className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No harvests recorded yet</p>
              <p className="text-sm text-gray-500">Click "New Harvest" above to add your first intake</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                // Group lots by field/block
                const fieldGroups = {};

                lots.forEach(lot => {
                  const fieldKey = lot.block?.name || 'Unknown Field';
                  if (!fieldGroups[fieldKey]) {
                    fieldGroups[fieldKey] = [];
                  }
                  fieldGroups[fieldKey].push(lot);
                });

                // Render each field group
                return Object.entries(fieldGroups).map(([fieldName, fieldLots]) => {
                  // Get first lot to extract field info (all lots in group share same field)
                  const firstLot = fieldLots[0];
                  const fieldDisplayName = firstLot.vintage && firstLot.varietal
                    ? `${firstLot.vintage} ${firstLot.varietal} ${fieldName}`
                    : fieldName;

                  // Calculate field-level aggregated statistics (only parent lots, not splits)
                  const parentLots = fieldLots.filter(lot => !lot.parent_lot_id);
                  const totalVolume = parentLots.reduce((sum, lot) => sum + parseFloat(lot.current_volume_gallons || 0), 0);
                  const totalWeight = parentLots.reduce((sum, lot) => sum + parseFloat(lot.total_weight_tons || 0), 0);

                  // For Brix and pH, only average lots that have values
                  const lotsWithBrix = parentLots.filter(lot => lot.brix && parseFloat(lot.brix) > 0);
                  const avgBrix = lotsWithBrix.length > 0
                    ? lotsWithBrix.reduce((sum, lot) => sum + parseFloat(lot.brix), 0) / lotsWithBrix.length
                    : 0;

                  const lotsWithPh = parentLots.filter(lot => lot.ph && parseFloat(lot.ph) > 0);
                  const avgPh = lotsWithPh.length > 0
                    ? lotsWithPh.reduce((sum, lot) => sum + parseFloat(lot.ph), 0) / lotsWithPh.length
                    : 0;

                  // Count fermentation status
                  const fermentingCount = fieldLots.filter(lot => lot.status === 'fermenting').length;
                  const fermentingVolume = fieldLots
                    .filter(lot => lot.status === 'fermenting')
                    .reduce((sum, lot) => sum + parseFloat(lot.current_volume_gallons || 0), 0);
                  const needToStartCount = parentLots.filter(lot =>
                    lot.status === 'crushing' && parseFloat(lot.current_volume_gallons || 0) > 0 && !lot.container_id
                  ).length;

                  // Get earliest crushed date
                  const crushedDates = parentLots
                    .filter(lot => lot.crushed_date)
                    .map(lot => new Date(lot.crushed_date))
                    .sort((a, b) => a - b);
                  const earliestCrushed = crushedDates.length > 0 ? crushedDates[0] : null;

                  return (
                    <div key={fieldName} className="mb-6">
                      {/* Field Overview Card - Collapsible */}
                      <div className="border-2 border-slate-300 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 overflow-hidden">
                        {/* Field Header */}
                        <div
                          className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-3 cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-all"
                          onClick={() => toggleFieldCollapse(fieldName)}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg">{fieldDisplayName}</h4>
                            <button className="p-1 hover:bg-white/20 rounded transition-colors">
                              {collapsedFields.has(fieldName) ? (
                                <ChevronRight className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Field Overview Content */}
                        {!collapsedFields.has(fieldName) && (
                          <div className="p-4">
                            {/* Fermentation Status Section */}
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-gray-600 mb-3 uppercase">Fermentation Status</p>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-700">{(() => {
                                  const actualTanks = fieldLots.filter(lot => lot.parent_lot_id).length;
                                  return `${actualTanks} tank${actualTanks !== 1 ? 's' : ''} total`;
                                })()}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {fermentingCount > 0 && (
                                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium text-blue-900 uppercase">Fermenting</span>
                                      <span className="text-lg font-bold text-blue-900">{fermentingCount}</span>
                                    </div>
                                    <div className="text-sm font-semibold text-blue-900">{fermentingCount}/{(() => {
                                      const actualTanks = fieldLots.filter(lot => lot.parent_lot_id).length;
                                      return actualTanks;
                                    })()}</div>
                                    <div className="text-sm text-blue-700 mt-1">{fermentingVolume.toFixed(0)} gal</div>
                                  </div>
                                )}

                                {needToStartCount > 0 ? (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-center">
                                    <div className="text-center">
                                      <span className="text-xs font-medium text-gray-600 uppercase block mb-1">Need to Start</span>
                                      <span className="text-2xl font-bold text-red-600">{needToStartCount}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-center">
                                    <div className="text-center">
                                      <span className="text-xs font-medium text-gray-600 uppercase block mb-1">Need to Start</span>
                                      <div className="flex items-center gap-2 justify-center">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-sm font-semibold text-green-600">All Started!</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-6">
                              {/* Volume */}
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-1 uppercase">Volume</p>
                                <div className="text-2xl font-bold text-gray-900">
                                  {fermentingVolume > 0 ? fermentingVolume.toFixed(0) : '—'}
                                  <span className="text-sm font-normal text-gray-600"> gal</span>
                                </div>
                                {fieldLots.filter(lot => lot.parent_lot_id).length > 0 && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {fieldLots.filter(lot => lot.parent_lot_id).length} split{fieldLots.filter(lot => lot.parent_lot_id).length !== 1 ? 's' : ''}: {totalVolume.toFixed(0)} gal
                                  </div>
                                )}
                              </div>

                              {/* Brix */}
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-1 uppercase">Brix</p>
                                <div className="text-2xl font-bold text-gray-900">
                                  {avgBrix > 0 ? avgBrix.toFixed(1) : '—'}
                                  <span className="text-sm font-normal text-gray-600">°</span>
                                </div>
                              </div>

                              {/* pH */}
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-1 uppercase">pH</p>
                                <div className="text-2xl font-bold text-gray-900">
                                  {avgPh > 0 ? avgPh.toFixed(2) : '—'}
                                </div>
                              </div>

                              {/* Weight */}
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-1 uppercase">Weight</p>
                                <div className="text-2xl font-bold text-gray-900">
                                  {totalWeight > 0 ? totalWeight.toFixed(2) : '—'}
                                  <span className="text-sm font-normal text-gray-600"> tons</span>
                                </div>
                              </div>
                            </div>

                            {/* Crushed Date */}
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-600 mb-1 uppercase">Crushed</p>
                              <div className="text-base font-medium text-gray-900">
                                {earliestCrushed ? new Date(earliestCrushed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Lots in this field */}
                      {!collapsedFields.has(fieldName) && (
                        <div className="mt-3 space-y-3">
                          {fieldLots.map((lot) => {
                            const isChildLot = !!lot.parent_lot_id;

                            // Hide child lots if parent is collapsed
                            if (isChildLot && collapsedParents.has(lot.parent_lot_id)) {
                              return null;
                            }

                            // Calculate child lots early (needed for status and volume calculations)
                            const childrenOfThisLot = lots.filter(l => l.parent_lot_id === lot.id);
                            const hasUnfermentedVolume = !isChildLot && parseFloat(lot.current_volume_gallons || 0) > 0;

                            // Hide parent lots that have been fully split (no remaining volume)
                            // The field overview shows the aggregate, we only show the split child lots
                            if (!isChildLot && childrenOfThisLot.length > 0 && !hasUnfermentedVolume) {
                              return null;
                            }

                            // Determine fermentation status for better UX
                            const getFermentationStatus = () => {
                              // For parent lots with remaining volume that hasn't been allocated to tanks
                              if (hasUnfermentedVolume && lot.status === 'crushing') {
                                return {
                                  label: 'Crushed - Needs Fermentation',
                                  badge: 'bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse',
                                  border: 'border-red-300',
                                  bg: 'bg-gradient-to-br from-red-50 to-orange-50'
                                };
                              } else if (lot.status === 'fermenting') {
                                return {
                                  label: 'Fermenting',
                                  badge: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white',
                                  border: 'border-purple-300',
                                  bg: 'bg-gradient-to-br from-purple-50 to-fuchsia-50'
                                };
                              } else if (lot.status === 'crushing' && lot.container_id) {
                                return {
                                  label: 'Ready to Ferment',
                                  badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
                                  border: 'border-amber-300',
                                  bg: 'bg-gradient-to-br from-amber-50 to-orange-50'
                                };
                              } else if (lot.status === 'crushing') {
                                return {
                                  label: 'Crushing',
                                  badge: 'bg-gray-100 text-gray-700',
                                  border: 'border-gray-200',
                                  bg: 'bg-gray-50'
                                };
                              } else if (lot.status === 'harvested') {
                                return {
                                  label: 'Awaiting Crush',
                                  badge: 'bg-yellow-100 text-yellow-800',
                                  border: 'border-yellow-200',
                                  bg: 'bg-yellow-50'
                                };
                              } else if (lot.status === 'pressed') {
                                return {
                                  label: 'Pressed',
                                  badge: 'bg-blue-100 text-blue-800',
                                  border: 'border-blue-200',
                                  bg: 'bg-blue-50'
                                };
                              }
                              return {
                                label: lot.status,
                                badge: 'bg-gray-100 text-gray-700',
                                border: 'border-gray-200',
                                bg: 'bg-gray-50'
                              };
                            };

                            const statusStyle = getFermentationStatus();

                            // Calculate quality metrics
                            const mogPercent = parseFloat(lot.mog_percent || 0);
                            const rotPercent = parseFloat(lot.rot_percent || 0);
                            const mildewPercent = parseFloat(lot.mildew_percent || 0);
                            const sunburnPercent = parseFloat(lot.sunburn_percent || 0);
                            const totalDefects = mogPercent + rotPercent + mildewPercent + sunburnPercent;

                            // Child volume calculation
                            const childVolume = childrenOfThisLot.reduce((sum, child) => sum + parseFloat(child.current_volume_gallons || 0), 0);

                            return (
                              <div key={lot.id} className={isChildLot ? 'ml-8' : ''}>
                                <div
                                  className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                                    isChildLot
                                  ? 'border-blue-200 bg-blue-50/50'
                                  : `${statusStyle.border} ${statusStyle.bg}`
                              }`}
                            >
                              {/* Header Row */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {/* Collapse/Expand button for parent lots with children */}
                                    {!isChildLot && childrenOfThisLot.length > 0 && (
                                      <button
                                        onClick={() => toggleParentCollapse(lot.id)}
                                        className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-200 rounded transition-colors group"
                                        title={collapsedParents.has(lot.id) ? "Click to expand and show tank allocations" : "Click to collapse tank allocations"}
                                      >
                                        {collapsedParents.has(lot.id) ? (
                                          <>
                                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#7C203A]" />
                                            <span className="text-xs font-medium text-gray-600 group-hover:text-[#7C203A]">
                                              {childrenOfThisLot.length} tank{childrenOfThisLot.length > 1 ? 's' : ''}
                                            </span>
                                          </>
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-[#7C203A]" />
                                        )}
                                      </button>
                                    )}
                                    {isChildLot && <span className="text-blue-600 text-sm">↳</span>}
                                    <h4 className="font-semibold text-gray-900">{lot.name}</h4>
                                    {isChildLot && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                        Split Lot
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <span className="font-medium">{lot.varietal}</span>
                                    <span>•</span>
                                    <span>{lot.vintage}</span>
                                    {lot.block?.name && (
                                      <>
                                        <span>•</span>
                                        <span>{lot.block.name}</span>
                                      </>
                                    )}
                                  </div>

                                  {/* Alert for unfermented volume in parent lot */}
                                  {hasUnfermentedVolume && (
                                    <div className="mt-3 pt-3 border-t border-red-200">
                                      <div className="bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-400 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                          <div className="p-2 bg-red-500 rounded-lg animate-pulse">
                                            <AlertCircle className="w-5 h-5 text-white" />
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-bold text-red-900 text-sm mb-1">Unfermented Volume</p>
                                            <p className="text-sm text-red-800 mb-2">
                                              <span className="font-bold text-2xl">{Math.round(lot.current_volume_gallons)}</span>
                                              <span className="text-base ml-1">gallons still need to be allocated to tanks and fermented</span>
                                            </p>
                                            <p className="text-xs text-red-700 italic">
                                              Go to <strong>Fermentation Tracker</strong> to start fermentation or split this lot into tanks
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Fermentation Status Summary for Parent Lots */}
                                  {!isChildLot && childrenOfThisLot.length > 0 && (() => {
                                    const fermentingChildren = childrenOfThisLot.filter(c => c.status === 'fermenting');
                                    const notStartedChildren = childrenOfThisLot.filter(c => c.status !== 'fermenting');
                                    const totalChildren = childrenOfThisLot.length;

                                    return (
                                      <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Fermentation Status</span>
                                          <span className="text-xs text-gray-600">{totalChildren} tank{totalChildren > 1 ? 's' : ''} total</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                          {/* Fermenting */}
                                          <div className="bg-gradient-to-br from-purple-100 to-fuchsia-100 border-2 border-purple-300 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs font-medium text-purple-700 uppercase">Fermenting</span>
                                              <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-white">{fermentingChildren.length}</span>
                                              </div>
                                            </div>
                                            <p className="text-lg font-bold text-purple-900">
                                              {fermentingChildren.length} / {totalChildren}
                                            </p>
                                            {fermentingChildren.length > 0 && (
                                              <p className="text-xs text-purple-700 mt-1">
                                                {Math.round(fermentingChildren.reduce((sum, c) => sum + parseFloat(c.current_volume_gallons || 0), 0))} gal
                                              </p>
                                            )}
                                          </div>

                                          {/* Not Started */}
                                          <div className={`${
                                            notStartedChildren.length > 0
                                              ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-400'
                                              : 'bg-gray-50 border-2 border-gray-200'
                                          } rounded-lg p-3`}>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className={`text-xs font-medium uppercase ${
                                                notStartedChildren.length > 0 ? 'text-amber-700' : 'text-gray-500'
                                              }`}>
                                                Need to Start
                                              </span>
                                              {notStartedChildren.length > 0 ? (
                                                <div className="w-5 h-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                                                  <span className="text-[10px] font-bold text-white">{notStartedChildren.length}</span>
                                                </div>
                                              ) : (
                                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                  <Check className="w-3 h-3 text-white" />
                                                </div>
                                              )}
                                            </div>
                                            <p className={`text-lg font-bold ${
                                              notStartedChildren.length > 0 ? 'text-amber-900' : 'text-green-700'
                                            }`}>
                                              {notStartedChildren.length > 0 ? `${notStartedChildren.length} / ${totalChildren}` : 'All Started!'}
                                            </p>
                                            {notStartedChildren.length > 0 && (
                                              <p className="text-xs text-amber-700 mt-1">
                                                {Math.round(notStartedChildren.reduce((sum, c) => sum + parseFloat(c.current_volume_gallons || 0), 0))} gal
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`px-3 py-1 ${statusStyle.badge} rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm`}>
                                    {statusStyle.label}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {lot.status === 'harvested' && (
                                      <button
                                        onClick={() => handleOpenCrushModal(lot)}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Record Crush"
                                      >
                                        <Container className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleEdit(lot)}
                                      className="p-2 text-[#7C203A] hover:bg-rose-100 rounded-lg transition-colors"
                                      title="Edit Lot"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(lot.id)}
                                      className="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                                      title="Delete Lot"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Metrics Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-3 border-t border-gray-200">
                                {/* Volume */}
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Volume</p>
                                  <p className={`text-lg font-bold ${isChildLot ? 'text-blue-700' : 'text-gray-900'}`}>
                                    {lot.current_volume_gallons ? `${Math.round(lot.current_volume_gallons)}` : '—'}
                                    <span className="text-xs font-normal text-gray-500 ml-1">gal</span>
                                  </p>
                                  {!isChildLot && childrenOfThisLot.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {childrenOfThisLot.length} split{childrenOfThisLot.length > 1 ? 's' : ''}: {Math.round(childVolume)} gal
                                    </p>
                                  )}
                                </div>

                                {/* Brix */}
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Brix</p>
                                  <p className="text-lg font-bold text-gray-900">
                                    {lot.initial_brix ? `${lot.initial_brix}°` : '—'}
                                  </p>
                                </div>

                                {/* pH */}
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">pH</p>
                                  <p className="text-lg font-bold text-gray-900">
                                    {lot.initial_ph || '—'}
                                  </p>
                                </div>

                                {/* Weight */}
                                {!isChildLot && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Weight</p>
                                    <p className="text-lg font-bold text-gray-900">
                                      {lot.initial_weight_lbs ? `${(lot.initial_weight_lbs / 2000).toFixed(2)}` : '—'}
                                      <span className="text-xs font-normal text-gray-500 ml-1">tons</span>
                                    </p>
                                  </div>
                                )}

                                {/* Harvest Date */}
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    {lot.crush_date ? 'Crushed' : 'Harvested'}
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {lot.crush_date
                                      ? new Date(lot.crush_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                      : lot.harvest_date
                                        ? new Date(lot.harvest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                        : '—'
                                    }
                                  </p>
                                </div>

                                {/* Quality Badge */}
                                {totalDefects > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Quality</p>
                                    {totalDefects < 5 ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        Clean
                                      </span>
                                    ) : totalDefects < 10 ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                        Minor Issues
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        Defects
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Container - always show for child lots or if assigned */}
                                {(isChildLot || lot.container?.name) && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Vessel</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {lot.container?.name || '—'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Inline Edit Form - appears directly below the card being edited */}
                            {editingLot?.id === lot.id && (
                              <div className="mt-4 p-6 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-blue-300 rounded-xl shadow-inner">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Edit2 className="w-5 h-5 text-[#7C203A]" />
                                    Editing: {lot.name}
                                  </h4>
                                  <button
                                    onClick={resetForm}
                                    className="p-2 text-gray-500 hover:bg-white rounded-lg transition-colors"
                                    title="Cancel editing"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                  {/* Basic Information */}
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-300 pb-2">Basic Information</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Lot Name *</label>
                                        <input
                                          type="text"
                                          name="name"
                                          value={formData.name}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                          required
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Vintage *</label>
                                        <input
                                          type="number"
                                          name="vintage"
                                          value={formData.vintage}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                          required
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Varietal *</label>
                                        <input
                                          type="text"
                                          name="varietal"
                                          value={formData.varietal}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                          required
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Appellation</label>
                                        <input
                                          type="text"
                                          name="appellation"
                                          value={formData.appellation}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                                        <select
                                          name="block_id"
                                          value={formData.block_id || ''}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        >
                                          <option value="">Select Block</option>
                                          {sortByName(blocks).map((block) => (
                                            <option key={block.id} value={block.id}>{block.name}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Container</label>
                                        <select
                                          name="container_id"
                                          value={formData.container_id || ''}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        >
                                          <option value="">No Container</option>
                                          {containers.map((container) => (
                                            <option key={container.id} value={container.id}>{container.name} ({container.type})</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Harvest Details */}
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-300 pb-2">Harvest Details</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
                                        <input
                                          type="date"
                                          name="harvest_date"
                                          value={formData.harvest_date}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pick Start Time</label>
                                        <input
                                          type="datetime-local"
                                          name="pick_start_time"
                                          value={formData.pick_start_time}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pick End Time</label>
                                        <input
                                          type="datetime-local"
                                          name="pick_end_time"
                                          value={formData.pick_end_time}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                                        <input
                                          type="datetime-local"
                                          name="arrival_time"
                                          value={formData.arrival_time}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          name="initial_weight_lbs"
                                          value={formData.initial_weight_lbs}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Volume (gallons)</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          name="current_volume_gallons"
                                          value={formData.current_volume_gallons}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Chemistry & Quality */}
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-300 pb-2">Chemistry & Quality</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Brix (°)</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          name="initial_brix"
                                          value={formData.initial_brix}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          name="initial_ph"
                                          value={formData.initial_ph}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">TA (g/L)</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          name="initial_ta"
                                          value={formData.initial_ta}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">MOG (%)</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          name="mog_percent"
                                          value={formData.mog_percent}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                          placeholder="Material Other than Grape"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rot (%)</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          name="rot_percent"
                                          value={formData.rot_percent}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mildew (%)</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          name="mildew_percent"
                                          value={formData.mildew_percent}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sunburn (%)</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          name="sunburn_percent"
                                          value={formData.sunburn_percent}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sorting</label>
                                        <select
                                          name="sorting"
                                          value={formData.sorting}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        >
                                          <option value="">None</option>
                                          <option value="field">Field Sorted</option>
                                          <option value="table">Table Sorted</option>
                                          <option value="optical">Optical Sorted</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                          name="status"
                                          value={formData.status}
                                          onChange={handleChange}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                        >
                                          <option value="harvested">Harvested</option>
                                          <option value="crushing">Crushing</option>
                                          <option value="fermenting">Fermenting</option>
                                          <option value="pressed">Pressed</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Notes */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea
                                      name="notes"
                                      value={formData.notes}
                                      onChange={handleChange}
                                      rows="3"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                      placeholder="Add any notes about this lot..."
                                    />
                                  </div>

                                  <div className="flex items-center gap-3 pt-4 border-t border-gray-300">
                                    <button
                                      type="submit"
                                      className="px-6 py-2.5 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm font-medium"
                                    >
                                      Update Lot
                                    </button>
                                    <button
                                      type="button"
                                      onClick={resetForm}
                                      className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )}

                          </div>
                        );
                      })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Import Harvests Modal */}
      {showImportModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Import Harvests from Operations</h3>
                  <p className="text-sm text-gray-600">Select completed harvests to import as production lots</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedHarvests([]);
                }}
                className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-900 stroke-2" />
              </button>
            </div>

            <div className="p-6">
              {availableHarvests.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No completed harvests available</p>
                  <p className="text-sm text-gray-500 mt-2">Complete harvests in the Operations module to import them here</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {selectedHarvests.length} of {availableHarvests.length} selected
                    </p>
                    {selectedHarvests.length > 0 && (
                      <button
                        onClick={() => setSelectedHarvests([])}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {availableHarvests.map(harvest => {
                      const isSelected = selectedHarvests.includes(harvest.id);
                      const block = harvest.vineyard_blocks || {};

                      return (
                        <div
                          key={harvest.id}
                          onClick={() => toggleHarvestSelection(harvest.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-gray-600 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-gray-600 border-gray-600'
                                    : 'border-gray-300'
                                }`}>
                                  {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {block.name || 'Unknown Block'} - {block.variety || 'Unknown Varietal'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {harvest.harvest_year || new Date().getFullYear()} Vintage
                                    {block.appellation && ` • ${block.appellation}`}
                                  </p>
                                </div>
                              </div>
                              <div className="ml-8 grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                                <div>
                                  <span className="text-gray-500">Weight:</span>
                                  <span className="ml-1 font-medium text-gray-900">
                                    {harvest.actual_tons ? `${harvest.actual_tons} tons` : 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Brix:</span>
                                  <span className="ml-1 font-medium text-gray-900">
                                    {harvest.avg_brix ? `${harvest.avg_brix}°` : 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">pH:</span>
                                  <span className="ml-1 font-medium text-gray-900">
                                    {harvest.avg_ph || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Date:</span>
                                  <span className="ml-1 font-medium text-gray-900">
                                    {harvest.start_date ? new Date(harvest.start_date).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setSelectedHarvests([]);
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImportHarvests}
                      disabled={selectedHarvests.length === 0}
                      className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                        selectedHarvests.length === 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-800 text-white hover:bg-gray-700 shadow-sm'
                      }`}
                    >
                      Import {selectedHarvests.length} Harvest{selectedHarvests.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Crush/Destem Modal */}
      {showCrushModal && crushingLot && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full">
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-white">Record Crush & Destem</h3>
                <p className="text-gray-300 text-sm">{crushingLot.name}</p>
              </div>
              <button onClick={() => setShowCrushModal(false)} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-900 stroke-2" />
              </button>
            </div>

            <form onSubmit={handleCrushSubmit} className="p-6 space-y-4">
              {/* Harvest Info Summary */}
              {(crushingLot.pick_start_time || crushingLot.mog_percent || crushingLot.rot_percent || crushingLot.mildew_percent || crushingLot.sunburn_percent || crushingLot.sorting !== 'none') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 text-sm mb-3">Harvest Info</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {/* Time Metrics */}
                    {crushingLot.pick_start_time && (
                      <div>
                        <p className="text-blue-700 text-xs">Pick Started</p>
                        <p className="font-medium text-blue-900">{new Date(crushingLot.pick_start_time).toLocaleString()}</p>
                      </div>
                    )}
                    {crushingLot.pick_end_time && (
                      <div>
                        <p className="text-blue-700 text-xs">Pick Ended</p>
                        <p className="font-medium text-blue-900">{new Date(crushingLot.pick_end_time).toLocaleString()}</p>
                      </div>
                    )}
                    {crushingLot.arrival_time && (
                      <div>
                        <p className="text-blue-700 text-xs">Arrived at Crush Pad</p>
                        <p className="font-medium text-blue-900">{new Date(crushingLot.arrival_time).toLocaleString()}</p>
                      </div>
                    )}
                    {crushingLot.pick_end_time && crushingLot.arrival_time && (() => {
                      const pickEnd = new Date(crushingLot.pick_end_time);
                      const arrival = new Date(crushingLot.arrival_time);
                      const hoursDiff = (arrival - pickEnd) / (1000 * 60 * 60);
                      if (hoursDiff >= 0) {
                        return (
                          <div>
                            <p className="text-blue-700 text-xs">Pick to Arrival Time</p>
                            <p className="font-medium text-blue-900">{hoursDiff.toFixed(1)} hours</p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Quality Metrics */}
                    {crushingLot.sorting && crushingLot.sorting !== 'none' && (
                      <div>
                        <p className="text-blue-700 text-xs">Sorting Method</p>
                        <p className="font-medium text-blue-900 capitalize">{crushingLot.sorting.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                    {crushingLot.mog_percent > 0 && (
                      <div>
                        <p className="text-blue-700 text-xs">MOG</p>
                        <p className="font-medium text-blue-900">{crushingLot.mog_percent}%</p>
                      </div>
                    )}
                    {crushingLot.rot_percent > 0 && (
                      <div>
                        <p className="text-blue-700 text-xs">Rot</p>
                        <p className="font-medium text-blue-900">{crushingLot.rot_percent}%</p>
                      </div>
                    )}
                    {crushingLot.mildew_percent > 0 && (
                      <div>
                        <p className="text-blue-700 text-xs">Mildew</p>
                        <p className="font-medium text-blue-900">{crushingLot.mildew_percent}%</p>
                      </div>
                    )}
                    {crushingLot.sunburn_percent > 0 && (
                      <div>
                        <p className="text-blue-700 text-xs">Sunburn</p>
                        <p className="font-medium text-blue-900">{crushingLot.sunburn_percent}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Crush Date/Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crush Date & Time *</label>
                <input
                  type="datetime-local"
                  value={crushData.crush_date}
                  onChange={(e) => setCrushData({...crushData, crush_date: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                />
              </div>

              {/* Processing Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Processing Style *</label>
                <select
                  value={crushData.processing_style}
                  onChange={(e) => setCrushData({...crushData, processing_style: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                >
                  <option value="red">Red Wine</option>
                  <option value="white">White Wine</option>
                  <option value="rosé">Rosé</option>
                  <option value="sparkling">Sparkling</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Destem Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destem Mode *</label>
                <select
                  value={crushData.destem_mode}
                  onChange={(e) => setCrushData({...crushData, destem_mode: e.target.value, whole_cluster_percent: e.target.value === 'whole_cluster' ? '100' : e.target.value === 'fully_destemmed' ? '' : crushData.whole_cluster_percent})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                >
                  <option value="fully_destemmed">Fully Destemmed</option>
                  <option value="partial_whole_cluster">Partial Whole Cluster</option>
                  <option value="whole_cluster">100% Whole Cluster</option>
                </select>
              </div>

              {/* Whole Cluster Percentage (conditional) */}
              {crushData.destem_mode === 'partial_whole_cluster' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Whole Cluster % *</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={crushData.whole_cluster_percent}
                    onChange={(e) => setCrushData({...crushData, whole_cluster_percent: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                    placeholder="e.g., 20"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Percentage of uncrushed whole clusters (0-100%)
                  </p>
                </div>
              )}

              {/* Weight After Destemming */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight After Destemming (lbs) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={crushData.crushed_weight_lbs}
                  onChange={(e) => setCrushData({...crushData, crushed_weight_lbs: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                  placeholder="Weight after stems removed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Harvest weight: {crushingLot.initial_weight_lbs ? `${crushingLot.initial_weight_lbs.toLocaleString()} lbs` : 'N/A'}
                </p>
              </div>

              {/* Receiving Vessel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receiving Vessel</label>
                <select
                  value={crushData.receiving_container_id || ''}
                  onChange={(e) => setCrushData({...crushData, receiving_container_id: e.target.value || null})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">No vessel assigned</option>
                  {containers.map(container => (
                    <option key={container.id} value={container.id}>
                      {container.name} ({container.capacity_gallons} gal {container.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Calculations Display */}
              {crushData.crushed_weight_lbs && crushingLot.initial_weight_lbs && (
                (() => {
                  const initialWeight = parseFloat(crushingLot.initial_weight_lbs);
                  const crushedWeight = parseFloat(crushData.crushed_weight_lbs);
                  const stemLoss = initialWeight - crushedWeight;
                  const stemLossPercent = initialWeight > 0 ? (stemLoss / initialWeight) * 100 : 0;
                  const tons = crushedWeight / 2000;
                  const conversionFactor = crushData.processing_style === 'white' ? 150 : 160;
                  const estimatedVolume = tons * conversionFactor;

                  // Check vessel capacity
                  const selectedContainer = crushData.receiving_container_id
                    ? containers.find(c => c.id === crushData.receiving_container_id)
                    : null;
                  const capacityWarning = selectedContainer && estimatedVolume > selectedContainer.capacity_gallons;

                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <p className="font-semibold text-blue-900 text-sm">Calculations</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-blue-700">Stem Loss</p>
                          <p className="font-semibold text-blue-900">{stemLoss.toFixed(1)} lbs ({stemLossPercent.toFixed(1)}%)</p>
                        </div>
                        <div>
                          <p className="text-blue-700">Estimated Volume</p>
                          <p className="font-semibold text-blue-900">{estimatedVolume.toFixed(0)} gal</p>
                        </div>
                      </div>
                      {selectedContainer && (
                        <div className={`mt-2 p-2 rounded ${capacityWarning ? 'bg-red-100 border border-red-300' : 'bg-green-100 border border-green-300'}`}>
                          <p className={`text-xs font-medium ${capacityWarning ? 'text-red-800' : 'text-green-800'}`}>
                            {capacityWarning ? '⚠️ Warning: Volume exceeds vessel capacity!' : '✓ Vessel has sufficient capacity'}
                          </p>
                          <p className={`text-xs ${capacityWarning ? 'text-red-700' : 'text-green-700'}`}>
                            {selectedContainer.name}: {estimatedVolume.toFixed(0)} / {selectedContainer.capacity_gallons} gal ({((estimatedVolume / selectedContainer.capacity_gallons) * 100).toFixed(0)}%)
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                >
                  Record Crush
                </button>
                <button
                  type="button"
                  onClick={() => setShowCrushModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>

    {/* Confirm Dialog */}
    <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText="OK"
        cancelText="Cancel"
      />
    </>
  );
};
