import React, { useEffect, useState } from 'react';
import { resetDeviceState } from '@/shared/lib/flowMeterApi';

/**
 * ActiveSessionsPanel - Shows currently running irrigation sessions
 *
 * Displays active irrigation with live duration and gallons counter.
 */
export default function ActiveSessionsPanel({ sessions, onRefresh }) {
  // Force re-render every 10 seconds to update duration
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (startedAt) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now - start;
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Irrigations</h3>
        <div className="text-center py-6 text-gray-400">
          <div className="text-2xl mb-2">💤</div>
          <p>No active irrigations</p>
          <p className="text-xs mt-1">Sessions will appear here when flow is detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-lg border border-emerald-200">
      <div className="px-4 py-3 border-b border-emerald-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-emerald-800">Active Irrigations</h3>
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {sessions.length} running
          </span>
        </div>
      </div>

      <div className="divide-y divide-emerald-100">
        {sessions.map(session => (
          <div key={session.id} className="p-4">
            <div className="flex items-start justify-between">
              {/* Left: Device & Block info */}
              <div>
                <div className="font-medium text-gray-900">
                  {session.device?.device_name || 'Unknown Device'}
                </div>
                {session.zone_mapping?.block?.name && (
                  <div className="text-sm text-gray-500">
                    {session.zone_mapping.block.name}
                    {session.zone_mapping.zone_name && (
                      <span className="text-gray-400"> - {session.zone_mapping.zone_name}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Flow rate */}
              <div className="text-right">
                <div className="text-xl font-bold text-emerald-600">
                  {session.avg_flow_rate_gpm?.toFixed(1)} <span className="text-sm font-normal">GPM</span>
                </div>
                {session.peak_flow_rate_gpm && session.peak_flow_rate_gpm !== session.avg_flow_rate_gpm && (
                  <div className="text-xs text-gray-400">
                    Peak: {session.peak_flow_rate_gpm?.toFixed(1)} GPM
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-emerald-100">
              {/* Duration */}
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {formatDuration(session.started_at)}
                </span>
              </div>

              {/* Total gallons */}
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {session.total_gallons?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0} gal
                </span>
              </div>

              {/* Readings count */}
              <div className="flex items-center gap-1.5 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-xs">
                  {session.reading_count || 0} readings
                </span>
              </div>
            </div>

            {/* Block acreage context */}
            {session.zone_mapping?.block?.acres && session.total_gallons > 0 && (
              <div className="mt-2 text-xs text-gray-400">
                {(session.total_gallons / session.zone_mapping.block.acres).toFixed(0)} gal/acre so far
              </div>
            )}

            {/* Progress indicator and stop button */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex-1 h-1 bg-emerald-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 animate-pulse"
                  style={{ width: '100%' }}
                />
              </div>
              <button
                onClick={async () => {
                  console.log('Stop clicked, session:', session);
                  console.log('device_id:', session.device_id);
                  if (confirm('Stop this irrigation session? Use this if the device went offline.')) {
                    const result = await resetDeviceState(session.device_id);
                    console.log('resetDeviceState result:', result);
                    onRefresh?.();
                  }
                }}
                className="px-2 py-0.5 text-xs font-medium text-orange-600 bg-orange-100 hover:bg-orange-200 rounded transition-colors flex-shrink-0"
                title="Stop session (use if device went offline)"
              >
                Stop
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
