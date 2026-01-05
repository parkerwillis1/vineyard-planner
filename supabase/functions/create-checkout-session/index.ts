import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@16.6.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');

if (!stripeSecret) {
  console.error('[Stripe] STRIPE_SECRET_KEY is not configured in Supabase environment variables');
  throw new Error('Missing Stripe secret key');
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Server-side Price ID mapping (CRITICAL: Use PRICE IDs, not PRODUCT IDs)
// These are Supabase Edge Function secrets, NOT client-side VITE_* variables
const PRICE_ID_MAP: Record<string, string | undefined> = {
  professional: Deno.env.get('STRIPE_PRICE_PROFESSIONAL'), // $49/month Vineyard
  estate: Deno.env.get('STRIPE_PRICE_ESTATE'),             // $109/month Vineyard + Winery
  enterprise: Deno.env.get('STRIPE_PRICE_ENTERPRISE'),     // $249/month Enterprise
};

// CORS allowlist for production security
const ALLOWED_ORIGINS = [
  'https://trellisag.com',
  'https://www.trellisag.com',
  'http://localhost:5173',
  'http://localhost:5176',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is in allowlist
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
  }

  try {
    // SECURITY: Verify JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Stripe] Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authentication token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client for auth verification
    // Use service role key OR create client that can verify JWTs
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Stripe] Missing Supabase URL or Service Role Key');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    // Use service role key to verify the JWT
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify user from JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[Stripe] Auth verification failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    // SECURITY: Derive userId and email from verified JWT (don't trust client)
    const userId = user.id;
    const email = user.email;

    if (!email) {
      console.error('[Stripe] User has no email address');
      return new Response(
        JSON.stringify({ error: 'User email is required for checkout' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    console.log('[Stripe] Authenticated user:', user.id);

    const { tierId } = await req.json();

    // Validate tierId
    if (!tierId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: tierId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    // SECURITY: Validate tierId is in our allowlist
    if (!PRICE_ID_MAP.hasOwnProperty(tierId)) {
      console.error(`[Stripe] Invalid tier requested: ${tierId}`);
      console.error('[Stripe] Valid tiers:', Object.keys(PRICE_ID_MAP));
      return new Response(
        JSON.stringify({ error: `Invalid tier: ${tierId}. Must be one of: ${Object.keys(PRICE_ID_MAP).join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    // Map tierId to Price ID server-side (SECURITY: Never trust client for Price IDs)
    const priceId = PRICE_ID_MAP[tierId];

    if (!priceId) {
      console.error(`[Stripe] No Price ID configured for tier: ${tierId}`);
      console.error('[Stripe] Available tiers:', Object.keys(PRICE_ID_MAP));
      return new Response(
        JSON.stringify({ error: `Price ID not configured for tier: ${tierId}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const origin = req.headers.get('origin') ?? Deno.env.get('APP_BASE_URL') ?? 'http://localhost:5173';

    console.log('[Stripe] Creating checkout session with:', {
      tierId,
      priceId, // Server-determined, not client-provided
      userId,
      email,
      mode: 'subscription',
      trial_period_days: 14,
    });

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      payment_method_types: ['card'],
      payment_method_collection: 'always', // Collect card up-front during trial
      // Add 14-day free trial
      subscription_data: {
        trial_period_days: 14,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel', // Cancel if no payment method at trial end
          },
        },
        metadata: {
          userId,
          tierId,
        },
      },
      success_url: `${origin}/account/settings?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      allow_promotion_codes: true,
      metadata: {
        userId,
        tierId,
      },
    });

    console.log('[Stripe] Checkout session created:', {
      sessionId: session.id,
      mode: session.mode,
      url: session.url,
      subscription: session.subscription,
      payment_status: session.payment_status,
    });

    // Log subscription_data to verify trial configuration was accepted
    console.log('[Stripe] Session subscription config:', {
      subscription_data: {
        trial_period_days: 14,
        trial_settings: session.subscription_data?.trial_settings,
      },
    });

    // Fetch and log the subscription details if available (usually not created until checkout completes)
    if (session.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        console.log('[Stripe] Subscription details:', {
          id: subscription.id,
          status: subscription.status,
          trial_end: subscription.trial_end,
          trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          trial_start: subscription.trial_start,
        });
      } catch (err) {
        console.log('[Stripe] Could not fetch subscription (normal - created after checkout completes):', err.message);
      }
    } else {
      console.log('[Stripe] Subscription will be created when customer completes checkout');
    }

    // Return the checkout URL for direct redirect (modern approach)
    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error) {
    console.error('[Stripe] create-checkout-session error', error);
    return new Response(
      JSON.stringify({ error: error.message ?? 'Unknown error creating checkout session' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
});
