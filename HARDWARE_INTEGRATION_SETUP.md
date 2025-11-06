# 🔌 Hardware Integration Setup Guide

This guide explains how to set up the irrigation hardware integration system to automatically log irrigation events from controllers, flow meters, and other hardware.

## 📋 Overview

The hardware integration system allows you to:
- Connect irrigation controllers (Rachio, Hunter Hydrawise, etc.)
- Integrate flow meters for real-time water usage tracking
- Automatically log irrigation events when your system runs
- Track water balance across all your vineyard fields

## ✅ Supported Controllers

**Working NOW:**
- **Rachio Smart Sprinkler** (Recommended) - Native webhooks, instant sync
- **Hunter Hydrawise** - API polling every 15 minutes (requires deployment)
- **Flow Meters** - Any meter with HTTP/webhook capability
- **Custom Webhook** - Any device that can send POST requests

**Commercial vineyard controllers** (Galcon, Baseline, Verdi, Mottech) don't have public APIs yet. We're working on partnerships.

## 🗄️ Database Setup

### Step 1: Run the Migration

First, you need to create the required database tables. Run this SQL migration in your Supabase SQL Editor:

```bash
# Navigate to your project
cd /Users/willis/Desktop/Vinyard\ Planner/vineyard-planner

# The migration file is located at:
supabase/migrations/20241105_irrigation_hardware.sql
```

Copy and paste the contents into Supabase SQL Editor and run it.

This creates:
- `irrigation_devices` - Stores your registered hardware
- `device_zone_mappings` - Maps zones to vineyard fields
- Updates `irrigation_events` table to track source (manual vs webhook)

### Step 2: Deploy Edge Functions

Deploy both the webhook endpoint and polling function:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the webhook function (for Rachio, flow meters, custom)
supabase functions deploy irrigation-webhook

# Deploy the Hydrawise polling function
supabase functions deploy hydrawise-polling

# Set environment variables (if needed)
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Schedule Hydrawise Polling (Optional - only if using Hunter Hydrawise)

Set up a cron job to poll Hydrawise every 15 minutes. You can use:

**Option A: External Cron Service (Easiest)**
- Use cron-job.org, EasyCron, or similar
- Schedule: Every 15 minutes
- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/hydrawise-polling`
- Method: POST
- Headers: `Authorization: Bearer YOUR_SUPABASE_ANON_KEY`

**Option B: GitHub Actions**
Create `.github/workflows/hydrawise-poll.yml`:
```yaml
name: Poll Hydrawise
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
jobs:
  poll:
    runs-on: ubuntu-latest
    steps:
      - name: Call Hydrawise Polling Function
        run: |
          curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/hydrawise-polling" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

Your webhook endpoint will be available at:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/irrigation-webhook?token=YOUR_DEVICE_TOKEN
```

The token parameter is automatically included when you copy the webhook URL from the Hardware Integration UI.

## 🖥️ Using the Hardware Integration UI

### Step 1: Access Hardware Integration

1. Log into Vineyard Planner
2. Navigate to **Vineyard Operations**
3. Click **Hardware** → **Devices** in the sidebar

### Step 2: Add a Device

1. Click **"Add Device"** button
2. Select your device type:
   - Rain Bird (IQ4, ESP-TM2)
   - Hunter Hydrawise
   - Toro Sentinel
   - Generic Flow Meter
   - Custom Webhook

3. Fill in device details:
   - **Device Name**: e.g., "Main Pump Station"
   - **Device ID**: Serial number or MAC address
   - **API Key**: If your device type requires it

4. Click **"Add Device"**

You'll receive a unique webhook URL for this device.

### Step 3: Map Zones to Fields

1. On your device card, click **"Configure Zones"**
2. Click **"Add Zone Mapping"**
3. Fill in zone details:
   - **Zone Number**: The zone number on your controller (1-10)
   - **Zone Name**: Optional friendly name
   - **Vineyard Field**: Select which field this zone irrigates
   - **Flow Rate (GPM)**: Enter the flow rate for this zone
   - **Irrigation Method**: Drip, Micro-sprinkler, etc.

4. Click **"Save Zone"**

Repeat for all zones on your controller.

## 🔧 Hardware Configuration

### Rain Bird IQ4/ESP-TM2

1. Open Rain Bird app
2. Go to Settings → Developer Options
3. Enable "Webhook Notifications"
4. Paste your webhook URL from Vineyard Planner
5. Set notification events:
   - ✅ Zone Start
   - ✅ Zone Complete
   - ✅ Program Complete

**Webhook Format Rain Bird Sends:**
```json
{
  "zone_number": 1,
  "start_time": "2024-11-05T06:00:00Z",
  "end_time": "2024-11-05T08:30:00Z",
  "flow_rate_avg": 157.5
}
```

### Hunter Hydrawise

Hunter uses API polling instead of webhooks:

1. Log into Hydrawise.com
2. Go to My Account → API Settings
3. Generate API Key
4. In Vineyard Planner, enter API key when adding device
5. System will poll Hydrawise API every 15 minutes for new events

### Toro Sentinel

1. Contact Toro support: support@toro.com
2. Request "External Data Integration" enablement
3. They'll provide configuration XML file
4. Upload XML file in Vineyard Planner device settings

### Generic Flow Meter (ModBus, HTTP)

For flow meters with network capability:

1. Configure flow meter to send HTTP POST on irrigation end
2. Use the webhook URL from Vineyard Planner
3. Format payload as:
```json
{
  "zone_number": 1,
  "start_time": "2024-11-05T06:00:00Z",
  "end_time": "2024-11-05T08:30:00Z",
  "total_gallons": 42500
}
```

### DIY Arduino/ESP32 Solution

#### Hardware Required:
- ESP32 board ($8)
- YF-S201 flow sensor ($12)
- 12V power supply ($10)
- Weatherproof enclosure ($15)

#### Arduino Code:
See `/docs/arduino-flow-sensor-example.ino` for complete code.

**Quick Setup:**
1. Connect flow sensor to ESP32 GPIO pin 2
2. Upload sketch with your WiFi credentials
3. Set webhook URL in code
4. Power on and test

## 🧪 Testing Your Setup

### Using the Built-In Webhook Tester

1. Navigate to **Hardware** → **Webhook Tester**
2. Select your device from dropdown
3. Choose which zone to test
4. Set test irrigation times and flow rate
5. Click **"Send Test Webhook"**

If successful, you'll see:
- ✅ Success message
- Event ID created
- New irrigation event in your history

### Using cURL

Copy the cURL command from the tester and run in terminal:

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/irrigation-webhook?token=abc123xyz" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "zone_number": 1,
    "start_time": "2024-11-05T06:00:00Z",
    "end_time": "2024-11-05T08:30:00Z",
    "flow_rate_avg": 150,
    "notes": "Test irrigation"
  }'
```

