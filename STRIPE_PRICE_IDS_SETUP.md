# Stripe Price IDs Setup - CRITICAL

## ✅ What Was Fixed

### 1. **SECURITY FIX: Server-Side Price ID Mapping**

**Problem**: Client was passing `priceId` to the Edge Function, which is a security risk. A malicious user could pass any Price ID and subscribe at the wrong price.

**Solution**:
- **Server-side** Price ID mapping in Edge Function
- Client only sends `tierId` (professional/estate/enterprise)
- Edge Function looks up correct Price ID from environment variables
- **NO Product IDs are used** - only recurring Price IDs

### 2. **Trial Configuration**

Edge Function properly configured for 14-day free trials:
```typescript
mode: 'subscription',
payment_method_collection: 'always', // Card collected up-front
subscription_data: {
  trial_period_days: 14,
  trial_settings: {
    end_behavior: {
      missing_payment_method: 'cancel',
    },
  },
}
```

## 🔑 REQUIRED: Get Your LIVE Price IDs

### Method 1: Stripe Dashboard (Manual)

For each product, find the **monthly recurring Price ID**:

1. Go to: https://dashboard.stripe.com/products
2. Click on "Professional – Vineyard" ($49/month)
   - Find the Price ID that looks like `price_XXXXXXXXXXXXXXXX`
   - **Copy this Price ID**
3. Click on "Estate – Vineyard + Winery" ($109/month)
   - Copy the Price ID
4. Click on "Enterprise – End-to-End Platform" ($249/month)
   - Copy the Price ID

### Method 2: Use the Utility Function (Automated)

I created `supabase/functions/get-stripe-prices/index.ts` to automatically fetch Price IDs.

**To use it:**

```bash
# Deploy the utility function
npx supabase functions deploy get-stripe-prices

# Call it (replace with your actual Supabase project URL)
curl https://[your-project-id].supabase.co/functions/v1/get-stripe-prices

# The response will show the Price IDs for each tier
```

The function will output:
```
STRIPE_PRICE_PROFESSIONAL=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ESTATE=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxxxxxxxxxxxxxxxxxx
```

**After getting the Price IDs, you can delete this function.**

## 📝 Configure Supabase Secrets

Once you have the Price IDs, add them as **Supabase Edge Function secrets**:

### Via Supabase Dashboard:

1. Go to: https://app.supabase.com/project/[your-project-id]/settings/functions
2. Click "Add secret"
3. Add these three secrets:

```
Name: STRIPE_PRICE_PROFESSIONAL
Value: price_xxxxxxxxxxxxxxxxxxxxx  (your $49/month Price ID)

Name: STRIPE_PRICE_ESTATE
Value: price_xxxxxxxxxxxxxxxxxxxxx  (your $109/month Price ID)

Name: STRIPE_PRICE_ENTERPRISE
Value: price_xxxxxxxxxxxxxxxxxxxxx  (your $249/month Price ID)
```

### Via Supabase CLI:

```bash
npx supabase secrets set STRIPE_PRICE_PROFESSIONAL=price_xxxxxxxxxxxxxxxxxxxxx
npx supabase secrets set STRIPE_PRICE_ESTATE=price_xxxxxxxxxxxxxxxxxxxxx
npx supabase secrets set STRIPE_PRICE_ENTERPRISE=price_xxxxxxxxxxxxxxxxxxxxx
```

## 🚀 Deploy Edge Functions

After setting the secrets, deploy the updated Edge Functions:

```bash
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook
```

## ✅ Verification Checklist

- [ ] Retrieved LIVE Price IDs for all three tiers
- [ ] Confirmed Price IDs are for **monthly recurring** subscriptions (not one-time or products)
- [ ] Added all three Price IDs as Supabase secrets
- [ ] Deployed `create-checkout-session` Edge Function
- [ ] Deployed `stripe-webhook` Edge Function
- [ ] Updated Stripe business name from "Vine Pioneer sandbox" to "Trellis"
- [ ] Configured Stripe webhook endpoint
- [ ] Tested trial flow end-to-end

## 📂 Files Changed

### Server-Side (Edge Functions):

