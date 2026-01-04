import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProductionDashboardData,
  getActiveFermentations,
  getAlertHistory,
  listSensors,
  getLatestReading,
  listFermentationLogs,
  getLotsByVintage,
  syncAllParentLotStatuses,
  listBlends
} from '@/shared/lib/productionApi';
import { IconLabelHeading, IconLabelButton } from '@/shared/components/ui/IconLabel';
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
  Filter,
  CheckCircle,
  Calendar,
  Bell,
  TrendingDown,
  Beaker,
  Target,
  PieChart
} from 'lucide-react';

export function ProductionDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [activeFermentations, setActiveFermentations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sensorAlerts, setSensorAlerts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [vintageComparison, setVintageComparison] = useState(null);
  const [blends, setBlends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to format relative time
  function getRelativeTime(timestamp) {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      // First, sync parent lot statuses to match their children
      await syncAllParentLotStatuses();

      // Fetch all dashboard data in parallel
      const [
        dashData,
        fermentData,
        alertData,
        sensorsData,
        previousYearData,
        blendsData
      ] = await Promise.all([
        getProductionDashboardData(),
        getActiveFermentations(),
        getAlertHistory({ acknowledged: false }),
        listSensors({ status: 'active' }),
        getLotsByVintage(new Date().getFullYear() - 1),
        listBlends()
      ]);

      if (dashData.error) throw dashData.error;
      if (fermentData.error) throw fermentData.error;

      setDashboardData(dashData.data);
      setActiveFermentations(fermentData.data || []);
      setAlerts(alertData.data || []);
      setBlends(blendsData.data || []);

      // Get latest readings for active sensors
      const sensorsWithReadings = await Promise.all(
        (sensorsData.data || []).slice(0, 10).map(async (sensor) => {
          const { data: reading } = await getLatestReading(sensor.id);
          return { ...sensor, latestReading: reading };
        })
      );

      // Build sensor alerts from sensors with recent readings
      const sensorAlertsList = sensorsWithReadings
        .filter(s => s.last_reading_at)
        .map(sensor => {
          const temp = sensor.last_reading_temp_f;
          const minTemp = 68; // Could come from alert rules
          const maxTemp = 75;

          let status = 'normal';
          if (temp > maxTemp + 5) status = 'critical';
          else if (temp > maxTemp || temp < minTemp) status = 'warning';

          return {
            id: sensor.id,
            sensor: sensor.name,
            temp: `${temp?.toFixed(0)}°F`,
            target: `${minTemp}-${maxTemp}°F`,
            status,
            time: getRelativeTime(sensor.last_reading_at)
          };
        });

      setSensorAlerts(sensorAlertsList);

      // Build recent activity from fermentation logs
      const activityList = [];
      for (const lot of (fermentData.data || []).slice(0, 5)) {
        const { data: logs } = await listFermentationLogs(lot.id);
        if (logs && logs.length > 0) {
          const recentLog = logs[0];
          activityList.push({
            id: recentLog.id,
            type: 'fermentation',
            description: `${lot.name} - Temp ${recentLog.temp_f}°F, Brix ${recentLog.brix}°`,
            time: getRelativeTime(recentLog.log_date),
            user: 'Cellar Team'
          });
        }
      }
      setRecentActivity(activityList);

      // Build vintage comparison
      const currentYear = new Date().getFullYear();
      const currentVolume = dashData.data?.totalVolume || 0;
      const currentLots = dashData.data?.totalLots || 0;

      const previousYearVolume = (previousYearData.data || [])
        .reduce((sum, lot) => sum + (lot.current_volume_gallons || 0), 0);
      const previousYearLots = (previousYearData.data || []).length;

      setVintageComparison({
        current: { year: currentYear, volume: currentVolume, lots: currentLots },
        previous: { year: currentYear - 1, volume: previousYearVolume, lots: previousYearLots },
        change: {
          volume: previousYearVolume > 0
            ? (((currentVolume - previousYearVolume) / previousYearVolume) * 100).toFixed(1)
            : '0.0',
          lots: currentLots - previousYearLots
        }
      });

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

  // Build critical alerts from alert history and sensor alerts
  const criticalAlerts = [
    ...alerts.filter(a => a.severity === 'critical').map(a => ({
      id: a.id,
      type: a.alert_type,
      severity: a.severity,
      message: a.message,
      time: getRelativeTime(a.created_at),
      vessel: a.sensor?.name || 'Unknown'
    })),
    ...sensorAlerts.filter(s => s.status === 'critical').map(s => ({
      id: `sensor-${s.id}`,
      type: 'temperature',
      severity: 'critical',
      message: `${s.sensor} - Temperature ${s.temp} (too high)`,
      time: s.time,
      vessel: s.sensor
    }))
  ].slice(0, 3);

  // Mock data for tasks and lab tests (no tables for these yet)
  const tasksDue = [];
  const labTestsDue = [];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Cellar Dashboard
        </h1>
        <p className="text-gray-500">Production overview and active operations</p>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.filter(a => a.severity === 'critical').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-base font-bold text-red-900 mb-3">Critical Alerts Require Attention</h3>
              <div className="space-y-2">
                {criticalAlerts.filter(a => a.severity === 'critical').map(alert => (
                  <div key={alert.id} className="flex items-center justify-between text-sm bg-white/50 rounded-lg p-3">
                    <span className="text-red-800 font-medium">{alert.message}</span>
                    <span className="text-red-600 text-xs font-medium">{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats Grid - Minimal & Clean */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lots */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <Wine className="w-5 h-5 text-[#7C203A]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lots</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">{totalLots}</p>
          <p className="text-sm text-gray-500">Active in production</p>
        </div>

        {/* Total Volume */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <Droplet className="w-5 h-5 text-[#7C203A]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Volume</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">
            {totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-gray-500">
            gallons ({(totalVolume / 60).toFixed(1)} barrels)
          </p>
        </div>

        {/* Container Utilization */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-5 h-5 text-[#7C203A]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Capacity</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">
            {utilizationPct.toFixed(0)}<span className="text-2xl text-gray-500">%</span>
          </p>
          <div className="space-y-2">
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-[#7C203A] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(utilizationPct, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{emptyContainers} vessels empty</p>
          </div>
        </div>

        {/* Active Fermentations Count */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <Sparkles className="w-5 h-5 text-[#7C203A]" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Fermenting</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">{activeFermentations.length}</p>
          <p className="text-sm text-gray-500">Active now</p>
        </div>
      </div>

      {/* Alerts & Activity Row - Consolidated */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Alerts & Issues */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <Thermometer className="w-5 h-5 text-[#7C203A]" />
            <h2 className="text-lg font-bold text-gray-900">Temperature Monitoring</h2>
          </div>
          {sensorAlerts.length === 0 ? (
            <div className="text-center py-12">
              <Thermometer className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-2">No sensors configured</p>
              <button
                onClick={() => navigate('/production?view=sensors')}
                className="text-sm text-[#7C203A] hover:text-[#8B2E48] font-medium"
              >
                Add Sensors →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sensorAlerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{alert.sensor}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {alert.temp} <span className="text-gray-400">• Target: {alert.target}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{alert.time}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      alert.status === 'critical' ? 'bg-red-500' :
                      alert.status === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <Activity className="w-5 h-5 text-[#7C203A]" />
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-1.5 h-1.5 bg-[#7C203A] rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{activity.time}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500">{activity.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Production Pipeline - Full Width, Prominent */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-[#7C203A]" />
            <h2 className="text-2xl font-bold text-gray-900">Production Pipeline</h2>
          </div>
          {totalLots > 0 && (
            <span className="text-sm text-gray-400">{totalLots} total lots</span>
          )}
        </div>

        {totalLots === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wine className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 mb-6">No active lots in production</p>
            <button
              onClick={() => navigate('/production?view=harvest')}
              className="px-6 py-3 bg-[#7C203A] text-white rounded-xl hover:bg-[#8B2E48] transition-colors font-medium"
            >
              Create Harvest Intake
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = lotsByStatus[status] || 0;
              if (count === 0) return null;

              const StatusIcon = config.icon;
              return (
                <div
                  key={status}
                  className="group bg-white p-5 rounded-xl border border-gray-100 hover:border-[#7C203A] hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/production?view=dashboard&filter=${status}`)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <StatusIcon className={`w-4 h-4 text-gray-400 group-hover:text-[#7C203A] transition-colors`} />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide group-hover:text-[#7C203A] transition-colors">
                      {config.label}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{count}</p>
                  <p className="text-xs text-gray-400">
                    {count === 1 ? 'lot' : 'lots'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions - Minimal, Bottom of Page */}
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => navigate('/production?view=harvest')}
            className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all text-left"
          >
            <Grape className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">New Harvest</span>
          </button>

          <button
            onClick={() => navigate('/production?view=fermentation')}
            className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all text-left"
          >
            <Sparkles className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Log Fermentation</span>
          </button>

          <button
            onClick={() => navigate('/production?view=containers')}
            className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all text-left"
          >
            <Barrel className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Manage Vessels</span>
          </button>

          <button
            onClick={() => navigate('/production?view=lab')}
            className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all text-left"
          >
            <FlaskConical className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Lab Work</span>
          </button>

          <button
            onClick={() => navigate('/production?view=blending')}
            className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all text-left"
          >
            <Layers className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Create Blend</span>
          </button>
        </div>
      </div>

      {/* Blend Overview Widget - Cleaner */}
      {blends.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-[#7C203A]" />
              <h2 className="text-lg font-bold text-gray-900">Active Blends</h2>
              <span className="text-sm text-gray-400">({blends.length})</span>
            </div>
            <button
              onClick={() => navigate('/production?view=blending')}
              className="text-sm text-[#7C203A] hover:text-[#8B2E48] font-medium"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blends.slice(0, 6).map(blend => {
              const componentCount = blend.blend_components?.length || 0;
              const totalVolume = blend.current_volume_gallons || 0;

              return (
                <div
                  key={blend.id}
                  onClick={() => navigate('/production?view=blending')}
                  className="bg-white p-4 rounded-xl border border-gray-100 hover:border-[#7C203A] hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate mb-1">{blend.name}</p>
                      <p className="text-xs text-gray-400">{blend.varietal} • {blend.vintage}</p>
                    </div>
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium whitespace-nowrap">
                      {componentCount} lots
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">Volume:</span>
                      <span className="text-gray-900 font-semibold ml-1">{totalVolume.toFixed(0)} gal</span>
                    </div>
                    {blend.current_ph && (
                      <div>
                        <span className="text-gray-400 text-xs">pH:</span>
                        <span className="text-gray-900 font-semibold ml-1">{blend.current_ph.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vintage Comparison - Simplified */}
      {vintageComparison && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-5 h-5 text-[#7C203A]" />
            <h2 className="text-lg font-bold text-gray-900">Vintage Comparison</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {vintageComparison.current.year} (Current)
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {vintageComparison.current.volume.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">gallons • {vintageComparison.current.lots} lots</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {vintageComparison.previous.year} (Previous)
              </p>
              <p className="text-3xl font-bold text-gray-400 mb-1">
                {vintageComparison.previous.volume.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">gallons • {vintageComparison.previous.lots} lots</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-6">
            <div className="flex items-center gap-2">
              {parseFloat(vintageComparison.change.volume) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-xl font-bold ${
                parseFloat(vintageComparison.change.volume) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {vintageComparison.change.volume}%
              </span>
              <span className="text-sm text-gray-500">volume change</span>
            </div>
            <div className="flex items-center gap-2">
              {vintageComparison.change.lots >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-xl font-bold ${
                vintageComparison.change.lots >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {vintageComparison.change.lots > 0 ? '+' : ''}{vintageComparison.change.lots}
              </span>
              <span className="text-sm text-gray-500">lots</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Fermentations Table - Cleaner */}
      {activeFermentations.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#7C203A]" />
              <h2 className="text-lg font-bold text-gray-900">Active Fermentations</h2>
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
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Lot</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Varietal</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Days</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Brix</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Temp</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Volume</th>
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
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/production?view=fermentation&lot=${lot.id}`)}
                    >
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-900 text-sm">{lot.name}</p>
                        <p className="text-xs text-gray-400">{lot.vintage}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">{lot.varietal}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {daysFermenting}d
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {lot.current_brix?.toFixed(1) || '—'}°
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-gray-600">
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
