# How to Connect a Temperature Sensor to Your Fermentation Tank

**Complete step-by-step guide for winemakers**

---

## Overview

This guide walks you through connecting a temperature sensor to monitor your fermentation tank in real-time through Vineyard Planner.

**Time Required:** 30-60 minutes
**Skill Level:** Beginner-friendly
**Cost:** $15-150 depending on hardware choice

---

## Step 1: Choose Your Hardware

### Option A: Raspberry Pi + Temperature Probe ($50)
**Best for:** Multiple tanks, DIY-friendly, most flexible

**What You Need:**
- Raspberry Pi Zero W or 4 (~$35)
- DHT22 or DS18B20 temperature sensor (~$5)
- Power supply
- MicroSD card (8GB+)
- 3 jumper wires

**Pros:**
- Can monitor multiple sensors
- Reliable WiFi connection
- Expandable for future sensors

**Cons:**
- Requires basic setup

---

### Option B: Inkbird WiFi Temperature Controller ($40)
**Best for:** Quick setup, plug-and-play

**What You Need:**
- Inkbird ITC-308-WIFI (~$40)
- WiFi connection

**Pros:**
- Ready to use out of box
- Includes temperature control relay
- Built-in display

**Cons:**
- One sensor per device
- Requires custom firmware or integration

---

### Option C: Tilt Hydrometer ($150)
**Best for:** Monitoring gravity + temperature

**What You Need:**
- Tilt Hydrometer (any color)
- Bluetooth-enabled device to bridge data
- Raspberry Pi or smartphone for data relay

**Pros:**
- Measures temperature AND specific gravity
- Wireless, battery-powered
- Floats in the tank

**Cons:**
- Most expensive
- Requires Bluetooth bridge
- Battery replacement needed

---

### Option D: ESP32 + DHT22 ($15)
**Best for:** Ultra-budget, DIY electronics

**What You Need:**
- ESP32 DevKit (~$10)
- DHT22 sensor (~$5)
- USB power supply
- 3 jumper wires

**Pros:**
- Cheapest option
- Built-in WiFi
- Very small

**Cons:**
- Requires programming (Arduino IDE)
- Less beginner-friendly

---

## Step 2: Deploy the System Backend

### 2.1 Run Database Migration

1. **Log into Supabase:**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor:**
   - Click **SQL Editor** in left sidebar
   - Click **New Query**

3. **Run Migration:**
   - Open file: `supabase-migrations/create_sensor_system.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click **Run**

4. **Verify Success:**
   ```sql
   -- Run this query to check
   SELECT table_name FROM information_schema.tables
   WHERE table_name LIKE 'temperature_%';
   ```
   - Should show 4 tables

---

### 2.2 Deploy Webhook Endpoint

**On your computer:**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
# Replace YOUR_PROJECT_REF with your actual project reference
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the webhook
supabase functions deploy ingest-temperature
```

**Get your webhook URL:**
- Format: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-temperature`
- Save this URL - you'll need it later!

---

## Step 3: Register Sensor in Vineyard Planner

1. **Navigate to Sensors:**
   - Log into Vineyard Planner
   - Go to **Production** → **IoT Sensors**

2. **Click "Add Sensor"**

3. **Fill Out Form:**

   **Sensor Name:**
   ```
   Tank 1 Temperature Probe
   ```

   **Sensor Type:** Select based on your hardware:
   - Raspberry Pi → Select "Raspberry Pi"
   - Inkbird → Select "WiFi Sensor (Generic)"
   - Tilt → Select "Tilt Hydrometer"
   - ESP32 → Select "ESP32/Arduino"

   **Assign To:**
   - Select **"Tank/Barrel"** radio button
   - Choose your fermentation tank from dropdown

   **Check-in Interval:**
   - Set to `15` minutes
   - (Sensor should send data at least every 15 min)

   **Notes:**
   ```
   Probe installed on side of tank at mid-level
   ```

4. **Click "Register Sensor"**

5. **Copy API Key:**
   - Click the **eye icon** 👁️ to reveal API key
   - Click **copy icon** 📋 to copy
   - **SAVE THIS KEY** - you'll need it in the next step!

---

## Step 4: Set Up Your Hardware

Choose the guide for your hardware:

---

### 🥧 **OPTION A: Raspberry Pi Setup**

#### Physical Installation:

1. **Wire the DHT22 sensor:**
   ```
   DHT22 Sensor → Raspberry Pi
   VCC (Pin 1)  → 3.3V (Pin 1)
   DATA (Pin 2) → GPIO4 (Pin 7)
   GND (Pin 4)  → Ground (Pin 6)
   ```

2. **Install probe:**
   - Use thermowell on tank, OR
   - Tape probe to side of tank (insulate from ambient air)
   - Route wire to Raspberry Pi location

3. **Power up Raspberry Pi**

#### Software Setup:

```bash
# SSH into your Pi
ssh pi@raspberrypi.local
# Default password: raspberry

