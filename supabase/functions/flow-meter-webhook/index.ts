// ================================================================
// FLOW METER WEBHOOK - Real-time Flow Data Processing
// Handles high-frequency flow readings with state machine logic
// for automatic irrigation event detection
// ================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-timestamp, x-signature',
}

interface FlowReading {
  flow_rate_gpm: number
  cumulative_gallons?: number
  pulse_count?: number
  battery_level?: number
  signal_strength?: number
  timestamp?: string | number
  zone_number?: number
}

interface Device {
  id: string
  user_id: string
  device_name: string
  webhook_token: string
  current_state: string
  current_session_id: string | null
  flow_start_threshold_gpm: number
  flow_stop_threshold_gpm: number
  min_session_duration_minutes: number
  min_session_gallons: number
  consecutive_start_readings: number
  consecutive_stop_readings: number
  consecutive_flow_readings: number
  hmac_secret: string | null
  auth_method: string
}

interface ZoneMapping {
  id: string
  block_id: string | null
  flow_rate_gpm: number
  irrigation_method: string
}

interface Session {
  id: string
  total_gallons: number
  reading_count: number
  avg_flow_rate_gpm: number
  peak_flow_rate_gpm: number
  consecutive_zero_readings: number
  started_at: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // =====================================================
    // 1. AUTHENTICATION
    // =====================================================
    const url = new URL(req.url)
    const queryToken = url.searchParams.get('token')
    const headerToken = req.headers.get('authorization')?.replace('Bearer ', '')
    // Prefer query token (device webhook token) over header token (could be Supabase JWT)
    const webhookToken = queryToken || headerToken

    if (!webhookToken) {
      return errorResponse(401, 'Missing webhook token')
    }

    // Parse payload
    const webhookData: FlowReading = await req.json()
    console.log('Received flow reading:', webhookData)

    // Validate required fields
    if (typeof webhookData.flow_rate_gpm !== 'number') {
      return errorResponse(400, 'Missing required field: flow_rate_gpm')
    }

    // =====================================================
    // 2. DEVICE LOOKUP
    // =====================================================
    const { data: device, error: deviceError } = await supabase
      .from('irrigation_devices')
      .select('*')
      .eq('webhook_token', webhookToken)
      .eq('is_active', true)
      .single()

    if (deviceError || !device) {
      console.error('Device lookup error:', deviceError)
      return errorResponse(403, 'Invalid webhook token or device not found')
    }

    // Optional: HMAC verification for enhanced security
    if (device.auth_method === 'hmac' && device.hmac_secret) {
      const timestamp = req.headers.get('x-timestamp')
      const signature = req.headers.get('x-signature')

      if (!timestamp || !signature) {
        return errorResponse(401, 'Missing HMAC headers (x-timestamp, x-signature)')
      }

      // Verify timestamp is recent (within 5 minutes)
      const timestampMs = parseInt(timestamp)
      if (isNaN(timestampMs) || Date.now() - timestampMs > 300000) {
        return errorResponse(401, 'Request timestamp expired')
      }

      // Verify HMAC signature
      const payload = JSON.stringify(webhookData)
      const expectedSig = await computeHMAC(device.hmac_secret, `${timestamp}.${payload}`)
      if (signature !== expectedSig) {
        return errorResponse(401, 'Invalid HMAC signature')
      }
    }

    console.log(`Processing reading for device: ${device.device_name}`)

    // =====================================================
    // 3. ZONE MAPPING LOOKUP (optional)
    // =====================================================
    let zoneMapping: ZoneMapping | null = null

    if (webhookData.zone_number !== undefined) {
      const { data: mapping } = await supabase
        .from('device_zone_mappings')
        .select('*')
        .eq('device_id', device.id)
        .eq('zone_number', webhookData.zone_number)
        .single()

      zoneMapping = mapping
    } else {
      // If no zone_number, try to get the first/default mapping
      const { data: mapping } = await supabase
        .from('device_zone_mappings')
        .select('*')
        .eq('device_id', device.id)
        .limit(1)
        .single()

      zoneMapping = mapping
    }

