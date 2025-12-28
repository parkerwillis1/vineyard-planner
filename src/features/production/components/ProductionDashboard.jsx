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
  syncAllParentLotStatuses
} from '@/shared/lib/productionApi';
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
        previousYearData
      ] = await Promise.all([
        getProductionDashboardData(),
        getActiveFermentations(),
        getAlertHistory({ acknowledged: false }),
        listSensors({ status: 'active' }),
        getLotsByVintage(new Date().getFullYear() - 1)
      ]);

      if (dashData.error) throw dashData.error;
      if (fermentData.error) throw fermentData.error;

      setDashboardData(dashData.data);
      setActiveFermentations(fermentData.data || []);
      setAlerts(alertData.data || []);

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
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Cellar Dashboard
        </h1>
        <p className="text-gray-600 mt-1">Production overview and active operations</p>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.filter(a => a.severity === 'critical').length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-900 mb-2">Critical Alerts Require Attention</h3>
              <div className="space-y-1">
                {criticalAlerts.filter(a => a.severity === 'critical').map(alert => (
                  <div key={alert.id} className="flex items-center justify-between text-sm">
                    <span className="text-red-800">{alert.message}</span>
                    <span className="text-red-600 text-xs">{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats Grid */}
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

      {/* Three Column Layout - Alerts, Activity, Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Temperature Alerts */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#7C203A] rounded-lg flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Temp Alerts</h2>
          </div>
          {sensorAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Thermometer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No sensor alerts</p>
              <p className="text-xs text-gray-400 mt-1">
                <button
                  onClick={() => navigate('/production?view=sensors')}
                  className="text-[#7C203A] hover:underline"
                >
                  Add sensors
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sensorAlerts.slice(0, 4).map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.status === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : alert.status === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{alert.sensor}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Current: <span className="font-medium">{alert.temp}</span> | Target: {alert.target}
                      </p>
                    </div>
                    <Bell className={`w-4 h-4 ${
                      alert.status === 'critical' ? 'text-red-600' :
                      alert.status === 'warning' ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{alert.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#7C203A] rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No recent activity</p>
              <p className="text-xs text-gray-400 mt-1">Start tracking lots to see activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-2 h-2 bg-[#7C203A] rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.time}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-600">{activity.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks Due */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#7C203A] rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Tasks Due</h2>
          </div>
          {tasksDue.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No tasks due today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasksDue.map(task => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border ${
                    task.priority === 'high'
                      ? 'bg-red-50 border-red-200'
                      : task.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{task.task}</p>
                      <p className="text-xs text-gray-600 mt-1">{task.due}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout - Pipeline & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Pipeline - 2 cols */}
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
        <div className="bg-white px-6 pt-1.5 pb-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Quick Actions</h2>

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

      {/* Two Column - Vintage Comparison & Lab Tests Due */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vintage Overview */}
        {vintageComparison && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#7C203A] rounded-lg flex items-center justify-center">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Vintage Comparison</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-lg border border-purple-100">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Vintage ({vintageComparison.current.year})</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {vintageComparison.current.volume.toLocaleString()} gal
                  </p>
                  <p className="text-sm text-gray-500">{vintageComparison.current.lots} lots</p>
                </div>
                <Wine className="w-12 h-12 text-purple-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-600">Previous Vintage ({vintageComparison.previous.year})</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {vintageComparison.previous.volume.toLocaleString()} gal
                  </p>
                  <p className="text-sm text-gray-500">{vintageComparison.previous.lots} lots</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Year-over-Year Change</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {parseFloat(vintageComparison.change.volume) >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`text-lg font-bold ${
                      parseFloat(vintageComparison.change.volume) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {vintageComparison.change.volume}%
                    </span>
                    <span className="text-sm text-gray-600">volume</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {vintageComparison.change.lots >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`text-lg font-bold ${
                      vintageComparison.change.lots >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {vintageComparison.change.lots > 0 ? '+' : ''}{vintageComparison.change.lots}
                    </span>
                    <span className="text-sm text-gray-600">lots</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lab Tests Due */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#7C203A] rounded-lg flex items-center justify-center">
              <Beaker className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Lab Tests Due</h2>
          </div>

          {labTestsDue.length === 0 ? (
            <div className="text-center py-8">
              <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No lab tests scheduled</p>
              <p className="text-xs text-gray-400 mt-1">Schedule tests in Lab section</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {labTestsDue.map(test => (
                  <div
                    key={test.id}
                    className={`p-4 rounded-lg border ${
                      test.status === 'overdue'
                        ? 'bg-red-50 border-red-200'
                        : test.status === 'upcoming'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{test.lot}</p>
                        <p className="text-sm text-gray-600 mt-1">{test.test}</p>
                        <p className="text-xs text-gray-500 mt-2">Due: {test.due}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        test.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : test.status === 'upcoming'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/production?view=lab')}
                className="w-full mt-4 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors font-medium text-sm"
              >
                View All Lab Work
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active Fermentations Table */}
      {activeFermentations.length > 0 && (
        <div className="bg-white px-6 pt-1.5 pb-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Active Fermentations</h2>
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
