# Stripe Implementation Guide for Vineyard Planner

## Overview
This guide shows how to implement Stripe subscription payments for your vineyard planner.

## Step 1: Setup Stripe Account

1. Go to https://stripe.com and create an account
2. Get your API keys from Dashboard > Developers > API keys
3. You'll have:
   - **Test keys** (starts with `pk_test_` and `sk_test_`)
   - **Live keys** (starts with `pk_live_` and `sk_live_`)

## Step 2: Create Products in Stripe

In your Stripe Dashboard:

1. **Products > Create Product**

### Product 1: Vineyard Starter
- Name: Vineyard Starter
- Price: $29/month (recurring)
- Copy the Price ID (looks like `price_1ABC123...`)

### Product 2: Vineyard + Winery Professional
- Name: Vineyard + Winery Professional
- Price: $99/month (recurring)
- Copy the Price ID

### Product 3: Complete Platform Enterprise
- Name: Complete Platform Enterprise
- Price: $249/month (recurring)
- Copy the Price ID

## Step 3: Install Stripe in Your Project

```bash
npm install @stripe/stripe-js stripe
```

## Step 4: Add Environment Variables

Add to `.env.local`:

```env
# Stripe Public Key (safe to expose in frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Stripe Secret Key (NEVER expose in frontend, use in Supabase Edge Functions)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Price IDs from Stripe Dashboard
VITE_STRIPE_PRICE_STARTER=price_1ABC123starter
VITE_STRIPE_PRICE_PROFESSIONAL=price_1ABC123professional
VITE_STRIPE_PRICE_ENTERPRISE=price_1ABC123enterprise
```

## Step 5: Create Stripe Checkout Component

Create `src/shared/components/StripeCheckout.jsx`:

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/shared/lib/supabaseClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export async function createCheckoutSession(priceId, tierId) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Call your Supabase Edge Function to create checkout session
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId, tierId, userId: user.id, email: user.email }
  });

  if (error) throw error;

  // Redirect to Stripe Checkout
  const stripe = await stripePromise;
  const { error: stripeError } = await stripe.redirectToCheckout({
    sessionId: data.sessionId
  });

  if (stripeError) throw stripeError;
}
```

## Step 6: Create Supabase Edge Function for Checkout

Create `supabase/functions/create-checkout-session/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.3.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  try {
    const { priceId, tierId, userId, email } = await req.json()

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/account/settings?success=true`,
      cancel_url: `${req.headers.get('origin')}/pricing?canceled=true`,
      metadata: {
        userId,
        tierId,
      },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## Step 7: Create Webhook Handler for Stripe Events

Create `supabase/functions/stripe-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.3.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const { userId, tierId } = session.metadata

      // Update user's subscription in database
      await supabase
        .from('subscriptions')
        .update({
          tier: tierId,
          status: 'active',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq('user_id', userId)

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object

      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
        })
        .eq('stripe_subscription_id', subscription.id)

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object

      // Downgrade to free tier
      await supabase
        .from('subscriptions')
        .update({
          tier: 'free',
          status: 'canceled',
          modules: ['planner'],
        })
        .eq('stripe_subscription_id', subscription.id)

      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
```

## Step 8: Update Pricing Page

Update `src/pages/pricing/PricingPage.jsx` to add checkout buttons:

```javascript
import { createCheckoutSession } from '@/shared/components/StripeCheckout';

// In your pricing card component:
<button
  onClick={() => createCheckoutSession(
    import.meta.env.VITE_STRIPE_PRICE_STARTER,
    'starter'
  )}
  className="..."
>
  Subscribe Now
</button>
```

## Step 9: Deploy Edge Functions

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Deploy functions
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook

# Set secrets
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Step 10: Configure Stripe Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret to your Supabase secrets

## Testing

### Test Cards (Stripe provides these):
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

Use any future expiry date and any CVC.

## Going Live

1. Switch to live mode in Stripe Dashboard
2. Get live API keys
3. Create live products and prices
4. Update environment variables with live keys
5. Update webhook endpoint to use live mode

---

## Alternative: Paddle or LemonSqueezy

If you want simpler tax handling (merchant of record):
- **Paddle**: Handles all taxes, great for international
- **LemonSqueezy**: Modern alternative to Paddle

Both handle taxes as merchant of record so you don't have to worry about tax compliance.
