// Example implementation of a weather tool
const axios = require('axios');

const weatherApiKey = process.env.WEATHER_API_KEY;
const weatherApiBaseUrl = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Get current weather information for a location
 * @param {Object} params - Weather parameters
 * @param {string} params.location - Location name or coordinates
 * @returns {Promise<string>} - Formatted weather information
 */
async function getWeather(params) {
  try {
    if (!params.location) {
      return 'Please provide a location for weather information.';
    }

    const response = await axios.get(weatherApiBaseUrl, {
      params: {
        q: params.location,
        appid: weatherApiKey,
        units: 'metric'
      }
    });

    const { data } = response;
    const temp = Math.round(data.main.temp);
    const conditions = data.weather[0].description;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const cityName = data.name;
    const country = data.sys.country;

    return `Weather in ${cityName}, ${country}: ${temp}°C, ${conditions}. ` +
           `Humidity: ${humidity}%, Wind: ${windSpeed} m/s`;
  } catch (error) {
    console.error('Weather API error:', error.message);
    return `Sorry, I couldn't retrieve weather information for "${params.location}". ` +
           'Please check the location name and try again.';
  }
}

module.exports = {
  id: 'weather',
  description: 'Get current weather information for a location',
  handler: getWeather
};