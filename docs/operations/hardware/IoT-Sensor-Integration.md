# IoT Sensor Integration Guide

This guide explains how to integrate temperature sensors with your Vineyard Planner account.

## Quick Start

1. **Register your sensor** in the Sensors dashboard
2. **Get your API key** from the sensor card
3. **Configure your sensor** to POST data to the webhook endpoint
4. **View live data** in the Fermentation Tracker

---

## Webhook Endpoint

**URL:** `https://your-project.supabase.co/functions/v1/ingest-temperature`

**Method:** `POST`

**Headers:**
```
X-API-Key: your_sensor_api_key_here
Content-Type: application/json
```

**Request Body:**
```json
{
  "temp_f": 68.5,
  "timestamp": "2025-11-18T10:30:00Z",
  "battery_level": 95,
  "humidity_percent": 65,
  "specific_gravity": 1.010
}
```

**Required Fields:**
- `temp_f` (number) - Temperature in Fahrenheit

**Optional Fields:**
- `temp_c` (number) - Temperature in Celsius (used if temp_f not provided)
- `timestamp` (string, ISO 8601) - Reading timestamp (defaults to now)
- `battery_level` (number, 0-100) - Battery percentage
- `humidity_percent` (number) - Relative humidity
- `specific_gravity` (number) - For hydrometers (Tilt, etc.)
- `raw_data` (object) - Any additional sensor data

**Response:**
```json
{
  "success": true,
  "reading_id": "uuid",
  "sensor_name": "Tank 1 Sensor",
  "temp_f": 68.5,
  "timestamp": "2025-11-18T10:30:00Z",
  "alerts": []
}
```

---

## Deployment

### Deploy the Supabase Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy ingest-temperature
```

---

## Sensor Examples

### 1. Raspberry Pi (Python)

**Install Dependencies:**
```bash
pip install requests adafruit-circuitpython-dht
```

**sensor_monitor.py:**
```python
import time
import requests
import adafruit_dht
from datetime import datetime
import board

# Configuration
API_KEY = "your_sensor_api_key_here"
WEBHOOK_URL = "https://your-project.supabase.co/functions/v1/ingest-temperature"
INTERVAL_SECONDS = 300  # Send every 5 minutes

# Initialize DHT22 sensor on GPIO4
dhtDevice = adafruit_dht.DHT22(board.D4)

def read_and_send():
    try:
        # Read sensor
        temp_c = dhtDevice.temperature
        humidity = dhtDevice.humidity

        # Convert to Fahrenheit
        temp_f = (temp_c * 9/5) + 32

        # Prepare payload
        payload = {
            "temp_f": round(temp_f, 2),
            "temp_c": round(temp_c, 2),
            "humidity_percent": round(humidity, 2),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        # Send to webhook
        headers = {
            "X-API-Key": API_KEY,
            "Content-Type": "application/json"
        }

        response = requests.post(WEBHOOK_URL, json=payload, headers=headers)

        if response.status_code == 200:
            print(f"✓ Sent: {temp_f}°F, {humidity}%")
        else:
            print(f"✗ Error: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"✗ Sensor error: {e}")

# Main loop
print("Starting temperature monitor...")
while True:
    read_and_send()
    time.sleep(INTERVAL_SECONDS)
```

**Run on boot (crontab):**
```bash
@reboot python3 /home/pi/sensor_monitor.py >> /home/pi/sensor.log 2>&1
```

---

### 2. ESP32/Arduino (WiFi Sensor)

**Arduino sketch:**
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// WiFi credentials
const char* ssid = "your-wifi-ssid";
const char* password = "your-wifi-password";

// API configuration
const char* apiKey = "your_sensor_api_key_here";
const char* webhookUrl = "https://your-project.supabase.co/functions/v1/ingest-temperature";

// DHT sensor
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void loop() {
  // Read sensor
  float temp_c = dht.readTemperature();
  float humidity = dht.readHumidity();
  float temp_f = (temp_c * 9.0/5.0) + 32.0;

  if (isnan(temp_c) || isnan(humidity)) {
    Serial.println("Failed to read sensor");
    delay(300000);
    return;
  }

  // Send data
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(webhookUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", apiKey);

    String payload = "{\"temp_f\":" + String(temp_f, 2) +
                     ",\"temp_c\":" + String(temp_c, 2) +
                     ",\"humidity_percent\":" + String(humidity, 2) + "}";

    int httpCode = http.POST(payload);

    if (httpCode == 200) {
      Serial.println("✓ Data sent: " + String(temp_f) + "°F");
    } else {
      Serial.println("✗ Error: " + String(httpCode));
    }

    http.end();
  }

  // Wait 5 minutes
  delay(300000);
}
```

---

### 3. Tilt Hydrometer Integration

**Node.js bridge (reads Bluetooth, forwards to API):**

```javascript
const TiltHydrometer = require('tilt-hydrometer');
const axios = require('axios');

const API_KEY = 'your_sensor_api_key_here';
const WEBHOOK_URL = 'https://your-project.supabase.co/functions/v1/ingest-temperature';

// Start scanning for Tilt
const tilt = new TiltHydrometer();

tilt.on('reading', async (data) => {
  // data.color: 'red', 'green', 'black', etc.
  // data.gravity: specific gravity (e.g., 1.050)
  // data.temp_f: temperature in Fahrenheit

  console.log(`Tilt ${data.color}: ${data.temp_f}°F, SG ${data.gravity}`);

  try {
    const response = await axios.post(WEBHOOK_URL, {
      temp_f: data.temp_f,
      specific_gravity: data.gravity,
      raw_data: { color: data.color, rssi: data.rssi }
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('✓ Data sent');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
});

tilt.startScanning();
console.log('Scanning for Tilt Hydrometer...');
```

---

### 4. cURL (Manual Testing)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/ingest-temperature \
  -H "X-API-Key: your_sensor_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "temp_f": 72.5,
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S)Z'"
  }'
