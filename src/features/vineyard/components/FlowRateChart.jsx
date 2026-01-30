import React, { useState, useEffect, useMemo } from 'react';
import { getRecentReadings, getHourlyReadings, listFlowReadings } from '@/shared/lib/flowMeterApi';
import { supabase } from '@/shared/lib/supabaseClient';

/**
 * FlowRateChart - Historical flow rate visualization
 *
 * Shows flow rate over time with configurable time ranges.
 * Uses raw readings for short periods, hourly aggregates for longer periods.
 */
export default function FlowRateChart({ deviceId }) {
  const [timeRange, setTimeRange] = useState('30m'); // 30m, 1h, 6h, 24h, 7d, session
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSession, setLastSession] = useState(null); // For "Last Session" view

  // Load data based on time range
  useEffect(() => {
    let isFirstLoad = true;

    const loadData = async () => {
      try {
        // Only show loading on first load, not on interval refreshes
        if (isFirstLoad) {
          setIsLoading(true);
          setError(null);
        }

        let result;

        if (timeRange === 'session') {
          // Fetch the last completed session for this device
          const { data: sessions } = await supabase
            .from('irrigation_sessions')
            .select('*')
            .eq('device_id', deviceId)
            .in('state', ['ended', 'running'])
            .order('started_at', { ascending: false })
            .limit(1);

          if (sessions && sessions.length > 0) {
            const session = sessions[0];
            setLastSession(session);

            // Add a small buffer before and after the session
            const bufferMs = 60000; // 1 minute buffer
            const startTime = new Date(new Date(session.started_at).getTime() - bufferMs);
            const endTime = session.ended_at
              ? new Date(new Date(session.ended_at).getTime() + bufferMs)
              : new Date(); // If still running, use now

            result = await listFlowReadings(deviceId, startTime, endTime, false);
          } else {
            setLastSession(null);
            result = { data: [], error: null };
          }
        } else {
          setLastSession(null);
          switch (timeRange) {
            case '30m':
              result = await getRecentReadings(deviceId, 30);
              break;
            case '1h':
              result = await getRecentReadings(deviceId, 60);
              break;
            case '6h':
              result = await getRecentReadings(deviceId, 360);
              break;
            case '24h':
              result = await getHourlyReadings(deviceId, 1);
              break;
            case '7d':
              result = await getHourlyReadings(deviceId, 7);
              break;
            default:
              result = await getRecentReadings(deviceId, 30);
          }
        }

        if (result.error) throw result.error;
        setReadings(result.data || []);
      } catch (err) {
        console.error('Failed to load readings:', err);
        setError(err.message);
      } finally {
        if (isFirstLoad) {
          setIsLoading(false);
          isFirstLoad = false;
        }
      }
    };

    loadData();

    // Auto-refresh for short time ranges and active session (silent updates)
    const refreshInterval = ['30m', '1h', 'session'].includes(timeRange) ? 30000 : 60000;
    const interval = setInterval(loadData, refreshInterval);

    return () => clearInterval(interval);
  }, [deviceId, timeRange]);

  // Calculate the time range boundaries based on selected range
  const timeRangeBounds = useMemo(() => {
    const now = new Date();

    // For session view, use the session's actual times
    if (timeRange === 'session' && lastSession) {
      const bufferMs = 60000; // 1 minute buffer
      return {
        minTime: new Date(new Date(lastSession.started_at).getTime() - bufferMs),
        maxTime: lastSession.ended_at
          ? new Date(new Date(lastSession.ended_at).getTime() + bufferMs)
          : now
      };
    }

    let minTime;
    switch (timeRange) {
      case '30m':
        minTime = new Date(now.getTime() - 30 * 60 * 1000);
        break;
      case '1h':
        minTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        minTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        minTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        minTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        minTime = new Date(now.getTime() - 30 * 60 * 1000);
    }

    return { minTime, maxTime: now };
  }, [timeRange, lastSession]);

  // Process data for chart
  const chartData = useMemo(() => {
    const isHourly = ['24h', '7d'].includes(timeRange);
    const timeKey = isHourly ? 'hour_start' : 'reading_timestamp';
    const flowKey = isHourly ? 'avg_flow_rate_gpm' : 'flow_rate_gpm';

    const points = readings.map(r => ({
      time: new Date(r[timeKey]),
      flow: r[flowKey] || 0,
      max: r.max_flow_rate_gpm,
      min: r.min_flow_rate_gpm
    }));

    const flowValues = points.map(p => p.flow);
    const maxY = flowValues.length > 0 ? Math.max(...flowValues, 1) * 1.1 : 10; // 10% padding

    // Use the time range bounds, not the data bounds
    return {
      points,
      maxY,
      minTime: timeRangeBounds.minTime,
      maxTime: timeRangeBounds.maxTime
    };
  }, [readings, timeRange, timeRangeBounds]);

  // SVG dimensions
  const width = 700;
  const height = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (time) => {
    if (!chartData.minTime || !chartData.maxTime) return 0;
    const range = chartData.maxTime - chartData.minTime;
    if (range === 0) return chartWidth / 2;
    return ((time - chartData.minTime) / range) * chartWidth;
  };

  const yScale = (value) => {
    return chartHeight - (value / chartData.maxY) * chartHeight;
  };

  // Generate path
  const linePath = useMemo(() => {
    if (chartData.points.length === 0) return '';
    return chartData.points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.time)} ${yScale(p.flow)}`)
      .join(' ');
  }, [chartData.points, chartWidth, chartHeight]);

  // Area path (for fill)
  const areaPath = useMemo(() => {
    if (chartData.points.length === 0) return '';
    const line = chartData.points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.time)} ${yScale(p.flow)}`)
      .join(' ');
    return `${line} L ${xScale(chartData.maxTime)} ${chartHeight} L ${xScale(chartData.minTime)} ${chartHeight} Z`;
  }, [chartData.points, chartWidth, chartHeight]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks = [];
    const step = chartData.maxY / 5;
    for (let i = 0; i <= 5; i++) {
      ticks.push(Math.round(step * i * 10) / 10);
    }
    return ticks;
  }, [chartData.maxY]);

  // X-axis labels
  const formatTimeLabel = (time) => {
    if (!time) return '';
    const date = new Date(time);
    if (['7d'].includes(timeRange)) {
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
    if (['24h'].includes(timeRange)) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Failed to load chart data: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Time range selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'session', label: 'Last Session' },
            { value: '30m', label: '30 min' },
            { value: '1h', label: '1 hour' },
            { value: '6h', label: '6 hours' },
            { value: '24h', label: '24 hours' },
            { value: '7d', label: '7 days' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-1 text-sm rounded ${
                timeRange === option.value
                  ? option.value === 'session' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-500">
          {chartData.points.length} readings
        </div>
      </div>

      {/* Session info when viewing last session */}
      {timeRange === 'session' && lastSession && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-blue-800">
                {lastSession.state === 'running' ? '🔵 Currently Running' : '✅ Completed Session'}
              </span>
              <span className="text-blue-600 ml-2">
                {new Date(lastSession.started_at).toLocaleString()}
              </span>
            </div>
            <div className="text-blue-700">
              <span className="font-semibold">{lastSession.total_gallons?.toFixed(1) || 0}</span> gal
              {lastSession.duration_minutes && (
                <span className="ml-2">• {Math.round(lastSession.duration_minutes)} min</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.points.length === 0 ? (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center text-gray-400">
            <div className="text-2xl mb-2">📊</div>
            <p>
              {timeRange === 'session'
                ? 'No irrigation sessions found for this device'
                : `No flow readings in the last ${timeRange === '30m' ? '30 minutes' : timeRange === '1h' ? 'hour' : timeRange === '6h' ? '6 hours' : timeRange === '24h' ? '24 hours' : '7 days'}`
              }
            </p>
          </div>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ maxHeight: '300px' }}
        >
          <defs>
            <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid lines */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={0}
                  y1={yScale(tick)}
                  x2={chartWidth}
                  y2={yScale(tick)}
                  stroke="#e5e7eb"
                  strokeDasharray="4,4"
                />
                <text
                  x={-8}
                  y={yScale(tick)}
                  dy="0.35em"
                  textAnchor="end"
                  fill="#9ca3af"
                  fontSize="11"
                >
                  {tick}
                </text>
              </g>
            ))}

            {/* Y-axis label */}
            <text
              transform={`rotate(-90) translate(${-chartHeight / 2}, ${-35})`}
              textAnchor="middle"
              fill="#6b7280"
              fontSize="12"
            >
              Flow Rate (GPM)
            </text>

            {/* Area fill */}
            <path d={areaPath} fill="url(#flowGradient)" />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points (only show if not too many) */}
            {chartData.points.length <= 60 && chartData.points.map((point, i) => (
              <circle
                key={i}
                cx={xScale(point.time)}
                cy={yScale(point.flow)}
                r="3"
                fill="#10b981"
                stroke="white"
                strokeWidth="1"
              >
                <title>{`${point.flow.toFixed(2)} GPM at ${formatTimeLabel(point.time)}`}</title>
              </circle>
            ))}

            {/* X-axis */}
            <line
              x1={0}
              y1={chartHeight}
              x2={chartWidth}
              y2={chartHeight}
              stroke="#e5e7eb"
            />

            {/* X-axis labels */}
            <text
              x={0}
              y={chartHeight + 20}
              textAnchor="start"
              fill="#9ca3af"
              fontSize="11"
            >
              {formatTimeLabel(chartData.minTime)}
            </text>
            <text
              x={chartWidth}
              y={chartHeight + 20}
              textAnchor="end"
              fill="#9ca3af"
              fontSize="11"
            >
              {formatTimeLabel(chartData.maxTime)}
            </text>
          </g>
        </svg>
      )}

      {/* Stats summary */}
      {chartData.points.length > 0 && (
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500">Average</div>
            <div className="text-lg font-semibold text-gray-900">
              {(chartData.points.reduce((sum, p) => sum + p.flow, 0) / chartData.points.length).toFixed(2)} GPM
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Peak</div>
            <div className="text-lg font-semibold text-emerald-600">
              {Math.max(...chartData.points.map(p => p.flow)).toFixed(2)} GPM
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Minimum</div>
            <div className="text-lg font-semibold text-gray-600">
              {Math.min(...chartData.points.map(p => p.flow)).toFixed(2)} GPM
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
