import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { getLatestReadings, listDevicesWithStatus } from '@/shared/lib/flowMeterApi';

/**
 * Hook to subscribe to real-time flow readings via flow_readings_latest table
 * Efficient: only updates when a device's reading changes (1 row per device)
 *
 * @returns {Object} { devices, isLoading, error, isConnected, refresh }
 */
export function useFlowLatest() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load initial data (showLoading=true only for first load)
  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const { data, error: loadError } = await listDevicesWithStatus();

      if (loadError) throw loadError;
      setDevices(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load flow data:', err);
      setError(err.message);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    loadData(true); // Show loading only on initial load

    // Poll every 15 seconds as fallback for realtime (silent refresh)
    const pollInterval = setInterval(() => loadData(false), 15000);

    return () => clearInterval(pollInterval);
  }, [loadData]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('flow_latest_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'flow_readings_latest' },
        async (payload) => {
          console.log('Flow reading update:', payload);

          // Update the specific device in our state
          if (payload.new) {
            setDevices(prev => prev.map(device => {
              if (device.id === payload.new.device_id) {
                return {
                  ...device,
                  latest_reading: [payload.new]
                };
              }
              return device;
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'irrigation_devices' },
        async (payload) => {
          console.log('Device update:', payload);

          // Update device state changes (online/offline/running)
          if (payload.new) {
            setDevices(prev => prev.map(device => {
              if (device.id === payload.new.id) {
                return {
                  ...device,
                  ...payload.new
                };
              }
              return device;
            }));
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return {
    devices,
    isLoading,
    error,
    isConnected,
    refresh: () => loadData(false) // Silent refresh when user clicks
  };
}

/**
 * Hook to get the latest reading for a specific device
 * @param {string} deviceId - Device ID
 * @returns {Object} { reading, device, isLoading, error }
 */
export function useDeviceLatest(deviceId) {
  const [data, setData] = useState({ reading: null, device: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!deviceId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);

        const [readingResult, deviceResult] = await Promise.all([
          supabase
            .from('flow_readings_latest')
            .select('*')
            .eq('device_id', deviceId)
            .single(),
          supabase
            .from('irrigation_devices')
            .select('*')
            .eq('id', deviceId)
            .single()
        ]);

        setData({
          reading: readingResult.data,
          device: deviceResult.data
        });
        setError(null);
      } catch (err) {
        console.error('Failed to load device data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Subscribe to updates for this specific device
    const channel = supabase
      .channel(`device_${deviceId}_latest`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flow_readings_latest',
          filter: `device_id=eq.${deviceId}`
        },
        (payload) => {
          if (payload.new) {
            setData(prev => ({ ...prev, reading: payload.new }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'irrigation_devices',
          filter: `id=eq.${deviceId}`
        },
        (payload) => {
          if (payload.new) {
            setData(prev => ({ ...prev, device: payload.new }));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [deviceId]);

  return {
    ...data,
    isLoading,
    error
  };
}

export default useFlowLatest;