```

---

### 5. Python Script (Generic)

```python
import requests
import time
from datetime import datetime

API_KEY = "your_sensor_api_key_here"
WEBHOOK_URL = "https://your-project.supabase.co/functions/v1/ingest-temperature"

def send_temperature(temp_f):
    payload = {
        "temp_f": temp_f,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }

    response = requests.post(WEBHOOK_URL, json=payload, headers=headers)

    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success: {data}")
    else:
        print(f"✗ Error {response.status_code}: {response.text}")

# Example: Send reading every 5 minutes
while True:
    temp_f = 68.5  # Replace with actual sensor reading
    send_temperature(temp_f)
    time.sleep(300)
```

---

## Alert Configuration

Set up temperature alerts in the Sensors dashboard:

1. Navigate to **Sensors** → **Alert Rules**
2. Click **Add Alert Rule**
3. Configure thresholds:
   - Minimum temperature (°F)
   - Maximum temperature (°F)
   - Alert email addresses
   - Cooldown period (minutes between alerts)

Alerts trigger automatically when sensor readings exceed thresholds.

---

## Troubleshooting

### Sensor shows "Offline"
- Check that sensor is sending data within the configured interval
- Verify API key is correct
- Check sensor has internet connectivity

### "Invalid API key" error
- Copy API key from sensor card (click eye icon)
- Ensure no spaces or extra characters
- Regenerate key if needed

### Readings not appearing
- Run the SQL migration: `supabase-migrations/create_sensor_system.sql`
- Deploy the Edge Function: `supabase functions deploy ingest-temperature`
- Check Supabase logs: `supabase functions logs ingest-temperature`

### No alerts received
- Verify alert rule is enabled
- Check thresholds are configured correctly
- Email notifications require additional setup (SendGrid, Resend, etc.)

---

## Best Practices

1. **Set realistic check-in intervals** - 5-15 minutes for fermentations
2. **Monitor battery levels** - Replace/recharge when below 20%
3. **Use cooldown periods** - Avoid alert spam (recommended: 60 minutes)
4. **Test before deploying** - Use cURL to verify webhook works
5. **Keep firmware updated** - Many sensors have OTA updates

---

## Hardware Recommendations

| Sensor | Price | Pros | Cons |
|--------|-------|------|------|
| **Tilt Hydrometer** | $150 | Gravity + temp, Bluetooth | Expensive, battery replacement |
| **Inkbird WiFi** | $40 | Cheap, WiFi, reliable | Temperature only |
| **DIY Raspberry Pi** | $50 | Fully customizable, multiple sensors | Requires setup |
| **ESP32 + DHT22** | $15 | Ultra cheap, WiFi | Requires programming |

---

## Need Help?

- Check the [GitHub Issues](https://github.com/your-repo/issues)
- Email support at support@vineyardplanner.com
- Join our Discord community
