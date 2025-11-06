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

  const StatCard = ({ icon: Icon, label, value, change, trend, color = 'emerald', iconBg, onClick }) => (
    <div
      onClick={onClick}
      className={`group bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-0.5 ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:border-gray-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl ${iconBg || 'bg-gradient-to-br from-emerald-50 to-emerald-100'} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`w-7 h-7 ${color === 'emerald' ? 'text-[#10b981]' : color === 'teal' ? 'text-[#008080]' : color === 'navy' ? 'text-[#1f2937]' : color === 'blue' ? 'text-blue-600' : color === 'cyan' ? 'text-cyan-600' : color === 'purple' ? 'text-purple-600' : 'text-amber-600'}`} />
        </div>
        {change && (
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${trend === 'up' ? 'text-[#10b981]' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-[#1f2937] mb-2">{value}</div>
      <div className="text-sm font-medium text-[#4b5563]">{label}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      <div>
        <h3 className="text-lg font-bold text-[#1f2937] mb-4">Key Operational Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={MapPin}
            label="Total Acreage"
            value={stats.totalAcres}
            color="emerald"
            iconBg="bg-gradient-to-br from-emerald-50 to-emerald-100"
            onClick={() => navigate('/vineyard?view=blocks')}
          />
          <StatCard
            icon={Grape}
            label="Active Blocks"
            value={stats.totalBlocks}
            color="teal"
            iconBg="bg-gradient-to-br from-teal-50 to-teal-100"
            onClick={() => navigate('/vineyard?view=blocks')}
          />
          <StatCard
            icon={Calendar}
            label="Pending Tasks"
            value={stats.pendingTasks}
            change={stats.overdueTasks > 0 ? `${stats.overdueTasks} overdue` : null}
            trend={stats.overdueTasks > 0 ? 'down' : null}
            color="navy"
            iconBg="bg-gradient-to-br from-gray-50 to-gray-100"
            onClick={() => navigate('/vineyard?view=tasks')}
          />
          <StatCard
            icon={TrendingUp}
            label="Current Season Yield"
            value={`${stats.currentSeasonYield} tons`}
            color="emerald"
            iconBg="bg-gradient-to-br from-emerald-50 to-emerald-100"
            onClick={() => navigate('/vineyard?view=harvest')}
          />
        </div>
      </div>

      {/* Irrigation & Water Stats */}
      <div>
        <h3 className="text-lg font-bold text-[#1f2937] mb-4">Irrigation & Water Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Droplet}
            label="Recent Irrigation"
            value={stats.recentIrrigationEvents}
            color="blue"
            iconBg="bg-gradient-to-br from-blue-50 to-blue-100"
            onClick={() => navigate('/vineyard?view=irrigation')}
          />
          <StatCard
            icon={TrendingUp}
            label="Water Used (7d)"
            value={`${stats.totalWaterUsed}k gal`}
            color="cyan"
            iconBg="bg-gradient-to-br from-cyan-50 to-cyan-100"
            onClick={() => navigate('/vineyard?view=irrigation&tab=water-budget')}
          />
          <StatCard
            icon={Zap}
            label="Active Devices"
            value={stats.activeDevices}
            color="purple"
            iconBg="bg-gradient-to-br from-purple-50 to-purple-100"
            onClick={() => navigate('/vineyard?view=hardware')}
          />
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                waterBalance?.status === 'good'
                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-100'
                  : 'bg-gradient-to-br from-yellow-50 to-yellow-100'
              }`}>
                {waterBalance?.status === 'good' ? (
                  <CheckCircle className="w-6 h-6 text-[#10b981]" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                )}
              </div>
              <div>
                <div className="text-lg font-bold text-[#1f2937]">
                  {waterBalance?.status === 'good' ? 'Good' : 'Check'}
                </div>
                <div className="text-sm font-medium text-[#4b5563]">Water Balance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-[#1f2937] mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Recent Irrigation Activity
          </h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Droplet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-2">No recent irrigation events</p>
              <p className="text-xs text-gray-400">
                Log irrigation or connect hardware devices
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Droplet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{activity.blockName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString()} • {activity.duration?.toFixed(1)}h
                        {activity.source === 'webhook' && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            Auto
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 text-sm">{activity.amount}k</p>
                    <p className="text-xs text-gray-500">gal</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quality Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-[#1f2937] mb-4">Quality & Operations</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                <ThermometerSun className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1f2937]">{stats.avgBrix}°</div>
                <div className="text-sm font-medium text-[#4b5563]">Average Brix</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-lg border border-teal-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0">
                <Droplet className="w-6 h-6 text-[#008080]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1f2937]">{stats.recentSprays}</div>
                <div className="text-sm font-medium text-[#4b5563]">Sprays (Last 30 Days)</div>
              </div>
            </div>

            {/* Weather placeholder */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                <CloudRain className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-[#1f2937]">72°F</div>
                <div className="text-sm font-medium text-[#4b5563]">Partly Cloudy</div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <div className="flex items-center gap-1 mb-1">
                  <Wind className="w-3 h-3" />
                  <span>5 mph</span>
                </div>
                <div>20% rain</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-[#1f2937] mb-5 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#10b981]" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/vineyard?view=blocks')}
            className="group bg-white hover:bg-gray-50 rounded-xl p-5 text-center transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1"
          >
            <Plus className="w-7 h-7 text-[#10b981] mx-auto mb-3 transition-colors" />
            <div className="text-sm font-bold text-[#1f2937] transition-colors">Add Block</div>
          </button>
          <button
            onClick={() => navigate('/vineyard?view=tasks')}
            className="group bg-white hover:bg-gray-50 rounded-xl p-5 text-center transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1"
          >
            <Calendar className="w-7 h-7 text-[#008080] mx-auto mb-3 transition-colors" />
            <div className="text-sm font-bold text-[#1f2937] transition-colors">Schedule Task</div>
          </button>
          <button
            onClick={() => navigate('/vineyard?view=harvest')}
            className="group bg-white hover:bg-gray-50 rounded-xl p-5 text-center transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1"
          >
            <TrendingUp className="w-7 h-7 text-[#10b981] mx-auto mb-3 transition-colors" />
            <div className="text-sm font-bold text-[#1f2937] transition-colors">Log Harvest</div>
          </button>
          <button
            onClick={() => navigate('/vineyard?view=irrigation')}
            className="group bg-white hover:bg-gray-50 rounded-xl p-5 text-center transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1"
          >
            <Droplet className="w-7 h-7 text-blue-600 mx-auto mb-3 transition-colors" />
            <div className="text-sm font-bold text-[#1f2937] transition-colors">Log Irrigation</div>
          </button>
        </div>
      </div>

      {/* Empty State - No Blocks */}
      {stats.totalBlocks === 0 && (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 mb-4">
            <MapPin className="w-8 h-8 text-teal-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Get started with your vineyard
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Add your vineyard blocks to start tracking irrigation, monitoring water balance, and managing operations.
          </p>
          <button
            onClick={() => navigate('/vineyard?view=blocks')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-vine-green-600 text-white rounded-lg hover:from-teal-500 hover:to-vine-green-500 transition-all font-medium shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Your First Block
          </button>
        </div>
      )}
    </div>
  );
}
