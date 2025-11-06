import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HydrawiseZoneRun {
  relay_id: number
  start_time: string
  end_time: string
  run_duration: number
  water_used?: number
}

interface HydrawiseController {
  controller_id: number
  name: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Starting Hydrawise polling job...')

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all active Hunter Hydrawise devices
    const { data: devices, error: devicesError } = await supabase
      .from('irrigation_devices')
      .select('*')
      .eq('device_type', 'hunter')
      .eq('is_active', true)

    if (devicesError) {
      console.error('Error fetching devices:', devicesError)
      throw devicesError
    }

    if (!devices || devices.length === 0) {
      console.log('No active Hydrawise devices found')
      return new Response(
        JSON.stringify({ message: 'No active Hydrawise devices', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${devices.length} Hydrawise device(s)`)

    let totalEventsCreated = 0

    // Poll each device
    for (const device of devices) {
      if (!device.api_key) {
        console.warn(`Device ${device.device_name} has no API key, skipping`)
        continue
      }

      try {
        console.log(`Polling device: ${device.device_name}`)

        // Calculate time range (last sync or last 24 hours)
        const lastSync = device.last_sync_at ? new Date(device.last_sync_at) : new Date(Date.now() - 24 * 60 * 60 * 1000)
        const now = new Date()

        // Fetch status from Hydrawise API
        const hydrawiseUrl = `https://api.hydrawise.com/api/v1/statusSchedule.php?api_key=${device.api_key}`
        const response = await fetch(hydrawiseUrl)

        if (!response.ok) {
          console.error(`Hydrawise API error for ${device.device_name}: ${response.status}`)
          continue
        }

        const data = await response.json()

        // Get zone mappings for this device
        const { data: zoneMappings, error: mappingsError } = await supabase
          .from('device_zone_mappings')
          .select('*')
          .eq('device_id', device.id)

        if (mappingsError) {
          console.error('Error fetching zone mappings:', mappingsError)
          continue
        }

        if (!zoneMappings || zoneMappings.length === 0) {
          console.log(`No zone mappings for device ${device.device_name}, skipping`)
          continue
        }

        // Process each relay (zone)
        const relays = data.relays || []

        for (const relay of relays) {
          // Find zone mapping
          const zoneMapping = zoneMappings.find(m => m.zone_number === relay.relay)

          if (!zoneMapping) {
            console.log(`No mapping for relay ${relay.relay}, skipping`)
            continue
          }

          // Check for recent runs in the timeLog
          const timeLog = relay.timeLog || []

          for (const run of timeLog) {
            const startTime = new Date(run.start_time * 1000) // Unix timestamp to Date
            const endTime = new Date(run.end_time * 1000)

            // Only process runs since last sync
            if (startTime < lastSync) {
              continue
            }

            // Check if this event already exists
            const eventDate = startTime.toISOString().split('T')[0]
            const { data: existingEvent } = await supabase
              .from('irrigation_events')
              .select('id')
              .eq('user_id', device.user_id)
              .eq('block_id', zoneMapping.block_id)
              .eq('event_date', eventDate)
              .eq('device_id', device.id)
              .eq('zone_number', relay.relay)
              .eq('source', 'webhook')
              .single()

            if (existingEvent) {
              console.log(`Event already exists for zone ${relay.relay} on ${eventDate}, skipping`)
              continue
            }

            // Calculate duration and water usage
            const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
            const totalGallons = zoneMapping.flow_rate_gpm * 60 * durationHours

            console.log(`Creating event for zone ${relay.relay}: ${durationHours.toFixed(2)} hours, ${totalGallons.toFixed(0)} gallons`)

            // Create irrigation event
            const { error: eventError } = await supabase
              .from('irrigation_events')
              .insert({
                user_id: device.user_id,
                block_id: zoneMapping.block_id,
                event_date: eventDate,
                duration_hours: durationHours,
                flow_rate_gpm: zoneMapping.flow_rate_gpm,
                total_water_gallons: totalGallons,
                irrigation_method: zoneMapping.irrigation_method || 'drip',
                source: 'webhook',
                device_id: device.id,
                zone_number: relay.relay,
                notes: `Auto-logged from ${device.device_name} via Hydrawise API (Zone ${relay.relay})`
              })

            if (eventError) {
              console.error('Error creating event:', eventError)
            } else {
              totalEventsCreated++
              console.log(`✅ Created event for ${device.device_name} zone ${relay.relay}`)
            }
          }
        }

        // Update device last sync time
        await supabase
          .from('irrigation_devices')
          .update({ last_sync_at: now.toISOString() })
          .eq('id', device.id)

        console.log(`✅ Finished polling ${device.device_name}`)

      } catch (error) {
        console.error(`Error polling device ${device.device_name}:`, error)
        continue
      }
    }

    console.log(`🎉 Polling complete. Created ${totalEventsCreated} new events.`)

    return new Response(
      JSON.stringify({
        success: true,
        devices_polled: devices.length,
        events_created: totalEventsCreated,
        message: `Hydrawise polling complete`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Polling error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
