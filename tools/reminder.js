// Example implementation of a reminder tool
const admin = require('firebase-admin');

/**
 * Set a reminder for a user
 * @param {Object} params - Reminder parameters
 * @param {string} params.userId - User ID
 * @param {string} params.time - Time for the reminder
 * @param {string} params.message - Reminder message
 * @returns {Promise<string>} - Confirmation message
 */
async function setReminder(params) {
  try {
    if (!params.userId || !params.time || !params.message) {
      return 'Missing required parameters for setting a reminder.';
    }

    // Parse the time string into a Date object
    let reminderTime;
    try {
      reminderTime = new Date(params.time);
      if (isNaN(reminderTime.getTime())) {
        throw new Error('Invalid time format');
      }
    } catch (error) {
      return `Sorry, I couldn't understand the time "${params.time}". Please use a format like "tomorrow at 3pm" or "April 15, 2025 at 10:00".`;
    }

    // Store the reminder in Firestore
    const db = admin.firestore();
    await db.collection('reminders').add({
      userId: params.userId,
      message: params.message,
      time: admin.firestore.Timestamp.fromDate(reminderTime),
      notified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Format the time for display
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    const formattedTime = reminderTime.toLocaleDateString('en-US', options);

    return `I'll remind you on ${formattedTime}: "${params.message}"`;
  } catch (error) {
    console.error('Reminder error:', error.message);
    return 'Sorry, I encountered an error while setting your reminder. Please try again later.';
  }
}

module.exports = {
  id: 'reminder',
  description: 'Set a reminder with a message for a specific time',
  handler: setReminder
};