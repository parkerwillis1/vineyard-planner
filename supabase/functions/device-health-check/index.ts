// ================================================================
// DEVICE HEALTH CHECK - Cron Job for Offline Detection
// Runs periodically to detect devices that have stopped reporting
// and create appropriate alerts
// ================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Device {
  id: string
  user_id: string
  device_name: string
  device_type: string
  last_seen_at: string | null
  current_state: string
  current_session_id: string | null
  offline_threshold_minutes: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify this is called by a service role or cron
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.includes('Bearer')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const now = new Date()
    let offlineCount = 0
    let staleSessionCount = 0
    const results: string[] = []

    // =====================================================
    // 1. FIND DEVICES THAT HAVE GONE OFFLINE
    // =====================================================
    // Get all active devices that have reported at least once
    const { data: devices, error: devicesError } = await supabase
      .from('irrigation_devices')
      .select('*')
      .eq('is_active', true)
      .not('last_seen_at', 'is', null)
      .neq('current_state', 'offline')

    if (devicesError) {
      console.error('Error fetching devices:', devicesError)
      throw devicesError
    }

    console.log(`Checking ${devices?.length || 0} active devices for health...`)

    for (const device of (devices || [])) {
      const lastSeen = new Date(device.last_seen_at)
      const offlineThreshold = device.offline_threshold_minutes || 30
      const minutesSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60)

      if (minutesSinceLastSeen > offlineThreshold) {
        console.log(`Device ${device.device_name} offline: ${minutesSinceLastSeen.toFixed(0)} min since last seen`)

        // Mark device as offline
        await supabase
          .from('irrigation_devices')
          .update({
            current_state: 'offline',
            updated_at: now.toISOString()
          })
          .eq('id', device.id)

        // Check if we already have an unresolved offline alert for this device
        const { data: existingAlert } = await supabase
          .from('device_alerts')
          .select('id')
          .eq('device_id', device.id)
          .eq('alert_type', 'offline')
          .is('resolved_at', null)
          .single()

        if (!existingAlert) {
          // Create offline alert
          await supabase
            .from('device_alerts')
            .insert({
              user_id: device.user_id,
              device_id: device.id,
              alert_type: 'offline',
              severity: minutesSinceLastSeen > offlineThreshold * 2 ? 'critical' : 'warning',
              message: `Device "${device.device_name}" has been offline for ${Math.round(minutesSinceLastSeen)} minutes. Last seen at ${lastSeen.toISOString()}`
            })

          results.push(`Marked ${device.device_name} as offline (${Math.round(minutesSinceLastSeen)} min)`)
          offlineCount++
        }

        // If device had a running session, mark it as dropped
        if (device.current_session_id) {
          const { data: session } = await supabase
            .from('irrigation_sessions')
            .select('*')
            .eq('id', device.current_session_id)
            .single()

          if (session && session.state === 'running') {
            const durationMinutes = (now.getTime() - new Date(session.started_at).getTime()) / (1000 * 60)

            await supabase
              .from('irrigation_sessions')
              .update({
                state: 'dropped',
                ended_at: lastSeen.toISOString(),  // Use last known time
                duration_minutes: durationMinutes,
                dropped_reason: 'Device went offline during session',
                updated_at: now.toISOString()
              })
              .eq('id', device.current_session_id)

            await supabase
              .from('irrigation_devices')
              .update({ current_session_id: null })
              .eq('id', device.id)

            results.push(`Dropped stale session for ${device.device_name}`)
            staleSessionCount++
          }
        }
      }
    }

    // =====================================================
    // 2. AUTO-RESOLVE OLD OFFLINE ALERTS WHEN DEVICE COMES BACK
    // =====================================================
    // Find offline alerts for devices that are now online
    const { data: staleAlerts } = await supabase
      .from('device_alerts')
      .select(`
        id,
        device_id,
        device:irrigation_devices(id, current_state, device_name)
      `)
      .eq('alert_type', 'offline')
      .is('resolved_at', null)

    for (const alert of (staleAlerts || [])) {
      const device = alert.device as any
      if (device && device.current_state !== 'offline') {
        await supabase
          .from('device_alerts')
          .update({
            resolved_at: now.toISOString(),
            resolution_notes: 'Auto-resolved: Device came back online'
          })
          .eq('id', alert.id)

        results.push(`Auto-resolved offline alert for ${device.device_name}`)
      }
    }

    // =====================================================
    // 3. CLEANUP OLD FLOW READINGS (Optional retention policy)
    // Keep last 90 days of raw readings
    // =====================================================
    const retentionDays = 90
    const retentionCutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000)

    // Note: This can be expensive on large tables, consider running less frequently
    // or using partitioning
    // const { count: deletedReadings } = await supabase
    //   .from('flow_readings')
    //   .delete()
    //   .lt('received_at', retentionCutoff.toISOString())
    //   .select('count')

    // =====================================================
    // 4. RETURN SUMMARY
    // =====================================================
    console.log(`Health check complete: ${offlineCount} devices marked offline, ${staleSessionCount} stale sessions dropped`)

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        devices_checked: devices?.length || 0,
        devices_marked_offline: offlineCount,
        stale_sessions_dropped: staleSessionCount,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Health check error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
