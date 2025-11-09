import React, { useState, useEffect } from 'react';
import {
  Droplet,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Gauge,
  Waves,
  CloudRain,
  Sun,
  Wind,
  Plus,
  Map,
  BarChart3,
  Activity,
  Zap,
  Layers,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  Settings
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useAuth } from '@/auth/AuthContext';
import { listVineyardBlocks, updateVineyardBlock } from '@/shared/lib/vineyardApi';
import {
  fetchOpenETData,
  getGrapeKc,
  applyKcToTimeseries,
  calculateWaterDeficit,
  getDateRange
} from '@/shared/lib/openETApi';
import {
  listIrrigationEvents,
  createIrrigationEvent,
  updateIrrigationEvent,
  deleteIrrigationEvent,
  createScheduleWithBackfill
} from '@/shared/lib/irrigationApi';
import {
  fetchFieldRainfall,
  fetchFieldForecast,
  calculateAdjustedIrrigation
} from '@/shared/lib/fieldWeatherService';
import { ETHeatMap } from './ETHeatMap';
import { ETTrendsChart } from './ETTrendsChart';
import { WaterBalanceCard } from './WaterBalanceCard';
import { IrrigationRecommendation } from './IrrigationRecommendation';
import { GrowthStageCard } from './GrowthStageCard';
import { YearComparison } from './YearComparison';
import { ETExplainerCard } from './ETExplainerCard';
import { NDVIZoneMap } from './NDVIZoneMap';
import {
  fetchNDVIForBlock,
  createZonesFromNDVI,
  isSentinelHubConfigured
} from '@/shared/lib/sentinelHubApi';

// Crop coefficients for grapes (Kc values by growth stage)
const GRAPE_KC_VALUES = {
  dormant: 0.30,      // December - March
  budbreak: 0.45,     // Early April
  flowering: 0.70,    // May - early June
  fruitset: 0.85,     // Late June - July
  veraison: 0.90,     // August
  harvest: 0.75,      // September - October
  postharvest: 0.50   // November
};

// Get current Kc based on date
const getCurrentKc = () => {
  const month = new Date().getMonth(); // 0-11

  if (month >= 11 || month <= 2) return GRAPE_KC_VALUES.dormant;
  if (month === 3) return GRAPE_KC_VALUES.budbreak;
  if (month === 4 || month === 5) return GRAPE_KC_VALUES.flowering;
  if (month === 6 || month === 7) return GRAPE_KC_VALUES.fruitset;
  if (month === 8) return GRAPE_KC_VALUES.veraison;
  if (month === 9) return GRAPE_KC_VALUES.harvest;
  return GRAPE_KC_VALUES.postharvest;
};

// Calculate ETc (crop evapotranspiration) from ETo
const calculateETc = (ETo, Kc) => {
  return ETo * Kc;
};

// Estimate soil moisture for each layer based on water balance
// Returns object with surface, mid, deep moisture percentages and status
const calculateSoilMoisture = (deficitMm, irrigationEvents, blockAcres = 1, rainfall = 0) => {
  // Field capacity reference (typical for vineyard soils)
  const FIELD_CAPACITY = 100; // 100% = field capacity
  const WILTING_POINT = 30;   // 30% = permanent wilting point

  // Convert deficit to percentage of depletion
  // Typical root zone holds ~150mm of available water at field capacity
  const ROOT_ZONE_CAPACITY_MM = 150;
  const depletionPercent = Math.min(100, (deficitMm / ROOT_ZONE_CAPACITY_MM) * 100);

  // Calculate total water applied (mm)
  const totalGallons = irrigationEvents.reduce((sum, event) => sum + (event.totalWater || 0), 0);
  const irrigationMm = (totalGallons / (blockAcres * 27154)) * 25.4;
  const totalWaterMm = irrigationMm + rainfall;

  // Calculate base moisture level from water balance
  const waterBalance = totalWaterMm - deficitMm;
  const baseMoisture = Math.max(WILTING_POINT, Math.min(FIELD_CAPACITY, FIELD_CAPACITY - depletionPercent + (waterBalance / ROOT_ZONE_CAPACITY_MM * 100)));

  // Layer-specific depletion patterns
  // Surface depletes fastest (evaporation + shallow roots)
  // Mid is primary root zone
  // Deep depletes slowest (deeper roots, no evaporation)
  const surfaceMoisture = Math.max(WILTING_POINT, Math.round(baseMoisture - 15 - (depletionPercent * 0.3)));
  const midMoisture = Math.max(WILTING_POINT, Math.round(baseMoisture - (depletionPercent * 0.2)));
  const deepMoisture = Math.max(WILTING_POINT, Math.round(baseMoisture + 10 - (depletionPercent * 0.1)));

  const getStatus = (moisture) => {
    if (moisture >= 70) return 'Good';
    if (moisture >= 50) return 'Moderate';
    return 'Low';
  };

  return {
    surface: { moisture: surfaceMoisture, status: getStatus(surfaceMoisture) },
    mid: { moisture: midMoisture, status: getStatus(midMoisture) },
    deep: { moisture: deepMoisture, status: getStatus(deepMoisture) }
  };
};

