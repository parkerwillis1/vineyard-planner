# Hardware Integration Documentation

This directory contains guides for integrating physical sensors and hardware with Vineyard Planner.

## 📚 Documentation Files

### Temperature Sensor Integration

- **[Connecting-Temperature-Sensor-Guide.md](./Connecting-Temperature-Sensor-Guide.md)** - Step-by-step guide for connecting temperature sensors to fermentation tanks
  - Hardware options (Raspberry Pi, ESP32, Tilt, Inkbird)
  - Wiring diagrams
  - Copy-paste code examples
  - Troubleshooting

- **[IoT-Sensor-Integration.md](./IoT-Sensor-Integration.md)** - Technical reference for the IoT sensor system
  - API documentation
  - Webhook endpoints
  - Data formats
  - Alert configuration

- **[HARDWARE_INTEGRATIONS.md](./HARDWARE_INTEGRATIONS.md)** - General hardware integration overview
  - Supported devices
  - Integration patterns
  - Best practices

## 🌡️ Supported Sensors

### Cellar/Production Sensors (Winemaking)
- Tilt Hydrometer
- PLAATO Keg
- Inkbird WiFi Controllers
- Raspberry Pi + Temperature Probes
- ESP32/Arduino sensors
- WiFi/Bluetooth thermometers
- Modbus industrial sensors

### Field/Vineyard Sensors
- Weather Stations (Davis Vantage Pro2, ATMOS 41, Tempest, HOBO)
- Soil Moisture Sensors (METER TEROS, Delta-T, Sentek, Acclima)
- Flow Meters (irrigation monitoring)
- Pressure Sensors
- Dendrometers (trunk measurement)
- Raspberry Pi field stations
- ESP32 field sensors

## 🚀 Quick Start

1. **Set up database**: Run migrations from `supabase-migrations/`
2. **Deploy webhook**: Deploy Edge Function `ingest-temperature`
3. **Register sensor**: Use Production → IoT Sensors page
4. **Configure hardware**: Follow [Connecting-Temperature-Sensor-Guide.md](./Connecting-Temperature-Sensor-Guide.md)
5. **Verify data**: Check Production → Fermentation for live data

## 📖 Additional Resources

- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md` in project root
- **Supabase Migrations**: See `supabase-migrations/` directory
- **Support**: support@vineyardplanner.com

## 🔧 Hardware Purchase Links

See [Connecting-Temperature-Sensor-Guide.md](./Connecting-Temperature-Sensor-Guide.md#cost-breakdown) for pricing and vendor information.
