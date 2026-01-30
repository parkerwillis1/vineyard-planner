import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, BarChart3, Activity, Calendar, Wine, Package, Grape, Droplet, Clock, Target
} from 'lucide-react';
import { listLots, getProductionDashboardData } from '@/shared/lib/productionApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Analytics() {
  const [lots, setLots] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotsResult, dashResult] = await Promise.all([
        listLots(),
        getProductionDashboardData()
      ]);

      if (!lotsResult.error) setLots(lotsResult.data || []);
      if (!dashResult.error) setDashboardData(dashResult.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate vintage breakdown
  const getVintageData = () => {
    const vintageMap = {};
    lots.forEach(lot => {
      vintageMap[lot.vintage] = (vintageMap[lot.vintage] || 0) + (lot.current_volume_gallons || 0);
    });
    return Object.entries(vintageMap).map(([vintage, volume]) => ({
      vintage,
      volume: Math.round(volume)
    })).sort((a, b) => b.vintage - a.vintage);
  };

  // Calculate varietal breakdown
  const getVarietalData = () => {
    const varietalMap = {};
    lots.forEach(lot => {
      const varietal = lot.varietal || 'Unknown';
      varietalMap[varietal] = (varietalMap[varietal] || 0) + (lot.current_volume_gallons || 0);
    });
    return Object.entries(varietalMap).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));
  };

  // Calculate production trends by month
  const getProductionTrends = () => {
    const monthMap = {};
    lots.forEach(lot => {
      if (lot.harvest_date) {
        const month = new Date(lot.harvest_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap[month] = (monthMap[month] || 0) + (lot.current_volume_gallons || 0);
      }
    });
    return Object.entries(monthMap).map(([month, volume]) => ({
      month,
      volume: Math.round(volume)
    }));
  };

  // Calculate status distribution
  const getStatusData = () => {
    const statusMap = {};
    lots.forEach(lot => {
      statusMap[lot.status] = (statusMap[lot.status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7C203A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const vintageData = getVintageData();
  const varietalData = getVarietalData();
  const productionTrends = getProductionTrends();
  const statusData = getStatusData();

  // Calculate useful metrics
  const avgVolumePerLot = lots.length > 0 ? (dashboardData?.totalVolume || 0) / lots.length : 0;
  const fermentingLots = lots.filter(l => l.status === 'fermenting');
  const agingLots = lots.filter(l => l.status === 'aging');
  const topVarietal = varietalData.sort((a, b) => b.value - a.value)[0];

  // Capacity metrics
  const totalCapacity = dashboardData?.totalCapacity || 0;
  const utilizationPct = totalCapacity > 0 ? ((dashboardData?.totalVolume || 0) / totalCapacity) * 100 : 0;
  const availableCapacity = totalCapacity - (dashboardData?.totalVolume || 0);

  // Fermentation metrics
  const avgFermentationDays = fermentingLots.length > 0
    ? fermentingLots.reduce((sum, lot) => {
        if (!lot.harvest_date) return sum;
        const days = Math.floor((new Date() - new Date(lot.harvest_date)) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / fermentingLots.length
    : 0;

  // Volume loss tracking
  const lotsWithInitialVolume = lots.filter(l => l.initial_volume_gallons && l.current_volume_gallons);
  const totalVolumeLoss = lotsWithInitialVolume.reduce((sum, lot) => {
    return sum + (lot.initial_volume_gallons - lot.current_volume_gallons);
  }, 0);
  const avgLossPercent = lotsWithInitialVolume.length > 0
    ? (totalVolumeLoss / lotsWithInitialVolume.reduce((sum, l) => sum + l.initial_volume_gallons, 0)) * 100
    : 0;

  // Production velocity - lots created per month
  const monthlyProduction = {};
  lots.forEach(lot => {
    if (lot.created_at) {
      const month = new Date(lot.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyProduction[month] = (monthlyProduction[month] || 0) + 1;
    }
  });
  const productionVelocity = Object.entries(monthlyProduction)
    .map(([month, count]) => ({ month, count }))
    .slice(-6); // Last 6 months

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Production Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Key insights and production trends</p>
      </div>

      {/* Key Metrics Row 1 - Capacity & Volume */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Wine className="w-5 h-5 text-[#7C203A]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Volume</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">
            {(dashboardData?.totalVolume || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-gray-500">
            gallons ({((dashboardData?.totalVolume || 0) / 60).toFixed(1)} barrels)
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-5 h-5 text-[#7C203A]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Capacity Used</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">
            {utilizationPct.toFixed(0)}<span className="text-2xl text-gray-500">%</span>
          </p>
          <p className="text-sm text-gray-500">
            {availableCapacity.toLocaleString()} gal available
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Droplet className="w-5 h-5 text-[#7C203A]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Volume Loss</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">
            {avgLossPercent.toFixed(1)}<span className="text-2xl text-gray-500">%</span>
          </p>
          <p className="text-sm text-gray-500">
            {totalVolumeLoss.toFixed(0)} gal lost
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-5 h-5 text-[#7C203A]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg Ferm Time</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">
            {avgFermentationDays.toFixed(0)}
          </p>
          <p className="text-sm text-gray-500">
            days ({fermentingLots.length} lots)
          </p>
        </div>
      </div>

      {/* Key Metrics Row 2 - Production Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-5 h-5 text-[#7C203A]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg Lot Size</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">
            {avgVolumePerLot.toFixed(0)}
          </p>
          <p className="text-sm text-gray-500">gallons per lot</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-5 h-5 text-[#7C203A]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active Lots</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">{lots.length}</p>
          <p className="text-sm text-gray-500">
            {fermentingLots.length} fermenting • {agingLots.length} aging
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Grape className="w-5 h-5 text-[#7C203A]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Top Varietal</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{topVarietal?.name || '—'}</p>
          <p className="text-sm text-gray-500">
            {topVarietal ? `${topVarietal.value.toLocaleString()} gallons` : 'No data'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-5 h-5 text-[#7C203A]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Vintages</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">{vintageData.length}</p>
          <p className="text-sm text-gray-500">active years</p>
        </div>
      </div>

      {/* Vintage Breakdown - Useful Comparison */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-[#7C203A]" />
          <h2 className="text-lg font-bold text-gray-900">Volume by Vintage</h2>
        </div>

        {vintageData.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No vintage data available</p>
        ) : (
          <div className="space-y-3">
            {vintageData.map((vintage, index) => {
              const isTopVintage = index === 0;
              const totalVolume = vintageData.reduce((sum, v) => sum + v.volume, 0);
              const percentage = (vintage.volume / totalVolume) * 100;

              return (
                <div key={vintage.vintage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${isTopVintage ? 'text-gray-900' : 'text-gray-600'}`}>
                        {vintage.vintage}
                      </span>
                      {isTopVintage && (
                        <span className="text-xs px-2 py-0.5 bg-[#7C203A] text-white rounded-full">Largest</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{vintage.volume.toLocaleString()} gal</span>
                      <span className="text-xs text-gray-400 ml-2">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[#404E63] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Varietal Breakdown - Clean List */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Grape className="w-5 h-5 text-[#7C203A]" />
          <h2 className="text-lg font-bold text-gray-900">Varietal Distribution</h2>
        </div>

        {varietalData.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No varietal data available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {varietalData
              .sort((a, b) => b.value - a.value)
              .map((varietal, index) => {
                const totalVolume = varietalData.reduce((sum, v) => sum + v.value, 0);
                const percentage = (varietal.value / totalVolume) * 100;

                return (
                  <div key={varietal.name} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{varietal.name}</h3>
                      {index === 0 && (
                        <span className="text-xs px-2 py-0.5 bg-[#7C203A] text-white rounded-full">Top</span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {varietal.value.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">{percentage.toFixed(1)}% of total volume</p>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume by Vintage Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-[#7C203A]" />
            <h2 className="text-lg font-bold text-gray-900">Volume by Vintage</h2>
          </div>

          {vintageData.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No data to compare</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vintageData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis
                    dataKey="vintage"
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      padding: '10px 14px'
                    }}
                    formatter={(value) => [`${value.toLocaleString()} gallons`, 'Volume']}
                  />
                  <Bar
                    dataKey="volume"
                    fill="#404E63"
                    radius={[4, 4, 4, 4]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Production Velocity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-[#7C203A]" />
            <h2 className="text-lg font-bold text-gray-900">Production Velocity</h2>
          </div>

          {productionVelocity.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No data available</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionVelocity} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      padding: '10px 14px'
                    }}
                    formatter={(value) => [`${value} lots`, 'Created']}
                  />
                  <Bar
                    dataKey="count"
                    fill="#404E63"
                    radius={[4, 4, 4, 4]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Fermentation Performance */}
      {fermentingLots.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-[#7C203A]" />
            <h2 className="text-lg font-bold text-gray-900">Active Fermentations</h2>
          </div>

          <div className="space-y-3">
            {fermentingLots.slice(0, 8).map(lot => {
              const daysFermenting = lot.harvest_date
                ? Math.floor((new Date() - new Date(lot.harvest_date)) / (1000 * 60 * 60 * 24))
                : 0;
              const progressPct = lot.current_brix ? Math.max(0, 100 - (lot.current_brix / 24) * 100) : 0;

              return (
                <div key={lot.id} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{lot.name}</h3>
                      <p className="text-sm text-gray-500">{lot.varietal} • {lot.vintage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{daysFermenting} days</p>
                      <p className="text-xs text-gray-400">{lot.current_brix?.toFixed(1) || '—'}° Brix</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>{progressPct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-[#7C203A] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
