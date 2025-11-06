import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get webhook token from query params or authorization header
    const url = new URL(req.url)
    const webhookToken = url.searchParams.get('token') || req.headers.get('authorization')?.replace('Bearer ', '')

    if (!webhookToken) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse webhook payload
    const webhookData = await req.json()

    console.log('Received webhook data:', webhookData)

    // Validate required fields
    if (!webhookData.zone_number || !webhookData.start_time || !webhookData.end_time) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          required: ['zone_number', 'start_time', 'end_time']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find device by webhook token
    const { data: device, error: deviceError } = await supabase
      .from('irrigation_devices')
      .select('*')
      .eq('webhook_token', webhookToken)
      .eq('is_active', true)
      .single()

    if (deviceError || !device) {
      console.error('Device lookup error:', deviceError)
      return new Response(
        JSON.stringify({ error: 'Invalid webhook token or device not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found device:', device.device_name)

    // Find zone mapping
    const { data: zoneMapping, error: mappingError } = await supabase
      .from('device_zone_mappings')
      .select('*')
      .eq('device_id', device.id)
      .eq('zone_number', webhookData.zone_number)
      .single()

    if (mappingError || !zoneMapping) {
      console.error('Zone mapping error:', mappingError)
      return new Response(
        JSON.stringify({
          error: 'Zone mapping not found',
          device_id: device.id,
          zone_number: webhookData.zone_number
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found zone mapping to block:', zoneMapping.block_id)

    // Calculate irrigation data
    const startTime = new Date(webhookData.start_time)
    const endTime = new Date(webhookData.end_time)
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

    // Use total gallons from webhook or calculate from flow rate
    let totalGallons = webhookData.total_gallons
    if (!totalGallons && webhookData.flow_rate_avg && durationHours) {
      totalGallons = webhookData.flow_rate_avg * 60 * durationHours
    }
    if (!totalGallons && zoneMapping.flow_rate_gpm && durationHours) {
      totalGallons = zoneMapping.flow_rate_gpm * 60 * durationHours
    }

    console.log('Calculated:', { durationHours, totalGallons })

    // Create irrigation event
    const { data: event, error: eventError } = await supabase
      .from('irrigation_events')
      .insert({
        user_id: device.user_id,
        block_id: zoneMapping.block_id,
        event_date: startTime.toISOString().split('T')[0],
        duration_hours: durationHours,
        flow_rate_gpm: webhookData.flow_rate_avg || zoneMapping.flow_rate_gpm,
        total_water_gallons: totalGallons,
        irrigation_method: zoneMapping.irrigation_method || 'drip',
        source: 'webhook',
        device_id: device.id,
        zone_number: webhookData.zone_number,
        notes: webhookData.notes || `Auto-logged from ${device.device_name} (Zone ${webhookData.zone_number})`
      })
      .select()
      .single()

    if (eventError) {
      console.error('Event creation error:', eventError)
      return new Response(
        JSON.stringify({ error: 'Failed to create irrigation event', details: eventError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update device last sync time
    await supabase
      .from('irrigation_devices')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', device.id)

    console.log('✅ Successfully created irrigation event:', event.id)

    return new Response(
      JSON.stringify({
        success: true,
        event_id: event.id,
        message: `Irrigation event logged for ${device.device_name} zone ${webhookData.zone_number}`
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
