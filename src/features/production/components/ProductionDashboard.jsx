import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductionDashboardData, getActiveFermentations } from '@/shared/lib/productionApi';
import {
  Wine,
  Droplet,
  Package,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  BarChart3,
  FlaskConical,
  Barrel,
  Grape,
  Clock,
  Thermometer,
  Activity,
  Warehouse,
  Layers,
  AlertCircle,
  Filter
} from 'lucide-react';

export function ProductionDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [activeFermentations, setActiveFermentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const [dashData, fermentData] = await Promise.all([
        getProductionDashboardData(),
        getActiveFermentations()
      ]);

      if (dashData.error) throw dashData.error;
      if (fermentData.error) throw fermentData.error;

      setDashboardData(dashData.data);
      setActiveFermentations(fermentData.data || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading cellar data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-md">
        <div className="flex items-center gap-3 text-red-800">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-semibold">Error loading dashboard</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalLots = dashboardData?.totalLots || 0;
  const totalVolume = dashboardData?.totalVolume || 0;
  const totalCapacity = dashboardData?.totalCapacity || 0;
  const emptyContainers = dashboardData?.emptyContainers || 0;
  const utilizationPct = totalCapacity > 0 ? ((totalVolume / totalCapacity) * 100) : 0;

  const lotsByStatus = dashboardData?.lotsByStatus || {};

  const statusConfig = {
    planning: { label: 'Planning', gradient: 'from-slate-100 to-slate-200', text: 'slate-700', icon: Clock },
    harvested: { label: 'Harvested', gradient: 'from-yellow-100 to-yellow-200', text: 'yellow-700', icon: Grape },
    crushing: { label: 'Crushing', gradient: 'from-orange-100 to-orange-200', text: 'orange-700', icon: Activity },
    fermenting: { label: 'Fermenting', gradient: 'from-fuchsia-100 to-purple-200', text: 'purple-700', icon: Sparkles },
    pressed: { label: 'Pressed', gradient: 'from-blue-100 to-blue-200', text: 'blue-700', icon: Droplet },
    aging: { label: 'Aging', gradient: 'from-amber-100 to-amber-200', text: 'amber-700', icon: Warehouse },
    blending: { label: 'Blending', gradient: 'from-pink-100 to-rose-200', text: 'rose-700', icon: Layers },
    filtering: { label: 'Filtering', gradient: 'from-cyan-100 to-teal-200', text: 'cyan-700', icon: Filter },
    bottled: { label: 'Bottled', gradient: 'from-emerald-100 to-green-200', text: 'emerald-700', icon: Wine }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-900 via-purple-900 to-amber-900 bg-clip-text text-transparent">
          Cellar Dashboard
        </h1>
        <p className="text-gray-600 mt-1">Production overview and active operations</p>
      </div>

      {/* Summary Stats - Clean, Professional */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Lots */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-[#7C203A] rounded-lg flex items-center justify-center">
              <Wine className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total Lots</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalLots}</p>
          <p className="text-xs text-gray-500 mt-1">Active production lots</p>
        </div>

        {/* Total Volume */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-[#7C203A] rounded-lg flex items-center justify-center">
              <Droplet className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total Volume</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-lg text-gray-500 ml-1">gal</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {(totalVolume / 60).toFixed(1)} barrels equivalent
          </p>
        </div>

        {/* Container Utilization */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-[#7C203A] rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">Utilization</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {utilizationPct.toFixed(0)}<span className="text-lg text-gray-500">%</span>
          </p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#7C203A] h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(utilizationPct, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{emptyContainers} vessels empty</p>
          </div>
        </div>

        {/* Active Fermentations Count */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-[#7C203A] rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">Fermenting</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeFermentations.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active fermentations</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lots by Status - 2 cols */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#7C203A] rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Production Pipeline</h2>
          </div>

          {totalLots === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wine className="w-8 h-8 text-[#7C203A]" />
              </div>
              <p className="text-gray-500 mb-4">No active lots in production</p>
              <button
                onClick={() => navigate('/production?view=harvest')}
                className="px-6 py-2.5 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm font-medium"
              >
                Create Harvest Intake
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(statusConfig).map(([status, config]) => {
                const count = lotsByStatus[status] || 0;
                if (count === 0) return null;

                const StatusIcon = config.icon;
                return (
                  <div
                    key={status}
                    className={`bg-gradient-to-br ${config.gradient} p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => navigate(`/production?view=dashboard&filter=${status}`)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon className={`w-4 h-4 text-${config.text}`} />
                      <span className={`text-xs font-semibold text-${config.text} uppercase tracking-wide`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {count === 1 ? 'lot' : 'lots'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions - 1 col */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#7C203A] rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => navigate('/production?view=harvest')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors group"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-[#7C203A] transition-colors">
                <Grape className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 text-sm">New Harvest</p>
                <p className="text-xs text-gray-500">Record incoming fruit</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/production?view=fermentation')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors group"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-[#7C203A] transition-colors">
                <Sparkles className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 text-sm">Log Fermentation</p>
                <p className="text-xs text-gray-500">Update daily readings</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/production?view=containers')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors group"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-[#7C203A] transition-colors">
                <Barrel className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 text-sm">Manage Vessels</p>
                <p className="text-xs text-gray-500">Tanks, barrels, totes</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/production?view=lab')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors group"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-[#7C203A] transition-colors">
                <FlaskConical className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 text-sm">Lab Work</p>
                <p className="text-xs text-gray-500">Chemistry & analysis</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Active Fermentations Table */}
      {activeFermentations.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#7C203A] rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Active Fermentations</h2>
            </div>
            <button
              onClick={() => navigate('/production?view=fermentation')}
              className="text-sm text-[#7C203A] hover:text-[#8B2E48] font-medium"
            >
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Lot Name</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Varietal</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-gray-700">Days</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-gray-700">Brix</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-gray-700">Temp</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">Volume</th>
                </tr>
              </thead>
              <tbody>
                {activeFermentations.slice(0, 5).map((lot) => {
                  const daysFermenting = lot.harvest_date
                    ? Math.floor((new Date() - new Date(lot.harvest_date)) / (1000 * 60 * 60 * 24))
                    : 0;

                  return (
                    <tr
                      key={lot.id}
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-fuchsia-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/production?view=fermentation&lot=${lot.id}`)}
                    >
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-900">{lot.name}</p>
                        <p className="text-xs text-gray-500">{lot.vintage}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">{lot.varietal}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          <Clock className="w-3 h-3" />
                          {daysFermenting}d
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-gray-900">
                          {lot.current_brix?.toFixed(1) || '—'}°
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                          <Thermometer className="w-3 h-3" />
                          {lot.current_temp_f?.toFixed(0) || '—'}°F
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium text-gray-900">
                        {lot.current_volume_gallons?.toLocaleString() || '—'} gal
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
