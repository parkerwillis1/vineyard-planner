# Hardware Integrations for Vineyard Planner

This document outlines the hardware and IoT integrations available in the Vineyard Planner system.

## Overview

The Vineyard Planner supports automatic data collection from:
- 🌧️ **Rain Gauges / Weather Stations**
- 💧 **Irrigation Controllers**
- 📊 **Flow Meters**
- 🎛️ **Smart Valves**
- 🌡️ **Soil Moisture Sensors** *(already implemented)*

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Vineyard Planner                      │
│                   (Your System)                         │
└──────────────┬──────────────────────────────────────────┘
               │
     ┌─────────┼─────────┬─────────┬──────────┐
     │         │         │         │          │
  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐  ┌───▼───┐  ┌──▼──┐
  │Rain │  │Irrig│  │Flow │  │Smart  │  │Soil │
  │Gauge│  │Ctrl │  │Meter│  │Valves │  │Sens │
  └─────┘  └─────┘  └─────┘  └───────┘  └─────┘
```

Data flows automatically from hardware → database → water balance calculations → irrigation recommendations.

---

## 1. Rain Gauge Integration 🌧️

### Supported Devices

#### **Davis Instruments WeatherLink**
- **Models:** Vantage Pro2, Vantage Vue
- **Connection:** WeatherLink Cloud API
- **Data:** Rainfall, temp, humidity, wind, solar radiation
- **Setup:**
  1. Get WeatherLink API key from davis.com
  2. Add rain gauge in Vineyard Planner
  3. Enter API key and station ID
  4. Data syncs hourly

#### **Onset HOBO Data Loggers**
- **Models:** RG3, RG3-M, MX2501
- **Connection:** CSV file import or HOBOlink API
- **Data:** Rainfall with high accuracy (0.2mm resolution)
- **Setup:**
  1. Export CSV from HOBOware or HOBOlink
  2. Upload CSV to Vineyard Planner
  3. Auto-imports to rain gauge readings

#### **Rainwise Weather Stations**
- **Models:** Rainwise MKIII, IP-100
- **Connection:** Local API or cloud API
- **Data:** Full weather station data
- **Setup:** Connect via Rainwise IP address or cloud account

#### **Manual Rain Gauges**
- Any rain gauge (tipping bucket, manual)
- Manual entry via UI or CSV import
- Great for getting started

### Database Tables

- `rain_gauges` - Station configurations
- `rainfall_readings` - Timeseries rainfall data (raw)
- `daily_rainfall_summary` - Daily aggregates (optimized queries)

### API Functions

```javascript
// Rain gauge management
import { createRainGauge, listRainGauges } from '@/shared/lib/rainGaugeApi';

// Get rainfall for a block
import { getBlockRainfall } from '@/shared/lib/rainGaugeApi';
const { data } = await getBlockRainfall(blockId, '2025-01-01', '2025-03-31');
// Returns: { totalMm: 45.2, totalInches: 1.78, gaugeName: "North Field Station" }
```

---

## 2. Irrigation Controller Integration 💧

### Supported Controllers

#### **Baseline Irrigation Controller**
- **Website:** baselineirrigationcontroller.com
- **Features:** Advanced scheduling, flow monitoring, mobile app
- **API:** REST API with event history
- **Setup:**
  1. Get Baseline API key from account
  2. Add controller in Vineyard Planner
  3. Map controller zones to vineyard blocks
  4. Sync runs automatically (hourly or on-demand)

#### **Hunter Hydrawise**
- **Models:** HC, Pro-HC, HPC
- **Features:** Cloud-based, weather-aware scheduling
- **API:** Hydrawise API v2
- **Setup:**
  1. Get API key from hydrawise.com account
  2. Connect controller
  3. Map relays to blocks
  4. Auto-sync irrigation events

#### **Rachio Smart Sprinkler Controller**
- **Models:** Rachio 3, Rachio 3e
- **Features:** Smart scheduling, flow detection, weather intelligence
- **API:** Rachio Public API v1
- **Setup:**
  1. Get Bearer token from rachio.com developer portal
  2. Add device ID
  3. Map zones to blocks
  4. Real-time sync via webhooks or polling

#### **RainMachine**
- **Models:** Touch HD-12, Touch HD-16, Mini-8
- **Features:** Local control, weather-based scheduling
- **API:** Local REST API (v4)
- **Connection:** Local network (no cloud required)
- **Setup:**
  1. Find RainMachine IP address on your network
  2. Enter password
  3. Map zones to blocks
  4. Local sync

### How It Works

1. **Zone Mapping:**
   ```
   Controller Zone 1 → North Block (Cabernet)
   Controller Zone 2 → South Block (Chardonnay)
   Controller Zone 3 → East Block (Pinot Noir)
   ```

2. **Auto-Sync:**
   - Hourly sync pulls new irrigation events
   - Events auto-populate `irrigation_events` table
   - Water balance updates automatically

3. **Event Data:**
   - Date/time of irrigation
   - Duration (hours)
   - Flow rate (GPM) if available
   - Total gallons applied

### API Functions

```javascript
import {
  syncBaselineController,
  syncHydrawiseController,
  syncRachioController
} from '@/shared/lib/controllerIntegrations';

