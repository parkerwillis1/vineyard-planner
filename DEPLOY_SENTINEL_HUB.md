# Quick Deploy: Sentinel Hub NDVI Integration

## Prerequisites
- Sentinel Hub account created
- OAuth credentials obtained (Client ID + Secret)
- Supabase CLI installed

---

## Deploy in 5 Minutes

### 1. Install Supabase CLI (if needed)

```bash
# macOS
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### 2. Link Your Supabase Project

```bash
cd vineyard-planner
supabase link --project-ref your-project-ref
```

**Find your project-ref**: `https://app.supabase.com/project/<THIS-IS-YOUR-REF>`

### 3. Deploy the Edge Function

```bash
supabase functions deploy sentinel-hub-proxy
```

Expected output:
```
Deploying function sentinel-hub-proxy...
Function URL: https://your-project.supabase.co/functions/v1/sentinel-hub-proxy
Function deployed successfully!
```

### 4. Add Credentials to `.env.local`

```bash
# Sentinel Hub Configuration
VITE_SENTINEL_HUB_CLIENT_ID=your_client_id_here
VITE_SENTINEL_HUB_CLIENT_SECRET=your_client_secret_here
```

### 5. Restart Dev Server

```bash
# Ctrl+C to stop
npm run dev
```

---

## Test It

1. Go to **Irrigation** page
2. Select a field
3. Click **"Import NDVI"**
4. Click **"Fetch from Satellite"**
5. Wait ~10 seconds ✨

---

## Troubleshooting

### Error: "Not linked to any project"

```bash
supabase link --project-ref your-project-ref
```

### Error: "supabase: command not found"

Install Supabase CLI (see step 1)

### Error: "Auth failed" or "CORS error"

Make sure:
- Edge function is deployed
- Credentials are correct in `.env.local`
- Dev server was restarted after adding credentials

---

## What the Edge Function Does

The `sentinel-hub-proxy` function:
1. Receives requests from your React app
2. Forwards them to Sentinel Hub API (server-side)
3. Returns results back to your app
4. **Avoids CORS issues** (browsers block direct API calls)

This is a standard pattern for accessing third-party APIs from browser apps.

---

## Production Deployment

When deploying to production (Netlify/Vercel):

1. The Edge Function is already deployed ✅
2. Add environment variables to your hosting platform:
   - `VITE_SENTINEL_HUB_CLIENT_ID`
   - `VITE_SENTINEL_HUB_CLIENT_SECRET`
3. That's it! The app will use the deployed Edge Function automatically.

---

**Full Documentation**: See `SENTINEL_HUB_SETUP.md` for detailed instructions and troubleshooting.
