import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Beaker, Plus, TrendingUp, AlertTriangle, Calendar,
  Droplets, Activity, CheckCircle2, Filter, ListTodo, Target,
  BarChart3, FlaskConical, ChevronDown, X, Sparkles, Pencil
} from 'lucide-react';
import { listLots, createFermentationLog, listFermentationLogs, updateFermentationLog, updateLot } from '@/shared/lib/productionApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

// Wine style spec ranges
const WINE_SPEC_PROFILES = {
  'white_dry': {
    name: 'Dry White',
    ph: { min: 3.0, max: 3.4, ideal: '3.1-3.3' },
    ta: { min: 6, max: 9, ideal: '7-8 g/L' },
    free_so2: { min: 25, max: 40, ideal: '30-35 ppm' },
    va: { max: 0.7, ideal: '<0.5 g/L' },
    alcohol: { min: 11, max: 14, ideal: '12-13%' }
  },
  'white_sweet': {
    name: 'Sweet White',
    ph: { min: 3.0, max: 3.5, ideal: '3.2-3.4' },
    ta: { min: 6, max: 10, ideal: '7-9 g/L' },
    free_so2: { min: 30, max: 50, ideal: '35-45 ppm' },
    va: { max: 0.6, ideal: '<0.4 g/L' },
    alcohol: { min: 9, max: 12, ideal: '10-11%' }
  },
  'red_light': {
    name: 'Light Red (Pinot)',
    ph: { min: 3.4, max: 3.8, ideal: '3.5-3.7' },
    ta: { min: 5.5, max: 7.5, ideal: '6-7 g/L' },
    free_so2: { min: 20, max: 35, ideal: '25-30 ppm' },
    va: { max: 0.8, ideal: '<0.6 g/L' },
    alcohol: { min: 12, max: 15, ideal: '13-14%' }
  },
  'red_full': {
    name: 'Full-Bodied Red (Cab, Syrah)',
    ph: { min: 3.5, max: 3.9, ideal: '3.6-3.8' },
    ta: { min: 5, max: 7, ideal: '5.5-6.5 g/L' },
    free_so2: { min: 20, max: 35, ideal: '25-30 ppm' },
    va: { max: 0.9, ideal: '<0.7 g/L' },
    alcohol: { min: 13, max: 16, ideal: '14-15%' }
  },
  'sparkling': {
    name: 'Sparkling Wine',
    ph: { min: 3.0, max: 3.3, ideal: '3.0-3.2' },
    ta: { min: 7, max: 10, ideal: '8-9 g/L' },
    free_so2: { min: 20, max: 35, ideal: '25-30 ppm' },
    va: { max: 0.5, ideal: '<0.3 g/L' },
    alcohol: { min: 11, max: 13, ideal: '12%' }
  },
  'dessert': {
    name: 'Dessert Wine',
    ph: { min: 3.2, max: 3.8, ideal: '3.4-3.6' },
    ta: { min: 5, max: 8, ideal: '6-7 g/L' },
    free_so2: { min: 40, max: 80, ideal: '50-60 ppm' },
    va: { max: 0.8, ideal: '<0.6 g/L' },
    alcohol: { min: 15, max: 20, ideal: '17-18%' }
  }
};

