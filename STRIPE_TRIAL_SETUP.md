# Stripe 14-Day Free Trial Implementation

This document explains the complete implementation of Stripe's 14-day free trial for Trellis subscriptions.

## Overview

- **Trial Duration**: 14 days
- **Payment Method**: Collected up-front at checkout
- **Billing**: Card is NOT charged during trial; auto-converts to paid subscription after 14 days
- **Cancellation**: User can cancel anytime; if no payment method at trial end, subscription is automatically canceled

## Pricing Tiers (LIVE)

| Tier ID | Display Name | Price | Modules |
|---------|--------------|-------|---------|
| `free` | Planner | $0 | planner |
| `professional` | Vineyard | $49/month | planner, vineyard |
| `estate` | Vineyard + Winery | $109/month | planner, vineyard, production, inventory |
| `enterprise` | End-to-End Platform | $249/month | all modules |

## Configuration Required

### 1. Environment Variables (.env.local)

You must add your LIVE Stripe Price IDs to `.env.local`:

```bash
# Stripe LIVE Price IDs (get from https://dashboard.stripe.com/products)
VITE_STRIPE_PRICE_PROFESSIONAL=price_xxxxxxxxxxxxxxxxxxxxx  # $49/month Vineyard
VITE_STRIPE_PRICE_ESTATE=price_xxxxxxxxxxxxxxxxxxxxx        # $109/month Vineyard + Winery
VITE_STRIPE_PRICE_ENTERPRISE=price_xxxxxxxxxxxxxxxxxxxxx    # $249/month Enterprise
```

### 2. Supabase Edge Function Environment Variables

