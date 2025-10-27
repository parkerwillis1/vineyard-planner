# Check Webhook Secret Configuration

## The Problem
Getting 401 "Missing authorization header" means Supabase's platform is blocking the request before it reaches your code.

## Check Environment Secrets

1. Go to: https://supabase.com/dashboard/project/ewxbxojwmdhoeybqmewi/settings/functions
2. Look for **"Secrets"** section
3. Verify you have **STRIPE_WEBHOOK_SECRET** set

### If STRIPE_WEBHOOK_SECRET is missing or empty:

1. Go to Stripe: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click **"Reveal"** next to "Signing secret"
4. Copy the secret (starts with `whsec_...`)
5. Go back to Supabase → Settings → Edge Functions → Secrets
6. If STRIPE_WEBHOOK_SECRET exists: **Edit** it and paste the secret
7. If it doesn't exist: **Add new secret**
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (your signing secret)
8. Click **Save**

### After setting the secret:

**Important**: You may need to redeploy the edge function for the new secret to take effect.

1. Go to Edge Functions → stripe-webhook
2. Click **Redeploy** or **Deploy** button (even if code hasn't changed)
3. Wait for deployment to complete

### Test Again:

1. Go to Stripe: https://dashboard.stripe.com/test/webhooks
2. Click your webhook endpoint
3. Find a `checkout.session.completed` event
4. Click **⋮** → **Resend event**
5. Should now show **200** instead of **401**

## Alternative: Check Function Logs

Go to: https://supabase.com/dashboard/project/ewxbxojwmdhoeybqmewi/logs/edge-functions

Filter for: **stripe-webhook**

You should see logs like:
- ✅ `[Webhook] Received request`
- ✅ `[Webhook] Signature verified, event type: checkout.session.completed`

If you DON'T see these logs, the function isn't being reached at all (auth blocking it).
