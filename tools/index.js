/**
 * Tools registry for the Telegram MCP Bot
 */

const weatherTool = require('./weather');
const searchTool = require('./search');
const reminderTool = require('./reminder');

// Add all tools to the registry
const tools = [
  weatherTool,
  searchTool,
  reminderTool,
  // Add more tools here
];

/**
 * Get a list of all available tools with their ID and descriptions
 * @returns {Array} Array of tool objects with id and description
 */
function getAvailableTools() {
  return tools.map(tool => ({
    id: tool.id,
    description: tool.description
  }));
}

/**
 * Find a tool by its ID
 * @param {string} toolId - The ID of the tool to find
 * @returns {Object|null} The tool object or null if not found
 */
function findToolById(toolId) {
  return tools.find(tool => tool.id === toolId) || null;
}

module.exports = {
  tools,
  getAvailableTools,
  findToolById
};