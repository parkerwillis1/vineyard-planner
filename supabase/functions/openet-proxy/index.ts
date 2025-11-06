import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const OPENET_API_URL = 'https://openet-api.org/raster/timeseries/point';
const openETApiKey = Deno.env.get('OPENET_API_KEY');

if (!openETApiKey) {
  console.error('[OpenET Proxy] Missing OPENET_API_KEY environment variable');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  console.log('[OpenET Proxy] Received request');

  if (!openETApiKey) {
    console.error('[OpenET Proxy] Missing API key');
    return new Response(
      JSON.stringify({ error: 'OpenET API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body
    const requestBody = await req.json();
    console.log('[OpenET Proxy] Request body:', requestBody);

    // Validate required fields
    if (!requestBody.geometry || !requestBody.start_date || !requestBody.end_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: geometry, start_date, end_date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Forward request to OpenET API
    // NOTE: OpenET uses direct API key, NOT "Bearer" prefix
    console.log('[OpenET Proxy] Forwarding to OpenET API...');
    const response = await fetch(OPENET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': openETApiKey
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[OpenET Proxy] OpenET API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenET Proxy] OpenET API error:', response.status, errorText);

      return new Response(
        JSON.stringify({
          error: 'OpenET API request failed',
          status: response.status,
          details: errorText
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return successful response
    const data = await response.json();
    console.log('[OpenET Proxy] Successfully fetched data');

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (err) {
    console.error('[OpenET Proxy] Error:', err);
    return new Response(
      JSON.stringify({
        error: 'Proxy error',
        message: err.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
