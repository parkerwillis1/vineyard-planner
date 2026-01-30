import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { listActiveSessions } from '@/shared/lib/flowMeterApi';

/**
 * Hook to subscribe to active irrigation sessions in real-time
 * Shows currently running irrigation sessions with live updates
 *
 * @returns {Object} { sessions, isLoading, error, refresh }
 */
export function useActiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load active sessions (showLoading=true only for first load)
  const loadSessions = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const { data, error: loadError } = await listActiveSessions();

      console.log('useActiveSessions: Loaded sessions', data, 'error:', loadError);

      if (loadError) throw loadError;
      setSessions(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError(err.message);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    loadSessions(true); // Show loading only on initial load

    // Poll every 15 seconds as fallback for realtime (silent refresh)
    const pollInterval = setInterval(() => loadSessions(false), 15000);

    return () => clearInterval(pollInterval);
  }, [loadSessions]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('irrigation_sessions_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'irrigation_sessions' },
        async (payload) => {
          console.log('New session:', payload);

          if (payload.new.state === 'running') {
            // Fetch the full session with joins
            const { data: newSession } = await supabase
              .from('irrigation_sessions')
              .select(`
                *,
                device:irrigation_devices(id, device_name, device_type),
                zone_mapping:device_zone_mappings(id, zone_number, zone_name,
                  block:vineyard_blocks(id, name, variety, acres)
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (newSession) {
              setSessions(prev => [newSession, ...prev]);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'irrigation_sessions' },
        (payload) => {
          console.log('Session updated:', payload);

          // If session ended or dropped, remove from list
          if (payload.new.state !== 'running') {
            setSessions(prev => prev.filter(s => s.id !== payload.new.id));
          } else {
            // Update the session in place
            setSessions(prev => prev.map(s =>
              s.id === payload.new.id ? { ...s, ...payload.new } : s
            ));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Calculate runtime for each session
  const sessionsWithRuntime = sessions.map(session => ({
    ...session,
    runtimeMinutes: session.started_at
      ? (Date.now() - new Date(session.started_at).getTime()) / (1000 * 60)
      : 0
  }));

  return {
    sessions: sessionsWithRuntime,
    isLoading,
    error,
    refresh: () => loadSessions(false) // Silent refresh when user clicks
  };
}

export default useActiveSessions;
