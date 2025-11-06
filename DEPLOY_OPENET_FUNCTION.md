# Deploy OpenET Edge Function

## What This Does
This deploys the OpenET API proxy Edge Function to Supabase, which will solve the CORS error preventing real ET data from loading.

## Quick Deploy (2 steps)

### Option 1: Via Supabase CLI (Recommended - 30 seconds)

```bash
# 1. Login to Supabase (opens browser for auth)
npx supabase login

# 2. Deploy the function
npx supabase functions deploy openet-proxy --project-ref ewxbxojwmdhoeybqmewi
```

### Option 2: Via Supabase Dashboard (5 minutes)

1. Go to https://supabase.com/dashboard/project/ewxbxojwmdhoeybqmewi/functions
2. Click **"Deploy a new function"**
3. Name: `openet-proxy`
4. Copy and paste the contents of `supabase/functions/openet-proxy/index.ts`
5. Click **Deploy**
6. Go to **Settings** → **Secrets** and add:
   - Key: `OPENET_API_KEY`
   - Value: `ZMMBmt24bSPOcRaq1GORT0dG69oE3Q6NrVAgkU7HgYKt9LEvYBgWAdKuXLIN`

## After Deployment

The app will automatically start fetching real OpenET data instead of mock data. Check the browser console to see:
- `✅ OpenET data received via proxy:` (success)
- Instead of: `⚠️ Using mock data.` (mock data fallback)

## What Changed

1. **Created** `supabase/functions/openet-proxy/index.ts` - Server-side proxy to bypass CORS
2. **Updated** `src/shared/lib/openETApi.js` - Client now calls our Edge Function instead of OpenET directly
3. **Security** - API key is now on the server (Edge Function) instead of exposed in the browser
