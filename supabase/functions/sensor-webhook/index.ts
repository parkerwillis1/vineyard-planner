import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

/**
 * Universal Sensor Webhook Endpoint
 *
 * Accepts data from any IoT sensor (temperature, humidity, soil moisture, etc.)
 *
 * Authentication: API key via header (X-API-Key) or query param (?api_key=xxx)
 *
 * Supported payload formats:
 *
 * 1. Temperature sensor (fermentation/aging):
 *    { "temp_f": 72.5, "humidity_percent": 55.0, "specific_gravity": 1.050 }
 *
 * 2. Soil sensor:
 *    { "soil_moisture_percent": 35.0, "soil_temp_f": 68.0 }
 *
 * 3. Generic (raw data stored):
 *    { "value": 123.45, "unit": "psi", "reading_type": "pressure" }
 *
 * Optional fields:
 *    - timestamp: ISO8601 string (defaults to now)
 *    - battery_level: 0-100
 */

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get API key from header or query param
    const url = new URL(req.url)
    const apiKey = req.headers.get('x-api-key') ||
                   req.headers.get('authorization')?.replace('Bearer ', '') ||
                   url.searchParams.get('api_key')

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Missing API key',
          hint: 'Include X-API-Key header or ?api_key= query param'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse payload
    const payload = await req.json()
    console.log('Received sensor data:', payload)

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find sensor by API key
    const { data: sensor, error: sensorError } = await supabase
      .from('temperature_sensors')
      .select('*')
      .eq('api_key', apiKey)
      .single()

    if (sensorError || !sensor) {
      console.error('Sensor lookup error:', sensorError)
      return new Response(
        JSON.stringify({ error: 'Invalid API key or sensor not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found sensor:', sensor.name, '| Type:', sensor.sensor_type)

    // Determine reading timestamp
    const readingTimestamp = payload.timestamp
      ? new Date(payload.timestamp).toISOString()
      : new Date().toISOString()

    // Handle temperature reading
    if (payload.temp_f !== undefined || payload.temp_c !== undefined || payload.temperature !== undefined) {
      // Convert to Fahrenheit if needed
      let tempF = payload.temp_f
      if (tempF === undefined && payload.temp_c !== undefined) {
        tempF = (payload.temp_c * 9/5) + 32
      }
      if (tempF === undefined && payload.temperature !== undefined) {
        // Assume Fahrenheit if not specified, or check for 'unit' field
        tempF = payload.unit === 'C' || payload.unit === 'celsius'
          ? (payload.temperature * 9/5) + 32
          : payload.temperature
      }

      // Insert temperature reading
      const { data: reading, error: readingError } = await supabase
        .from('temperature_readings')
        .insert({
          user_id: sensor.user_id,
          sensor_id: sensor.id,
          lot_id: sensor.lot_id,
          container_id: sensor.container_id,
          temp_f: tempF,
          humidity_percent: payload.humidity_percent || payload.humidity,
          specific_gravity: payload.specific_gravity || payload.sg,
          battery_level: payload.battery_level || payload.battery,
          source: 'sensor',
          reading_timestamp: readingTimestamp,
          raw_data: payload
        })
        .select()
        .single()

      if (readingError) {
        console.error('Reading insert error:', readingError)
        return new Response(
          JSON.stringify({ error: 'Failed to save reading', details: readingError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ Temperature reading saved:', reading.id, '| Temp:', tempF, 'F')

      return new Response(
        JSON.stringify({
          success: true,
          reading_id: reading.id,
          sensor_name: sensor.name,
          temp_f: tempF,
          temp_c: ((tempF - 32) * 5/9).toFixed(1),
          message: `Reading saved for ${sensor.name}`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle soil moisture reading
    if (payload.soil_moisture_percent !== undefined || payload.soil_moisture !== undefined) {
      // Check if soil_moisture_readings table exists, if so insert there
      // Otherwise store in a generic way
      const soilMoisture = payload.soil_moisture_percent || payload.soil_moisture
      const soilTemp = payload.soil_temp_f || payload.soil_temperature

      // For now, store soil data in temperature_readings with raw_data
      // This could be expanded to a dedicated soil_moisture_readings table
      const { data: reading, error: readingError } = await supabase
        .from('temperature_readings')
        .insert({
          user_id: sensor.user_id,
          sensor_id: sensor.id,
          lot_id: sensor.lot_id,
          container_id: sensor.container_id,
          temp_f: soilTemp || null,
          humidity_percent: soilMoisture, // Using humidity field for soil moisture
          battery_level: payload.battery_level || payload.battery,
          source: 'sensor',
          reading_timestamp: readingTimestamp,
          raw_data: { ...payload, reading_type: 'soil' }
        })
        .select()
        .single()

      if (readingError) {
        console.error('Soil reading insert error:', readingError)
        return new Response(
          JSON.stringify({ error: 'Failed to save soil reading', details: readingError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ Soil reading saved:', reading.id, '| Moisture:', soilMoisture, '%')

      return new Response(
        JSON.stringify({
          success: true,
          reading_id: reading.id,
          sensor_name: sensor.name,
          soil_moisture_percent: soilMoisture,
          soil_temp_f: soilTemp,
          message: `Soil reading saved for ${sensor.name}`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generic data - store in raw_data
    const { data: reading, error: readingError } = await supabase
      .from('temperature_readings')
      .insert({
        user_id: sensor.user_id,
        sensor_id: sensor.id,
        lot_id: sensor.lot_id,
        container_id: sensor.container_id,
        temp_f: payload.value || null,
        battery_level: payload.battery_level,
        source: 'sensor',
        reading_timestamp: readingTimestamp,
        raw_data: payload
      })
      .select()
      .single()

    if (readingError) {
      console.error('Generic reading insert error:', readingError)
      return new Response(
        JSON.stringify({ error: 'Failed to save reading', details: readingError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Generic reading saved:', reading.id)

    return new Response(
      JSON.stringify({
        success: true,
        reading_id: reading.id,
        sensor_name: sensor.name,
        message: `Reading saved for ${sensor.name}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Sensor webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
