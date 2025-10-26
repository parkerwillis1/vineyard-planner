import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@16.6.0?target=deno';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');

if (!stripeSecret) {
  console.error('[Stripe] STRIPE_SECRET_KEY is not configured in Supabase environment variables');
  throw new Error('Missing Stripe secret key');
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
  }

  try {
    const { priceId, tierId, userId, email } = await req.json();

    if (!priceId || !tierId || !userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields for checkout session' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const origin = req.headers.get('origin') ?? Deno.env.get('APP_BASE_URL') ?? 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/account/settings?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      metadata: {
        userId,
        tierId,
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id }),
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
