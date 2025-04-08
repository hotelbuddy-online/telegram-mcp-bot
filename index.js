const functions = require('@google-cloud/functions-framework');
const { Telegram } = require('telegraf');
const { FastMCP } = require('fastmcp');
const admin = require('firebase-admin');

// Initialize Firebase
admin.initializeApp();
const db = admin.firestore();

// Initialize Telegram bot
const telegram = new Telegram(process.env.TELEGRAM_BOT_TOKEN);

// Initialize FastMCP client
const mcp = new FastMCP({
  apiKey: process.env.MCP_API_KEY,
  baseUrl: process.env.MCP_BASE_URL || 'https://api.fastmcp.com'
});

// Tools available to the MCP client
const tools = [
  {
    id: 'weather',
    description: 'Get current weather information',
    handler: async (params) => {
      // Implementation for weather tool
      return `Weather in ${params.location}: ${params.temp}°C, ${params.conditions}`;
    }
  },
  {
    id: 'search',
    description: 'Search for information online',
    handler: async (params) => {
      // Implementation for search tool
      return `Search results for "${params.query}": ${params.results}`;
    }
  },
  {
    id: 'reminder',
    description: 'Set a reminder',
    handler: async (params) => {
      // Implementation for reminder tool
      return `Reminder set for ${params.time}: ${params.message}`;
    }
  }
];

// Main function that handles Telegram webhook
functions.http('telegramWebhook', async (req, res) => {
  try {
    // Extract user and message data from Telegram update
    const update = req.body;
    if (!update || !update.message) {
      res.status(400).send('Bad Request: No message in update');
      return;
    }

    const { message } = update;
    const { chat, from, text } = message;
    const userId = from.id.toString();
    const chatId = chat.id;

    // Log the incoming message
    console.log(`Received message from ${userId} in chat ${chatId}: ${text}`);

    // Look up user in Firebase
    const userDoc = await db.collection('users').doc(userId).get();
    let userData = {};
    let conversationHistory = [];

    if (userDoc.exists) {
      userData = userDoc.data();
      conversationHistory = userData.conversationHistory || [];
    } else {
      // Create new user record if it doesn't exist
      userData = {
        telegramId: userId,
        firstName: from.first_name,
        lastName: from.last_name || '',
        username: from.username || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        conversationHistory: []
      };
      await db.collection('users').doc(userId).set(userData);
    }

    // Add user message to conversation history
    conversationHistory.push({
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    });

    // Limit conversation history to last 10 messages
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }

    // Generate a summary of the conversation
    const conversationSummary = summarizeConversation(conversationHistory);

    // Call MCP to determine appropriate response and tool
    const mcpResponse = await mcp.query({
      prompt: text,
      context: {
        user: {
          id: userId,
          firstName: userData.firstName,
          preferences: userData.preferences || {}
        },
        conversationSummary,
        availableTools: tools.map(tool => ({ id: tool.id, description: tool.description }))
      }
    });

    // Process MCP response
    let responseText;
    if (mcpResponse.tool) {
      // Find the selected tool
      const selectedTool = tools.find(tool => tool.id === mcpResponse.tool.id);
      if (selectedTool) {
        // Execute the tool with the provided parameters
        const toolResult = await selectedTool.handler(mcpResponse.tool.params);
        responseText = `${mcpResponse.response}\n\n${toolResult}`;
      } else {
        responseText = mcpResponse.response;
      }
    } else {
      responseText = mcpResponse.response;
    }

    // Send response back to Telegram
    await telegram.sendMessage(chatId, responseText);

    // Add bot response to conversation history
    conversationHistory.push({
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString()
    });

    // Update user's conversation history in Firebase
    await db.collection('users').doc(userId).update({
      conversationHistory,
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    });

    // Respond to the webhook
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * Summarize conversation history to provide context
 * @param {Array} history - Conversation history
 * @return {string} - Summary of the conversation
 */
function summarizeConversation(history) {
  if (history.length === 0) return 'This is a new conversation.';
  
  // Extract key topics and intentions from the conversation
  const userMessages = history.filter(msg => msg.role === 'user').map(msg => msg.content);
  const botMessages = history.filter(msg => msg.role === 'assistant').map(msg => msg.content);
  
  // Simple approach: mention the number of exchanges and the most recent topics
  let summary = `Conversation with ${history.length} messages. `;
  
  if (userMessages.length > 0) {
    const lastUserMessage = userMessages[userMessages.length - 1];
    summary += `User last asked about: "${lastUserMessage.substring(0, 50)}${lastUserMessage.length > 50 ? '...' : ''}". `;
  }
  
  // Identify potential topics or intents
  const topics = identifyTopics(userMessages);
  if (topics.length > 0) {
    summary += `Main topics: ${topics.join(', ')}. `;
  }
  
  return summary;
}

/**
 * Simple topic identification from messages
 * @param {Array} messages - Array of message strings
 * @return {Array} - Array of identified topics
 */
function identifyTopics(messages) {
  // This is a very simplified approach
  // In a real application, you might use NLP or ML for better topic extraction
  const topicKeywords = {
    'weather': ['weather', 'temperature', 'forecast', 'rain', 'sunny'],
    'search': ['search', 'find', 'look up', 'information', 'about'],
    'reminder': ['remind', 'reminder', 'schedule', 'later', 'forget']
  };
  
  const identifiedTopics = new Set();
  
  messages.forEach(message => {
    const lowercaseMsg = message.toLowerCase();
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => lowercaseMsg.includes(keyword))) {
        identifiedTopics.add(topic);
      }
    });
  });
  
  return Array.from(identifiedTopics);
}