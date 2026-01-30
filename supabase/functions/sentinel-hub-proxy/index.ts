// Supabase Edge Function to proxy Sentinel Hub API requests
// With rate limiting, request logging, and error handling
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SENTINEL_HUB_BASE_URL = 'https://services.sentinel-hub.com';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Error response helper
function errorResponse(message: string, status: number, details?: any, retryAfter?: number) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...corsHeaders
  };

  if (retryAfter) {
    headers['Retry-After'] = String(retryAfter);
  }

  return new Response(
    JSON.stringify({
      error: message,
      details,
      retryAfter,
      code: status === 429 ? 'RATE_LIMITED' : 'ERROR'
    }),
    { status, headers }
  );
}

// Success response helper
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Extract user identifier from request
function getIdentifier(req: Request, userId?: string): string {
  // Prefer user ID if available
  if (userId) return `user:${userId}`;

  // Fallback to IP-based identifier (hashed for privacy)
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

  // Simple hash for privacy
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i);
    hash = hash & hash;
  }
  return `ip:${Math.abs(hash).toString(36)}`;
}

// Get user's subscription tier
async function getUserTier(supabase: any, userId?: string): Promise<string> {
  if (!userId) return 'free';

  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .single();

    return data?.tier || 'free';
  } catch {
    return 'free';
  }
}

// Check rate limit using Supabase function
async function checkRateLimit(
  supabase: any,
  identifier: string,
  bucketKey: string,
  tier: string
): Promise<{ allowed: boolean; tokensRemaining: number; retryAfter: number }> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_bucket_key: bucketKey,
      p_tier: tier,
      p_tokens_to_consume: 1
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow request if rate limit check fails
      return { allowed: true, tokensRemaining: -1, retryAfter: 0 };
    }

    return {
      allowed: data.allowed,
      tokensRemaining: data.tokens_remaining,
      retryAfter: data.retry_after_seconds
    };
  } catch (err) {
    console.error('Rate limit error:', err);
    return { allowed: true, tokensRemaining: -1, retryAfter: 0 };
  }
}

// Log API request for analytics
async function logRequest(
  supabase: any,
  identifier: string,
  action: string,
  success: boolean,
  durationMs: number,
  metadata?: any
) {
  try {
    // Fire and forget - don't block on logging
    supabase.from('api_request_logs').insert({
      identifier,
      action,
      success,
      duration_ms: durationMs,
      metadata,
      created_at: new Date().toISOString()
    }).then(() => {});
  } catch {
    // Ignore logging errors
  }
}

serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client with service role for rate limiting
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get Sentinel Hub credentials from server-side environment variables (NOT from client)
  const clientId = Deno.env.get('SENTINEL_HUB_CLIENT_ID');
  const clientSecret = Deno.env.get('SENTINEL_HUB_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.error('Sentinel Hub credentials not configured in Edge Function secrets');
    return errorResponse('Sentinel Hub not configured', 500);
  }

  try {
    // Parse request body
    const requestData = await req.json();
    const { action, body, token } = requestData;

    // Extract user ID from authorization header if present
    let userId: string | undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = authHeader.substring(7);
        // Decode JWT to get user ID (without verification - Supabase handles that)
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        userId = payload.sub;
      } catch {
        // Ignore JWT parse errors
      }
    }

    const identifier = getIdentifier(req, userId);
    const tier = await getUserTier(supabase, userId);

    // =========================================================================
    // AUTH ACTION - No rate limiting for auth
    // =========================================================================
    if (action === 'auth') {
      const tokenResponse = await fetch(`${SENTINEL_HUB_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Sentinel Hub auth failed:', errorText);
        return errorResponse('Authentication failed', tokenResponse.status, errorText);
      }

      const tokenData = await tokenResponse.json();
      return jsonResponse(tokenData);
    }

    // =========================================================================
    // CATALOG ACTION - Rate limited
    // =========================================================================
    if (action === 'catalog') {
      if (!token) {
        return errorResponse('Missing access token', 400);
      }

      // Check rate limit
      const rateLimit = await checkRateLimit(supabase, identifier, 'sentinel-hub:catalog', tier);
      if (!rateLimit.allowed) {
        console.log(`Rate limited: ${identifier} on catalog (tier: ${tier})`);
        return errorResponse(
          'Rate limit exceeded. Please wait before making more requests.',
          429,
          { tokensRemaining: rateLimit.tokensRemaining, tier },
          rateLimit.retryAfter
        );
      }

      const catalogResponse = await fetch(`${SENTINEL_HUB_BASE_URL}/api/v1/catalog/1.0.0/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const duration = Date.now() - startTime;
      logRequest(supabase, identifier, 'catalog', catalogResponse.ok, duration, {
        collections: body?.collections,
        dateRange: body?.datetime
      });

      if (!catalogResponse.ok) {
        const errorText = await catalogResponse.text();
        console.error('Sentinel Hub catalog search failed:', errorText);
        return errorResponse('Catalog search failed', catalogResponse.status, errorText);
      }

      const catalogData = await catalogResponse.json();

      // Add rate limit info to response headers
      return new Response(JSON.stringify(catalogData), {
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.tokensRemaining),
          ...corsHeaders
        }
      });
    }

    // =========================================================================
    // PROCESS ACTION - Rate limited (higher cost)
    // =========================================================================
    if (action === 'process') {
      if (!token) {
        return errorResponse('Missing access token', 400);
      }

      // Check rate limit (process is more expensive)
      const rateLimit = await checkRateLimit(supabase, identifier, 'sentinel-hub:process', tier);
      if (!rateLimit.allowed) {
        console.log(`Rate limited: ${identifier} on process (tier: ${tier})`);
        return errorResponse(
          'Rate limit exceeded for NDVI processing. Please wait before making more requests.',
          429,
          { tokensRemaining: rateLimit.tokensRemaining, tier },
          rateLimit.retryAfter
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

      const duration = Date.now() - startTime;
      logRequest(supabase, identifier, 'process', processResponse.ok, duration, {
        resolution: body?.output?.width,
        dataCollection: body?.input?.data?.[0]?.type
      });

      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        console.error('Sentinel Hub process failed:', errorText);

        // Parse error for better client-side handling
        let errorCode = 'PROCESS_FAILED';
        if (processResponse.status === 429) errorCode = 'UPSTREAM_RATE_LIMITED';
        if (processResponse.status >= 500) errorCode = 'UPSTREAM_ERROR';
        if (errorText.includes('geometry')) errorCode = 'INVALID_GEOMETRY';

        return new Response(
          JSON.stringify({
            error: 'Process request failed',
            details: errorText,
            code: errorCode
          }),
          {
            status: processResponse.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      // Return the binary response (TAR archive)
      const blob = await processResponse.blob();
      return new Response(blob, {
        headers: {
          'Content-Type': 'application/tar',
          'X-RateLimit-Remaining': String(rateLimit.tokensRemaining),
          ...corsHeaders,
        },
      });
    }

    return errorResponse('Invalid action', 400);

  } catch (error) {
    console.error('Error in sentinel-hub-proxy:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
