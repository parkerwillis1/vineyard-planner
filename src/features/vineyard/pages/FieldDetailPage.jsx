import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  MapPin,
  Beaker,
  Camera,
  BarChart3,
  Info,
  Grape,
  Calendar,
  Archive,
  Pencil,
  Trash2
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import {
  getVineyardBlock,
  updateVineyardBlock,
  listHarvestSamples,
  createHarvestSample,
  updateHarvestSample,
  deleteHarvestSample,
  getLatestSampleByBlock
} from '@/shared/lib/vineyardApi';
import { BlockMap } from '../components/BlockMap';
import { FieldPhotos } from '../components/FieldPhotos';
import { FieldYieldHistory } from '../components/FieldYieldHistory';

export function FieldDetailPage({ id: propId, onBack }) {
  const { id: paramId } = useParams();
  const id = propId || paramId; // Use prop if provided, fallback to useParams
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log('🌾 FieldDetailPage rendered - ID:', id, '(prop:', propId, ', param:', paramId, ')');

  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [samples, setSamples] = useState([]);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [savingSample, setSavingSample] = useState(false);
  const [editingSample, setEditingSample] = useState(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [sampleToArchive, setSampleToArchive] = useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    variety: '',
    acres: '',
    rootstock: '',
    year_planted: '',
    row_spacing_ft: '',
    vine_spacing_ft: '',
    row_orientation_deg: null,
    notes: ''
  });

  const [sampleFormData, setSampleFormData] = useState({
    sample_date: '',
    brix: '',
    ta: '',
    ph: '',
    berry_size: '',
    cluster_condition: '',
    disease_pressure: '',
    ready_to_pick: false,
    estimated_days_to_harvest: '',
    notes: ''
  });

  useEffect(() => {
    if (user && id) {
      loadFieldData();
    }
  }, [user, id]);

  const loadFieldData = async () => {
    setLoading(true);

    const { data, error } = await getVineyardBlock(id);

    if (error) {
      console.error('Error loading field:', error);
      alert(`Error loading field: ${error.message}`);
      navigate('/vineyard');
      return;
    }

    setField(data);
    setEditForm({
      name: data.name || '',
      variety: data.variety || '',
      acres: data.acres || '',
      rootstock: data.rootstock || '',
      year_planted: data.year_planted || '',
      row_spacing_ft: data.row_spacing_ft || '',
      vine_spacing_ft: data.vine_spacing_ft || '',
      row_orientation_deg: data.row_orientation_deg,
      notes: data.notes || ''
    });

    // Load samples for this field
    await loadSamples();

    setLoading(false);
  };

  const loadSamples = async () => {
    const { data, error } = await listHarvestSamples(id);
    if (!error && data) {
      setSamples(data);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const updates = {
      name: editForm.name,
      variety: editForm.variety,
      acres: editForm.acres ? parseFloat(editForm.acres) : null,
      rootstock: editForm.rootstock || null,
      year_planted: editForm.year_planted ? parseInt(editForm.year_planted) : null,
      row_spacing_ft: editForm.row_spacing_ft ? parseFloat(editForm.row_spacing_ft) : null,
      vine_spacing_ft: editForm.vine_spacing_ft ? parseFloat(editForm.vine_spacing_ft) : null,
      row_orientation_deg: editForm.row_orientation_deg,
      notes: editForm.notes || null
    };

    const { data, error } = await updateVineyardBlock(id, updates);

    if (error) {
      alert(`Error updating field: ${error.message}`);
    } else {
      setField(data);
      setIsEditing(false);
    }

    setSaving(false);
  };

  const handleEditSample = (sample) => {
    setEditingSample(sample);
    setSampleFormData({
      sample_date: sample.sample_date || '',
      brix: sample.brix || '',
      ta: sample.ta || '',
      ph: sample.ph || '',
      berry_size: sample.berry_size || '',
      cluster_condition: sample.cluster_condition || '',
      disease_pressure: sample.disease_pressure || '',
      ready_to_pick: sample.ready_to_pick || false,
      estimated_days_to_harvest: sample.estimated_days_to_harvest || '',
      notes: sample.notes || ''
    });
    setShowSampleModal(true);
  };

  const handleArchiveSample = (sampleId) => {
    setSampleToArchive(sampleId);
    setShowArchiveConfirm(true);
  };

  const confirmArchiveSample = async () => {
    if (!sampleToArchive) return;

    const { error } = await deleteHarvestSample(sampleToArchive);
    if (error) {
      alert(`Error archiving sample: ${error.message}`);
    } else {
      await loadSamples();
    }
    setSampleToArchive(null);
  };

  const handleAddSample = async (e) => {
    e.preventDefault();
    setSavingSample(true);

    const sampleData = {
      block_id: id,
      sample_date: sampleFormData.sample_date || new Date().toISOString().split('T')[0],
      brix: sampleFormData.brix ? parseFloat(sampleFormData.brix) : null,
      ta: sampleFormData.ta ? parseFloat(sampleFormData.ta) : null,
      ph: sampleFormData.ph ? parseFloat(sampleFormData.ph) : null,
      berry_size: sampleFormData.berry_size || null,
      cluster_condition: sampleFormData.cluster_condition || null,
      disease_pressure: sampleFormData.disease_pressure || null,
      ready_to_pick: sampleFormData.ready_to_pick,
      estimated_days_to_harvest: sampleFormData.estimated_days_to_harvest ? parseInt(sampleFormData.estimated_days_to_harvest) : null,
      notes: sampleFormData.notes || null
    };

    let error;
    if (editingSample) {
      // Update existing sample
      const result = await updateHarvestSample(editingSample.id, sampleData);
      error = result.error;
    } else {
      // Create new sample
      const result = await createHarvestSample(sampleData);
      error = result.error;
    }

    if (error) {
      alert(`Error ${editingSample ? 'updating' : 'creating'} sample: ${error.message}`);
    } else {
      setShowSampleModal(false);
      setEditingSample(null);
      setSampleFormData({
        sample_date: '',
        brix: '',
        ta: '',
        ph: '',
        berry_size: '',
        cluster_condition: '',
        disease_pressure: '',
        ready_to_pick: false,
        estimated_days_to_harvest: '',
        notes: ''
      });
      await loadSamples();
    }

    setSavingSample(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vine-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading field details...</p>
        </div>
      </div>
    );
  }

  if (!field) {
    return null;
  }

  const tabs = [
    { id: 'info', label: 'Field Info', icon: Info },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'samples', label: 'Field Samples', icon: Beaker },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'yield', label: 'Yield History', icon: BarChart3 }
  ];

  // Calculate key metrics
  const vinesPerAcre = field.row_spacing_ft && field.vine_spacing_ft
    ? Math.round(43560 / (field.row_spacing_ft * field.vine_spacing_ft))
    : null;
  const totalVines = vinesPerAcre && field.acres
    ? Math.round(vinesPerAcre * field.acres)
    : field.vine_count_reported || null;
  const fieldAge = field.year_planted ? new Date().getFullYear() - field.year_planted : null;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onBack || (() => navigate('/vineyard'))}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{field.name}</h1>
        </div>
        {activeTab === 'info' && (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-vine-green-500 hover:bg-vine-green-600"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      name: field.name || '',
                      variety: field.variety || '',
                      acres: field.acres || '',
                      rootstock: field.rootstock || '',
                      year_planted: field.year_planted || '',
                      row_spacing_ft: field.row_spacing_ft || '',
                      vine_spacing_ft: field.vine_spacing_ft || '',
                      row_orientation_deg: field.row_orientation_deg,
                      notes: field.notes || ''
                    });
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-vine-green-500 hover:bg-vine-green-600"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Variety</div>
              <Grape className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{field.variety || 'Not set'}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Size</div>
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {field.acres} <span className="text-lg font-normal text-gray-600">acres</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Spacing</div>
              <Info className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {field.row_spacing_ft || '-'} × {field.vine_spacing_ft || '-'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {field.row_spacing_ft && field.vine_spacing_ft ? `${vinesPerAcre.toLocaleString()}/acre` : 'Row × Vine (ft)'}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Total Vines</div>
              <Info className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalVines ? totalVines.toLocaleString() : '-'}</div>
            {vinesPerAcre && (
              <div className="text-xs text-gray-500 mt-1">{vinesPerAcre.toLocaleString()}/acre</div>
            )}
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Age</div>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {fieldAge ? `${fieldAge} years` : '-'}
            </div>
            {field.year_planted && (
              <div className="text-xs text-gray-500 mt-1">Planted {field.year_planted}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-vine-green-500 text-vine-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pb-8">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-vine-green-600" />
                  Field Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Field Name *
                    </label>
                    {isEditing ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-base text-gray-900">{field.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Variety *
                    </label>
                    {isEditing ? (
                      <Input
                        value={editForm.variety}
                        onChange={(e) => setEditForm({ ...editForm, variety: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-base text-gray-900">{field.variety}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Acres *
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editForm.acres}
                        onChange={(e) => setEditForm({ ...editForm, acres: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-base text-gray-900">{field.acres}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Rootstock
                    </label>
                    {isEditing ? (
                      <Input
                        value={editForm.rootstock}
                        onChange={(e) => setEditForm({ ...editForm, rootstock: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-base text-gray-900">{field.rootstock || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Year Planted
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editForm.year_planted}
                        onChange={(e) => setEditForm({ ...editForm, year_planted: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-base text-gray-900">{field.year_planted || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Clone
                    </label>
                    <p className="text-base text-gray-900">{field.clone || '-'}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Planting Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Row Spacing (ft) *
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editForm.row_spacing_ft}
                        onChange={async (e) => {
                          const newValue = e.target.value;
                          setEditForm({ ...editForm, row_spacing_ft: newValue });
                          // Auto-save on blur
                        }}
                        onBlur={async () => {
                          if (editForm.row_spacing_ft !== field.row_spacing_ft) {
                            const { data, error } = await updateVineyardBlock(id, {
                              row_spacing_ft: editForm.row_spacing_ft ? parseFloat(editForm.row_spacing_ft) : null
                            });
                            if (!error && data) {
                              setField(data);
                            }
                          }
                        }}
                        className="w-full"
                        placeholder="e.g., 10"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Vine Spacing (ft) *
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editForm.vine_spacing_ft}
                        onChange={async (e) => {
                          const newValue = e.target.value;
                          setEditForm({ ...editForm, vine_spacing_ft: newValue });
                          // Auto-save on blur
                        }}
                        onBlur={async () => {
                          if (editForm.vine_spacing_ft !== field.vine_spacing_ft) {
                            const { data, error } = await updateVineyardBlock(id, {
                              vine_spacing_ft: editForm.vine_spacing_ft ? parseFloat(editForm.vine_spacing_ft) : null
                            });
                            if (!error && data) {
                              setField(data);
                            }
                          }
                        }}
                        className="w-full"
                        placeholder="e.g., 6"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Row Direction
                      </label>
                      {isEditing ? (
                        <select
                          value={editForm.row_orientation_deg === null ? '' : editForm.row_orientation_deg}
                          onChange={(e) => setEditForm({ ...editForm, row_orientation_deg: e.target.value === '' ? null : parseInt(e.target.value) })}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                        >
                          <option value="">Auto (East-West)</option>
                          <option value="0">North-South (Vertical)</option>
                          <option value="90">East-West (Horizontal)</option>
                        </select>
                      ) : (
                        <p className="text-base text-gray-900">
                          {field.row_orientation_deg === 0 ? 'North-South' : field.row_orientation_deg === 90 ? 'East-West' : 'Auto (East-West)'}
                        </p>
                      )}
                    </div>

                    {vinesPerAcre && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Vine Density
                        </label>
                        <p className="text-base text-gray-900">{vinesPerAcre.toLocaleString()} vines/acre</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Notes</h4>
                  {isEditing ? (
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows="4"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                      placeholder="Add any notes about this field..."
                    />
                  ) : (
                    <p className="text-base text-gray-700 whitespace-pre-wrap">{field.notes || 'No notes added yet.'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sidebar - Additional Info */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Current Status</span>
                      <div className="mt-1">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          field.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          field.status === 'fallow' ? 'bg-gray-100 text-gray-700' :
                          field.status === 'new' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {field.status || 'Active'}
                        </span>
                      </div>
                    </div>
                    {field.trellis_system && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Trellis System</span>
                        <p className="text-base text-gray-900 mt-1">{field.trellis_system}</p>
                      </div>
                    )}
                    {field.irrigation_zone && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Irrigation Zone</span>
                        <p className="text-base text-gray-900 mt-1">{field.irrigation_zone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('samples')}
                    >
                      <Beaker className="w-4 h-4 mr-2" />
                      Add Field Sample
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('photos')}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Add Photos
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('map')}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Update Map
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <Card>
            <CardContent className="pt-6">
              <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200">
                <BlockMap
                  blocks={[field]}
                  selectedBlockId={field.id}
                  onBlockSelect={() => {}} // Keep field selected
                  onBlockUpdate={async (blockId, updates) => {
                    // Optimistically update local state immediately
                    setField(prevField => ({ ...prevField, ...updates }));

                    // Then update database in background
                    const { error } = await updateVineyardBlock(blockId, updates);
                    if (error) {
                      // If database update fails, reload to get correct state
                      alert(`Error updating field: ${error.message}`);
                      await loadFieldData();
                    }
                    // Don't reload on success - we already updated local state
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'samples' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Field Samples</h2>
              <Button
                onClick={() => setShowSampleModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Beaker className="w-4 h-4" />
                Add Sample
              </Button>
            </div>

            {samples.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="py-12 text-center">
                  <Beaker className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No field samples recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Brix</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">TA</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">pH</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Berry Size</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Condition</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Ready</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Notes</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {samples.map((sample) => (
                          <tr key={sample.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4 text-sm text-gray-900">
                              {new Date(sample.sample_date).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 text-center text-sm text-gray-900">
                              {sample.brix ? sample.brix.toFixed(1) : '-'}
                            </td>
                            <td className="py-4 px-4 text-center text-sm text-gray-900">
                              {sample.ta ? sample.ta.toFixed(1) : '-'}
                            </td>
                            <td className="py-4 px-4 text-center text-sm text-gray-900">
                              {sample.ph ? sample.ph.toFixed(2) : '-'}
                            </td>
                            <td className="py-4 px-4 text-center text-sm text-gray-900 capitalize">
                              {sample.berry_size || '-'}
                            </td>
                            <td className="py-4 px-4 text-center text-sm text-gray-900 capitalize">
                              {sample.cluster_condition || '-'}
                            </td>
                            <td className="py-4 px-4 text-center">
                              {sample.ready_to_pick && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Ready
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600">
                              {sample.notes || '-'}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditSample(sample)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit sample"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleArchiveSample(sample.id)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Archive sample"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <FieldPhotos
            fieldId={field.id}
            fieldName={field.name}
          />
        )}

        {activeTab === 'yield' && (
          <FieldYieldHistory
            fieldId={field.id}
            fieldName={field.name}
            fieldAcres={field.acres}
          />
        )}
      </div>

      {/* Field Sample Modal */}
      {showSampleModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Beaker className="w-6 h-6" />
                  {editingSample ? 'Edit' : 'Add'} Field Sample - {field.name}
                </h2>
                <p className="text-blue-50 text-sm mt-1">Record berry quality metrics</p>
              </div>
              <button
                onClick={() => {
                  setShowSampleModal(false);
                  setEditingSample(null);
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSample} className="p-6 space-y-6">
              {/* Sample Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sample Date
                </label>
                <Input
                  type="date"
                  value={sampleFormData.sample_date}
                  onChange={(e) => setSampleFormData({ ...sampleFormData, sample_date: e.target.value })}
                  placeholder="Leave blank for today"
                  className="w-full max-w-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to use today's date</p>
              </div>

              {/* Quality Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Brix
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={sampleFormData.brix}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, brix: e.target.value })}
                    placeholder="e.g., 24.5"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    TA (g/L)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={sampleFormData.ta}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, ta: e.target.value })}
                    placeholder="e.g., 6.2"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    pH
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={sampleFormData.ph}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, ph: e.target.value })}
                    placeholder="e.g., 3.55"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Visual Observations */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Berry Size
                  </label>
                  <select
                    value={sampleFormData.berry_size}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, berry_size: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cluster Condition
                  </label>
                  <select
                    value={sampleFormData.cluster_condition}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, cluster_condition: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Disease Pressure
                  </label>
                  <select
                    value={sampleFormData.disease_pressure}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, disease_pressure: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="none">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Harvest Readiness */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sampleFormData.ready_to_pick}
                      onChange={(e) => setSampleFormData({ ...sampleFormData, ready_to_pick: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="font-semibold text-gray-900">Ready to Pick</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Days to Harvest
                  </label>
                  <Input
                    type="number"
                    value={sampleFormData.estimated_days_to_harvest}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, estimated_days_to_harvest: e.target.value })}
                    placeholder="e.g., 7"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={sampleFormData.notes}
                  onChange={(e) => setSampleFormData({ ...sampleFormData, notes: e.target.value })}
                  placeholder="Additional observations..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={savingSample}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingSample ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Beaker className="w-5 h-5" />
                      {editingSample ? 'Update Sample' : 'Save Sample'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSampleModal(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onClose={() => {
          setShowArchiveConfirm(false);
          setSampleToArchive(null);
        }}
        onConfirm={confirmArchiveSample}
        title="Archive Sample"
        message="Archive this sample? You can restore it later from Settings > Archives."
        confirmText="Archive"
        cancelText="Cancel"
        variant="warning"
        icon={Archive}
      />
    </div>
  );
}
