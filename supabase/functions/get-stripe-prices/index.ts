// Temporary utility function to retrieve LIVE Price IDs for the three products
// Run this once to get the Price IDs, then delete this function

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@16.6.0?target=deno';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');

if (!stripeSecret) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const PRODUCT_IDS = {
  professional: 'prod_TjQYCix3p5ZWBP',  // Vineyard - $49/month
  estate: 'prod_TjQrqhtHcYQAyR',        // Vineyard + Winery - $109/month
  enterprise: 'prod_TjQsHsrmLszxSk',    // End-to-End Platform - $249/month
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const results: Record<string, any> = {};

    for (const [tierName, productId] of Object.entries(PRODUCT_IDS)) {
      console.log(`\n[Stripe] Fetching prices for ${tierName} (${productId})...`);

      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        type: 'recurring',
      });

      console.log(`[Stripe] Found ${prices.data.length} active recurring prices for ${tierName}`);

      // Find monthly price
      const monthlyPrice = prices.data.find(p =>
        p.recurring?.interval === 'month' &&
        p.currency === 'usd'
      );

      if (monthlyPrice) {
        results[tierName] = {
          priceId: monthlyPrice.id,
          amount: monthlyPrice.unit_amount ? monthlyPrice.unit_amount / 100 : 0,
          currency: monthlyPrice.currency,
          interval: monthlyPrice.recurring?.interval,
          productId: productId,
        };
        console.log(`[Stripe] ✓ ${tierName}: ${monthlyPrice.id} ($${monthlyPrice.unit_amount ? monthlyPrice.unit_amount / 100 : 0}/month)`);
      } else {
        console.error(`[Stripe] ✗ No monthly USD price found for ${tierName}`);
        results[tierName] = {
          error: 'No monthly USD price found',
          productId: productId,
          allPrices: prices.data.map(p => ({
            id: p.id,
            amount: p.unit_amount,
            currency: p.currency,
            interval: p.recurring?.interval,
          })),
        };
      }
    }

    console.log('\n[Stripe] Summary:');
    console.log(JSON.stringify(results, null, 2));

    console.log('\n[Stripe] Add these to Supabase Edge Function secrets:');
    if (results.professional?.priceId) console.log(`STRIPE_PRICE_PROFESSIONAL=${results.professional.priceId}`);
    if (results.estate?.priceId) console.log(`STRIPE_PRICE_ESTATE=${results.estate.priceId}`);
    if (results.enterprise?.priceId) console.log(`STRIPE_PRICE_ENTERPRISE=${results.enterprise.priceId}`);

    return new Response(
      JSON.stringify(results, null, 2),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error: any) {
    console.error('[Stripe] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
