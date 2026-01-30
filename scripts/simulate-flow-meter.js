#!/usr/bin/env node

/**
 * Flow Meter Simulator for Trellis
 *
 * Simulates a real flow meter sending data to test the Live Monitor.
 * Run with: node scripts/simulate-flow-meter.js
 */

// ============ CONFIGURE THESE ============
const WEBHOOK_URL = 'https://api.trellisag.com/functions/v1/flow-meter-webhook';
const DEVICE_TOKEN = '3f041317-f835-474f-94ac-9f47996951c5';  // Paste your token from Trellis
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3eGJ4b2p3bWRob2V5YnFtZXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDk1MTUsImV4cCI6MjA2ODUyNTUxNX0.8Gk8ggioMAz1xq1qurdv1-UTzSVDzU237bO99Mtmy8E';
const ZONE_NUMBER = 1;

// Simulation settings
const SEND_INTERVAL_SECONDS = 10;        // How often to send readings
const IRRIGATION_DURATION_MINUTES = 5;   // How long each irrigation runs
const PAUSE_BETWEEN_MINUTES = 2;         // Pause between irrigations
const FLOW_RATE_GPM = 15.5;               // Simulated flow rate
const FLOW_RATE_VARIANCE = 0.5;          // Random variance in flow
// =========================================

let isIrrigating = false;
let irrigationStartTime = null;
let pauseStartTime = null;
let totalGallons = 0;
let readingCount = 0;

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
}

async function sendReading(flowRate) {
  const payload = {
    flow_rate_gpm: flowRate,
    cumulative_gallons: totalGallons,
    zone_number: ZONE_NUMBER,
    timestamp: new Date().toISOString()
  };

  // Token goes in URL query string, anon key in Authorization header
  const urlWithToken = `${WEBHOOK_URL}?token=${DEVICE_TOKEN}`;

  try {
    const response = await fetch(urlWithToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      readingCount++;
      log(`✓ Sent: ${flowRate.toFixed(2)} GPM | Total: ${totalGallons.toFixed(1)} gal | Reading #${readingCount}`);
      if (data.session_action && data.session_action !== 'none') {
        log(`  → Session ${data.session_action.toUpperCase()}`);
      }
    } else {
      log(`✗ Error: ${data.error || response.statusText}`);
    }
  } catch (error) {
    log(`✗ Network error: ${error.message}`);
  }
}

function getSimulatedFlowRate() {
  if (!isIrrigating) return 0;

  // Add some realistic variance
  const variance = (Math.random() - 0.5) * 2 * FLOW_RATE_VARIANCE;
  return Math.max(0.1, FLOW_RATE_GPM + variance);
}

async function tick() {
  const now = Date.now();

  if (!isIrrigating && !pauseStartTime) {
    // Start a new irrigation cycle
    isIrrigating = true;
    irrigationStartTime = now;
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('💧 IRRIGATION STARTED');
    log(`   Duration: ${IRRIGATION_DURATION_MINUTES} minutes`);
    log(`   Flow rate: ~${FLOW_RATE_GPM} GPM`);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  if (isIrrigating) {
    const elapsedMinutes = (now - irrigationStartTime) / 1000 / 60;

    if (elapsedMinutes >= IRRIGATION_DURATION_MINUTES) {
      // End irrigation
      isIrrigating = false;
      pauseStartTime = now;
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('⏹️  IRRIGATION STOPPED');
      log(`   Total water: ${totalGallons.toFixed(1)} gallons`);
      log(`   Pausing for ${PAUSE_BETWEEN_MINUTES} minutes...`);
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Send a few zero readings to trigger session end
      await sendReading(0);
      return;
    }

    const flowRate = getSimulatedFlowRate();
    totalGallons += (flowRate / 60) * SEND_INTERVAL_SECONDS;
    await sendReading(flowRate);

  } else if (pauseStartTime) {
    const pauseElapsed = (now - pauseStartTime) / 1000 / 60;

    if (pauseElapsed >= PAUSE_BETWEEN_MINUTES) {
      pauseStartTime = null;
      log('');
      log('🔄 Starting next irrigation cycle...');
      log('');
    } else {
      // Send zero flow during pause
      await sendReading(0);
    }
  }
}

// Main
console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         TRELLIS FLOW METER SIMULATOR                      ║');
console.log('╠═══════════════════════════════════════════════════════════╣');
console.log(`║  Webhook: ${WEBHOOK_URL.substring(0, 45)}...  ║`);
console.log(`║  Interval: Every ${SEND_INTERVAL_SECONDS} seconds                              ║`);
console.log(`║  Irrigation: ${IRRIGATION_DURATION_MINUTES} min on, ${PAUSE_BETWEEN_MINUTES} min off                        ║`);
console.log('║                                                           ║');
console.log('║  Press Ctrl+C to stop                                     ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

if (DEVICE_TOKEN === 'YOUR_TOKEN_HERE') {
  console.log('❌ ERROR: You need to set your DEVICE_TOKEN!');
  console.log('');
  console.log('   1. Go to Trellis → Settings → Devices');
  console.log('   2. Copy the token from your webhook URL (after ?token=)');
  console.log('   3. Paste it in this script where it says YOUR_TOKEN_HERE');
  console.log('');
  process.exit(1);
}

// Run immediately, then every interval
tick();
setInterval(tick, SEND_INTERVAL_SECONDS * 1000);