// Sync Baseline controller
const result = await syncBaselineController(
  controllerId,
  apiKey,
  externalControllerId,
  '2025-01-01',
  '2025-01-31'
);
// Returns: { imported: 45, total: 45 }
```

---

## 3. Flow Meter Integration 📊

### Supported Flow Meters

#### **Smart Flow Meters with Data Logging**
- **McCrometer Raptor**
- **Badger M2000**
- **Sensus iPERL**
- **Neptune E-Coder**

#### **Features:**
- Continuous flow monitoring
- Totalizer readings
- Leak detection
- Battery-powered (10+ year life)

### Connection Methods

1. **Pulse Output:**
   - Flow meter sends pulses per gallon
   - Data logger counts pulses
   - Upload via USB or cellular

2. **Modbus/RS485:**
   - Direct digital communication
   - Real-time flow rates
   - Gateway device required

3. **LoRaWAN:**
   - Long-range wireless
   - Low power consumption
   - Cloud integration

4. **Cellular (LTE-M/NB-IoT):**
   - Direct cloud connection
   - No gateway needed
   - Monthly data plan required

### Implementation

Flow meter data is recorded as irrigation events:
```javascript
// Flow meter reading triggers event creation
{
  block_id: "uuid",
  event_date: "2025-03-15",
  start_time: "06:00:00",
  end_time: "08:30:00",
  duration_hours: 2.5,
  flow_rate_gpm: 48, // Average during event
  total_water_gallons: 7200, // From flow meter totalizer
  irrigation_method: "Drip",
  is_automated: true,
  notes: "Auto-recorded from flow meter #FM-001"
}
```

---

## 4. Smart Valve Integration 🎛️

### Supported Valves

#### **Motorized Ball Valves with Controllers**
- **Cla-Val**
- **Hunter ICV**
- **Bermad S-Series**

#### **Smart Valve Controllers**
- **Baseline ValveLink**
- **Toro Sentinel**
- **Rain Bird IQ4**

### Features

- **Runtime Tracking:** Automatically log open/close times
- **Flow Integration:** Combine with flow meters for precise water measurement
- **Remote Control:** Open/close valves from app
- **Scheduling:** Automated irrigation schedules

### Implementation

Smart valves integrate with irrigation controllers to provide:
- Precise start/stop times
- Runtime verification
- Fault detection (valve stuck open/closed)
- Zone isolation for maintenance

---

## 5. Complete Water Balance Calculation

With all integrations active, your water balance becomes:

```
Water Balance = (Irrigation + Rainfall) - ETc
```

### Data Sources:

- **ETc (Crop Water Use):** OpenET satellite data ✅ Live
- **Irrigation:** Controller auto-sync ✅ Live
- **Rainfall:** Weather station ✅ Live
- **Result:** Real-time irrigation recommendations

### Example:

```
Block: North Cabernet (5 acres)
Period: Last 7 days

ETc (OpenET):           35.2 mm (1.39")
Irrigation (Baseline):  +28.5 mm (1.12")
Rainfall (Davis):       +8.0 mm (0.31")
────────────────────────────────────────
Net Balance:            +1.3 mm (+0.05")

Status: ✅ Adequate moisture
Recommendation: Monitor, no irrigation needed
```

---

## Setup Guide

### Step 1: Run Database Migrations

```bash
# In Supabase SQL Editor, run these migrations in order:
1. 20251103_irrigation_management.sql (already done)
2. 20251104_rain_gauge_tracking.sql (new)
3. 20251104_controller_zone_mappings.sql (new)
```

### Step 2: Add Hardware

1. **Add Rain Gauge:**
   - Settings → Weather Stations → Add Rain Gauge
   - Enter station details, API keys
   - Assign to vineyard blocks

2. **Add Irrigation Controller:**
   - Settings → Controllers → Add Controller
   - Select type (Baseline, Hydrawise, etc.)
   - Enter API credentials
   - Map zones to blocks

3. **Configure Flow Meters:**
   - Settings → Flow Meters → Add Meter
   - Enter meter ID, location
   - Configure data logger endpoint

### Step 3: Verify Data Flow

- Dashboard → Irrigation Management
- Select a block
- Check "Debug Info" panel:
  - ETc from OpenET ✅
  - Irrigation events from controller ✅
  - Rainfall from weather station ✅

### Step 4: Review Recommendations

- System calculates deficit automatically
- Irrigation recommendations update daily
- Alerts when irrigation needed

---

## API Endpoints Summary

### Rain Gauges
```javascript
listRainGauges()
createRainGauge(gauge)
getBlockRainfall(blockId, startDate, endDate)
bulkCreateRainfallReadings(gaugeId, readings)
```

### Controllers
```javascript
listControllers()
createController(controller)
syncBaselineController(...)
syncHydrawiseController(...)
syncRachioController(...)
createZoneMapping(controllerId, zoneId, blockId)
```

### Irrigation Events
```javascript
listIrrigationEvents(blockId, startDate, endDate)
createIrrigationEvent(event)
getIrrigationSummary(blockId, startDate, endDate)
```

---

## Future Enhancements

### Coming Soon:
- 🔔 **Webhooks:** Real-time push from controllers
- 📱 **Mobile App:** iOS/Android for field data entry
- 🤖 **Auto-Scheduling:** AI-powered irrigation scheduling
- 📊 **Advanced Analytics:** ML models for predictive irrigation
- 🌐 **More Controllers:** Irritrol, Toro, Orbit

---

## Support

For hardware integration questions:
- Check device manufacturer's API documentation
- Contact support@vineyardplanner.com
- Community forum: forum.vineyardplanner.com

## Developer Resources

- **API Docs:** `/docs/api/`
- **Database Schema:** `/supabase/migrations/`
- **Integration Code:** `/src/shared/lib/`