export function WineAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLabHistoryModal, setShowLabHistoryModal] = useState(false);
  const [lotLabsMap, setLotLabsMap] = useState({}); // Store labs for each lot
  const [editingLab, setEditingLab] = useState(null); // Track which lab is being edited in modal
  const [statusFilter, setStatusFilter] = useState('aging'); // Default to aging

  // URL parameter is the ONLY source of truth for lot selection when present
  const lotParam = searchParams.get('lot');
  // Lot IDs can be UUIDs (strings) or integers - keep as string for comparison
  const lotParamId = lotParam;

  // Track which lot param we've already auto-opened the modal for (prevents re-opening on re-renders)
  const openedForLotRef = useRef(null);

  const [formData, setFormData] = useState({
    ph: '',
    ta: '',
    free_so2: '',
    total_so2: '',
    va: '',
    malic_acid: '',
    lactic_acid: '',
    alcohol_pct: '',
    residual_sugar: '',
    notes: ''
  });

  // STRICT FIX: Reset modal and ref whenever lotParam changes
  useEffect(() => {
    openedForLotRef.current = null;
    setShowForm(false);
  }, [lotParam]);

  // Load lots data on mount AND when lotParam changes (to handle navigation from other pages)
  useEffect(() => {
    loadData();
  }, [lotParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // STRICT FIX: Only auto-open modal when selectedLot.id matches lotParam (gated)
  useEffect(() => {
    if (!lotParamId) return;
    if (!selectedLot) return;
    // Compare as strings to handle both UUID and integer IDs
    if (String(selectedLot.id) !== String(lotParamId)) return;
    if (openedForLotRef.current === lotParamId) return;

    // All gates passed - open modal
    openedForLotRef.current = lotParamId;
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lotParamId, selectedLot?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showForm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error: lotsError } = await listLots();
      if (lotsError) throw lotsError;

      const activeLots = (data || []).filter(lot =>
        !lot.archived_at && ['fermenting', 'aging', 'pressed', 'blending', 'filtering'].includes(lot.status)
      );

      // Deduplicate lots by ID (in case of database duplicates)
      const uniqueLots = Array.from(
        new Map(activeLots.map(lot => [lot.id, lot])).values()
      );

      setLots(uniqueLots);

      // Preload latest lab for each lot (for card previews)
      const labsMap = {};
      await Promise.all(
        activeLots.map(async (lot) => {
          try {
            const { data: labData, error: labsError } = await listFermentationLogs(lot.id);
            if (labsError) throw labsError;

            const labs = (labData || []).filter(log =>
              log.ph || log.ta || log.free_so2 || log.total_so2 || log.va || log.alcohol_pct
            );
            labs.sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
            labsMap[lot.id] = labs;
          } catch (err) {
            console.error(`Error loading labs for lot ${lot.id}:`, err);
            labsMap[lot.id] = [];
          }
        })
      );
      setLotLabsMap(labsMap);

      // STRICT FIX: URL param is ONLY source of truth for lot selection
      const lotParam = searchParams.get('lot');

      if (lotParam) {
        // URL param exists - find and select that specific lot ONLY
        // Lot IDs can be UUIDs (strings) or integers - compare as strings
        const targetLot = activeLots.find(lot => String(lot.id) === String(lotParam));

        if (targetLot) {
          setSelectedLot(targetLot);
        }
        // IMPORTANT: Do NOT auto-select first lot when lotParam exists
        return;
      }

      // No URL parameter - normal behavior: auto-select first lot
      if (activeLots.length > 0) {
        setSelectedLot(activeLots[0]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLabs = async (lotId) => {
    try {
      const { data, error: labsError } = await listFermentationLogs(lotId);
      if (labsError) throw labsError;

      // Filter for lab-specific logs (those with chemistry data)
      const labData = (data || []).filter(log =>
        log.ph || log.ta || log.free_so2 || log.total_so2 || log.va || log.alcohol_pct
      );

      // Sort by date descending
      labData.sort((a, b) => new Date(b.log_date) - new Date(a.log_date));

      setLabs(labData);
    } catch (err) {
      console.error('Error loading lab data:', err);
    }
  };

  // Load labs for a specific lot and store in map
  const loadLabsForLot = async (lotId) => {
    try {
      const { data, error: labsError } = await listFermentationLogs(lotId);
      if (labsError) throw labsError;

      const labData = (data || []).filter(log =>
        log.ph || log.ta || log.free_so2 || log.total_so2 || log.va || log.alcohol_pct
      );
      labData.sort((a, b) => new Date(b.log_date) - new Date(a.log_date));

      setLotLabsMap(prev => ({ ...prev, [lotId]: labData }));
    } catch (err) {
      console.error('Error loading lab data:', err);
    }
  };

  // Handle clicking a lot - select it and optionally show history
  const handleSelectLot = async (lot) => {
    setSelectedLot(lot);
    // Update URL parameter to keep selected lot in URL
    setSearchParams({ lot: lot.id });
    // Load labs for this lot if not already loaded
    if (!lotLabsMap[lot.id]) {
      await loadLabsForLot(lot.id);
    }
  };

  // Open lab history modal
  const handleShowHistory = async (lot, e) => {
    e.stopPropagation(); // Prevent card selection
    setSelectedLot(lot);
    if (!lotLabsMap[lot.id]) {
      await loadLabsForLot(lot.id);
    }
    setShowLabHistoryModal(true);
  };

  useEffect(() => {
    if (selectedLot) {
      loadLabs(selectedLot.id);
    }
  }, [selectedLot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const labData = {
        lot_id: selectedLot.id,
        log_date: new Date().toISOString(),
        ph: formData.ph ? parseFloat(formData.ph) : null,
        ta: formData.ta ? parseFloat(formData.ta) : null,
        free_so2: formData.free_so2 ? parseFloat(formData.free_so2) : null,
        total_so2: formData.total_so2 ? parseFloat(formData.total_so2) : null,
        va: formData.va ? parseFloat(formData.va) : null,
        malic_acid: formData.malic_acid ? parseFloat(formData.malic_acid) : null,
        lactic_acid: formData.lactic_acid ? parseFloat(formData.lactic_acid) : null,
        alcohol_pct: formData.alcohol_pct ? parseFloat(formData.alcohol_pct) : null,
        residual_sugar: formData.residual_sugar ? parseFloat(formData.residual_sugar) : null,
        notes: formData.notes || null
      };

      const { error: createError } = await createFermentationLog(labData);
      if (createError) throw createError;

      // CRITICAL: Propagate alcohol_pct to parent lot if provided
      if (labData.alcohol_pct) {
        await updateLot(selectedLot.id, {
          alcohol_pct: labData.alcohol_pct,
          last_analysis_date: labData.log_date
        });
        setSuccess('Lab results saved successfully. Bottling readiness updated with new Alcohol %.');
      } else {
        setSuccess('Lab results saved successfully');
      }

      resetForm();
      loadLabs(selectedLot.id);
      loadData(); // Reload lots to refresh alcohol_pct

      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('Error saving lab:', err);
      setError(err.message);
    }
  };

  const handleUpdateLab = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!editingLab) return;

    try {
      const updates = {
        ph: formData.ph ? parseFloat(formData.ph) : null,
        ta: formData.ta ? parseFloat(formData.ta) : null,
        free_so2: formData.free_so2 ? parseFloat(formData.free_so2) : null,
        total_so2: formData.total_so2 ? parseFloat(formData.total_so2) : null,
        va: formData.va ? parseFloat(formData.va) : null,
        malic_acid: formData.malic_acid ? parseFloat(formData.malic_acid) : null,
        lactic_acid: formData.lactic_acid ? parseFloat(formData.lactic_acid) : null,
        alcohol_pct: formData.alcohol_pct ? parseFloat(formData.alcohol_pct) : null,
        residual_sugar: formData.residual_sugar ? parseFloat(formData.residual_sugar) : null,
        notes: formData.notes || null
      };

      const { error: updateError } = await updateFermentationLog(editingLab.id, updates);
      if (updateError) throw updateError;

      // CRITICAL: Propagate alcohol_pct to parent lot if provided
      if (updates.alcohol_pct) {
        await updateLot(selectedLot.id, {
          alcohol_pct: updates.alcohol_pct,
          last_analysis_date: editingLab.log_date
        });
        setSuccess('Lab test updated successfully. Bottling readiness updated with new Alcohol %.');
      } else {
        setSuccess('Lab test updated successfully');
      }

      // Refresh the labs for the modal
      await loadLabsForLot(selectedLot.id);
      // Refresh the main labs view
      await loadLabs(selectedLot.id);
      // Reload lots to refresh alcohol_pct
      await loadData();

      setEditingLab(null);
      resetForm();

      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('Error updating lab:', err);
      setError(err.message);
    }
  };

  const handleStartEdit = (lab) => {
    setEditingLab(lab);
    setFormData({
      ph: lab.ph || '',
      ta: lab.ta || '',
      free_so2: lab.free_so2 || '',
      total_so2: lab.total_so2 || '',
      va: lab.va || '',
      malic_acid: lab.malic_acid || '',
      lactic_acid: lab.lactic_acid || '',
      alcohol_pct: lab.alcohol_pct || '',
      residual_sugar: lab.residual_sugar || '',
      notes: lab.notes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingLab(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      ph: '',
      ta: '',
      free_so2: '',
      total_so2: '',
      va: '',
      malic_acid: '',
      lactic_acid: '',
      alcohol_pct: '',
      residual_sugar: '',
      notes: ''
    });
    setShowForm(false);
    setEditingLab(null);

    // Clear the lot parameter from URL and reset the ref
    const currentLotParam = searchParams.get('lot');
    if (currentLotParam) {
      searchParams.delete('lot');
      setSearchParams(searchParams);
    }
    openedForLotRef.current = null;
  };

  const getChartData = (metric) => {
    if (!labs || labs.length === 0) return [];

    // Reverse to show chronological order (oldest to newest)
    return [...labs].reverse()
      .map((lab) => ({
        date: new Date(lab.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: lab[metric],
        fullDate: lab.log_date
      }))
      .filter(d => d.value !== null && d.value !== undefined);
  };

  const getStatusColor = (value, min, max, type = 'normal') => {
    if (value === null || value === undefined) return 'text-gray-400';

    if (type === 'va') {
      // VA - lower is better
      if (value > max) return 'text-red-600 font-bold';
      if (value > max * 0.8) return 'text-amber-600 font-semibold';
      return 'text-green-600 font-semibold';
    }

    // Normal ranges
    if (value < min || value > max) return 'text-amber-600 font-semibold';
    return 'text-green-600 font-semibold';
  };

  const getMLFStatus = () => {
    if (!labs.length) return null;
    const latest = labs[0];

    if (latest.malic_acid !== null && latest.malic_acid !== undefined &&
        latest.lactic_acid !== null && latest.lactic_acid !== undefined) {
      const malicToLactic = latest.lactic_acid / (latest.malic_acid + latest.lactic_acid);

      if (malicToLactic > 0.9 && latest.malic_acid < 0.3) {
        return { status: 'complete', color: 'green', message: 'MLF Complete', detail: `Malic: ${latest.malic_acid} g/L, Lactic: ${latest.lactic_acid} g/L` };
      }
      if (malicToLactic > 0.5) {
        return { status: 'active', color: 'amber', message: 'MLF In Progress', detail: `~${(malicToLactic * 100).toFixed(0)}% complete` };
      }
      return { status: 'pending', color: 'blue', message: 'MLF Not Started', detail: `Malic: ${latest.malic_acid} g/L` };
    }

    return null;
  };

  const getSO2Recommendation = () => {
    if (!labs.length || !selectedLot) return null;
    const latest = labs[0];

    if (!latest.ph || !latest.free_so2) return null;

    const profile = selectedLot.wine_profile ? WINE_SPEC_PROFILES[selectedLot.wine_profile] : null;
    const targetMin = profile?.free_so2.min || 25;

    if (latest.free_so2 < targetMin) {
      const needed = targetMin - latest.free_so2;
      const volumeGal = selectedLot.current_volume_gallons || 100;
      const gramsNeeded = (needed * volumeGal * 3.785) / 570;

      return {
        type: 'warning',
        message: `Free SO₂ is ${latest.free_so2} ppm (target: ${targetMin}+ ppm)`,
        action: `Add approximately ${gramsNeeded.toFixed(1)}g potassium metabisulfite for ${volumeGal} gallons`
      };
    }

    return null;
  };

  const mlfStatus = getMLFStatus();
  const so2Rec = getSO2Recommendation();
  const profile = selectedLot?.wine_profile ? WINE_SPEC_PROFILES[selectedLot.wine_profile] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7C203A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading wine analysis data...</p>
        </div>
      </div>
    );
  }

  if (lots.length === 0) {
    return (
      <div className="pt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Wine Analysis</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Beaker className="w-8 h-8 text-[#7C203A]" />
          </div>
          <p className="text-gray-600 font-medium mb-2">No Active Lots for Analysis</p>
          <p className="text-sm text-gray-500">Create lots in Harvest Intake to begin tracking wine chemistry</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wine Analysis</h2>
          <p className="text-gray-600 mt-1">Track chemistry and lab results for your lots</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedLot && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Lab Test
            </button>
          )}
        </div>
      </div>

      {/* Lab Entry Modal */}
      {showForm && selectedLot && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">New Lab Analysis</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedLot.name} • {selectedLot.varietal} {selectedLot.vintage}</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Core Panel */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-[#7C203A] to-[#8B2E48] rounded-full"></div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Core Panel</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <span>pH</span>
                    <span className="relative group">
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded cursor-help">
                        Bottling
                      </span>
                      <span className="invisible group-hover:visible group-focus-within:visible absolute left-0 top-full mt-1 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 pointer-events-none">
                        Used to assess wine stability and sulfite effectiveness before bottling
                      </span>
                    </span>
                  </label>
                  {labs.length > 0 && labs[0].ph && (
                    <p className="text-xs text-gray-500 mb-1">Last: {labs[0].ph}</p>
                  )}
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ph}
                    onChange={(e) => setFormData({...formData, ph: e.target.value})}
                    placeholder="3.45"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                  {selectedLot?.wine_profile && formData.ph && (
                    <p className="text-xs text-gray-600 mt-1">
                      {(() => {
                        const profile = WINE_SPEC_PROFILES[selectedLot.wine_profile];
                        const val = parseFloat(formData.ph);
                        if (val < profile.ph.min) return `⬇ Below ideal (${profile.ph.ideal})`;
                        if (val > profile.ph.max) return `⬆ Above ideal (${profile.ph.ideal})`;
                        return `✓ In range (${profile.ph.ideal})`;
                      })()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">TA (g/L)</label>
                  {labs.length > 0 && labs[0].ta && (
                    <p className="text-xs text-gray-500 mb-1">Last: {labs[0].ta}</p>
                  )}
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ta}
                    onChange={(e) => setFormData({...formData, ta: e.target.value})}
                    placeholder="6.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                  {selectedLot?.wine_profile && formData.ta && (
                    <p className="text-xs text-gray-600 mt-1">
                      {(() => {
                        const profile = WINE_SPEC_PROFILES[selectedLot.wine_profile];
                        const val = parseFloat(formData.ta);
                        if (val < profile.ta.min) return `⬇ Below ideal (${profile.ta.ideal})`;
                        if (val > profile.ta.max) return `⬆ Above ideal (${profile.ta.ideal})`;
                        return `✓ In range (${profile.ta.ideal})`;
                      })()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <span>Free SO₂ (ppm)</span>
                    <span className="relative group">
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded cursor-help">
                        Bottling
                      </span>
                      <span className="invisible group-hover:visible group-focus-within:visible absolute left-0 top-full mt-1 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 pointer-events-none">
                        Required to ensure the wine is protected at bottling
                      </span>
                    </span>
                  </label>
                  {labs.length > 0 && labs[0].free_so2 && (
                    <p className="text-xs text-gray-500 mb-1">Last: {labs[0].free_so2}</p>
                  )}
                  <input
                    type="number"
                    step="1"
                    value={formData.free_so2}
                    onChange={(e) => setFormData({...formData, free_so2: e.target.value})}
                    placeholder="28"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                  {selectedLot?.wine_profile && formData.free_so2 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {(() => {
                        const profile = WINE_SPEC_PROFILES[selectedLot.wine_profile];
                        const val = parseFloat(formData.free_so2);
                        if (val < profile.free_so2.min) return `⬇ Below ideal (${profile.free_so2.ideal})`;
                        if (val > profile.free_so2.max) return `⬆ Above ideal (${profile.free_so2.ideal})`;
                        return `✓ In range (${profile.free_so2.ideal})`;
                      })()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Total SO₂ (ppm)</label>
                  {labs.length > 0 && labs[0].total_so2 && (
                    <p className="text-xs text-gray-500 mb-1">Last: {labs[0].total_so2}</p>
                  )}
                  <input
                    type="number"
                    step="1"
                    value={formData.total_so2}
                    onChange={(e) => setFormData({...formData, total_so2: e.target.value})}
                    placeholder="65"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Extended Panel */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full"></div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Extended Analysis</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">VA (g/L)</label>
                  {labs.length > 0 && labs[0].va && (
                    <p className="text-xs text-gray-500 mb-1">Last: {labs[0].va}</p>
                  )}
                  <input
                    type="number"
                    step="0.01"
                    value={formData.va}
                    onChange={(e) => setFormData({...formData, va: e.target.value})}
                    placeholder="0.45"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                  {selectedLot?.wine_profile && formData.va && (
                    <p className="text-xs text-gray-600 mt-1">
                      {(() => {
                        const profile = WINE_SPEC_PROFILES[selectedLot.wine_profile];
                        const val = parseFloat(formData.va);
                        if (val > profile.va.max) return `⬆ Above ideal (${profile.va.ideal})`;
                        return `✓ In range (${profile.va.ideal})`;
                      })()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <span>Alcohol %</span>
                    <span className="relative group">
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded cursor-help">
                        Bottling
                      </span>
                      <span className="invisible group-hover:visible group-focus-within:visible absolute left-0 top-full mt-1 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 pointer-events-none">
                        Legally required for wine labels and bottling compliance
                      </span>
                    </span>
                  </label>
                  {labs.length > 0 && labs[0].alcohol_pct && (
                    <p className="text-xs text-gray-500 mb-1">Last: {labs[0].alcohol_pct}%</p>
                  )}
                  <input
                    type="number"
                    step="0.1"
                    value={formData.alcohol_pct}
                    onChange={(e) => setFormData({...formData, alcohol_pct: e.target.value})}
                    placeholder="13.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                  {selectedLot?.wine_profile && formData.alcohol_pct && (
                    <p className="text-xs text-gray-600 mt-1">
                      {(() => {
                        const profile = WINE_SPEC_PROFILES[selectedLot.wine_profile];
                        const val = parseFloat(formData.alcohol_pct);
                        if (val < profile.alcohol.min) return `⬇ Below ideal (${profile.alcohol.ideal})`;
                        if (val > profile.alcohol.max) return `⬆ Above ideal (${profile.alcohol.ideal})`;
                        return `✓ In range (${profile.alcohol.ideal})`;
                      })()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Residual Sugar (g/L)</label>
                  {labs.length > 0 && labs[0].residual_sugar && (
                    <p className="text-xs text-gray-500 mb-1">Last: {labs[0].residual_sugar}</p>
                  )}
                  <input
                    type="number"
                    step="0.1"
                    value={formData.residual_sugar}
                    onChange={(e) => setFormData({...formData, residual_sugar: e.target.value})}
                    placeholder="2.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* MLF Panel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-amber-600 to-orange-600 rounded-full"></div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Malolactic Fermentation (Optional)</h4>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-4">Track malic → lactic acid conversion. Complete MLF typically shows malic &lt;0.3 g/L and lactic 2-4 g/L.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Malic Acid (g/L)</label>
                  {labs.length > 0 && labs[0].malic_acid && (
                    <p className="text-xs text-gray-500 mb-1">Last: {labs[0].malic_acid}</p>
                  )}
                  <input
                    type="number"
                    step="0.01"
                    value={formData.malic_acid}
                    onChange={(e) => setFormData({...formData, malic_acid: e.target.value})}
                    placeholder="0.15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Lactic Acid (g/L)</label>
                  {labs.length > 0 && labs[0].lactic_acid && (
                    <p className="text-xs text-gray-500 mb-1">Last: {labs[0].lactic_acid}</p>
                  )}
                  <input
                    type="number"
                    step="0.01"
                    value={formData.lactic_acid}
                    onChange={(e) => setFormData({...formData, lactic_acid: e.target.value})}
                    placeholder="2.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lab Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
                placeholder="Observations, conditions, or recommendations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-[#7C203A] to-[#8B2E48] text-white rounded-lg hover:from-[#8B2E48] hover:to-[#7C203A] transition-all shadow-sm font-semibold"
              >
                Save Lab Results
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
          </div>
        </div>,
        document.body
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Lot Selector */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-300 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Select a Lot to Analyze</h3>
              <p className="text-xs text-gray-600">Click a lot, then add lab tests or set wine profile</p>
            </div>
          </div>
          {selectedLot && (
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md font-medium"
            >
              <Target className="w-4 h-4" />
              {selectedLot.wine_profile ? `Profile: ${WINE_SPEC_PROFILES[selectedLot.wine_profile].name}` : 'Set Wine Profile'}
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-[#7C203A] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('fermenting')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'fermenting'
                  ? 'bg-[#7C203A] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Fermenting
            </button>
            <button
              onClick={() => setStatusFilter('aging')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'aging'
                  ? 'bg-[#7C203A] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aging + Ready
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {lots
            .filter((lot) => {
              // Only show lots in barrels
              if (!lot.container || lot.container.type !== 'barrel') return false;

              // Apply status filter
              if (statusFilter === 'all') return true;
              if (statusFilter === 'fermenting') return lot.status === 'fermenting';
              if (statusFilter === 'aging') return ['aging', 'blending', 'ready_to_bottle'].includes(lot.status);
              return true;
            })
            .sort((a, b) => {
              // Natural sort by name (handles "Barrel 1" vs "Barrel 10" correctly)
              return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
            })
            .map((lot) => {
            const isSelected = selectedLot?.id === lot.id;
            const lotLabs = lotLabsMap[lot.id] || [];
            const latestLab = lotLabs[0];

            return (
              <div key={lot.id} className="relative">
                <div
                  className={`w-full p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#7C203A] bg-gradient-to-br from-rose-50 to-purple-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => handleSelectLot(lot)}
                >
                  <div className="mb-2">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-sm text-gray-900 leading-snug flex-1">{lot.name}</p>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium capitalize flex-shrink-0">
                        {lot.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{lot.varietal} • {lot.vintage}</p>
                    {lot.wine_profile && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-[#7C203A] text-white rounded text-xs font-medium">
                        <Sparkles className="w-3 h-3" />
                        {WINE_SPEC_PROFILES[lot.wine_profile].name}
                      </span>
                    )}
                  </div>

                  {latestLab && (
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200 text-xs">
                      {latestLab.ph && (
                        <div>
                          <span className="text-gray-500 block">pH</span>
                          <span className="font-bold text-gray-900">{latestLab.ph}</span>
                        </div>
                      )}
                      {latestLab.ta && (
                        <div>
                          <span className="text-gray-500 block">TA</span>
                          <span className="font-bold text-gray-900">{latestLab.ta}</span>
                        </div>
                      )}
                      {latestLab.free_so2 && (
                        <div>
                          <span className="text-gray-500 block">SO₂</span>
                          <span className="font-bold text-gray-900">{latestLab.free_so2}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!latestLab && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-amber-600 font-medium">No lab data yet</p>
                    </div>
                  )}

                  {/* View History Button */}
                  {lotLabs.length > 0 && (
                    <button
                      onClick={(e) => handleShowHistory(lot, e)}
                      className="mt-3 w-full px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      View {lotLabs.length} Test{lotLabs.length !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedLot && (
        <>
          {/* Wine Profile Suggestion */}
          {!selectedLot.wine_profile && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 shadow-md">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Target className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-blue-900 text-sm mb-1">Set a Wine Profile for Better Analysis</p>
                  <p className="text-sm text-blue-800 mb-3">
                    Choose a wine style to see target ranges for pH, TA, SO₂, and other chemistry parameters.
                  </p>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm font-medium text-sm"
                  >
                    <Target className="w-4 h-4" />
                    Set Wine Profile Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SO2 Recommendation */}
          {so2Rec && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-xl p-4 shadow-md">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <Droplets className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 text-sm mb-1">SO₂ Addition Needed</p>
                  <p className="text-sm text-amber-800">{so2Rec.message}</p>
                  <p className="text-sm text-amber-900 mt-2 font-semibold flex items-center gap-1.5">
                    <span>→</span> {so2Rec.action}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Chemistry Panel */}
          {labs.length > 0 && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-300 shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg">
                    <FlaskConical className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Latest Chemistry Panel</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(labs[0].log_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* MLF Status Badge */}
                {mlfStatus && (
                  <div className={`px-4 py-2 rounded-lg ${
                    mlfStatus.color === 'green' ? 'bg-green-100 border-2 border-green-300' :
                    mlfStatus.color === 'amber' ? 'bg-amber-100 border-2 border-amber-300' :
                    'bg-blue-100 border-2 border-blue-300'
                  }`}>
                    <p className={`text-xs font-semibold ${
                      mlfStatus.color === 'green' ? 'text-green-900' :
                      mlfStatus.color === 'amber' ? 'text-amber-900' :
                      'text-blue-900'
                    }`}>{mlfStatus.message}</p>
                    <p className={`text-xs mt-0.5 ${
                      mlfStatus.color === 'green' ? 'text-green-700' :
                      mlfStatus.color === 'amber' ? 'text-amber-700' :
                      'text-blue-700'
                    }`}>{mlfStatus.detail}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* pH */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">pH</p>
                  <p className={`text-3xl font-bold ${
                    profile ? getStatusColor(labs[0].ph, profile.ph.min, profile.ph.max) : 'text-gray-900'
                  }`}>
                    {labs[0].ph || '—'}
                  </p>
                  {profile && labs[0].ph && (
                    <p className="text-xs text-gray-600 mt-2">Target: {profile.ph.ideal}</p>
                  )}
                </div>

                {/* TA */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">TA (g/L)</p>
                  <p className={`text-3xl font-bold ${
                    profile ? getStatusColor(labs[0].ta, profile.ta.min, profile.ta.max) : 'text-gray-900'
                  }`}>
                    {labs[0].ta || '—'}
                  </p>
                  {profile && labs[0].ta && (
                    <p className="text-xs text-gray-600 mt-2">Target: {profile.ta.ideal}</p>
                  )}
                </div>

                {/* Free SO2 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Free SO₂</p>
                  <p className={`text-3xl font-bold ${
                    profile ? getStatusColor(labs[0].free_so2, profile.free_so2.min, profile.free_so2.max) : 'text-gray-900'
                  }`}>
                    {labs[0].free_so2 || '—'}
                  </p>
                  {profile && labs[0].free_so2 && (
                    <p className="text-xs text-gray-600 mt-2">Target: {profile.free_so2.ideal}</p>
                  )}
                </div>

                {/* VA */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">VA (g/L)</p>
                  <p className={`text-3xl font-bold ${
                    profile ? getStatusColor(labs[0].va, 0, profile.va.max, 'va') : 'text-gray-900'
                  }`}>
                    {labs[0].va || '—'}
                  </p>
                  {profile && labs[0].va && (
                    <p className="text-xs text-gray-600 mt-2">Max: {profile.va.max} g/L</p>
                  )}
                </div>

                {/* Alcohol */}
                {labs[0].alcohol_pct && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Alcohol</p>
                    <p className="text-3xl font-bold text-gray-900">{labs[0].alcohol_pct}%</p>
                    {profile && (
                      <p className="text-xs text-gray-600 mt-2">Target: {profile.alcohol.ideal}</p>
                    )}
                  </div>
                )}

                {/* Total SO2 */}
                {labs[0].total_so2 && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total SO₂</p>
                    <p className="text-3xl font-bold text-gray-900">{labs[0].total_so2}</p>
                    <p className="text-xs text-gray-600 mt-2">ppm</p>
                  </div>
                )}

                {/* Residual Sugar */}
                {labs[0].residual_sugar && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Residual Sugar</p>
                    <p className="text-3xl font-bold text-gray-900">{labs[0].residual_sugar}</p>
                    <p className="text-xs text-gray-600 mt-2">g/L</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chemistry Trends */}
          {labs.length > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Chemistry Trends</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* pH Trend */}
                {getChartData('ph').length > 1 && (
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">pH History</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getChartData('ph')}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            stroke="#9ca3af"
                          />
                          <YAxis
                            domain={[3, 4]}
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            stroke="#9ca3af"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '2px solid #7C203A',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          />
                          {profile && (
                            <>
                              <ReferenceLine y={profile.ph.min} stroke="#f59e0b" strokeDasharray="3 3" />
                              <ReferenceLine y={profile.ph.max} stroke="#f59e0b" strokeDasharray="3 3" />
                            </>
                          )}
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#7C203A"
                            strokeWidth={3}
                            dot={{ fill: '#7C203A', r: 4, strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* TA Trend */}
                {getChartData('ta').length > 1 && (
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">TA History (g/L)</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getChartData('ta')}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            stroke="#9ca3af"
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            stroke="#9ca3af"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '2px solid #7C203A',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          />
                          {profile && (
                            <>
                              <ReferenceLine y={profile.ta.min} stroke="#f59e0b" strokeDasharray="3 3" />
                              <ReferenceLine y={profile.ta.max} stroke="#f59e0b" strokeDasharray="3 3" />
                            </>
                          )}
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#7C203A"
                            strokeWidth={3}
                            dot={{ fill: '#7C203A', r: 4, strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Free SO2 Trend */}
                {getChartData('free_so2').length > 1 && (
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Free SO₂ (ppm)</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getChartData('free_so2')}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            stroke="#9ca3af"
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            stroke="#9ca3af"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '2px solid #3b82f6',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          />
                          {profile && (
                            <>
                              <ReferenceLine y={profile.free_so2.min} stroke="#f59e0b" strokeDasharray="3 3" />
                              <ReferenceLine y={profile.free_so2.max} stroke="#f59e0b" strokeDasharray="3 3" />
                            </>
                          )}
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* VA Trend */}
                {getChartData('va').length > 1 && (
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">VA History (g/L)</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getChartData('va')}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            stroke="#9ca3af"
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            stroke="#9ca3af"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '2px solid #dc2626',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          />
                          {profile && (
                            <ReferenceLine y={profile.va.max} stroke="#dc2626" strokeDasharray="3 3" label="Max" />
                          )}
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#dc2626"
                            strokeWidth={3}
                            dot={{ fill: '#dc2626', r: 4, strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lab History Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Complete Lab History</h3>
            </div>

            {labs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FlaskConical className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-2">No Lab Results Yet</p>
                <p className="text-sm text-gray-500 mb-4">Click "New Lab Test" to record your first chemistry panel</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add First Test
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase">pH</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase">TA</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase">Free SO₂</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase">Total SO₂</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase">VA</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase">Alcohol</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {labs.map((lab, idx) => (
                      <tr
                        key={lab.id}
                        className={`hover:bg-gray-50 transition-colors ${idx === 0 ? 'bg-blue-50' : ''}`}
                      >
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            {idx === 0 && (
                              <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold">Latest</span>
                            )}
                            <span className="text-gray-900 font-medium">
                              {new Date(lab.log_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-center font-semibold text-gray-900">
                          {lab.ph || '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-center font-semibold text-gray-900">
                          {lab.ta || '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-center font-semibold text-gray-900">
                          {lab.free_so2 || '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-center font-semibold text-gray-900">
                          {lab.total_so2 || '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-center font-semibold text-gray-900">
                          {lab.va || '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-center font-semibold text-gray-900">
                          {lab.alcohol_pct ? `${lab.alcohol_pct}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 italic max-w-xs truncate">
                          {lab.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Lab History Modal */}
      {showLabHistoryModal && selectedLot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedLot.name} - Lab Test History</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedLot.varietal} {selectedLot.vintage}</p>
              </div>
              <button
                onClick={() => setShowLabHistoryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {lotLabsMap[selectedLot.id]?.length > 0 ? (
                <div className="space-y-3">
{lotLabsMap[selectedLot.id].map((lab, idx) => {
                    const isEditing = editingLab?.id === lab.id;

                    if (isEditing) {
                      // Edit mode - show form
                      return (
                        <div
                          key={lab.id}
                          className={`p-4 rounded-lg border-2 border-[#7C203A] bg-gradient-to-br from-rose-50 to-pink-50`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-gray-900">
                              {new Date(lab.log_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="px-3 py-1 bg-[#7C203A] text-white rounded-full text-xs font-bold">Editing</span>
                          </div>

                          <form onSubmit={handleUpdateLab}>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              {/* pH */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">pH</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.ph}
                                  onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                  placeholder="3.45"
                                />
                              </div>

                              {/* TA */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">TA (g/L)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={formData.ta}
                                  onChange={(e) => setFormData({ ...formData, ta: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                  placeholder="6.5"
                                />
                              </div>

                              {/* Free SO2 */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Free SO₂</label>
                                <input
                                  type="number"
                                  step="1"
                                  value={formData.free_so2}
                                  onChange={(e) => setFormData({ ...formData, free_so2: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                  placeholder="28"
                                />
                              </div>

                              {/* Total SO2 */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Total SO₂</label>
                                <input
                                  type="number"
                                  step="1"
                                  value={formData.total_so2}
                                  onChange={(e) => setFormData({ ...formData, total_so2: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                  placeholder="65"
                                />
                              </div>

                              {/* VA */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">VA (g/L)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.va}
                                  onChange={(e) => setFormData({ ...formData, va: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                  placeholder="0.45"
                                />
                              </div>

                              {/* Alcohol */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Alcohol (%)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={formData.alcohol_pct}
                                  onChange={(e) => setFormData({ ...formData, alcohol_pct: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                  placeholder="13.5"
                                />
                              </div>

                              {/* Malic Acid */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Malic Acid</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.malic_acid}
                                  onChange={(e) => setFormData({ ...formData, malic_acid: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                  placeholder="0.15"
                                />
                              </div>

                              {/* Lactic Acid */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Lactic Acid</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.lactic_acid}
                                  onChange={(e) => setFormData({ ...formData, lactic_acid: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                  placeholder="2.5"
                                />
                              </div>

                              {/* Residual Sugar */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Residual Sugar</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={formData.residual_sugar}
                                  onChange={(e) => setFormData({ ...formData, residual_sugar: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                                  placeholder="2.0"
                                />
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="mt-3">
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                              <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows="2"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent resize-none"
                                placeholder="Observations, adjustments, sensory notes..."
                              ></textarea>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 mt-4">
                              <button
                                type="submit"
                                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-[#7C203A] to-[#8B2E48] text-white rounded-lg hover:from-[#8B2E48] hover:to-[#9A3756] transition-all shadow-md font-medium text-sm"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      );
                    }

                    // View mode - show read-only data
                    return (
                      <div
                        key={lab.id}
                        className={`p-4 rounded-lg border-2 ${
                          idx === 0 ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-gray-900">
                            {new Date(lab.log_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <div className="flex items-center gap-2">
                            {idx === 0 && (
                              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">Latest Test</span>
                            )}
                            <button
                              onClick={() => handleStartEdit(lab)}
                              className="p-2 hover:bg-gray-200 rounded-lg transition-colors group"
                              title="Edit test"
                            >
                              <Pencil className="w-4 h-4 text-gray-600 group-hover:text-[#7C203A]" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {lab.ph && (
                            <div className="bg-white rounded p-2 border border-gray-200">
                              <span className="text-gray-500 block text-xs">pH</span>
                              <span className="font-bold text-gray-900">{lab.ph}</span>
                            </div>
                          )}
                          {lab.ta && (
                            <div className="bg-white rounded p-2 border border-gray-200">
                              <span className="text-gray-500 block text-xs">TA (g/L)</span>
                              <span className="font-bold text-gray-900">{lab.ta}</span>
                            </div>
                          )}
                          {lab.free_so2 && (
                            <div className="bg-white rounded p-2 border border-gray-200">
                              <span className="text-gray-500 block text-xs">Free SO₂</span>
                              <span className="font-bold text-gray-900">{lab.free_so2}</span>
                            </div>
                          )}
                          {lab.total_so2 && (
                            <div className="bg-white rounded p-2 border border-gray-200">
                              <span className="text-gray-500 block text-xs">Total SO₂</span>
                              <span className="font-bold text-gray-900">{lab.total_so2}</span>
                            </div>
                          )}
                          {lab.va && (
                            <div className="bg-white rounded p-2 border border-gray-200">
                              <span className="text-gray-500 block text-xs">VA (g/L)</span>
                              <span className="font-bold text-gray-900">{lab.va}</span>
                            </div>
                          )}
                          {lab.alcohol_pct && (
                            <div className="bg-white rounded p-2 border border-gray-200">
                              <span className="text-gray-500 block text-xs">Alcohol</span>
                              <span className="font-bold text-gray-900">{lab.alcohol_pct}%</span>
                            </div>
                          )}
                          {lab.malic_acid && (
                            <div className="bg-white rounded p-2 border border-gray-200">
                              <span className="text-gray-500 block text-xs">Malic Acid</span>
                              <span className="font-bold text-gray-900">{lab.malic_acid}</span>
                            </div>
                          )}
                          {lab.lactic_acid && (
                            <div className="bg-white rounded p-2 border border-gray-200">
                              <span className="text-gray-500 block text-xs">Lactic Acid</span>
                              <span className="font-bold text-gray-900">{lab.lactic_acid}</span>
                            </div>
                          )}
                          {lab.residual_sugar && (
                            <div className="bg-white rounded p-2 border border-gray-200">
                              <span className="text-gray-500 block text-xs">Residual Sugar</span>
                              <span className="font-bold text-gray-900">{lab.residual_sugar}</span>
                            </div>
                          )}
                        </div>

                        {lab.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Notes</p>
                            <p className="text-sm text-gray-700 italic">{lab.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FlaskConical className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-600 mb-2">No Lab Tests Yet</p>
                  <p className="text-sm text-gray-500 mb-4">Start tracking chemistry by adding your first lab test</p>
                  <button
                    onClick={() => {
                      setShowLabHistoryModal(false);
                      setShowForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Test
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wine Profile Modal */}
      {showProfileModal && selectedLot && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Set Wine Profile</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedLot.name} • {selectedLot.varietal} {selectedLot.vintage}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                Select a wine style to see target chemistry ranges for this lot. This helps provide context when entering lab results.
              </p>

              <div className="space-y-3">
                {Object.entries(WINE_SPEC_PROFILES).map(([key, profile]) => (
                  <button
                    key={key}
                    onClick={async () => {
                      try {
                        await updateLot(selectedLot.id, { wine_profile: key });
                        setSuccess(`Wine profile set to "${profile.name}"`);
                        setShowProfileModal(false);
                        await loadData(); // Refresh lots to show new profile
                        setTimeout(() => setSuccess(null), 3000);
                      } catch (err) {
                        console.error('Error setting wine profile:', err);
                        setError(err.message);
                      }
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedLot.wine_profile === key
                        ? 'border-[#7C203A] bg-rose-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{profile.name}</h4>
                          {selectedLot.wine_profile === key && (
                            <CheckCircle2 className="w-5 h-5 text-[#7C203A]" />
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">pH:</span> {profile.ph.ideal}
                          </div>
                          <div>
                            <span className="font-medium">TA:</span> {profile.ta.ideal}
                          </div>
                          <div>
                            <span className="font-medium">Free SO₂:</span> {profile.free_so2.ideal}
                          </div>
                          <div>
                            <span className="font-medium">VA:</span> {profile.va.ideal}
                          </div>
                          <div>
                            <span className="font-medium">Alcohol:</span> {profile.alcohol.ideal}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedLot.wine_profile && (
                <button
                  onClick={async () => {
                    try {
                      await updateLot(selectedLot.id, { wine_profile: null });
                      setSuccess('Wine profile cleared');
                      setShowProfileModal(false);
                      await loadData();
                      setTimeout(() => setSuccess(null), 3000);
                    } catch (err) {
                      console.error('Error clearing wine profile:', err);
                      setError(err.message);
                    }
                  }}
                  className="mt-4 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Clear Profile
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