Set these in your Supabase project settings (https://app.supabase.com/project/_/settings/functions):

```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
APP_BASE_URL=https://trellisag.com
```

### 3. Stripe Dashboard Configuration

**Update Business Name:**
1. Go to: https://dashboard.stripe.com/settings/public
2. Change "Business name" from "Vine Pioneer sandbox" to "Trellis"

**Configure Webhook Endpoint:**
1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://[your-project-id].supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the webhook signing secret and add to Supabase environment variables

## Implementation Details

### File: `supabase/functions/create-checkout-session/index.ts`

**Trial Configuration:**
```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_collection: 'always', // Collect card up-front
  subscription_data: {
    trial_period_days: 14,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'cancel',
      },
    },
    metadata: { userId, tierId },
  },
  // ... other config
});
```

**Key Parameters:**
- `payment_method_collection: 'always'` - Ensures card is collected during trial
- `trial_period_days: 14` - Sets 14-day trial period
- `trial_settings.end_behavior.missing_payment_method: 'cancel'` - Auto-cancels if no payment method

### File: `supabase/functions/stripe-webhook/index.ts`

**Webhook Events Handled:**

1. **`checkout.session.completed`**
   - Retrieves subscription from Stripe
   - Captures trial status (`trialing` or `active`)
   - Stores `trial_ends_at` timestamp
   - Updates database with tier, modules, and subscription IDs

2. **`customer.subscription.updated`**
   - Updates subscription status
   - Updates `trial_ends_at` when trial changes
   - Clears `trial_ends_at` when trial ends and becomes `active`

3. **`customer.subscription.deleted`**
   - Sets status to `canceled`

4. **`invoice.payment_failed`**
   - Sets status to `past_due`

### File: `src/shared/config/pricing.js`

Defines the pricing tiers with correct tier IDs matching Stripe metadata:
- `professional` (was `starter`)
- `estate` (new tier)
- `enterprise`

### File: `src/shared/config/stripePrices.js`

Maps tier IDs to environment variable names for Price IDs.

### Auth Flow Files: `src/auth/SignIn.jsx` & `src/auth/SignUp.jsx`

Both files:
- Extract `tier` parameter from URL
- Preserve `tier`, `startTrial`, and `redirect` across auth flows
- Pass parameters through Google OAuth redirects
- Include parameters in Sign In/Sign Up cross-links

## User Flow

### Scenario 1: New User Starts Trial (Not Logged In)

1. User clicks "Start 2-Week Free Trial" on Professional tier
   - Redirects to: `/signup?redirect=/pricing&tier=professional&startTrial=true`

2. User signs up with email/password or Google
   - After auth, redirects to: `/pricing?tier=professional&startTrial=true`

3. PricingPage detects `tier` and `startTrial` params
   - Calls `handleSelect('professional')`
   - Calls Edge Function `create-checkout-session` with `priceId`, `tierId`, `userId`, `email`

4. Edge Function creates Checkout Session with 14-day trial
   - Returns `sessionId`

5. Frontend redirects to Stripe Checkout
   - User enters payment details
   - Stripe displays trial information (if configured correctly)

6. After successful checkout:
   - Stripe sends `checkout.session.completed` webhook
   - Webhook handler fetches subscription, sees status = `trialing`
   - Updates database: `tier=professional`, `status=trialing`, `trial_ends_at=[14 days from now]`

7. User redirected to: `/account/settings?checkout=success`

### Scenario 2: Existing User Clicks "Sign In" During Trial Flow

1. User clicks "Start 2-Week Free Trial" → goes to signup page
2. User clicks "Sign In" link
   - Link preserves params: `/signin?redirect=/pricing&tier=professional&startTrial=true`
3. User signs in
   - After auth, redirects to: `/pricing?tier=professional&startTrial=true`
4. Flow continues from step 3 in Scenario 1

### Scenario 3: Logged-In User Starts Trial

1. User already logged in, clicks "Start 2-Week Free Trial" on Professional tier
2. PricingPage `handleSelect('professional')` called directly
3. Flow continues from step 3 in Scenario 1

## Testing the Trial Flow (LIVE Mode)

**⚠️ WARNING: This will create real charges after the trial period. Use a test card or plan to cancel before trial ends.**

### Prerequisites
1. Deploy Edge Functions to Supabase
2. Set all environment variables in Supabase
3. Configure webhook in Stripe Dashboard
4. Add LIVE Price IDs to `.env.local`
5. Update Stripe business name to "Trellis"

### Test Steps

1. **Test as New User:**
   ```
   1. Log out (or use incognito)
   2. Navigate to /pricing
   3. Click "Start 2-Week Free Trial" on Professional tier
   4. Sign up with test email
   5. Verify redirect to /pricing?tier=professional&startTrial=true
   6. Verify Stripe Checkout opens
   7. Use test card: 4242 4242 4242 4242
   8. Complete checkout
   9. Verify redirect to /account/settings?checkout=success
   ```

2. **Verify Database:**
   ```sql
   SELECT
     user_id,
     tier,
     status,
     trial_ends_at,
     stripe_subscription_id,
     modules
   FROM subscriptions
   WHERE user_id = '[your-test-user-id]';
   ```

   Expected:
   - `tier` = `professional`
   - `status` = `trialing`
   - `trial_ends_at` = timestamp 14 days in future
   - `modules` = `["planner","vineyard"]`

3. **Verify Stripe Dashboard:**
   ```
   1. Go to https://dashboard.stripe.com/subscriptions
   2. Find your test subscription
   3. Verify:
      - Status = "Trialing"
      - Trial end date = 14 days from now
      - Next payment date = 14 days from now
   ```

4. **Check Logs:**
   ```
   Supabase Dashboard → Edge Functions → Logs

   Look for:
   - [Stripe] Creating checkout session with trial_period_days: 14
   - [Stripe] Checkout session created
   - [Webhook] Subscription details: status: 'trialing'
   - [Webhook] Subscription updated successfully
   ```

## Troubleshooting

### Issue: Stripe Checkout doesn't show trial text

**Possible causes:**
1. Price objects in Stripe may not support trials
2. Stripe Checkout UI may not always display trial text explicitly
3. Business name not updated

**Solutions:**
- Verify in Stripe Dashboard that subscription status = "Trialing"
- Check Edge Function logs to confirm `trial_period_days: 14` was sent
- Trial behavior is correct even if text doesn't show (check subscription status)

### Issue: Webhook not receiving events

**Check:**
1. Webhook endpoint URL is correct in Stripe Dashboard
2. `STRIPE_WEBHOOK_SECRET` is set correctly in Supabase
3. Edge Function is deployed and accessible
4. Webhook events are configured in Stripe Dashboard

**Test webhook:**
```bash
# In Stripe Dashboard → Webhooks → Click your endpoint → Send test webhook
```

### Issue: Database not updating

**Check:**
1. Supabase logs for webhook function errors
2. `SUPABASE_SERVICE_ROLE_KEY` is set correctly
3. `subscriptions` table exists with correct columns:
   - `user_id` (uuid)
   - `tier` (text)
   - `status` (text)
   - `trial_ends_at` (timestamptz, nullable)
   - `stripe_customer_id` (text, nullable)
   - `stripe_subscription_id` (text, nullable)
   - `modules` (text[] or jsonb)

### Issue: Tier parameter not preserved

**Check:**
1. URL after signup/signin includes `tier=professional`
2. PricingPage reads `searchParams.get('tier')`
3. Auth pages extract and pass tier parameter

## Summary of Changes

### Files Modified:

1. **`src/shared/config/pricing.js`**
   - Changed tier IDs: `starter` → `professional`, added `estate`
   - Updated prices: $29 → $49, $99 → $109, kept $249

2. **`src/shared/config/stripePrices.js`**
   - Updated PRICE_ENV_MAP with new tier IDs

3. **`.env.example`**
   - Added Stripe Price ID environment variables

4. **`supabase/functions/create-checkout-session/index.ts`**
   - Added `payment_method_collection: 'always'`
   - Configured `trial_period_days: 14`
   - Added `trial_settings.end_behavior`
   - Enhanced logging for trial verification

5. **`supabase/functions/stripe-webhook/index.ts`**
   - Updated tier ID mapping for modules
   - Enhanced `subscription.updated` to track `trial_ends_at`
   - Added comprehensive trial status logging

6. **`src/auth/SignIn.jsx` & `src/auth/SignUp.jsx`**
   - Already updated in previous session to preserve tier parameter

### No Changes Needed:

- **`src/pages/pricing/PricingPage.jsx`** - Already passes tier parameter correctly
- Database schema - Existing `trial_ends_at` column supports trial tracking
- Frontend UI - CTAs already say "Start 2-Week Free Trial"

## Next Steps

1. **Get LIVE Price IDs from Stripe Dashboard**
2. **Add Price IDs to `.env.local`**
3. **Deploy Edge Functions to Supabase**
4. **Configure webhook in Stripe Dashboard**
5. **Update Stripe business name to "Trellis"**
6. **Test trial flow end-to-end**
7. **Monitor Stripe Dashboard and Supabase logs**
