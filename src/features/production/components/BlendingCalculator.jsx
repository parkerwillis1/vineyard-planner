import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Save,
  Beaker,
  Droplets,
  TrendingUp,
  Percent,
  Copy,
  FlaskConical,
  Eye,
  Edit,
  X,
  Wine,
  ArrowRight,
  History,
  BarChart3
} from 'lucide-react';
import {
  listLots,
  executeBlend,
  listBlends,
  getBlend,
  deleteBlend,
  updateBlend,
  calculateBlendChemistry,
  calculateVarietalComposition,
  listContainers
} from '@/shared/lib/productionApi';

export function BlendingCalculator() {
  const [view, setView] = useState('create'); // 'create', 'manage', 'detail'
  const [lots, setLots] = useState([]);
  const [containers, setContainers] = useState([]);
  const [blends, setBlends] = useState([]);
  const [selectedBlend, setSelectedBlend] = useState(null);
  const [loading, setLoading] = useState(true);

  // Blend creation state
  const [blendComponents, setBlendComponents] = useState([{ lot_id: '', percentage: '' }]);
  const [targetVolume, setTargetVolume] = useState('');
  const [blendName, setBlendName] = useState('');
  const [blendVintage, setBlendVintage] = useState(new Date().getFullYear());
  const [selectedContainer, setSelectedContainer] = useState('');
  const [blendStatus, setBlendStatus] = useState('aging');
  const [blendNotes, setBlendNotes] = useState('');

  // UI state
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Edit mode state
  const [editedName, setEditedName] = useState('');
  const [editedVintage, setEditedVintage] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [editedContainer, setEditedContainer] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotsResult, containersResult, blendsResult] = await Promise.all([
        listLots({ status: 'aging,pressed,blending,fermenting' }),
        listContainers(),
        listBlends()
      ]);

      if (lotsResult.error) throw lotsResult.error;
      if (containersResult.error) throw containersResult.error;
      if (blendsResult.error) throw blendsResult.error;

      setLots(lotsResult.data || []);
      setContainers(containersResult.data || []);
      setBlends(blendsResult.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addComponent = () => {
    setBlendComponents([...blendComponents, { lot_id: '', percentage: '' }]);
  };

  const removeComponent = (index) => {
    setBlendComponents(blendComponents.filter((_, i) => i !== index));
  };

  const updateComponent = (index, field, value) => {
    const updated = [...blendComponents];
    updated[index][field] = value;
    setBlendComponents(updated);
  };

  const calculateBlend = () => {
    const totalPercentage = blendComponents.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0);
    const results = blendComponents.map(component => {
      const lot = lots.find(l => l.id === component.lot_id);
      const percentage = parseFloat(component.percentage) || 0;
      const volume = targetVolume ? (parseFloat(targetVolume) * percentage / 100) : 0;

      return {
        lot,
        lot_id: component.lot_id,
        percentage,
        volume_gallons: volume,
        available: lot?.current_volume_gallons || 0
      };
    });

    return { results, totalPercentage };
  };

  const { results, totalPercentage } = calculateBlend();
  const predictedChemistry = calculateBlendChemistry(results);
  const varietalComposition = calculateVarietalComposition(results);

  const isBlendValid = () => {
    if (!blendName.trim()) return false;
    if (totalPercentage !== 100) return false;
    if (!targetVolume || parseFloat(targetVolume) <= 0) return false;
    if (results.some(r => r.volume_gallons > r.available)) return false;
    if (results.filter(r => r.lot).length === 0) return false;
    return true;
  };

  const handleExecuteBlend = async () => {
    if (!isBlendValid()) {
      setError('Please fix all validation errors before executing blend');
      return;
    }

    setExecuting(true);
    setError(null);

    try {
      const blendData = {
        name: blendName.trim(),
        vintage: parseInt(blendVintage),
        varietal: varietalComposition[0]?.varietal || 'Blend',
        current_volume_gallons: parseFloat(targetVolume),
        status: blendStatus,
        notes: blendNotes,
        current_ph: predictedChemistry.ph,
        current_ta: predictedChemistry.ta,
        current_alcohol_pct: predictedChemistry.alcohol,
        current_brix: predictedChemistry.brix
      };

      const validComponents = results.filter(r => r.lot && r.percentage > 0);

      const { data, error: blendError } = await executeBlend(
        blendData,
        validComponents,
        selectedContainer || null
      );

      if (blendError) throw blendError;

      setSuccess(`Blend "${blendName}" created successfully!`);

      // Reset form
      setBlendComponents([{ lot_id: '', percentage: '' }]);
      setTargetVolume('');
      setBlendName('');
      setBlendNotes('');
      setSelectedContainer('');

      // Reload data
      await loadData();

      // Switch to manage view to show the new blend
      setTimeout(() => {
        setView('manage');
        setSuccess(null);
      }, 2000);

    } catch (err) {
      console.error('Error executing blend:', err);
      setError(err.message || 'Failed to create blend');
    } finally {
      setExecuting(false);
    }
  };

  const handleViewBlend = async (blendId) => {
    try {
      const { data, error } = await getBlend(blendId);
      if (error) throw error;
      setSelectedBlend(data);
      setView('detail');
    } catch (err) {
      console.error('Error loading blend:', err);
      setError(err.message);
    }
  };

  const handleDeleteBlend = async (blendId) => {
    if (!confirm('Are you sure you want to delete this blend? This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await deleteBlend(blendId);
      if (error) throw error;
      setSuccess('Blend deleted successfully');
      await loadData();
    } catch (err) {
      console.error('Error deleting blend:', err);
      setError(err.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedBlend) return;

    setSaving(true);
    setError(null);

    try {
      const updates = {
        name: editedName,
        vintage: editedVintage,
        status: editedStatus,
        notes: editedNotes,
        container_id: editedContainer || null
      };

      const { data, error } = await updateBlend(selectedBlend.id, updates);
      if (error) throw error;

      setSuccess('Blend updated successfully');
      setSelectedBlend({ ...selectedBlend, ...updates });
      setEditMode(false);

      // Reload data to refresh the list
      await loadData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating blend:', err);
      setError(err.message || 'Failed to update blend');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Reset edited values
    if (selectedBlend) {
      setEditedName(selectedBlend.name);
      setEditedVintage(selectedBlend.vintage);
      setEditedStatus(selectedBlend.status);
      setEditedNotes(selectedBlend.notes || '');
      setEditedContainer(selectedBlend.container_id || '');
    }
  };

  const autogenerateBlendName = () => {
    if (varietalComposition.length === 0) return;

    const topVarietals = varietalComposition.slice(0, 2);
    const name = topVarietals.map(v => {
      const shortName = v.varietal.split(' ')[0]; // Get first word
      return `${shortName} ${v.percentage.toFixed(0)}%`;
    }).join(' / ');

    setBlendName(`${blendVintage} ${name}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading blending data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900">Blending Calculator</h2>
        <p className="text-gray-600 mt-0.5">Create custom blends and manage your cellar compositions</p>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setView('create')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            view === 'create'
              ? 'border-gray-800 text-gray-800'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Blend
          </div>
        </button>
        <button
          onClick={() => setView('manage')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            view === 'manage'
              ? 'border-gray-800 text-gray-800'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Manage Blends ({blends.length})
          </div>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* CREATE BLEND VIEW */}
      {view === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Blend Builder */}
          <div className="lg:col-span-2 space-y-6">
            {/* Blend Details */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Blend Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blend Name *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={blendName}
                      onChange={(e) => setBlendName(e.target.value)}
                      placeholder="e.g., 2024 Cabernet Blend"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    />
                    <button
                      onClick={autogenerateBlendName}
                      disabled={varietalComposition.length === 0}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Auto-generate name from components"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vintage *</label>
                  <input
                    type="number"
                    value={blendVintage}
                    onChange={(e) => setBlendVintage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Volume (gallons) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetVolume}
                    onChange={(e) => setTargetVolume(e.target.value)}
                    placeholder="e.g., 300"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status After Blend</label>
                  <select
                    value={blendStatus}
                    onChange={(e) => setBlendStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  >
                    <option value="blending">Blending</option>
                    <option value="aging">Aging</option>
                    <option value="filtering">Filtering</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Container (optional)</label>
                  <select
                    value={selectedContainer}
                    onChange={(e) => setSelectedContainer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  >
                    <option value="">No container yet</option>
                    {containers
                      .filter(c => c.status === 'empty' && c.capacity_gallons >= (parseFloat(targetVolume) || 0))
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} - {c.type} ({c.capacity_gallons} gal capacity)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={blendNotes}
                    onChange={(e) => setBlendNotes(e.target.value)}
                    rows={2}
                    placeholder="Winemaking notes, goals, observations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Blend Components */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Blend Components</h3>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {blendComponents.length} component{blendComponents.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4 mb-5">
                {blendComponents.map((component, index) => {
                  const selectedLot = component.lot_id ? lots.find(l => l.id === component.lot_id) : null;
                  const requiredVolume = component.percentage && targetVolume
                    ? (parseFloat(targetVolume) * parseFloat(component.percentage)) / 100
                    : 0;
                  const hasEnoughVolume = selectedLot
                    ? (selectedLot.current_volume_gallons || 0) >= requiredVolume
                    : true;

                  return (
                    <div
                      key={index}
                      className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-400 bg-gradient-to-br from-white to-gray-50 transition-all"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mt-6">
                          <span className="text-sm font-bold text-white">#{index + 1}</span>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                              Source Lot
                            </label>
                            <select
                              value={component.lot_id}
                              onChange={(e) => updateComponent(index, 'lot_id', e.target.value)}
                              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 bg-white text-sm font-medium transition-all"
                            >
                              <option value="">Select lot...</option>
                              {lots.map(lot => (
                                <option key={lot.id} value={lot.id}>
                                  {lot.name} - {lot.varietal} {lot.vintage} ({lot.current_volume_gallons?.toFixed(0) || 0} gal)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                Percentage
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={component.percentage}
                                  onChange={(e) => updateComponent(index, 'percentage', e.target.value)}
                                  placeholder="0.0"
                                  className="w-full px-4 py-2.5 pr-8 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 text-sm font-medium transition-all"
                                />
                                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              </div>
                            </div>

                            {targetVolume && component.percentage && (
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                  Volume Needed
                                </label>
                                <div className={`px-4 py-2.5 rounded-lg text-sm font-bold ${
                                  hasEnoughVolume
                                    ? 'bg-green-50 text-green-700 border-2 border-green-200'
                                    : 'bg-red-50 text-red-700 border-2 border-red-200'
                                }`}>
                                  {requiredVolume.toFixed(1)} gal
                                </div>
                              </div>
                            )}
                          </div>

                          {selectedLot && (
                            <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-xs text-gray-600">
                                  Available: <span className="font-semibold text-gray-900">{selectedLot.current_volume_gallons?.toFixed(1) || 0} gal</span>
                                </span>
                              </div>
                              {selectedLot.current_ph && (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                  <span className="text-xs text-gray-600">
                                    pH: <span className="font-semibold text-gray-900">{selectedLot.current_ph.toFixed(2)}</span>
                                  </span>
                                </div>
                              )}
                              {selectedLot.current_ta && (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <span className="text-xs text-gray-600">
                                    TA: <span className="font-semibold text-gray-900">{selectedLot.current_ta.toFixed(2)}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeComponent(index)}
                          disabled={blendComponents.length === 1}
                          className="flex-shrink-0 mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove component"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={addComponent}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-100 transition-all border-2 border-dashed border-gray-300 hover:border-gray-400 font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Component
              </button>

              <div className={`mt-5 p-4 rounded-xl border-2 transition-all ${
                totalPercentage === 100
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-800">Total Percentage:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${totalPercentage === 100 ? 'text-green-700' : 'text-amber-700'}`}>
                      {totalPercentage.toFixed(1)}%
                    </span>
                    {totalPercentage === 100 && (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                </div>
                {totalPercentage !== 100 && (
                  <p className="text-xs text-amber-700 font-medium">Must equal 100% to execute blend</p>
                )}
                {totalPercentage === 100 && (
                  <p className="text-xs text-green-700 font-medium">Ready to execute blend!</p>
                )}
              </div>
            </div>

            {/* Execute Button */}
            <div className="flex gap-3">
              <button
                onClick={handleExecuteBlend}
                disabled={!isBlendValid() || executing}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {executing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Executing Blend...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Execute Blend
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Chemistry Preview & Validation */}
          <div className="space-y-6">
            {/* Varietal Composition */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wine className="w-5 h-5 text-[#7C203A]" />
                <h3 className="text-lg font-semibold text-gray-900">Varietal Composition</h3>
              </div>

              {varietalComposition.length > 0 ? (
                <div className="space-y-3">
                  {varietalComposition.map((v, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900">{v.varietal}</span>
                        <span className="text-gray-600">{v.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#7C203A] to-[#8B2E48] h-2 rounded-full transition-all"
                          style={{ width: `${v.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Add components to see varietal breakdown
                </p>
              )}
            </div>

            {/* Predicted Chemistry */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Predicted Chemistry</h3>
              </div>

              <div className="space-y-3">
                {predictedChemistry.ph !== null ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">pH</span>
                      <span className="text-lg font-bold text-gray-900">
                        {predictedChemistry.ph.toFixed(2)}
                      </span>
                    </div>
                    {predictedChemistry.ta !== null && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">TA</span>
                        <span className="text-lg font-bold text-gray-900">
                          {predictedChemistry.ta.toFixed(2)} g/L
                        </span>
                      </div>
                    )}
                    {predictedChemistry.alcohol !== null && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Alcohol</span>
                        <span className="text-lg font-bold text-gray-900">
                          {predictedChemistry.alcohol.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {predictedChemistry.brix !== null && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Brix</span>
                        <span className="text-lg font-bold text-gray-900">
                          {predictedChemistry.brix.toFixed(1)}°
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Chemistry data unavailable for selected lots
                  </p>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> These are weighted averages based on component chemistry. Actual values may vary after blending.
                </p>
              </div>
            </div>

            {/* Volume Validation */}
            {results.length > 0 && targetVolume && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Droplets className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Volume Check</h3>
                </div>

                <div className="space-y-2">
                  {results.filter(r => r.lot).map((result, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${
                      result.volume_gallons > result.available
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{result.lot.name}</p>
                          <p className="text-xs text-gray-600">{result.percentage.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold text-sm ${
                            result.volume_gallons > result.available ? 'text-red-700' : 'text-green-700'
                          }`}>
                            {result.volume_gallons.toFixed(1)} gal needed
                          </p>
                          <p className="text-xs text-gray-600">{result.available.toFixed(1)} gal available</p>
                        </div>
                      </div>
                      {result.volume_gallons > result.available && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-700">
                          <AlertCircle className="w-3 h-3" />
                          <span>Insufficient volume!</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANAGE BLENDS VIEW */}
      {view === 'manage' && (
        <div className="space-y-4">
          {blends.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Blends Yet</h3>
              <p className="text-gray-600 mb-4">Create your first blend to get started</p>
              <button
                onClick={() => setView('create')}
                className="px-6 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors"
              >
                Create Blend
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blends.map(blend => (
                <div key={blend.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{blend.name}</h3>
                      <p className="text-sm text-gray-600">{blend.varietal} • {blend.vintage}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      blend.status === 'aging' ? 'bg-amber-100 text-amber-700' :
                      blend.status === 'blending' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {blend.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Volume:</span>
                      <span className="font-medium text-gray-900">{blend.current_volume_gallons?.toFixed(0) || 0} gal</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Components:</span>
                      <span className="font-medium text-gray-900">{blend.blend_components?.length || 0}</span>
                    </div>
                    {blend.container && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Container:</span>
                        <span className="font-medium text-gray-900">{blend.container.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Component varietals summary */}
                  {blend.blend_components && blend.blend_components.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-1">Blend Composition:</p>
                      <div className="flex flex-wrap gap-1">
                        {blend.blend_components.map((comp, idx) => (
                          <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                            {comp.component_lot?.varietal} {comp.percentage?.toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewBlend(blend.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleDeleteBlend(blend.id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BLEND DETAIL VIEW */}
      {view === 'detail' && selectedBlend && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setView('manage');
                  setSelectedBlend(null);
                  setEditMode(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                {editMode ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-bold text-gray-900 border-b-2 border-gray-300 focus:border-gray-800 outline-none bg-transparent"
                  />
                ) : (
                  <h3 className="text-2xl font-bold text-gray-900">{selectedBlend.name}</h3>
                )}
                <p className="text-gray-600">{selectedBlend.varietal} • {editMode ? (
                  <input
                    type="number"
                    value={editedVintage}
                    onChange={(e) => setEditedVintage(e.target.value)}
                    className="w-20 border-b border-gray-300 focus:border-gray-800 outline-none bg-transparent"
                  />
                ) : selectedBlend.vintage}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditMode(true);
                    setEditedName(selectedBlend.name);
                    setEditedVintage(selectedBlend.vintage);
                    setEditedStatus(selectedBlend.status);
                    setEditedNotes(selectedBlend.notes || '');
                    setEditedContainer(selectedBlend.container_id || '');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Blend Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Blend Information</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    {editMode ? (
                      <select
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 outline-none"
                      >
                        <option value="aging">Aging</option>
                        <option value="bottled">Bottled</option>
                        <option value="archived">Archived</option>
                      </select>
                    ) : (
                      <p className="font-medium text-gray-900 capitalize">{selectedBlend.status}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Volume</p>
                    <p className="font-medium text-gray-900">{selectedBlend.current_volume_gallons?.toFixed(0)} gallons</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Container</p>
                    {editMode ? (
                      <select
                        value={editedContainer}
                        onChange={(e) => setEditedContainer(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 outline-none"
                      >
                        <option value="">No container</option>
                        {containers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-medium text-gray-900">{selectedBlend.container?.name || 'No container assigned'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Created</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedBlend.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  {editMode ? (
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 outline-none resize-none"
                      placeholder="Add notes about this blend..."
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedBlend.notes || 'No notes'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Components */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Blend Components</h4>

                <div className="space-y-3">
                  {selectedBlend.blend_components?.map((comp, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{comp.component_lot?.name}</p>
                          <p className="text-sm text-gray-600">
                            {comp.component_lot?.varietal} {comp.component_lot?.vintage}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#7C203A]">{comp.percentage?.toFixed(1)}%</p>
                          <p className="text-sm text-gray-600">{comp.volume_gallons?.toFixed(1)} gal</p>
                        </div>
                      </div>
                      {comp.component_lot && (
                        <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-3 gap-2 text-xs">
                          {comp.component_lot.current_ph && (
                            <div>
                              <span className="text-gray-600">pH: </span>
                              <span className="font-medium">{comp.component_lot.current_ph.toFixed(2)}</span>
                            </div>
                          )}
                          {comp.component_lot.current_ta && (
                            <div>
                              <span className="text-gray-600">TA: </span>
                              <span className="font-medium">{comp.component_lot.current_ta.toFixed(2)}</span>
                            </div>
                          )}
                          {comp.component_lot.current_alcohol_pct && (
                            <div>
                              <span className="text-gray-600">ABV: </span>
                              <span className="font-medium">{comp.component_lot.current_alcohol_pct.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chemistry & Stats */}
            <div className="space-y-6">
              {selectedBlend.current_ph && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Final Chemistry</h4>

                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">pH</span>
                      <span className="text-lg font-bold text-gray-900">{selectedBlend.current_ph.toFixed(2)}</span>
                    </div>
                    {selectedBlend.current_ta && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">TA</span>
                        <span className="text-lg font-bold text-gray-900">{selectedBlend.current_ta.toFixed(2)} g/L</span>
                      </div>
                    )}
                    {selectedBlend.current_alcohol_pct && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Alcohol</span>
                        <span className="text-lg font-bold text-gray-900">{selectedBlend.current_alcohol_pct.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
