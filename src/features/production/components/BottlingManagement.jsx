import React, { useState, useEffect } from 'react';
import {
  BottleWine,
  ChevronRight,
  ChevronLeft,
  Play,
  Save,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Wine,
  Package,
  Tag,
  ClipboardCheck,
  AlertCircle,
  Loader2,
  Download,
  Calendar,
  Beaker,
  X,
  Plus,
  Search,
  Grid3x3,
  List,
  Filter,
  ChevronDown,
  Clock,
  Droplet,
  FlaskConical,
  Barrel,
  RefreshCw,
  MapPin,
  Check
} from 'lucide-react';
import { DocLink } from '@/shared/components/DocLink';
import {
  listLots,
  listFermentationLogs,
  getLatestFermentationLog,
  getDraftRunForLot,
  getAllDraftRuns,
  createBottlingRun,
  updateBottlingRun,
  startBottlingRun,
  completeBottlingRun,
  toggleQCCheck,
  createBottlingIssue,
  deleteBottlingRun,
  cancelBottlingRun
} from '@/shared/lib/productionApi';
import {
  computeAgingMonths,
  getAgingStartDate,
  computeReadiness,
  getLotBlockers,
  isLotEligible,
  isLotNearlyReady,
  getReadinessExplanation,
  MIN_BOTTLING_VOLUME_GAL
} from '@/shared/lib/lotReadiness';
import { ReadinessModal } from './bottling/ReadinessModal';

const BOTTLE_SIZES = [
  { ml: 187, name: 'Split' },
  { ml: 375, name: 'Half Bottle' },
  { ml: 750, name: 'Standard' },
  { ml: 1500, name: 'Magnum' },
  { ml: 3000, name: 'Double Magnum' }
];

const CLOSURE_TYPES = [
  { id: 'natural_cork', name: 'Natural Cork' },
  { id: 'diam', name: 'DIAM Cork' },
  { id: 'synthetic', name: 'Synthetic Cork' },
  { id: 'screwcap', name: 'Screw Cap' },
  { id: 'glass', name: 'Glass Stopper' }
];

const CASE_PACKS = [6, 12];

