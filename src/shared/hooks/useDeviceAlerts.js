import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { listActiveAlerts, acknowledgeAlert, resolveAlert } from '@/shared/lib/flowMeterApi';

/**
 * Hook to subscribe to device alerts in real-time
 * Shows unresolved alerts and provides actions to acknowledge/resolve
 *
 * @returns {Object} { alerts, unacknowledgedCount, isLoading, error, acknowledge, resolve, refresh }
 */
export function useDeviceAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load active alerts
  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: loadError } = await listActiveAlerts();

      if (loadError) throw loadError;
      setAlerts(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Real-time subscription for new alerts
  useEffect(() => {
    const channel = supabase
      .channel('device_alerts_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'device_alerts' },
        async (payload) => {
          console.log('New alert:', payload);

          // Fetch the full alert with joins
          const { data: newAlert } = await supabase
            .from('device_alerts')
            .select(`
              *,
              device:irrigation_devices(id, device_name, device_type),
              zone_mapping:device_zone_mappings(id, zone_number, zone_name,
                block:vineyard_blocks(id, name)
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newAlert) {
            setAlerts(prev => [newAlert, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'device_alerts' },
        (payload) => {
          console.log('Alert updated:', payload);

          // If resolved, remove from list
          if (payload.new.resolved_at) {
            setAlerts(prev => prev.filter(a => a.id !== payload.new.id));
          } else {
            // Update the alert in place
            setAlerts(prev => prev.map(a =>
              a.id === payload.new.id ? { ...a, ...payload.new } : a
            ));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Acknowledge an alert
  const handleAcknowledge = useCallback(async (alertId) => {
    try {
      const { data, error: ackError } = await acknowledgeAlert(alertId);
      if (ackError) throw ackError;

      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, ...data } : a
      ));

      return { success: true };
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Resolve an alert
  const handleResolve = useCallback(async (alertId, notes = '') => {
    try {
      const { data, error: resolveError } = await resolveAlert(alertId, notes);
      if (resolveError) throw resolveError;

      // Remove from active alerts
      setAlerts(prev => prev.filter(a => a.id !== alertId));

      return { success: true };
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Count unacknowledged alerts
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged_at).length;

  // Sort by severity and time
  const sortedAlerts = [...alerts].sort((a, b) => {
    // Critical first, then warning, then info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // Then by time (newest first)
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return {
    alerts: sortedAlerts,
    unacknowledgedCount,
    isLoading,
    error,
    acknowledge: handleAcknowledge,
    resolve: handleResolve,
    refresh: loadAlerts
  };
}

export default useDeviceAlerts;
