import React, { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, Clock, Activity, BarChart3, Calendar,
  Droplet, Sparkles, Wrench, AlertCircle
} from 'lucide-react';
import {
  getVesselHistory,
  getVesselAnalytics
} from '@/shared/lib/productionApi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

/**
 * Analytics tab for vessel detail page
 * Shows historical data, cost analytics, and utilization metrics
 */
export function VesselAnalytics({ containerId, container }) {
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // 'week', 'month', 'year', 'all'

  useEffect(() => {
    loadAnalyticsData();
  }, [containerId]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [historyResult, analyticsResult] = await Promise.all([
        getVesselHistory(containerId, { limit: 100 }),
        getVesselAnalytics(containerId)
      ]);

      if (historyResult.error) throw historyResult.error;
      if (analyticsResult.error) throw analyticsResult.error;

      setHistory(historyResult.data || []);
      setAnalytics(analyticsResult.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter history by time range
  const getFilteredHistory = () => {
    if (timeRange === 'all') return history;

    const now = new Date();
    const cutoff = new Date();

    switch (timeRange) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return history;
    }

    return history.filter(event => new Date(event.event_date) >= cutoff);
  };

  // Prepare volume history chart data
  const prepareVolumeChartData = () => {
    const filteredHistory = getFilteredHistory();
    return filteredHistory
      .filter(e => e.volume_after !== null)
      .reverse()
      .map(event => ({
        date: new Date(event.event_date).toLocaleDateString(),
        volume: parseFloat(event.volume_after || 0),
        eventType: event.event_type
      }));
  };

  // Prepare cost chart data
  const prepareCostChartData = () => {
    const filteredHistory = getFilteredHistory();
    const costEvents = filteredHistory.filter(e => e.cost && e.cost > 0);

    // Group by month
    const monthlyData = {};
    costEvents.forEach(event => {
      const date = new Date(event.event_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: new Date(date.getFullYear(), date.getMonth()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          maintenance: 0,
          cip: 0,
          repair: 0,
          total: 0
        };
      }

      const cost = parseFloat(event.cost);
      if (event.event_type === 'cip') monthlyData[monthKey].cip += cost;
      else if (event.event_type === 'repair') monthlyData[monthKey].repair += cost;
      else if (event.event_type === 'maintenance') monthlyData[monthKey].maintenance += cost;

      monthlyData[monthKey].total += cost;
    });

    return Object.values(monthlyData);
  };

  // Event type breakdown
  const getEventTypeCounts = () => {
    const filteredHistory = getFilteredHistory();
    const counts = {};
    filteredHistory.forEach(event => {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    });
    return counts;
  };

  // Calculate utilization percentage
  const calculateUtilization = () => {
    if (!analytics) return 0;

    // Based on days the vessel has been in use vs total days owned
    const ageInDays = analytics.age_days || 1;
    const fillEventsCount = analytics.fill_events_count || 0;

    // Rough estimate: average 30 days per fill cycle
    const daysInUse = fillEventsCount * 30;
    const utilization = Math.min((daysInUse / ageInDays) * 100, 100);

    return utilization.toFixed(1);
  };

  const volumeData = prepareVolumeChartData();
  const costData = prepareCostChartData();
  const eventCounts = getEventTypeCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="w-8 h-8 text-[#7C203A] animate-pulse" />
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <p className="text-red-800 font-medium">Failed to load analytics</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Analytics & History</h3>
        <div className="flex gap-2">
          {[
            { label: 'Week', value: 'week' },
            { label: 'Month', value: 'month' },
            { label: 'Year', value: 'year' },
            { label: 'All Time', value: 'all' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === option.value
                  ? 'bg-[#7C203A] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Fills */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Droplet className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-900">{analytics?.fill_events_count || 0}</span>
          </div>
          <p className="text-sm font-medium text-blue-800">Total Fills</p>
          <p className="text-xs text-blue-600 mt-1">Lifetime usage</p>
        </div>

        {/* Utilization */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-900">{calculateUtilization()}%</span>
          </div>
          <p className="text-sm font-medium text-green-800">Utilization</p>
          <p className="text-xs text-green-600 mt-1">Efficiency rate</p>
        </div>

        {/* Total Maintenance Cost */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold text-orange-900">
              ${(analytics?.total_maintenance_spent || 0).toFixed(0)}
            </span>
          </div>
          <p className="text-sm font-medium text-orange-800">Maintenance Costs</p>
          <p className="text-xs text-orange-600 mt-1">Total spent</p>
        </div>

        {/* Cost per Gallon */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-purple-900">
              ${analytics?.cost_per_gallon ? analytics.cost_per_gallon.toFixed(3) : '—'}
            </span>
          </div>
          <p className="text-sm font-medium text-purple-800">Cost per Gallon</p>
          <p className="text-xs text-purple-600 mt-1">Average lifetime</p>
        </div>
      </div>

      {/* Volume History Chart */}
      {volumeData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-600" />
            Volume History
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={volumeData}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C203A" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7C203A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                label={{ value: 'Gallons', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#7C203A"
                strokeWidth={2}
                fill="url(#volumeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost Breakdown Chart */}
      {costData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Maintenance Costs by Month
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="cip" fill="#10b981" name="CIP" stackId="a" />
              <Bar dataKey="maintenance" fill="#f59e0b" name="Maintenance" stackId="a" />
              <Bar dataKey="repair" fill="#ef4444" name="Repairs" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Event Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          Event History
        </h4>

        {getFilteredHistory().length === 0 ? (
          <p className="text-gray-500 text-center py-8">No events recorded yet</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {getFilteredHistory().map((event, index) => {
              const eventIcons = {
                lot_assigned: <Droplet className="w-4 h-4 text-blue-600" />,
                lot_removed: <Droplet className="w-4 h-4 text-gray-600" />,
                cip: <Sparkles className="w-4 h-4 text-emerald-600" />,
                maintenance: <Wrench className="w-4 h-4 text-orange-600" />,
                repair: <Wrench className="w-4 h-4 text-red-600" />,
                volume_change: <TrendingUp className="w-4 h-4 text-purple-600" />,
                fill: <Droplet className="w-4 h-4 text-blue-600" />,
                empty: <Droplet className="w-4 h-4 text-gray-400" />
              };

              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {eventIcons[event.event_type] || <Activity className="w-4 h-4 text-gray-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {event.event_type.replace('_', ' ')}
                          {event.lot && ` - ${event.lot.name}`}
                        </p>
                        {event.notes && (
                          <p className="text-xs text-gray-600 mt-1">{event.notes}</p>
                        )}
                        {event.volume_change !== null && event.volume_change !== 0 && (
                          <p className="text-xs text-gray-600 mt-1">
                            Volume change: {event.volume_change > 0 ? '+' : ''}{event.volume_change.toFixed(1)} gal
                          </p>
                        )}
                        {event.cost && (
                          <p className="text-xs font-medium text-green-700 mt-1">
                            Cost: ${parseFloat(event.cost).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cost Summary */}
      {container && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Cost Summary
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Purchase Cost</p>
              <p className="text-lg font-bold text-gray-900">
                ${container.purchase_cost ? parseFloat(container.purchase_cost).toFixed(2) : '—'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Annual Maintenance</p>
              <p className="text-lg font-bold text-gray-900">
                ${container.annual_maintenance_cost ? parseFloat(container.annual_maintenance_cost).toFixed(2) : '—'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Total Spent</p>
              <p className="text-lg font-bold text-gray-900">
                ${(analytics?.total_maintenance_spent || 0).toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Estimated Replacement</p>
              <p className="text-lg font-bold text-gray-900">
                ${container.estimated_replacement_cost ? parseFloat(container.estimated_replacement_cost).toFixed(2) : '—'}
              </p>
            </div>
          </div>

          {analytics?.age_days && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="text-sm text-gray-600">
                Vessel Age: <span className="font-semibold text-gray-900">{Math.floor(analytics.age_days / 365)} years, {Math.floor(analytics.age_days % 365 / 30)} months</span>
              </p>
              {analytics.last_fill_date && (
                <p className="text-sm text-gray-600 mt-1">
                  Last Fill: <span className="font-semibold text-gray-900">{new Date(analytics.last_fill_date).toLocaleDateString()}</span>
                </p>
              )}
              {analytics.days_since_cip !== null && (
                <p className="text-sm text-gray-600 mt-1">
                  Days Since CIP: <span className="font-semibold text-gray-900">{Math.floor(analytics.days_since_cip)}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
