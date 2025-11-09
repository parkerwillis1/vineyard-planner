// Supabase Edge Function to proxy Sentinel Hub API requests
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SENTINEL_HUB_BASE_URL = 'https://services.sentinel-hub.com';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Parse request body ONCE - this is important!
    const requestData = await req.json();
    const { action, body, clientId, clientSecret, token } = requestData;

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Missing Sentinel Hub credentials' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Handle OAuth token request
    if (action === 'auth') {
      const tokenResponse = await fetch(`${SENTINEL_HUB_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Sentinel Hub auth failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Authentication failed', details: errorText }),
          {
            status: tokenResponse.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }

      const tokenData = await tokenResponse.json();
      return new Response(JSON.stringify(tokenData), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    // Handle Process API request (NDVI)
    if (action === 'process') {
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Missing access token' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }

      const processResponse = await fetch(`${SENTINEL_HUB_BASE_URL}/api/v1/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/tar',
        },
        body: JSON.stringify(body),
      });

      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        console.error('Sentinel Hub process failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Process request failed', details: errorText }),
          {
            status: processResponse.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }

      // Return the binary response (TAR archive)
      const blob = await processResponse.blob();
      return new Response(blob, {
        headers: {
          'Content-Type': 'application/tar',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Error in sentinel-hub-proxy:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
