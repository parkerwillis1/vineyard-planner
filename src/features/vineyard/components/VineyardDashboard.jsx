import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin,
  Droplet,
  ThermometerSun,
  Activity,
  Grape,
  Zap,
  Plus,
  TrendingDown,
  CloudRain,
  Wind
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';
import { DocLink } from '@/shared/components/DocLink';
import { LoadingSpinner } from './LoadingSpinner';

export function VineyardDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAcres: 0,
    totalBlocks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    recentIrrigationEvents: 0,
    totalWaterUsed: 0,
    activeDevices: 0,
    currentSeasonYield: 0,
    avgBrix: 0,
    recentSprays: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [waterBalance, setWaterBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Fetch vineyard blocks from Supabase
      const { data: blocks } = await supabase
        .from('vineyard_blocks')
        .select('*')
        .eq('user_id', user.id);

      const totalBlocks = blocks?.length || 0;
      const totalAcres = blocks?.reduce((sum, b) => sum + (parseFloat(b.acres) || 0), 0) || 0;

      // Fetch recent irrigation events (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: irrigationEvents } = await supabase
        .from('irrigation_events')
        .select('*, vineyard_blocks(name)')
        .eq('user_id', user.id)
        .gte('event_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('event_date', { ascending: false })
        .limit(5);

      const recentIrrigationCount = irrigationEvents?.length || 0;
      const totalWater = irrigationEvents?.reduce((sum, e) => sum + (parseFloat(e.total_water_gallons) || 0), 0) || 0;

      // Fetch hardware devices
      const { data: devices } = await supabase
        .from('irrigation_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const activeDevicesCount = devices?.length || 0;

      // Fetch tasks from localStorage (still using localStorage for tasks)
      const tasks = JSON.parse(localStorage.getItem(`vineyard_tasks_${user.id}`) || '[]');
      const pendingTasks = tasks.filter(t => !t.completed).length;
      const overdueTasks = tasks.filter(t => {
        if (t.completed || !t.dueDate) return false;
        return new Date(t.dueDate) < new Date();
      }).length;

      // Fetch harvests from localStorage
      const harvests = JSON.parse(localStorage.getItem(`vineyard_harvests_${user.id}`) || '[]');
      const currentYear = new Date().getFullYear();
      const currentYearHarvests = harvests.filter(h =>
        new Date(h.harvestDate).getFullYear() === currentYear
      );
      const totalYield = currentYearHarvests.reduce((sum, h) => sum + (parseFloat(h.tons) || 0), 0);
      const avgBrix = currentYearHarvests.length > 0
        ? currentYearHarvests.reduce((sum, h) => sum + (parseFloat(h.brix) || 0), 0) / currentYearHarvests.length
        : 0;

      // Fetch sprays from localStorage
      const sprays = JSON.parse(localStorage.getItem(`vineyard_sprays_${user.id}`) || '[]');
      const recentSprays = sprays.filter(s => {
        const sprayDate = new Date(s.applicationDate);
        const daysAgo = (new Date() - sprayDate) / (1000 * 60 * 60 * 24);
        return daysAgo <= 30;
      }).length;

      // Calculate water balance summary
      const waterBalanceStatus = calculateWaterBalanceSummary(blocks, irrigationEvents);

      setStats({
        totalAcres: totalAcres.toFixed(1),
        totalBlocks,
        pendingTasks,
        overdueTasks,
        recentIrrigationEvents: recentIrrigationCount,
        totalWaterUsed: (totalWater / 1000).toFixed(1), // Convert to thousands of gallons
        activeDevices: activeDevicesCount,
        currentSeasonYield: totalYield.toFixed(1),
        avgBrix: avgBrix.toFixed(1),
        recentSprays
      });

      setWaterBalance(waterBalanceStatus);

      // Format recent activity
      const activity = (irrigationEvents || []).map(event => ({
        id: event.id,
        type: 'irrigation',
        date: event.event_date,
        source: event.source,
        blockName: event.vineyard_blocks?.name || 'Unknown Block',
        description: `${event.irrigation_method} irrigation`,
        amount: (event.total_water_gallons / 1000).toFixed(1),
        duration: event.duration_hours,
      }));

      setRecentActivity(activity);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateWaterBalanceSummary(blocks, events) {
    if (!blocks || blocks.length === 0) return null;

    const irrigatedBlockCount = events?.length || 0;
    const totalBlockCount = blocks.length;

    return {
      status: irrigatedBlockCount > 0 ? 'good' : 'needs-attention',
      irrigatedBlocks: irrigatedBlockCount,
      totalBlocks: totalBlockCount,
    };
  }

  const StatCard = ({ icon: Icon, label, value, change, trend, color = 'emerald', onClick }) => (
    <div
      onClick={onClick}
      className={`group bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-gray-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-5 h-5 ${color === 'emerald' ? 'text-emerald-500' : color === 'teal' ? 'text-teal-500' : color === 'navy' ? 'text-gray-400' : color === 'blue' ? 'text-blue-500' : color === 'cyan' ? 'text-cyan-500' : color === 'purple' ? 'text-purple-500' : color === 'amber' ? 'text-amber-500' : 'text-gray-400'}`} />
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your vineyard operations and key metrics. <DocLink docId="operations/dashboard" /></p>
      </div>

      {/* Key Metrics Grid */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={MapPin}
            label="Total Acreage"
            value={stats.totalAcres}
            color="emerald"
            onClick={() => navigate('/vineyard?view=blocks')}
          />
          <StatCard
            icon={Grape}
            label="Active Blocks"
            value={stats.totalBlocks}
            color="teal"
            onClick={() => navigate('/vineyard?view=blocks')}
          />
          <StatCard
            icon={Calendar}
            label="Pending Tasks"
            value={stats.pendingTasks}
            change={stats.overdueTasks > 0 ? `${stats.overdueTasks} overdue` : null}
            trend={stats.overdueTasks > 0 ? 'down' : null}
            color="navy"
            onClick={() => navigate('/vineyard?view=tasks')}
          />
          <StatCard
            icon={TrendingUp}
            label="Current Season Yield"
            value={`${stats.currentSeasonYield} tons`}
            color="emerald"
            onClick={() => navigate('/vineyard?view=harvest')}
          />
        </div>
      </div>

      {/* Irrigation & Water Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Irrigation & Water Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Droplet}
            label="Recent Irrigation"
            value={stats.recentIrrigationEvents}
            color="blue"
            onClick={() => navigate('/vineyard?view=irrigation')}
          />
          <StatCard
            icon={TrendingUp}
            label="Water Used (7d)"
            value={`${stats.totalWaterUsed}k gal`}
            color="cyan"
            onClick={() => navigate('/vineyard?view=irrigation&tab=water-budget')}
          />
          <StatCard
            icon={Zap}
            label="Active Devices"
            value={stats.activeDevices}
            color="purple"
            onClick={() => navigate('/vineyard?view=hardware')}
          />
          <div className="bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 hover:border-gray-300">
            <div className="flex items-center justify-between mb-3">
              {waterBalance?.status === 'good' ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {waterBalance?.status === 'good' ? 'Good' : 'Check'}
            </div>
            <div className="text-sm text-gray-500">Water Balance</div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            Recent Irrigation Activity
          </h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Droplet className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-1">No recent irrigation events</p>
              <p className="text-xs text-gray-400">
                Log irrigation or connect hardware devices
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <Droplet className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{activity.blockName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString()} • {activity.duration?.toFixed(1)}h
                        {activity.source === 'webhook' && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                            Auto
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900 text-sm">{activity.amount}k gal</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quality Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality & Operations</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <ThermometerSun className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-600">Average Brix</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{stats.avgBrix}°</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Droplet className="w-4 h-4 text-teal-500" />
                <span className="text-sm text-gray-600">Sprays (30 Days)</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{stats.recentSprays}</span>
            </div>

            {/* Weather placeholder */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <CloudRain className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Weather</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-gray-900">72°F</span>
                <span className="text-xs text-gray-400">Partly Cloudy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/vineyard?view=blocks')}
            className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-gray-700">Add Block</span>
          </button>
          <button
            onClick={() => navigate('/vineyard?view=tasks')}
            className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <Calendar className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-medium text-gray-700">Schedule Task</span>
          </button>
          <button
            onClick={() => navigate('/vineyard?view=harvest')}
            className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-gray-700">Log Harvest</span>
          </button>
          <button
            onClick={() => navigate('/vineyard?view=irrigation')}
            className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <Droplet className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Log Irrigation</span>
          </button>
        </div>
      </div>

      {/* Empty State - No Blocks */}
      {stats.totalBlocks === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Get started with your vineyard
          </h3>
          <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
            Add your vineyard blocks to start tracking irrigation, monitoring water balance, and managing operations.
          </p>
          <button
            onClick={() => navigate('/vineyard?view=blocks')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Your First Block
          </button>
        </div>
      )}
    </div>
  );
}