export function IrrigationManagement() {
  const { user } = useAuth();
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isAllFieldsMode, setIsAllFieldsMode] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [dateRange, setDateRange] = useState('30days'); // 7days, 30days, season
  const [soilMoistureExpanded, setSoilMoistureExpanded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Collapse states for all sections
  const [waterBudgetExpanded, setWaterBudgetExpanded] = useState(true);
  const [irrigationHistoryExpanded, setIrrigationHistoryExpanded] = useState(true);
  const [vriExpanded, setVriExpanded] = useState(true);
  const [etExplainerExpanded, setEtExplainerExpanded] = useState(false);
  const [openETExpanded, setOpenETExpanded] = useState(false);
  const [etVisualsExpanded, setEtVisualsExpanded] = useState(false);

  // System flow rate configuration (GPM) - loaded from database
  const [customFlowRate, setCustomFlowRate] = useState(null);

  // Real blocks data from database
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);

  // OpenET data state
  const [etData, setEtData] = useState({});
  const [loadingET, setLoadingET] = useState(false);

  // Irrigation events - loaded from database, keyed by block ID
  const [irrigationEvents, setIrrigationEvents] = useState({});
  const [loadingIrrigation, setLoadingIrrigation] = useState(false);

  // Rainfall data - loaded from rain gauges
  const [rainfallData, setRainfallData] = useState({});
  const [loadingRainfall, setLoadingRainfall] = useState(false);

  // New irrigation event form
  const [newEvent, setNewEvent] = useState({
    blockId: null,
    date: new Date().toISOString().split('T')[0],
    duration: 0,
    flowRate: 0,
    method: 'Drip',
    notes: ''
  });

  // Schedule mode toggle and schedule-specific fields
  const [isScheduleMode, setIsScheduleMode] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    startTime: '06:00',
    stopTime: '08:00',
    timesPerDay: 1,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days by default
    frequencyType: 'weekly'
  });

  // Notification state for custom alerts
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // VRI Zones State
  const [vriZones, setVriZones] = useState({});  // { blockId: [zones] }
  const [ndviData, setNdviData] = useState({}); // { blockId: full ndvi data with raster }
  const [showZoneEditor, setShowZoneEditor] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [showNDVIUpload, setShowNDVIUpload] = useState(false);
  const [loadingNDVI, setLoadingNDVI] = useState(false);
  const [ndviError, setNdviError] = useState(null);

  // Load blocks from database
  useEffect(() => {
    async function loadBlocks() {
      if (!user) return;

      try {
        setLoadingBlocks(true);
        const { data, error } = await listVineyardBlocks();

        if (error) {
          console.error('Error loading blocks:', error);
          return;
        }

        // Transform blocks to include extracted coordinates from geom
        const transformedBlocks = (data || []).map(block => {
          let lat = null;
          let lng = null;

          // Extract center coordinates from GeoJSON polygon
          if (block.geom && block.geom.coordinates && block.geom.coordinates[0]) {
            const coords = block.geom.coordinates[0];
            // Calculate centroid of polygon
            const lats = coords.map(c => c[1]);
            const lngs = coords.map(c => c[0]);
            lat = lats.reduce((sum, l) => sum + l, 0) / lats.length;
            lng = lngs.reduce((sum, l) => sum + l, 0) / lngs.length;
          }

          return {
            ...block,
            lat,
            lng,
            soilType: block.soil_type || 'Unknown',
            rootingDepth: 36 // Default rooting depth for grapes
          };
        });

        setBlocks(transformedBlocks);
        console.log(`✅ Loaded ${transformedBlocks.length} blocks from database:`, transformedBlocks);

        // Check which blocks have coordinates
        const blocksWithCoords = transformedBlocks.filter(b => b.lat && b.lng);
        const blocksWithoutCoords = transformedBlocks.filter(b => !b.lat || !b.lng);
        console.log(`📍 ${blocksWithCoords.length} blocks WITH coordinates`);
        if (blocksWithoutCoords.length > 0) {
          console.warn(`⚠️ ${blocksWithoutCoords.length} blocks WITHOUT coordinates:`, blocksWithoutCoords.map(b => b.name));
        }
      } catch (error) {
        console.error('Error loading blocks:', error);
      } finally {
        setLoadingBlocks(false);
      }
    }

    loadBlocks();
  }, [user]);

  // Fetch OpenET data for a block using real API
  const fetchOpenETDataForBlock = async (block) => {
    if (!block.lat || !block.lng) {
      console.warn('Block has no coordinates, cannot fetch ET data');
      return;
    }

    setLoadingET(true);
    try {
      // Get date range based on selected period
      const { startDate, endDate } = getDateRange(dateRange);

      console.log(`📡 Fetching OpenET data for ${block.name} (${block.lat}, ${block.lng})`);

      // Fetch real OpenET data
      const etResponse = await fetchOpenETData({
        lat: block.lat,
        lng: block.lng,
        startDate,
        endDate,
        model: 'ensemble',
        interval: 'daily'
      });

      // Apply grape Kc to calculate ETc
      const timeseriesWithKc = applyKcToTimeseries(
        etResponse.timeseries,
        getGrapeKc
      );

      // Calculate summary with Kc applied
      const totalET = timeseriesWithKc.reduce((sum, day) => sum + day.et, 0);
      const totalETc = timeseriesWithKc.reduce((sum, day) => sum + day.etc, 0);
      const avgET = totalET / timeseriesWithKc.length;

      const blockETData = {
        blockId: block.id,
        timeseries: timeseriesWithKc,
        summary: {
          avgET: parseFloat(avgET.toFixed(2)),
          totalET: parseFloat(totalET.toFixed(2)),
          totalETc: parseFloat(totalETc.toFixed(2)),
          deficit: 0 // Calculated with irrigation data
        },
        source: etResponse.source,
        fetchedAt: etResponse.fetchedAt
      };

      setEtData(prev => ({ ...prev, [block.id]: blockETData }));
      console.log(`✅ ET data loaded for ${block.name}:`, blockETData);

    } catch (error) {
      console.error('Error fetching OpenET data:', error);
    } finally {
      setLoadingET(false);
    }
  };

  // Load ET data when block is selected or date range changes
  useEffect(() => {
    if (selectedBlock && selectedBlock.lat && selectedBlock.lng) {
      console.log('🔄 useEffect triggered - fetching ET data for:', selectedBlock.name);
      fetchOpenETDataForBlock(selectedBlock);
    } else if (selectedBlock) {
      console.warn('⚠️ Selected block has no coordinates:', selectedBlock);
    }
  }, [selectedBlock, dateRange]);

  // Load ET data for all blocks when in "All Fields" mode
  useEffect(() => {
    if (isAllFieldsMode && blocks.length > 0) {
      console.log('🔄 Fetching ET data for all fields...');
      blocks.forEach(block => {
        if (block.lat && block.lng) {
          fetchOpenETDataForBlock(block);
        }
      });
    }
  }, [isAllFieldsMode, dateRange, blocks.length]);

  // Load flow rate from selected block
  useEffect(() => {
    if (selectedBlock) {
      // If block has a saved flow_rate_gpm, use it. Otherwise default to 15 GPM/acre
      const savedFlowRate = selectedBlock.flow_rate_gpm;
      setCustomFlowRate(savedFlowRate || Math.round(selectedBlock.acres * 15));
    }
  }, [selectedBlock]);

  // Save flow rate to database when it changes
  const saveFlowRate = async (flowRate) => {
    if (!selectedBlock || !flowRate) return;

    try {
      await updateVineyardBlock(selectedBlock.id, { flow_rate_gpm: flowRate });
      console.log(`✅ Saved flow rate ${flowRate} GPM for ${selectedBlock.name}`);

      // Update the blocks array so the value persists when switching fields
      setBlocks(prevBlocks =>
        prevBlocks.map(block =>
          block.id === selectedBlock.id
            ? { ...block, flow_rate_gpm: flowRate }
            : block
        )
      );

      // Update the selected block as well
      setSelectedBlock(prev => ({ ...prev, flow_rate_gpm: flowRate }));
    } catch (error) {
      console.error('Error saving flow rate:', error);
    }
  };

  // Load irrigation events when block is selected or date range changes
  useEffect(() => {
    async function loadIrrigationEvents() {
      if (!selectedBlock) return;

      setLoadingIrrigation(true);
      try {
        const { startDate, endDate } = getDateRange(dateRange);
        console.log(`💧 Loading irrigation events for block ${selectedBlock.name} (${selectedBlock.id}) from ${startDate} to ${endDate}`);

        const { data, error } = await listIrrigationEvents(
          selectedBlock.id,
          startDate,
          endDate
        );

        if (error) {
          console.error('Error loading irrigation events:', error);
          setIrrigationEvents(prev => ({ ...prev, [selectedBlock.id]: [] }));
          return;
        }

        // Transform database format to component format
        const transformedEvents = (data || []).map(event => ({
          id: event.id,
          blockId: event.block_id,
          date: event.event_date,
          duration: parseFloat(event.duration_hours),
          flowRate: event.flow_rate_gpm,
          totalWater: event.total_water_gallons,
          method: event.irrigation_method,
          notes: event.notes || '',
          source: event.source || 'manual',
          scheduleId: event.schedule_id || null,
          zoneNumber: event.zone_number
        }));

        setIrrigationEvents(prev => ({ ...prev, [selectedBlock.id]: transformedEvents }));
        console.log(`✅ Loaded ${transformedEvents.length} irrigation events for block ${selectedBlock.name}:`, transformedEvents);

      } catch (error) {
        console.error('Error loading irrigation events:', error);
        if (selectedBlock) {
          setIrrigationEvents(prev => ({ ...prev, [selectedBlock.id]: [] }));
        }
      } finally {
        setLoadingIrrigation(false);
      }
    }

    loadIrrigationEvents();
  }, [selectedBlock, dateRange]);

  // Load irrigation events for all blocks when in "All Fields" mode
  useEffect(() => {
    async function loadAllIrrigationEvents() {
      if (!isAllFieldsMode || blocks.length === 0) return;

      console.log('💧 Loading irrigation events for all fields...');
      setLoadingIrrigation(true);

      try {
        const { startDate, endDate } = getDateRange(dateRange);

        for (const block of blocks) {
          const { data, error } = await listIrrigationEvents(block.id, startDate, endDate);

          if (!error && data) {
            const transformedEvents = (data || []).map(event => ({
              id: event.id,
              blockId: event.block_id,
              date: event.event_date,
              duration: parseFloat(event.duration_hours),
              flowRate: event.flow_rate_gpm,
              totalWater: event.total_water_gallons,
              method: event.irrigation_method,
              notes: event.notes || '',
              source: event.source || 'manual',
              scheduleId: event.schedule_id || null,
              zoneNumber: event.zone_number
            }));

            setIrrigationEvents(prev => ({ ...prev, [block.id]: transformedEvents }));
          }
        }
      } catch (error) {
        console.error('Error loading irrigation events for all blocks:', error);
      } finally {
        setLoadingIrrigation(false);
      }
    }

    loadAllIrrigationEvents();
  }, [isAllFieldsMode, dateRange, blocks.length]);

  // Auto-fetch NDVI data when block is selected (only if not already loaded)
  useEffect(() => {
    async function autoFetchNDVI() {
      if (!selectedBlock) return;

      // Skip if we already have NDVI data for this block
      if (ndviData[selectedBlock.id] || vriZones[selectedBlock.id]) {
        console.log('📊 NDVI data already loaded for block:', selectedBlock.name);
        return;
      }

      // Skip if Sentinel Hub is not configured
      if (!isSentinelHubConfigured()) {
        console.log('⚠️ Sentinel Hub not configured, skipping auto-fetch NDVI');
        return;
      }

      console.log('🛰️ Auto-fetching NDVI data for:', selectedBlock.name);
      setLoadingNDVI(true);

      try {
        const fetchedNdviData = await fetchNDVIForBlock(selectedBlock, { days: 30 });
        const newZones = createZonesFromNDVI(fetchedNdviData, selectedBlock);

        setVriZones({
          ...vriZones,
          [selectedBlock.id]: newZones
        });

        setNdviData({
          ...ndviData,
          [selectedBlock.id]: fetchedNdviData
        });

        console.log('✅ Auto-loaded NDVI zones for:', selectedBlock.name);
      } catch (error) {
        console.error('Failed to auto-fetch NDVI data:', error);
        // Silently fail - user can manually fetch if needed
      } finally {
        setLoadingNDVI(false);
      }
    }

    autoFetchNDVI();
  }, [selectedBlock?.id]); // Only re-run when block ID changes

  // Load rainfall and forecast data when block is selected or date range changes
  useEffect(() => {
    async function loadWeatherData() {
      if (!selectedBlock || !selectedBlock.lat || !selectedBlock.lng) {
        console.log('⚠️ Block missing coordinates, skipping weather data');
        setRainfallData(prev => ({ ...prev, [selectedBlock?.id]: { totalMm: 0, dataSource: 'no_coordinates' } }));
        return;
      }

      setLoadingRainfall(true);
      try {
        console.log(`🌧️ Loading weather data for field "${selectedBlock.name}" at ${selectedBlock.lat}, ${selectedBlock.lng}`);

        // Determine days based on date range
        const daysMap = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          'ytd': Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)),
          'custom': 30 // Default for custom
        };
        const days = daysMap[dateRange] || 30;

        // Fetch both historical rainfall and forecast
        const [rainfallData, forecastData] = await Promise.all([
          fetchFieldRainfall(selectedBlock.lat, selectedBlock.lng, days),
          fetchFieldForecast(selectedBlock.lat, selectedBlock.lng)
        ]);

        setRainfallData(prev => ({
          ...prev,
          [selectedBlock.id]: {
            totalMm: rainfallData.totalMm || 0,
            totalInches: rainfallData.totalInches || 0,
            dailyRainfall: rainfallData.dailyRainfall || {},
            lastRainEvent: rainfallData.lastRainEvent,
            predictedMm: forecastData.predictedRainfallMm || 0,
            predictedInches: forecastData.predictedRainfallInches || 0,
            forecast: forecastData.periods || [],
            stationName: rainfallData.stationName,
            dataSource: rainfallData.error ? 'error' : 'nws_api',
            error: rainfallData.error || forecastData.error,
            days
          }
        }));

        console.log(`✅ Loaded weather for "${selectedBlock.name}": ${rainfallData.totalMm?.toFixed(1)}mm past ${days} days, ${forecastData.predictedRainfallMm?.toFixed(1)}mm predicted`);

      } catch (error) {
        console.error('Error loading weather data:', error);
        setRainfallData(prev => ({ ...prev, [selectedBlock.id]: { totalMm: 0, dataSource: 'error', error: error.message } }));
      } finally {
        setLoadingRainfall(false);
      }
    }

    loadWeatherData();
  }, [selectedBlock, dateRange]);

  // Calculate water budget for a block
  const calculateWaterBudget = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return null;

    // Get irrigation data
    const events = irrigationEvents[blockId] || [];
    const totalApplied = events.reduce((sum, e) => sum + e.totalWater, 0);
    const appliedInches = totalApplied / (27154 * block.acres); // Convert to inches

    // Get rainfall data
    const rainfall = rainfallData[blockId];
    const rainfallInches = rainfall ? (rainfall.totalInches || 0) : 0;
    const rainfallMm = rainfall ? (rainfall.totalMm || 0) : 0;
    const predictedRainfallInches = rainfall ? (rainfall.predictedInches || 0) : 0;
    const predictedRainfallMm = rainfall ? (rainfall.predictedMm || 0) : 0;

    // Get ET data
    const blockETData = etData[blockId];
    const etcInches = blockETData ? (blockETData.summary.totalETc / 25.4) : 0; // mm to inches
    const etcMm = blockETData ? blockETData.summary.totalETc : 0;

    // Calculate water balance: ETc - (Irrigation + Rainfall)
    const totalWaterInches = appliedInches + rainfallInches;
    const deficit = etcInches - totalWaterInches;

    // Calculate adjusted irrigation recommendation using rainfall forecast
    const adjustedIrrigation = calculateAdjustedIrrigation(
      deficit > 0 ? deficit * 25.4 : 0, // Convert deficit to mm
      rainfallMm,
      predictedRainfallMm
    );

    return {
      applied: appliedInches,
      rainfall: rainfallInches,
      rainfallMm: rainfallMm,
      predictedRainfall: predictedRainfallInches,
      predictedRainfallMm: predictedRainfallMm,
      rainfallDataSource: rainfall?.dataSource || 'none',
      stationName: rainfall?.stationName || null,
      lastRainEvent: rainfall?.lastRainEvent,
      forecast: rainfall?.forecast || [],
      totalWater: totalWaterInches, // Irrigation + Rainfall
      etc: etcInches,
      etcMm: etcMm,
      deficit: deficit,
      adjustedNeed: adjustedIrrigation.adjustedNeedInches || 0,
      savings: adjustedIrrigation.savings / 25.4 || 0, // Convert mm to inches
      savingsPercent: adjustedIrrigation.savingsPercent || 0,
      percentage: etcInches > 0 ? (totalWaterInches / etcInches) * 100 : 0
    };
  };

  // Add new irrigation event or schedule
  const handleAddEvent = async () => {
    if (isScheduleMode) {
      // Validate schedule fields
      if (!newEvent.blockId || !newEvent.flowRate || !scheduleData.startDate ||
          !scheduleData.startTime || !scheduleData.stopTime || scheduleData.daysOfWeek.length === 0) {
        setNotification({ type: 'error', message: 'Please fill in all required schedule fields' });
        return;
      }

      try {
        setLoadingIrrigation(true);

        // Create schedule with backfill
        const { data, error } = await createScheduleWithBackfill({
          block_id: newEvent.blockId,
          start_date: scheduleData.startDate,
          end_date: scheduleData.endDate || null,
          start_time: scheduleData.startTime,
          stop_time: scheduleData.stopTime,
          flow_rate_gpm: parseInt(newEvent.flowRate),
          irrigation_method: newEvent.method,
          frequency_type: scheduleData.frequencyType,
          times_per_day: scheduleData.timesPerDay,
          days_of_week: scheduleData.daysOfWeek,
          is_active: true,
          notes: newEvent.notes
        });

        if (error) {
          console.error('Error creating irrigation schedule:', error);
          setNotification({ type: 'error', message: `Failed to create irrigation schedule: ${error.message}` });
          return;
        }

        console.log('✅ Created irrigation schedule:', data);
        setNotification({ type: 'success', message: `Schedule created successfully! Generated ${data.eventCount} historical irrigation events.` });

        // Reload irrigation events for the selected block
        if (selectedBlock) {
          const { startDate, endDate } = getDateRange(dateRange);
          const { data: events } = await listIrrigationEvents(selectedBlock.id, startDate, endDate);

          const transformedEvents = (events || []).map(event => ({
            id: event.id,
            blockId: event.block_id,
            date: event.event_date,
            duration: parseFloat(event.duration_hours),
            flowRate: event.flow_rate_gpm,
            totalWater: event.total_water_gallons,
            method: event.irrigation_method,
            notes: event.notes || '',
            source: event.source || 'manual',
            scheduleId: event.schedule_id || null
          }));

          setIrrigationEvents(prev => ({ ...prev, [selectedBlock.id]: transformedEvents }));
        }

        // Reset form
        setShowAddEvent(false);
        setIsScheduleMode(false);
        setNewEvent({
          blockId: null,
          date: new Date().toISOString().split('T')[0],
          duration: 0,
          flowRate: 0,
          method: 'Drip',
          notes: ''
        });
        setScheduleData({
          startDate: new Date().toISOString().split('T')[0],
          endDate: null,
          startTime: '06:00',
          stopTime: '08:00',
          timesPerDay: 1,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          frequencyType: 'weekly'
        });

      } catch (error) {
        console.error('Error creating irrigation schedule:', error);
        setNotification({ type: 'error', message: 'Failed to create irrigation schedule' });
      } finally {
        setLoadingIrrigation(false);
      }
    } else {
      // One-time event mode
      if (!newEvent.blockId || !newEvent.duration || !newEvent.flowRate) {
        setNotification({ type: 'error', message: 'Please fill in all required fields' });
        return;
      }

      try {
        setLoadingIrrigation(true);

        const totalWater = newEvent.duration * newEvent.flowRate * 60; // hours * gpm * 60 min

        // Create event in database
        const { data, error } = await createIrrigationEvent({
          block_id: newEvent.blockId,
          event_date: newEvent.date,
          duration_hours: parseFloat(newEvent.duration),
          flow_rate_gpm: parseInt(newEvent.flowRate),
          total_water_gallons: totalWater,
          irrigation_method: newEvent.method,
          notes: newEvent.notes
        });

        if (error) {
          console.error('Error creating irrigation event:', error);
          setNotification({ type: 'error', message: `Failed to save irrigation event: ${error.message}` });
          return;
        }

        console.log('✅ Created irrigation event:', data);
        setNotification({ type: 'success', message: 'Irrigation event saved successfully!' });

        // Reload irrigation events for the selected block
        if (selectedBlock) {
          const { startDate, endDate } = getDateRange(dateRange);
          const { data: events } = await listIrrigationEvents(selectedBlock.id, startDate, endDate);

          const transformedEvents = (events || []).map(event => ({
            id: event.id,
            blockId: event.block_id,
            date: event.event_date,
            duration: parseFloat(event.duration_hours),
            flowRate: event.flow_rate_gpm,
            totalWater: event.total_water_gallons,
            method: event.irrigation_method,
            notes: event.notes || '',
            source: event.source || 'manual',
            scheduleId: event.schedule_id || null
          }));

          setIrrigationEvents(prev => ({ ...prev, [selectedBlock.id]: transformedEvents }));
        }

        setShowAddEvent(false);
        setNewEvent({
          blockId: null,
          date: new Date().toISOString().split('T')[0],
          duration: 0,
          flowRate: 0,
          method: 'Drip',
          notes: ''
        });

      } catch (error) {
        console.error('Error saving irrigation event:', error);
        setNotification({ type: 'error', message: 'Failed to save irrigation event' });
      } finally {
        setLoadingIrrigation(false);
      }
    }
  };

  // Get irrigation recommendation
  const getIrrigationRecommendation = (blockId) => {
    const budget = calculateWaterBudget(blockId);
    if (!budget) return null;

    const block = blocks.find(b => b.id === blockId);

    // Calculate realistic flow rate based on acreage (15 GPM per acre for drip systems)
    const flowRateGPM = Math.round(block.acres * 15);

    if (budget.deficit > 1.0) {
      return {
        status: 'urgent',
        message: `Immediate irrigation needed - ${budget.deficit.toFixed(2)}" deficit`,
        hours: Math.ceil((budget.deficit * 27154 * block.acres) / (flowRateGPM * 60)),
        priority: 'high'
      };
    } else if (budget.deficit > 0.5) {
      return {
        status: 'recommended',
        message: `Irrigation recommended - ${budget.deficit.toFixed(2)}" deficit`,
        hours: Math.ceil((budget.deficit * 27154 * block.acres) / (flowRateGPM * 60)),
        priority: 'medium'
      };
    } else if (budget.deficit < -0.5) {
      return {
        status: 'excess',
        message: `Overwatered - ${Math.abs(budget.deficit).toFixed(2)}" excess`,
        hours: 0,
        priority: 'low'
      };
    } else {
      return {
        status: 'optimal',
        message: 'Water balance is optimal',
        hours: 0,
        priority: 'low'
      };
    }
  };

  // VRI Zone Handlers
  const addZone = () => {
    if (!selectedBlock) return;

    const newZone = {
      id: Date.now().toString(),
      name: `Zone ${(vriZones[selectedBlock.id] || []).length + 1}`,
      irrigationRate: 1.0, // gallons per hour per acre
      area: 0,
      vigor: 'medium',
      soilType: 'loam',
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    };

    setVriZones({
      ...vriZones,
      [selectedBlock.id]: [...(vriZones[selectedBlock.id] || []), newZone]
    });
    setEditingZone(newZone);
    setShowZoneEditor(true);
  };

  const updateZone = (zoneId, updates) => {
    if (!selectedBlock) return;

    const updatedZones = (vriZones[selectedBlock.id] || []).map(zone =>
      zone.id === zoneId ? { ...zone, ...updates } : zone
    );

    setVriZones({
      ...vriZones,
      [selectedBlock.id]: updatedZones
    });
  };

  const deleteZone = (zoneId) => {
    if (!selectedBlock) return;

    const updatedZones = (vriZones[selectedBlock.id] || []).filter(zone => zone.id !== zoneId);

    setVriZones({
      ...vriZones,
      [selectedBlock.id]: updatedZones
    });
  };

  // Fetch NDVI from Sentinel Hub satellite imagery
  const fetchNDVIFromSatellite = async () => {
    if (!selectedBlock) return;

    setLoadingNDVI(true);
    setNdviError(null);

    try {
      console.log('🛰️ Fetching NDVI from Sentinel-2 for block:', selectedBlock.name);

      // Check if Sentinel Hub is configured
      if (!isSentinelHubConfigured()) {
        throw new Error('Sentinel Hub API not configured. Please add credentials to .env.local');
      }

      // Fetch NDVI data from satellite
      const fetchedNdviData = await fetchNDVIForBlock(selectedBlock, { days: 30 });

      // Create VRI zones from NDVI data
      const newZones = createZonesFromNDVI(fetchedNdviData, selectedBlock);

      // Store both zones and full NDVI data
      setVriZones({
        ...vriZones,
        [selectedBlock.id]: newZones
      });

      setNdviData({
        ...ndviData,
        [selectedBlock.id]: fetchedNdviData
      });

      alert(`Successfully analyzed satellite imagery!\n\nCreated ${newZones.length} irrigation zones based on NDVI data from Sentinel-2.\n\nDate Range: ${fetchedNdviData.dateRange.from} to ${fetchedNdviData.dateRange.to}\nCloud Coverage: ${fetchedNdviData.stats.cloudCoverage}%\nMean NDVI: ${fetchedNdviData.stats.meanNDVI.toFixed(2)}`);
      setShowNDVIUpload(false);

    } catch (error) {
      console.error('Failed to fetch NDVI data:', error);
      setNdviError(error.message);
      alert(`Failed to fetch NDVI data:\n\n${error.message}\n\nPlease check that:\n1. Sentinel Hub credentials are configured\n2. The field has valid geometry\n3. Your API quota hasn't been exceeded`);
    } finally {
      setLoadingNDVI(false);
    }
  };

  const processNDVIUpload = (file) => {
    // For file uploads, we'll use simulated processing for now
    // In the future, this could parse uploaded GeoTIFF files using geotiff.js
    if (!selectedBlock) return;

    console.log('📁 Processing uploaded file:', file.name);

    const numZones = Math.floor(Math.random() * 3) + 3; // 3-5 zones
    const vigorLevels = ['low', 'medium-low', 'medium', 'medium-high', 'high'];
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

    const newZones = Array.from({ length: numZones }, (_, i) => ({
      id: `ndvi-${Date.now()}-${i}`,
      name: `NDVI Zone ${i + 1}`,
      irrigationRate: 0.8 + (i * 0.3), // Varies from 0.8 to 2.0
      area: selectedBlock.acres / numZones,
      vigor: vigorLevels[i % vigorLevels.length],
      soilType: 'detected',
      color: colors[i % colors.length],
      source: 'File Upload'
    }));

    setVriZones({
      ...vriZones,
      [selectedBlock.id]: newZones
    });

    alert(`Successfully processed file: ${file.name}\n\nCreated ${numZones} irrigation zones.\n\nNote: File parsing is simulated. For real satellite data, use "Fetch from Satellite" button.`);
    setShowNDVIUpload(false);
  };

  const exportPrescriptionMap = () => {
    if (!selectedBlock || !vriZones[selectedBlock.id]) return;

    const zones = vriZones[selectedBlock.id];
    const prescriptionData = {
      blockName: selectedBlock.name,
      blockId: selectedBlock.id,
      exportDate: new Date().toISOString(),
      zones: zones.map(zone => ({
        zoneName: zone.name,
        irrigationRate: zone.irrigationRate,
        area: zone.area,
        vigor: zone.vigor,
        soilType: zone.soilType
      }))
    };

    // Create downloadable JSON file
    const dataStr = JSON.stringify(prescriptionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VRI-Prescription-${selectedBlock.name}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const MetricCard = ({ icon: Icon, label, value, unit, color = 'blue', trend, subtitle }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg bg-${color}-50 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${color}-600`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {value}
          {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
        </div>
        <div className="text-sm text-gray-600">{label}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md animate-slide-in-right`}>
          <div className={`rounded-lg shadow-lg p-4 flex items-start gap-3 ${
            notification.type === 'success'
              ? 'bg-green-50 border-l-4 border-green-500'
              : 'bg-red-50 border-l-4 border-red-500'
          }`}>
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                notification.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className={`flex-shrink-0 ${
                notification.type === 'success' ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Block Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Field
              </label>

              {loadingBlocks ? (
                <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-gray-600">Loading fields...</span>
                </div>
              ) : blocks.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  <Map className="w-4 h-4 opacity-50" />
                  <span className="text-sm">No fields found - add fields in the Fields tab</span>
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  {/* Custom Dropdown Button */}
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-left bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isAllFieldsMode ? (
                          <>
                            <Layers className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">All Fields</div>
                              <div className="text-sm text-gray-500">
                                {blocks.length} fields • {blocks.reduce((sum, b) => sum + (b.acres || 0), 0).toFixed(1)} acres total
                              </div>
                            </div>
                          </>
                        ) : selectedBlock ? (
                          <>
                            {(() => {
                              const recommendation = getIrrigationRecommendation(selectedBlock.id);
                              const priorityDot = recommendation ? (
                                <div className={`w-3 h-3 rounded-full ${
                                  recommendation.priority === 'high' ? 'bg-red-500' :
                                  recommendation.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`} />
                              ) : null;
                              return priorityDot;
                            })()}
                            <div>
                              <div className="font-medium text-gray-900">{selectedBlock.name}</div>
                              <div className="text-sm text-gray-500">
                                {selectedBlock.variety} • {selectedBlock.acres} acres
                              </div>
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-500">Choose a field...</span>
                        )}
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Custom Dropdown Menu */}
                  {dropdownOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(false)}
                      />

                      {/* Dropdown List */}
                      <div
                        className="fixed z-20 bg-white border-2 border-gray-200 rounded-lg shadow-xl overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        style={{
                          left: dropdownRef.current?.getBoundingClientRect().left,
                          top: (dropdownRef.current?.getBoundingClientRect().bottom || 0) + 8,
                          width: dropdownRef.current?.getBoundingClientRect().width,
                          maxHeight: `calc(100vh - ${(dropdownRef.current?.getBoundingClientRect().bottom || 0) + 16}px)`
                        }}
                      >
                        {/* Search Input */}
                        <div className="p-3 border-b-2 border-gray-200 bg-gray-50">
                          <input
                            type="text"
                            placeholder="Search fields..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>

                        {/* Field List */}
                        <div className="overflow-y-auto" style={{ maxHeight: `calc(100vh - ${(dropdownRef.current?.getBoundingClientRect().bottom || 0) + 100}px)` }}>
                          {/* All Fields Option */}
                          <button
                            onClick={() => {
                              setIsAllFieldsMode(true);
                              setSelectedBlock(null);
                              setDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b-2 border-gray-200 ${
                              isAllFieldsMode ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Layers className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900">All Fields</div>
                                <div className="text-sm text-gray-500">
                                  View summary across all {blocks.length} fields
                                </div>
                              </div>
                              {isAllFieldsMode && (
                                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </button>

                          {/* Individual Fields */}
                          {blocks
                            .filter(block =>
                              block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              block.variety.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(block => {
                            const recommendation = getIrrigationRecommendation(block.id);
                            const isSelected = !isAllFieldsMode && selectedBlock?.id === block.id;

                            return (
                              <button
                                key={block.id}
                                onClick={() => {
                                  setIsAllFieldsMode(false);
                                  setSelectedBlock(block);
                                  setDropdownOpen(false);
                                  setSearchQuery('');
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                  isSelected ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {recommendation && (
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                      recommendation.priority === 'high' ? 'bg-red-500' :
                                      recommendation.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`} />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">{block.name}</div>
                                    <div className="text-sm text-gray-500">
                                      {block.variety} • {block.acres} acres
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedBlock && (!selectedBlock.lat || !selectedBlock.lng) && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                  ⚠️ This field has no coordinates. Add a map location in the Fields tab for full functionality.
                </div>
              )}
            </div>

            {selectedBlock && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchOpenETDataForBlock(selectedBlock)}
                  disabled={loadingET}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                  title="Refresh ET data"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingET ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="season">This Season</option>
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Configuration - Compact */}
      {selectedBlock && (
        <Card className="bg-blue-50 border-2 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">System Flow Rate</h3>
                  <p className="text-xs text-gray-600">Your irrigation system capacity (GPM)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={customFlowRate || ''}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || null;
                    setCustomFlowRate(newValue);
                  }}
                  onBlur={(e) => {
                    const newValue = parseInt(e.target.value) || Math.round(selectedBlock.acres * 15);
                    setCustomFlowRate(newValue);
                    saveFlowRate(newValue);
                  }}
                  className="w-24 px-3 py-2 text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 text-center"
                  placeholder="GPM"
                />
                <span className="text-sm font-medium text-gray-600">GPM</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedBlock && (
        <>
          {/* Water Budget Dashboard */}
          {(() => {
            const budget = calculateWaterBudget(selectedBlock.id);
            if (!budget) return null;

            return (
              <Card>
                <CardContent className="pt-6">
                  <button
                    onClick={() => setWaterBudgetExpanded(!waterBudgetExpanded)}
                    className="w-full flex items-center justify-between mb-4 hover:bg-gray-50 px-2 py-2 rounded transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Waves className="w-5 h-5 text-blue-600" />
                      Water Budget - {selectedBlock.name}
                    </h3>
                    {waterBudgetExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </button>

                  {waterBudgetExpanded && (<>

                  {/* Data Source Accuracy Banner */}
                  <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-900 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Real-Time Field Data
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-gray-700">
                          <strong>ETc:</strong> {etData[selectedBlock.id]?.source === 'openet-api' ? '🛰️ Satellite (OpenET)' : '📊 Demo Data'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-gray-700">
                          <strong>Irrigation:</strong> {(irrigationEvents[selectedBlock.id] || []).length > 0 ? '💧 Database Records' : '⚠️ No Data'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${budget.rainfallDataSource === 'nws_api' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <span className="text-gray-700">
                          <strong>Rainfall:</strong> {budget.rainfallDataSource === 'nws_api' ? `🌧️ ${budget.stationName || 'NWS Weather Station'}` : budget.rainfallDataSource === 'no_coordinates' ? '⚠️ Add field coordinates' : '⚠️ Loading...'}
                        </span>
                      </div>
                    </div>
                    {budget.lastRainEvent?.date && (
                      <div className="mt-2 pt-2 border-t border-green-200 text-xs text-gray-700">
                        <strong>Last Rain:</strong> {new Date(budget.lastRainEvent.date).toLocaleDateString()} - {(budget.lastRainEvent.amount || 0).toFixed(1)}mm
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <MetricCard
                      icon={Droplet}
                      label="Irrigation Applied"
                      value={budget.applied.toFixed(2)}
                      unit="inches"
                      color="blue"
                      subtitle={(irrigationEvents[selectedBlock.id] || []).length > 0 ? `${(irrigationEvents[selectedBlock.id] || []).length} events` : 'No data'}
                    />
                    <MetricCard
                      icon={CloudRain}
                      label="Rainfall"
                      value={budget.rainfall.toFixed(2)}
                      unit="inches"
                      color={budget.rainfallDataSource === 'rain_gauge' ? 'green' : 'gray'}
                      subtitle={budget.rainfallDataSource === 'rain_gauge' ? `${budget.rainfallMm.toFixed(1)} mm` : 'No gauge data'}
                    />
                    <MetricCard
                      icon={Sun}
                      label="Crop Water Use (ETc)"
                      value={budget.etc.toFixed(2)}
                      unit="inches"
                      color="orange"
                      subtitle={`${budget.etcMm.toFixed(1)} mm (Satellite)`}
                    />
                    <MetricCard
                      icon={TrendingUp}
                      label="Water Deficit"
                      value={budget.deficit.toFixed(2)}
                      unit="inches"
                      color={budget.deficit > 0 ? 'red' : 'green'}
                      subtitle={budget.deficit > 0 ? 'Needs water' : 'Adequate'}
                    />
                    <MetricCard
                      icon={Gauge}
                      label="Water Balance"
                      value={budget.percentage.toFixed(0)}
                      unit="%"
                      color={budget.percentage < 80 ? 'red' : budget.percentage > 120 ? 'yellow' : 'green'}
                      subtitle={budget.percentage < 80 ? 'Under-irrigated' : budget.percentage > 120 ? 'Over-irrigated' : 'Optimal'}
                    />
                  </div>

                  {/* Visual Water Budget Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Water Balance Visualization</span>
                      <span>{budget.percentage.toFixed(0)}% of crop needs met</span>
                    </div>
                    <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full transition-all ${
                          budget.percentage < 80 ? 'bg-red-500' :
                          budget.percentage > 120 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-px h-full bg-white" style={{ marginLeft: '80%' }} />
                        <div className="w-px h-full bg-white" style={{ marginLeft: '20%' }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>Under-irrigated (&lt;80%)</span>
                      <span>Optimal (80-120%)</span>
                      <span>Over-irrigated (&gt;120%)</span>
                    </div>
                  </div>

                  </>)}

                </CardContent>
              </Card>
            );
          })()}

          {/* Irrigation Recommendation */}
          {(() => {
            const recommendation = getIrrigationRecommendation(selectedBlock.id);
            if (!recommendation) return null;

            const colors = {
              urgent: { bg: 'red-50', border: 'red-500', text: 'red-900', badge: 'red-100', badgeText: 'red-700' },
              recommended: { bg: 'yellow-50', border: 'yellow-500', text: 'yellow-900', badge: 'yellow-100', badgeText: 'yellow-700' },
              optimal: { bg: 'green-50', border: 'green-500', text: 'green-900', badge: 'green-100', badgeText: 'green-700' },
              excess: { bg: 'blue-50', border: 'blue-500', text: 'blue-900', badge: 'blue-100', badgeText: 'blue-700' }
            };

            const color = colors[recommendation.status];

            return (
              <Card className={`border-l-4 border-l-${color.border} bg-${color.bg}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${color.badge} flex items-center justify-center flex-shrink-0`}>
                      {recommendation.status === 'urgent' && <AlertCircle className={`w-5 h-5 text-${color.badgeText}`} />}
                      {recommendation.status === 'recommended' && <Clock className={`w-5 h-5 text-${color.badgeText}`} />}
                      {recommendation.status === 'optimal' && <CheckCircle className={`w-5 h-5 text-${color.badgeText}`} />}
                      {recommendation.status === 'excess' && <Droplet className={`w-5 h-5 text-${color.badgeText}`} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-semibold text-${color.text}`}>Irrigation Scheduler</h4>
                        <span className={`text-xs font-medium text-${color.badgeText} bg-${color.badge} px-2 py-1 rounded-full uppercase`}>
                          {recommendation.status}
                        </span>
                      </div>
                      <p className={`text-sm text-${color.text} mb-2`}>{recommendation.message}</p>
                      {recommendation.hours > 0 && (
                        <div className={`text-sm text-${color.text} font-semibold`}>
                          Recommended irrigation duration: {recommendation.hours} hours at {Math.round(selectedBlock.acres * 15)} GPM
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Irrigation History */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setIrrigationHistoryExpanded(!irrigationHistoryExpanded)}
                  className="flex items-center gap-2 hover:bg-gray-50 -ml-2 pl-2 pr-4 py-2 rounded transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Irrigation History - {selectedBlock.name}
                  </h3>
                  {irrigationHistoryExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </button>
                {irrigationHistoryExpanded && (
                  <button
                    onClick={() => setShowAddEvent(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Log Irrigation
                  </button>
                )}
              </div>

              {irrigationHistoryExpanded && (<>

              {/* Automation Readiness Note */}
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-900">
                    <strong className="text-blue-900">Automation Ready:</strong> Log your irrigation events here manually.
                    This data will soon power automated irrigation scheduling and smart recommendations based on real-time
                    ET data and soil moisture levels.
                  </p>
                </div>
              </div>

              {showAddEvent && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">
                      {isScheduleMode ? 'Add Irrigation Schedule' : 'Add Irrigation Event'}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">One-Time</span>
                      <button
                        onClick={() => {
                          setIsScheduleMode(!isScheduleMode);
                          // Auto-populate flow rate from block when switching to schedule mode
                          if (!isScheduleMode && selectedBlock?.flow_rate_gpm) {
                            setNewEvent(prev => ({ ...prev, flowRate: selectedBlock.flow_rate_gpm }));
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isScheduleMode ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isScheduleMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-sm text-gray-600">Schedule</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {isScheduleMode ? (
                      <>
                        {/* Schedule Mode Fields */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={scheduleData.startDate}
                            onChange={(e) => setScheduleData({ ...scheduleData, startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
                          <input
                            type="date"
                            value={scheduleData.endDate || ''}
                            onChange={(e) => setScheduleData({ ...scheduleData, endDate: e.target.value || null })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={scheduleData.startTime}
                            onChange={(e) => setScheduleData({ ...scheduleData, startTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stop Time</label>
                          <input
                            type="time"
                            value={scheduleData.stopTime}
                            onChange={(e) => setScheduleData({ ...scheduleData, stopTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Flow Rate (GPM)</label>
                          <input
                            type="number"
                            value={newEvent.flowRate}
                            onChange={(e) => setNewEvent({ ...newEvent, flowRate: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                          <select
                            value={newEvent.method}
                            onChange={(e) => setNewEvent({ ...newEvent, method: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Drip">Drip</option>
                            <option value="Micro-sprinkler">Micro-sprinkler</option>
                            <option value="Overhead">Overhead</option>
                            <option value="Flood">Flood</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Times Per Day</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={scheduleData.timesPerDay}
                            onChange={(e) => setScheduleData({ ...scheduleData, timesPerDay: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                          <select
                            value={scheduleData.frequencyType}
                            onChange={(e) => setScheduleData({ ...scheduleData, frequencyType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                          <div className="flex gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  const newDays = scheduleData.daysOfWeek.includes(index)
                                    ? scheduleData.daysOfWeek.filter(d => d !== index)
                                    : [...scheduleData.daysOfWeek, index].sort();
                                  setScheduleData({ ...scheduleData, daysOfWeek: newDays });
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  scheduleData.daysOfWeek.includes(index)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                          <textarea
                            value={newEvent.notes}
                            onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* One-Time Event Mode Fields */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            value={newEvent.date}
                            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                          <select
                            value={newEvent.method}
                            onChange={(e) => setNewEvent({ ...newEvent, method: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Drip">Drip</option>
                            <option value="Micro-sprinkler">Micro-sprinkler</option>
                            <option value="Overhead">Overhead</option>
                            <option value="Flood">Flood</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={newEvent.duration}
                            onChange={(e) => setNewEvent({ ...newEvent, duration: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Flow Rate (GPM)</label>
                          <input
                            type="number"
                            value={newEvent.flowRate}
                            onChange={(e) => setNewEvent({ ...newEvent, flowRate: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                          <textarea
                            value={newEvent.notes}
                            onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => {
                        setNewEvent({ ...newEvent, blockId: selectedBlock.id });
                        handleAddEvent();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      {isScheduleMode ? 'Create Schedule' : 'Save Event'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddEvent(false);
                        setIsScheduleMode(false);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {(irrigationEvents[selectedBlock.id] || [])
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Droplet className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{event.method} Irrigation</span>
                              {event.source === 'webhook' && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  Auto
                                  {event.zoneNumber && ` Z${event.zoneNumber}`}
                                </span>
                              )}
                              {event.source === 'schedule' && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Scheduled
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(event.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {(event.totalWater / 1000).toFixed(1)}k
                              <span className="text-sm text-gray-500 ml-1">gal</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {(event.totalWater / (27154 * selectedBlock.acres)).toFixed(2)}"
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                          <span>{event.duration} hours</span>
                          <span>•</span>
                          <span>{event.flowRate} GPM</span>
                        </div>
                        {event.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}

                {(irrigationEvents[selectedBlock.id] || []).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Droplet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No irrigation events recorded for this block</p>
                    <button
                      onClick={() => setShowAddEvent(true)}
                      className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Log your first irrigation event
                    </button>
                  </div>
                )}
              </div>
              </>)}
            </CardContent>
          </Card>

          {/* NDVI Heat Map - Always visible */}
          <Card className="border-2 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    NDVI Heat Map
                  </h3>
                  <p className="text-sm text-gray-600">
                    Satellite vegetation health analysis
                  </p>
                </div>
              </div>

              <NDVIZoneMap
                block={selectedBlock}
                zones={vriZones[selectedBlock.id]}
                ndviData={ndviData[selectedBlock.id]}
                height="500px"
              />
              <p className="text-xs text-gray-500 mt-2">
                Satellite NDVI data shows vegetation health. Red = low vigor (more water), Green = high vigor (less water).
                {vriZones[selectedBlock.id]?.length > 0 && ' Click zones for detailed irrigation rates.'}
              </p>
            </CardContent>
          </Card>

          {/* Variable Rate Irrigation (VRI) - NDVI-based precision irrigation zones */}
          {vriZones[selectedBlock.id] && vriZones[selectedBlock.id].length > 0 && (
            <Card className="border-2 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Variable Rate Irrigation Zones
                      </h3>
                      <p className="text-sm text-gray-600">
                        {vriZones[selectedBlock.id]?.length || 0} zone{vriZones[selectedBlock.id]?.length !== 1 ? 's' : ''} configured from NDVI satellite data
                      </p>
                    </div>
                  </div>
                </div>

                {/* Zone Summary Table */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Zone Details</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left">Zone</th>
                          <th className="px-4 py-2 text-left">Vigor</th>
                          <th className="px-4 py-2 text-right">Area</th>
                          <th className="px-4 py-2 text-right">% of Field</th>
                          <th className="px-4 py-2 text-right">Irrigation Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vriZones[selectedBlock.id].map((zone, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: zone.color }}></div>
                                <span className="font-medium">Zone {idx + 1}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 capitalize">{zone.vigorLevel}</td>
                            <td className="px-4 py-3 text-right">
                              {((zone.percentOfField / 100) * selectedBlock.acres).toFixed(1)} ac
                            </td>
                            <td className="px-4 py-3 text-right">{zone.percentOfField.toFixed(1)}%</td>
                            <td className="px-4 py-3 text-right font-semibold text-purple-700">
                              {zone.recommendedRate} gal/hr/ac
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ========== ADVANCED TOOLS SECTION ========== */}

          {/* ET Explainer Card - Educates users about ET data */}
          <ETExplainerCard
            currentET={etData[selectedBlock.id]?.summary?.avgET || 0}
            isRealData={etData[selectedBlock.id]?.source === 'openet-api'}
          />

          {/* OpenET Dashboard */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Evapotranspiration (ET) Data
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-600">
                      Powered by OpenET - Satellite-based actual water use
                    </p>
                    {etData[selectedBlock.id] && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        etData[selectedBlock.id].source === 'openet-api'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {etData[selectedBlock.id].source === 'openet-api' ? '🛰️ Live Data' : '📊 Demo Data'}
                      </span>
                    )}
                  </div>
                </div>
                {loadingET && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                )}
              </div>

              {etData[selectedBlock.id] && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="w-4 h-4 text-orange-600" />
                      <span className="text-xs text-gray-600">Avg ET (ETo)</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {etData[selectedBlock.id].summary.avgET.toFixed(1)}
                      <span className="text-sm text-gray-500 ml-1">mm/day</span>
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplet className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600">Crop ET (ETc)</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {etData[selectedBlock.id].summary.avgET * getCurrentKc()}
                      <span className="text-sm text-gray-500 ml-1">mm/day</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Kc = {getCurrentKc()}</p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-gray-600">7-Day Total</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(() => {
                        const last7Days = etData[selectedBlock.id].timeseries.slice(-7);
                        const total = last7Days.reduce((sum, d) => sum + (d.etc || 0), 0);
                        return total.toFixed(1);
                      })()}
                      <span className="text-sm text-gray-500 ml-1">mm</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(() => {
                        const last7Days = etData[selectedBlock.id].timeseries.slice(-7);
                        const total = last7Days.reduce((sum, d) => sum + (d.etc || 0), 0);
                        return (total / 25.4).toFixed(2);
                      })()} inches
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600">ET Deficit</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {etData[selectedBlock.id].summary.deficit.toFixed(1)}
                      <span className="text-sm text-gray-500 ml-1">mm</span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ET Heat Map Visualization */}
          <Card>
            <CardContent className="p-0">
              <div className="h-[500px]">
                <ETHeatMap
                  block={selectedBlock}
                  selectedDate={new Date().toISOString().split('T')[0]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Soil Moisture Estimation */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                Estimated Soil Moisture
              </h3>

              <div className="grid grid-cols-3 gap-6">
                {(() => {
                  // Calculate actual soil moisture based on water balance
                  const blockData = etData[selectedBlock.id];
                  const deficitMm = blockData?.summary?.totalETc
                    ? -((irrigationEvents[selectedBlock.id] || [])
                        .reduce((sum, event) => sum + (event.totalWater || 0), 0)
                        / (selectedBlock.acres * 27154) * 25.4 - blockData.summary.totalETc)
                    : 0;

                  const blockIrrigationEvents = irrigationEvents[selectedBlock.id] || [];
                  const soilMoisture = calculateSoilMoisture(
                    Math.max(0, deficitMm),
                    blockIrrigationEvents,
                    selectedBlock.acres,
                    0 // rainfall - could be added later
                  );

                  return [
                    { depth: 'Surface (0-12")', moisture: soilMoisture.surface.moisture, status: soilMoisture.surface.status },
                    { depth: 'Mid (12-24")', moisture: soilMoisture.mid.moisture, status: soilMoisture.mid.status },
                    { depth: 'Deep (24-36")', moisture: soilMoisture.deep.moisture, status: soilMoisture.deep.status }
                  ];
                })().map((layer, idx) => (
                  <div key={idx} className="bg-gradient-to-b from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
                    <div className="text-sm font-medium text-gray-700 mb-3">{layer.depth}</div>
                    <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden mb-2">
                      <div
                        className={`absolute bottom-0 w-full transition-all ${
                          layer.moisture < 50 ? 'bg-red-400' :
                          layer.moisture < 70 ? 'bg-yellow-400' :
                          'bg-blue-400'
                        }`}
                        style={{ height: `${layer.moisture}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">{layer.moisture}%</span>
                      </div>
                    </div>
                    <div className={`text-xs font-semibold text-center ${
                      layer.moisture < 50 ? 'text-red-700' :
                      layer.moisture < 70 ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {layer.status}
                    </div>
                  </div>
                ))}
              </div>

              {/* Explainer Section - Collapsible */}
              <div className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-lg overflow-hidden">
                {/* Header - Always Visible */}
                <div
                  className="p-4 cursor-pointer hover:bg-amber-100 transition-colors"
                  onClick={() => setSoilMoistureExpanded(!soilMoistureExpanded)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-amber-900 mb-1">
                          Understanding Soil Moisture Estimates
                        </h4>
                        <p className="text-sm text-amber-800">
                          Learn how we calculate moisture levels and what the numbers mean for your vineyard
                        </p>
                      </div>
                    </div>
                    <button
                      className="text-amber-600 p-1 hover:bg-amber-200 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSoilMoistureExpanded(!soilMoistureExpanded);
                      }}
                    >
                      {soilMoistureExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {soilMoistureExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-amber-200 pt-4">
                    {/* What is Soil Moisture? */}
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-amber-600" />
                        What is Soil Moisture?
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Soil moisture measures the amount of water available in your soil for vine roots to absorb.
                        It's expressed as a percentage of <strong>field capacity</strong> - the maximum water soil can hold after excess drains away.
                      </p>
                      <div className="bg-amber-50 rounded p-3 text-sm text-gray-700">
                        <p className="mb-2"><strong>Why it matters:</strong></p>
                        <ul className="space-y-1 ml-4 list-disc">
                          <li>Too low (&lt;50%): Vines become stressed, fruit quality declines, growth slows</li>
                          <li>Optimal (50-70%): Healthy vine growth and controlled stress for wine quality</li>
                          <li>Too high (&gt;85%): Excess vegetative growth, potential root disease from waterlogging</li>
                        </ul>
                      </div>
                    </div>

                    {/* Why Different Layers? */}
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Why We Track Three Layers</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-400 mt-1 flex-shrink-0"></div>
                          <div>
                            <strong>Surface (0-12"):</strong> Driest layer - loses water through evaporation and shallow feeder roots.
                            First to dry out, tells you when irrigation is needed soon.
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-400 mt-1 flex-shrink-0"></div>
                          <div>
                            <strong>Mid (12-24"):</strong> Primary root zone - where most vine roots actively absorb water and nutrients.
                            Most important layer for vine health.
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-400 mt-1 flex-shrink-0"></div>
                          <div>
                            <strong>Deep (24-36"):</strong> Reserve moisture - deeper roots tap this during stress periods.
                            Slowest to deplete, acts as a buffer during hot/dry spells.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* How We Calculate It */}
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <h4 className="font-semibold text-gray-900 mb-2">How We Estimate Soil Moisture</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        We use a <strong>water balance model</strong> - the same method professional agronomists use:
                      </p>
                      <div className="bg-amber-50 rounded p-3 font-mono text-xs mb-3">
                        Soil Moisture = Previous Level + (Irrigation + Rain) - (ET × Kc)
                      </div>
                      <div className="text-sm text-gray-700 space-y-2">
                        <p><strong>Key factors:</strong></p>
                        <ul className="space-y-1 ml-4 list-disc">
                          <li><strong>Irrigation applied:</strong> Calculated from your logged irrigation events</li>
                          <li><strong>ET (Evapotranspiration):</strong> Satellite-measured water loss from OpenET</li>
                          <li><strong>Root zone capacity:</strong> ~150mm available water (typical for vineyard soils)</li>
                          <li><strong>Layer depletion rates:</strong> Surface drains 3× faster than deep layer</li>
                        </ul>
                      </div>
                    </div>

                    {/* Accuracy Note */}
                    <div className="bg-amber-900 text-amber-50 rounded-lg p-3 text-xs">
                      <strong>⚠️ Important:</strong> These are <strong>estimates</strong> based on water balance calculations.
                      For precise measurements, install soil moisture sensors at each depth. This tool helps you understand trends
                      and timing, but soil sensors show exact values and account for soil type variations across your vineyard.
                      Use both for best results!
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comprehensive ET Analytics Dashboard */}
          {etData[selectedBlock?.id] && (
            <>
              {/* Growth Stage & Irrigation Recommendation Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Growth Stage Card */}
                <GrowthStageCard
                  currentETc={etData[selectedBlock.id].summary?.avgET || 0}
                />

                {/* Irrigation Recommendation */}
                <IrrigationRecommendation
                  deficitMm={(() => {
                    const totalGallons = (irrigationEvents[selectedBlock.id] || [])
                      .reduce((sum, event) => sum + (event.totalWater || 0), 0);
                    const irrigationMm = (totalGallons / (selectedBlock.acres * 27154)) * 25.4;

                    // Get rainfall data
                    const rainfall = rainfallData[selectedBlock.id];
                    const rainfallMm = rainfall ? (rainfall.totalMm || 0) : 0;

                    const etcMm = etData[selectedBlock.id].summary.totalETc || 0;

                    // Calculate deficit: ETc - (Irrigation + Rainfall)
                    const rawDeficit = etcMm - (irrigationMm + rainfallMm);

                    // Debug logging
                    console.log('🔍 Irrigation Recommendation Calculation:', {
                      blockId: selectedBlock.id,
                      blockName: selectedBlock.name,
                      etcMm: etcMm.toFixed(1),
                      irrigationMm: irrigationMm.toFixed(1),
                      rainfallMm: rainfallMm.toFixed(1),
                      rawDeficit: rawDeficit.toFixed(1),
                      rainfallData: rainfall
                    });

                    // Cap deficit at reasonable levels
                    // Don't recommend making up for more than 40mm (1.6") at once
                    // Beyond that, you're waterlogging the soil and wasting water
                    const MAX_PRACTICAL_DEFICIT = 40; // mm
                    return Math.max(0, Math.min(rawDeficit, MAX_PRACTICAL_DEFICIT));
                  })()}
                  blockAcres={selectedBlock.acres || 1}
                  systemFlowRate={customFlowRate || Math.round(selectedBlock.acres * 15)}
                  forecastedET={(() => {
                    // Get the last 7 days of ET data as a proxy for next 2-3 days forecast
                    // We only forecast 2-3 days ahead since you should irrigate 2-3x per week
                    const timeseries = etData[selectedBlock.id].timeseries || [];
                    if (timeseries.length === 0) return 0;

                    const last7Days = timeseries.slice(-7);
                    const avgDaily = last7Days.reduce((sum, day) => sum + (day.etc || 0), 0) / last7Days.length;
                    return avgDaily * 3; // Forecast for next 3 days (between irrigation events)
                  })()}
                />
              </div>

              {/* Water Balance Card */}
              <WaterBalanceCard
                etData={etData[selectedBlock.id]}
                irrigationEvents={irrigationEvents[selectedBlock.id] || []}
                rainfall={0}
                blockAcres={selectedBlock.acres || 1}
              />

              {/* ET Trends Chart */}
              <ETTrendsChart
                timeseries={etData[selectedBlock.id].timeseries || []}
                title="ET Trends (Last 30 Days)"
              />

              {/* Year-over-Year Comparison */}
              <YearComparison
                currentYearData={etData[selectedBlock.id].timeseries || []}
                previousYearData={etData[selectedBlock.id].timeseries || []} // TODO: Fetch actual previous year data
              />
            </>
          )}
        </>
      )}

      {!selectedBlock && !isAllFieldsMode && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-gray-500">
              <Droplet className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Select a field to view irrigation data</p>
              <p className="text-sm">Choose a field above to see ET data, water budget, and irrigation history</p>
              <p className="text-sm mt-2">Or select "All Fields" to see a summary across all fields</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Fields Summary View */}
      {isAllFieldsMode && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Layers className="w-6 h-6 text-blue-600" />
                    All Fields Summary
                  </h3>
                  <p className="text-sm text-gray-600">
                    Overview of irrigation across {blocks.length} fields totaling {blocks.reduce((sum, b) => sum + (b.acres || 0), 0).toFixed(1)} acres
                  </p>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border border-gray-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Map className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{blocks.length}</div>
                      <div className="text-sm text-gray-600">Total Fields</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Activity className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {blocks.reduce((sum, b) => sum + (b.acres || 0), 0).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Total Acres</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Droplet className="w-8 h-8 mx-auto text-cyan-600 mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {blocks.filter(b => b.lat && b.lng).length}
                      </div>
                      <div className="text-sm text-gray-600">Fields with Coordinates</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {(() => {
                          const totalET = blocks.reduce((sum, block) => {
                            const blockET = etData[block.id];
                            if (blockET?.timeseries?.length > 0) {
                              const latest = blockET.timeseries[blockET.timeseries.length - 1];
                              return sum + (latest?.etc || 0);
                            }
                            return sum;
                          }, 0);
                          return totalET > 0 ? totalET.toFixed(1) : '-';
                        })()}
                      </div>
                      <div className="text-sm text-gray-600">Total ET Today (mm)</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fields Table */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Fields Overview</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Field Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Variety</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Acres</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Coordinates</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {blocks.map(block => (
                        <tr key={block.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{block.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{block.variety || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{block.acres || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            {block.lat && block.lng ? (
                              <CheckCircle className="w-4 h-4 text-green-600 inline" />
                            ) : (
                              <X className="w-4 h-4 text-gray-400 inline" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setIsAllFieldsMode(false);
                                setSelectedBlock(block);
                              }}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aggregate ET Data */}
        {(loadingET || blocks.some(b => etData[b.id]?.timeseries?.length > 0)) && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                ET Trends Across All Fields
                {loadingET && (
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                )}
              </h3>

              {loadingET && !blocks.some(b => etData[b.id]?.timeseries?.length > 0) ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Loading ET data across all fields...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                {/* Aggregate ET Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    let totalET7Day = 0;
                    let totalET30Day = 0;
                    let fieldsWithData = 0;

                    blocks.forEach(block => {
                      const blockET = etData[block.id];
                      if (blockET?.timeseries?.length > 0) {
                        fieldsWithData++;
                        const last7Days = blockET.timeseries.slice(-7);
                        const last30Days = blockET.timeseries.slice(-30);
                        totalET7Day += last7Days.reduce((sum, d) => sum + (d.etc || 0), 0);
                        totalET30Day += last30Days.reduce((sum, d) => sum + (d.etc || 0), 0);
                      }
                    });

                    return (
                      <>
                        <Card className="border border-gray-200">
                          <CardContent className="pt-4">
                            <div className="text-sm text-gray-600 mb-1">7-Day Total ET</div>
                            <div className="text-2xl font-bold text-gray-900">{totalET7Day.toFixed(1)} mm</div>
                            <div className="text-xs text-gray-500 mt-1">Across {fieldsWithData} fields</div>
                          </CardContent>
                        </Card>

                        <Card className="border border-gray-200">
                          <CardContent className="pt-4">
                            <div className="text-sm text-gray-600 mb-1">30-Day Total ET</div>
                            <div className="text-2xl font-bold text-gray-900">{totalET30Day.toFixed(1)} mm</div>
                            <div className="text-xs text-gray-500 mt-1">Across {fieldsWithData} fields</div>
                          </CardContent>
                        </Card>

                        <Card className="border border-gray-200">
                          <CardContent className="pt-4">
                            <div className="text-sm text-gray-600 mb-1">Average Daily ET</div>
                            <div className="text-2xl font-bold text-gray-900">
                              {fieldsWithData > 0 ? (totalET7Day / 7 / fieldsWithData).toFixed(2) : '0.00'} mm
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Per field (7-day avg)</div>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </div>

                {/* Per-Field ET Breakdown */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">ET by Field (Last 7 Days)</h4>
                  <div className="space-y-2">
                    {blocks
                      .filter(b => etData[b.id]?.timeseries?.length > 0)
                      .map(block => {
                        const blockET = etData[block.id];
                        const last7Days = blockET.timeseries.slice(-7);
                        const total7Day = last7Days.reduce((sum, d) => sum + (d.etc || 0), 0);
                        const maxET = Math.max(...blocks.map(b => {
                          const bET = etData[b.id];
                          if (bET?.timeseries?.length > 0) {
                            return bET.timeseries.slice(-7).reduce((sum, d) => sum + (d.etc || 0), 0);
                          }
                          return 0;
                        }));

                        return (
                          <div key={block.id} className="flex items-center gap-3">
                            <div className="w-32 text-sm font-medium text-gray-900 truncate">{block.name}</div>
                            <div className="flex-1">
                              <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                                  style={{ width: `${(total7Day / maxET) * 100}%` }}
                                />
                              </div>
                            </div>
                            <div className="w-20 text-sm font-semibold text-gray-900 text-right">
                              {total7Day.toFixed(1)} mm
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Aggregate Irrigation History */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-cyan-600" />
              Recent Irrigation Events (All Fields)
            </h3>

            {(() => {
              // Aggregate all irrigation events from all blocks
              const allEvents = blocks.flatMap(block =>
                (irrigationEvents[block.id] || []).map(event => ({
                  ...event,
                  blockName: block.name,
                  blockId: block.id
                }))
              ).sort((a, b) => new Date(b.date) - new Date(a.date));

              if (allEvents.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <Droplet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No irrigation events recorded yet</p>
                  </div>
                );
              }

              // Calculate aggregate stats
              const totalWater = allEvents.reduce((sum, e) => sum + (e.totalWater || 0), 0);
              const totalHours = allEvents.reduce((sum, e) => sum + (e.duration || 0), 0);
              const last7Days = allEvents.filter(e => {
                const eventDate = new Date(e.date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return eventDate >= weekAgo;
              });

              return (
                <div className="space-y-4">
                  {/* Aggregate Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border border-gray-200">
                      <CardContent className="pt-4">
                        <div className="text-sm text-gray-600 mb-1">Total Events</div>
                        <div className="text-2xl font-bold text-gray-900">{allEvents.length}</div>
                        <div className="text-xs text-gray-500 mt-1">{last7Days.length} in last 7 days</div>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200">
                      <CardContent className="pt-4">
                        <div className="text-sm text-gray-600 mb-1">Total Water Applied</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {(totalWater / 1000).toFixed(1)}K gal
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Across all fields</div>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200">
                      <CardContent className="pt-4">
                        <div className="text-sm text-gray-600 mb-1">Total Runtime</div>
                        <div className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)} hrs</div>
                        <div className="text-xs text-gray-500 mt-1">All irrigation combined</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Events List */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recent Events (Last 10)</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Field</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Duration</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Water Applied</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Method</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {allEvents.slice(0, 10).map(event => (
                            <tr key={`${event.blockId}-${event.date}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {new Date(event.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{event.blockName}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                {event.duration?.toFixed(1)} hrs
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                {event.totalWater ? (event.totalWater / 1000).toFixed(1) + 'K gal' : '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                  {event.method || 'Drip'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
        </div>
      )}

      {/* Zone Editor Modal */}
      {showZoneEditor && editingZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Layers className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">Edit VRI Zone</h2>
                  <p className="text-sm text-purple-100">{editingZone.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowZoneEditor(false);
                  setEditingZone(null);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Zone Name
                </label>
                <input
                  type="text"
                  value={editingZone.name}
                  onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Irrigation Rate (gal/hr/ac)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingZone.irrigationRate}
                    onChange={(e) => setEditingZone({ ...editingZone, irrigationRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Area (acres)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingZone.area}
                    onChange={(e) => setEditingZone({ ...editingZone, area: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vigor Level
                  </label>
                  <select
                    value={editingZone.vigor}
                    onChange={(e) => setEditingZone({ ...editingZone, vigor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium-low">Medium-Low</option>
                    <option value="medium">Medium</option>
                    <option value="medium-high">Medium-High</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Soil Type
                  </label>
                  <select
                    value={editingZone.soilType}
                    onChange={(e) => setEditingZone({ ...editingZone, soilType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="sand">Sand</option>
                    <option value="loamy-sand">Loamy Sand</option>
                    <option value="sandy-loam">Sandy Loam</option>
                    <option value="loam">Loam</option>
                    <option value="silt-loam">Silt Loam</option>
                    <option value="clay-loam">Clay Loam</option>
                    <option value="clay">Clay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Zone Color
                </label>
                <input
                  type="color"
                  value={editingZone.color}
                  onChange={(e) => setEditingZone({ ...editingZone, color: e.target.value })}
                  className="w-full h-12 px-2 py-1 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowZoneEditor(false);
                  setEditingZone(null);
                }}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateZone(editingZone.id, editingZone);
                  setShowZoneEditor(false);
                  setEditingZone(null);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NDVI Upload Modal */}
      {showNDVIUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Map className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">Import NDVI Data</h2>
                  <p className="text-sm text-indigo-100">Fetch from satellite or upload files</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNDVIUpload(false);
                  setNdviError(null);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
                disabled={loadingNDVI}
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Satellite NDVI Fetch Option */}
              <div className="border-2 border-indigo-300 rounded-lg p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">Fetch from Sentinel-2 Satellite</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Automatically analyze your field using free satellite imagery (10m resolution)
                    </p>
                    {isSentinelHubConfigured() ? (
                      <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded mb-3">
                        <CheckCircle className="w-4 h-4" />
                        Sentinel Hub API configured
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded mb-3">
                        <AlertCircle className="w-4 h-4" />
                        API credentials required (see setup instructions)
                      </div>
                    )}
                    <button
                      onClick={fetchNDVIFromSatellite}
                      disabled={loadingNDVI || !isSentinelHubConfigured()}
                      className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingNDVI ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Fetching satellite data...
                        </>
                      ) : (
                        <>
                          <Activity className="w-5 h-5" />
                          Fetch NDVI from Satellite
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500 font-medium">OR</span>
                </div>
              </div>

              {/* File Upload Option */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Map className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900 mb-1">Upload NDVI File</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Supports: GeoTIFF (.tif), Shapefile (.shp), KML (.kml)
                  </p>
                  <input
                    type="file"
                    accept=".tif,.tiff,.shp,.kml,.geojson"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processNDVIUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="ndvi-upload"
                    disabled={loadingNDVI}
                  />
                  <label
                    htmlFor="ndvi-upload"
                    className={`inline-block px-6 py-3 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors ${loadingNDVI ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    Choose File
                  </label>
                </div>
              </div>

              {/* Error Display */}
              {ndviError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900 mb-1">Error Loading NDVI Data</p>
                      <p className="text-sm text-red-800">{ndviError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>🛰️ Satellite Option:</strong> Automatically fetches and analyzes the most recent cloud-free
                  Sentinel-2 imagery from the last 30 days (10m resolution, free).
                </p>
                <p className="text-sm text-blue-900 mt-2">
                  <strong>📁 File Upload:</strong> Upload pre-processed NDVI imagery from drones or other sources
                  for higher resolution analysis.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowNDVIUpload(false);
                  setNdviError(null);
                }}
                disabled={loadingNDVI}
                className="w-full px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loadingNDVI ? 'Processing...' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
