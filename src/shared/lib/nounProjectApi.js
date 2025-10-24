// src/shared/lib/nounProjectApi.js
import axios from 'axios';

// Use proxy server to avoid CORS issues
const PROXY_URL = 'http://localhost:3001/api/noun-project';

/**
 * Search for icons from the Noun Project
 * @param {string} query - Search term (e.g., "vineyard", "grape", "tractor")
 * @param {number} limit - Number of results to return (default: 10)
 * @returns {Promise<Array>} Array of icon objects
 */
export async function searchIcons(query, limit = 10) {
  try {
    const response = await axios.get(`${PROXY_URL}/search`, {
      params: { query, limit }
    });

    return response.data.icons || [];
  } catch (error) {
    console.error('Error fetching icons from Noun Project:', error);
    return [];
  }
}

/**
 * Get a specific icon by ID
 * @param {number} iconId - The Noun Project icon ID
 * @returns {Promise<Object>} Icon object with SVG data
 */
export async function getIconById(iconId) {
  try {
    const response = await axios.get(`${PROXY_URL}/icon/${iconId}`);
    return response.data.icon;
  } catch (error) {
    console.error('Error fetching icon from Noun Project:', error);
    return null;
  }
}

/**
 * Get icon SVG content
 * @param {string} iconUrl - URL to the icon SVG
 * @returns {Promise<string>} SVG content as string
 */
export async function getIconSvg(iconUrl) {
  try {
    const response = await axios.get(`${PROXY_URL}/svg`, {
      params: { url: iconUrl }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching SVG:', error);
    return null;
  }
}
