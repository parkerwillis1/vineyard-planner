import React from 'react';
import { resetDeviceState } from '@/shared/lib/flowMeterApi';

/**
 * DeviceStatusCard - Shows individual flow meter status
 *
 * Displays device state, current flow rate, battery, signal strength,
 * and last seen timestamp.
 */
export default function DeviceStatusCard({ device, onSelect, onRefresh }) {
  const latestReading = device.latest_reading?.[0];
  const activeSession = device.active_session?.[0];
  const zoneMappings = device.zone_mappings || [];

  // Determine status color and icon
  const getStatusInfo = () => {
    switch (device.current_state) {
      case 'running':
        return {
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          dotColor: 'bg-emerald-500 animate-pulse',
          label: 'Irrigating',
          icon: '💧'
        };
      case 'offline':
        return {
          color: 'bg-red-100 text-red-700 border-red-200',
          dotColor: 'bg-red-500',
          label: 'Offline',
          icon: '⚠️'
        };
      case 'error':
        return {
          color: 'bg-orange-100 text-orange-700 border-orange-200',
          dotColor: 'bg-orange-500',
          label: 'Error',
          icon: '⚠️'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-600 border-gray-200',
          dotColor: 'bg-green-500',
          label: 'Online',
          icon: '✓'
        };
    }
  };

  const status = getStatusInfo();

  // Battery indicator
  const getBatteryIcon = (level) => {
    if (level === null || level === undefined) return null;
    if (level <= 10) return { icon: '🪫', color: 'text-red-500' };
    if (level <= 25) return { icon: '🔋', color: 'text-orange-500' };
    return { icon: '🔋', color: 'text-green-500' };
  };

  const battery = getBatteryIcon(latestReading?.battery_level);

  // Signal strength indicator
  const getSignalIcon = (strength) => {
    if (strength === null || strength === undefined) return null;
    // RSSI: typically -30 (excellent) to -90 (poor)
    if (strength >= -50) return { bars: 4, color: 'text-green-500' };
    if (strength >= -60) return { bars: 3, color: 'text-green-500' };
    if (strength >= -70) return { bars: 2, color: 'text-yellow-500' };
    return { bars: 1, color: 'text-red-500' };
  };

  const signal = getSignalIcon(latestReading?.signal_strength);

  // Format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg border-2 ${device.current_state === 'running' ? 'border-emerald-300' : 'border-gray-200'} p-4 hover:shadow-md transition-shadow cursor-pointer`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{device.device_name}</h4>
          <p className="text-xs text-gray-500 capitalize">{device.device_type?.replace('_', ' ')}</p>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${status.color}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dotColor} mr-1`}></span>
          {status.label}
        </span>
      </div>

      {/* Flow Rate (prominent when running) */}
      {device.current_state === 'running' && latestReading && (
        <div className="bg-emerald-50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-emerald-600 font-medium">Current Flow</div>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (confirm('Reset this device? Use this if the device went offline while irrigating.')) {
                  await resetDeviceState(device.id);
                  onRefresh?.();
                }
              }}
              className="px-2 py-0.5 text-xs font-medium text-orange-600 bg-orange-100 hover:bg-orange-200 rounded transition-colors"
              title="Reset device state (use if stuck)"
            >
              Reset
            </button>
          </div>
          <div className="text-3xl font-bold text-emerald-700">
            {latestReading.flow_rate_gpm?.toFixed(1)} <span className="text-lg font-normal">GPM</span>
          </div>
          {activeSession && (
            <div className="text-xs text-emerald-600 mt-1">
              Session: {activeSession.total_gallons?.toFixed(0)} gal in {Math.round((Date.now() - new Date(activeSession.started_at).getTime()) / 60000)} min
            </div>
          )}
        </div>
      )}

      {/* Status Row */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          {/* Battery */}
          {battery && (
            <div className={`flex items-center gap-1 ${battery.color}`} title={`Battery: ${latestReading.battery_level}%`}>
              <span>{battery.icon}</span>
              <span className="text-xs">{latestReading.battery_level}%</span>
            </div>
          )}

          {/* Signal */}
          {signal && (
            <div className={`flex items-center gap-0.5 ${signal.color}`} title={`Signal: ${latestReading.signal_strength} dBm`}>
              {[1, 2, 3, 4].map(bar => (
                <div
                  key={bar}
                  className={`w-1 rounded-sm ${bar <= signal.bars ? 'bg-current' : 'bg-gray-200'}`}
                  style={{ height: `${bar * 3 + 4}px` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Last seen */}
        <span className="text-gray-400">
          {formatLastSeen(latestReading?.reading_timestamp || device.last_seen_at)}
        </span>
      </div>

      {/* Zone info */}
      {zoneMappings.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {zoneMappings.length} zone{zoneMappings.length > 1 ? 's' : ''} mapped
            {zoneMappings[0]?.block?.name && (
              <span className="text-gray-700 font-medium ml-1">
                ({zoneMappings.map(z => z.block?.name).filter(Boolean).join(', ')})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Idle state info */}
      {device.current_state !== 'running' && device.current_state !== 'offline' && latestReading && (
        <div className="mt-2 text-xs text-gray-400">
          Last flow: {latestReading.flow_rate_gpm?.toFixed(2)} GPM
        </div>
      )}

      {/* Click hint */}
      <div className="mt-2 text-xs text-blue-500 opacity-0 hover:opacity-100 transition-opacity">
        Click for flow history
      </div>
    </div>
  );
}
