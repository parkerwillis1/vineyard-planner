# Stripe Integration Setup Guide

This guide will help you complete the Stripe integration for Vine Pioneer's subscription system.

## Current Status

✅ **Already Implemented:**
- Frontend Stripe integration (`@stripe/stripe-js`)
- Stripe checkout helper (`stripeCheckout.js`)
- Price configuration (`stripePrices.js`)
- Upgrade modal UI (`UpgradeModal.jsx`)
- Supabase Edge Functions (created but need deployment):
  - `create-checkout-session` - Creates Stripe checkout sessions
  - `stripe-webhook` - Processes subscription lifecycle events
- Subscriptions database table with proper RLS policies

❌ **Needs Configuration:**
- Stripe API keys in `.env.local` and Supabase
- Edge Functions deployment
- Webhook endpoint registration

---

## Step 1: Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test mode** (toggle in top right)
3. Copy these two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - click "Reveal test key"

⚠️ **Important:** Keep your secret key safe! Never commit it to your repository.

---

## Step 2: Add Publishable Key to .env.local

1. Open `.env.local` in the project root
2. Replace `pk_test_YOUR_PUBLISHABLE_KEY_HERE` with your actual publishable key:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51abc123...
```

3. **Restart your dev server** for the change to take effect:
   - Stop the current server (Ctrl+C)
   - Run `npm run dev`

---

## Step 3: Configure Supabase Edge Functions

### 3.1 Add Stripe Secret Key to Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ewxbxojwmdhoeybqmewi`
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Add the following secrets:

```
STRIPE_SECRET_KEY=sk_test_51abc123...
APP_BASE_URL=http://localhost:5173
```

For production, also add:
```
APP_BASE_URL=https://your-production-domain.com
```

### 3.2 Deploy Edge Functions

You need the Supabase CLI installed. If not installed:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login
```

Then deploy the functions:

```bash
# Link your project (if not already linked)
supabase link --project-ref ewxbxojwmdhoeybqmewi

# Deploy both edge functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

**Verify deployment:**
- Go to Supabase Dashboard → Edge Functions
- You should see both functions listed as "Deployed"

---

## Step 4: Set Up Stripe Webhook

### 4.1 Get Your Webhook Endpoint URL

Your webhook endpoint URL is:
```
https://ewxbxojwmdhoeybqmewi.supabase.co/functions/v1/stripe-webhook
```

### 4.2 Add Webhook in Stripe Dashboard

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **+ Add endpoint**
3. Enter endpoint URL: `https://ewxbxojwmdhoeybqmewi.supabase.co/functions/v1/stripe-webhook`
4. Select these events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**

### 4.3 Add Webhook Secret to Supabase

1. After creating the webhook, click on it in the Stripe dashboard
2. Find the **Signing secret** section and click "Reveal"
3. Copy the signing secret (starts with `whsec_`)
4. Go back to Supabase → Settings → Edge Functions → Secrets
5. Add a new secret:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Step 5: Test the Integration

### 5.1 Test Checkout Flow

1. Sign in to your app at `http://localhost:5173`
2. Try to access a locked feature (e.g., "Vineyard Operations")
3. The Upgrade Modal should appear
4. Click **"Upgrade to [Plan Name]"**
5. You should be redirected to Stripe Checkout

### 5.2 Test Payment (Using Test Card)

Stripe provides test cards for testing:
- **Card number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

Complete the checkout and verify:
1. You're redirected back to `/account/settings?checkout=success`
2. Your subscription tier is updated in the database
3. You can now access the upgraded features

### 5.3 Verify Database Update

1. Go to Supabase Dashboard → Table Editor → `subscriptions`
2. Find your user's subscription row
3. Verify these fields are populated:
   - `tier` should be updated (e.g., "starter", "professional")
   - `stripe_customer_id` should be filled
   - `stripe_subscription_id` should be filled
   - `status` should be "active"
   - `modules` array should include the new modules

---

## Step 6: Test Webhook Events (Optional but Recommended)

### Using Stripe CLI for Local Testing

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local edge function:
   ```bash
   stripe listen --forward-to https://ewxbxojwmdhoeybqmewi.supabase.co/functions/v1/stripe-webhook
   ```

4. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   ```

5. Check Supabase Edge Functions logs to verify webhook processing

---

## Troubleshooting

### "Stripe is not configured" Error
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is in `.env.local`
- Restart your dev server after changing `.env.local`

### "Failed to create checkout session" Error
- Check Supabase Edge Functions logs
- Verify `STRIPE_SECRET_KEY` is configured in Supabase secrets
- Ensure edge function is deployed

### Checkout Works but Subscription Not Updated
- Check Stripe webhook is configured correctly
- Verify `STRIPE_WEBHOOK_SECRET` is in Supabase secrets
- Check webhook delivery attempts in Stripe Dashboard
- Review edge function logs for webhook processing errors

### Price ID Errors
- Verify the price IDs in `.env.local` match the actual price IDs in your Stripe account
- Check that prices are for **recurring subscriptions** (not one-time payments)

---

## Production Deployment Checklist

Before going live:

- [ ] Switch to Stripe **Live mode** keys (not test mode)
- [ ] Update `VITE_STRIPE_PUBLISHABLE_KEY` in production `.env.local`
- [ ] Update `STRIPE_SECRET_KEY` in Supabase production environment
- [ ] Set `APP_BASE_URL` to production domain in Supabase
- [ ] Create new webhook endpoint for production URL
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production webhook secret
- [ ] Test complete flow in production environment
- [ ] Verify Stripe price IDs are correct for live mode
- [ ] Set up proper error monitoring and alerts

---

## Support

If you encounter issues:
1. Check Supabase Edge Functions logs
2. Check Stripe Dashboard → Developers → Events for API errors
3. Check Stripe Dashboard → Webhooks for delivery failures
4. Review browser console for frontend errors
