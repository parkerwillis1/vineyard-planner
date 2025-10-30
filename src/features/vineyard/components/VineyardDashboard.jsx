import React, { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin,
  Droplet,
  ThermometerSun,
  Activity
} from 'lucide-react';

export function VineyardDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAcres: 0,
    totalBlocks: 0,
    pendingTasks: 0,
    overdueTask: 0,
    activeAlerts: 0,
    currentSeasonYield: 0,
    avgBrix: 0,
    recentSprays: 0
  });

  useEffect(() => {
    if (user) {
      // Load data from localStorage
      const blocks = JSON.parse(localStorage.getItem(`vineyard_blocks_${user.id}`) || '[]');
      const tasks = JSON.parse(localStorage.getItem(`vineyard_tasks_${user.id}`) || '[]');
      const harvests = JSON.parse(localStorage.getItem(`vineyard_harvests_${user.id}`) || '[]');
      const sprays = JSON.parse(localStorage.getItem(`vineyard_sprays_${user.id}`) || '[]');

      const totalAcres = blocks.reduce((sum, b) => sum + (parseFloat(b.acreage) || 0), 0);
      const pendingTasks = tasks.filter(t => !t.completed).length;
      const overdueTasks = tasks.filter(t => {
        if (t.completed || !t.dueDate) return false;
        return new Date(t.dueDate) < new Date();
      }).length;

      const currentYear = new Date().getFullYear();
      const currentYearHarvests = harvests.filter(h =>
        new Date(h.harvestDate).getFullYear() === currentYear
      );
      const totalYield = currentYearHarvests.reduce((sum, h) => sum + (parseFloat(h.tons) || 0), 0);
      const avgBrix = currentYearHarvests.length > 0
        ? currentYearHarvests.reduce((sum, h) => sum + (parseFloat(h.brix) || 0), 0) / currentYearHarvests.length
        : 0;

      const recentSprays = sprays.filter(s => {
        const sprayDate = new Date(s.applicationDate);
        const daysAgo = (new Date() - sprayDate) / (1000 * 60 * 60 * 24);
        return daysAgo <= 30;
      }).length;

      const activeAlerts = sprays.filter(s => {
        if (!s.phi || !s.applicationDate) return false;
        const phiDays = parseInt(s.phi);
        const appDate = new Date(s.applicationDate);
        const safeDate = new Date(appDate);
        safeDate.setDate(safeDate.getDate() + phiDays);
        return new Date() < safeDate;
      }).length;

      setStats({
        totalAcres: totalAcres.toFixed(1),
        totalBlocks: blocks.length,
        pendingTasks,
        overdueTasks,
        activeAlerts,
        currentSeasonYield: totalYield.toFixed(1),
        avgBrix: avgBrix.toFixed(1),
        recentSprays
      });
    }
  }, [user]);

  const StatCard = ({ icon: Icon, label, value, change, trend, color = 'blue' }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-${color}-50 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );

  const AlertCard = ({ type, message, severity }) => (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${
      severity === 'high'
        ? 'bg-red-50 border-red-200'
        : severity === 'medium'
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-blue-50 border-blue-200'
    }`}>
      <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
        severity === 'high'
          ? 'text-red-600'
          : severity === 'medium'
          ? 'text-yellow-600'
          : 'text-blue-600'
      }`} />
      <div className="flex-1">
        <div className="font-semibold text-gray-900 text-sm">{type}</div>
        <div className="text-sm text-gray-600 mt-1">{message}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Real-time insights into your vineyard operations</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={MapPin}
          label="Total Acreage"
          value={stats.totalAcres}
          color="green"
        />
        <StatCard
          icon={Activity}
          label="Active Blocks"
          value={stats.totalBlocks}
          color="blue"
        />
        <StatCard
          icon={Calendar}
          label="Pending Tasks"
          value={stats.pendingTasks}
          change={stats.overdueTasks > 0 ? `${stats.overdueTasks} overdue` : null}
          trend={stats.overdueTasks > 0 ? 'down' : null}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Current Season Yield"
          value={`${stats.currentSeasonYield} tons`}
          color="emerald"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <ThermometerSun className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.avgBrix}°</div>
              <div className="text-sm text-gray-600">Average Brix</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <Droplet className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.recentSprays}</div>
              <div className="text-sm text-gray-600">Sprays (Last 30 Days)</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stats.activeAlerts > 0 ? 'bg-red-50' : 'bg-green-50'
            }`}>
              {stats.activeAlerts > 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</div>
              <div className="text-sm text-gray-600">PHI Alerts Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Notifications */}
      {(stats.overdueTasks > 0 || stats.activeAlerts > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Active Alerts & Notifications
          </h3>
          <div className="space-y-3">
            {stats.overdueTasks > 0 && (
              <AlertCard
                type="Overdue Tasks"
                message={`You have ${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''} that need attention.`}
                severity="high"
              />
            )}
            {stats.activeAlerts > 0 && (
              <AlertCard
                type="PHI Restrictions"
                message={`${stats.activeAlerts} block${stats.activeAlerts > 1 ? 's are' : ' is'} currently under Pre-Harvest Interval restrictions.`}
                severity="medium"
              />
            )}
            {stats.pendingTasks > 5 && (
              <AlertCard
                type="High Task Load"
                message={`You have ${stats.pendingTasks} pending tasks. Consider prioritizing or delegating.`}
                severity="low"
              />
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-vine-green-50 to-emerald-50 rounded-xl border border-vine-green-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-white hover:bg-gray-50 rounded-lg p-4 text-center transition-colors border border-gray-200">
            <MapPin className="w-6 h-6 text-vine-green-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Add Block</div>
          </button>
          <button className="bg-white hover:bg-gray-50 rounded-lg p-4 text-center transition-colors border border-gray-200">
            <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Schedule Task</div>
          </button>
          <button className="bg-white hover:bg-gray-50 rounded-lg p-4 text-center transition-colors border border-gray-200">
            <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Log Harvest</div>
          </button>
          <button className="bg-white hover:bg-gray-50 rounded-lg p-4 text-center transition-colors border border-gray-200">
            <Droplet className="w-6 h-6 text-teal-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Record Spray</div>
          </button>
        </div>
      </div>
    </div>
  );
}
