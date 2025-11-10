import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Droplet,
  Grape,
  Download,
  BarChart3,
  LineChart as LineChartIcon,
  Activity,
  Sprout,
  Beaker,
  Sparkles,
  Target,
  Award,
  Sun,
  CloudRain,
  Wind,
  Users,
  Package,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  listLaborLogs,
  listInventoryTransactions,
  listFieldYieldHistory,
  listVineyardBlocks,
  listSprayApplications,
  listHarvestSamples
} from '@/shared/lib/vineyardApi';
import { listIrrigationEvents } from '@/shared/lib/irrigationApi';
import { fetchNDVIForBlock, isSentinelHubConfigured } from '@/shared/lib/sentinelHubApi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function CostAnalysis() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vineyard'); // 'vineyard' or 'cost'
  const [timeframe, setTimeframe] = useState('ytd');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedBlockForSamples, setSelectedBlockForSamples] = useState('all');

  // Data states
  const [laborLogs, setLaborLogs] = useState([]);
  const [inventoryTransactions, setInventoryTransactions] = useState([]);
  const [yieldHistory, setYieldHistory] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [sprayApplications, setSprayApplications] = useState([]);
  const [harvestSamples, setHarvestSamples] = useState([]);
  const [irrigationEvents, setIrrigationEvents] = useState([]);
  const [ndviData, setNdviData] = useState([]);
  const [loadingNdvi, setLoadingNdvi] = useState(false);
  const [ndviProgress, setNdviProgress] = useState({ current: 0, total: 0, field: '', month: '' });
  const [selectedBlockForNdvi, setSelectedBlockForNdvi] = useState('all');

  // Load all data
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, selectedYear]);

  const loadAllData = async () => {
    setLoading(true);

    try {
      const [laborRes, inventoryRes, yieldRes, blocksRes, sprayRes, samplesRes, irrigationRes] = await Promise.all([
        listLaborLogs({}).catch(err => ({ data: [], error: err })),
        listInventoryTransactions(null, 1000).catch(err => ({ data: [], error: err })),
        listFieldYieldHistory(null, selectedYear).catch(err => ({ data: [], error: err })),
        listVineyardBlocks().catch(err => ({ data: [], error: err })),
        listSprayApplications().catch(err => ({ data: [], error: err })),
        listHarvestSamples(null, selectedYear).catch(err => ({ data: [], error: err })),
        listIrrigationEvents().catch(err => ({ data: [], error: err }))
      ]);

      if (!laborRes.error && laborRes.data) {
        setLaborLogs(laborRes.data);
      } else if (laborRes.error) {
        console.warn('Labor logs not available:', laborRes.error);
        setLaborLogs([]);
      }

      if (!inventoryRes.error && inventoryRes.data) setInventoryTransactions(inventoryRes.data);
      if (!yieldRes.error && yieldRes.data) setYieldHistory(yieldRes.data);
      if (!blocksRes.error && blocksRes.data) setBlocks(blocksRes.data);
      if (!samplesRes.error && samplesRes.data) setHarvestSamples(samplesRes.data);
      if (!sprayRes.error && sprayRes.data) setSprayApplications(sprayRes.data);
      if (!irrigationRes.error && irrigationRes.data) setIrrigationEvents(irrigationRes.data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }

    setLoading(false);
  };

  // Load NDVI data for all blocks - monthly throughout the growing season (PARALLEL)
  const loadNdviData = useCallback(async () => {
    if (!isSentinelHubConfigured()) {
      console.log('Sentinel Hub not configured, skipping NDVI data');
      return;
    }

    if (blocks.length === 0) {
      return;
    }

    setLoadingNdvi(true);

    try {
      // Define growing season months (April through October)
      const currentYear = selectedYear;
      const growingSeasonMonths = [
        { month: 3, name: 'Apr', start: new Date(currentYear, 3, 1), end: new Date(currentYear, 3, 30) },
        { month: 4, name: 'May', start: new Date(currentYear, 4, 1), end: new Date(currentYear, 4, 31) },
        { month: 5, name: 'Jun', start: new Date(currentYear, 5, 1), end: new Date(currentYear, 5, 30) },
        { month: 6, name: 'Jul', start: new Date(currentYear, 6, 1), end: new Date(currentYear, 6, 31) },
        { month: 7, name: 'Aug', start: new Date(currentYear, 7, 1), end: new Date(currentYear, 7, 31) },
        { month: 8, name: 'Sep', start: new Date(currentYear, 8, 1), end: new Date(currentYear, 8, 30) },
        { month: 9, name: 'Oct', start: new Date(currentYear, 9, 1), end: new Date(currentYear, 9, 31) }
      ];

      // Only fetch data for months that have passed
      const now = new Date();
      const availableMonths = growingSeasonMonths.filter(m => {
        if (currentYear < now.getFullYear()) return true;
        if (currentYear > now.getFullYear()) return false;
        return m.start <= now;
      });

      // Filter blocks with geometry
      const blocksWithGeometry = blocks.filter(b => b.geom && b.geom.coordinates);
      const totalRequests = blocksWithGeometry.length * availableMonths.length;

      // Create all fetch promises at once (PARALLEL instead of sequential)
      const allFetches = [];
      blocksWithGeometry.forEach(block => {
        availableMonths.forEach(monthInfo => {
          allFetches.push({
            block,
            monthInfo,
            promise: fetchNDVIForBlock(block, {
              startDate: monthInfo.start,
              endDate: monthInfo.end
            }).catch(error => {
              console.warn(`Failed to fetch NDVI for block ${block.name} in ${monthInfo.name}:`, error);
              return null; // Return null on error so Promise.all doesn't fail
            })
          });
        });
      });

      setNdviProgress({
        current: 0,
        total: totalRequests,
        field: 'all fields',
        month: 'all months'
      });

      // Fetch ALL requests in parallel!
      console.log(`🚀 Fetching ${totalRequests} NDVI datasets in parallel...`);
      const results = await Promise.all(allFetches.map(f => f.promise));

      // Organize results by block
      const monthlyNdviByBlock = {};
      let resultIndex = 0;

      blocksWithGeometry.forEach(block => {
        monthlyNdviByBlock[block.id] = {
          blockId: block.id,
          blockName: block.name,
          variety: block.variety,
          acres: block.acres,
          monthlyData: []
        };

        availableMonths.forEach(monthInfo => {
          const ndvi = results[resultIndex++];

          if (ndvi) {
            monthlyNdviByBlock[block.id].monthlyData.push({
              month: monthInfo.month,
              monthName: monthInfo.name,
              meanNDVI: ndvi.meanNDVI,
              minNDVI: ndvi.minNDVI,
              maxNDVI: ndvi.maxNDVI,
              stdDevNDVI: ndvi.stdDevNDVI,
              dateRange: ndvi.dateRange
            });
          } else {
            // Add null data point for failed requests
            monthlyNdviByBlock[block.id].monthlyData.push({
              month: monthInfo.month,
              monthName: monthInfo.name,
              meanNDVI: null
            });
          }
        });
      });

      setNdviData(Object.values(monthlyNdviByBlock));
      console.log(`✅ Loaded ${totalRequests} NDVI datasets successfully`);
    } catch (error) {
      console.error('Error loading NDVI data:', error);
    }

    setLoadingNdvi(false);
    setNdviProgress({ current: 0, total: 0, field: '', month: '' });
  }, [blocks, selectedYear]);

  // Auto-load NDVI data when blocks are available (now optimized with parallel loading)
  useEffect(() => {
    if (blocks.length > 0 && isSentinelHubConfigured() && ndviData.length === 0) {
      loadNdviData();
    }
  }, [blocks, loadNdviData, ndviData.length]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear, 11, 31);

    const filterByDate = (items, dateField = 'date') => {
      return items.filter(item => {
        const date = new Date(item[dateField]);
        if (timeframe === 'ytd') {
          return date >= startOfYear && date <= now;
        } else if (timeframe === 'year') {
          return date >= startOfYear && date <= endOfYear;
        } else if (timeframe === 'quarter') {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const itemQuarter = Math.floor(date.getMonth() / 3);
          return date.getFullYear() === now.getFullYear() && itemQuarter === currentQuarter;
        } else { // month
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
      });
    };

    // Labor Analytics
    const filteredLaborLogs = filterByDate(laborLogs, 'log_date');
    const totalLaborCost = filteredLaborLogs.reduce((sum, log) => {
      const hours = parseFloat(log.hours_worked || 0);
      const rate = parseFloat(log.hourly_rate || 0);
      return sum + (hours * rate);
    }, 0);

    // Inventory/Materials Cost
    const filteredInventoryTxns = filterByDate(inventoryTransactions, 'transaction_date');
    const materialCosts = filteredInventoryTxns
      .filter(txn => txn.transaction_type === 'use')
      .reduce((sum, txn) => {
        const qty = Math.abs(parseFloat(txn.quantity || 0));
        const cost = parseFloat(txn.inventory_items?.unit_cost || 0);
        return sum + (qty * cost);
      }, 0);

    // Water Usage from Irrigation Events
    const filteredIrrigationEvents = filterByDate(irrigationEvents, 'event_date');
    const waterUsage = filteredIrrigationEvents.reduce((sum, event) => {
      return sum + parseFloat(event.total_water_gallons || 0);
    }, 0);
    const waterCost = 0; // Can be calculated if water cost per gallon is added

    // Spray Applications
    const filteredSprays = filterByDate(sprayApplications, 'application_date');
    const sprayCount = filteredSprays.length;
    const chemicalCosts = filteredInventoryTxns
      .filter(txn => txn.transaction_type === 'use' && txn.inventory_items?.category === 'chemical')
      .reduce((sum, txn) => {
        const qty = Math.abs(parseFloat(txn.quantity || 0));
        const cost = parseFloat(txn.inventory_items?.unit_cost || 0);
        return sum + (qty * cost);
      }, 0);

    // Grape Quality Metrics
    const avgBrix = yieldHistory.length > 0
      ? yieldHistory.reduce((sum, y) => sum + parseFloat(y.brix || 0), 0) / yieldHistory.length
      : 0;
    const avgPH = yieldHistory.length > 0
      ? yieldHistory.reduce((sum, y) => sum + parseFloat(y.ph || 0), 0) / yieldHistory.length
      : 0;
    const avgAcidity = yieldHistory.length > 0
      ? yieldHistory.reduce((sum, y) => sum + parseFloat(y.acidity || 0), 0) / yieldHistory.length
      : 0;
    const totalYield = yieldHistory.reduce((sum, y) => sum + parseFloat(y.yield_tons || 0), 0);

    // Revenue estimate (if we have price data)
    const estimatedRevenue = yieldHistory.reduce((sum, y) => {
      const yield_tons = parseFloat(y.yield_tons || 0);
      const price = parseFloat(y.price_per_ton || 0);
      return sum + (yield_tons * price);
    }, 0);

    // Monthly trends
    const monthlyData = [];
    for (let i = 0; i < 12; i++) {
      const monthLogs = filteredLaborLogs.filter(log => new Date(log.log_date).getMonth() === i);
      const monthInventory = filteredInventoryTxns.filter(txn => new Date(txn.transaction_date).getMonth() === i);
      const monthYields = yieldHistory.filter(y => new Date(y.harvest_date).getMonth() === i);

      const laborCost = monthLogs.reduce((sum, log) =>
        sum + (parseFloat(log.hours_worked || 0) * parseFloat(log.hourly_rate || 0)), 0
      );
      const materialCost = monthInventory
        .filter(txn => txn.transaction_type === 'use')
        .reduce((sum, txn) => {
          const qty = Math.abs(parseFloat(txn.quantity || 0));
          const cost = parseFloat(txn.inventory_items?.unit_cost || 0);
          return sum + (qty * cost);
        }, 0);

      const monthBrix = monthYields.length > 0
        ? monthYields.reduce((sum, y) => sum + parseFloat(y.brix || 0), 0) / monthYields.length
        : null;
      const monthPH = monthYields.length > 0
        ? monthYields.reduce((sum, y) => sum + parseFloat(y.ph || 0), 0) / monthYields.length
        : null;
      const monthAcidity = monthYields.length > 0
        ? monthYields.reduce((sum, y) => sum + parseFloat(y.acidity || 0), 0) / monthYields.length
        : null;
      const monthYield = monthYields.reduce((sum, y) => sum + parseFloat(y.yield_tons || 0), 0);

      // Water usage for this month from irrigation events
      const monthIrrigationEvents = filteredIrrigationEvents.filter(event => new Date(event.event_date).getMonth() === i);
      const monthWaterUsage = monthIrrigationEvents.reduce((sum, event) =>
        sum + parseFloat(event.total_water_gallons || 0), 0
      );

      monthlyData.push({
        month: i,
        monthName: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        laborCost,
        materialCost,
        totalCost: laborCost + materialCost,
        brix: monthBrix,
        ph: monthPH,
        acidity: monthAcidity,
        yield: monthYield,
        waterUsage: monthWaterUsage
      });
    }

    // Block-level quality and performance data
    const blockQualityData = blocks.map(block => {
      const blockYields = yieldHistory.filter(y => y.block_id === block.id);
      const avgBlockBrix = blockYields.length > 0
        ? blockYields.reduce((sum, y) => sum + parseFloat(y.brix || 0), 0) / blockYields.length
        : 0;
      const avgBlockPH = blockYields.length > 0
        ? blockYields.reduce((sum, y) => sum + parseFloat(y.ph || 0), 0) / blockYields.length
        : 0;
      const avgBlockAcidity = blockYields.length > 0
        ? blockYields.reduce((sum, y) => sum + parseFloat(y.acidity || 0), 0) / blockYields.length
        : 0;
      const blockYieldTotal = blockYields.reduce((sum, y) => sum + parseFloat(y.yield_tons || 0), 0);

      return {
        name: block.name,
        brix: avgBlockBrix,
        ph: avgBlockPH,
        acidity: avgBlockAcidity,
        yield: blockYieldTotal,
        acres: parseFloat(block.acres || 0),
        yieldPerAcre: parseFloat(block.acres || 0) > 0 ? blockYieldTotal / parseFloat(block.acres || 0) : 0
      };
    }).filter(b => b.brix > 0 || b.ph > 0 || b.yield > 0);

    // Quality Score (normalized 0-100)
    const qualityScore = avgBrix > 0 ? Math.min(100, (
      (Math.min(avgBrix / 25, 1) * 40) +  // Brix contribution
      (avgPH >= 3.0 && avgPH <= 3.6 ? 30 : Math.max(0, 30 - Math.abs(avgPH - 3.3) * 10)) +  // pH contribution
      (avgAcidity >= 5 && avgAcidity <= 8 ? 30 : Math.max(0, 30 - Math.abs(avgAcidity - 6.5) * 5))  // Acidity contribution
    )) : 0;

    // Cost breakdown
    const costBreakdown = {
      labor: totalLaborCost,
      materials: materialCosts - waterCost - chemicalCosts,
      irrigation: waterCost,
      chemicals: chemicalCosts
    };

    const totalCosts = Object.values(costBreakdown).reduce((sum, cost) => sum + cost, 0);

    // Efficiency metrics
    const costPerTon = totalYield > 0 ? totalCosts / totalYield : 0;
    const revenuePerTon = totalYield > 0 && estimatedRevenue > 0 ? estimatedRevenue / totalYield : 0;
    const profitMargin = estimatedRevenue > 0 ? ((estimatedRevenue - totalCosts) / estimatedRevenue) * 100 : 0;

    // Performance radar data
    const radarData = [
      { metric: 'Quality', value: qualityScore, fullMark: 100 },
      { metric: 'Yield', value: Math.min(100, (totalYield / blocks.length) * 2), fullMark: 100 },
      { metric: 'Efficiency', value: Math.min(100, 100 - (costPerTon / 100)), fullMark: 100 },
      { metric: 'Sustainability', value: Math.min(100, 100 - (waterUsage / 1000)), fullMark: 100 },
      { metric: 'Cost Control', value: totalCosts > 0 ? Math.min(100, (1 - (totalCosts / (estimatedRevenue || totalCosts * 1.5))) * 100) : 50, fullMark: 100 }
    ];

    return {
      totalLaborCost,
      materialCosts,
      totalCosts,
      waterUsage,
      waterCost,
      sprayCount,
      chemicalCosts,
      avgBrix,
      avgPH,
      avgAcidity,
      totalYield,
      estimatedRevenue,
      profitMargin,
      costPerTon,
      revenuePerTon,
      qualityScore,
      monthlyData,
      blockQualityData,
      costBreakdown,
      radarData
    };
  }, [laborLogs, inventoryTransactions, yieldHistory, blocks, sprayApplications, irrigationEvents, timeframe, selectedYear]);

  const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(20);
    doc.text('Vineyard Analytics Report', 14, 15);

    doc.setFontSize(10);
    doc.text(`Period: ${timeframe.toUpperCase()} ${selectedYear}`, 14, 22);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 27);

    // Financial Summary
    doc.setFontSize(14);
    doc.text('Financial Performance', 14, 37);

    autoTable(doc, {
      startY: 42,
      head: [['Metric', 'Value']],
      body: [
        ['Total Operating Costs', `$${analytics.totalCosts.toLocaleString()}`],
        ['Estimated Revenue', `$${analytics.estimatedRevenue.toLocaleString()}`],
        ['Profit Margin', `${analytics.profitMargin.toFixed(1)}%`],
        ['Cost per Ton', `$${analytics.costPerTon.toFixed(2)}`]
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 85, 105] }
    });

    // Quality metrics
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Quality Metrics', 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Metric', 'Value']],
      body: [
        ['Quality Score', `${analytics.qualityScore.toFixed(0)}/100`],
        ['Average Brix', analytics.avgBrix.toFixed(1)],
        ['Average pH', analytics.avgPH.toFixed(2)],
        ['Average Acidity', `${analytics.avgAcidity.toFixed(2)} g/L`],
        ['Total Yield', `${analytics.totalYield.toFixed(1)} tons`]
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 85, 105] }
    });

    doc.save(`vineyard-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const MetricCard = ({ icon: Icon, label, value, subtext, color = 'blue', trend, gradient = false }) => (
    <Card className={gradient ? 'bg-gradient-to-br from-white to-gray-50 border-2' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-${color}-50 to-${color}-100 flex items-center justify-center shadow-sm`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {trend > 0 ? <TrendingUp className="w-4 h-4" /> : trend < 0 ? <TrendingDown className="w-4 h-4" /> : null}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
        {subtext && <div className="text-xs text-gray-500 mt-2">{subtext}</div>}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
            <p className="text-sm text-gray-600 mt-1">Comprehensive insights into quality, performance, and profitability</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe Selector */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { value: 'month', label: 'Month' },
                { value: 'quarter', label: 'Quarter' },
                { value: 'ytd', label: 'YTD' },
                { value: 'year', label: 'Year' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    timeframe === option.value
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <button
              onClick={exportPDF}
              className="inline-flex items-center justify-center px-4 h-10 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('vineyard')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'vineyard'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Grape className="w-4 h-4" />
                Vineyard Analysis
              </div>
            </button>
            <button
              onClick={() => setActiveTab('cost')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'cost'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cost Analysis
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Vineyard Analysis Tab */}
      {activeTab === 'vineyard' && (
        <>
          {/* Key Vineyard Health Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon={Award}
              label="Grape Quality"
              value={`${analytics.qualityScore.toFixed(0)}/100`}
              subtext={`Brix, pH, and acidity metrics`}
              color="purple"
              gradient={true}
            />
            <MetricCard
              icon={Grape}
              label="Total Yield"
              value={`${analytics.totalYield.toFixed(1)}t`}
              subtext={`Across ${blocks.length} field${blocks.length !== 1 ? 's' : ''}`}
              color="emerald"
            />
            <MetricCard
              icon={Droplet}
              label="Water Applied"
              value={`${(analytics.waterUsage / 1000).toFixed(1)}k gal`}
              subtext={`Irrigation tracking`}
              color="cyan"
            />
            <MetricCard
              icon={Wind}
              label="Spray Applications"
              value={analytics.sprayCount}
              subtext={`Disease & pest management`}
              color="sky"
            />
          </div>

          {/* Grape Quality Timeline - Full Width */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Beaker className="w-5 h-5 text-purple-600" />
                    Grape Quality Timeline
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">Periodic sample measurements throughout the growing season</p>
                    <Link
                      to="/vineyard/fields"
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 hover:underline"
                    >
                      Add samples
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedBlockForSamples}
                    onChange={(e) => setSelectedBlockForSamples(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">All Fields (Average)</option>
                    {blocks.map(block => (
                      <option key={block.id} value={block.id}>{block.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(() => {
                // Filter samples by selected block
                let filteredSamples = harvestSamples.filter(s => s.brix || s.ph || s.ta);
                if (selectedBlockForSamples !== 'all') {
                  filteredSamples = filteredSamples.filter(s => s.block_id === selectedBlockForSamples);
                }

                let timelineData = [];

                if (selectedBlockForSamples === 'all') {
                  // Group by date and calculate averages
                  const samplesByDate = {};
                  filteredSamples.forEach(s => {
                    const date = s.sample_date;
                    if (!samplesByDate[date]) {
                      samplesByDate[date] = [];
                    }
                    samplesByDate[date].push(s);
                  });

                  timelineData = Object.entries(samplesByDate).map(([date, samples]) => {
                    const brixSamples = samples.filter(s => s.brix).map(s => parseFloat(s.brix));
                    const phSamples = samples.filter(s => s.ph).map(s => parseFloat(s.ph));
                    const taSamples = samples.filter(s => s.ta).map(s => parseFloat(s.ta));

                    const avgBrix = brixSamples.length > 0 ? brixSamples.reduce((a, b) => a + b, 0) / brixSamples.length : null;
                    const avgPh = phSamples.length > 0 ? phSamples.reduce((a, b) => a + b, 0) / phSamples.length : null;
                    const avgTa = taSamples.length > 0 ? taSamples.reduce((a, b) => a + b, 0) / taSamples.length : null;

                    const blocks = [...new Set(samples.map(s => s.vineyard_blocks?.name).filter(Boolean))];
                    const varieties = [...new Set(samples.map(s => s.vineyard_blocks?.variety).filter(Boolean))];

                    return {
                      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                      shortDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      fullDate: date,
                      brix: avgBrix,
                      ph: avgPh,
                      acidity: avgTa,
                      block: `${samples.length} field${samples.length > 1 ? 's' : ''}`,
                      variety: varieties.join(', ') || 'Multiple',
                      notes: `Average of ${samples.length} sample${samples.length > 1 ? 's' : ''} (${blocks.join(', ')})`,
                      sampledBy: ''
                    };
                  }).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
                } else {
                  // Single block - show individual samples
                  timelineData = filteredSamples
                    .map(s => ({
                      date: new Date(s.sample_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                      shortDate: new Date(s.sample_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      fullDate: s.sample_date,
                      brix: parseFloat(s.brix) || null,
                      ph: parseFloat(s.ph) || null,
                      acidity: parseFloat(s.ta) || null,
                      block: s.vineyard_blocks?.name || 'Unknown',
                      variety: s.vineyard_blocks?.variety || '',
                      notes: s.notes || '',
                      sampledBy: s.organization_members?.full_name || ''
                    }))
                    .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
                }

                if (timelineData.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-80 text-gray-400">
                      <div className="text-center">
                        <Beaker className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No samples yet</p>
                        <p className="text-xs mt-1">Track grape quality throughout the season</p>
                        <p className="text-xs text-gray-500 mt-2">Take periodic samples to monitor Brix, pH, and acidity</p>
                      </div>
                    </div>
                  );
                }

                const CustomTooltip = ({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;

                  const data = payload[0].payload;

                  return (
                    <div className="bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 min-w-[280px]">
                      <div className="border-b border-gray-200 pb-2 mb-3">
                        <p className="font-bold text-gray-900 text-sm">{data.date}</p>
                        {data.variety && (
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-semibold">{data.variety}</span>
                            {data.block && <span className="text-gray-500"> • {data.block}</span>}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        {payload.map((entry, index) => {
                          if (entry.value === null) return null;
                          return (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-xs font-medium text-gray-700">{entry.name}</span>
                              </div>
                              <span className="text-sm font-bold text-gray-900">{entry.value.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>

                      {data.sampledBy && (
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500">Sampled by: <span className="font-medium text-gray-700">{data.sampledBy}</span></p>
                        </div>
                      )}

                      {data.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-600 italic">"{data.notes}"</p>
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
                      <defs>
                        <linearGradient id="brixGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9333ea" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="phGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="acidityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey="shortDate"
                        stroke="#6b7280"
                        style={{ fontSize: '12px', fontWeight: 500 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fill: '#374151' }}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="#9333ea"
                        style={{ fontSize: '12px', fontWeight: 600 }}
                        domain={[0, 30]}
                        label={{ value: 'Brix', angle: -90, position: 'insideLeft', style: { fill: '#9333ea', fontWeight: 700 } }}
                        tick={{ fill: '#9333ea' }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#06b6d4"
                        style={{ fontSize: '12px', fontWeight: 600 }}
                        domain={[0, 12]}
                        label={{ value: 'pH / Acidity (g/L)', angle: 90, position: 'insideRight', style: { fill: '#06b6d4', fontWeight: 700 } }}
                        tick={{ fill: '#06b6d4' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                        formatter={(value) => <span className="text-sm font-semibold">{value}</span>}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="brix"
                        stroke="#9333ea"
                        strokeWidth={3}
                        dot={{ fill: '#9333ea', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                        name="Brix (Sugar)"
                        connectNulls
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ph"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        dot={{ fill: '#06b6d4', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                        name="pH Level"
                        connectNulls
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="acidity"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                        strokeDasharray="5 5"
                        name="Acidity (TA g/L)"
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>

          {/* Vegetation Vigor / NDVI Trends */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Vegetation Vigor Trends
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Satellite-based vegetation health from Sentinel-2 (10m resolution)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedBlockForNdvi}
                    onChange={(e) => setSelectedBlockForNdvi(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    disabled={loadingNdvi}
                  >
                    <option value="all">All Fields (Average)</option>
                    {blocks.filter(b => b.geom).map(block => (
                      <option key={block.id} value={block.id}>{block.name}</option>
                    ))}
                  </select>
                  {!loadingNdvi && (
                    <button
                      onClick={loadNdviData}
                      className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                    >
                      {ndviData.length > 0 ? 'Refresh Data' : 'Load Satellite Data'}
                    </button>
                  )}
                </div>
              </div>

              {loadingNdvi ? (
                <div className="flex items-center justify-center h-80 text-gray-400">
                  <div className="text-center max-w-md">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                    <p className="text-sm font-medium text-gray-900">Loading NDVI data from satellite...</p>
                    {ndviProgress.total > 0 && (
                      <>
                        <p className="text-xs mt-2 text-gray-600">
                          Processing <span className="font-semibold">{ndviProgress.field}</span> - {ndviProgress.month} {selectedYear}
                        </p>
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(ndviProgress.current / ndviProgress.total) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs mt-2 text-gray-500">
                          {ndviProgress.current} of {ndviProgress.total} months complete ({Math.round((ndviProgress.current / ndviProgress.total) * 100)}%)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : !isSentinelHubConfigured() ? (
                <div className="flex items-center justify-center h-80 text-gray-400">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Sentinel Hub not configured</p>
                    <p className="text-xs mt-1 text-gray-500">
                      Configure Sentinel Hub API credentials to view NDVI data
                    </p>
                  </div>
                </div>
              ) : blocks.filter(b => b.geom).length === 0 ? (
                <div className="flex items-center justify-center h-80 text-gray-400">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No field boundaries defined</p>
                    <p className="text-xs mt-1 text-gray-500">
                      Add field boundaries on the map to analyze vegetation vigor
                    </p>
                  </div>
                </div>
              ) : ndviData.length === 0 ? (
                <div className="flex items-center justify-center h-80 text-gray-400">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Ready to load satellite data</p>
                    <p className="text-xs mt-1 text-gray-500 max-w-md">
                      Click "Load Satellite Data" above to fetch NDVI imagery from Sentinel-2.
                      This will retrieve monthly vegetation health data for all fields during the {selectedYear} growing season.
                    </p>
                    <p className="text-xs mt-2 text-amber-600 font-medium">
                      Note: This may take 1-2 minutes as it fetches data for each field and month.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={(() => {
                      // Prepare monthly data for selected block or average across all blocks
                      let chartData = [];

                      if (selectedBlockForNdvi === 'all') {
                        // Calculate average NDVI across all blocks for each month
                        const allMonths = ndviData[0]?.monthlyData || [];
                        chartData = allMonths.map((monthData, idx) => {
                          const monthNdviValues = ndviData
                            .map(block => block.monthlyData[idx]?.meanNDVI)
                            .filter(val => val !== null && val !== undefined);

                          const avgNdvi = monthNdviValues.length > 0
                            ? monthNdviValues.reduce((sum, val) => sum + val, 0) / monthNdviValues.length
                            : null;

                          return {
                            monthName: monthData.monthName,
                            ndvi: avgNdvi
                          };
                        });
                      } else {
                        // Show data for selected block
                        const selectedBlock = ndviData.find(b => b.blockId === selectedBlockForNdvi);
                        chartData = selectedBlock?.monthlyData.map(m => ({
                          monthName: m.monthName,
                          ndvi: m.meanNDVI
                        })) || [];
                      }

                      return chartData;
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="monthName" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        domain={[0, 1]}
                        label={{ value: 'NDVI', angle: -90, position: 'insideLeft', style: { fill: '#059669', fontWeight: 700 } }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value) => {
                          if (value === null) return ['No data', 'NDVI'];
                          return [value.toFixed(3), 'NDVI'];
                        }}
                        labelFormatter={(label) => `${label} ${selectedYear}`}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="ndvi"
                        fill="url(#ndviGradient)"
                        stroke="#22c55e"
                        strokeWidth={2}
                        name="Vegetation Vigor (NDVI)"
                        connectNulls
                      />
                      <defs>
                        <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* NDVI Info Card */}
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Sprout className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-green-900 mb-2">NDVI Interpretation</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                            <div className="text-xs text-green-800">
                              <div className="font-semibold">Low (&lt;0.3)</div>
                              <div className="text-green-700">Stress/Bare soil</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f97316' }}></div>
                            <div className="text-xs text-green-800">
                              <div className="font-semibold">Med-Low (0.3-0.5)</div>
                              <div className="text-green-700">Moderate growth</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }}></div>
                            <div className="text-xs text-green-800">
                              <div className="font-semibold">Medium (0.5-0.65)</div>
                              <div className="text-green-700">Good health</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#84cc16' }}></div>
                            <div className="text-xs text-green-800">
                              <div className="font-semibold">Med-High (0.65-0.75)</div>
                              <div className="text-green-700">Very healthy</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
                            <div className="text-xs text-green-800">
                              <div className="font-semibold">High (&gt;0.75)</div>
                              <div className="text-green-700">Peak vigor</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Water Usage Trends */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-cyan-600" />
                  Water & Irrigation Trends
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={(() => {
                  // Only show data up to current month if viewing current year
                  const now = new Date();
                  const currentMonth = now.getMonth();
                  const currentYear = now.getFullYear();

                  if (selectedYear === currentYear && (timeframe === 'ytd' || timeframe === 'year')) {
                    // Filter to only show months up to current month
                    return analytics.monthlyData.filter(d => d.month <= currentMonth);
                  }

                  return analytics.monthlyData;
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="monthName" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => `${value.toLocaleString()} gal`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="waterUsage"
                    fill="url(#waterGradient)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    name="Water Applied (gal)"
                  />
                  <defs>
                    <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Yield Production Trends */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-600" />
                  Yield Production
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.monthlyData.filter(m => m.yield > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="monthName" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => `${value.toFixed(1)} tons`}
                  />
                  <Bar dataKey="yield" fill="url(#yieldGradient)" radius={[8, 8, 0, 0]} name="Yield (tons)" />
                  <defs>
                    <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Field Comparison */}
          {analytics.blockQualityData.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    Field Performance Comparison
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={analytics.blockQualityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="left" stroke="#9333ea" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="brix" fill="#9333ea" name="Brix" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="ph" fill="#06b6d4" name="pH" radius={[4, 4, 0, 0]} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="yieldPerAcre"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 6 }}
                      name="Yield per Acre"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Cost Analysis Tab */}
      {activeTab === 'cost' && (
        <>
          {/* Key Financial Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <MetricCard
              icon={DollarSign}
              label="Total Costs"
              value={`$${(analytics.totalCosts / 1000).toFixed(1)}k`}
              subtext={`Operating expenses for ${timeframe}`}
              color="red"
              gradient={true}
            />
            <MetricCard
              icon={Users}
              label="Labor Costs"
              value={`$${(analytics.totalLaborCost / 1000).toFixed(1)}k`}
              subtext={`${((analytics.totalLaborCost / analytics.totalCosts) * 100).toFixed(0)}% of total`}
              color="blue"
            />
            <MetricCard
              icon={Package}
              label="Material Costs"
              value={`$${(analytics.materialCosts / 1000).toFixed(1)}k`}
              subtext={`Supplies & inventory`}
              color="amber"
            />
            <MetricCard
              icon={LineChartIcon}
              label="Cost per Ton"
              value={analytics.costPerTon > 0 ? `$${analytics.costPerTon.toFixed(0)}` : 'N/A'}
              subtext="Production efficiency"
              color="purple"
            />
            <MetricCard
              icon={Target}
              label="Profit Margin"
              value={analytics.profitMargin > 0 ? `${analytics.profitMargin.toFixed(1)}%` : 'N/A'}
              subtext={analytics.estimatedRevenue > 0 ? `$${(analytics.estimatedRevenue / 1000).toFixed(1)}k revenue` : 'Add pricing data'}
              color="teal"
            />
          </div>

          {/* Cost Trends Over Time */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <LineChartIcon className="w-5 h-5 text-teal-600" />
                  Cost Trends Over Time
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="monthName" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="totalCost"
                    fill="url(#costGradient)"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    name="Total Operating Cost"
                  />
                  <Line
                    type="monotone"
                    dataKey="laborCost"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    name="Labor"
                  />
                  <Line
                    type="monotone"
                    dataKey="materialCost"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 4 }}
                    name="Materials"
                  />
                  <defs>
                    <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-teal-600" />
              Operating Cost Breakdown
            </h3>
          </div>
          <div className="space-y-4">
            {Object.entries(analytics.costBreakdown)
              .filter(([, amount]) => amount > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = analytics.totalCosts > 0 ? (amount / analytics.totalCosts) * 100 : 0;
                const colors = {
                  labor: 'from-blue-500 via-blue-600 to-blue-700',
                  materials: 'from-amber-500 via-amber-600 to-amber-700',
                  irrigation: 'from-cyan-500 via-cyan-600 to-cyan-700',
                  chemicals: 'from-red-500 via-red-600 to-red-700'
                };
                const icons = {
                  labor: '👥',
                  materials: '📦',
                  irrigation: '💧',
                  chemicals: '🧪'
                };

                return (
                  <div key={category} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700 capitalize flex items-center gap-2">
                        <span className="text-lg">{icons[category]}</span>
                        {category}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-xs text-gray-500 w-14 text-right font-medium">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[category] || 'from-teal-500 to-emerald-500'} rounded-full transition-all duration-700 group-hover:shadow-lg`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">Total Operating Costs</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  ${analytics.totalCosts.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
