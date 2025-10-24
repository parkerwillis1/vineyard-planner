// Simple Express server to proxy Noun Project API requests
// This avoids CORS issues and keeps API keys server-side
import express from 'express';
import axios from 'axios';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = '768c27f383e948d8bc3b1e758d080e26';
const API_SECRET = '9390d20fb04c44019cee920b1c7e7f0e';
const BASE_URL = 'https://api.thenounproject.com/v2';

// Initialize OAuth 1.0a
const oauth = OAuth({
  consumer: {
    key: API_KEY,
    secret: API_SECRET
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  }
});

// Proxy endpoint to get icon by ID
app.get('/api/noun-project/icon/:id', async (req, res) => {
  try {
    const iconId = req.params.id;
    const url = `${BASE_URL}/icon/${iconId}`;

    const requestData = {
      url,
      method: 'GET'
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData));

    const response = await axios.get(url, {
      headers: {
        ...authHeader,
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching from Noun Project:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Proxy endpoint to get SVG content
app.get('/api/noun-project/svg', async (req, res) => {
  try {
    const svgUrl = req.query.url;
    if (!svgUrl) {
      return res.status(400).json({ error: 'SVG URL required' });
    }

    const response = await axios.get(svgUrl);
    res.set('Content-Type', 'image/svg+xml');
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching SVG:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Noun Project proxy server running on http://localhost:${PORT}`);
});
