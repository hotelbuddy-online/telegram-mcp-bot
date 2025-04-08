/**
 * Utilities for managing conversation history and context
 */

/**
 * Summarize conversation history to provide context
 * @param {Array} history - Conversation history
 * @return {string} - Summary of the conversation
 */
function summarizeConversation(history) {
  if (!history || history.length === 0) return 'This is a new conversation.';
  
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
  
  // Check for common patterns in conversation
  if (hasGreeting(userMessages[0])) {
    summary += 'Conversation started with a greeting. ';
  }
  
  if (detectUserFrustration(userMessages.slice(-3))) {
    summary += 'User may be showing signs of frustration. ';
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
    'weather': ['weather', 'temperature', 'forecast', 'rain', 'sunny', 'cold', 'hot', 'humidity'],
    'search': ['search', 'find', 'look up', 'information', 'about', 'what is', 'tell me about'],
    'reminder': ['remind', 'reminder', 'schedule', 'later', 'forget', 'remember', 'notify'],
    'help': ['help', 'support', 'how to', 'guide', 'tutorial', 'explain', 'assistance'],
    'greetings': ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
    'preferences': ['prefer', 'preference', 'setting', 'configure', 'setup', 'customize']
  };
  
  const identifiedTopics = new Set();
  
  messages.forEach(message => {
    if (!message) return;
    
    const lowercaseMsg = message.toLowerCase();
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => lowercaseMsg.includes(keyword))) {
        identifiedTopics.add(topic);
      }
    });
  });
  
  return Array.from(identifiedTopics);
}

/**
 * Check if a message contains a greeting
 * @param {string} message - Message to check
 * @return {boolean} - True if message contains a greeting
 */
function hasGreeting(message) {
  if (!message) return false;
  
  const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
  const lowercaseMsg = message.toLowerCase();
  
  return greetings.some(greeting => lowercaseMsg.includes(greeting));
}

/**
 * Detect signs of user frustration in recent messages
 * @param {Array} recentMessages - Recent user messages
 * @return {boolean} - True if frustration is detected
 */
function detectUserFrustration(recentMessages) {
  if (!recentMessages || recentMessages.length === 0) return false;
  
  const frustrationIndicators = [
    'not working', 'doesn\'t work', 'can\'t understand', 'you don\'t understand',
    'wrong', 'incorrect', 'not what I asked', 'try again', 'frustrated',
    '!', '!!', '!!!', 'HELP', 'FIX', 'ERROR'
  ];
  
  return recentMessages.some(message => {
    if (!message) return false;
    const lowercaseMsg = message.toLowerCase();
    return frustrationIndicators.some(indicator => {
      if (indicator === '!' || indicator === '!!' || indicator === '!!!') {
        return message.includes(indicator);
      }
      if (indicator === 'HELP' || indicator === 'FIX' || indicator === 'ERROR') {
        return message.includes(indicator);
      }
      return lowercaseMsg.includes(indicator.toLowerCase());
    });
  });
}

module.exports = {
  summarizeConversation,
  identifyTopics,
  hasGreeting,
  detectUserFrustration
};