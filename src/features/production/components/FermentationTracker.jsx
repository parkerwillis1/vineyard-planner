import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import {
  Sparkles, Plus, TrendingDown, AlertTriangle, Clock,
  Thermometer, Activity, CheckCircle2, Circle, Droplets,
  Copy, Zap, Target, Calendar, FlaskConical, X, Play
} from 'lucide-react';
import {
  getActiveFermentations,
  createFermentationLog,
  listFermentationLogs,
  updateLot,
  listLots,
  listContainers
} from '@/shared/lib/productionApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

// Fermentation profiles for different wine styles
const FERMENTATION_PROFILES = {
  'cool_white': {
    name: 'Cool White',
    tempRange: { min: 50, max: 60, ideal: 55 },
    targetDays: 14,
    color: '#3b82f6'
  },
  'warm_white': {
    name: 'Warm White',
    tempRange: { min: 60, max: 70, ideal: 65 },
    targetDays: 10,
    color: '#f59e0b'
  },
  'cool_red': {
    name: 'Cool Red',
    tempRange: { min: 70, max: 80, ideal: 75 },
    targetDays: 12,
    color: '#ec4899'
  },
  'warm_red': {
    name: 'Warm Red',
    tempRange: { min: 80, max: 90, ideal: 85 },
    targetDays: 8,
    color: '#dc2626'
  },
  'carbonic': {
    name: 'Carbonic Maceration',
    tempRange: { min: 85, max: 95, ideal: 90 },
    targetDays: 14,
    color: '#a855f7'
  }
};

// Yeast strains for fermentation
const YEAST_STRAINS = {
  'EC-1118': { name: 'EC-1118 (Prise de Mousse)', temp: '50-86°F', alcohol: '18%', notes: 'Champagne yeast, clean, neutral, reliable' },
  'D47': { name: 'D47 (Côte des Blancs)', temp: '59-86°F', alcohol: '15%', notes: 'White wines, tropical fruit, spicy notes' },
  'RC212': { name: 'RC-212 (Bourgovin)', temp: '68-86°F', alcohol: '16%', notes: 'Pinot Noir, fruity, complex' },
  'BM4x4': { name: 'BM 4x4', temp: '64-86°F', alcohol: '16%', notes: 'Bordeaux reds, deep color, structure' },
  'BDX': { name: 'BDX (Pasteur Red)', temp: '59-86°F', alcohol: '16%', notes: 'Syrah, Merlot, robust reds' },
  'D254': { name: 'D254 (Assmanshausen)', temp: '60-90°F', alcohol: '16%', notes: 'Zinfandel, big reds, jammy' },
  'QA23': { name: 'QA23 (Portugal)', temp: '59-86°F', alcohol: '16%', notes: 'Aromatic whites, citrus, floral' },
  '71B': { name: '71B-1122 (Narbonne)', temp: '59-86°F', alcohol: '14%', notes: 'Reduces acidity, semi-sweet wines' }
};

// Calculate recommended SO₂ based on pH
const calculateSO2 = (ph, targetFreeSO2 = 0.8) => {
  if (!ph) return null;
  const phNum = parseFloat(ph);
  if (phNum < 3.0) return 30;
  if (phNum < 3.3) return 40;
  if (phNum < 3.5) return 50;
  if (phNum < 3.7) return 60;
  return 75; // High pH needs more SO2
};

// Calculate grams of potassium metabisulfite needed
const calculateSO2Grams = (ppm, volumeGallons) => {
  if (!ppm || !volumeGallons) return null;
  // Formula: (PPM × Volume in Gallons × 3.785 L/gal) / 570
  // 570 = conversion factor for K2S2O5 (57% SO2)
  const grams = (parseFloat(ppm) * parseFloat(volumeGallons) * 3.785) / 570;
  return grams.toFixed(2);
};

// Recommend yeast strain based on varietal
const recommendYeast = (varietal) => {
  if (!varietal) return 'EC-1118';
  const variety = varietal.toLowerCase();
  if (variety.includes('chardonnay') || variety.includes('sauvignon')) return 'D47';
  if (variety.includes('pinot noir') || variety.includes('pinot')) return 'RC212';
  if (variety.includes('cabernet') || variety.includes('merlot')) return 'BM4x4';
  if (variety.includes('syrah') || variety.includes('petite')) return 'BDX';
  if (variety.includes('zinfandel')) return 'D254';
  return 'EC-1118'; // Universal fallback
};