export function BottlingManagement() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0); // 0: Select, 1: Setup, 2: Validate, 3: Run, 4: Complete
  const [runData, setRunData] = useState({
    run_id: null, // Database ID for persistence
    lot_id: null,
    selectedLot: null,

    // Packaging
    bottle_ml: 750,
    closure_type: 'natural_cork',
    capsule_color: '',
    case_pack: 12,
    pallet_cases: '',

    // Volume & Loss
    bulk_volume_gal: 0,
    loss_pct: 2.5,
    headspace_loss_gal: 0,

    // Calculated outputs
    net_volume_gal: 0,
    estimated_bottles: 0,
    estimated_cases: 0,
    estimated_pallets: 0,

    // Label & Compliance
    label_name: '',
    varietal: '',
    vintage: '',
    appellation: '',
    abv: '',
    lot_code: '',

    // Inventory
    sku_prefix: 'BOT',
    create_as: 'available', // available, quarantine, needs_lab

    // Run tracking
    run_date: new Date().toISOString().split('T')[0],
    operator: '',
    status: 'draft', // draft, active, completed, cancelled
    started_at: null,
    completed_at: null,

    // Live counters
    actual_bottles: 0, // Changed from bottles_filled to match DB schema
    actual_cases: 0,   // Changed from cases_packed to match DB schema

    // QC Checkpoints
    qc_checks: {
      fill_height: false,
      cork_insertion: false,
      label_placement: false,
      closure_torque: false,
      oxygen_check: false,
      sample_retained: false
    },

    // Issues
    issues: []
  });

  const [issueForm, setIssueForm] = useState({ description: '', severity: 'minor' });
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [draftRunAvailable, setDraftRunAvailable] = useState(null);
  const [draftsByLot, setDraftsByLot] = useState({}); // Map of lot_id -> draft run
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  // Dirty tracking and in-flight lock
  const [lastSaved, setLastSaved] = useState(null);
  const saveInFlightRef = React.useRef(false);
  const saveTimerRef = React.useRef(null);
  const counterTimerRef = React.useRef(null);

  // Lot selection UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, eligible, aging, blocked
  const [varietalFilter, setVarietalFilter] = useState('all');
  const [vintageFilter, setVintageFilter] = useState('all');
  const [containerFilter, setContainerFilter] = useState('all');
  const [vesselFilter, setVesselFilter] = useState('all'); // Filter by specific vessel/barrel name
  const [sortBy, setSortBy] = useState('barrel_asc'); // readiness, aging, vintage, volume, name_asc, name_desc, barrel_asc, barrel_desc
  const [groupBy, setGroupBy] = useState('none'); // none, vintage, varietal, field
  const [viewMode, setViewMode] = useState('cards'); // cards, table
  const [currentPage, setCurrentPage] = useState(1);
  const lotsPerPage = 20;
  const [selectedLots, setSelectedLots] = useState([]); // Array of selected lots for multi-select
  const [readinessPopover, setReadinessPopover] = useState(null); // { lot, position }

  const steps = ['Select Lot', 'Run Setup', 'Validate', 'Execute Run', 'Complete'];

  useEffect(() => {
    loadLots();
  }, []);

  // Auto-calculate volumes when inputs change
  useEffect(() => {
    if (runData.bulk_volume_gal && runData.loss_pct !== null) {
      const netVolume = runData.bulk_volume_gal * (1 - runData.loss_pct / 100) - runData.headspace_loss_gal;
      const netVolumeML = netVolume * 3785.411784;
      const bottles = Math.floor(netVolumeML / runData.bottle_ml);
      const cases = Math.floor(bottles / runData.case_pack);
      const pallets = runData.pallet_cases ? Math.floor(cases / runData.pallet_cases) : 0;

      setRunData(prev => ({
        ...prev,
        net_volume_gal: netVolume,
        estimated_bottles: bottles,
        estimated_cases: cases,
        estimated_pallets: pallets
      }));
    }
  }, [runData.bulk_volume_gal, runData.loss_pct, runData.headspace_loss_gal, runData.bottle_ml, runData.case_pack, runData.pallet_cases]);

  // Hardened autosave: dirty check + in-flight lock + cleanup
  useEffect(() => {
    // Cancel pending save on unmount or step change
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [currentStep]);

  useEffect(() => {
    if (!runData.lot_id || currentStep !== 1 || runData.status !== 'draft') {
      return;
    }

    // Create snapshot for dirty checking
    const currentSnapshot = JSON.stringify({
      lot_id: runData.lot_id,
      bottle_ml: runData.bottle_ml,
      closure_type: runData.closure_type,
      capsule_color: runData.capsule_color,
      case_pack: runData.case_pack,
      pallet_cases: runData.pallet_cases,
      bulk_volume_gal: runData.bulk_volume_gal,
      loss_pct: runData.loss_pct,
      headspace_loss_gal: runData.headspace_loss_gal,
      label_name: runData.label_name,
      varietal: runData.varietal,
      vintage: runData.vintage,
      appellation: runData.appellation,
      abv: runData.abv,
      lot_code: runData.lot_code,
      sku_prefix: runData.sku_prefix,
      create_as: runData.create_as,
      run_date: runData.run_date,
      operator: runData.operator
    });

    // Skip save if nothing changed
    if (lastSaved === currentSnapshot) {
      return;
    }

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Debounce save
    saveTimerRef.current = setTimeout(async () => {
      // Skip if already saving (in-flight lock)
      if (saveInFlightRef.current) {
        return;
      }

      saveInFlightRef.current = true;
      setSaving(true);
      setSaveError(null);

      try {
        const setupData = {
          lot_id: runData.lot_id,
          bottle_ml: runData.bottle_ml,
          closure_type: runData.closure_type,
          capsule_color: runData.capsule_color,
          case_pack: runData.case_pack,
          pallet_cases: runData.pallet_cases || null,
          bulk_volume_gal: runData.bulk_volume_gal,
          loss_pct: runData.loss_pct,
          headspace_loss_gal: runData.headspace_loss_gal,
          net_volume_gal: runData.net_volume_gal,
          estimated_bottles: runData.estimated_bottles,
          estimated_cases: runData.estimated_cases,
          estimated_pallets: runData.estimated_pallets,
          label_name: runData.label_name,
          varietal: runData.varietal,
          vintage: runData.vintage,
          appellation: runData.appellation,
          abv: runData.abv ? parseFloat(runData.abv) : null,
          lot_code: runData.lot_code,
          sku_prefix: runData.sku_prefix,
          create_as: runData.create_as,
          run_date: runData.run_date,
          operator: runData.operator
        };

        // Only autosave if we already have a run_id (record exists)
        // New records are created when user clicks "Continue" button
        if (runData.run_id) {
          const { error } = await updateBottlingRun(runData.run_id, setupData);
          if (error) throw error;
        } else {
          // Don't auto-create new records - let user initiate
          return;
        }

        // Update last saved snapshot
        setLastSaved(currentSnapshot);
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveError(err.message || 'Save failed');
      } finally {
        setSaving(false);
        saveInFlightRef.current = false;
      }
    }, 2000);
  }, [
    runData.lot_id,
    runData.bottle_ml,
    runData.closure_type,
    runData.capsule_color,
    runData.case_pack,
    runData.pallet_cases,
    runData.bulk_volume_gal,
    runData.loss_pct,
    runData.headspace_loss_gal,
    runData.label_name,
    runData.varietal,
    runData.vintage,
    runData.appellation,
    runData.abv,
    runData.lot_code,
    runData.sku_prefix,
    runData.create_as,
    runData.run_date,
    runData.operator,
    currentStep,
    runData.status,
    runData.run_id,
    lastSaved
  ]);

  // Hardened counter autosave with cleanup
  useEffect(() => {
    return () => {
      if (counterTimerRef.current) {
        clearTimeout(counterTimerRef.current);
        counterTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (runData.status !== 'active' || !runData.run_id) {
      return;
    }

    if (counterTimerRef.current) {
      clearTimeout(counterTimerRef.current);
    }

    counterTimerRef.current = setTimeout(async () => {
      if (saveInFlightRef.current) {
        return; // Skip if main save is in flight
      }

      try {
        await updateBottlingRun(runData.run_id, {
          actual_bottles: runData.actual_bottles,
          actual_cases: runData.actual_cases
        });
      } catch (err) {
        console.error('Counter autosave error:', err);
      }
    }, 1000);
  }, [runData.actual_bottles, runData.actual_cases, runData.status, runData.run_id]);

  // Manual retry save
  async function retrySave() {
    if (saveInFlightRef.current) return;

    saveInFlightRef.current = true;
    setSaving(true);
    setSaveError(null);

    try {
      const setupData = {
        lot_id: runData.lot_id,
        bottle_ml: runData.bottle_ml,
        closure_type: runData.closure_type,
        capsule_color: runData.capsule_color,
        case_pack: runData.case_pack,
        pallet_cases: runData.pallet_cases || null,
        bulk_volume_gal: runData.bulk_volume_gal,
        loss_pct: runData.loss_pct,
        headspace_loss_gal: runData.headspace_loss_gal,
        net_volume_gal: runData.net_volume_gal,
        estimated_bottles: runData.estimated_bottles,
        estimated_cases: runData.estimated_cases,
        estimated_pallets: runData.estimated_pallets,
        label_name: runData.label_name,
        varietal: runData.varietal,
        vintage: runData.vintage,
        appellation: runData.appellation,
        abv: runData.abv ? parseFloat(runData.abv) : null,
        lot_code: runData.lot_code,
        sku_prefix: runData.sku_prefix,
        create_as: runData.create_as,
        run_date: runData.run_date,
        operator: runData.operator
      };

      if (runData.run_id) {
        const { error } = await updateBottlingRun(runData.run_id, setupData);
        if (error) throw error;
      } else {
        const { data, error } = await createBottlingRun(setupData);
        if (error) throw error;
        if (data) {
          setRunData(prev => ({ ...prev, run_id: data.id }));
        }
      }

      setLastSaved(JSON.stringify(setupData));
    } catch (err) {
      console.error('Retry save error:', err);
      setSaveError(err.message || 'Save failed');
    } finally {
      setSaving(false);
      saveInFlightRef.current = false;
    }
  }

  async function loadLots() {
    setLoading(true);
    try {
      const { data, error } = await listLots();
      if (error) throw error;

      // Filter for potentially bottleable lots:
      // 1. Must be in a barrel (container.type === 'barrel')
      // 2. Must be in aging/blending/ready_to_bottle status (or fermenting for visibility)
      const candidateLots = (data || []).filter(lot => {
        // Only show lots in barrel containers
        const isInBarrel = lot.container?.type === 'barrel';

        // Must be in appropriate status
        const isBottleableStatus =
          lot.status === 'aging' ||
          lot.status === 'blending' ||
          lot.status === 'ready_to_bottle' ||
          lot.status === 'fermenting'; // Include for visibility

        return isInBarrel && isBottleableStatus;
      });

      // Deduplicate by container_id - if multiple lots claim the same barrel,
      // keep only the one with the highest volume (likely the primary lot)
      const seenContainers = new Map();
      const deduplicatedLots = [];

      for (const lot of candidateLots) {
        const containerId = lot.container_id;
        if (!containerId) {
          deduplicatedLots.push(lot);
          continue;
        }

        const existing = seenContainers.get(containerId);
        if (!existing) {
          seenContainers.set(containerId, lot);
          deduplicatedLots.push(lot);
        } else {
          // Keep the lot with higher volume
          if ((lot.current_volume_gallons || 0) > (existing.current_volume_gallons || 0)) {
            // Remove old one, add new one
            const idx = deduplicatedLots.indexOf(existing);
            if (idx > -1) deduplicatedLots.splice(idx, 1);
            seenContainers.set(containerId, lot);
            deduplicatedLots.push(lot);
          }
        }
      }

      // Fetch latest fermentation_logs for ALL lots to ensure we have chemistry data
      // This is necessary because lab data might exist but wasn't synced to the lot record
      const lotsWithChemistry = await Promise.all(
        deduplicatedLots.map(async (lot) => {
          try {
            // Always try to get the latest lab data
            const { data: latestLab, error: labError } = await getLatestFermentationLog(lot.id);

            if (labError) {
              // PGRST116 means no rows found - that's ok, just use lot as-is
              if (labError.code !== 'PGRST116') {
                console.error(`Error fetching lab for lot ${lot.id}:`, labError);
              }
              return lot;
            }

            if (!latestLab) {
              return lot;
            }

            console.log(`Lot ${lot.name} (ID: ${lot.id}): Found lab data - pH: ${latestLab.ph}, TA: ${latestLab.ta}, ABV: ${latestLab.alcohol_pct}`);

            // ALWAYS use lab data if available (overrides lot record)
            // This ensures we display the actual lab results even if sync failed
            return {
              ...lot,
              current_ph: latestLab.ph || lot.current_ph,
              current_ta: latestLab.ta || latestLab.titratable_acidity || lot.current_ta,
              current_alcohol_pct: latestLab.alcohol_pct || lot.current_alcohol_pct,
              _hasLabData: true,
              _latestLabDate: latestLab.log_date
            };
          } catch (err) {
            console.error(`Error fetching labs for lot ${lot.id}:`, err);
            return lot;
          }
        })
      );

      console.log('Lots with chemistry:', lotsWithChemistry.map(l => ({
        name: l.name,
        abv: l.current_alcohol_pct,
        ph: l.current_ph,
        ta: l.current_ta,
        hasLab: l._hasLabData
      })));

      setLots(lotsWithChemistry);

      // Fetch all draft runs to show Resume buttons on cards
      const { data: drafts } = await getAllDraftRuns();
      setDraftsByLot(drafts || {});
    } catch (err) {
      console.error('Error loading lots:', err);
    } finally {
      setLoading(false);
    }
  }

  // Get unique filter options
  const uniqueVarietals = [...new Set(lots.map(l => l.varietal).filter(Boolean))].sort();
  const uniqueVintages = [...new Set(lots.map(l => l.vintage).filter(Boolean))].sort((a, b) => b - a);
  const uniqueContainers = [...new Set(lots.map(l => l.container?.type).filter(Boolean))].sort();
  const uniqueVessels = [...new Set(lots.map(l => l.container?.name).filter(Boolean))].sort((a, b) => {
    // Natural sort for barrel numbers (e.g., Barrel 1, Barrel 2, Barrel 10)
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Apply filters, search, and sort
  const filteredLots = React.useMemo(() => {
    let result = [...lots];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(lot =>
        lot.name?.toLowerCase().includes(term) ||
        lot.varietal?.toLowerCase().includes(term) ||
        lot.vintage?.toString().includes(term) ||
        lot.container?.name?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter === 'eligible') {
      result = result.filter(isLotEligible);
    } else if (statusFilter === 'aging') {
      result = result.filter(lot => lot.status === 'aging');
    } else if (statusFilter === 'blocked') {
      result = result.filter(lot => !isLotEligible(lot));
    }

    // Varietal filter
    if (varietalFilter !== 'all') {
      result = result.filter(lot => lot.varietal === varietalFilter);
    }

    // Vintage filter
    if (vintageFilter !== 'all') {
      result = result.filter(lot => lot.vintage === parseInt(vintageFilter));
    }

    // Container type filter
    if (containerFilter !== 'all') {
      result = result.filter(lot => lot.container?.type === containerFilter);
    }

    // Vessel/Barrel name filter
    if (vesselFilter !== 'all') {
      result = result.filter(lot => lot.container?.name === vesselFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'readiness':
          return computeReadiness(b) - computeReadiness(a);
        case 'aging':
          return computeAgingMonths(b) - computeAgingMonths(a);
        case 'vintage':
          return (b.vintage || 0) - (a.vintage || 0);
        case 'volume':
          return (b.current_volume_gallons || 0) - (a.current_volume_gallons || 0);
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '', undefined, { numeric: true, sensitivity: 'base' });
        case 'vessel_asc':
          return (a.container?.name || '').localeCompare(b.container?.name || '', undefined, { numeric: true, sensitivity: 'base' });
        case 'vessel_desc':
          return (b.container?.name || '').localeCompare(a.container?.name || '', undefined, { numeric: true, sensitivity: 'base' });
        case 'barrel_asc': {
          // Use container.name (the actual barrel) for sorting
          const aMatch = a.container?.name?.match(/(\d+)/)?.[1];
          const bMatch = b.container?.name?.match(/(\d+)/)?.[1];
          const aNum = aMatch ? parseInt(aMatch) : 999999;
          const bNum = bMatch ? parseInt(bMatch) : 999999;
          return aNum - bNum;
        }
        case 'barrel_desc': {
          // Use container.name (the actual barrel) for sorting
          const aMatch = a.container?.name?.match(/(\d+)/)?.[1];
          const bMatch = b.container?.name?.match(/(\d+)/)?.[1];
          const aNum = aMatch ? parseInt(aMatch) : 0;
          const bNum = bMatch ? parseInt(bMatch) : 0;
          return bNum - aNum;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [lots, searchTerm, statusFilter, varietalFilter, vintageFilter, containerFilter, vesselFilter, sortBy]);

  // Group lots if needed
  const groupedLots = React.useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Lots': filteredLots };
    }

    const groups = {};
    filteredLots.forEach(lot => {
      let key;
      if (groupBy === 'vintage') {
        key = lot.vintage || 'Unknown';
      } else if (groupBy === 'varietal') {
        key = lot.varietal || 'Unknown';
      } else if (groupBy === 'field') {
        key = lot.block?.name || 'Unknown Field';
      } else {
        key = 'Unknown';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(lot);
    });

    return groups;
  }, [filteredLots, groupBy]);

  // Pagination
  const totalPages = Math.ceil(filteredLots.length / lotsPerPage);
  const paginatedLots = filteredLots.slice((currentPage - 1) * lotsPerPage, currentPage * lotsPerPage);

  async function selectLot(lot) {
    // Check for existing draft
    const { data: draft, error } = await getDraftRunForLot(lot.id);

    if (!error && draft) {
      setDraftRunAvailable(draft);
      return; // Show resume prompt in UI
    }

    // No draft found, start fresh
    startFreshRun(lot);
  }

  async function startFreshRun(lot) {
    // Delete existing draft if present
    if (draftRunAvailable?.id) {
      try {
        await deleteBottlingRun(draftRunAvailable.id);
      } catch (err) {
        console.error('Error deleting old draft:', err);
      }
    }

    const lotCode = `${lot.vintage}-${lot.varietal.substring(0, 3).toUpperCase()}-${lot.id.substring(0, 4)}`;

    setRunData({
      run_id: null,
      lot_id: lot.id,
      selectedLot: lot,
      bottle_ml: 750,
      closure_type: 'natural_cork',
      capsule_color: '',
      case_pack: 12,
      pallet_cases: '',
      bulk_volume_gal: lot.current_volume_gallons || 0,
      loss_pct: 2.5,
      headspace_loss_gal: 0,
      net_volume_gal: 0,
      estimated_bottles: 0,
      estimated_cases: 0,
      estimated_pallets: 0,
      label_name: `${lot.name}`,
      varietal: lot.varietal,
      vintage: lot.vintage,
      appellation: '',
      abv: lot.current_alcohol_pct ? lot.current_alcohol_pct.toFixed(1) : '',
      lot_code: lotCode,
      sku_prefix: 'BOT',
      create_as: 'available',
      run_date: new Date().toISOString().split('T')[0],
      operator: '',
      status: 'draft',
      started_at: null,
      completed_at: null,
      actual_bottles: 0,
      actual_cases: 0,
      qc_checks: {
        fill_height: false,
        cork_insertion: false,
        label_placement: false,
        closure_torque: false,
        oxygen_check: false,
        sample_retained: false
      },
      issues: []
    });

    setDraftRunAvailable(null);
    setSaveError(null); // Clear any previous save errors
    setCurrentStep(1);
  }

  function resumeDraft(draft, lot) {
    setRunData({
      run_id: draft.id,
      lot_id: draft.lot_id,
      selectedLot: lot,
      bottle_ml: draft.bottle_ml,
      closure_type: draft.closure_type,
      capsule_color: draft.capsule_color || '',
      case_pack: draft.case_pack,
      pallet_cases: draft.pallet_cases || '',
      bulk_volume_gal: draft.bulk_volume_gal,
      loss_pct: draft.loss_pct,
      headspace_loss_gal: draft.headspace_loss_gal || 0,
      net_volume_gal: draft.net_volume_gal,
      estimated_bottles: draft.estimated_bottles,
      estimated_cases: draft.estimated_cases,
      estimated_pallets: draft.estimated_pallets || 0,
      label_name: draft.label_name,
      varietal: draft.varietal,
      vintage: draft.vintage,
      appellation: draft.appellation || '',
      abv: draft.abv ? draft.abv.toString() : '',
      lot_code: draft.lot_code,
      sku_prefix: draft.sku_prefix || 'BOT',
      create_as: draft.create_as,
      run_date: draft.run_date,
      operator: draft.operator || '',
      status: draft.status,
      started_at: draft.started_at,
      completed_at: draft.completed_at,
      actual_bottles: draft.actual_bottles || 0,
      actual_cases: draft.actual_cases || 0,
      qc_checks: {
        fill_height: false,
        cork_insertion: false,
        label_placement: false,
        closure_torque: false,
        oxygen_check: false,
        sample_retained: false
      },
      issues: []
    });

    setDraftRunAvailable(null);
    setCurrentStep(2); // Go to validation step where draft was saved
  }

  function validateRun() {
    const issues = [];

    if (!runData.bulk_volume_gal || runData.bulk_volume_gal <= 0) {
      issues.push('No bulk volume available');
    }

    if (!runData.abv || parseFloat(runData.abv) <= 0) {
      issues.push('Missing ABV (required for labels)');
    }

    if (!runData.label_name) {
      issues.push('Label name is required');
    }

    if (runData.estimated_bottles <= 0) {
      issues.push('Bottle count would be zero');
    }

    const maxBottles = Math.floor((runData.bulk_volume_gal * 3785.411784) / runData.bottle_ml);
    if (runData.estimated_bottles > maxBottles) {
      issues.push('Bottle count exceeds available volume');
    }

    return issues;
  }

  async function startRun() {
    try {
      // Ensure draft is saved first
      if (!runData.run_id) {
        const setupData = {
          lot_id: runData.lot_id,
          bottle_ml: runData.bottle_ml,
          closure_type: runData.closure_type,
          capsule_color: runData.capsule_color,
          case_pack: runData.case_pack,
          pallet_cases: runData.pallet_cases || null,
          bulk_volume_gal: runData.bulk_volume_gal,
          loss_pct: runData.loss_pct,
          headspace_loss_gal: runData.headspace_loss_gal,
          net_volume_gal: runData.net_volume_gal,
          estimated_bottles: runData.estimated_bottles,
          estimated_cases: runData.estimated_cases,
          estimated_pallets: runData.estimated_pallets,
          label_name: runData.label_name,
          varietal: runData.varietal,
          vintage: runData.vintage,
          appellation: runData.appellation,
          abv: runData.abv ? parseFloat(runData.abv) : null,
          lot_code: runData.lot_code,
          sku_prefix: runData.sku_prefix,
          create_as: runData.create_as,
          run_date: runData.run_date,
          operator: runData.operator
        };

        const { data, error } = await createBottlingRun(setupData);
        if (error) {
          alert('Failed to create run: ' + error.message);
          return;
        }
        setRunData(prev => ({ ...prev, run_id: data.id }));
      }

      // Transition to active
      const { data, error } = await startBottlingRun(runData.run_id || runData.run_id);
      if (error) {
        alert('Failed to start run: ' + error.message);
        return;
      }

      setRunData(prev => ({
        ...prev,
        status: 'active',
        started_at: data.started_at
      }));
      setCurrentStep(3);
    } catch (err) {
      console.error('Start run error:', err);
      alert('Failed to start run: ' + err.message);
    }
  }

  async function saveAsDraft() {
    setSaving(true);
    setToast(null);
    try {
      const setupData = {
        lot_id: runData.lot_id,
        bottle_ml: runData.bottle_ml,
        closure_type: runData.closure_type,
        capsule_color: runData.capsule_color,
        case_pack: runData.case_pack,
        pallet_cases: runData.pallet_cases || null,
        bulk_volume_gal: runData.bulk_volume_gal,
        loss_pct: runData.loss_pct,
        headspace_loss_gal: runData.headspace_loss_gal,
        net_volume_gal: runData.net_volume_gal,
        estimated_bottles: runData.estimated_bottles,
        estimated_cases: runData.estimated_cases,
        estimated_pallets: runData.estimated_pallets,
        label_name: runData.label_name,
        varietal: runData.varietal,
        vintage: runData.vintage,
        appellation: runData.appellation,
        abv: runData.abv ? parseFloat(runData.abv) : null,
        lot_code: runData.lot_code,
        sku_prefix: runData.sku_prefix,
        create_as: runData.create_as,
        run_date: runData.run_date,
        operator: runData.operator
      };

      let result;
      if (runData.run_id) {
        // Update existing draft
        result = await updateBottlingRun(runData.run_id, setupData);
      } else {
        // Create new draft
        result = await createBottlingRun(setupData);
      }

      if (result.error) {
        setToast({ type: 'error', message: 'Failed to save draft: ' + result.error.message });
        return;
      }

      setRunData(prev => ({ ...prev, run_id: result.data.id }));
      setToast({ type: 'success', message: 'Draft saved successfully!' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Save draft error:', err);
      setToast({ type: 'error', message: 'Failed to save draft: ' + err.message });
    } finally {
      setSaving(false);
    }
  }

  async function completeRun() {
    setExporting(true);
    try {
      const { data, error } = await completeBottlingRun(
        runData.run_id,
        runData.actual_bottles,
        runData.actual_cases
      );

      if (error) {
        alert(`Completion failed: ${error.message}`);
        return;
      }

      // Success - update local state with completion data
      setRunData(prev => ({
        ...prev,
        status: 'completed',
        completed_at: new Date().toISOString(),
        inventory_id: data.inventory_id,
        volume_deducted_gal: data.volume_deducted_gal,
        lot_remaining_gal: data.lot_remaining_gal
      }));

      setCurrentStep(4);
    } catch (err) {
      console.error('Complete run error:', err);
      alert(`Completion failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  async function addIssue() {
    if (!issueForm.description.trim()) return;

    try {
      const { data, error } = await createBottlingIssue(runData.run_id, {
        description: issueForm.description,
        severity: issueForm.severity
      });

      if (!error && data) {
        setRunData(prev => ({
          ...prev,
          issues: [...prev.issues, data]
        }));
      }

      setIssueForm({ description: '', severity: 'minor' });
      setShowIssueForm(false);
    } catch (err) {
      console.error('Add issue error:', err);
    }
  }

  async function toggleQC(check) {
    const newState = !runData.qc_checks[check];

    try {
      // Update DB
      await toggleQCCheck(runData.run_id, check, newState);

      // Update UI
      setRunData(prev => ({
        ...prev,
        qc_checks: {
          ...prev.qc_checks,
          [check]: newState
        }
      }));
    } catch (err) {
      console.error('Toggle QC error:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#7C203A] animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading lots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Resume Draft Modal */}
      {draftRunAvailable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Save className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Resume Draft Run?</h3>
              <p className="text-gray-600">
                A draft bottling run exists for this lot from {new Date(draftRunAvailable.updated_at).toLocaleDateString()}.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Bottle Size:</span>
                <span className="font-medium">{draftRunAvailable.bottle_ml}ml</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Est. Bottles:</span>
                <span className="font-medium">{draftRunAvailable.estimated_bottles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Label:</span>
                <span className="font-medium">{draftRunAvailable.label_name}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const lot = lots.find(l => l.id === draftRunAvailable.lot_id);
                  if (lot) resumeDraft(draftRunAvailable, lot);
                }}
                className="flex-1 px-6 py-3 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-all font-medium"
              >
                Resume Draft
              </button>
              <button
                onClick={() => {
                  const lot = lots.find(l => l.id === draftRunAvailable.lot_id);
                  if (lot) startFreshRun(lot);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
              >
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Stepper */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Bottling Run Console</h1>
        <p className="text-sm text-gray-500 mt-1">Track and manage your bottling operations. <DocLink docId="production/bottling" /></p>
        <div className="flex items-center justify-between mt-4">
          {saving && currentStep === 1 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving draft...</span>
            </div>
          )}
          {!saving && saveError && currentStep === 1 && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{saveError}</span>
              </div>
              <button
                onClick={retrySave}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-all text-xs font-medium"
              >
                Retry Save
              </button>
            </div>
          )}
          {!saving && !saveError && runData.run_id && currentStep === 1 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Draft saved</span>
            </div>
          )}
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                idx === currentStep
                  ? 'bg-[#7C203A] text-white'
                  : idx < currentStep
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {idx < currentStep && <CheckCircle2 className="w-4 h-4" />}
                <span className="text-sm font-medium">{step}</span>
              </div>
              {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 0: Select Lot */}
      {currentStep === 0 && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-4 mb-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search lots by name, varietal, vintage, or vessel..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="eligible">Eligible Only</option>
                <option value="aging">Aging</option>
                <option value="blocked">Blocked</option>
              </select>

              <select
                value={varietalFilter}
                onChange={(e) => { setVarietalFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
              >
                <option value="all">All Varietals</option>
                {uniqueVarietals.map(v => <option key={v} value={v}>{v}</option>)}
              </select>

              <select
                value={vintageFilter}
                onChange={(e) => { setVintageFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
              >
                <option value="all">All Vintages</option>
                {uniqueVintages.map(v => <option key={v} value={v}>{v}</option>)}
              </select>

              {uniqueContainers.length > 0 && (
                <select
                  value={containerFilter}
                  onChange={(e) => { setContainerFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="all">All Containers</option>
                  {uniqueContainers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

              {uniqueVessels.length > 0 && (
                <select
                  value={vesselFilter}
                  onChange={(e) => { setVesselFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="all">All Vessels</option>
                  {uniqueVessels.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              )}

              <div className="h-6 w-px bg-gray-200"></div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
              >
                <option value="readiness">Sort: Readiness</option>
                <option value="aging">Sort: Aging Duration</option>
                <option value="vintage">Sort: Vintage</option>
                <option value="volume">Sort: Volume</option>
                <option value="name_asc">Sort: Name (A-Z)</option>
                <option value="name_desc">Sort: Name (Z-A)</option>
                <option value="vessel_asc">Sort: Vessel (A-Z)</option>
                <option value="vessel_desc">Sort: Vessel (Z-A)</option>
                <option value="barrel_asc">Sort: Barrel # (1-9)</option>
                <option value="barrel_desc">Sort: Barrel # (9-1)</option>
              </select>

              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
              >
                <option value="none">No Grouping</option>
                <option value="vintage">Group by Vintage</option>
                <option value="varietal">Group by Varietal</option>
                <option value="field">Group by Field</option>
              </select>

              <div className="flex-1"></div>
              <button
                onClick={() => loadLots()}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh lot data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <p className="text-sm text-gray-500">{filteredLots.length} lot{filteredLots.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Lot Grid/Table */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {filteredLots.length === 0 ? (
              <div className="text-center py-12">
                <BottleWine className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No lots match your filters</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setVarietalFilter('all');
                    setVintageFilter('all');
                    setContainerFilter('all');
                    setVesselFilter('all');
                  }}
                  className="mt-4 text-sm text-[#7C203A] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="space-y-6">
                {Object.entries(groupedLots).map(([groupName, groupLots]) => (
                  <div key={groupName}>
                    {groupBy !== 'none' && (
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        {groupBy === 'vintage' && <Calendar className="w-5 h-5 text-[#7C203A]" />}
                        {groupBy === 'varietal' && <Wine className="w-5 h-5 text-[#7C203A]" />}
                        {groupBy === 'field' && <MapPin className="w-5 h-5 text-[#7C203A]" />}
                        {groupName}
                        <span className="text-sm font-normal text-gray-500">({groupLots.length})</span>
                      </h3>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(groupBy === 'none' ? paginatedLots : groupLots).map(lot => {
                        const agingMonths = computeAgingMonths(lot);
                        const agingStartInfo = getAgingStartDate(lot);
                        const readiness = computeReadiness(lot);
                        const blockers = getLotBlockers(lot);
                        const eligible = isLotEligible(lot);
                        const nearlyReady = isLotNearlyReady(lot);
                        const estBottles = Math.floor((lot.current_volume_gallons || 0) * 3785.411784 / 750);
                        const estCases = Math.floor(estBottles / 12);

                        // Determine primary blocker type for CTA
                        const primaryBlocker = blockers.find(b => b.type === 'abv') || blockers.find(b => b.type === 'status_nearly_ready') || blockers[0];

                        // Count abnormal vs expected-missing blockers
                        const abnormalBlockers = blockers.filter(b => b.type === 'volume' || b.type === 'status_production');
                        const hasAbnormalBlocker = abnormalBlockers.length > 0;

                        const isSelected = selectedLots.some(l => l.id === lot.id);

                        return (
                          <div
                            key={lot.id}
                            className={`relative p-5 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-[#7C203A] bg-[#7C203A]/5 shadow-md cursor-pointer'
                                : eligible
                                  ? 'border-gray-200 hover:border-[#7C203A] hover:shadow-md cursor-pointer bg-white'
                                  : nearlyReady
                                    ? 'border-gray-200 bg-white'
                                    : 'border-gray-200 bg-white'
                            }`}
                            onClick={() => {
                              if (eligible) {
                                setSelectedLots(prev => {
                                  const alreadySelected = prev.some(l => l.id === lot.id);
                                  if (alreadySelected) {
                                    return prev.filter(l => l.id !== lot.id);
                                  } else {
                                    return [...prev, lot];
                                  }
                                });
                              }
                            }}
                          >
                            {/* Selection Indicator */}
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-6 h-6 bg-[#7C203A] rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            {/* Header - Barrel/Container as primary, matching Aging page style */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Barrel className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <p className="font-bold text-gray-900 text-lg truncate">
                                  {lot.container?.name || 'Unknown Vessel'}
                                </p>
                              </div>
                              {/* Neutral Question Mark with Tooltip - hide when selected */}
                              {!isSelected && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReadinessPopover(readinessPopover?.lot?.id === lot.id ? null : { lot });
                                  }}
                                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 ml-2"
                                  title={eligible ? "See readiness details" : "Why can't this lot be bottled yet?"}
                                >
                                  <span className="text-sm font-medium">?</span>
                                </button>
                              )}
                            </div>
                            {/* Lot name and varietal/vintage below */}
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 truncate" title={lot.name}>{lot.name}</p>
                              <p className="text-sm text-gray-500">{lot.varietal} • {lot.vintage}</p>
                            </div>

                            {/* Context Info Section */}
                            <div className="space-y-2 mb-4 text-sm text-gray-600">
                              {/* Aging Duration */}
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                {agingStartInfo.isUnknown ? (
                                  <span className="text-gray-500">Aging start unknown</span>
                                ) : (
                                  <span>{agingMonths} months aging</span>
                                )}
                              </div>

                              {/* Lab Info */}
                              <div className="flex items-center gap-2">
                                <FlaskConical className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                {lot._hasLabData ? (
                                  <span>Lab: {lot._latestLabDate ? new Date(lot._latestLabDate).toLocaleDateString() : 'Recorded'}</span>
                                ) : (
                                  <span className="text-amber-600">No recent lab</span>
                                )}
                              </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-3 gap-3 mb-4 pt-3 border-t border-gray-100">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Volume</p>
                                <p className={`font-semibold text-sm ${
                                  (lot.current_volume_gallons || 0) < MIN_BOTTLING_VOLUME_GAL ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {lot.current_volume_gallons?.toFixed(0) || 0} gal
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">ABV</p>
                                {lot.current_alcohol_pct ? (
                                  <p className="font-semibold text-gray-900 text-sm">{lot.current_alcohol_pct.toFixed(1)}%</p>
                                ) : (
                                  <span className="text-xs text-amber-600 font-medium">Not set</span>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Est. Cases</p>
                                <p className="font-semibold text-gray-900 text-sm">{estCases}</p>
                              </div>
                            </div>

                            {/* Status Summary & CTA Section */}
                            {blockers.length > 0 ? (
                              <div className="pt-3 border-t border-gray-100 space-y-2">
                                {/* Single Summary Line */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReadinessPopover({ lot });
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    hasAbnormalBlocker
                                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  }`}
                                >
                                  ⚠️ {blockers.length} requirement{blockers.length !== 1 ? 's' : ''} missing
                                </button>

                                {/* Single Primary CTA */}
                                {primaryBlocker?.action && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (primaryBlocker.action.type === 'navigate') {
                                        setReadinessPopover({ lot });
                                      }
                                    }}
                                    className="w-full px-3 py-2 bg-white border-2 border-gray-200 hover:border-[#7C203A] hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:text-[#7C203A] transition-all flex items-center justify-between group"
                                  >
                                    <span>
                                      {primaryBlocker.type === 'abv'
                                        ? 'Add lab analysis'
                                        : primaryBlocker.type === 'status_nearly_ready'
                                          ? 'Review lot'
                                          : primaryBlocker.action.label}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#7C203A] transition-colors" />
                                  </button>
                                )}
                                {/* Resume Draft Button for lots with blockers */}
                                {draftsByLot[lot.id] && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      resumeDraft(draftsByLot[lot.id], lot);
                                    }}
                                    className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                    Resume Draft
                                  </button>
                                )}
                              </div>
                            ) : eligible ? (
                              <div className="pt-3 border-t border-gray-100 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Ready to bottle</span>
                                </div>
                                {/* Resume Draft Button */}
                                {draftsByLot[lot.id] && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      resumeDraft(draftsByLot[lot.id], lot);
                                    }}
                                    className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                    Resume Draft
                                  </button>
                                )}
                              </div>
                            ) : null}
                            {/* Resume Draft for non-eligible lots that have drafts */}
                            {!eligible && blockers.length === 0 && draftsByLot[lot.id] && (
                              <div className="pt-3 border-t border-gray-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    resumeDraft(draftsByLot[lot.id], lot);
                                  }}
                                  className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Resume Draft
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {groupBy === 'none' && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Table View */
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr className="text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">Lot</th>
                      <th className="pb-3 pr-4 font-medium">Vintage</th>
                      <th className="pb-3 pr-4 font-medium">Varietal</th>
                      <th className="pb-3 pr-4 font-medium">Vessel</th>
                      <th className="pb-3 pr-4 font-medium text-right">Volume</th>
                      <th className="pb-3 pr-4 font-medium text-right">Aging</th>
                      <th className="pb-3 pr-4 font-medium">Last Lab</th>
                      <th className="pb-3 pr-4 font-medium">Readiness</th>
                      <th className="pb-3 font-medium text-right">Est. Cases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedLots.map(lot => {
                      const agingMonths = computeAgingMonths(lot);
                      const readiness = computeReadiness(lot);
                      const blockers = getLotBlockers(lot);
                      const eligible = isLotEligible(lot);
                      const nearlyReady = isLotNearlyReady(lot);
                      const estBottles = Math.floor((lot.current_volume_gallons || 0) * 3785.411784 / 750);
                      const estCases = Math.floor(estBottles / 12);

                      return (
                        <tr
                          key={lot.id}
                          onClick={() => eligible && setSelectedLotPreview(lot)}
                          className={`${
                            eligible
                              ? 'cursor-pointer hover:bg-gray-50'
                              : nearlyReady
                                ? 'bg-amber-50/30'
                                : 'opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <td className="py-3 pr-4 font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              {lot.name}
                              {nearlyReady && !eligible && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-md font-medium">
                                  Nearly Ready
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-gray-700">{lot.vintage}</td>
                          <td className="py-3 pr-4 text-gray-700">{lot.varietal}</td>
                          <td className="py-3 pr-4 text-gray-600 text-xs">
                            {lot.container?.name ? (
                              <div className="flex items-center gap-1">
                                <span className="truncate max-w-[120px]">{lot.container.name}</span>
                                {lot.container?.type && (
                                  <span className="px-1 py-0.5 bg-gray-100 rounded text-xs">{lot.container.type}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-right font-semibold text-gray-900">
                            {lot.current_volume_gallons?.toFixed(0) || 0} gal
                          </td>
                          <td className="py-3 pr-4 text-right text-gray-700">{agingMonths}mo</td>
                          <td className="py-3 pr-4 text-gray-600 text-xs">
                            {lot.last_analysis_date ? new Date(lot.last_analysis_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 pr-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReadinessPopover(readinessPopover?.lot?.id === lot.id ? null : { lot });
                              }}
                              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                              <div className={`w-3 h-3 rounded-full ${
                                readiness >= 70 ? 'bg-green-500' :
                                readiness >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}></div>
                              <span className="text-xs font-medium text-gray-700">{readiness}</span>
                            </button>
                          </td>
                          <td className="py-3 text-right font-semibold text-gray-900">{estCases}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Readiness Modal */}
          {readinessPopover && (
            <ReadinessModal
              lot={readinessPopover.lot}
              onClose={() => setReadinessPopover(null)}
              onRefresh={loadLots}
            />
          )}

          {/* Fixed Selected Lots Summary Bar */}
          {selectedLots.length > 0 && (
            <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[700px] lg:w-[800px] bg-[#7C203A] text-white p-4 rounded-2xl shadow-2xl border-2 border-[#5a1829] z-50">
              <div className="flex items-center justify-between gap-6">
                {/* Left: Selection Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold">{selectedLots.length}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-lg">
                      {selectedLots.length === 1
                        ? (selectedLots[0].container?.name || 'Unknown Vessel')
                        : `${selectedLots.length} Vessels Selected`}
                    </p>
                    <p className="text-sm text-white/80">
                      {selectedLots.length === 1
                        ? selectedLots[0].name
                        : selectedLots.map(l => l.container?.name || 'Unknown').join(', ')}
                    </p>
                  </div>
                </div>

                {/* Center: Totals */}
                <div className="flex-shrink-0 text-center">
                  <p className="text-sm text-white/80">Total Volume</p>
                  <p className="font-bold text-lg">
                    {selectedLots.reduce((sum, l) => sum + (l.current_volume_gallons || 0), 0).toFixed(0)} gal
                  </p>
                </div>

                <div className="flex-shrink-0 text-center">
                  <p className="text-sm text-white/80">Est. Production</p>
                  <p className="font-bold text-lg">
                    {Math.floor(selectedLots.reduce((sum, l) => sum + (l.current_volume_gallons || 0), 0) * 3785.411784 / 750 / 12)} cs
                  </p>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedLots([])}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                  <button
                    onClick={() => {
                      // For now, select the first lot - multi-lot bottling can be enhanced later
                      if (selectedLots.length === 1) {
                        selectLot(selectedLots[0]);
                      } else {
                        // TODO: Handle multi-lot bottling run
                        selectLot(selectedLots[0]);
                      }
                      setSelectedLots([]);
                    }}
                    className="px-6 py-2 bg-white text-[#7C203A] font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <span>Start Run</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Run Setup - 2 Column Layout */}
      {currentStep === 1 && runData.selectedLot && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Setup Forms (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lot Info Bar */}
            <div className="bg-gradient-to-r from-[#7C203A] to-[#8B2E48] rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">{runData.selectedLot.name}</h3>
                  <p className="text-white/80">{runData.varietal} • {runData.vintage}</p>
                </div>
                <button
                  onClick={() => {
                    setRunData({ ...runData, lot_id: null, selectedLot: null });
                    setSaveError(null);
                    setCurrentStep(0);
                  }}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-6">
                <div>
                  <p className="text-white/60 text-xs mb-1">Bulk Volume</p>
                  <p className="text-2xl font-bold">{runData.bulk_volume_gal.toFixed(0)}<span className="text-sm ml-1">gal</span></p>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Container</p>
                  <p className="text-sm font-medium">{runData.selectedLot.container?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">ABV</p>
                  <p className="text-sm font-medium">{runData.abv || 'N/A'}%</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Last Analysis</p>
                  <p className="text-sm font-medium">
                    {runData.selectedLot._latestLabDate
                      ? new Date(runData.selectedLot._latestLabDate).toLocaleDateString()
                      : runData.selectedLot._hasLabData
                        ? 'Recorded'
                        : 'None'}
                  </p>
                </div>
              </div>
            </div>

            {/* A. Packaging */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-5 h-5 text-[#7C203A]" />
                <h3 className="font-bold text-gray-900">Packaging Configuration</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bottle Size *</label>
                  <select
                    value={runData.bottle_ml}
                    onChange={(e) => setRunData({ ...runData, bottle_ml: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  >
                    {BOTTLE_SIZES.map(size => (
                      <option key={size.ml} value={size.ml}>{size.ml}ml ({size.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Closure Type *</label>
                  <select
                    value={runData.closure_type}
                    onChange={(e) => setRunData({ ...runData, closure_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  >
                    {CLOSURE_TYPES.map(closure => (
                      <option key={closure.id} value={closure.id}>{closure.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capsule Color</label>
                  <input
                    type="text"
                    value={runData.capsule_color}
                    onChange={(e) => setRunData({ ...runData, capsule_color: e.target.value })}
                    placeholder="e.g., Gold, Burgundy"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Case Pack *</label>
                  <select
                    value={runData.case_pack}
                    onChange={(e) => setRunData({ ...runData, case_pack: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  >
                    {CASE_PACKS.map(pack => (
                      <option key={pack} value={pack}>{pack} bottles/case</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pallet Config (cases)</label>
                  <input
                    type="number"
                    value={runData.pallet_cases}
                    onChange={(e) => setRunData({ ...runData, pallet_cases: parseInt(e.target.value) || '' })}
                    placeholder="e.g., 56"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* B. Volume & Loss */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Beaker className="w-5 h-5 text-[#7C203A]" />
                <h3 className="font-bold text-gray-900">Volume & Loss Calculations</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bottling Loss %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={runData.loss_pct}
                    onChange={(e) => setRunData({ ...runData, loss_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">Typical: 2-3%</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Headspace Loss (gal)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={runData.headspace_loss_gal}
                    onChange={(e) => setRunData({ ...runData, headspace_loss_gal: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">Line + filter loss</p>
                </div>
              </div>
            </div>

            {/* C. Label & Compliance */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Tag className="w-5 h-5 text-[#7C203A]" />
                <h3 className="font-bold text-gray-900">Label & Compliance</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Label Name *</label>
                  <input
                    type="text"
                    value={runData.label_name}
                    onChange={(e) => setRunData({ ...runData, label_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Appellation</label>
                  <input
                    type="text"
                    value={runData.appellation}
                    onChange={(e) => setRunData({ ...runData, appellation: e.target.value })}
                    placeholder="e.g., Napa Valley"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ABV % *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={runData.abv}
                    onChange={(e) => setRunData({ ...runData, abv: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lot Code</label>
                  <input
                    type="text"
                    value={runData.lot_code}
                    onChange={(e) => setRunData({ ...runData, lot_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* D. Inventory Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <ClipboardCheck className="w-5 h-5 text-[#7C203A]" />
                <h3 className="font-bold text-gray-900">Inventory Settings</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU Prefix</label>
                  <input
                    type="text"
                    value={runData.sku_prefix}
                    onChange={(e) => setRunData({ ...runData, sku_prefix: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">Auto-generated: {runData.sku_prefix}-{runData.lot_code}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Create Inventory As</label>
                  <select
                    value={runData.create_as}
                    onChange={(e) => setRunData({ ...runData, create_as: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="quarantine">In Quarantine</option>
                    <option value="needs_lab">Needs Lab Release</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSaveError(null);
                  setCurrentStep(0);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Lot Selection
              </button>
              <button
                onClick={async () => {
                  // Create record if doesn't exist yet
                  if (!runData.run_id) {
                    setSaving(true);
                    setSaveError(null);
                    try {
                      const setupData = {
                        lot_id: runData.lot_id,
                        bottle_ml: runData.bottle_ml,
                        closure_type: runData.closure_type,
                        capsule_color: runData.capsule_color,
                        case_pack: runData.case_pack,
                        pallet_cases: runData.pallet_cases || null,
                        bulk_volume_gal: runData.bulk_volume_gal,
                        loss_pct: runData.loss_pct,
                        headspace_loss_gal: runData.headspace_loss_gal,
                        net_volume_gal: runData.net_volume_gal,
                        estimated_bottles: runData.estimated_bottles,
                        estimated_cases: runData.estimated_cases,
                        estimated_pallets: runData.estimated_pallets,
                        label_name: runData.label_name,
                        varietal: runData.varietal,
                        vintage: runData.vintage,
                        appellation: runData.appellation,
                        abv: runData.abv ? parseFloat(runData.abv) : null,
                        lot_code: runData.lot_code,
                        sku_prefix: runData.sku_prefix,
                        create_as: runData.create_as,
                        run_date: runData.run_date,
                        operator: runData.operator
                      };
                      const { data, error } = await createBottlingRun(setupData);
                      if (error) {
                        setSaveError(error.message || 'Failed to save run');
                        setSaving(false);
                        return;
                      }
                      if (data) {
                        setRunData(prev => ({ ...prev, run_id: data.id }));
                      }
                    } catch (err) {
                      setSaveError(err.message || 'Failed to save run');
                      setSaving(false);
                      return;
                    }
                    setSaving(false);
                  }
                  setCurrentStep(2);
                }}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-all font-medium shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Validation
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Calculations (1/3 width) */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 sticky top-6">
              <h3 className="font-bold text-gray-900 mb-6">Calculated Outputs</h3>

              <div className="space-y-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Net Bottling Volume</p>
                  <p className="text-3xl font-bold text-gray-900">{runData.net_volume_gal.toFixed(1)}<span className="text-lg ml-1">gal</span></p>
                  <p className="text-xs text-gray-400 mt-1">After {runData.loss_pct}% loss</p>
                </div>

                <div className="border-t border-green-200 pt-4">
                  <p className="text-xs text-gray-500 mb-1">Estimated Bottles</p>
                  <p className="text-4xl font-bold text-[#7C203A]">{runData.estimated_bottles.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">@ {runData.bottle_ml}ml each</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cases</p>
                    <p className="text-2xl font-bold text-gray-900">{runData.estimated_cases}</p>
                    <p className="text-xs text-gray-400">{runData.case_pack}/case</p>
                  </div>
                  {runData.pallet_cases > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pallets</p>
                      <p className="text-2xl font-bold text-gray-900">{runData.estimated_pallets}</p>
                      <p className="text-xs text-gray-400">{runData.pallet_cases}/pallet</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-green-200 pt-4">
                  <p className="text-xs text-gray-500 mb-1">Loss Amount</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {(runData.bulk_volume_gal - runData.net_volume_gal).toFixed(1)} gal
                  </p>
                  <p className="text-xs text-gray-400">= {runData.loss_pct}% + {runData.headspace_loss_gal} gal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Validate */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <ClipboardCheck className="w-5 h-5 text-[#7C203A]" />
            <h2 className="text-lg font-bold text-gray-900">Pre-Run Validation</h2>
          </div>

          {(() => {
            const validationIssues = validateRun();

            return (
              <>
                {validationIssues.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-red-900 mb-2">Cannot Start Run - Issues Detected:</p>
                          <ul className="space-y-1">
                            {validationIssues.map((issue, idx) => (
                              <li key={idx} className="text-sm text-red-700">• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Setup
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-start gap-3 mb-6">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-900 text-lg">Ready to Start Bottling Run</p>
                          <p className="text-sm text-green-700 mt-1">All validations passed. Review summary below.</p>
                        </div>
                      </div>

                      {/* Run Summary */}
                      <div className="grid grid-cols-2 gap-6 mt-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Lot Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium">{runData.label_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Varietal:</span>
                              <span className="font-medium">{runData.varietal}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Vintage:</span>
                              <span className="font-medium">{runData.vintage}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">ABV:</span>
                              <span className="font-medium">{runData.abv}%</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Production Estimates</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Bottles:</span>
                              <span className="font-bold text-[#7C203A]">{runData.estimated_bottles.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cases:</span>
                              <span className="font-medium">{runData.estimated_cases}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Bottle Size:</span>
                              <span className="font-medium">{runData.bottle_ml}ml</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Closure:</span>
                              <span className="font-medium">{CLOSURE_TYPES.find(c => c.id === runData.closure_type)?.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Setup
                      </button>
                      <button
                        onClick={startRun}
                        className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold shadow-lg"
                      >
                        <Play className="w-5 h-5" />
                        Start Bottling Run
                      </button>
                      <button
                        onClick={saveAsDraft}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {saving ? 'Saving...' : 'Save as Draft'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Step 3: Execute Run - 2 Column Console */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Run Progress */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Bottling In Progress</h3>
                  <p className="text-sm text-gray-600">Started {new Date(runData.started_at).toLocaleTimeString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">ACTIVE</span>
                </div>
              </div>

              {/* Live Counters */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bottles Filled</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={runData.actual_bottles}
                      onChange={(e) => setRunData({ ...runData, actual_bottles: parseInt(e.target.value) || 0 })}
                      className="flex-1 px-4 py-3 text-3xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      disabled={runData.status !== 'active'}
                    />
                    <div className="text-right">
                      <p className="text-sm text-gray-500">of {runData.estimated_bottles}</p>
                      <p className="text-xs text-gray-400">
                        {runData.estimated_bottles > 0 ? ((runData.actual_bottles / runData.estimated_bottles) * 100).toFixed(1) : 0}% complete
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (runData.actual_bottles / runData.estimated_bottles) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cases Packed</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={runData.actual_cases}
                      onChange={(e) => setRunData({ ...runData, actual_cases: parseInt(e.target.value) || 0 })}
                      className="flex-1 px-4 py-3 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      disabled={runData.status !== 'active'}
                    />
                    <div className="text-right">
                      <p className="text-sm text-gray-500">of {runData.estimated_cases}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Remaining Estimate</p>
                  <p className="text-xl font-bold text-gray-900">
                    {Math.max(0, runData.estimated_bottles - runData.actual_bottles)} bottles
                  </p>
                </div>
              </div>
            </div>

            {/* QC Checkpoints */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">QC Checkpoints</h3>

              <div className="space-y-3">
                {Object.entries({
                  fill_height: 'Fill Height Checked',
                  cork_insertion: 'Cork Insertion Checked',
                  label_placement: 'Label Placement Checked',
                  closure_torque: 'Torque/Closure Checked',
                  oxygen_check: 'DO/Oxygen Check (optional)',
                  sample_retained: 'Sample Retained'
                }).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleQC(key)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      runData.qc_checks[key]
                        ? 'bg-green-50 border-green-500'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`font-medium ${runData.qc_checks[key] ? 'text-green-900' : 'text-gray-700'}`}>
                      {label}
                    </span>
                    {runData.qc_checks[key] && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Issue Log */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Issue Log</h3>
                <button
                  onClick={() => setShowIssueForm(!showIssueForm)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-all text-sm font-medium"
                >
                  <AlertCircle className="w-4 h-4" />
                  Add Issue
                </button>
              </div>

              {showIssueForm && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={issueForm.description}
                        onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                        rows="2"
                        placeholder="e.g., Label roll misaligned"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                      <select
                        value={issueForm.severity}
                        onChange={(e) => setIssueForm({ ...issueForm, severity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                      >
                        <option value="minor">Minor</option>
                        <option value="moderate">Moderate</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={addIssue}
                        className="px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-all text-sm font-medium"
                      >
                        Add Issue
                      </button>
                      <button
                        onClick={() => setShowIssueForm(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {runData.issues.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No issues logged</p>
                ) : (
                  runData.issues.map(issue => (
                    <div
                      key={issue.id}
                      className={`p-3 rounded-lg border ${
                        issue.severity === 'critical' ? 'bg-red-50 border-red-200' :
                        issue.severity === 'moderate' ? 'bg-amber-50 border-amber-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          issue.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          issue.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {issue.severity}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(issue.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-gray-700">{issue.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Complete Run Button */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Ready to Complete?</h4>
              <p className="text-sm text-gray-600 mb-4">Ensure all bottles are filled, QC checks completed, and any issues documented.</p>
              <button
                onClick={completeRun}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5" />
                Complete Bottling Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bottling Run Complete!</h2>
            <p className="text-gray-600">Run finished at {new Date(runData.completed_at).toLocaleTimeString()}</p>
          </div>

          {/* Summary Grid */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Bottles Produced</p>
              <p className="text-4xl font-bold text-[#7C203A]">{runData.actual_bottles.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <p className="text-sm text-gray-600 mb-1">Cases Packed</p>
              <p className="text-4xl font-bold text-[#7C203A]">{runData.actual_cases}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <p className="text-sm text-gray-600 mb-1">SKU Created</p>
              <p className="text-xl font-bold text-gray-900">{runData.sku_prefix}-{runData.lot_code}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Run Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lot:</span>
                  <span className="font-medium">{runData.label_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vintage:</span>
                  <span className="font-medium">{runData.vintage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bottle Size:</span>
                  <span className="font-medium">{runData.bottle_ml}ml</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Closure:</span>
                  <span className="font-medium">{CLOSURE_TYPES.find(c => c.id === runData.closure_type)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume Deducted:</span>
                  <span className="font-medium">{((runData.actual_bottles * runData.bottle_ml) / 3785.411784).toFixed(1)} gal</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">QC Summary</h4>
              <div className="space-y-2">
                {Object.values(runData.qc_checks).filter(Boolean).length > 0 ? (
                  <>
                    <p className="text-sm text-green-700 font-medium">
                      ✓ {Object.values(runData.qc_checks).filter(Boolean).length} of {Object.keys(runData.qc_checks).length} checks completed
                    </p>
                    <p className="text-sm text-gray-600">
                      {runData.issues.length} issue(s) logged
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-amber-600">⚠ No QC checks completed</p>
                )}
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-200">
            <button className="flex items-center gap-2 px-6 py-3 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-all font-medium">
              <Download className="w-4 h-4" />
              Download Run Sheet (PDF)
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium">
              <FileText className="w-4 h-4" />
              Export Label Data
            </button>
            <button
              onClick={() => {
                setCurrentStep(0);
                setRunData({
                  run_id: null,
                  lot_id: null,
                  selectedLot: null,
                  bottle_ml: 750,
                  closure_type: 'natural_cork',
                  capsule_color: '',
                  case_pack: 12,
                  pallet_cases: '',
                  bulk_volume_gal: 0,
                  loss_pct: 2.5,
                  headspace_loss_gal: 0,
                  net_volume_gal: 0,
                  estimated_bottles: 0,
                  estimated_cases: 0,
                  estimated_pallets: 0,
                  label_name: '',
                  varietal: '',
                  vintage: '',
                  appellation: '',
                  abv: '',
                  lot_code: '',
                  sku_prefix: 'BOT',
                  create_as: 'available',
                  run_date: new Date().toISOString().split('T')[0],
                  operator: '',
                  status: 'draft',
                  started_at: null,
                  completed_at: null,
                  actual_bottles: 0,
                  actual_cases: 0,
                  qc_checks: {
                    fill_height: false,
                    cork_insertion: false,
                    label_placement: false,
                    closure_torque: false,
                    oxygen_check: false,
                    sample_retained: false
                  },
                  issues: []
                });
              }}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
            >
              <Plus className="w-4 h-4" />
              Start New Run
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
