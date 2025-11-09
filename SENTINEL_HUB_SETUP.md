# Sentinel Hub NDVI Integration Setup Guide

This guide will help you set up automatic satellite NDVI imagery for Variable Rate Irrigation (VRI) zones in the Vineyard Planner.

## What is Sentinel Hub?

Sentinel Hub provides access to free Sentinel-2 satellite imagery with 10m resolution. The free tier includes **30,000 processing units per month**, which is enough for analyzing hundreds of vineyard fields.

## Why Use Sentinel NDVI?

- **Automatic**: No need to fly drones or manually process imagery
- **Free**: 30,000 processing units/month on free tier
- **Recent**: Data updated every 5-10 days (weather permitting)
- **10m Resolution**: Sufficient for most vineyard irrigation zones
- **Cloud-masked**: Automatically filters out cloudy pixels

---

## Step 1: Create a Sentinel Hub Account

1. Go to [https://www.sentinel-hub.com/](https://www.sentinel-hub.com/)
2. Click **"Try Now"** or **"Sign Up"** in the top right
3. Fill out the registration form:
   - Email address
   - Full name
   - Company/Organization (can use "Personal" if individual)
   - Use case: Select **"Agriculture"** or **"Precision Agriculture"**
4. Verify your email address
5. Complete your profile

---

## Step 2: Create OAuth Credentials

Once logged in to your Sentinel Hub account:

### 2.1 Navigate to Dashboard
1. Click on your profile icon (top right)
2. Select **"Dashboard"** or go to [https://apps.sentinel-hub.com/dashboard/](https://apps.sentinel-hub.com/dashboard/)

### 2.2 Create OAuth Client
1. In the left sidebar, click **"User Settings"**
2. Scroll down to the **"OAuth clients"** section
3. Click **"+ New OAuth client"** button
4. Fill out the form:
   - **Name**: `Vineyard Planner NDVI`
   - **Description**: `NDVI integration for irrigation management`
   - **Grant type**: Select **"Client credentials"**
   - **Allowed scopes**: Check ☑️ **"SH"** (Sentinel Hub services)
5. Click **"Create client"**

### 2.3 Save Your Credentials
After creating the client, you'll see:
- **Client ID**: A long alphanumeric string (e.g., `a1b2c3d4-e5f6-...`)
- **Client Secret**: A longer alphanumeric string

**⚠️ IMPORTANT**: Copy both values immediately! The client secret will only be shown once.

---

## Step 3: Deploy Supabase Edge Function

The Sentinel Hub API requires server-side requests to avoid CORS issues. We use a Supabase Edge Function as a proxy.

### 3.1 Install Supabase CLI

If you haven't already:

```bash
# macOS
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via npm
npm install -g supabase
```

### 3.2 Link Your Project

```bash
cd vineyard-planner
supabase link --project-ref your-project-ref
```

Your project ref can be found in your Supabase dashboard URL: `https://app.supabase.com/project/<project-ref>`

### 3.3 Deploy the Edge Function

```bash
supabase functions deploy sentinel-hub-proxy
```

You should see:
```
Deploying function sentinel-hub-proxy...
Function deployed successfully!
```

---

## Step 4: Add Credentials to Vineyard Planner

### 4.1 Open Your `.env.local` File
Navigate to your project directory:
```bash
cd vineyard-planner
```

Open `.env.local` in your text editor. If it doesn't exist, copy from `.env.example`:
```bash
cp .env.example .env.local
```

### 4.2 Add Sentinel Hub Credentials
Add or update these lines at the bottom of `.env.local`:

```bash
# Sentinel Hub Configuration (for satellite NDVI imagery)
VITE_SENTINEL_HUB_CLIENT_ID=your_client_id_here
VITE_SENTINEL_HUB_CLIENT_SECRET=your_client_secret_here
```

Replace `your_client_id_here` and `your_client_secret_here` with the values you copied in Step 2.3.

**Example:**
```bash
VITE_SENTINEL_HUB_CLIENT_ID=a1b2c3d4-e5f6-1234-abcd-567890abcdef
VITE_SENTINEL_HUB_CLIENT_SECRET=vWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz
```

### 3.3 Restart Development Server
If your dev server is running, restart it to load the new environment variables:

1. Stop the server (Ctrl+C or Cmd+C)
2. Start it again:
   ```bash
   npm run dev
   ```

---

## Step 5: Test the Integration

### 5.1 Navigate to Irrigation Management
1. Open your Vineyard Planner app in the browser
2. Go to **Vineyard Operations** → **Irrigation**
3. Select a field/block that has **map coordinates** (geometry)

### 5.2 Fetch NDVI Data
1. Scroll down to **"Variable Rate Irrigation Zones"** section
2. Click **"Import NDVI"** button
3. In the modal, click **"Fetch NDVI from Satellite"** button
4. Wait 5-10 seconds for the satellite data to process

### 5.3 Verify Success
If successful, you should see:
- Success message showing date range, cloud coverage, and mean NDVI
- 3-5 irrigation zones automatically created
- Zones color-coded from red (low vigor) to green (high vigor)
- Recommended irrigation rates for each zone

---

## Troubleshooting

### Issue: "Sentinel Hub API not configured"
**Solution**:
- Check that your credentials are added to `.env.local`
- Make sure variable names start with `VITE_` (Vite requirement)
- Restart the dev server after adding credentials

### Issue: "Auth failed: 401 Unauthorized"
**Solution**:
- Verify your Client ID and Client Secret are correct
- Make sure you copied the entire secret (they're very long)
- Check that you selected "Client credentials" grant type when creating the OAuth client

### Issue: "No data available for this time range"
**Solution**:
- The field may have been too cloudy in the last 30 days
- Try a different date range (modify `days` parameter in code)
- Check that your field geometry is valid (has coordinates)

### Issue: "Field has no geometry"
**Solution**:
- Go to **Fields** tab and add/edit the field
- Draw the field boundary on the map
- Save the field with geometry

### Issue: "API quota exceeded"
**Solution**:
- Free tier: 30,000 processing units/month
- Each NDVI request uses ~100-300 units depending on field size
- Check your usage in Sentinel Hub Dashboard
- Wait until next month or upgrade to paid plan

---

## API Usage & Limits

### Free Tier Limits
- **Processing Units**: 30,000/month
- **Requests**: Unlimited (rate limited)
- **Data Access**: All Sentinel-2 data
- **Resolution**: 10m

### Processing Unit Costs
- **Small field (5 acres)**: ~100 units
- **Medium field (20 acres)**: ~200 units
- **Large field (50 acres)**: ~300 units

**Estimate**: With 30,000 units, you can analyze ~100-300 fields per month.

### Checking Your Usage
1. Go to [Sentinel Hub Dashboard](https://apps.sentinel-hub.com/dashboard/)
2. Click **"Statistics"** in the sidebar
3. View your **Processing Unit** consumption

---

## Advanced Configuration

### Adjusting Date Range
In `sentinelHubApi.js`, you can modify the date range:

```javascript
// Default: last 30 days
const ndviData = await fetchNDVIForBlock(block, { days: 30 });

// Options:
{ days: 7 }   // Last week
{ days: 60 }  // Last 2 months
{ days: 90 }  // Last 3 months
```

### Cloud Coverage Threshold
In `sentinelHubApi.js`, find the request configuration:

```javascript
dataFilter: {
  timeRange: { ... },
  maxCloudCoverage: 30  // Change this (0-100)
}
```

Lower values (10-20) = fewer scenes but clearer imagery
Higher values (50-80) = more scenes but potentially cloudy

---

## Support & Resources

### Sentinel Hub Resources
- **Documentation**: [https://docs.sentinel-hub.com/](https://docs.sentinel-hub.com/)
- **Forum**: [https://forum.sentinel-hub.com/](https://forum.sentinel-hub.com/)
- **API Explorer**: [https://apps.sentinel-hub.com/requests-builder/](https://apps.sentinel-hub.com/requests-builder/)

### Vineyard Planner Support
- **GitHub Issues**: Create an issue in the vineyard-planner repository
- **Documentation**: See README.md and CLAUDE.md

---

## Next Steps

Once configured, you can:

1. **Fetch NDVI for all fields** to create VRI zones
2. **Export prescription maps** for VRI controllers
3. **Track vigor changes** by fetching NDVI at different dates
4. **Adjust irrigation rates** based on canopy vigor

**Happy irrigating! 🌱💧**
