const functions = require('@google-cloud/functions-framework');
const { Telegram } = require('telegraf');
const { FastMCP } = require('fastmcp');
const admin = require('firebase-admin');

// Import utility modules
const { summarizeConversation } = require('./utils/conversationUtils');
const { tools, getAvailableTools, findToolById } = require('./tools');

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
        availableTools: getAvailableTools()
      }
    });

    // Process MCP response
    let responseText;
    if (mcpResponse.tool) {
      // Find the selected tool
      const selectedTool = findToolById(mcpResponse.tool.id);
      if (selectedTool) {
        // Add userId to the parameters for tools that need it
        const toolParams = {
          ...mcpResponse.tool.params,
          userId: userId
        };
        
        // Execute the tool with the provided parameters
        const toolResult = await selectedTool.handler(toolParams);
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