    // =====================================================
    // 4. PARSE TIMESTAMP
    // =====================================================
    let readingTimestamp: Date

    if (webhookData.timestamp) {
      if (typeof webhookData.timestamp === 'number') {
        // Unix timestamp (seconds or milliseconds)
        const ts = webhookData.timestamp
        readingTimestamp = new Date(ts > 1e12 ? ts : ts * 1000)
      } else {
        readingTimestamp = new Date(webhookData.timestamp)
      }
    } else {
      readingTimestamp = new Date()
    }

    // =====================================================
    // 5. STORE FLOW READING
    // =====================================================
    const { error: readingError } = await supabase
      .from('flow_readings')
      .insert({
        user_id: device.user_id,
        device_id: device.id,
        zone_mapping_id: zoneMapping?.id || null,
        flow_rate_gpm: webhookData.flow_rate_gpm,
        cumulative_gallons: webhookData.cumulative_gallons,
        pulse_count: webhookData.pulse_count,
        battery_level: webhookData.battery_level,
        signal_strength: webhookData.signal_strength,
        reading_timestamp: readingTimestamp.toISOString(),
        raw_data: webhookData
      })

    if (readingError) {
      console.error('Failed to insert flow reading:', readingError)
    }

    // =====================================================
    // 6. UPDATE LATEST READING (for efficient UI subscriptions)
    // =====================================================
    await supabase
      .from('flow_readings_latest')
      .upsert({
        device_id: device.id,
        user_id: device.user_id,
        zone_mapping_id: zoneMapping?.id || null,
        flow_rate_gpm: webhookData.flow_rate_gpm,
        cumulative_gallons: webhookData.cumulative_gallons,
        battery_level: webhookData.battery_level,
        signal_strength: webhookData.signal_strength,
        reading_timestamp: readingTimestamp.toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'device_id' })

    // =====================================================
    // 7. UPDATE DEVICE LAST SEEN
    // =====================================================
    await supabase
      .from('irrigation_devices')
      .update({
        last_seen_at: new Date().toISOString(),
        current_state: device.current_state === 'offline' ? 'idle' : device.current_state
      })
      .eq('id', device.id)

    // =====================================================
    // 8. STATE MACHINE PROCESSING
    // =====================================================
    const flowRate = webhookData.flow_rate_gpm
    const startThreshold = device.flow_start_threshold_gpm || 0.5
    const stopThreshold = device.flow_stop_threshold_gpm || 0.2
    const consecutiveStartRequired = device.consecutive_start_readings || 2
    const consecutiveStopRequired = device.consecutive_stop_readings || 3

    let newState = device.current_state || 'idle'
    let newSessionId = device.current_session_id
    let sessionAction: 'none' | 'started' | 'updated' | 'ended' | 'dropped' = 'none'
    let irrigationEvent = null

