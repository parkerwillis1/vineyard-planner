import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@16.6.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.5';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Don't throw errors - just log warnings
if (!stripeSecret || !webhookSecret) {
  console.error('[Stripe] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[Stripe] Missing Supabase service role configuration');
}

const stripe = stripeSecret ? new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
}) : null;

const supabase = (supabaseUrl && supabaseServiceRoleKey) ? createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
}) : null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
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

  console.log('[Webhook] Received request');

  // Check for signature header (Stripe uses this instead of Authorization)
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header');
    return new Response(
      JSON.stringify({ error: 'Missing stripe-signature header' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!stripe || !webhookSecret || !supabase) {
    console.error('[Webhook] Missing configuration');
    return new Response(
      JSON.stringify({ error: 'Webhook not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const payload = await req.text();
  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
    console.log('[Webhook] Signature verified, event type:', event.type);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return new Response(
      JSON.stringify({ error: 'Signature verification failed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Process the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('[Webhook] Processing checkout.session.completed');
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tierId = session.metadata?.tierId;

        console.log('[Webhook] Session metadata:', { userId, tierId });

        if (!userId || !tierId) {
          console.error('[Webhook] Missing userId or tierId in session metadata');
          break;
        }

        const modules = ['planner'];
        if (tierId === 'starter') modules.push('vineyard');
        if (tierId === 'professional') modules.push('vineyard', 'production', 'inventory');
        if (tierId === 'enterprise') modules.push('vineyard', 'production', 'inventory', 'sales');

        console.log('[Webhook] Updating subscription:', { userId, tierId, modules });

        const { data, error } = await supabase
          .from('subscriptions')
          .update({
            tier: tierId,
            status: 'active',
            modules,
            stripe_customer_id: session.customer?.toString() ?? null,
            stripe_subscription_id: session.subscription?.toString() ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select();

        if (error) {
          console.error('[Webhook] Database update error:', error);
        } else {
          console.log('[Webhook] Subscription updated successfully:', data);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        console.log('[Webhook] Processing', event.type);
        const subscription = event.data.object as Stripe.Subscription;
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('[Webhook] Database update error:', error);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        console.log('[Webhook] Processing customer.subscription.deleted');
        const subscription = event.data.object as Stripe.Subscription;
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('[Webhook] Database update error:', error);
        }
        break;
      }

      case 'invoice.payment_failed': {
        console.log('[Webhook] Processing invoice.payment_failed');
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', invoice.subscription.toString());

        if (error) {
          console.error('[Webhook] Database update error:', error);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true, type: event.type }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[Webhook] Error processing event:', err);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
