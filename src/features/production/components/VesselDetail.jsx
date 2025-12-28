import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Barrel, Package, Droplet, MapPin, Layers, Sparkles, Calendar, Beaker, FileText, X } from 'lucide-react';
import {
  getContainer,
  updateContainer,
  deleteContainer,
  listLots,
  updateLot,
  logLotAssignment,
  logLotRemoval
} from '@/shared/lib/productionApi';
import { VesselQuickView } from './VesselQuickView';
import { VesselAnalytics } from './VesselAnalytics';

export function VesselDetail({ id: propId, onBack }) {
  const { id: paramId } = useParams();
  const id = propId || paramId; // Use prop if provided, fallback to useParams
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if accessed via QR scan
  const isScan = searchParams.get('scan') === 'true';

  // Check where we came from
  const fromView = searchParams.get('from');

  // If scanned via QR, show mobile-optimized quick view
  if (isScan) {
    return <VesselQuickView />;
  }
  const [container, setContainer] = useState(null);
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [contentsFormData, setContentsFormData] = useState(null);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [activeTab, setActiveTab] = useState('contents');
  const [showLotPicker, setShowLotPicker] = useState(false);
  const [availableLots, setAvailableLots] = useState([]);

  useEffect(() => {
    loadVesselData();
  }, [id]);

  const loadVesselData = async () => {
    setLoading(true);
    try {
      const { data: containerData, error: containerError } = await getContainer(id);
      if (containerError) throw containerError;

      const { data: lotsData, error: lotsError } = await listLots();
      if (lotsError) throw lotsError;

      setContainer(containerData);

      // Find associated lot
      const associatedLot = lotsData?.find(l => l.container_id === id);
      setLot(associatedLot || null);

      // Set current volume - prioritize lot's volume over container's stored volume
      setCurrentVolume(associatedLot?.current_volume_gallons ?? containerData.current_volume_gallons ?? 0);

      // Auto-sync container status: if a lot is assigned but status is "empty", update to "in_use"
      if (associatedLot && containerData.status === 'empty') {
        try {
          await updateContainer(id, { status: 'in_use' });
          // Reload to get updated status
          const { data: freshContainer } = await getContainer(id);
          if (freshContainer) {
            setContainer(freshContainer);
          }
        } catch (syncError) {
          console.error('Error syncing container status:', syncError);
          // Non-critical, continue loading
        }
      }

      // Initialize contents form data if lot exists
      if (associatedLot) {
        setContentsFormData({
          current_brix: associatedLot.current_brix || '',
          current_ph: associatedLot.current_ph || '',
          current_ta: associatedLot.current_ta || '',
          current_temp_f: associatedLot.current_temp_f || '',
          current_alcohol_pct: associatedLot.current_alcohol_pct || '',
          status: associatedLot.status || 'fermenting'
        });
      }

      // Initialize form data
      setFormData({
        name: containerData.name,
        type: containerData.type,
        material: containerData.material || 'stainless',
        capacity_gallons: containerData.capacity_gallons,
        location: containerData.location || '',
        status: containerData.status,
        cooperage: containerData.cooperage || '',
        toast_level: containerData.toast_level || '',
        purchase_date: containerData.purchase_date || '',
        total_fills: containerData.total_fills || 0,
        last_cip_date: containerData.last_cip_date || '',
        cip_product: containerData.cip_product || '',
        purchase_cost: containerData.purchase_cost || '',
        annual_maintenance_cost: containerData.annual_maintenance_cost || '',
        estimated_replacement_cost: containerData.estimated_replacement_cost || '',
        notes: containerData.notes || ''
      });
    } catch (err) {
      console.error('Error loading vessel:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Save based on active tab
      if (activeTab === 'contents' && lot) {
        // Save contents/fermentation data
        const updateData = {
          current_brix: parseFloat(contentsFormData.current_brix) || null,
          current_ph: parseFloat(contentsFormData.current_ph) || null,
          current_ta: parseFloat(contentsFormData.current_ta) || null,
          current_temp_f: parseFloat(contentsFormData.current_temp_f) || null,
          current_alcohol_pct: parseFloat(contentsFormData.current_alcohol_pct) || null,
          status: contentsFormData.status
        };

        const { error: updateError } = await updateLot(lot.id, updateData);
        if (updateError) throw updateError;
      } else if (activeTab === 'details') {
        // Save vessel details
        const updateData = {
          ...formData,
          capacity_gallons: parseFloat(formData.capacity_gallons),
          total_fills: parseInt(formData.total_fills) || 0,
          purchase_date: formData.purchase_date || null,
          last_cip_date: formData.last_cip_date || null,
          purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
          annual_maintenance_cost: formData.annual_maintenance_cost ? parseFloat(formData.annual_maintenance_cost) : null,
          estimated_replacement_cost: formData.estimated_replacement_cost ? parseFloat(formData.estimated_replacement_cost) : null
        };

        const { error: updateError } = await updateContainer(id, updateData);
        if (updateError) throw updateError;
      }

      await loadVesselData();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating vessel:', err);
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vessel?')) return;

    try {
      const { error: deleteError } = await deleteContainer(id);
      if (deleteError) throw deleteError;
      if (onBack) {
        onBack();
      } else {
        navigate('/production?view=containers');
      }
    } catch (err) {
      console.error('Error deleting vessel:', err);
      setError(err.message);
    }
  };

  const getContainerIcon = (type) => {
    switch (type) {
      case 'barrel': return Barrel;
      case 'tank': return Package;
      case 'tote': return Droplet;
      default: return Package;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'empty': return 'bg-gray-100 text-gray-700';
      case 'in_use': return 'bg-green-100 text-green-700';
      case 'cleaning': return 'bg-blue-100 text-blue-700';
      case 'needs_cip': return 'bg-orange-100 text-orange-700';
      case 'sanitized': return 'bg-emerald-100 text-emerald-700';
      case 'needs_repair': return 'bg-red-100 text-red-700';
      case 'retired': return 'bg-gray-300 text-gray-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7C203A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading vessel details...</p>
        </div>
      </div>
    );
  }

  if (error || !container) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Vessel not found'}</p>
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                navigate('/production?view=containers');
              }
            }}
            className="mt-4 text-[#7C203A] hover:underline"
          >
            ← Back to Vessels
          </button>
        </div>
      </div>
    );
  }

  const Icon = getContainerIcon(container.type);

  // Calculate fill percentage
  const fillPercentage = currentVolume && container
    ? Math.min((currentVolume / container.capacity_gallons) * 100, 100)
    : 0;

  // Handle volume change
  const handleVolumeChange = (newVolume) => {
    const volume = parseFloat(newVolume) || 0;
    const maxVolume = container?.capacity_gallons || 0;
    setCurrentVolume(Math.min(Math.max(0, volume), maxVolume));
  };

  // Save volume to database
  const saveVolume = async () => {
    try {
      const { error: updateError } = await updateContainer(id, {
        current_volume_gallons: currentVolume
      });
      if (updateError) throw updateError;

      // Reload data to confirm save
      await loadVesselData();
    } catch (err) {
      console.error('Error saving volume:', err);
      setError(err.message);
    }
  };

  // Load available lots for assignment
  const loadAvailableLots = async () => {
    try {
      const { data: lotsData, error: lotsError } = await listLots();
      if (lotsError) throw lotsError;

      // Valid statuses depend on vessel type
      let validStatuses;

      if (container.type === 'barrel') {
        // Barrels: secondary fermentation, aging, blending, filtering
        // NOT primary fermenting
        validStatuses = ['pressed', 'aging', 'blending', 'filtering'];
      } else if (container.type === 'tank') {
        // Tanks: primary fermentation, aging, blending, filtering
        validStatuses = ['fermenting', 'pressed', 'aging', 'blending', 'filtering'];
      } else {
        // Totes, IBCs, bins, etc: flexible
        validStatuses = ['fermenting', 'pressed', 'aging', 'blending', 'filtering'];
      }

      // Filter to show only lots that:
      // 1. Aren't already in a container (or are in this container)
      // 2. Have appropriate status for this vessel type
      const available = lotsData?.filter(l =>
        (!l.container_id || l.container_id === id) &&
        validStatuses.includes(l.status)
      ) || [];

      setAvailableLots(available);
      setShowLotPicker(true);
    } catch (err) {
      console.error('Error loading lots:', err);
      setError(err.message);
    }
  };

  // Assign a lot to this vessel
  const assignLotToVessel = async (lotId) => {
    try {
      // Find the lot to get its volume
      const lotToAssign = availableLots.find(l => l.id === lotId);
      const volume = lotToAssign?.current_volume_gallons || 0;

      const { error: updateError } = await updateLot(lotId, {
        container_id: id
      });
      if (updateError) throw updateError;

      // Log vessel history event
      try {
        await logLotAssignment(id, lotId, volume);
      } catch (historyError) {
        console.error('Error logging vessel history:', historyError);
        // Don't throw - this is non-critical
      }

      setShowLotPicker(false);
      await loadVesselData();
    } catch (err) {
      console.error('Error assigning lot:', err);
      setError(err.message);
    }
  };

  // Unassign the current lot from this vessel
  const unassignLot = async () => {
    if (!lot) return;
    if (!confirm('Remove this lot from the vessel?')) return;

    try {
      const { error: updateError } = await updateLot(lot.id, {
        container_id: null
      });
      if (updateError) throw updateError;

      // Log vessel history event
      try {
        await logLotRemoval(id, lot.id, 'User removed lot from vessel');
      } catch (historyError) {
        console.error('Error logging vessel history:', historyError);
        // Don't throw - this is non-critical
      }

      await loadVesselData();
    } catch (err) {
      console.error('Error unassigning lot:', err);
      setError(err.message);
    }
  };

  // Determine cleanliness indicator
  const getCleanlinessStatus = () => {
    if (container.status === 'cleaning') return { label: 'Cleaning', color: 'blue', icon: '🧼' };
    if (container.status === 'needs_cip') return { label: 'Needs Cleaning', color: 'orange', icon: '⚠️' };
    if (container.status === 'sanitized') return { label: 'Sanitized', color: 'green', icon: '✓' };
    if (container.status === 'needs_repair') return { label: 'Needs Repair', color: 'red', icon: '🔧' };
    if (container.last_cip_date) {
      const daysSinceCIP = Math.floor((new Date() - new Date(container.last_cip_date)) / (1000 * 60 * 60 * 24));
      if (daysSinceCIP > 30) return { label: 'CIP Overdue', color: 'red', icon: '⚠️' };
      if (daysSinceCIP > 14) return { label: 'CIP Soon', color: 'yellow', icon: '⏰' };
      return { label: 'Clean', color: 'green', icon: '✓' };
    }
    return { label: 'Unknown', color: 'gray', icon: '?' };
  };

  const cleanlinessStatus = getCleanlinessStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else if (fromView) {
                // Navigate back to the view they came from
                navigate(`/production?view=${fromView}`);
              } else {
                // Default fallback - go back in history
                navigate(-1);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{container.name}</h1>
            <p className="text-gray-600 mt-1 capitalize">
              {container.type} • {container.capacity_gallons} gallons
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadVesselData();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('contents')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'contents'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Current Contents
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vessel Details
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'analytics'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'contents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Visual Status */}
          <div className="space-y-6 lg:order-2">
          {/* Visual Vessel Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Vessel Status</h2>

            {/* Fill Level Indicator */}
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-xs">
                {/* Fill percentage display */}
                <div className="text-center mb-3">
                  <div className="text-4xl font-bold text-gray-900">{fillPercentage.toFixed(0)}%</div>
                  <div className="text-sm text-gray-600">Full</div>
                </div>

                {/* Vertical fill bar */}
                <div className="relative h-64 bg-gray-100 rounded-lg border-2 border-gray-300 overflow-hidden">
                  {/* Fill level */}
                  <div
                    className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                    style={{
                      height: `${fillPercentage}%`,
                      background: `linear-gradient(to top, #422833, #5a3644)`
                    }}
                  >
                    {/* Liquid surface shine */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white opacity-30"></div>
                  </div>

                  {/* Volume markers */}
                  <div className="absolute inset-0 flex flex-col justify-between py-2 px-1">
                    {[100, 75, 50, 25, 0].map((mark) => (
                      <div key={mark} className="flex items-center justify-between text-xs text-gray-500 font-medium">
                        <span className="bg-white px-1 rounded">{mark}%</span>
                        <div className="flex-1 mx-2 border-t border-gray-300"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Controls */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Volume (gallons)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max={container.capacity_gallons}
                    step="0.1"
                    value={currentVolume}
                    onChange={(e) => handleVolumeChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleVolumeChange(0)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Empty
                  </button>
                  <button
                    onClick={() => handleVolumeChange(container.capacity_gallons)}
                    className="px-3 py-2 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                    style={{ backgroundColor: '#422833' }}
                  >
                    Fill
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="range"
                  min="0"
                  max={container.capacity_gallons}
                  step="0.1"
                  value={currentVolume}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#422833'
                  }}
                />
              </div>

              <div>
                <button
                  onClick={saveVolume}
                  className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
                >
                  Save Volume
                </button>
              </div>
            </div>

            {/* Volume indicators */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Volume:</span>
                <span className="font-bold text-gray-900">{currentVolume.toFixed(1)} gal</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-bold text-gray-900">{container.capacity_gallons} gal</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available:</span>
                <span className="font-bold text-gray-900">
                  {(container.capacity_gallons - currentVolume).toFixed(1)} gal
                </span>
              </div>
            </div>

            {/* Cleanliness Status */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Cleanliness</h3>
              <div className={`p-3 rounded-lg border-2 ${
                cleanlinessStatus.color === 'green' ? 'bg-green-50 border-green-200' :
                cleanlinessStatus.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                cleanlinessStatus.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                cleanlinessStatus.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                cleanlinessStatus.color === 'red' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cleanlinessStatus.icon}</span>
                  <div>
                    <p className={`font-bold ${
                      cleanlinessStatus.color === 'green' ? 'text-green-700' :
                      cleanlinessStatus.color === 'blue' ? 'text-blue-700' :
                      cleanlinessStatus.color === 'yellow' ? 'text-yellow-700' :
                      cleanlinessStatus.color === 'orange' ? 'text-orange-700' :
                      cleanlinessStatus.color === 'red' ? 'text-red-700' :
                      'text-gray-700'
                    }`}>
                      {cleanlinessStatus.label}
                    </p>
                    {container.last_cip_date && (
                      <p className="text-xs text-gray-600">
                        Last CIP: {new Date(container.last_cip_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Status Badge */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Status</h3>
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${getStatusColor(container.status)}`}>
                {container.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

          {/* Main Info */}
          <div className="lg:col-span-2 lg:order-1 space-y-6">
            {/* Current Contents - Main Info Card */}
            {lot ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-slate-800" />
                    <h2 className="text-lg font-bold text-gray-900">What's Inside</h2>
                  </div>
                  {isEditing && activeTab === 'contents' && (
                    <div className="flex gap-2">
                      <button
                        onClick={loadAvailableLots}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        Change Lot
                      </button>
                      <button
                        onClick={unassignLot}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                      >
                        Remove Lot
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Lot Name</p>
                    <p className="text-2xl font-bold text-gray-900">{lot.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Varietal</p>
                    <p className="text-2xl font-bold text-gray-900">{lot.varietal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vintage</p>
                    <p className="text-2xl font-bold text-gray-900">{lot.vintage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Appellation</p>
                    <p className="text-2xl font-bold text-gray-900">{lot.appellation || '—'}</p>
                  </div>
                  {lot.block_id && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Source Field</p>
                      <p className="text-lg font-bold text-gray-900">Field #{lot.block_id.substring(0, 8)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold capitalize">
                      {lot.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                <Droplet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">This vessel is currently empty</p>
                <p className="text-sm text-gray-500 mt-1">No lot assigned to this container</p>
                <button
                  onClick={loadAvailableLots}
                  className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors inline-flex items-center gap-2"
                >
                  <Droplet className="w-4 h-4" />
                  Assign a Lot
                </button>
              </div>
            )}

            {/* Fermentation Details */}
            {lot && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Fermentation Status</h2>
                </div>

                {isEditing && activeTab === 'contents' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Brix (°)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={contentsFormData.current_brix}
                        onChange={(e) => setContentsFormData({...contentsFormData, current_brix: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">pH</label>
                      <input
                        type="number"
                        step="0.01"
                        value={contentsFormData.current_ph}
                        onChange={(e) => setContentsFormData({...contentsFormData, current_ph: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">TA (g/L)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={contentsFormData.current_ta}
                        onChange={(e) => setContentsFormData({...contentsFormData, current_ta: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Temperature (°F)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={contentsFormData.current_temp_f}
                        onChange={(e) => setContentsFormData({...contentsFormData, current_temp_f: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Alcohol (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={contentsFormData.current_alcohol_pct}
                        onChange={(e) => setContentsFormData({...contentsFormData, current_alcohol_pct: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Status</label>
                      <select
                        value={contentsFormData.status}
                        onChange={(e) => setContentsFormData({...contentsFormData, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="planning">Planning</option>
                        <option value="harvested">Harvested</option>
                        <option value="crushing">Crushing</option>
                        <option value="fermenting">Fermenting</option>
                        <option value="pressed">Pressed</option>
                        <option value="aging">Aging</option>
                        <option value="blending">Blending</option>
                        <option value="filtering">Filtering</option>
                        <option value="bottled">Bottled</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {lot.current_brix && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Brix</p>
                      <p className="text-lg font-bold text-gray-900">{lot.current_brix}°</p>
                    </div>
                  )}
                  {lot.current_ph && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">pH</p>
                      <p className="text-lg font-bold text-gray-900">{lot.current_ph}</p>
                    </div>
                  )}
                  {lot.current_ta && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">TA</p>
                      <p className="text-lg font-bold text-gray-900">{lot.current_ta} g/L</p>
                    </div>
                  )}
                  {lot.current_temp_f && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Temperature</p>
                      <p className="text-lg font-bold text-gray-900">{lot.current_temp_f}°F</p>
                    </div>
                  )}
                  {lot.current_alcohol_pct && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Alcohol</p>
                      <p className="text-lg font-bold text-gray-900">{lot.current_alcohol_pct}%</p>
                    </div>
                  )}
                  {lot.harvest_date && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Harvest Date</p>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(lot.harvest_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vessel Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Vessel Specifications</h2>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="tank">Tank</option>
                    <option value="barrel">Barrel</option>
                    <option value="tote">Tote</option>
                    <option value="ibc">IBC</option>
                    <option value="bin">Bin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (gal)</label>
                  <input
                    type="number"
                    value={formData.capacity_gallons}
                    onChange={(e) => setFormData({...formData, capacity_gallons: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="empty">Empty</option>
                    <option value="in_use">In Use</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="needs_cip">Needs CIP</option>
                    <option value="sanitized">Sanitized</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <select
                    value={formData.material}
                    onChange={(e) => setFormData({...formData, material: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="stainless">Stainless Steel</option>
                    <option value="oak_french">French Oak</option>
                    <option value="oak_american">American Oak</option>
                    <option value="oak_hungarian">Hungarian Oak</option>
                    <option value="concrete">Concrete</option>
                    <option value="plastic">Plastic</option>
                  </select>
                </div>
                {container.type === 'barrel' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cooperage</label>
                      <input
                        type="text"
                        value={formData.cooperage}
                        onChange={(e) => setFormData({...formData, cooperage: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Toast Level</label>
                      <input
                        type="text"
                        value={formData.toast_level}
                        onChange={(e) => setFormData({...formData, toast_level: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Fills</label>
                      <input
                        type="number"
                        value={formData.total_fills}
                        onChange={(e) => setFormData({...formData, total_fills: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                      <input
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last CIP Date</label>
                  <input
                    type="date"
                    value={formData.last_cip_date}
                    onChange={(e) => setFormData({...formData, last_cip_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CIP Product</label>
                  <input
                    type="text"
                    value={formData.cip_product}
                    onChange={(e) => setFormData({...formData, cip_product: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({...formData, purchase_cost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Maintenance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.annual_maintenance_cost}
                    onChange={(e) => setFormData({...formData, annual_maintenance_cost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Replacement Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estimated_replacement_cost}
                    onChange={(e) => setFormData({...formData, estimated_replacement_cost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Basic Info */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Type</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">{container.type}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Capacity</p>
                  <p className="text-sm font-bold text-gray-900">{container.capacity_gallons} gal</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Material</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">{container.material?.replace('_', ' ') || '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Location</p>
                  <p className="text-sm font-bold text-gray-900">{container.location || '—'}</p>
                </div>

                {/* Barrel-specific fields */}
                {container.type === 'barrel' && (
                  <>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Cooperage</p>
                      <p className="text-sm font-bold text-gray-900">{container.cooperage || '—'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Toast Level</p>
                      <p className="text-sm font-bold text-gray-900">{container.toast_level || '—'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Total Fills</p>
                      <p className="text-sm font-bold text-gray-900">{container.total_fills || 0}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Purchase Date</p>
                      <p className="text-sm font-bold text-gray-900">
                        {container.purchase_date ? new Date(container.purchase_date).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </>
                )}

                {/* CIP fields */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Last CIP</p>
                  <p className="text-sm font-bold text-gray-900">
                    {container.last_cip_date ? new Date(container.last_cip_date).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">CIP Product</p>
                  <p className="text-sm font-bold text-gray-900">{container.cip_product || '—'}</p>
                </div>
              </div>
            )}

            {container.notes && !isEditing && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Notes</p>
                <p className="text-sm text-gray-900">{container.notes}</p>
              </div>
            )}
          </div>

          {/* Cleanliness Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Maintenance & Cleanliness</h3>
            <div className={`p-4 rounded-lg border-2 ${
              cleanlinessStatus.color === 'green' ? 'bg-green-50 border-green-200' :
              cleanlinessStatus.color === 'blue' ? 'bg-blue-50 border-blue-200' :
              cleanlinessStatus.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
              cleanlinessStatus.color === 'orange' ? 'bg-orange-50 border-orange-200' :
              cleanlinessStatus.color === 'red' ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{cleanlinessStatus.icon}</span>
                <div className="flex-1">
                  <p className={`font-bold text-lg ${
                    cleanlinessStatus.color === 'green' ? 'text-green-700' :
                    cleanlinessStatus.color === 'blue' ? 'text-blue-700' :
                    cleanlinessStatus.color === 'yellow' ? 'text-yellow-700' :
                    cleanlinessStatus.color === 'orange' ? 'text-orange-700' :
                    cleanlinessStatus.color === 'red' ? 'text-red-700' :
                    'text-gray-700'
                  }`}>
                    {cleanlinessStatus.label}
                  </p>
                  {container.last_cip_date && (
                    <p className="text-sm text-gray-600 mt-1">
                      Last CIP: {new Date(container.last_cip_date).toLocaleDateString()}
                    </p>
                  )}
                  {container.cip_product && (
                    <p className="text-sm text-gray-600">
                      Product: {container.cip_product}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Current Status Badge */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Current Status</h4>
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${getStatusColor(container.status)}`}>
                {container.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <VesselAnalytics containerId={id} container={container} />
      )}

      {/* Lot Picker Modal */}
      {showLotPicker && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Assign Lot to {container.name}</h2>
                <button
                  onClick={() => setShowLotPicker(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Select a lot to assign to this vessel</p>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-6">
              {availableLots.length === 0 ? (
                <div className="text-center py-8">
                  <Droplet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No available lots</p>
                  <p className="text-sm text-gray-500 mt-1">Create a lot in Harvest Intake first</p>
                  <button
                    onClick={() => {
                      setShowLotPicker(false);
                      navigate('/production?view=harvest');
                    }}
                    className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Go to Harvest Intake
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableLots.map((availableLot) => (
                    <button
                      key={availableLot.id}
                      onClick={() => assignLotToVessel(availableLot.id)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-slate-800 hover:bg-gray-50 transition-all text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{availableLot.name}</h3>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Varietal:</span>{' '}
                              <span className="font-medium text-gray-900">{availableLot.varietal}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Vintage:</span>{' '}
                              <span className="font-medium text-gray-900">{availableLot.vintage}</span>
                            </div>
                            {availableLot.volume_gallons && (
                              <div>
                                <span className="text-gray-600">Volume:</span>{' '}
                                <span className="font-medium text-gray-900">{availableLot.volume_gallons} gal</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Status:</span>{' '}
                              <span className="font-medium text-gray-900 capitalize">
                                {availableLot.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowLotPicker(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
