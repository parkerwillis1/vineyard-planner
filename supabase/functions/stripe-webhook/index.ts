import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@16.6.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.5';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!stripeSecret || !webhookSecret) {
  console.error('[Stripe] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
  throw new Error('Stripe environment variables are not configured');
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[Stripe] Missing Supabase service role configuration');
  throw new Error('Supabase service role environment variables are not configured');
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
  }

  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const payload = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('[Stripe] Failed to verify webhook signature', err);
    return new Response('Signature verification failed', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tierId = session.metadata?.tierId;

        if (!userId || !tierId) break;

        const modules = ['planner'];
        if (tierId === 'starter') modules.push('vineyard');
        if (tierId === 'professional') modules.push('vineyard', 'production', 'inventory');
        if (tierId === 'enterprise') modules.push('vineyard', 'production', 'inventory', 'sales');

        await supabase
          .from('subscriptions')
          .update({
            tier: tierId,
            status: 'active',
            modules,
            stripe_customer_id: session.customer?.toString() ?? null,
            stripe_subscription_id: session.subscription?.toString() ?? null,
          })
          .eq('user_id', userId);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('stripe_subscription_id', invoice.subscription.toString());
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('[Stripe] Error processing webhook event', err);
    return new Response('Webhook handler failed', { status: 500 });
  }
});
