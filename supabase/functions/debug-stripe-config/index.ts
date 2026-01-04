// Temporary diagnostic function to check Stripe configuration
// DELETE THIS FUNCTION after debugging

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const professionalPriceId = Deno.env.get('STRIPE_PRICE_PROFESSIONAL')
    const estatePriceId = Deno.env.get('STRIPE_PRICE_ESTATE')
    const enterprisePriceId = Deno.env.get('STRIPE_PRICE_ENTERPRISE')

    const response = {
      stripeKeyConfigured: !!stripeKey,
      stripeKeyMode: stripeKey
        ? (stripeKey.startsWith('sk_live_') ? 'LIVE' : stripeKey.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN')
        : 'NOT SET',
      stripeKeyPreview: stripeKey ? `${stripeKey.substring(0, 12)}...` : 'NOT SET',
      prices: {
        professional: professionalPriceId || 'NOT SET',
        estate: estatePriceId || 'NOT SET',
        enterprise: enterprisePriceId || 'NOT SET',
      },
      diagnosis: '',
    }

    // Diagnose the issue
    if (response.stripeKeyMode === 'TEST' && professionalPriceId?.startsWith('price_')) {
      response.diagnosis = '⚠️ You are using a TEST Stripe key. Make sure your Price IDs are from TEST mode, not LIVE mode.'
    } else if (response.stripeKeyMode === 'LIVE' && professionalPriceId?.startsWith('price_')) {
      response.diagnosis = '⚠️ You are using a LIVE Stripe key. Make sure your Price IDs are from LIVE mode, not TEST mode.'
    }

    return new Response(
      JSON.stringify(response, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
