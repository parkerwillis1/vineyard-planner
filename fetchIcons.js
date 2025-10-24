// Script to fetch Noun Project icons and save them
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');

const API_KEY = '768c27f383e948d8bc3b1e758d080e26';
const API_SECRET = '9390d20fb04c44019cee920b1c7e7f0e';
const BASE_URL = 'https://api.thenounproject.com/v2';

// OAuth 1.0a signature generation
function generateOAuthHeader(url, method = 'GET') {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');

  const params = {
    oauth_consumer_key: API_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0'
  };

  // Create signature base string
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');

  const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(API_SECRET)}&`;
  const signature = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');

  params.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.keys(params)
    .sort()
    .map(key => `${key}="${encodeURIComponent(params[key])}"`)
    .join(', ');

  return authHeader;
}

async function fetchIcon(iconId, name) {
  try {
    const url = `${BASE_URL}/icon/${iconId}`;
    const authHeader = generateOAuthHeader(url);

    console.log(`Fetching icon ${iconId} (${name})...`);

    const response = await axios.get(url, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    if (response.data && response.data.icon && response.data.icon.icon_url) {
      const svgUrl = response.data.icon.icon_url;
      console.log(`  SVG URL: ${svgUrl}`);

      // Fetch the SVG content
      const svgResponse = await axios.get(svgUrl);
      return {
        id: iconId,
        name: name,
        svg: svgResponse.data
      };
    }
  } catch (error) {
    console.error(`Error fetching icon ${iconId}:`, error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

async function main() {
  const icons = [
    { id: 3861608, name: 'CoreVineyardParameters' },
    { id: 7202627, name: 'VineyardSetup' },
    { id: 1141059, name: 'PrePlantingSitePrep' },
    { id: 6041571, name: 'PlantingCosts' },
    { id: 145039, name: 'CulturalOperations' },
    { id: 4347109, name: 'HarvestHauling' },
    { id: 7985658, name: 'CashOverhead' },
    { id: 8098531, name: 'Equipment' },
    { id: 8068589, name: 'Loans' },
    { id: 7975811, name: 'PurchasedGrapes' },
    { id: 8056745, name: 'UnsoldBottles' }
  ];

  const results = [];

  for (const icon of icons) {
    const result = await fetchIcon(icon.id, icon.name);
    if (result) {
      results.push(result);
    }
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save results to a JSON file
  fs.writeFileSync(
    'iconData.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n✅ Icons saved to iconData.json');
}

main();
