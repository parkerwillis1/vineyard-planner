import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import {
  Sparkles, Plus, TrendingDown, AlertTriangle, Clock,
  Thermometer, Activity, CheckCircle2, Circle, Droplets,
  Copy, Zap, Target, Calendar, FlaskConical, X, Play, ChevronDown, Archive,
  Beaker, AlertOctagon, Pill, Wind, FileWarning, CheckCheck, Lightbulb
} from 'lucide-react';
import { DocLink } from '@/shared/components/DocLink';
import {
  getActiveFermentations,
  createFermentationLog,
  listFermentationLogs,
  updateLot,
  createLot,
  listLots,
  listContainers,
  updateContainer,
  listSensors,
  getLotReadings,
  logLotAssignment,
  archiveFermentationLog,
  listFermentationEvents,
  createFermentationEvent,
  updateFermentationEvent,
  resolveFermentationEvent
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
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showVesselDropdown, setShowVesselDropdown] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [recordingAction, setRecordingAction] = useState(null); // 'punchdown' | 'pumpover' | null
  const [recordedAction, setRecordedAction] = useState(null); // Shows checkmark briefly after recording
  const [showStartFermentationModal, setShowStartFermentationModal] = useState(false);
  const [containers, setContainers] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [lotSensor, setLotSensor] = useState(null);
  const [fermentationStartData, setFermentationStartData] = useState({
    volume_gallons: '',
    so2_ppm: '',
    yeast_strain: '',
    yeast_grams: '',
    nutrient_type: 'Fermaid K',
    nutrient_grams: '',
    container_id: null,
    target_fermentation_days: 14,
    fermentation_start_date: '', // Will be set to current datetime when modal opens
    notes: ''
  });

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({
    title: '',
    message: '',
    onConfirm: null
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

  // Fermentation Events state
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventModalType, setEventModalType] = useState('nutrient'); // 'nutrient' | 'deviation' | 'intervention' | 'oxygen'
  const [eventFormData, setEventFormData] = useState({
    event_type: 'nutrient',
    category: '',
    dosage: '',
    dosage_unit: 'g',
    yan_reading: '',
    severity: 'medium',
    intensity: 'moderate',
    extraction_goal: 'general',
    brix_at_event: '',
    temp_at_event: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (lotIdFromUrl && lots.length > 0) {
      const lot = lots.find(l => l.id === lotIdFromUrl);
      if (lot) setSelectedLot(lot);
    }
  }, [lotIdFromUrl, lots]);

  // Close vessel dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showVesselDropdown && !event.target.closest('.vessel-dropdown-container')) {
        setShowVesselDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showVesselDropdown]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeResult, readyResult, containersResult, sensorsResult] = await Promise.all([
        getActiveFermentations(),
        listLots({ status: 'harvested,crushing' }),
        listContainers(),
        listSensors({ status: 'active' })
      ]);

      if (activeResult.error) throw activeResult.error;
      if (readyResult.error) throw readyResult.error;
      if (containersResult.error) throw containersResult.error;
      if (sensorsResult.error) throw sensorsResult.error;

      setLots(activeResult.data || []);
      setLotsReadyToStart(readyResult.data || []);
      setContainers(containersResult.data || []);
      setSensors(sensorsResult.data || []);

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

  const loadEvents = async (lotId) => {
    try {
      const { data, error: eventsError } = await listFermentationEvents(lotId);
      if (eventsError) throw eventsError;
      setEvents(data || []);
    } catch (err) {
      console.error('Error loading events:', err);
    }
  };

  useEffect(() => {
    if (selectedLot) {
      loadLogs(selectedLot.id);
      loadEvents(selectedLot.id);

      // Find sensor for this lot
      const sensor = sensors.find(s => s.lot_id === selectedLot.id);
      setLotSensor(sensor || null);
    }
  }, [selectedLot, sensors]);

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

  // Quick action: Record punchdown
  const handleQuickPunchdown = async () => {
    setRecordingAction('punchdown');
    try {
      const logData = {
        lot_id: selectedLot.id,
        work_performed: ['punchdown'],
        notes: 'Quick punchdown entry'
      };
      await createFermentationLog(logData);
      setRecordingAction(null);
      setRecordedAction('punchdown');
      loadLogs(selectedLot.id);
      setTimeout(() => setRecordedAction(null), 2000);
    } catch (err) {
      setRecordingAction(null);
      setError(err.message);
    }
  };

  // Quick action: Record pumpover
  const handleQuickPumpover = async () => {
    setRecordingAction('pumpover');
    try {
      const logData = {
        lot_id: selectedLot.id,
        work_performed: ['pumpover'],
        notes: 'Quick pumpover entry'
      };
      await createFermentationLog(logData);
      setRecordingAction(null);
      setRecordedAction('pumpover');
      loadLogs(selectedLot.id);
      setTimeout(() => setRecordedAction(null), 2000);
    } catch (err) {
      setRecordingAction(null);
      setError(err.message);
    }
  };

  // Copy yesterday's cellar work
  const handleCopyYesterday = () => {
    if (logs.length > 0) {
      const yesterday = logs[0];
      setQuickLogData(prev => ({
        ...prev,
        brix: yesterday.brix || selectedLot?.current_brix || '',
        temp_f: yesterday.temp_f || selectedLot?.current_temp_f || '',
        ph: yesterday.ph || '',
        ta: yesterday.ta || '',
        work_performed: yesterday.work_performed || []
      }));
      setShowQuickLog(true);
      setSuccess('Copied yesterday\'s data - modify as needed');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Event handling functions
  const handleOpenEventModal = (type) => {
    setEventModalType(type);
    setEventFormData({
      event_type: type,
      category: '',
      dosage: '',
      dosage_unit: 'g',
      yan_reading: '',
      severity: 'medium',
      intensity: 'moderate',
      extraction_goal: 'general',
      brix_at_event: selectedLot?.current_brix || '',
      temp_at_event: selectedLot?.current_temp_f || '',
      notes: ''
    });
    setShowEventModal(true);
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        lot_id: selectedLot.id,
        event_type: eventFormData.event_type,
        category: eventFormData.category || null,
        dosage: eventFormData.dosage ? parseFloat(eventFormData.dosage) : null,
        dosage_unit: eventFormData.dosage ? eventFormData.dosage_unit : null,
        yan_reading: eventFormData.yan_reading ? parseFloat(eventFormData.yan_reading) : null,
        severity: eventFormData.event_type === 'deviation' ? eventFormData.severity : null,
        intensity: eventFormData.event_type === 'oxygen' ? eventFormData.intensity : null,
        extraction_goal: eventFormData.event_type === 'oxygen' ? eventFormData.extraction_goal : null,
        brix_at_event: eventFormData.brix_at_event ? parseFloat(eventFormData.brix_at_event) : null,
        temp_at_event: eventFormData.temp_at_event ? parseFloat(eventFormData.temp_at_event) : null,
        notes: eventFormData.notes || null
      };

      const { error } = await createFermentationEvent(eventData);
      if (error) throw error;

      setShowEventModal(false);
      setSuccess(`${eventFormData.event_type.charAt(0).toUpperCase() + eventFormData.event_type.slice(1)} recorded`);
      loadEvents(selectedLot.id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResolveEvent = async (eventId) => {
    const resolution = prompt('Enter resolution notes:');
    if (resolution === null) return;

    try {
      const { error } = await resolveFermentationEvent(eventId, resolution);
      if (error) throw error;

      setSuccess('Event resolved');
      loadEvents(selectedLot.id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Event type configurations
  const EVENT_TYPES = {
    nutrient: {
      label: 'Nutrient Addition',
      icon: Pill,
      color: 'emerald',
      categories: [
        { value: 'dap', label: 'DAP (Diammonium Phosphate)' },
        { value: 'fermaid_k', label: 'Fermaid K' },
        { value: 'fermaid_o', label: 'Fermaid O (Organic)' },
        { value: 'goferm', label: 'Go-Ferm' },
        { value: 'nutristart', label: 'Nutristart' },
        { value: 'other', label: 'Other Nutrient' }
      ]
    },
    deviation: {
      label: 'Issue / Deviation',
      icon: AlertOctagon,
      color: 'red',
      categories: [
        { value: 'stuck_ferment', label: 'Stuck Fermentation' },
        { value: 'h2s', label: 'H₂S (Rotten Egg)' },
        { value: 'va', label: 'High VA (Volatile Acidity)' },
        { value: 'temp_spike', label: 'Temperature Spike' },
        { value: 'temp_drop', label: 'Temperature Drop' },
        { value: 'slow_start', label: 'Slow Start' },
        { value: 'foam_over', label: 'Foam Over' },
        { value: 'off_odor', label: 'Off Odor' },
        { value: 'other', label: 'Other Issue' }
      ]
    },
    intervention: {
      label: 'Intervention',
      icon: Zap,
      color: 'amber',
      categories: [
        { value: 'yeast_reinoc', label: 'Yeast Re-inoculation' },
        { value: 'temp_adjust', label: 'Temperature Adjustment' },
        { value: 'acid_adjust', label: 'Acid Adjustment' },
        { value: 'so2_addition', label: 'SO₂ Addition' },
        { value: 'copper_treatment', label: 'Copper Treatment (H₂S)' },
        { value: 'stirring', label: 'Lees Stirring' },
        { value: 'other', label: 'Other Intervention' }
      ]
    },
    oxygen: {
      label: 'Oxygen / Extraction',
      icon: Wind,
      color: 'blue',
      categories: [
        { value: 'delestage', label: 'Délestage (Rack & Return)' },
        { value: 'rack_return', label: 'Rack and Return' },
        { value: 'micro_ox', label: 'Micro-oxygenation' },
        { value: 'splash_rack', label: 'Splash Racking' },
        { value: 'extended_maceration', label: 'Extended Maceration' },
        { value: 'other', label: 'Other' }
      ]
    }
  };

  // Get unresolved deviations count
  const unresolvedDeviations = events.filter(e => e.event_type === 'deviation' && !e.resolved);

  // =====================================================
  // ACTION RECOMMENDATIONS ENGINE
  // Analyzes fermentation data and provides actionable suggestions
  // =====================================================
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

  const handleArchiveLog = (logId) => {
    setConfirmModalData({
      title: 'Archive Log Entry?',
      message: 'This log will be moved to the Archives page.',
      onConfirm: async () => {
        try {
          const { error } = await archiveFermentationLog(logId);
          if (error) throw error;

          // Reload logs to remove archived one from view
          loadLogs(selectedLot.id);
          setSuccess('Log archived successfully');
          setShowConfirmModal(false);
        } catch (err) {
          console.error('Error archiving log:', err);
          setError('Failed to archive log');
          setShowConfirmModal(false);
        }
      }
    });
    setShowConfirmModal(true);
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

    // Format current datetime for datetime-local input (YYYY-MM-DDTHH:mm)
    const now = new Date();
    const localDatetime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
      .toISOString()
      .slice(0, 16); // Gets "YYYY-MM-DDTHH:mm"

    setFermentationStartData({
      volume_gallons: lot.current_volume_gallons || '',
      so2_ppm: recommendedSO2 || '',
      yeast_strain: recommendedYeast,
      yeast_grams: '',
      nutrient_type: 'Fermaid K',
      nutrient_grams: '',
      container_id: lot.container_id || null,
      target_fermentation_days: targetDays,
      fermentation_start_date: localDatetime,
      notes: ''
    });
    setShowStartFermentationModal(true);
  };

  // Handle starting fermentation with SO₂, yeast, and nutrients
  const handleStartFermentation = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const fermentVolume = parseFloat(fermentationStartData.volume_gallons);
      const parentVolume = parseFloat(selectedLot.current_volume_gallons);

      // Validate volume
      if (fermentVolume > parentVolume) {
        throw new Error(`Cannot ferment ${fermentVolume} gallons - only ${parentVolume} gallons available in lot`);
      }

      // Parse the custom fermentation start date from the form
      const startDate = new Date(fermentationStartData.fermentation_start_date);
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
Split from parent lot: ${selectedLot.name} (${fermentVolume} of ${parentVolume} gallons)
${fermentationStartData.notes ? `\nNotes: ${fermentationStartData.notes}` : ''}`;

      // Create child lot name with vessel info
      const childLotName = containerInfo
        ? `${selectedLot.name} - ${containerInfo.name}`
        : `${selectedLot.name} - Batch ${Date.now().toString().slice(-4)}`;

      // Create new child lot for fermentation
      const childLotData = {
        name: childLotName,
        vintage: selectedLot.vintage,
        varietal: selectedLot.varietal,
        appellation: selectedLot.appellation,
        block_id: selectedLot.block_id,
        parent_lot_id: selectedLot.id,
        harvest_date: selectedLot.harvest_date,
        initial_weight_lbs: null,
        initial_brix: selectedLot.initial_brix,
        initial_ph: selectedLot.initial_ph,
        initial_ta: selectedLot.initial_ta,
        current_volume_gallons: fermentVolume,
        current_brix: selectedLot.current_brix,
        current_ph: selectedLot.current_ph,
        current_ta: selectedLot.current_ta,
        status: 'fermenting',
        fermentation_start_date: startDate.toISOString(),
        target_fermentation_days: parseInt(fermentationStartData.target_fermentation_days) || null,
        so2_ppm: parseFloat(fermentationStartData.so2_ppm) || null,
        yeast_strain: fermentationStartData.yeast_strain || null,
        container_id: fermentationStartData.container_id || null,
        notes: startNotes
      };

      // Create the child lot
      const { data: newLot, error: createError } = await createLot(childLotData);
      if (createError) {
        console.error('Error creating child lot:', createError);
        throw new Error(createError.message || 'Failed to create fermentation lot');
      }

      // Update container status to "in_use" if a container was assigned
      if (fermentationStartData.container_id && newLot?.id) {
        const { error: containerError } = await updateContainer(fermentationStartData.container_id, {
          status: 'in_use'
        });
        if (containerError) {
          console.error('Error updating container status:', containerError);
          // Don't throw - this is non-critical, lot was still created successfully
        }

        // Log vessel history event
        try {
          await logLotAssignment(fermentationStartData.container_id, newLot.id, fermentVolume);
        } catch (historyError) {
          console.error('Error logging vessel history:', historyError);
          // Don't throw - this is non-critical
        }
      }

      // Update parent lot - reduce volume, advance to fermenting status, and add note
      const remainingVolume = parentVolume - fermentVolume;
      const parentNote = `\n\n--- BATCH SPLIT ---\nDate: ${startDate.toLocaleDateString()}\nSplit ${fermentVolume} gallons into ${childLotName} for fermentation\nRemaining: ${remainingVolume} gallons`;

      const { error: updateError } = await updateLot(selectedLot.id, {
        current_volume_gallons: remainingVolume,
        status: 'fermenting', // Advance parent to fermenting when child starts fermenting
        notes: selectedLot.notes ? `${selectedLot.notes}${parentNote}` : parentNote
      });

      if (updateError) {
        console.error('Error updating parent lot:', updateError);
        throw new Error(updateError.message || 'Failed to update parent lot');
      }

      setSuccess(`Fermentation started! Created ${childLotName} with ${fermentVolume} gallons. Parent lot has ${remainingVolume} gallons remaining.`);
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

    const now = new Date();
    const startDate = new Date(lot.fermentation_start_date);
    const diffMs = now - startDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Debug logging
    console.log('Fermentation Timer Debug:', {
      lotName: lot.name,
      fermentation_start_date: lot.fermentation_start_date,
      startDate: startDate.toISOString(),
      now: now.toISOString(),
      diffMs,
      diffDays
    });

    return diffDays;
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

  // Generate AI recommendations based on current fermentation state
  const generateRecommendations = (lot, lotLogs, lotEvents) => {
    if (!lot) return [];

    const recommendations = [];
    const days = getDaysFermenting(lot);
    const brix = lot.current_brix;
    const temp = lot.current_temp_f;
    const profile = selectedProfile ? FERMENTATION_PROFILES[selectedProfile] : null;

    // Get recent logs for trend analysis
    const recentLogs = lotLogs.slice(0, 5);
    const lastLog = recentLogs[0];
    const prevLog = recentLogs[1];

    // Get nutrient events
    const nutrientEvents = lotEvents.filter(e => e.event_type === 'nutrient');
    const lastNutrientDay = nutrientEvents.length > 0
      ? Math.floor((Date.now() - new Date(nutrientEvents[0].event_date).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // 1. STUCK FERMENTATION DETECTION
    // Check based on Brix vs time (doesn't require logs)
    if (brix > 5 && days > 14) {
      recommendations.push({
        type: 'warning',
        priority: 'high',
        title: 'Stuck Fermentation',
        message: `Brix still at ${brix}° after ${days} days. Fermentation appears stuck.`,
        suggestions: [
          'Check temperature - ensure it\'s in yeast\'s active range (65-85°F for most)',
          'Add yeast nutrients (DAP + Fermaid K)',
          'Gently stir lees to resuspend yeast',
          'Check for H₂S (rotten egg smell) - indicates yeast stress',
          'Consider re-inoculating with fresh, active yeast starter',
          'Warm the must if temperature is too low'
        ],
        action: 'log',
        actionLabel: 'Log Current Reading'
      });
    }

    // More severe: barely any Brix drop from initial
    if (lot.initial_brix && brix > 5) {
      const brixDrop = lot.initial_brix - brix;
      if (brixDrop < 3 && days > 7) {
        recommendations.push({
          type: 'warning',
          priority: 'high',
          title: 'Critical: Fermentation Not Starting',
          message: `Only ${brixDrop.toFixed(1)}° Brix drop in ${days} days (started at ${lot.initial_brix}°). Fermentation may have never started.`,
          suggestions: [
            'Verify yeast was properly rehydrated and pitched',
            'Check if SO₂ level was too high (inhibits yeast)',
            'Temperature may be too cold for yeast activity',
            'Re-inoculate with a fresh yeast starter immediately',
            'Consider using a stronger yeast strain (EC-1118)'
          ],
          action: 'log',
          actionLabel: 'Log Current Reading'
        });
      }
    }

    // Also check based on log trends if available
    if (brix > 2 && days > 3 && recentLogs.length >= 2) {
      const brixChange = prevLog?.brix && lastLog?.brix
        ? prevLog.brix - lastLog.brix
        : 0;

      if (brixChange < 0.5 && brix > 5) {
        // Only add if not already flagged above
        if (days <= 14) {
          recommendations.push({
            type: 'warning',
            priority: 'high',
            title: 'Fermentation Slowing',
            message: `Brix dropped only ${brixChange.toFixed(1)}° since last reading. Current: ${brix}°`,
            suggestions: [
              'Check temperature - ensure it\'s in yeast\'s active range',
              'Consider nutrient addition (DAP or Fermaid)',
              'Gently stir lees to resuspend yeast',
              'Check for H₂S (rotten egg smell)',
              'May need to re-inoculate with fresh yeast'
            ],
            action: 'log',
            actionLabel: 'Log Current Reading'
          });
        }
      }
    }

    // 2. TEMPERATURE ALERTS
    if (temp && profile) {
      if (temp > profile.tempRange.max) {
        recommendations.push({
          type: 'warning',
          priority: 'high',
          title: 'Temperature Too High',
          message: `Current ${temp}°F exceeds ${profile.name} max of ${profile.tempRange.max}°F`,
          suggestions: [
            'Reduce punchdown/pumpover frequency',
            'Cool the tank if possible',
            'Move to cooler location',
            'Consider adding dry ice (emergency)'
          ],
          action: 'log',
          actionLabel: 'Log Current Reading'
        });
      } else if (temp < profile.tempRange.min) {
        recommendations.push({
          type: 'warning',
          priority: 'medium',
          title: 'Temperature Too Low',
          message: `Current ${temp}°F is below ${profile.name} min of ${profile.tempRange.min}°F`,
          suggestions: [
            'Fermentation may be sluggish',
            'Move to warmer location',
            'Increase punchdown frequency to generate heat',
            'Use fermentation wrap/blanket'
          ],
          action: 'log',
          actionLabel: 'Log Current Reading'
        });
      }
    } else if (temp) {
      // General temp alerts without profile
      if (temp > 90) {
        recommendations.push({
          type: 'warning',
          priority: 'high',
          title: 'High Temperature Alert',
          message: `${temp}°F is getting dangerously high. Yeast stress likely.`,
          suggestions: [
            'Cool immediately to prevent yeast death',
            'Reduce pumpovers/punchdowns',
            'May cause off-flavors if not addressed'
          ],
          action: 'log',
          actionLabel: 'Log Current Reading'
        });
      }
    }

    // 3. NUTRIENT TIMING RECOMMENDATIONS
    if (brix && brix > 5) {
      const brixDropPercent = lot.initial_brix
        ? ((lot.initial_brix - brix) / lot.initial_brix) * 100
        : 0;

      // First nutrient at 1/3 sugar depletion (~33%)
      if (brixDropPercent >= 25 && brixDropPercent < 40 && nutrientEvents.length === 0) {
        recommendations.push({
          type: 'info',
          priority: 'medium',
          title: 'Nutrient Addition Recommended',
          message: `At ~${Math.round(brixDropPercent)}% sugar depletion. First nutrient addition typically at 1/3 depletion.`,
          suggestions: [
            'Add Fermaid K or Fermaid O',
            'Typical dose: 1g/gal or 25g/hL',
            'Helps prevent H₂S formation',
            'Supports healthy yeast activity'
          ],
          action: 'nutrient',
          actionLabel: 'Add Nutrient'
        });
      }

      // Second nutrient at 2/3 sugar depletion (~66%)
      if (brixDropPercent >= 55 && brixDropPercent < 70 && nutrientEvents.length === 1) {
        recommendations.push({
          type: 'info',
          priority: 'medium',
          title: 'Second Nutrient Addition',
          message: `At ~${Math.round(brixDropPercent)}% sugar depletion. Second nutrient typically at 2/3 depletion.`,
          suggestions: [
            'Add second dose of Fermaid K/O',
            'Last chance for effective nutrient uptake',
            'DAP alone is less effective this late'
          ],
          action: 'nutrient',
          actionLabel: 'Add Nutrient'
        });
      }
    }

    // 4. MISSING LOG ALERT
    if (lastLog) {
      const hoursSinceLog = (Date.now() - new Date(lastLog.log_date).getTime()) / (1000 * 60 * 60);
      const daysSinceLog = Math.floor(hoursSinceLog / 24);
      if (daysSinceLog >= 2) {
        recommendations.push({
          type: 'warning',
          priority: 'medium',
          title: 'Log Reminder',
          message: `No log in ${daysSinceLog} days. Regular monitoring is important during fermentation.`,
          suggestions: [
            'Check Brix to track fermentation progress',
            'Record temperature',
            'Note any sensory changes (smell, appearance)',
            'Perform punchdown/pumpover if needed for reds'
          ],
          action: 'log',
          actionLabel: 'Quick Log'
        });
      }
    } else if (days > 0) {
      // No logs at all for an active fermentation
      recommendations.push({
        type: 'warning',
        priority: 'medium',
        title: 'No Logs Recorded',
        message: `This lot has been fermenting for ${days} days with no logged readings.`,
        suggestions: [
          'Start logging daily Brix readings',
          'Record temperature to ensure healthy fermentation',
          'Document any cellar work performed'
        ],
        action: 'log',
        actionLabel: 'Quick Log'
      });
    }

    // 5. PRESS READINESS
    if (brix !== null && brix <= 2 && brix > -2) {
      const daysSinceDry = recentLogs.filter(l => l.brix && l.brix <= 2).length;

      recommendations.push({
        type: 'success',
        priority: 'medium',
        title: 'Approaching Press Readiness',
        message: `Brix at ${brix}°. Fermentation appears ${brix <= 0 ? 'complete (dry)' : 'nearly complete'}.`,
        suggestions: [
          'Taste daily to assess tannin extraction',
          'Consider extended maceration for reds',
          'Watch for VA development if leaving on skins',
          'Press window typically 1-5 days after going dry'
        ],
        action: null,
        actionLabel: null
      });
    }

    // 6. H2S WARNING (from sensory notes)
    const recentH2SNote = lotLogs.slice(0, 3).find(l =>
      l.notes?.toLowerCase().includes('h2s') ||
      l.notes?.toLowerCase().includes('rotten egg') ||
      l.notes?.toLowerCase().includes('sulfur')
    );
    if (recentH2SNote) {
      recommendations.push({
        type: 'warning',
        priority: 'high',
        title: 'H₂S Detected in Recent Notes',
        message: 'Sulfur/rotten egg smell was noted. Action needed to prevent permanent fault.',
        suggestions: [
          'Splash rack to aerate',
          'Add copper sulfate (0.5 ppm max)',
          'Add nutrient if fermentation still active',
          'Increase punchdown frequency'
        ],
        action: 'log',
        actionLabel: 'Log Current Reading'
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  // Generate recommendations for selected lot
  const recommendations = selectedLot ? generateRecommendations(selectedLot, logs, events) : [];

  // Handle pressing wine (fermenting → pressed)
  const handlePressWine = () => {
    setConfirmModalData({
      title: `Press ${selectedLot.name}?`,
      message: 'This will mark the fermentation as complete and move the lot to "pressed" status.',
      onConfirm: async () => {
        try {
          const { error: updateError } = await updateLot(selectedLot.id, {
            status: 'pressed',
            press_date: new Date().toISOString()
          });

          if (updateError) throw updateError;

          setSuccess('Wine pressed successfully! Now assign to barrels in the Aging page.');
          loadData();
          setSelectedLot(null); // Clear selection since it's no longer fermenting
          setShowConfirmModal(false);

          // Navigate to aging page after a brief delay
          setTimeout(() => {
            navigate('/production?view=aging');
          }, 2000);
        } catch (err) {
          console.error('Error pressing wine:', err);
          setError(err.message);
          setShowConfirmModal(false);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const getChartData = () => {
    if (!logs || logs.length === 0) return [];

    // Sort logs by date
    const sortedLogs = [...logs].sort((a, b) => new Date(a.log_date) - new Date(b.log_date));

    // Get the start date
    const startDate = new Date(sortedLogs[0].log_date);
    startDate.setHours(0, 0, 0, 0);

    // Create data points with days since start
    const data = sortedLogs.map((log) => {
      const logDate = new Date(log.log_date);
      logDate.setHours(0, 0, 0, 0);
      const daysSinceStart = Math.floor((logDate - startDate) / (1000 * 60 * 60 * 24));

      return {
        day: daysSinceStart,
        brix: log.brix || null,
        temp: log.temp_f || null,
        ph: log.ph || null,
        ta: log.ta || null,
        displayDate: logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: log.log_date
      };
    });

    // If multiple logs on same day, take the latest reading for each metric
    const consolidatedData = [];
    const dayMap = new Map();

    data.forEach(point => {
      if (!dayMap.has(point.day)) {
        dayMap.set(point.day, point);
      } else {
        const existing = dayMap.get(point.day);
        dayMap.set(point.day, {
          ...existing,
          brix: point.brix !== null ? point.brix : existing.brix,
          temp: point.temp !== null ? point.temp : existing.temp,
          ph: point.ph !== null ? point.ph : existing.ph,
          ta: point.ta !== null ? point.ta : existing.ta
        });
      }
    });

    // Convert map back to array and sort by day
    const result = Array.from(dayMap.values()).sort((a, b) => a.day - b.day);

    // Add target temp if profile selected
    if (selectedProfile && FERMENTATION_PROFILES[selectedProfile]) {
      const profile = FERMENTATION_PROFILES[selectedProfile];
      return result.map(d => ({
        ...d,
        targetTemp: profile.tempRange.ideal
      }));
    }

    return result;
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

  // Calculate vessel availability
  const getAvailableVessels = () => {
    // Get all active fermentations
    const activeFermentations = lots.filter(lot => lot.status === 'fermenting');

    // Calculate used volume per container
    const containerUsage = {};
    activeFermentations.forEach(lot => {
      if (lot.container_id) {
        containerUsage[lot.container_id] = (containerUsage[lot.container_id] || 0) + parseFloat(lot.current_volume_gallons || 0);
      }
    });

    // Filter and annotate containers
    return containers
      .filter(c => c.type === 'tank' || c.type === 'tote' || c.type === 'ibc')
      .map(container => {
        const usedVolume = containerUsage[container.id] || 0;
        const availableVolume = container.capacity_gallons - usedVolume;
        const percentUsed = (usedVolume / container.capacity_gallons) * 100;

        return {
          ...container,
          usedVolume,
          availableVolume,
          percentUsed,
          isAvailable: availableVolume > 0
        };
      })
      .sort((a, b) => b.availableVolume - a.availableVolume); // Sort by most available first
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

  // Show empty state only if there are no active fermentations AND no lots ready to start
  if (lots.length === 0 && lotsReadyToStart.length === 0) {
    return (
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Fermentation Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor active fermentations and daily cellar work. <DocLink docId="production/fermentation" /></p>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center mt-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">No lots ready for fermentation</p>
          <p className="text-sm text-gray-400">Create harvest intakes with "Crushing" status, then start fermentation from this page</p>
        </div>
      </div>
    );
  }

  const chartData = getChartData();
  const fermentStatus = selectedLot ? getFermentationStatus(selectedLot) : null;

  // Generate alerts for ALL fermenting lots, not just selected
  const allLotsAlerts = lots.filter(lot => lot.status === 'fermenting').flatMap(lot => {
    const lotAlerts = [];
    const days = getDaysFermenting(lot);

    // Stuck fermentation - high Brix after many days
    if (lot.current_brix > 5 && days > 14) {
      lotAlerts.push({
        type: 'error',
        message: `Stuck fermentation - Brix ${lot.current_brix}° after ${days} days`,
        lotId: lot.id,
        lotName: lot.name
      });
    }

    // Very stuck - Brix barely moved
    if (lot.current_brix && lot.initial_brix) {
      const brixDrop = lot.initial_brix - lot.current_brix;
      if (brixDrop < 3 && days > 7) {
        lotAlerts.push({
          type: 'error',
          message: `Critically stuck - only ${brixDrop.toFixed(1)}° Brix drop in ${days} days`,
          lotId: lot.id,
          lotName: lot.name
        });
      }
    }

    // Temperature concerns
    if (lot.current_temp_f) {
      if (lot.current_temp_f > 95) {
        lotAlerts.push({
          type: 'error',
          message: `Dangerous temperature: ${lot.current_temp_f}°F - yeast death risk`,
          lotId: lot.id,
          lotName: lot.name
        });
      } else if (lot.current_temp_f > 90) {
        lotAlerts.push({
          type: 'warning',
          message: `High temperature: ${lot.current_temp_f}°F`,
          lotId: lot.id,
          lotName: lot.name
        });
      }
    }

    return lotAlerts;
  });

  // Legacy alerts for selected lot (for the detailed view)
  const alerts = selectedLot ? getAlerts(selectedLot) : [];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Fermentation Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor active fermentations and daily cellar work. <DocLink docId="production/fermentation" /></p>
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

      {/* Fermentation Alerts Summary - Compact banner */}
      {allLotsAlerts.length > 0 && (
        <div className={`rounded-lg px-4 py-3 flex items-center justify-between ${
          allLotsAlerts.some(a => a.type === 'error')
            ? 'bg-red-50 border border-red-200'
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${
              allLotsAlerts.some(a => a.type === 'error') ? 'text-red-600' : 'text-amber-600'
            }`} />
            <span className={`font-medium ${
              allLotsAlerts.some(a => a.type === 'error') ? 'text-red-800' : 'text-amber-800'
            }`}>
              {(() => {
                const criticalCount = allLotsAlerts.filter(a => a.type === 'error').length;
                const warningCount = allLotsAlerts.filter(a => a.type === 'warning').length;
                const lotsWithIssues = [...new Set(allLotsAlerts.map(a => a.lotId))].length;
                if (criticalCount > 0) {
                  return `${lotsWithIssues} lot${lotsWithIssues > 1 ? 's' : ''} with critical issues`;
                }
                return `${lotsWithIssues} lot${lotsWithIssues > 1 ? 's' : ''} need${lotsWithIssues === 1 ? 's' : ''} attention`;
              })()}
            </span>
          </div>
          <span className="text-xs text-gray-500">Click a lot to see details</span>
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
                    <p className="text-xs text-gray-500">Volume</p>
                    <p className="text-sm font-semibold text-gray-900">{Math.round(lot.current_volume_gallons || 0)} gal</p>
                  </div>
                </div>

                {/* Show "100% Fermenting" if lot has been completely split, otherwise show Start button */}
                {lot.current_volume_gallons <= 0 ? (
                  <div className="w-full px-4 py-2 bg-green-100 text-green-800 rounded-lg border-2 border-green-300 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span className="font-semibold text-sm">100% Fermenting</span>
                    </div>
                    <p className="text-xs text-green-700 mt-0.5">All volume moved to fermentation</p>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenStartFermentation(lot)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start Fermentation
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Fermentations - only show if there are any */}
      {lots.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Active Fermentations</h3>
            <span className="text-sm text-gray-500">{lots.length} lot{lots.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lots.map((lot) => {
            const days = getDaysFermenting(lot);
            const status = getFermentationStatus(lot);
            const isSelected = selectedLot?.id === lot.id;
            const brix = lot.current_brix || 0;
            const startBrix = lot.initial_brix || 24;
            // Check if this lot has critical issues
            const lotHasIssues = allLotsAlerts.some(a => a.lotId === lot.id);
            const lotHasCritical = allLotsAlerts.some(a => a.lotId === lot.id && a.type === 'error');
            // Progress calculation aligned with fermentation status:
            // - Dry (Brix <= 0): 100%
            // - Finishing (Brix 0-2): 95-100% (scales within this range)
            // - Active (Brix > 2): 0-95% based on drop from initial
            let progressPercent;
            if (brix <= 0) {
              progressPercent = 100;
            } else if (brix <= 2) {
              // Finishing phase: 95% to 100%
              progressPercent = 95 + ((2 - brix) / 2) * 5;
            } else {
              // Active phase: 0% to 95% based on brix drop
              progressPercent = Math.max(0, Math.min(95, ((startBrix - brix) / (startBrix - 2)) * 95));
            }

            return (
              <button
                key={lot.id}
                onClick={() => {
                  setSelectedLot(lot);
                  loadLogs(lot.id);
                  loadEvents(lot.id);
                }}
                className={`group relative p-5 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-white border-2 border-[#7C203A] shadow-lg'
                    : lotHasCritical
                      ? 'bg-white border-2 border-red-400 hover:border-red-500 hover:shadow-md'
                      : lotHasIssues
                        ? 'bg-white border-2 border-amber-400 hover:border-amber-500 hover:shadow-md'
                        : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Critical issue indicator */}
                {lotHasCritical && !isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-base truncate">{lot.name}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{lot.varietal} • {lot.vintage}</p>
                  </div>
                  <div className={`ml-3 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                    status.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                    status.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                    status.color === 'green' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {status.label}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-500">Fermentation Progress (based on Brix)</span>
                    <span className="text-xs font-semibold text-gray-700">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        status.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                        status.color === 'amber' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                        status.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-500 mb-1">Day</div>
                    <div className="text-lg font-bold text-gray-900">{days}</div>
                  </div>
                  <div className="text-center border-x border-gray-100">
                    <div className="text-xs font-medium text-gray-500 mb-1">Brix</div>
                    <div className="text-lg font-bold text-gray-900">{lot.current_brix?.toFixed(1) || '—'}<span className="text-sm font-normal">°</span></div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-500 mb-1">Temp</div>
                    <div className="text-lg font-bold text-gray-900">{lot.current_temp_f?.toFixed(0) || '—'}<span className="text-sm font-normal">°F</span></div>
                  </div>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-3 left-3 w-1.5 h-8 bg-[#7C203A] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {selectedLot && (
        <>
          {/* Quick Actions Bar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleOpenQuickLog}
                className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-[#7C203A] to-[#8B2E48] text-white rounded-lg hover:from-[#8B2E48] hover:to-[#7C203A] focus-visible:outline-none focus-visible:ring-0 active:scale-95 transition-all text-sm font-semibold shadow-md"
                style={{ outline: 'none' }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Quick Daily Log
              </button>
              <button
                onClick={handleQuickPunchdown}
                disabled={recordingAction === 'punchdown'}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  recordedAction === 'punchdown'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : recordingAction === 'punchdown'
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                {recordingAction === 'punchdown' ? (
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                ) : recordedAction === 'punchdown' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                {recordedAction === 'punchdown' ? 'Recorded!' : recordingAction === 'punchdown' ? 'Recording...' : 'Punchdown'}
              </button>
              <button
                onClick={handleQuickPumpover}
                disabled={recordingAction === 'pumpover'}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  recordedAction === 'pumpover'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : recordingAction === 'pumpover'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                {recordingAction === 'pumpover' ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : recordedAction === 'pumpover' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Droplets className="w-4 h-4" />
                )}
                {recordedAction === 'pumpover' ? 'Recorded!' : recordingAction === 'pumpover' ? 'Recording...' : 'Pumpover'}
              </button>
              {logs.length > 0 && (
                <button
                  onClick={handleCopyYesterday}
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <Copy className="w-4 h-4" />
                  Copy Yesterday
                </button>
              )}
              <button
                onClick={() => setShowProfileSelector(!showProfileSelector)}
                className="flex items-center gap-2.5 px-5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors text-sm font-medium"
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

          {/* Events & Interventions Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-900">Events & Interventions</h3>
                {recommendations.filter(r => r.type === 'warning').length > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full animate-pulse">
                    {recommendations.filter(r => r.type === 'warning').length} issue{recommendations.filter(r => r.type === 'warning').length > 1 ? 's' : ''} detected
                  </span>
                )}
                {unresolvedDeviations.length > 0 && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    {unresolvedDeviations.length} unresolved
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEventModal('nutrient')}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                >
                  <Pill className="w-4 h-4" />
                  Nutrient
                </button>
                <button
                  onClick={() => handleOpenEventModal('deviation')}
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <AlertOctagon className="w-4 h-4" />
                  Issue
                </button>
                <button
                  onClick={() => handleOpenEventModal('intervention')}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium"
                >
                  <Zap className="w-4 h-4" />
                  Intervention
                </button>
                <button
                  onClick={() => handleOpenEventModal('oxygen')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Wind className="w-4 h-4" />
                  O₂/Extraction
                </button>
              </div>
            </div>

            {/* Auto-Detected Issues */}
            {recommendations.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className={`w-4 h-4 ${
                    recommendations.some(r => r.type === 'warning' && r.priority === 'high')
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }`} />
                  <span className="text-sm font-medium text-gray-700">
                    {recommendations.some(r => r.type === 'warning') ? 'Issues Detected' : 'Alerts & Suggestions'}
                  </span>
                  <span className="text-xs text-gray-400">• Auto-analyzed</span>
                </div>
                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        rec.type === 'warning'
                          ? rec.priority === 'high'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-amber-50 border-amber-200'
                          : rec.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          rec.type === 'warning'
                            ? rec.priority === 'high' ? 'bg-red-100' : 'bg-amber-100'
                            : rec.type === 'success'
                              ? 'bg-emerald-100'
                              : 'bg-blue-100'
                        }`}>
                          {rec.type === 'warning' && (
                            <AlertTriangle className={`w-4 h-4 ${
                              rec.priority === 'high' ? 'text-red-600' : 'text-amber-600'
                            }`} />
                          )}
                          {rec.type === 'success' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                          {rec.type === 'info' && (
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {rec.priority === 'high' && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                                URGENT
                              </span>
                            )}
                            <h4 className={`font-semibold text-sm ${
                              rec.type === 'warning'
                                ? rec.priority === 'high' ? 'text-red-800' : 'text-amber-800'
                                : rec.type === 'success'
                                  ? 'text-emerald-800'
                                  : 'text-blue-800'
                            }`}>
                              {rec.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{rec.message}</p>

                          {/* Solutions shown automatically */}
                          {rec.suggestions && rec.suggestions.length > 0 && (
                            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                              <p className="text-xs font-semibold mb-1.5 text-blue-800">
                                Solution:
                              </p>
                              <ul className="text-xs text-gray-700 space-y-1">
                                {rec.suggestions.map((suggestion, sIdx) => (
                                  <li key={sIdx} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-600" />
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Action button */}
                          {rec.action && rec.actionLabel && (
                            <button
                              onClick={() => {
                                if (rec.action === 'log') {
                                  setShowQuickLog(true);
                                } else if (rec.action === 'nutrient') {
                                  handleOpenEventModal('nutrient');
                                } else if (rec.action === 'deviation') {
                                  handleOpenEventModal('deviation');
                                } else if (rec.action === 'intervention') {
                                  handleOpenEventModal('intervention');
                                }
                              }}
                              className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                rec.type === 'warning'
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : rec.type === 'info'
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {rec.actionLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Timeline */}
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileWarning className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No events recorded yet</p>
                <p className="text-xs mt-1">Track nutrient additions, issues, and interventions</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {events.map((event) => {
                  const config = EVENT_TYPES[event.event_type] || EVENT_TYPES.intervention;
                  const Icon = config.icon;
                  const categoryLabel = config.categories?.find(c => c.value === event.category)?.label || event.category;

                  return (
                    <div
                      key={event.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        event.event_type === 'deviation' && !event.resolved
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`p-2 rounded-lg bg-${config.color}-100`}>
                        <Icon className={`w-4 h-4 text-${config.color}-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">
                            {categoryLabel || config.label}
                          </span>
                          {event.event_type === 'deviation' && !event.resolved && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                              Unresolved
                            </span>
                          )}
                          {event.resolved && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Resolved
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{new Date(event.event_date).toLocaleDateString()}</span>
                          {event.dosage && (
                            <span>{event.dosage} {event.dosage_unit}</span>
                          )}
                          {event.severity && (
                            <span className={`font-medium ${
                              event.severity === 'critical' ? 'text-red-600' :
                              event.severity === 'high' ? 'text-orange-600' :
                              event.severity === 'medium' ? 'text-amber-600' : 'text-gray-600'
                            }`}>
                              {event.severity} severity
                            </span>
                          )}
                          {event.brix_at_event && (
                            <span>Brix: {event.brix_at_event}°</span>
                          )}
                        </div>
                        {event.notes && (
                          <p className="text-xs text-gray-600 mt-1 truncate">{event.notes}</p>
                        )}
                        {event.resolution_notes && (
                          <p className="text-xs text-green-700 mt-1">Resolution: {event.resolution_notes}</p>
                        )}
                      </div>
                      {event.event_type === 'deviation' && !event.resolved && (
                        <button
                          onClick={() => handleResolveEvent(event.id)}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fermentation Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-8">Fermentation Progress</h3>
            <div className="relative px-4">
              {/* Timeline line */}
              <div className="absolute top-7 left-4 right-4 h-0.5 bg-gray-200"></div>
              <div className="absolute top-7 left-4 h-0.5 bg-indigo-500 transition-all duration-500"
                   style={{ width: `${Math.min((getDaysFermenting(selectedLot) / 14) * 100, 100)}%` }}></div>

              {/* Milestones */}
              <div className="relative flex justify-between">
                {getTimelineMilestones(selectedLot).map((milestone, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-3 max-w-[100px]">
                    <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                      milestone.completed
                        ? 'bg-indigo-500 text-white shadow-md ring-4 ring-indigo-50'
                        : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}>
                      {milestone.icon === 'crush' && <Activity className="w-5 h-5" />}
                      {milestone.icon === 'temp' && <Thermometer className="w-5 h-5" />}
                      {milestone.icon === 'dry' && <TrendingDown className="w-5 h-5" />}
                      {milestone.icon === 'press' && <Circle className="w-5 h-5" />}
                      {milestone.completed && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${milestone.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                        {milestone.label}
                      </p>
                      {milestone.detail && (
                        <p className="text-xs text-gray-500 mt-1">{milestone.detail}</p>
                      )}
                      {milestone.day !== null && (
                        <p className="text-xs font-medium text-gray-400 mt-1">Day {milestone.day}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Current Status Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedLot.name}</h3>
                  {selectedLot.parent_lot_id && (
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">
                      Split Lot
                    </span>
                  )}
                </div>
                <p className="text-base text-gray-600">{selectedLot.varietal} • {selectedLot.vintage}</p>
                {selectedLot.parent_lot_id && (
                  <p className="text-sm text-indigo-600 mt-2 flex items-center gap-1">
                    <span className="text-indigo-400">↳</span>
                    Split from parent lot ({selectedLot.current_volume_gallons?.toFixed(0) || '—'} gallons)
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {selectedLot.status === 'fermenting' && (
                  <button
                    onClick={handlePressWine}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm font-medium"
                  >
                    <Circle className="w-4 h-4" />
                    Press Wine
                  </button>
                )}
              </div>
            </div>

            {/* Fermentation Timer */}
            {(() => {
              const timerInfo = getFermentationTimerInfo(selectedLot);
              if (timerInfo) {
                return (
                  <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            timerInfo.isComplete
                              ? 'bg-emerald-50'
                              : timerInfo.isOverdue
                              ? 'bg-rose-50'
                              : 'bg-indigo-50'
                          }`}>
                            <Clock className={`w-5 h-5 ${
                              timerInfo.isComplete
                                ? 'text-emerald-600'
                                : timerInfo.isOverdue
                                ? 'text-rose-600'
                                : 'text-indigo-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">Fermentation Progress</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              Day {timerInfo.daysElapsed + 1} of {selectedLot.target_fermentation_days}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {timerInfo.isComplete ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              <span className="text-sm font-semibold text-emerald-700">Ready to press</span>
                            </div>
                          ) : timerInfo.isOverdue ? (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-rose-600" />
                              <span className="text-sm font-semibold text-rose-700">
                                Overdue {Math.abs(timerInfo.daysRemaining)}d
                              </span>
                            </div>
                          ) : (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">{timerInfo.daysRemaining}</div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Days Left</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-6">
                      {/* Modern Progress Bar */}
                      <div className="relative">
                        <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-3">
                          <span>Progress</span>
                          <span>{timerInfo.percentComplete}%</span>
                        </div>
                        <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ease-out ${
                              timerInfo.isComplete
                                ? 'bg-emerald-500'
                                : timerInfo.isOverdue
                                ? 'bg-rose-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${timerInfo.percentComplete}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">Started</span>
                          <span className="text-xs font-medium text-gray-600">
                            Target {timerInfo.targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else if (selectedLot.fermentation_start_date) {
                // Fermentation started but no target duration set
                return (
                  <div className="mb-6 bg-amber-50/50 rounded-xl border border-amber-200/60 p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                        <Clock className="w-5 h-5 text-amber-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-amber-900 text-sm">Timer Not Available</p>
                        <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
                          This fermentation was started before the timer feature was added. Start a new fermentation to see the countdown timer.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-white rounded-lg shadow-sm">
                    <Clock className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-xs text-gray-600 uppercase font-semibold tracking-wide">Days</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{getDaysFermenting(selectedLot)}</div>
                <div className="text-xs text-gray-500 mt-1">Fermenting</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-white rounded-lg shadow-sm">
                    <TrendingDown className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-xs text-purple-700 uppercase font-semibold tracking-wide">Brix</span>
                </div>
                <div className="text-3xl font-bold text-purple-900">{selectedLot.current_brix?.toFixed(1) || '—'}°</div>
                <div className="text-xs text-purple-600 mt-1">Sugar content</div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl p-5 border border-rose-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <Thermometer className="w-4 h-4 text-rose-600" />
                    </div>
                    <span className="text-xs text-rose-700 uppercase font-semibold tracking-wide">Temp</span>
                  </div>
                  {lotSensor && lotSensor.status === 'active' && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 rounded-full">
                      <Activity className="w-3 h-3 text-emerald-600" />
                      <span className="text-[10px] text-emerald-700 font-bold uppercase">Live</span>
                    </div>
                  )}
                </div>
                <div className="text-3xl font-bold text-rose-900">{selectedLot.current_temp_f?.toFixed(0) || '—'}°F</div>
                {lotSensor && (
                  <div className="text-xs text-rose-600 mt-1">
                    {lotSensor.name}
                    {lotSensor.last_reading_at && (
                      <span className="ml-1">
                        • {new Date(lotSensor.last_reading_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                )}
                {!lotSensor && <div className="text-xs text-rose-600 mt-1">Manual entry</div>}
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-white rounded-lg shadow-sm">
                    <Droplets className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs text-blue-700 uppercase font-semibold tracking-wide">Volume</span>
                </div>
                <div className="text-3xl font-bold text-blue-900">{selectedLot.current_volume_gallons?.toLocaleString() || '—'}</div>
                <div className="text-xs text-blue-600 mt-1">gallons</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header with lot name and day count */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Fermentation Curves
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selectedLot?.name} • Day {chartData.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedProfile && (
                    <span className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-full text-xs font-semibold shadow-sm">
                      {FERMENTATION_PROFILES[selectedProfile].name}
                    </span>
                  )}
                </div>
              </div>

              {/* Chart section */}
              <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                <div className="h-96 bg-white rounded-lg border border-gray-200 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 60, left: 20, bottom: 40 }}
                    >
                      <defs>
                        <linearGradient id="brixGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={true}
                      />

                      <XAxis
                        dataKey="day"
                        type="number"
                        domain={[0, 'dataMax']}
                        tick={{ fontSize: 13, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        tickLine={false}
                        label={{
                          value: 'Days',
                          position: 'insideBottom',
                          offset: -10,
                          style: { fontSize: 14, fill: '#374151', fontWeight: 500 }
                        }}
                        allowDecimals={false}
                        interval={0}
                      />

                      <YAxis
                        yAxisId="left"
                        domain={[-5, 30]}
                        tick={{ fontSize: 13, fill: '#7c3aed' }}
                        stroke="#7c3aed"
                        tickLine={false}
                        label={{
                          value: 'Brix (°)',
                          angle: -90,
                          position: 'insideLeft',
                          offset: 10,
                          style: { fontSize: 14, fill: '#7c3aed', fontWeight: 500 }
                        }}
                      />

                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[50, 105]}
                        tick={{ fontSize: 13, fill: '#dc2626' }}
                        stroke="#dc2626"
                        tickLine={false}
                        label={{
                          value: 'Temperature (°F)',
                          angle: 90,
                          position: 'insideRight',
                          offset: 10,
                          style: { fontSize: 14, fill: '#dc2626', fontWeight: 500 }
                        }}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                        formatter={(value, name) => {
                          if (name === 'Brix') return [`${value}°`, name];
                          if (name === 'Temperature') return [`${value}°F`, name];
                          return [value, name];
                        }}
                        labelFormatter={(value, payload) => {
                          if (payload && payload[0] && payload[0].payload.displayDate) {
                            return `Day ${value} (${payload[0].payload.displayDate})`;
                          }
                          return `Day ${value}`;
                        }}
                      />

                      <Legend
                        wrapperStyle={{ paddingTop: '30px' }}
                        iconType="circle"
                        formatter={(value) => <span style={{ color: '#374151', fontSize: 14 }}>{value}</span>}
                      />

                      {/* Danger zone reference line */}
                      <ReferenceLine
                        yAxisId="right"
                        y={95}
                        stroke="#dc2626"
                        strokeDasharray="5 5"
                        strokeWidth={1.5}
                        label={{
                          value: 'Danger',
                          position: 'insideTopRight',
                          fill: '#dc2626',
                          fontSize: 12,
                          fontWeight: 600,
                          offset: 10
                        }}
                      />

                      {/* Dry zone reference line */}
                      <ReferenceLine
                        yAxisId="left"
                        y={0}
                        stroke="#10b981"
                        strokeDasharray="5 5"
                        strokeWidth={1.5}
                        label={{
                          value: 'Dry',
                          position: 'insideTopRight',
                          fill: '#10b981',
                          fontSize: 12,
                          fontWeight: 600,
                          offset: 10
                        }}
                      />

                      <Line
                        yAxisId="left"
                        type="monotoneX"
                        dataKey="brix"
                        stroke="#7c3aed"
                        strokeWidth={3.5}
                        dot={{ fill: '#7c3aed', r: 5, strokeWidth: 0 }}
                        activeDot={{ r: 7, fill: '#7c3aed' }}
                        name="Brix"
                        connectNulls
                      />

                      <Line
                        yAxisId="right"
                        type="monotoneX"
                        dataKey="temp"
                        stroke="#dc2626"
                        strokeWidth={3.5}
                        dot={{ fill: '#dc2626', r: 5, strokeWidth: 0 }}
                        activeDot={{ r: 7, fill: '#dc2626' }}
                        name="Temperature"
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Quick stats below chart */}
                {chartData.length > 0 && chartData[chartData.length - 1] && (
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
                      <div className="text-xs font-medium text-gray-500 mb-1.5">pH</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {chartData[chartData.length - 1].ph || '—'}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
                      <div className="text-xs font-medium text-gray-500 mb-1.5">TA (g/L)</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {chartData[chartData.length - 1].ta || '—'}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
                      <div className="text-xs font-medium text-gray-500 mb-1.5">Volume</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedLot?.current_volume_gallons
                          ? `${Math.round(selectedLot.current_volume_gallons)}`
                          : '—'}
                      </div>
                      {selectedLot?.current_volume_gallons && (
                        <div className="text-xs text-gray-500 mt-0.5">gallons</div>
                      )}
                    </div>
                  </div>
                )}
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

                      <div className="flex items-center gap-4">
                        <div className="flex gap-3 text-sm">
                          {log.brix && <span className="text-gray-700"><strong>Brix:</strong> {log.brix}°</span>}
                          {log.temp_f && <span className="text-gray-700"><strong>Temp:</strong> {log.temp_f}°F</span>}
                          {log.ph && <span className="text-gray-700"><strong>pH:</strong> {log.ph}</span>}
                        </div>

                        <button
                          onClick={() => handleArchiveLog(log.id)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors group"
                          title="Archive this log"
                        >
                          <Archive className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                        </button>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="bg-gradient-to-r from-[#7C203A] to-[#8B2E48] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Start Fermentation</h3>
                  <p className="text-sm text-white/80">{selectedLot.name} • {selectedLot.vintage} {selectedLot.varietal}</p>
                </div>
              </div>
              <button onClick={() => setShowStartFermentationModal(false)} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleStartFermentation} className="p-6 space-y-6 overflow-y-auto flex-1 hide-scrollbar">
              {/* Vessel Assignment - moved to top */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Fermentation Vessel & Volume</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="relative vessel-dropdown-container">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Tank/Vat *</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowVesselDropdown(!showVesselDropdown)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] bg-white text-left flex items-center justify-between"
                      >
                        <span className={fermentationStartData.container_id ? "text-gray-900" : "text-gray-400"}>
                          {fermentationStartData.container_id
                            ? containers.find(c => c.id === fermentationStartData.container_id)?.name || 'Select vessel...'
                            : 'Select vessel...'
                          }
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showVesselDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showVesselDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                          {getAvailableVessels().map(vessel => {
                            const isDisabled = !vessel.isAvailable; // Only disable if completely full

                            return (
                              <button
                                key={vessel.id}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => {
                                  if (!isDisabled) {
                                    setFermentationStartData({
                                      ...fermentationStartData,
                                      container_id: vessel.id,
                                      // Always set volume to vessel's available capacity
                                      volume_gallons: vessel.availableVolume
                                    });
                                    setShowVesselDropdown(false);
                                  }
                                }}
                                className={`w-full px-4 py-3 text-left border-b border-gray-100 transition-colors ${
                                  isDisabled
                                    ? 'bg-gray-50 cursor-not-allowed opacity-60'
                                    : 'hover:bg-rose-50 cursor-pointer'
                                } ${fermentationStartData.container_id === vessel.id ? 'bg-rose-100' : ''}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{vessel.name}</span>
                                    {vessel.percentUsed > 0 && vessel.percentUsed < 100 && (
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded font-medium">
                                        In Use
                                      </span>
                                    )}
                                    {vessel.percentUsed >= 100 && (
                                      <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded font-medium">
                                        Full
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {Math.round(vessel.availableVolume)} / {vessel.capacity_gallons} gal
                                  </span>
                                </div>

                                {/* Capacity Bar */}
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      vessel.percentUsed >= 100
                                        ? 'bg-red-500'
                                        : vessel.percentUsed > 75
                                          ? 'bg-amber-500'
                                          : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(vessel.percentUsed, 100)}%` }}
                                  ></div>
                                </div>

                                <p className="text-xs text-gray-500 mt-1">
                                  {vessel.type.charAt(0).toUpperCase() + vessel.type.slice(1)}
                                  {vessel.usedVolume > 0 && ` • ${Math.round(vessel.usedVolume)} gal used`}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Adjust volume to split across multiple vessels</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume going into vessel (gallons) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={fermentationStartData.volume_gallons || ''}
                      onChange={(e) => setFermentationStartData({...fermentationStartData, volume_gallons: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]"
                      placeholder="Enter volume"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total harvest: {selectedLot.current_volume_gallons || 'N/A'} gallons</p>
                  </div>
                </div>
              </div>

              {/* SO₂ Addition */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <FlaskConical className="w-4 h-4 text-[#7C203A]" />
                  <h4 className="text-base font-semibold text-gray-900">SO₂ Addition</h4>
                </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]"
                      placeholder="Per manufacturer"
                    />
                  </div>
                </div>
                {fermentationStartData.yeast_strain && YEAST_STRAINS[fermentationStartData.yeast_strain] && (
                  <div className="text-sm bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <p className="text-gray-900"><strong>Temp Range:</strong> {YEAST_STRAINS[fermentationStartData.yeast_strain].temp}</p>
                    <p className="text-gray-900"><strong>Alcohol Tolerance:</strong> {YEAST_STRAINS[fermentationStartData.yeast_strain].alcohol}</p>
                    <p className="text-gray-600 mt-1">{YEAST_STRAINS[fermentationStartData.yeast_strain].notes}</p>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]"
                  />
                </div>
              </div>

              {/* Target Duration */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Fermentation Timeline</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fermentation Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={fermentationStartData.fermentation_start_date}
                      onChange={(e) => setFermentationStartData({...fermentationStartData, fermentation_start_date: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Backdate if fermentation was started earlier</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Duration (days) *</label>
                    <input
                      type="number"
                      value={fermentationStartData.target_fermentation_days}
                      onChange={(e) => setFermentationStartData({...fermentationStartData, target_fermentation_days: e.target.value})}
                      required
                      min="1"
                      max="30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Typical: Whites 7-10 days, Reds 12-21 days</p>
                  </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#7C203A] to-[#8B2E48] text-white rounded-lg hover:from-[#8B2E48] hover:to-[#7C203A] transition-all shadow-md font-semibold"
                >
                  Start Fermentation
                </button>
                <button
                  type="button"
                  onClick={() => setShowStartFermentationModal(false)}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
            <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-[#7C203A]" />
                    Daily Log
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">{selectedLot.name} • Day {getDaysFermenting(selectedLot)}</p>
                </div>
                <button
                  onClick={() => setShowQuickLog(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 rounded-lg p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
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

      {/* Event Modal */}
      {showEventModal && selectedLot && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {(() => {
                      const config = EVENT_TYPES[eventModalType];
                      const Icon = config?.icon || Zap;
                      return <Icon className={`w-6 h-6 text-${config?.color || 'gray'}-600`} />;
                    })()}
                    {EVENT_TYPES[eventModalType]?.label || 'Add Event'}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">{selectedLot.name}</p>
                </div>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 rounded-lg p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitEvent} className="p-6 space-y-5">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={eventFormData.category}
                  onChange={(e) => setEventFormData({ ...eventFormData, category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                >
                  <option value="">Select...</option>
                  {EVENT_TYPES[eventModalType]?.categories?.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Nutrient-specific fields */}
              {eventModalType === 'nutrient' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={eventFormData.dosage}
                        onChange={(e) => setEventFormData({ ...eventFormData, dosage: e.target.value })}
                        className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                        placeholder="Amount"
                      />
                      <select
                        value={eventFormData.dosage_unit}
                        onChange={(e) => setEventFormData({ ...eventFormData, dosage_unit: e.target.value })}
                        className="w-24 px-2 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                      >
                        <option value="g">g</option>
                        <option value="g/hL">g/hL</option>
                        <option value="ppm">ppm</option>
                        <option value="mL">mL</option>
                        <option value="oz">oz</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">YAN Reading (optional)</label>
                    <input
                      type="number"
                      step="1"
                      value={eventFormData.yan_reading}
                      onChange={(e) => setEventFormData({ ...eventFormData, yan_reading: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                      placeholder="mg/L"
                    />
                  </div>
                </div>
              )}

              {/* Deviation-specific fields */}
              {eventModalType === 'deviation' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high', 'critical'].map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setEventFormData({ ...eventFormData, severity: sev })}
                        className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          eventFormData.severity === sev
                            ? sev === 'critical' ? 'border-red-500 bg-red-50 text-red-700' :
                              sev === 'high' ? 'border-orange-500 bg-orange-50 text-orange-700' :
                              sev === 'medium' ? 'border-amber-500 bg-amber-50 text-amber-700' :
                              'border-gray-400 bg-gray-50 text-gray-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Oxygen-specific fields */}
              {eventModalType === 'oxygen' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Intensity</label>
                    <select
                      value={eventFormData.intensity}
                      onChange={(e) => setEventFormData({ ...eventFormData, intensity: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                    >
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Extraction Goal</label>
                    <select
                      value={eventFormData.extraction_goal}
                      onChange={(e) => setEventFormData({ ...eventFormData, extraction_goal: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                    >
                      <option value="general">General</option>
                      <option value="color">Color Extraction</option>
                      <option value="tannin">Tannin Extraction</option>
                      <option value="aromatics">Aromatics</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Current readings snapshot */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Brix at Event</label>
                  <input
                    type="number"
                    step="0.1"
                    value={eventFormData.brix_at_event}
                    onChange={(e) => setEventFormData({ ...eventFormData, brix_at_event: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder={selectedLot?.current_brix || 'Brix'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Temp at Event (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={eventFormData.temp_at_event}
                    onChange={(e) => setEventFormData({ ...eventFormData, temp_at_event: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder={selectedLot?.current_temp_f || 'Temp'}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={eventFormData.notes}
                  onChange={(e) => setEventFormData({ ...eventFormData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-[#7C203A]"
                  placeholder="Additional details, observations..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-[#7C203A] to-[#8B2E48] text-white rounded-lg hover:from-[#8B2E48] hover:to-[#7C203A] transition-all font-semibold"
                >
                  Record Event
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
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

      {/* Custom Confirmation Modal */}
      {showConfirmModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {confirmModalData.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmModalData.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmModalData.onConfirm}
                className="px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#6B1F35] transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
