// Example implementation of a search tool
const axios = require('axios');

const searchApiKey = process.env.SEARCH_API_KEY;
const searchEngineId = process.env.SEARCH_ENGINE_ID;
const searchApiBaseUrl = 'https://www.googleapis.com/customsearch/v1';

/**
 * Search for information online
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @returns {Promise<string>} - Formatted search results
 */
async function search(params) {
  try {
    if (!params.query) {
      return 'Please provide a search query.';
    }

    const response = await axios.get(searchApiBaseUrl, {
      params: {
        key: searchApiKey,
        cx: searchEngineId,
        q: params.query,
        num: 3 // Number of results to return
      }
    });

    const { items } = response.data;
    if (!items || items.length === 0) {
      return `No results found for "${params.query}".`;
    }

    let results = `Here are some results for "${params.query}":\n\n`;
    items.forEach((item, index) => {
      results += `${index + 1}. ${item.title}\n${item.snippet}\n${item.link}\n\n`;
    });

    return results.trim();
  } catch (error) {
    console.error('Search API error:', error.message);
    return `Sorry, I couldn't retrieve search results for "${params.query}". Please try again later.`;
  }
}

module.exports = {
  id: 'search',
  description: 'Search for information online',
  handler: search
};