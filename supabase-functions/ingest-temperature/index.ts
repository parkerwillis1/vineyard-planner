// Supabase Edge Function: Temperature Data Ingestion
// Receives temperature readings from IoT sensors via HTTP POST
// Deploy: supabase functions deploy ingest-temperature

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get API key from header
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key. Include in X-API-Key header or Authorization: Bearer <key>' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body = await req.json()
    const { temp_f, temp_c, humidity_percent, specific_gravity, battery_level, timestamp, raw_data } = body

    // Validate required fields
    if (!temp_f && !temp_c) {
      return new Response(
        JSON.stringify({ error: 'Missing temperature. Provide temp_f (Fahrenheit) or temp_c (Celsius)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Look up sensor by API key
    const { data: sensor, error: sensorError } = await supabaseClient
      .from('temperature_sensors')
      .select('id, user_id, lot_id, container_id, name, status')
      .eq('api_key', apiKey)
      .single()

    if (sensorError || !sensor) {
      console.error('Sensor lookup error:', sensorError)
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if sensor is active
    if (sensor.status === 'inactive') {
      return new Response(
        JSON.stringify({ error: 'Sensor is inactive. Activate it in the dashboard.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert temperature if needed
    const tempF = temp_f || (temp_c * 9/5 + 32)

    // Insert temperature reading
    const { data: reading, error: insertError } = await supabaseClient
      .from('temperature_readings')
      .insert({
        user_id: sensor.user_id,
        sensor_id: sensor.id,
        lot_id: sensor.lot_id,
        container_id: sensor.container_id,
        temp_f: tempF,
        humidity_percent: humidity_percent || null,
        specific_gravity: specific_gravity || null,
        battery_level: battery_level || null,
        source: 'sensor',
        reading_timestamp: timestamp || new Date().toISOString(),
        raw_data: raw_data || body
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save reading', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for alert conditions
    const { data: alertRules } = await supabaseClient
      .from('temperature_alert_rules')
      .select('*')
      .eq('enabled', true)
      .or(`sensor_id.eq.${sensor.id},lot_id.eq.${sensor.lot_id},container_id.eq.${sensor.container_id}`)

    const triggeredAlerts = []

    if (alertRules && alertRules.length > 0) {
      for (const rule of alertRules) {
        let shouldAlert = false
        let alertType = ''
        let severity = 'warning'

        // Check temperature thresholds
        if (rule.min_temp_f && tempF < rule.min_temp_f) {
          shouldAlert = true
          alertType = 'temp_low'
          severity = tempF < (rule.min_temp_f - 5) ? 'critical' : 'warning'
        } else if (rule.max_temp_f && tempF > rule.max_temp_f) {
          shouldAlert = true
          alertType = 'temp_high'
          severity = tempF > (rule.max_temp_f + 5) ? 'critical' : 'warning'
        }

        // Check cooldown period
        if (shouldAlert && rule.last_triggered_at) {
          const cooldownEnd = new Date(rule.last_triggered_at).getTime() + (rule.cooldown_minutes * 60 * 1000)
          if (Date.now() < cooldownEnd) {
            shouldAlert = false // Still in cooldown
          }
        }

        if (shouldAlert) {
          // Create alert
          const alertMessage = alertType === 'temp_high'
            ? `Temperature ${tempF}°F exceeds maximum ${rule.max_temp_f}°F for ${sensor.name}`
            : `Temperature ${tempF}°F below minimum ${rule.min_temp_f}°F for ${sensor.name}`

          const { data: alert } = await supabaseClient
            .from('temperature_alert_history')
            .insert({
              user_id: sensor.user_id,
              alert_rule_id: rule.id,
              sensor_id: sensor.id,
              reading_id: reading.id,
              alert_type: alertType,
              severity: severity,
              message: alertMessage,
              temp_f: tempF
            })
            .select()
            .single()

          // Update rule's last triggered time
          await supabaseClient
            .from('temperature_alert_rules')
            .update({
              last_triggered_at: new Date().toISOString(),
              trigger_count: (rule.trigger_count || 0) + 1
            })
            .eq('id', rule.id)

          triggeredAlerts.push({
            alert_id: alert?.id,
            rule_name: rule.name,
            type: alertType,
            severity: severity,
            message: alertMessage
          })

          // TODO: Send email/SMS notifications here
          // Use SendGrid, Resend, or Twilio APIs
        }
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        reading_id: reading.id,
        sensor_name: sensor.name,
        temp_f: tempF,
        timestamp: reading.reading_timestamp,
        alerts: triggeredAlerts.length > 0 ? triggeredAlerts : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
