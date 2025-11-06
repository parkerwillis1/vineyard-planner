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
  Info
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useAuth } from '@/auth/AuthContext';
import { listVineyardBlocks } from '@/shared/lib/vineyardApi';
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
  deleteIrrigationEvent
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
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [dateRange, setDateRange] = useState('30days'); // 7days, 30days, season
  const [soilMoistureExpanded, setSoilMoistureExpanded] = useState(false);

  // Real blocks data from database
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);

  // OpenET data state
  const [etData, setEtData] = useState({});
  const [loadingET, setLoadingET] = useState(false);

  // Irrigation events - loaded from database
  const [irrigationEvents, setIrrigationEvents] = useState([]);
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
          setIrrigationEvents([]);
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
          zoneNumber: event.zone_number
        }));

        setIrrigationEvents(transformedEvents);
        console.log(`✅ Loaded ${transformedEvents.length} irrigation events for block ${selectedBlock.name}:`, transformedEvents);

      } catch (error) {
        console.error('Error loading irrigation events:', error);
        setIrrigationEvents([]);
      } finally {
        setLoadingIrrigation(false);
      }
    }

    loadIrrigationEvents();
  }, [selectedBlock, dateRange]);

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
    const events = irrigationEvents.filter(e => e.blockId === blockId);
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

  // Add new irrigation event
  const handleAddEvent = async () => {
    if (!newEvent.blockId || !newEvent.duration || !newEvent.flowRate) {
      alert('Please fill in all required fields');
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
        alert('Failed to save irrigation event: ' + error.message);
        return;
      }

      console.log('✅ Created irrigation event:', data);

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
          notes: event.notes || ''
        }));

        setIrrigationEvents(transformedEvents);
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
      alert('Failed to save irrigation event');
    } finally {
      setLoadingIrrigation(false);
    }
  };

  // Get irrigation recommendation
  const getIrrigationRecommendation = (blockId) => {
    const budget = calculateWaterBudget(blockId);
    if (!budget) return null;

    const block = blocks.find(b => b.id === blockId);

    if (budget.deficit > 1.0) {
      return {
        status: 'urgent',
        message: `Immediate irrigation needed - ${budget.deficit.toFixed(2)}" deficit`,
        hours: Math.ceil((budget.deficit * 27154 * block.acres) / (50 * 60)),
        priority: 'high'
      };
    } else if (budget.deficit > 0.5) {
      return {
        status: 'recommended',
        message: `Irrigation recommended - ${budget.deficit.toFixed(2)}" deficit`,
        hours: Math.ceil((budget.deficit * 27154 * block.acres) / (50 * 60)),
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
      {/* Block Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Field</h3>
            <div className="flex items-center gap-2">
              {selectedBlock && (
                <button
                  onClick={() => fetchOpenETDataForBlock(selectedBlock)}
                  disabled={loadingET}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                  title="Refresh ET data"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingET ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
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
          </div>

          <>
            {loadingBlocks ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-gray-600">Loading fields...</p>
              </div>
            ) : blocks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium mb-2">No fields found</p>
                <p className="text-sm">Add fields in the Fields tab to track irrigation</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {blocks.map(block => {
                  const isSelected = selectedBlock?.id === block.id;
                  const recommendation = getIrrigationRecommendation(block.id);

                  return (
                    <button
                      key={block.id}
                      onClick={() => setSelectedBlock(block)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{block.name}</h4>
                          <p className="text-sm text-gray-500">{block.variety}</p>
                        </div>
                        {recommendation && (
                          <div className={`w-2 h-2 rounded-full ${
                            recommendation.priority === 'high' ? 'bg-red-500' :
                            recommendation.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>{block.acres} acres</span>
                        <span>•</span>
                        <span>{block.soilType}</span>
                      </div>
                      {!block.lat || !block.lng ? (
                        <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          ⚠️ No coordinates - add map in Fields tab
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        </CardContent>
      </Card>

      {selectedBlock && (
        <>
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
                      {etData[selectedBlock.id].summary.totalETc.toFixed(1)}
                      <span className="text-sm text-gray-500 ml-1">mm</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(etData[selectedBlock.id].summary.totalETc / 25.4).toFixed(2)} inches
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

              {/* Diagnostic Panel */}
              <div className="mt-4 space-y-2">
                <details className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                  <summary className="text-xs font-semibold text-gray-700 cursor-pointer">🔍 Debug Info (Click to expand)</summary>
                  <div className="mt-2 text-xs font-mono text-gray-600 space-y-1">
                    <div><strong>Data Source:</strong> {etData[selectedBlock.id]?.source || 'none'}</div>
                    <div><strong>Block ID:</strong> {selectedBlock.id}</div>
                    <div><strong>Block Coordinates:</strong> {selectedBlock.lat?.toFixed(4)}, {selectedBlock.lng?.toFixed(4)}</div>
                    <div><strong>Total ETc (30 days):</strong> {etData[selectedBlock.id]?.summary?.totalETc?.toFixed(1)} mm</div>
                    <div><strong>Irrigation Events for this block:</strong> {irrigationEvents.filter(e => e.blockId === selectedBlock.id).length} events</div>
                    {irrigationEvents.filter(e => e.blockId === selectedBlock.id).length > 0 && (
                      <div className="pl-4">
                        {irrigationEvents.filter(e => e.blockId === selectedBlock.id).map((evt, idx) => (
                          <div key={idx}>• {evt.date}: {evt.totalWater.toLocaleString()} gal ({evt.duration}h @ {evt.flowRate} GPM)</div>
                        ))}
                      </div>
                    )}
                    <div><strong>Total Irrigation (mm):</strong> {(() => {
                      const totalGallons = irrigationEvents.filter(e => e.blockId === selectedBlock.id).reduce((sum, event) => sum + (event.totalWater || 0), 0);
                      const irrigationMm = (totalGallons / (selectedBlock.acres * 27154)) * 25.4;
                      return irrigationMm.toFixed(1);
                    })()}</div>
                    <div><strong>Calculated Deficit:</strong> {(() => {
                      const totalGallons = irrigationEvents.filter(e => e.blockId === selectedBlock.id).reduce((sum, event) => sum + (event.totalWater || 0), 0);
                      const irrigationMm = (totalGallons / (selectedBlock.acres * 27154)) * 25.4;
                      const etcMm = etData[selectedBlock.id]?.summary?.totalETc || 0;
                      return (etcMm - irrigationMm).toFixed(1);
                    })()} mm</div>
                    <div className="pt-2 border-t border-gray-300">
                      {irrigationEvents.filter(e => e.blockId === selectedBlock.id).length === 0 ? (
                        <div>
                          <strong>💡 Tip:</strong> No irrigation events found in database for this block.
                          Use the "Add Irrigation Event" button below to log your irrigation applications.
                        </div>
                      ) : (
                        <div>
                          <strong>✅ Status:</strong> Showing real irrigation data from database for this block.
                        </div>
                      )}
                    </div>
                  </div>
                </details>

                <div className="p-3 bg-blue-100 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> OpenET integration is configured. In production, this will fetch real satellite-based
                    ET data from OpenET API using your field coordinates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Water Budget Dashboard */}
          {(() => {
            const budget = calculateWaterBudget(selectedBlock.id);
            if (!budget) return null;

            return (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Waves className="w-5 h-5 text-blue-600" />
                    Water Budget - {selectedBlock.name}
                  </h3>

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
                          <strong>Irrigation:</strong> {irrigationEvents.length > 0 ? '💧 Database Records' : '⚠️ No Data'}
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
                      subtitle={irrigationEvents.length > 0 ? `${irrigationEvents.length} events` : 'No data'}
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
                      />
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
                          Recommended irrigation duration: {recommendation.hours} hours at 50 GPM
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
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Irrigation History - {selectedBlock.name}
                </h3>
                <button
                  onClick={() => setShowAddEvent(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Log Irrigation
                </button>
              </div>

              {showAddEvent && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Add Irrigation Event</h4>
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => {
                        setNewEvent({ ...newEvent, blockId: selectedBlock.id });
                        handleAddEvent();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Save Event
                    </button>
                    <button
                      onClick={() => setShowAddEvent(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {irrigationEvents
                  .filter(e => e.blockId === selectedBlock.id)
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

                {irrigationEvents.filter(e => e.blockId === selectedBlock.id).length === 0 && (
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
                    ? -(((irrigationEvents
                        .filter(e => e.blockId === selectedBlock.id)
                        .reduce((sum, event) => sum + (event.totalWater || 0), 0)
                        / (selectedBlock.acres * 27154)) * 25.4) - blockData.summary.totalETc)
                    : 0;

                  const blockIrrigationEvents = irrigationEvents.filter(e => e.blockId === selectedBlock.id);
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

          {/* Variable Rate Zones */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Map className="w-5 h-5 text-purple-600" />
                  Variable Rate Irrigation Zones
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-2">Future Enhancement: VRI Mapping</h4>
                    <p className="text-sm text-purple-800 mb-3">
                      Variable Rate Irrigation will allow you to define zones within each block with different water needs
                      based on soil type, elevation, and canopy vigor from drone imagery.
                    </p>
                    <ul className="space-y-1 text-sm text-purple-700">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        Import NDVI zones from drone data
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        Define custom irrigation rates per zone
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        Export prescription maps for VRI controllers
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
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
                    const totalGallons = irrigationEvents
                      .filter(e => e.blockId === selectedBlock.id)
                      .reduce((sum, event) => sum + (event.totalWater || 0), 0);
                    const irrigationMm = (totalGallons / (selectedBlock.acres * 27154)) * 25.4;
                    const etcMm = etData[selectedBlock.id].summary.totalETc || 0;
                    const rawDeficit = etcMm - irrigationMm;

                    // Cap deficit at reasonable levels
                    // Don't recommend making up for more than 40mm (1.6") at once
                    // Beyond that, you're waterlogging the soil and wasting water
                    const MAX_PRACTICAL_DEFICIT = 40; // mm
                    return Math.min(rawDeficit, MAX_PRACTICAL_DEFICIT);
                  })()}
                  blockAcres={selectedBlock.acres || 1}
                  systemFlowRate={50}
                  forecastedET={etData[selectedBlock.id].summary?.avgET * 7 || 0}
                />
              </div>

              {/* Water Balance Card */}
              <WaterBalanceCard
                etData={etData[selectedBlock.id]}
                irrigationEvents={irrigationEvents.filter(e => e.blockId === selectedBlock.id)}
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

      {!selectedBlock && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-gray-500">
              <Droplet className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Select a block to view irrigation data</p>
              <p className="text-sm">Choose a block above to see ET data, water budget, and irrigation history</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