export function FermentationTracker() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const lotIdFromUrl = searchParams.get('lot');

  const [lots, setLots] = useState([]);
  const [lotsReadyToStart, setLotsReadyToStart] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showStartFermentationModal, setShowStartFermentationModal] = useState(false);
  const [containers, setContainers] = useState([]);
  const [fermentationStartData, setFermentationStartData] = useState({
    volume_gallons: '',
    so2_ppm: '',
    yeast_strain: '',
    yeast_grams: '',
    nutrient_type: 'Fermaid K',
    nutrient_grams: '',
    container_id: null,
    target_fermentation_days: 14,
    notes: ''
  });

  const [formData, setFormData] = useState({
    brix: '',
    temp_f: '',
    ph: '',
    ta: '',
    free_so2: '',
    total_so2: '',
    va: '',
    work_performed: [],
    addition_type: '',
    addition_name: '',
    addition_amount: '',
    addition_unit: 'g/hL',
    notes: ''
  });

  const [quickLogData, setQuickLogData] = useState({
    brix: '',
    temp_f: '',
    ambient_temp: '',
    ph: '',
    ta: '',
    work_performed: [],
    smell_notes: '',
    taste_notes: '',
    cap_condition: '',
    visual_notes: '',
    notes: ''
  });

  const cellarWorkOptions = [
    { value: 'punchdown', label: 'Punchdown', icon: Activity },
    { value: 'pumpover', label: 'Pumpover', icon: Droplets },
    { value: 'rack', label: 'Rack', icon: TrendingDown },
    { value: 'add_nutrient', label: 'Add Nutrient', icon: Plus },
    { value: 'add_so2', label: 'Add SO₂', icon: Circle },
    { value: 'taste', label: 'Taste', icon: CheckCircle2 },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (lotIdFromUrl && lots.length > 0) {
      const lot = lots.find(l => l.id === lotIdFromUrl);
      if (lot) setSelectedLot(lot);
    }
  }, [lotIdFromUrl, lots]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeResult, readyResult, containersResult] = await Promise.all([
        getActiveFermentations(),
        listLots({ status: 'harvested,crushing' }),
        listContainers()
      ]);

      if (activeResult.error) throw activeResult.error;
      if (readyResult.error) throw readyResult.error;
      if (containersResult.error) throw containersResult.error;

      setLots(activeResult.data || []);
      setLotsReadyToStart(readyResult.data || []);
      setContainers(containersResult.data || []);

      if (activeResult.data && activeResult.data.length > 0 && !selectedLot) {
        setSelectedLot(activeResult.data[0]);
      }
    } catch (err) {
      console.error('Error loading fermentations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (lotId) => {
    try {
      const { data, error: logsError } = await listFermentationLogs(lotId);
      if (logsError) throw logsError;
      setLogs(data || []);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (selectedLot) {
      loadLogs(selectedLot.id);
    }
  }, [selectedLot]);

  // Quick action: Open Quick Daily Log
  const handleOpenQuickLog = () => {
    // Pre-fill with last reading if available
    const lastLog = logs.length > 0 ? logs[0] : null;

    setQuickLogData({
      brix: lastLog?.brix || selectedLot?.current_brix || '',
      temp_f: lastLog?.temp_f || selectedLot?.current_temp_f || '',
      ambient_temp: '',
      ph: lastLog?.ph || selectedLot?.current_ph || '',
      ta: lastLog?.ta || selectedLot?.current_ta || '',
      work_performed: [],
      smell_notes: '',
      taste_notes: '',
      cap_condition: '',
      visual_notes: '',
      notes: ''
    });

    setShowQuickLog(true);
  };

  // Quick action: Record sample (pH, TA, temp)
  const handleQuickSample = () => {
    setShowLogForm(true);
    setFormData(prev => ({
      ...prev,
      work_performed: prev.work_performed.includes('taste')
        ? prev.work_performed
        : [...prev.work_performed, 'taste']
    }));
  };

  // Quick action: Record punchdown
  const handleQuickPunchdown = async () => {
    try {
      const logData = {
        lot_id: selectedLot.id,
        work_performed: ['punchdown'],
        notes: 'Quick punchdown entry'
      };
      await createFermentationLog(logData);
      setSuccess('Punchdown recorded');
      loadLogs(selectedLot.id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Quick action: Record pumpover
  const handleQuickPumpover = async () => {
    try {
      const logData = {
        lot_id: selectedLot.id,
        work_performed: ['pumpover'],
        notes: 'Quick pumpover entry'
      };
      await createFermentationLog(logData);
      setSuccess('Pumpover recorded');
      loadLogs(selectedLot.id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Copy yesterday's cellar work
  const handleCopyYesterday = () => {
    if (logs.length > 0) {
      const yesterday = logs[0];
      setFormData(prev => ({
        ...prev,
        work_performed: yesterday.work_performed || []
      }));
      setShowLogForm(true);
      setSuccess('Copied yesterday\'s cellar work - modify as needed');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Apply fermentation profile
  const handleApplyProfile = (profileKey) => {
    setSelectedProfile(profileKey);
    setShowProfileSelector(false);
    setSuccess(`Applied ${FERMENTATION_PROFILES[profileKey].name} profile`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleQuickLogSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Build comprehensive notes from sensory and visual observations
      const sensorySections = [];
      if (quickLogData.smell_notes) sensorySections.push(`Smell: ${quickLogData.smell_notes}`);
      if (quickLogData.taste_notes) sensorySections.push(`Taste: ${quickLogData.taste_notes}`);
      if (quickLogData.cap_condition) sensorySections.push(`Cap: ${quickLogData.cap_condition}`);
      if (quickLogData.visual_notes) sensorySections.push(`Visual: ${quickLogData.visual_notes}`);
      if (quickLogData.notes) sensorySections.push(quickLogData.notes);

      const comprehensiveNotes = sensorySections.join('\n');

      const logData = {
        lot_id: selectedLot.id,
        brix: quickLogData.brix || null,
        temp_f: quickLogData.temp_f || null,
        ph: quickLogData.ph || null,
        ta: quickLogData.ta || null,
        work_performed: quickLogData.work_performed.length > 0 ? quickLogData.work_performed : null,
        notes: comprehensiveNotes || null
      };

      const { error: createError } = await createFermentationLog(logData);
      if (createError) throw createError;

      // Update lot's current readings
      await updateLot(selectedLot.id, {
        current_brix: quickLogData.brix ? parseFloat(quickLogData.brix) : selectedLot.current_brix,
        current_temp_f: quickLogData.temp_f ? parseFloat(quickLogData.temp_f) : selectedLot.current_temp_f,
        current_ph: quickLogData.ph ? parseFloat(quickLogData.ph) : selectedLot.current_ph,
        current_ta: quickLogData.ta ? parseFloat(quickLogData.ta) : selectedLot.current_ta,
      });

      setSuccess('Daily log saved successfully!');
      setShowQuickLog(false);
      loadData();
      loadLogs(selectedLot.id);
    } catch (err) {
      console.error('Error saving quick log:', err);
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const logData = {
        lot_id: selectedLot.id,
        ...formData,
        work_performed: formData.work_performed.length > 0 ? formData.work_performed : null,
      };

      const { error: createError } = await createFermentationLog(logData);
      if (createError) throw createError;

      // Update lot's current readings
      await updateLot(selectedLot.id, {
        current_brix: formData.brix ? parseFloat(formData.brix) : selectedLot.current_brix,
        current_temp_f: formData.temp_f ? parseFloat(formData.temp_f) : selectedLot.current_temp_f,
        current_ph: formData.ph ? parseFloat(formData.ph) : selectedLot.current_ph,
        current_ta: formData.ta ? parseFloat(formData.ta) : selectedLot.current_ta,
      });

      setSuccess('Fermentation log saved successfully');
      resetForm();
      loadData();
      loadLogs(selectedLot.id);
    } catch (err) {
      console.error('Error saving log:', err);
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      brix: '',
      temp_f: '',
      ph: '',
      ta: '',
      free_so2: '',
      total_so2: '',
      va: '',
      work_performed: [],
      addition_type: '',
      addition_name: '',
      addition_amount: '',
      addition_unit: 'g/hL',
      notes: ''
    });
    setShowLogForm(false);
  };

  const toggleWork = (workValue) => {
    setFormData(prev => ({
      ...prev,
      work_performed: prev.work_performed.includes(workValue)
        ? prev.work_performed.filter(w => w !== workValue)
        : [...prev.work_performed, workValue]
    }));
  };

  // Handle opening the fermentation start modal
  const handleOpenStartFermentation = (lot) => {
    setSelectedLot(lot);
    const recommendedYeast = recommendYeast(lot.varietal);
    const recommendedSO2 = calculateSO2(lot.current_ph);

    // Determine target days based on wine type (red vs white)
    const varietal = (lot.varietal || '').toLowerCase();
    const isWhite = varietal.includes('chardonnay') || varietal.includes('sauvignon') ||
                     varietal.includes('riesling') || varietal.includes('pinot gris');
    const targetDays = isWhite ? 10 : 14; // Whites: ~10 days, Reds: ~14 days

    setFermentationStartData({
      volume_gallons: lot.current_volume_gallons || '',
      so2_ppm: recommendedSO2 || '',
      yeast_strain: recommendedYeast,
      yeast_grams: '',
      nutrient_type: 'Fermaid K',
      nutrient_grams: '',
      container_id: lot.container_id || null,
      target_fermentation_days: targetDays,
      notes: ''
    });
    setShowStartFermentationModal(true);
  };

  // Handle starting fermentation with SO₂, yeast, and nutrients
  const handleStartFermentation = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Calculate target completion date
      const startDate = new Date();
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + parseInt(fermentationStartData.target_fermentation_days));

      // Build notes with fermentation start details
      const containerInfo = fermentationStartData.container_id
        ? containers.find(c => c.id === fermentationStartData.container_id)
        : null;

      const startNotes = `--- FERMENTATION START ---
Date: ${startDate.toLocaleDateString()}
SO₂: ${fermentationStartData.so2_ppm} ppm
Yeast: ${fermentationStartData.yeast_strain} (${fermentationStartData.yeast_grams || 'per manufacturer'} g)
Nutrients: ${fermentationStartData.nutrient_type} (${fermentationStartData.nutrient_grams || '0'} g)
${containerInfo ? `Vessel: ${containerInfo.name} (${containerInfo.type})` : 'Vessel: Unassigned'}
Target Duration: ${fermentationStartData.target_fermentation_days} days (target completion: ${targetDate.toLocaleDateString()})
${fermentationStartData.notes ? `\nNotes: ${fermentationStartData.notes}` : ''}`;

      const updates = {
        status: 'fermenting',
        fermentation_start_date: new Date().toISOString(),
        so2_ppm: parseFloat(fermentationStartData.so2_ppm) || null,
        yeast_strain: fermentationStartData.yeast_strain || null,
        container_id: fermentationStartData.container_id || null,
        current_volume_gallons: parseFloat(fermentationStartData.volume_gallons) || null,
        notes: selectedLot.notes ? `${selectedLot.notes}\n\n${startNotes}` : startNotes
      };

      const { error: updateError } = await updateLot(selectedLot.id, updates);
      if (updateError) {
        console.error('Update error details:', updateError);
        throw new Error(updateError.message || 'Failed to update lot');
      }

      setSuccess('Fermentation started successfully!');
      setShowStartFermentationModal(false);
      loadData();
    } catch (err) {
      console.error('Error starting fermentation:', err);
      setError(err.message);
    }
  };

  const getDaysFermenting = (lot) => {
    if (!lot.fermentation_start_date) {
      if (!lot.harvest_date) return 0;
      return Math.floor((new Date() - new Date(lot.harvest_date)) / (1000 * 60 * 60 * 24));
    }
    return Math.floor((new Date() - new Date(lot.fermentation_start_date)) / (1000 * 60 * 60 * 24));
  };

  const getFermentationTimerInfo = (lot) => {
    if (!lot.fermentation_start_date || !lot.target_fermentation_days) {
      return null;
    }

    const startDate = new Date(lot.fermentation_start_date);
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + lot.target_fermentation_days);

    const now = new Date();
    const daysElapsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = lot.target_fermentation_days - daysElapsed;
    const percentComplete = Math.min((daysElapsed / lot.target_fermentation_days) * 100, 100);

    return {
      daysElapsed,
      daysRemaining,
      percentComplete,
      targetDate,
      isOverdue: daysRemaining < 0,
      isComplete: daysRemaining <= 0
    };
  };

  // Handle pressing wine (fermenting → pressed)
  const handlePressWine = async () => {
    if (!confirm(`Press ${selectedLot.name}?\n\nThis will mark the fermentation as complete and move the lot to "pressed" status.`)) return;

    try {
      const { error: updateError } = await updateLot(selectedLot.id, {
        status: 'pressed',
        press_date: new Date().toISOString()
      });

      if (updateError) throw updateError;

      setSuccess('Wine pressed successfully! Ready for barrel aging.');
      loadData();
      setSelectedLot(null); // Clear selection since it's no longer fermenting
    } catch (err) {
      console.error('Error pressing wine:', err);
      setError(err.message);
    }
  };

  const getChartData = () => {
    if (!logs || logs.length === 0) return [];

    const data = [...logs].reverse().map((log, index) => ({
      day: index + 1,
      brix: log.brix,
      temp: log.temp_f,
      date: new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    // Add target temp line if profile is selected
    if (selectedProfile && FERMENTATION_PROFILES[selectedProfile]) {
      const profile = FERMENTATION_PROFILES[selectedProfile];
      return data.map(d => ({
        ...d,
        targetTemp: profile.tempRange.ideal
      }));
    }

    return data;
  };

  const getFermentationStatus = (lot) => {
    if (!lot.current_brix) return { status: 'unknown', color: 'gray', label: 'No Data' };

    const brix = parseFloat(lot.current_brix);
    if (brix > 5) return { status: 'active', color: 'purple', label: 'Active' };
    if (brix > 0 && brix <= 5) return { status: 'finishing', color: 'amber', label: 'Finishing' };
    if (brix <= 0) return { status: 'dry', color: 'green', label: 'Dry' };
    return { status: 'unknown', color: 'gray', label: 'Unknown' };
  };

  const getAlerts = (lot) => {
    const alerts = [];
    const days = getDaysFermenting(lot);

    // No recent logs
    if (logs.length > 0) {
      const lastLog = logs[0];
      const daysSinceLog = Math.floor((new Date() - new Date(lastLog.log_date)) / (1000 * 60 * 60 * 24));
      if (daysSinceLog > 2) {
        alerts.push({ type: 'warning', message: `No log entry in ${daysSinceLog} days` });
      }
    }

    // Stuck fermentation
    if (lot.current_brix > 5 && days > 14) {
      alerts.push({ type: 'error', message: 'Possible stuck fermentation - Brix not dropping' });
    }

    // Temperature concerns
    if (lot.current_temp_f) {
      if (selectedProfile && FERMENTATION_PROFILES[selectedProfile]) {
        const profile = FERMENTATION_PROFILES[selectedProfile];
        if (lot.current_temp_f < profile.tempRange.min) {
          alerts.push({ type: 'warning', message: `Temp below ${profile.name} range: ${lot.current_temp_f}°F` });
        } else if (lot.current_temp_f > profile.tempRange.max) {
          alerts.push({ type: 'warning', message: `Temp above ${profile.name} range: ${lot.current_temp_f}°F` });
        }
      } else if (lot.current_temp_f > 90 || lot.current_temp_f < 50) {
        alerts.push({ type: 'warning', message: `Temperature out of range: ${lot.current_temp_f}°F` });
      }
    }

    return alerts;
  };

  // Get fermentation timeline milestones
  const getTimelineMilestones = (lot) => {
    const days = getDaysFermenting(lot);
    const milestones = [];

    // Harvest/Crush
    milestones.push({
      label: 'Crushed',
      date: lot.harvest_date,
      day: 0,
      completed: true,
      icon: 'crush',
      color: 'green'
    });

    // Peak fermentation (estimate around day 3-5)
    const peakDay = 4;
    const isPeakReached = days >= peakDay;
    const peakTemp = logs.slice().reverse().reduce((max, log) =>
      (log.temp_f && log.temp_f > max) ? log.temp_f : max, 0);

    milestones.push({
      label: 'Peak Temp',
      detail: isPeakReached ? `${peakTemp}°F` : 'Pending',
      day: peakDay,
      completed: isPeakReached,
      icon: 'temp',
      color: 'orange'
    });

    // Dryness (Brix <= 0)
    const isDry = lot.current_brix !== null && lot.current_brix <= 0;
    const dryDay = isDry ? days : null;

    milestones.push({
      label: 'Dry',
      detail: isDry ? `Day ${days}` : lot.current_brix ? `${lot.current_brix}° Brix` : 'Pending',
      day: dryDay || (selectedProfile ? FERMENTATION_PROFILES[selectedProfile].targetDays : 10),
      completed: isDry,
      icon: 'dry',
      color: 'blue'
    });

    // Press (status change)
    const isPressed = lot.status === 'pressed';

    milestones.push({
      label: 'Pressed',
      detail: isPressed ? 'Complete' : 'Pending',
      day: isPressed ? days : null,
      completed: isPressed,
      icon: 'press',
      color: 'purple'
    });

    return milestones;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7C203A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading fermentation data...</p>
        </div>
      </div>
    );
  }

  if (lots.length === 0) {
    return (
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Fermentation Tracker</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">No active fermentations</p>
          <p className="text-sm text-gray-400">Create a harvest intake with "Fermenting" status to start tracking</p>
        </div>
      </div>
    );
  }

  const chartData = getChartData();
  const fermentStatus = selectedLot ? getFermentationStatus(selectedLot) : null;
  const alerts = selectedLot ? getAlerts(selectedLot) : [];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900">Fermentation Tracker</h2>
        <p className="text-gray-600 mt-1">Monitor active fermentations and daily cellar work</p>
      </div>

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

      {/* Fermentation Alerts */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-900">Alerts</span>
          </div>
          <ul className="space-y-1 ml-7">
            {alerts.map((alert, idx) => (
              <li key={idx} className={`text-sm ${alert.type === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lots Ready to Start Fermentation */}
      {lotsReadyToStart.length > 0 && (
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Ready to Start Fermentation</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lotsReadyToStart.map((lot) => (
              <div key={lot.id} className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{lot.name}</p>
                    <p className="text-xs text-gray-500">{lot.varietal} • {lot.vintage}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    lot.status === 'harvested' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {lot.status === 'harvested' ? 'Harvested' : 'Crushed'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Brix</p>
                    <p className="text-sm font-semibold text-gray-900">{lot.current_brix?.toFixed(1) || '—'}°</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">pH</p>
                    <p className="text-sm font-semibold text-gray-900">{lot.current_ph?.toFixed(2) || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">TA</p>
                    <p className="text-sm font-semibold text-gray-900">{lot.current_ta?.toFixed(1) || '—'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenStartFermentation(lot)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Start Fermentation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lot Selector Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-[#7C203A] rounded flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">Active Fermentations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {lots.map((lot) => {
            const days = getDaysFermenting(lot);
            const status = getFermentationStatus(lot);
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
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{lot.name}</p>
                    <p className="text-xs text-gray-500">{lot.varietal} • {lot.vintage}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium bg-${status.color}-100 text-${status.color}-700`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div>
                    <p className="text-xs text-gray-500">Days</p>
                    <p className="text-sm font-semibold text-gray-900">{days}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Brix</p>
                    <p className="text-sm font-semibold text-gray-900">{lot.current_brix?.toFixed(1) || '—'}°</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Temp</p>
                    <p className="text-sm font-semibold text-gray-900">{lot.current_temp_f?.toFixed(0) || '—'}°F</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedLot && (
        <>
          {/* Quick Actions Bar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-[#7C203A]" />
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleOpenQuickLog}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7C203A] to-[#8B2E48] text-white rounded-lg hover:from-[#8B2E48] hover:to-[#7C203A] focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-white focus-visible:text-[#7C203A] active:scale-95 transition-all text-sm font-semibold shadow-md"
                style={{ outline: 'none' }}
              >
                <CheckCircle2 className="w-5 h-5" />
                Quick Daily Log
              </button>
              <button
                onClick={handleQuickPunchdown}
                className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
              >
                <Activity className="w-4 h-4" />
                Punchdown
              </button>
              <button
                onClick={handleQuickPumpover}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                <Droplets className="w-4 h-4" />
                Pumpover
              </button>
              {logs.length > 0 && (
                <button
                  onClick={handleCopyYesterday}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <Copy className="w-4 h-4" />
                  Copy Yesterday
                </button>
              )}
              <button
                onClick={() => setShowProfileSelector(!showProfileSelector)}
                className="flex items-center gap-2 px-3 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors text-sm font-medium"
              >
                <Target className="w-4 h-4" />
                {selectedProfile ? FERMENTATION_PROFILES[selectedProfile].name : 'Set Profile'}
              </button>
            </div>

            {/* Profile Selector */}
            {showProfileSelector && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Fermentation Profile</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(FERMENTATION_PROFILES).map(([key, profile]) => (
                    <button
                      key={key}
                      onClick={() => handleApplyProfile(key)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedProfile === key
                          ? 'border-[#7C203A] bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p className="font-semibold text-sm text-gray-900">{profile.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {profile.tempRange.min}-{profile.tempRange.max}°F
                      </p>
                      <p className="text-xs text-gray-500">{profile.targetDays} days</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fermentation Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-[#7C203A]" />
              <h3 className="font-semibold text-gray-900">Fermentation Timeline</h3>
            </div>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200"></div>
              <div className="absolute top-6 left-0 h-1 bg-gradient-to-r from-green-500 to-purple-500"
                   style={{ width: `${Math.min((getDaysFermenting(selectedLot) / 14) * 100, 100)}%` }}></div>

              {/* Milestones */}
              <div className="relative flex justify-between">
                {getTimelineMilestones(selectedLot).map((milestone, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      milestone.completed
                        ? `bg-${milestone.color}-500 text-white shadow-lg`
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {milestone.icon === 'crush' && <Activity className="w-5 h-5" />}
                      {milestone.icon === 'temp' && <Thermometer className="w-5 h-5" />}
                      {milestone.icon === 'dry' && <TrendingDown className="w-5 h-5" />}
                      {milestone.icon === 'press' && <Circle className="w-5 h-5" />}
                    </div>
                    <p className={`text-xs font-semibold ${milestone.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {milestone.label}
                    </p>
                    {milestone.detail && (
                      <p className="text-xs text-gray-500 mt-1">{milestone.detail}</p>
                    )}
                    {milestone.day !== null && (
                      <p className="text-xs text-gray-400 mt-1">Day {milestone.day}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Current Status Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedLot.name}</h3>
                <p className="text-sm text-gray-600">{selectedLot.varietal} • {selectedLot.vintage}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedLot.status === 'fermenting' && (
                  <button
                    onClick={handlePressWine}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Circle className="w-4 h-4" />
                    Press Wine
                  </button>
                )}
                <button
                  onClick={() => setShowLogForm(!showLogForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Log Entry
                </button>
              </div>
            </div>

            {/* Fermentation Timer */}
            {(() => {
              const timerInfo = getFermentationTimerInfo(selectedLot);
              if (timerInfo) {
                return (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-gray-900">Fermentation Timer</span>
                      </div>
                      <div className="text-right">
                        {timerInfo.isComplete ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-green-700">Ready to press!</span>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          </div>
                        ) : timerInfo.isOverdue ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-red-700">
                              Overdue by {Math.abs(timerInfo.daysRemaining)} days
                            </span>
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-purple-700">
                            {timerInfo.daysRemaining} {timerInfo.daysRemaining === 1 ? 'day' : 'days'} remaining
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          timerInfo.isComplete
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : timerInfo.isOverdue
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : 'bg-gradient-to-r from-purple-500 to-blue-500'
                        }`}
                        style={{ width: `${timerInfo.percentComplete}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                      <span>Day {timerInfo.daysElapsed} of {selectedLot.target_fermentation_days}</span>
                      <span>Target: {timerInfo.targetDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600 uppercase font-medium">Days</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{getDaysFermenting(selectedLot)}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600 uppercase font-medium">Brix</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{selectedLot.current_brix?.toFixed(1) || '—'}°</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Thermometer className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600 uppercase font-medium">Temp</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{selectedLot.current_temp_f?.toFixed(0) || '—'}°F</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600 uppercase font-medium">Volume</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{selectedLot.current_volume_gallons?.toLocaleString() || '—'}</div>
                <div className="text-xs text-gray-500">gal</div>
              </div>
            </div>
          </div>

          {/* Log Entry Form */}
          {showLogForm && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Fermentation Log</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Chemistry Readings */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Chemistry Readings</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Brix</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.brix}
                        onChange={(e) => setFormData({...formData, brix: e.target.value})}
                        placeholder="24.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Temp (°F)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.temp_f}
                        onChange={(e) => setFormData({...formData, temp_f: e.target.value})}
                        placeholder="72"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                      />
                    </div>

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
                  </div>
                </div>

                {/* Cellar Work */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Cellar Work Performed</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {cellarWorkOptions.map((work) => {
                      const Icon = work.icon;
                      const isSelected = formData.work_performed.includes(work.value);

                      return (
                        <button
                          key={work.value}
                          type="button"
                          onClick={() => toggleWork(work.value)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-[#7C203A] bg-rose-50 text-[#7C203A]'
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{work.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    placeholder="Observations, adjustments, sensory notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm"
                  >
                    Save Log
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

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Fermentation Progress</h3>
                {selectedProfile && (
                  <span className="text-sm text-gray-600">
                    Target: <span className="font-medium text-[#7C203A]">
                      {FERMENTATION_PROFILES[selectedProfile].name}
                    </span>
                  </span>
                )}
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      yAxisId="left"
                      label={{ value: 'Brix', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{ value: 'Temp (°F)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                    />
                    <Legend />

                    {/* Target temperature reference lines if profile is selected */}
                    {selectedProfile && FERMENTATION_PROFILES[selectedProfile] && (
                      <>
                        <ReferenceLine
                          yAxisId="right"
                          y={FERMENTATION_PROFILES[selectedProfile].tempRange.ideal}
                          stroke="#10b981"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          label={{ value: 'Target Temp', position: 'insideTopRight', fill: '#10b981', fontSize: 11 }}
                        />
                        <ReferenceLine
                          yAxisId="right"
                          y={FERMENTATION_PROFILES[selectedProfile].tempRange.min}
                          stroke="#94a3b8"
                          strokeDasharray="3 3"
                          strokeWidth={1}
                        />
                        <ReferenceLine
                          yAxisId="right"
                          y={FERMENTATION_PROFILES[selectedProfile].tempRange.max}
                          stroke="#94a3b8"
                          strokeDasharray="3 3"
                          strokeWidth={1}
                        />
                      </>
                    )}

                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="brix"
                      stroke="#7C203A"
                      strokeWidth={2}
                      dot={{ fill: '#7C203A', r: 4 }}
                      name="Brix"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="temp"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', r: 4 }}
                      name="Temperature"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Log History */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Log History</h3>

            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No log entries yet. Click "Log Entry" to record your first observation.</p>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(log.log_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.log_date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      <div className="flex gap-3 text-sm">
                        {log.brix && <span className="text-gray-700"><strong>Brix:</strong> {log.brix}°</span>}
                        {log.temp_f && <span className="text-gray-700"><strong>Temp:</strong> {log.temp_f}°F</span>}
                        {log.ph && <span className="text-gray-700"><strong>pH:</strong> {log.ph}</span>}
                      </div>
                    </div>

                    {log.work_performed && log.work_performed.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {log.work_performed.map((work) => (
                          <span key={work} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                            {work.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {log.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">{log.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Start Fermentation Modal */}
      {showStartFermentationModal && selectedLot && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="bg-purple-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-white">Start Fermentation</h3>
                <p className="text-purple-100 text-sm">{selectedLot.name}</p>
              </div>
              <button onClick={() => setShowStartFermentationModal(false)} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-900 stroke-[3]" />
              </button>
            </div>

            <form onSubmit={handleStartFermentation} className="p-6 space-y-6 overflow-y-auto flex-1 hide-scrollbar">
              {/* Vessel Assignment - moved to top */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Fermentation Vessel & Volume</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Tank/Vat *</label>
                    <select
                      value={fermentationStartData.container_id || ''}
                      onChange={(e) => {
                        const selectedContainer = containers.find(c => c.id === e.target.value);
                        setFermentationStartData({
                          ...fermentationStartData,
                          container_id: e.target.value || null,
                          volume_gallons: selectedContainer ? selectedContainer.capacity_gallons : fermentationStartData.volume_gallons
                        });
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select vessel...</option>
                      {containers
                        .filter(c => c.type === 'tank' || c.type === 'tote' || c.type === 'ibc')
                        .map(container => (
                          <option key={container.id} value={container.id}>
                            {container.name} ({container.capacity_gallons} gal {container.type})
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Primary fermentation uses tanks, vats, or totes</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume going into vessel (gallons) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={fermentationStartData.volume_gallons || ''}
                      onChange={(e) => setFermentationStartData({...fermentationStartData, volume_gallons: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter volume"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total harvest: {selectedLot.current_volume_gallons || 'N/A'} gallons</p>
                  </div>
                </div>
              </div>

              {/* SO₂ Addition */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-purple-600" />
                  SO₂ Addition
                </h4>
                {selectedLot.current_ph && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                    <p className="font-semibold">Recommended: {calculateSO2(selectedLot.current_ph)} ppm</p>
                    <p className="text-blue-700">Based on pH {selectedLot.current_ph}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PPM *</label>
                  <input
                    type="number"
                    value={fermentationStartData.so2_ppm}
                    onChange={(e) => setFermentationStartData({...fermentationStartData, so2_ppm: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="30-75"
                  />
                  {fermentationStartData.so2_ppm && fermentationStartData.volume_gallons && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                      <p className="text-green-900">
                        <strong>Amount needed:</strong> {calculateSO2Grams(fermentationStartData.so2_ppm, fermentationStartData.volume_gallons)} grams of potassium metabisulfite
                      </p>
                      <p className="text-green-700 text-xs mt-1">
                        For {fermentationStartData.volume_gallons} gallons at {fermentationStartData.so2_ppm} ppm
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Yeast */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Yeast Inoculation</h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Strain *</label>
                    <select
                      value={fermentationStartData.yeast_strain}
                      onChange={(e) => setFermentationStartData({...fermentationStartData, yeast_strain: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select yeast...</option>
                      {Object.entries(YEAST_STRAINS).map(([key, strain]) => (
                        <option key={key} value={key}>{strain.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (grams)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={fermentationStartData.yeast_grams}
                      onChange={(e) => setFermentationStartData({...fermentationStartData, yeast_grams: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Per manufacturer"
                    />
                  </div>
                </div>
                {fermentationStartData.yeast_strain && YEAST_STRAINS[fermentationStartData.yeast_strain] && (
                  <div className="text-sm bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-purple-900"><strong>Temp Range:</strong> {YEAST_STRAINS[fermentationStartData.yeast_strain].temp}</p>
                    <p className="text-purple-900"><strong>Alcohol Tolerance:</strong> {YEAST_STRAINS[fermentationStartData.yeast_strain].alcohol}</p>
                    <p className="text-purple-700 mt-1">{YEAST_STRAINS[fermentationStartData.yeast_strain].notes}</p>
                  </div>
                )}
              </div>

              {/* Nutrients */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nutrient Type</label>
                  <select
                    value={fermentationStartData.nutrient_type}
                    onChange={(e) => setFermentationStartData({...fermentationStartData, nutrient_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">None</option>
                    <option value="Fermaid K">Fermaid K</option>
                    <option value="Fermaid O">Fermaid O</option>
                    <option value="DAP">DAP</option>
                    <option value="Go-Ferm">Go-Ferm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (grams)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fermentationStartData.nutrient_grams}
                    onChange={(e) => setFermentationStartData({...fermentationStartData, nutrient_grams: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Target Duration */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Fermentation Timeline</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Duration (days) *</label>
                  <input
                    type="number"
                    value={fermentationStartData.target_fermentation_days}
                    onChange={(e) => setFermentationStartData({...fermentationStartData, target_fermentation_days: e.target.value})}
                    required
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Typical: Whites 7-10 days, Reds 12-21 days</p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={fermentationStartData.notes}
                  onChange={(e) => setFermentationStartData({...fermentationStartData, notes: e.target.value})}
                  rows="3"
                  placeholder="Additional fermentation notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium"
                >
                  Start Fermentation
                </button>
                <button
                  type="button"
                  onClick={() => setShowStartFermentationModal(false)}
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

      {/* Quick Daily Log Modal */}
      {showQuickLog && selectedLot && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#7C203A] to-[#8B2E48] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Quick Daily Log</h3>
                  <p className="text-rose-100 text-sm">{selectedLot.name} • Day {getDaysFermenting(selectedLot)}</p>
                </div>
                <button
                  onClick={() => setShowQuickLog(false)}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-900 stroke-[3]" />
                </button>
              </div>
            </div>

            <form onSubmit={handleQuickLogSubmit} className="p-6 space-y-6 overflow-y-auto hide-scrollbar" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
              {/* Previous Reading Comparison */}
              {logs.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Last Reading ({new Date(logs[0].log_date).toLocaleDateString()})</p>
                  <div className="flex flex-wrap gap-4 text-blue-700">
                    {logs[0].brix && <span>Brix: {logs[0].brix}°</span>}
                    {logs[0].temp_f && <span>Temp: {logs[0].temp_f}°F</span>}
                    {logs[0].ph && <span>pH: {logs[0].ph}</span>}
                    {logs[0].ta && <span>TA: {logs[0].ta} g/L</span>}
                  </div>
                </div>
              )}

              {/* Essential Readings - Large Mobile-Friendly Inputs */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 text-lg">Essential Readings</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Brix */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Brix (°Bx) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={quickLogData.brix}
                      onChange={(e) => setQuickLogData({...quickLogData, brix: e.target.value})}
                      required
                      className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A] transition-all"
                      placeholder="22.3"
                      inputMode="decimal"
                    />
                    <p className="text-xs text-gray-500 mt-1">Watch for steady daily drop</p>
                  </div>

                  {/* Must Temperature */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Must Temp (°F) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={quickLogData.temp_f}
                      onChange={(e) => setQuickLogData({...quickLogData, temp_f: e.target.value})}
                      required
                      className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A] transition-all"
                      placeholder="75"
                      inputMode="decimal"
                    />
                    <p className="text-xs text-gray-500 mt-1">Red: 75-85°F • White: 55-70°F</p>
                  </div>
                </div>

                {/* Ambient Temperature (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ambient/Room Temp (°F) <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={quickLogData.ambient_temp}
                    onChange={(e) => setQuickLogData({...quickLogData, ambient_temp: e.target.value})}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                    placeholder="68"
                    inputMode="decimal"
                  />
                </div>

                {/* pH and TA - Optional */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      pH <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={quickLogData.ph}
                      onChange={(e) => setQuickLogData({...quickLogData, ph: e.target.value})}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                      placeholder="3.45"
                      inputMode="decimal"
                    />
                    <p className="text-xs text-gray-500 mt-1">Check at crush, after inoculation, mid-ferment</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TA (g/L) <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={quickLogData.ta}
                      onChange={(e) => setQuickLogData({...quickLogData, ta: e.target.value})}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                      placeholder="6.5"
                      inputMode="decimal"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total acidity in grams per liter</p>
                  </div>
                </div>
              </div>

              {/* Cellar Work - Large Touch Targets */}
              <div>
                <h4 className="font-semibold text-gray-900 text-lg mb-3">Cellar Work Today</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: 'punchdown', label: 'Punchdown', icon: Activity, color: 'purple' },
                    { value: 'pumpover', label: 'Pumpover', icon: Droplets, color: 'blue' },
                    { value: 'rack', label: 'Rack', icon: TrendingDown, color: 'amber' },
                    { value: 'add_nutrient', label: 'Add Nutrient', icon: Plus, color: 'green' },
                  ].map((work) => {
                    const Icon = work.icon;
                    const isSelected = quickLogData.work_performed.includes(work.value);

                    return (
                      <button
                        key={work.value}
                        type="button"
                        onClick={() => {
                          const newWork = isSelected
                            ? quickLogData.work_performed.filter(w => w !== work.value)
                            : [...quickLogData.work_performed, work.value];
                          setQuickLogData({...quickLogData, work_performed: newWork});
                        }}
                        className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? `border-${work.color}-600 bg-${work.color}-50 text-${work.color}-900`
                            : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700'
                        }`}
                      >
                        <Icon className="w-6 h-6 flex-shrink-0" />
                        <span className="text-base font-medium">{work.label}</span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sensory Observations */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 text-lg">Sensory Check</h4>

                {/* Smell */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Smell</label>
                  <select
                    value={quickLogData.smell_notes}
                    onChange={(e) => setQuickLogData({...quickLogData, smell_notes: e.target.value})}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                  >
                    <option value="">Select...</option>
                    <option value="Normal - fruity, yeasty, CO₂">✓ Normal - fruity, yeasty, CO₂</option>
                    <option value="⚠️ Rotten egg (H₂S)">⚠️ Rotten egg (H₂S)</option>
                    <option value="⚠️ Nail polish / Solvent (high VA)">⚠️ Nail polish / Solvent (high VA)</option>
                    <option value="⚠️ Vinegar smell">⚠️ Vinegar smell</option>
                    <option value="⚠️ Moldy or musty">⚠️ Moldy or musty</option>
                  </select>
                </div>

                {/* Taste */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Taste</label>
                  <input
                    type="text"
                    value={quickLogData.taste_notes}
                    onChange={(e) => setQuickLogData({...quickLogData, taste_notes: e.target.value})}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                    placeholder="e.g., clean, balanced, harsh, chemical notes..."
                  />
                </div>

                {/* Cap Condition (for reds) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cap Condition (reds only)</label>
                  <select
                    value={quickLogData.cap_condition}
                    onChange={(e) => setQuickLogData({...quickLogData, cap_condition: e.target.value})}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                  >
                    <option value="">Select...</option>
                    <option value="✓ Moist, easy to punch">✓ Moist, easy to punch</option>
                    <option value="⚠️ Drying out">⚠️ Drying out</option>
                    <option value="⚠️ Very thick, hard to punch">⚠️ Very thick, hard to punch</option>
                    <option value="⚠️ Thin or breaking down">⚠️ Thin or breaking down</option>
                  </select>
                </div>

                {/* Visual Issues */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visual Issues?</label>
                  <input
                    type="text"
                    value={quickLogData.visual_notes}
                    onChange={(e) => setQuickLogData({...quickLogData, visual_notes: e.target.value})}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                    placeholder="e.g., excess foaming, odd colors, film, mold..."
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  value={quickLogData.notes}
                  onChange={(e) => setQuickLogData({...quickLogData, notes: e.target.value})}
                  rows="2"
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                  placeholder="Any other observations..."
                />
              </div>

              {/* Form Actions - Large Mobile Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-6 py-4 bg-gradient-to-r from-[#7C203A] to-[#8B2E48] text-white rounded-xl hover:from-[#8B2E48] hover:to-[#7C203A] transition-all shadow-md text-base font-semibold"
                >
                  Save Daily Log
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickLog(false)}
                  className="w-full sm:w-auto px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors text-base font-medium"
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
  );
}
