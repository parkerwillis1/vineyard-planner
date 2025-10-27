# Deploy Edge Functions via Supabase Dashboard

Since CLI installation is having issues, here's how to deploy your edge functions directly through the Supabase Dashboard:

## Step 1: Add Environment Secrets First

Before deploying functions, add the required secrets:

1. Go to https://supabase.com/dashboard/project/ewxbxojwmdhoeybqmewi
2. Click **Settings** (gear icon on left sidebar)
3. Click **Edge Functions**
4. Under **Secrets**, click **Add new secret**
5. Add these three secrets:

```
Name: STRIPE_SECRET_KEY
Value: [Get from https://dashboard.stripe.com/test/apikeys - click "Reveal test key"]

Name: APP_BASE_URL
Value: http://localhost:5173

Name: STRIPE_WEBHOOK_SECRET
Value: [Leave empty for now - we'll add this after setting up the webhook]
```

## Step 2: Deploy create-checkout-session Function

1. Go to **Edge Functions** section (database icon → Edge Functions)
2. Click **Create a new function**
3. Function name: `create-checkout-session`
4. Copy and paste this code:

```typescript
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
```

5. Click **Deploy function**

## Step 3: Deploy stripe-webhook Function

1. Click **Create a new function** again
2. Function name: `stripe-webhook`
3. Copy and paste this code:

```typescript
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
```

4. Click **Deploy function**

## Step 4: Set Up Stripe Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **+ Add endpoint**
3. Endpoint URL: `https://ewxbxojwmdhoeybqmewi.supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. On the webhook details page, reveal the **Signing secret** (starts with `whsec_`)
7. Go back to Supabase → Settings → Edge Functions → Secrets
8. Edit the `STRIPE_WEBHOOK_SECRET` and paste the signing secret

## Step 5: Test!

1. Refresh your app at http://localhost:5173
2. Sign in
3. Try to access a locked feature
4. Click "Upgrade Now"
5. You should be redirected to Stripe checkout!

Use test card: `4242 4242 4242 4242`, any future expiry, any CVC

---

## Troubleshooting

**If you get an error about deployments:**
- Make sure all secrets are saved before deploying
- Try refreshing the dashboard and redeploying

**If button still doesn't work:**
- Open browser console (F12)
- Click "Upgrade Now" button
- Check for errors and share them with me

**If checkout works but subscription doesn't update:**
- Check webhook is receiving events in Stripe Dashboard
- Check edge function logs in Supabase for errors
