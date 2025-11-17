import React, { useState, useEffect } from 'react';
import {
  FlaskConical, Plus, TrendingUp, AlertTriangle, Calendar,
  Droplets, Activity, CheckCircle2, Filter, ListTodo, Target
} from 'lucide-react';
import { listLots, createFermentationLog, listFermentationLogs } from '@/shared/lib/productionApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  }
};

export function LabChemistry() {
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [viewMode, setViewMode] = useState('recent'); // 'recent', 'trends', or 'queue'
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);

  const [formData, setFormData] = useState({
    ph: '',
    ta: '',
    free_so2: '',
    total_so2: '',
    va: '',
    malic_acid: '',
    lactic_acid: '',
    alcohol_pct: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error: lotsError } = await listLots();
      if (lotsError) throw lotsError;

      const activeLots = (data || []).filter(lot =>
        !lot.archived_at && ['fermenting', 'aging', 'pressed', 'blending'].includes(lot.status)
      );

      setLots(activeLots);
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
      setLabs((data || []).filter(log =>
        log.ph || log.ta || log.free_so2 || log.total_so2 || log.va
      ));
    } catch (err) {
      console.error('Error loading lab data:', err);
    }
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
        ...formData
      };

      const { error: createError } = await createFermentationLog(labData);
      if (createError) throw createError;

      setSuccess('Lab results saved successfully');
      resetForm();
      loadLabs(selectedLot.id);
    } catch (err) {
      console.error('Error saving lab:', err);
      setError(err.message);
    }
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
      notes: ''
    });
    setShowForm(false);
  };

  const getChartData = (metric) => {
    if (!labs || labs.length === 0) return [];
    return [...labs].reverse().map((lab, index) => ({
      date: new Date(lab.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: lab[metric],
      index: index + 1
    })).filter(d => d.value !== null && d.value !== undefined);
  };

  const getAlert = (metric, value, lot) => {
    // Use selected profile ranges if available, otherwise use defaults
    const profile = selectedProfile && WINE_SPEC_PROFILES[selectedProfile]
      ? WINE_SPEC_PROFILES[selectedProfile]
      : {
          ph: { min: 3.2, max: 3.8, ideal: '3.4-3.6' },
          ta: { min: 5, max: 8, ideal: '6-7 g/L' },
          free_so2: { min: 15, max: 50, ideal: '25-35 ppm' },
          va: { max: 0.8, warning: 0.6, ideal: '<0.5 g/L' }
        };

    if (metric === 'ph') {
      if (value < profile.ph.min) {
        return { type: 'error', message: `pH too low (${value}) - Target: ${profile.ph.ideal}`, action: 'Consider deacidification or malolactic fermentation' };
      }
      if (value > profile.ph.max) {
        return { type: 'warning', message: `pH high (${value}) - Target: ${profile.ph.ideal}`, action: 'Consider tartaric acid addition' };
      }
    }

    if (metric === 'va' && value) {
      if (value > profile.va.max) {
        return { type: 'error', message: `VA too high (${value} g/L) - Max: ${profile.va.max}`, action: 'Monitor closely, consider filtration or sulfite addition' };
      }
      if (value > (profile.va.max - 0.2)) {
        return { type: 'warning', message: `VA elevated (${value} g/L)`, action: 'Monitor closely, plan next rack/filter' };
      }
    }

    if (metric === 'free_so2' && value) {
      const latest = labs.length > 0 ? labs[0] : null;
      const ph = latest?.ph || 3.5;
      const molecularSO2 = value * 0.8 / (1 + Math.pow(10, ph - 1.81)); // Approximate molecular SO₂

      if (value < profile.free_so2.min) {
        const addition = Math.round((profile.free_so2.min - value) * 0.67); // g/hL approximation
        return { type: 'warning', message: `Free SO₂ low (${value} ppm) for pH ${ph}`, action: `Consider addition of ~${addition} g/hL potassium metabisulfite` };
      }
    }

    if (metric === 'ta' && value) {
      if (value < profile.ta.min) {
        return { type: 'warning', message: `TA low (${value} g/L) - Target: ${profile.ta.ideal}`, action: 'Consider tartaric acid addition' };
      }
      if (value > profile.ta.max) {
        return { type: 'warning', message: `TA high (${value} g/L) - Target: ${profile.ta.ideal}`, action: 'Consider cold stabilization or deacidification' };
      }
    }

    return null;
  };

  // Get lab work queue - lots needing tests
  const getLabWorkQueue = () => {
    const queue = [];

    lots.forEach(lot => {
      const lotLabs = labs.filter(l => l.lot_id === lot.id);
      const lastLab = lotLabs[0];

      // No lab results yet
      if (!lastLab) {
        queue.push({
          lot,
          priority: 'high',
          reason: 'No lab results recorded',
          daysOverdue: Math.floor((new Date() - new Date(lot.created_at)) / (1000 * 60 * 60 * 24))
        });
        return;
      }

      // Overdue for testing (more than 30 days)
      const daysSinceTest = Math.floor((new Date() - new Date(lastLab.log_date)) / (1000 * 60 * 60 * 24));
      if (daysSinceTest > 30) {
        queue.push({
          lot,
          priority: 'medium',
          reason: `No test in ${daysSinceTest} days`,
          daysOverdue: daysSinceTest - 30
        });
      }

      // High VA - needs monitoring
      if (lastLab.va && lastLab.va > 0.6) {
        queue.push({
          lot,
          priority: 'high',
          reason: `Elevated VA (${lastLab.va} g/L) - needs monitoring`,
          daysOverdue: 0
        });
      }

      // Low free SO₂
      if (lastLab.free_so2 && lastLab.free_so2 < 20) {
        queue.push({
          lot,
          priority: 'medium',
          reason: `Low free SO₂ (${lastLab.free_so2} ppm)`,
          daysOverdue: 0
        });
      }
    });

    return queue.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return b.daysOverdue - a.daysOverdue;
    });
  };

  const getCurrentAlerts = () => {
    if (!selectedLot || labs.length === 0) return [];
    const latest = labs[0];
    const alerts = [];

    ['ph', 'va', 'free_so2', 'ta'].forEach(metric => {
      const alert = getAlert(metric, latest[metric], selectedLot);
      if (alert) alerts.push(alert);
    });

    return alerts;
  };

  const labWorkQueue = getLabWorkQueue();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7C203A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading lab data...</p>
        </div>
      </div>
    );
  }

  if (lots.length === 0) {
    return (
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lab & Chemistry</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FlaskConical className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">No active lots for lab tracking</p>
          <p className="text-sm text-gray-400">Create lots in fermenting, aging, or blending status to track chemistry</p>
        </div>
      </div>
    );
  }

  const alerts = getCurrentAlerts();

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lab & Chemistry</h2>
          <p className="text-gray-600 mt-1">Track chemistry panels and lab results</p>
        </div>
        <div className="flex items-center gap-2">
          {labWorkQueue.length > 0 && (
            <button
              onClick={() => setViewMode(viewMode === 'queue' ? 'recent' : 'queue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${
                viewMode === 'queue'
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              Lab Queue ({labWorkQueue.length})
            </button>
          )}
          <button
            onClick={() => setShowProfileSelector(!showProfileSelector)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors shadow-sm"
          >
            <Target className="w-4 h-4" />
            {selectedProfile ? WINE_SPEC_PROFILES[selectedProfile].name : 'Set Spec Profile'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Lab Result
          </button>
        </div>
      </div>

      {/* Spec Profile Selector */}
      {showProfileSelector && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-purple-900 mb-3">Select Wine Spec Profile</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(WINE_SPEC_PROFILES).map(([key, profile]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedProfile(key);
                  setShowProfileSelector(false);
                  setSuccess(`Applied ${profile.name} spec ranges`);
                  setTimeout(() => setSuccess(null), 3000);
                }}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedProfile === key
                    ? 'border-[#7C203A] bg-rose-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <p className="font-semibold text-sm text-gray-900">{profile.name}</p>
                <p className="text-xs text-gray-600 mt-1">pH: {profile.ph.ideal}</p>
                <p className="text-xs text-gray-600">TA: {profile.ta.ideal}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Chemistry Alerts with Action Recommendations */}
      {alerts.length > 0 && viewMode !== 'queue' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-900">Chemistry Alerts & Recommendations</span>
          </div>
          <div className="space-y-3 ml-7">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`${alert.type === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                <p className="text-sm font-medium">{alert.message}</p>
                {alert.action && (
                  <p className="text-xs mt-1 text-gray-600 flex items-center gap-1">
                    <span className="font-semibold">→</span> {alert.action}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lab Work Queue View */}
      {viewMode === 'queue' && labWorkQueue.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo className="w-5 h-5 text-[#7C203A]" />
            <h3 className="font-semibold text-gray-900">Lab Work Queue</h3>
          </div>

          <div className="space-y-3">
            {labWorkQueue.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  item.priority === 'high'
                    ? 'border-red-200 bg-red-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{item.lot.name}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        item.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{item.lot.varietal} • {item.lot.vintage}</p>
                    <p className="text-sm text-gray-900 mt-2">{item.reason}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedLot(item.lot);
                      setViewMode('recent');
                      setShowForm(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Test Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lot Selector */}
      {viewMode !== 'queue' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-[#7C203A] rounded flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">Select Lot</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {lots.map((lot) => {
            const isSelected = selectedLot?.id === lot.id;

            return (
              <button
                key={lot.id}
                onClick={() => setSelectedLot(lot)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-[#7C203A] bg-rose-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <p className="font-semibold text-gray-900 text-sm">{lot.name}</p>
                <p className="text-xs text-gray-500">{lot.varietal} • {lot.vintage} • {lot.status}</p>

                {labs.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    {labs[0].ph && <div><span className="text-gray-500">pH:</span> <span className="font-medium">{labs[0].ph}</span></div>}
                    {labs[0].ta && <div><span className="text-gray-500">TA:</span> <span className="font-medium">{labs[0].ta}</span></div>}
                    {labs[0].free_so2 && <div><span className="text-gray-500">SO₂:</span> <span className="font-medium">{labs[0].free_so2}</span></div>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {selectedLot && viewMode !== 'queue' && (
        <>
          {/* Lab Entry Form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Lab Result for {selectedLot.name}</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Core Panel</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">pH</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.ph}
                        onChange={(e) => setFormData({...formData, ph: e.target.value})}
                        placeholder="3.45"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">TA (g/L)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.ta}
                        onChange={(e) => setFormData({...formData, ta: e.target.value})}
                        placeholder="6.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Free SO₂ (ppm)</label>
                      <input
                        type="number"
                        step="1"
                        value={formData.free_so2}
                        onChange={(e) => setFormData({...formData, free_so2: e.target.value})}
                        placeholder="25"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Total SO₂ (ppm)</label>
                      <input
                        type="number"
                        step="1"
                        value={formData.total_so2}
                        onChange={(e) => setFormData({...formData, total_so2: e.target.value})}
                        placeholder="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Extended Panel</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">VA (g/L)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.va}
                        onChange={(e) => setFormData({...formData, va: e.target.value})}
                        placeholder="0.45"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Alcohol %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.alcohol_pct}
                        onChange={(e) => setFormData({...formData, alcohol_pct: e.target.value})}
                        placeholder="13.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="2"
                    placeholder="Lab observations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm"
                  >
                    Save Results
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

          {/* Chemistry Trends */}
          {labs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chemistry Trends</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* pH Trend */}
                {getChartData('ph').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">pH History</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getChartData('ph')}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis domain={[3, 4]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#7C203A" strokeWidth={2} dot={{ fill: '#7C203A', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* TA Trend */}
                {getChartData('ta').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">TA History (g/L)</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getChartData('ta')}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#7C203A" strokeWidth={2} dot={{ fill: '#7C203A', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* SO2 Trend */}
                {getChartData('free_so2').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Free SO₂ (ppm)</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getChartData('free_so2')}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#7C203A" strokeWidth={2} dot={{ fill: '#7C203A', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* VA Trend */}
                {getChartData('va').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">VA History (g/L)</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getChartData('va')}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lab History */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lab History</h3>

            {labs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No lab results yet. Click "Lab Result" to add your first panel.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Date</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase">pH</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase">TA</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase">Free SO₂</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase">Total SO₂</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase">VA</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {labs.map((lab) => (
                      <tr key={lab.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {new Date(lab.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-sm text-center text-gray-900">{lab.ph || '—'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-900">{lab.ta || '—'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-900">{lab.free_so2 || '—'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-900">{lab.total_so2 || '—'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-900">{lab.va || '—'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 italic">{lab.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
