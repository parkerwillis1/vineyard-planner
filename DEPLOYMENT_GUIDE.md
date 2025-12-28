# IoT Sensor System - Deployment Guide

## 🚀 Complete Deployment Checklist

Follow these steps to deploy the full IoT sensor integration system:

---

## Step 1: Run Database Migrations

**Navigate to your Supabase SQL Editor** and run these migrations in order:

### 1.1 Create Sensor System Tables
```sql
-- Run the file: supabase-migrations/create_sensor_system.sql
```

This creates:
- `temperature_sensors` table
- `temperature_readings` table
- `temperature_alert_rules` table
- `temperature_alert_history` table
- All indexes, RLS policies, triggers, and functions

### 1.2 Verify Migration Success

```sql
-- Check that tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'temperature_%';

-- Expected result: 4 tables
-- temperature_sensors
-- temperature_readings
-- temperature_alert_rules
-- temperature_alert_history
```

---

## Step 2: Deploy Supabase Edge Function

### 2.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 2.2 Login and Link Project

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF
```

**Find your project ref:**
- Go to https://app.supabase.com
- Select your project
- Project ref is in the URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`

### 2.3 Deploy the Ingest Function

```bash
cd /path/to/vineyard-planner

# Deploy the temperature ingestion endpoint
supabase functions deploy ingest-temperature --project-ref YOUR_PROJECT_REF
```

### 2.4 Test the Deployment

```bash
# Get your function URL
# Format: https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-temperature

# Test with curl (use a fake API key for testing)
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-temperature \
  -H "X-API-Key: test_key_123" \
  -H "Content-Type: application/json" \
  -d '{"temp_f": 68.5}'

# Expected error: "Invalid API key" (proves endpoint is working)
```

---

## Step 3: Register Your First Sensor

### 3.1 Navigate to Sensors Page

1. Go to **Production** → **IoT Sensors**
2. Click **"Add Sensor"**

### 3.2 Fill Out Sensor Details

**Required Fields:**
- **Sensor Name**: e.g., "Tank 1 Temperature Sensor"
- **Sensor Type**: Select your hardware type (Tilt, Raspberry Pi, etc.)
- **Assign To**: Select a tank/vessel or specific lot

**Optional Fields:**
- Manufacturer, Model, Serial Number
- Check-in Interval (default: 15 minutes)
- Notes

### 3.3 Save and Get API Key

1. Click **"Register Sensor"**
2. Click the **eye icon** to reveal the API key
3. Copy the API key (64-character hex string)

---

## Step 4: Configure Your Sensor Hardware

Choose the appropriate guide based on your sensor type:

### Option A: Raspberry Pi with DHT22 Sensor

```bash
# SSH into your Raspberry Pi
ssh pi@raspberrypi.local

# Install Python dependencies
pip install requests adafruit-circuitpython-dht

# Create sensor script
nano ~/sensor_monitor.py
```

**Paste this code** (update API_KEY and WEBHOOK_URL):

```python
import time
import requests
import adafruit_dht
from datetime import datetime
import board

# YOUR CONFIGURATION
API_KEY = "paste_your_64_char_api_key_here"
WEBHOOK_URL = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-temperature"
INTERVAL_SECONDS = 300  # 5 minutes

# Initialize DHT22 on GPIO4
dhtDevice = adafruit_dht.DHT22(board.D4)

def send_reading():
    try:
        temp_c = dhtDevice.temperature
        humidity = dhtDevice.humidity
        temp_f = (temp_c * 9/5) + 32

        payload = {
            "temp_f": round(temp_f, 2),
            "humidity_percent": round(humidity, 2),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        response = requests.post(
            WEBHOOK_URL,
            json=payload,
            headers={"X-API-Key": API_KEY, "Content-Type": "application/json"}
        )

        if response.status_code == 200:
            print(f"✓ {temp_f}°F sent")
        else:
            print(f"✗ Error: {response.status_code}")

    except Exception as e:
        print(f"✗ {e}")

# Main loop
while True:
    send_reading()
    time.sleep(INTERVAL_SECONDS)
```

**Run on boot:**
```bash
# Add to crontab
crontab -e

# Add this line:
@reboot python3 /home/pi/sensor_monitor.py >> /home/pi/sensor.log 2>&1

# Test manually first
python3 ~/sensor_monitor.py
```

### Option B: ESP32/Arduino (WiFi Sensor)

See: `docs/operations/hardware/IoT-Sensor-Integration.md` for Arduino sketch

### Option C: Tilt Hydrometer

See: `docs/operations/hardware/IoT-Sensor-Integration.md` for Node.js bridge

### Option D: Manual Testing (curl)

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-temperature \
  -H "X-API-Key: YOUR_ACTUAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "temp_f": 72.5,
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S)Z'"
  }'
