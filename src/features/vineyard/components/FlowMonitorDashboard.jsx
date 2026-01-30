import React, { useState, useMemo } from 'react';
import { useFlowLatest } from '@/shared/hooks/useFlowLatest';
import { useDeviceAlerts } from '@/shared/hooks/useDeviceAlerts';
import { useActiveSessions } from '@/shared/hooks/useActiveSessions';
import DeviceStatusCard from './DeviceStatusCard';
import AlertsPanel from './AlertsPanel';
import ActiveSessionsPanel from './ActiveSessionsPanel';
import FlowRateChart from './FlowRateChart';

/**
 * FlowMonitorDashboard - Real-time irrigation monitoring
 *
 * Main dashboard for monitoring flow meters and irrigation events.
 * Subscribes to flow_readings_latest for efficient realtime updates.
 */
export default function FlowMonitorDashboard() {
  const { devices, isLoading: devicesLoading, error: devicesError, isConnected, refresh } = useFlowLatest();
  const { alerts, unacknowledgedCount, acknowledge, resolve } = useDeviceAlerts();
  const { sessions } = useActiveSessions();

  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [showChart, setShowChart] = useState(false);

  // Calculate water usage for today
  const todayStats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // This would need to come from sessions API
    // For now, just show active session gallons
    const totalGallons = sessions.reduce((sum, s) => sum + (s.total_gallons || 0), 0);
    const activeDevices = devices.filter(d => d.current_state === 'running').length;

    return { totalGallons, activeDevices, sessionCount: sessions.length };
  }, [sessions, devices]);

  // Count devices by state
  const deviceStats = useMemo(() => {
    const stats = { online: 0, offline: 0, running: 0, idle: 0 };
    devices.forEach(d => {
      if (d.current_state === 'offline') stats.offline++;
      else if (d.current_state === 'running') stats.running++;
      else stats.online++;
    });
    stats.idle = stats.online - stats.running;
    return stats;
  }, [devices]);

  if (devicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (devicesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Failed to load flow data: {devicesError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Flow Monitor</h2>
          <p className="text-gray-500">
            Real-time irrigation monitoring and alerts
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection indicator */}
          <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
            {isConnected ? 'Live' : 'Connecting...'}
          </div>
          <button
            onClick={refresh}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Active Irrigations</div>
          <div className="text-2xl font-bold text-emerald-600">{sessions.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Devices Online</div>
          <div className="text-2xl font-bold text-blue-600">
            {deviceStats.online}/{devices.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Today's Water</div>
          <div className="text-2xl font-bold text-cyan-600">
            {todayStats.totalGallons.toLocaleString(undefined, { maximumFractionDigits: 0 })} gal
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Active Alerts</div>
          <div className={`text-2xl font-bold ${unacknowledgedCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {alerts.length}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Active Sessions & Alerts */}
        <div className="space-y-6">
          {/* Active Sessions */}
          <ActiveSessionsPanel sessions={sessions} onRefresh={refresh} />

          {/* Alerts */}
          <AlertsPanel
            alerts={alerts}
            onAcknowledge={acknowledge}
            onResolve={resolve}
          />
        </div>

        {/* Right Column - Device Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Flow Meters</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {deviceStats.online} online
              </span>
              {deviceStats.offline > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  {deviceStats.offline} offline
                </span>
              )}
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Flow Meters Connected</h3>
              <p className="text-gray-500 mb-4">
                Add a flow meter to start monitoring irrigation in real-time.
              </p>
              <a
                href="/operations/hardware"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Add Flow Meter
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map(device => (
                <DeviceStatusCard
                  key={device.id}
                  device={device}
                  onSelect={() => {
                    setSelectedDeviceId(device.id);
                    setShowChart(true);
                  }}
                  onRefresh={refresh}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Flow Rate Chart Modal */}
      {showChart && selectedDeviceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Flow Rate History - {devices.find(d => d.id === selectedDeviceId)?.device_name}
              </h3>
              <button
                onClick={() => setShowChart(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <FlowRateChart deviceId={selectedDeviceId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