**Note**: The Authorization header with your Supabase anon key is required for all webhook requests. The webhook tester automatically includes this header.

Expected response:
```json
{
  "success": true,
  "event_id": "uuid-here",
  "message": "Irrigation event logged for Main Pump zone 1"
}
```

## 📊 Viewing Automated Events

Irrigation events logged via webhook will show with a purple **"Auto"** badge:

```
Drip Irrigation [⚡ Auto Z1]
```

vs manually logged events:

```
Drip Irrigation
```

## 🔐 Security

- Each device has a unique webhook token
- Tokens are UUID v4 (impossible to guess)
- Rate limited to 1000 requests/day per device
- Device can be disabled/deleted anytime
- All requests are logged for auditing

## 🐛 Troubleshooting

### Webhook Returns 401 Unauthorized
- Check webhook token is correct
- Device may be disabled (check device settings)

### Webhook Returns 404 Zone Not Found
- Verify zone number matches your mapping
- Check zone mapping was saved correctly
- Zone must be mapped to a field

### Events Not Appearing
- Check webhook tester for detailed error messages
- Verify Supabase Edge Function is deployed
- Check browser console for errors
- Ensure irrigation_events table has data

### Flow Rate Calculation Issues
- Ensure zone mapping has flow_rate_gpm set
- Or include flow_rate_avg in webhook payload
- Or include total_gallons directly

## 📝 Webhook Payload Reference

### Required Fields:
```json
{
  "zone_number": 1,           // Required: Which zone ran
  "start_time": "ISO8601",    // Required: When irrigation started
  "end_time": "ISO8601"       // Required: When irrigation ended
}
```

### Optional Fields:
```json
{
  "flow_rate_avg": 150.5,     // Average GPM (calculated if not provided)
  "total_gallons": 42500,     // Total water used (calculated if not provided)
  "notes": "string"           // Optional notes
}
```

### Auto-Calculated Values:
- **Duration**: Calculated from start_time → end_time
- **Total Gallons**: flow_rate_avg × duration_hours × 60 (if not provided)
- **Irrigation Method**: Taken from zone mapping
- **Block ID**: Looked up from zone mapping

## 🎯 Best Practices

1. **Test First**: Always use webhook tester before connecting real hardware
2. **Monitor Initially**: Check first few events log correctly
3. **Set Accurate Flow Rates**: Critical for water balance calculations
4. **Map All Zones**: Don't leave zones unmapped
5. **Use Descriptive Names**: Make zone names meaningful
6. **Backup Configuration**: Document your zone mappings

## 💡 Tips

- **Multiple Controllers**: You can add unlimited devices
- **Same Zone, Multiple Fields**: Not supported - one zone = one field
- **Overlapping Zones**: System will track water correctly per field
- **Historical Data**: Webhooks only create new events, not historical
- **Manual Override**: You can still manually log irrigation anytime

## 📞 Support

If you encounter issues:
1. Check webhook tester output for specific errors
2. Verify zone mappings are correct
3. Check Supabase function logs
4. Contact support with device type and error message

---

**System Status**: ✅ Hardware Integration Active

Last Updated: November 5, 2024