# Install dependencies
sudo apt-get update
sudo apt-get install python3-pip
pip3 install requests adafruit-circuitpython-dht

# Create sensor script
nano ~/tank_monitor.py
```

**Paste this code:**

```python
#!/usr/bin/env python3
import time
import requests
import adafruit_dht
from datetime import datetime
import board

# ============================================
# CONFIGURATION - UPDATE THESE VALUES
# ============================================
API_KEY = "PASTE_YOUR_API_KEY_HERE"
WEBHOOK_URL = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-temperature"
INTERVAL_SECONDS = 300  # Send every 5 minutes
SENSOR_PIN = board.D4   # GPIO4 (Physical Pin 7)

# ============================================
# MAIN PROGRAM - DON'T EDIT BELOW
# ============================================
dhtDevice = adafruit_dht.DHT22(SENSOR_PIN)

print(f"Tank Temperature Monitor Started")
print(f"Sending data every {INTERVAL_SECONDS/60} minutes")
print("-" * 50)

def send_temperature():
    try:
        # Read sensor
        temp_c = dhtDevice.temperature
        humidity = dhtDevice.humidity
        temp_f = (temp_c * 9/5) + 32

        # Prepare data
        payload = {
            "temp_f": round(temp_f, 2),
            "humidity_percent": round(humidity, 2),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        # Send to Vineyard Planner
        headers = {
            "X-API-Key": API_KEY,
            "Content-Type": "application/json"
        }

        response = requests.post(WEBHOOK_URL, json=payload, headers=headers)

        if response.status_code == 200:
            print(f"✓ {datetime.now().strftime('%H:%M:%S')} - Sent: {temp_f:.1f}°F")
        else:
            print(f"✗ Error {response.status_code}: {response.text}")

    except RuntimeError as e:
        print(f"✗ Sensor read error: {e}")
    except Exception as e:
        print(f"✗ Error: {e}")

# Main loop
while True:
    send_temperature()
    time.sleep(INTERVAL_SECONDS)
```

**Update the configuration:**
1. Replace `PASTE_YOUR_API_KEY_HERE` with your actual API key
2. Replace `YOUR_PROJECT_REF` with your Supabase project reference
3. Save: `Ctrl+X`, then `Y`, then `Enter`

**Test it:**
```bash
python3 ~/tank_monitor.py
```

You should see:
```
Tank Temperature Monitor Started
Sending data every 5.0 minutes
--------------------------------------------------
✓ 14:23:15 - Sent: 68.3°F
```

**Make it run automatically:**
```bash
# Add to startup
crontab -e

# Add this line at the bottom:
@reboot sleep 30 && /usr/bin/python3 /home/pi/tank_monitor.py >> /home/pi/tank_monitor.log 2>&1

# Save and exit
```

**Reboot to test:**
```bash
sudo reboot
```

After reboot, check it's running:
```bash
tail -f ~/tank_monitor.log
```

---

### 🔧 **OPTION B: ESP32 Setup**

#### Physical Installation:

1. **Wire DHT22 to ESP32:**
   ```
   DHT22      → ESP32
   VCC (Pin 1) → 3.3V
   DATA (Pin 2)→ GPIO4
   GND (Pin 4) → GND
   ```

2. **Connect ESP32 to computer via USB**

#### Software Setup:

1. **Install Arduino IDE:**
   - Download from https://www.arduino.cc/en/software
   - Install ESP32 board support

2. **Install Libraries:**
   - Go to **Sketch → Include Library → Manage Libraries**
   - Search and install: `DHT sensor library`
   - Search and install: `Adafruit Unified Sensor`

3. **Create New Sketch:**

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* apiKey = "PASTE_YOUR_API_KEY_HERE";
const char* webhookUrl = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-temperature";

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// ============================================
// MAIN PROGRAM
// ============================================
void setup() {
  Serial.begin(115200);
  dht.begin();

  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

void loop() {
  // Read sensor
  float temp_c = dht.readTemperature();
  float humidity = dht.readHumidity();
  float temp_f = (temp_c * 9.0/5.0) + 32.0;

  if (isnan(temp_c) || isnan(humidity)) {
    Serial.println("Failed to read sensor");
    delay(300000); // Wait 5 min and retry
    return;
  }

  // Send data
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(webhookUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", apiKey);

    String payload = "{\"temp_f\":" + String(temp_f, 2) +
                     ",\"humidity_percent\":" + String(humidity, 2) + "}";

    int httpCode = http.POST(payload);

    if (httpCode == 200) {
      Serial.printf("✓ Sent: %.1f°F\n", temp_f);
    } else {
      Serial.printf("✗ Error: %d\n", httpCode);
    }
    http.end();
  }

  delay(300000); // Wait 5 minutes
}
```

4. **Update configuration in code**
5. **Upload to ESP32:** Click **Upload** button
6. **Monitor output:** Tools → Serial Monitor (115200 baud)

---

### 🍺 **OPTION C: Tilt Hydrometer**

See detailed guide: `IoT-Sensor-Integration.md` (Tilt section)

---

## Step 5: Verify It's Working

### Check in Vineyard Planner:

1. **Go to Production → IoT Sensors**
   - Your sensor should show:
     - Status: **Active** (green)
     - Current Temp: Recent reading
     - Last Reading: Recent timestamp

2. **Go to Production → Fermentation**
   - Select your fermenting lot
   - Look for **"LIVE"** green badge on temperature card
   - Temperature should match your sensor

### Troubleshoot:

**Sensor shows "Offline"**
- Check hardware is powered on
- Check WiFi connection
- Verify sensor script is running

**No data appearing**
- Check API key is correct
- Test webhook with curl:
  ```bash
  curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-temperature \
    -H "X-API-Key: YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"temp_f": 72.5}'
  ```

---

## Step 6: Set Up Alerts (Optional)

Monitor temperature and get notified when it goes out of range:

```sql
-- In Supabase SQL Editor
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
  'YOUR_SENSOR_ID', -- Copy from sensors page
  'Fermentation Temperature Alert',
  50,  -- Alert if below 50°F
  85,  -- Alert if above 85°F
  ARRAY['your@email.com'],
  true
);
```

---

## Maintenance

### Weekly:
- ✓ Check sensor is still sending data
- ✓ Verify temperature readings are accurate

### Monthly:
- ✓ Clean temperature probe
- ✓ Check battery (if wireless)
- ✓ Verify WiFi signal strength

### Seasonally:
- ✓ Recalibrate sensor
- ✓ Check for firmware updates

---

## Best Practices

1. **Probe Placement:**
   - Install at mid-level of tank
   - Avoid direct contact with grape solids
   - Use thermowell if available

2. **Reading Frequency:**
   - Active fermentation: Every 5-10 minutes
   - Slow fermentation: Every 15-30 minutes
   - Cold storage: Every hour

3. **Multiple Sensors:**
   - Large tanks (>1000 gal): Use 2-3 sensors
   - Small tanks (<500 gal): 1 sensor sufficient

4. **Backup Power:**
   - Consider UPS for Raspberry Pi
   - Use battery backup for WiFi router

---

## Cost Breakdown

| Item | Cost | Where to Buy |
|------|------|--------------|
| Raspberry Pi Zero W | $15 | Adafruit, Amazon |
| DHT22 Sensor | $5 | Amazon, eBay |
| Power Supply | $10 | Amazon |
| MicroSD Card | $10 | Amazon |
| Jumper Wires | $5 | Amazon |
| **Total** | **~$45** | |

**OR**

| Item | Cost | Where to Buy |
|------|------|--------------|
| ESP32 DevKit | $10 | Amazon, AliExpress |
| DHT22 Sensor | $5 | Amazon |
| USB Cable/Power | $5 | Amazon |
| **Total** | **~$20** | |

---

## Next Steps

1. ✅ Set up your first sensor
2. ⏭️ Add sensors to other tanks
3. ⏭️ Monitor fermentation progress in real-time
4. ⏭️ Set up temperature alerts
5. ⏭️ Track historical temperature trends

---

## Need Help?

- **Technical Issues:** See `DEPLOYMENT_GUIDE.md` (project root)
- **Hardware Questions:** See `IoT-Sensor-Integration.md`
- **Support:** support@vineyardplanner.com

---

**You're all set!** Your fermentation tank is now monitored 24/7. 🎉