```

---

## Step 5: Verify Live Data

### 5.1 Check Sensor Status

1. Go to **Production** → **IoT Sensors**
2. Your sensor should show:
   - Status: **Active** (green badge)
   - Current Temp: Shows latest reading
   - Last Reading: Timestamp of last data point

### 5.2 View in Fermentation Tracker

1. Go to **Production** → **Fermentation**
2. Select a lot that has a sensor assigned
3. Look for the **"Live"** badge on the temperature card
4. Temperature should update automatically

### 5.3 Check Database

```sql
-- View recent readings
SELECT
  s.name as sensor_name,
  r.temp_f,
  r.reading_timestamp,
  r.received_at
FROM temperature_readings r
JOIN temperature_sensors s ON s.id = r.sensor_id
WHERE r.user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com')
ORDER BY r.reading_timestamp DESC
LIMIT 10;
```

---

## Step 6: Configure Temperature Alerts (Optional)

### 6.1 Navigate to Alert Rules

1. Go to **Production** → **IoT Sensors**
2. Click **"Alert Rules"** tab (coming soon in UI)
3. Or manually insert via SQL:

```sql
INSERT INTO temperature_alert_rules (
  user_id,
  sensor_id,
  name,
  min_temp_f,
  max_temp_f,
  alert_email,
  enabled
)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your@email.com'),
  'YOUR_SENSOR_ID',
  'Tank 1 Temperature Monitor',
  50,  -- Minimum temp (°F)
  85,  -- Maximum temp (°F)
  ARRAY['alerts@yourwinery.com'],
  true
);
```

### 6.2 Test Alert Trigger

Send a temperature reading outside your thresholds:

```bash
# Send temperature above max (triggers alert)
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-temperature \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"temp_f": 95.0}'
```

Check alert history:
```sql
SELECT * FROM temperature_alert_history
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com')
ORDER BY created_at DESC;
```

---

## Troubleshooting

### Issue: "Invalid API key" error

**Solution:**
1. Go to **Production** → **IoT Sensors**
2. Click eye icon to reveal API key
3. Copy entire 64-character string
4. Ensure no spaces or line breaks in your code

### Issue: Sensor shows "Offline"

**Possible causes:**
- Sensor stopped sending data
- Check-in interval exceeded
- Network connectivity issue

**Debug:**
```bash
# Check if sensor script is running (Raspberry Pi)
ps aux | grep sensor_monitor

# Check logs
tail -f ~/sensor.log

# Test network connectivity
ping google.com
```

### Issue: Readings not appearing in UI

**Check:**
1. Run this query to see if readings are in database:
```sql
SELECT COUNT(*) FROM temperature_readings
WHERE sensor_id = 'YOUR_SENSOR_ID';
```

2. If COUNT > 0 but not showing in UI:
   - Refresh browser
   - Check browser console for errors
   - Verify RLS policies are correct

### Issue: Edge Function deployment fails

**Solution:**
```bash
# Update Supabase CLI
npm update -g supabase

# Re-link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy with verbose logging
supabase functions deploy ingest-temperature --debug
```

---

## Performance & Scaling

### Recommended Settings

| Fermentation Size | Check-in Interval | Sensors per Tank |
|-------------------|-------------------|------------------|
| Small (< 100 gal) | 15 minutes | 1 |
| Medium (100-500 gal) | 10 minutes | 1-2 |
| Large (> 500 gal) | 5 minutes | 2-4 |

### Database Cleanup (Optional)

**Auto-delete old readings** (keep last 90 days):

```sql
-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_readings()
RETURNS void AS $$
BEGIN
  DELETE FROM temperature_readings
  WHERE reading_timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if available)
-- Or run manually periodically
SELECT cleanup_old_readings();
```

---

## Security Best Practices

1. **Keep API keys secret** - Never commit to git
2. **Rotate keys regularly** - Use "Regenerate API Key" button
3. **Use HTTPS only** - Supabase handles this automatically
4. **Monitor for anomalies** - Check alert history regularly
5. **Limit permissions** - RLS policies protect user data

---

## Cost Estimates

### Supabase (Free tier sufficient for most users)
- Database: < 1 MB per sensor per month
- Edge Function: < 1000 invocations/day
- Bandwidth: Minimal

### Hardware Costs
- **Raspberry Pi + DHT22**: $50 (one-time)
- **ESP32 + sensor**: $15 (one-time)
- **Tilt Hydrometer**: $150 (one-time)
- **Inkbird WiFi**: $40 (one-time)

---

## Next Steps

1. ✅ Deploy database migrations
2. ✅ Deploy Edge Function
3. ✅ Register first sensor
4. ✅ Configure hardware
5. ✅ Verify live data
6. ⏭️ Add more sensors for other tanks
7. ⏭️ Set up email alerts (requires SendGrid/Resend API)
8. ⏭️ Build custom dashboards

---

## Support

- **Documentation**: `docs/operations/hardware/IoT-Sensor-Integration.md`
- **GitHub Issues**: https://github.com/your-repo/issues
- **Email**: support@vineyardplanner.com

---

## Changelog

**v1.0.0** (2025-11-18)
- Initial IoT sensor system release
- Support for unlimited sensors
- Hardware-agnostic webhook API
- Real-time temperature display
- Alert system framework