**1. `supabase/functions/create-checkout-session/index.ts`**
   - ✅ Added server-side Price ID mapping from environment variables
   - ✅ Removed `priceId` parameter from request (security fix)
   - ✅ Only accepts `tierId` from client
   - ✅ Proper trial configuration with `payment_method_collection: 'always'`
   - ✅ Enhanced logging for debugging

**2. `supabase/functions/get-stripe-prices/index.ts` (NEW - UTILITY)**
   - Helper function to retrieve Price IDs from Stripe API
   - Can be deleted after retrieving Price IDs

### Client-Side:

**3. `src/shared/lib/stripeCheckout.js`**
   - ✅ Removed `priceId` parameter
   - ✅ Only sends `tierId` to Edge Function
   - ✅ Updated documentation

**4. `src/pages/pricing/PricingPage.jsx`**
   - ✅ Removed `getPriceIdForTier` import
   - ✅ Removed Price ID lookup logic
   - ✅ Only passes `tierId` to checkout function

**5. `src/pages/onboarding/SelectPlanPage.jsx`**
   - ✅ Removed `getPriceIdForTier` import
   - ✅ Removed Price ID logic
   - ✅ Only passes `tierId`

**6. `src/shared/components/UpgradeModal.jsx`**
   - ✅ Removed `getPriceIdForTier` import
   - ✅ Removed Price ID logic
   - ✅ Only passes `tierId`

### No Changes Needed:

- `supabase/functions/stripe-webhook/index.ts` - Already correctly handles trial status
- `src/shared/config/pricing.js` - Already updated with correct pricing
- Auth redirect flow - Already preserves tier selection

## 🔒 Security Improvements

**Before**: Client could send any Price ID → Potential price manipulation
```javascript
// ❌ INSECURE
await redirectToStripeCheckout({
  priceId: 'price_HACKER_COULD_CHANGE_THIS',
  tierId: 'professional'
});
```

**After**: Server determines Price ID based on tier → Secure
```javascript
// ✅ SECURE
await redirectToStripeCheckout({
  tierId: 'professional' // Server maps to correct Price ID
});
```

## 📋 Tier Mapping

The Edge Function maps tier IDs to Price IDs:

| Tier ID | Display Name | Price | Environment Variable |
|---------|--------------|-------|---------------------|
| `professional` | Vineyard | $49/month | `STRIPE_PRICE_PROFESSIONAL` |
| `estate` | Vineyard + Winery | $109/month | `STRIPE_PRICE_ESTATE` |
| `enterprise` | End-to-End Platform | $249/month | `STRIPE_PRICE_ENTERPRISE` |

## 🧪 Testing

### 1. Test Price ID Mapping

After deployment, test that the Edge Function correctly rejects missing Price IDs:

```bash
# This should return an error if Price IDs are not configured
curl -X POST https://[your-project-id].supabase.co/functions/v1/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "apikey: [your-anon-key]" \
  -d '{"tierId":"professional","userId":"test","email":"test@test.com"}'
```

### 2. Test Trial Flow

1. Click "Start 2-Week Free Trial" on Professional tier
2. Verify Stripe Checkout opens
3. Verify trial text is displayed (or check logs if not)
4. Complete checkout with test card: `4242 4242 4242 4242`
5. Verify subscription status = `trialing` in Stripe Dashboard
6. Verify database record has:
   - `tier` = `professional`
   - `status` = `trialing`
   - `trial_ends_at` = 14 days from now

## ⚠️ Important Notes

1. **DO NOT** use Product IDs (`prod_...`) in checkout - only Price IDs (`price_...`)
2. **DO NOT** store Price IDs in client-side `.env` (`VITE_*`) - only in Supabase secrets
3. **ALWAYS** verify webhook events are being received after deployment
4. **DELETE** the `get-stripe-prices` utility function after retrieving Price IDs

## 🎯 Summary

**What you need to do:**

1. Get the three LIVE Price IDs from Stripe Dashboard or utility function
2. Add them as Supabase Edge Function secrets
3. Deploy the Edge Functions
4. Test the trial flow

**What's already done:**

- ✅ Server-side Price ID mapping (security fix)
- ✅ Trial configuration (14-day trial, card up-front)
- ✅ Client-side updates (no Price IDs sent from client)
- ✅ Webhook trial handling
- ✅ Auth redirect flow

**Result**: Secure, properly configured Stripe subscription flow with 14-day free trials.
