import React, { useMemo } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';

export function ETTrendsChart({ timeseries, title = "ET Trends (Last 30 Days)" }) {
  if (!timeseries || timeseries.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No trend data available
      </div>
    );
  }

  // Calculate chart dimensions and scale
  const { maxET, minET, chartData } = useMemo(() => {
    const etValues = timeseries.map(d => d.et);
    const etcValues = timeseries.map(d => d.etc);
    const allValues = [...etValues, ...etcValues];

    const max = Math.max(...allValues);
    const min = Math.min(...allValues);

    return {
      maxET: Math.ceil(max),
      minET: Math.floor(min),
      chartData: timeseries
    };
  }, [timeseries]);

  const chartWidth = 800;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Scale functions
  const scaleX = (index) => padding.left + (index / (chartData.length - 1)) * plotWidth;
  const scaleY = (value) => padding.top + plotHeight - ((value - minET) / (maxET - minET)) * plotHeight;

  // Generate line paths
  const etLine = chartData.map((d, i) => {
    const x = scaleX(i);
    const y = scaleY(d.et);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const etcLine = chartData.map((d, i) => {
    const x = scaleX(i);
    const y = scaleY(d.etc);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate area path for ETc
  const etcArea = [
    `M ${padding.left} ${scaleY(minET)}`,
    ...chartData.map((d, i) => `L ${scaleX(i)} ${scaleY(d.etc)}`),
    `L ${scaleX(chartData.length - 1)} ${scaleY(minET)}`,
    'Z'
  ].join(' ');

  // Y-axis ticks
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const value = minET + (i / 4) * (maxET - minET);
    return { value, y: scaleY(value) };
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600">Reference ET</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-gray-600">Crop ET (ETc)</span>
          </div>
        </div>
      </div>

      <svg width={chartWidth} height={chartHeight} className="w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={chartWidth - padding.right}
              y2={tick.y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#6b7280"
            >
              {tick.value.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Y-axis label */}
        <text
          x={10}
          y={chartHeight / 2}
          textAnchor="middle"
          fontSize="11"
          fill="#6b7280"
          transform={`rotate(-90, 10, ${chartHeight / 2})`}
        >
          mm/day
        </text>

        {/* Area fill for ETc */}
        <path
          d={etcArea}
          fill="rgba(34, 197, 94, 0.1)"
          stroke="none"
        />

        {/* ET line */}
        <path
          d={etLine}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />

        {/* ETc line */}
        <path
          d={etcLine}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
        />

        {/* Data points */}
        {chartData.map((d, i) => (
          <g key={i}>
            <circle
              cx={scaleX(i)}
              cy={scaleY(d.et)}
              r="2.5"
              fill="#3b82f6"
            />
            <circle
              cx={scaleX(i)}
              cy={scaleY(d.etc)}
              r="2.5"
              fill="#22c55e"
            />
          </g>
        ))}

        {/* X-axis date labels (show every 5th date) */}
        {chartData.filter((_, i) => i % Math.ceil(chartData.length / 6) === 0).map((d, idx) => {
          const originalIndex = chartData.findIndex(item => item.date === d.date);
          const x = scaleX(originalIndex);
          const date = new Date(d.date);
          const label = `${date.getMonth() + 1}/${date.getDate()}`;

          return (
            <text
              key={idx}
              x={x}
              y={chartHeight - 8}
              textAnchor="middle"
              fontSize="9"
              fill="#6b7280"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-xs text-gray-500">Avg ET</div>
          <div className="text-lg font-semibold text-gray-900">
            {(chartData.reduce((sum, d) => sum + d.et, 0) / chartData.length).toFixed(2)} mm/day
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Avg ETc</div>
          <div className="text-lg font-semibold text-green-600">
            {(chartData.reduce((sum, d) => sum + d.etc, 0) / chartData.length).toFixed(2)} mm/day
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Total ETc</div>
          <div className="text-lg font-semibold text-blue-600">
            {chartData.reduce((sum, d) => sum + d.etc, 0).toFixed(1)} mm
          </div>
        </div>
      </div>
    </div>
  );
}
