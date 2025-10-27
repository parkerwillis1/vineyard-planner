# Deploy Webhook Fix - Quick Guide

## The Problem
Stripe webhooks are getting **401 Unauthorized** errors because the current deployed code expects an Authorization header, but Stripe uses signature verification instead.

## The Solution
The updated code in `supabase/functions/stripe-webhook/index.ts` has been fixed to:
- Accept requests without Authorization headers
- Verify using Stripe signature instead (secure!)
- Return proper CORS headers
- Log detailed debug information

## Deploy Steps

### 1. Go to Supabase Dashboard
Navigate to: https://supabase.com/dashboard/project/ewxbxojwmdhoeybqmewi/functions

### 2. Edit the stripe-webhook function
- Click on **stripe-webhook** in the list
- Click **Edit** or open the code editor
- You should see the current code

### 3. Replace with updated code
- **IMPORTANT**: Open the local file `supabase/functions/stripe-webhook/index.ts` in VS Code
- Select ALL code (Cmd+A / Ctrl+A)
- Copy it (Cmd+C / Ctrl+C)
- Go back to Supabase Dashboard editor
- Delete ALL existing code
- Paste the new code (Cmd+V / Ctrl+V)
- Click **Deploy** button

### 4. Wait for deployment
- Should see "Deployment successful" or similar message
- May take 10-30 seconds

### 5. Test the webhook
**Option A: Send test event from Stripe**
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint (should end with `/stripe-webhook`)
3. Find a recent `checkout.session.completed` event
4. Click the **⋮** menu → **Resend event**
5. Should now show **200** instead of **401**!

**Option B: Do another test purchase**
1. Go to http://localhost:5173/pricing
2. Click "Upgrade Now" on any tier
3. Complete checkout with test card: `4242 4242 4242 4242`
4. After redirect, check your subscription in settings
5. Should be updated automatically!

### 6. Verify database update
After successful webhook:
1. Go to Supabase → Table Editor → subscriptions
2. Find your record (user_id: aed9d646-0374-41a7-a7f0-03b74b3516de)
3. Should show correct tier, status='active', and modules array
4. stripe_customer_id and stripe_subscription_id should be populated

## What Changed in the Code

**Before:**
- Required Authorization header
- Returned 401 if missing

**After:**
- No Authorization header required
- Only checks for `stripe-signature` header
- Verifies signature using `stripe.webhooks.constructEvent()`
- Returns proper JSON responses with CORS headers
- Comprehensive error logging

## Troubleshooting

**If still getting 401:**
- Make sure you clicked "Deploy" after pasting the code
- Check the deployment timestamp shows recent time
- Try hard refresh in Stripe dashboard (Cmd+Shift+R)

**If getting different error:**
- Check Supabase Edge Function logs for details
- Look for console.log statements like `[Webhook] Signature verified`
- Share the error message and we'll debug

**If webhook succeeds but database not updating:**
- Check Supabase logs for database errors
- Verify user_id matches in metadata
- Check RLS policies on subscriptions table