    if (device.current_state === 'idle' || device.current_state === 'offline') {
      // =====================================================
      // STATE: IDLE - Check if irrigation is starting
      // =====================================================
      if (flowRate >= startThreshold) {
        const newConsecutive = (device.consecutive_flow_readings || 0) + 1

        if (newConsecutive >= consecutiveStartRequired) {
          // Start new session
          const { data: session, error: sessionError } = await supabase
            .from('irrigation_sessions')
            .insert({
              user_id: device.user_id,
              device_id: device.id,
              zone_mapping_id: zoneMapping?.id || null,
              block_id: zoneMapping?.block_id || null,
              state: 'running',
              started_at: readingTimestamp.toISOString(),
              total_gallons: 0,
              avg_flow_rate_gpm: flowRate,
              peak_flow_rate_gpm: flowRate,
              reading_count: 1
            })
            .select()
            .single()

          if (!sessionError && session) {
            newState = 'running'
            newSessionId = session.id
            sessionAction = 'started'

            // Create alert for flow started
            await createAlert(supabase, device, zoneMapping, 'flow_started', 'info',
              `Irrigation started on ${device.device_name}`, flowRate)

            console.log(`Session started: ${session.id}`)
          }

          // Reset consecutive counter
          await supabase
            .from('irrigation_devices')
            .update({ consecutive_flow_readings: 0, current_state: newState, current_session_id: newSessionId })
            .eq('id', device.id)
        } else {
          // Increment consecutive counter
          await supabase
            .from('irrigation_devices')
            .update({ consecutive_flow_readings: newConsecutive })
            .eq('id', device.id)
        }
      } else {
        // Reset consecutive counter if flow dropped
        if (device.consecutive_flow_readings > 0) {
          await supabase
            .from('irrigation_devices')
            .update({ consecutive_flow_readings: 0 })
            .eq('id', device.id)
        }
      }
    } else if (device.current_state === 'running' && device.current_session_id) {
      // =====================================================
      // STATE: RUNNING - Update session or check for end
      // =====================================================
      const { data: session } = await supabase
        .from('irrigation_sessions')
        .select('*')
        .eq('id', device.current_session_id)
        .single()

      if (session) {
        // Calculate incremental gallons (assume 30 second interval)
        const intervalMinutes = 0.5  // Could be calculated from timestamps
        const incrementalGallons = flowRate * intervalMinutes

        const newTotalGallons = (session.total_gallons || 0) + incrementalGallons
        const newReadingCount = (session.reading_count || 0) + 1
        const newAvgFlowRate = ((session.avg_flow_rate_gpm || 0) * session.reading_count + flowRate) / newReadingCount
        const newPeakFlowRate = Math.max(session.peak_flow_rate_gpm || 0, flowRate)

        if (flowRate < stopThreshold) {
          // Flow is below stop threshold
          const newConsecutiveZero = (session.consecutive_zero_readings || 0) + 1

          if (newConsecutiveZero >= consecutiveStopRequired) {
            // End the session
            const endedAt = readingTimestamp
            const durationMinutes = (endedAt.getTime() - new Date(session.started_at).getTime()) / (1000 * 60)

            // Check if session should be dropped
            const minDuration = device.min_session_duration_minutes || 3
            const minGallons = device.min_session_gallons || 5

            let finalState: 'ended' | 'dropped' = 'ended'
            let droppedReason: string | null = null

            if (durationMinutes < minDuration) {
              finalState = 'dropped'
              droppedReason = `Duration too short: ${durationMinutes.toFixed(1)} min < ${minDuration} min`
            } else if (newTotalGallons < minGallons) {
              finalState = 'dropped'
              droppedReason = `Volume too small: ${newTotalGallons.toFixed(1)} gal < ${minGallons} gal`
            }

            // Update session
            await supabase
              .from('irrigation_sessions')
              .update({
                state: finalState,
                ended_at: endedAt.toISOString(),
                duration_minutes: durationMinutes,
                total_gallons: newTotalGallons,
                avg_flow_rate_gpm: newAvgFlowRate,
                peak_flow_rate_gpm: newPeakFlowRate,
                reading_count: newReadingCount,
                dropped_reason: droppedReason,
                updated_at: new Date().toISOString()
              })
              .eq('id', session.id)

            // Create irrigation_event from session (for legacy compatibility)
            if (finalState === 'ended' && zoneMapping?.block_id) {
              const { data: event, error: eventError } = await supabase
                .from('irrigation_events')
                .insert({
                  user_id: device.user_id,
                  block_id: zoneMapping.block_id,
                  event_date: new Date(session.started_at).toISOString().split('T')[0],
                  duration_hours: durationMinutes / 60,
                  flow_rate_gpm: Math.round(newAvgFlowRate),
                  total_water_gallons: Math.round(newTotalGallons),
                  irrigation_method: zoneMapping.irrigation_method || 'drip',
                  source: 'webhook',
                  notes: `Auto-logged from ${device.device_name} at ${new Date(session.started_at).toLocaleTimeString()} (${Math.round(durationMinutes)} min, Session ${session.id.slice(0, 8)})`
                })
                .select()
                .single()

              if (eventError) {
                console.error('Failed to create irrigation_event:', eventError)
              } else {
                irrigationEvent = event
                console.log(`Created irrigation_event: ${event?.id}`)
              }
            }

            // Update device state
            newState = 'idle'
            newSessionId = null
            sessionAction = finalState === 'ended' ? 'ended' : 'dropped'

            await supabase
              .from('irrigation_devices')
              .update({
                current_state: 'idle',
                current_session_id: null,
                consecutive_flow_readings: 0
              })
              .eq('id', device.id)

            // Create alert
            if (finalState === 'ended') {
              await createAlert(supabase, device, zoneMapping, 'flow_stopped', 'info',
                `Irrigation ended on ${device.device_name}: ${durationMinutes.toFixed(0)} min, ${newTotalGallons.toFixed(0)} gal`, flowRate)
            }

            console.log(`Session ${finalState}: ${session.id} - ${durationMinutes.toFixed(1)} min, ${newTotalGallons.toFixed(1)} gal`)
          } else {
            // Just increment zero counter
            await supabase
              .from('irrigation_sessions')
              .update({
                total_gallons: newTotalGallons,
                avg_flow_rate_gpm: newAvgFlowRate,
                peak_flow_rate_gpm: newPeakFlowRate,
                reading_count: newReadingCount,
                consecutive_zero_readings: newConsecutiveZero,
                updated_at: new Date().toISOString()
              })
              .eq('id', session.id)

            sessionAction = 'updated'
          }
        } else {
          // Flow is active - update session
          await supabase
            .from('irrigation_sessions')
            .update({
              total_gallons: newTotalGallons,
              avg_flow_rate_gpm: newAvgFlowRate,
              peak_flow_rate_gpm: newPeakFlowRate,
              reading_count: newReadingCount,
              consecutive_zero_readings: 0,  // Reset zero counter
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id)

          sessionAction = 'updated'
        }
      }
    }

    // =====================================================
    // 9. BATTERY LOW ALERT
    // =====================================================
    if (webhookData.battery_level !== undefined && webhookData.battery_level <= 20) {
      // Check if we already have an unresolved battery alert
      const { data: existingAlert } = await supabase
        .from('device_alerts')
        .select('id')
        .eq('device_id', device.id)
        .eq('alert_type', 'battery_low')
        .is('resolved_at', null)
        .single()

      if (!existingAlert) {
        await createAlert(supabase, device, zoneMapping, 'battery_low',
          webhookData.battery_level <= 10 ? 'critical' : 'warning',
          `Battery low on ${device.device_name}: ${webhookData.battery_level}%`,
          flowRate)
      }
    }

    // =====================================================
    // 10. RESPONSE
    // =====================================================
    return new Response(
      JSON.stringify({
        success: true,
        device_id: device.id,
        device_name: device.device_name,
        current_state: newState,
        session_id: newSessionId,
        session_action: sessionAction,
        irrigation_event_id: irrigationEvent?.id || null,
        reading_timestamp: readingTimestamp.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function errorResponse(status: number, message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function computeHMAC(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function createAlert(
  supabase: any,
  device: Device,
  zoneMapping: ZoneMapping | null,
  alertType: string,
  severity: string,
  message: string,
  flowRate?: number
) {
  await supabase
    .from('device_alerts')
    .insert({
      user_id: device.user_id,
      device_id: device.id,
      zone_mapping_id: zoneMapping?.id || null,
      alert_type: alertType,
      severity,
      message,
      flow_rate_gpm: flowRate,
      expected_flow_rate_gpm: zoneMapping?.flow_rate_gpm
    })
}
