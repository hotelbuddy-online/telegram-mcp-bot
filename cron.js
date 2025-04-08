/**
 * Cloud function to process and send reminders
 * This should be set up as a Cloud Scheduler job
 */

const functions = require('@google-cloud/functions-framework');
const { Telegram } = require('telegraf');
const admin = require('firebase-admin');

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Initialize Telegram bot
const telegram = new Telegram(process.env.TELEGRAM_BOT_TOKEN);

// Process reminders HTTP function (to be triggered by Cloud Scheduler)
functions.http('processReminders', async (req, res) => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    // Find reminders that are due but haven't been sent yet
    const remindersSnapshot = await db.collection('reminders')
      .where('time', '<=', now)
      .where('notified', '==', false)
      .limit(100) // Process in batches to avoid timeout
      .get();
    
    if (remindersSnapshot.empty) {
      console.log('No pending reminders found.');
      res.status(200).send({ processed: 0 });
      return;
    }
    
    console.log(`Found ${remindersSnapshot.size} pending reminders.`);
    
    // Process each reminder
    const promises = [];
    remindersSnapshot.forEach(doc => {
      const reminder = doc.data();
      promises.push(processReminder(doc.id, reminder));
    });
    
    // Wait for all reminders to be processed
    await Promise.all(promises);
    
    res.status(200).send({ processed: remindersSnapshot.size });
  } catch (error) {
    console.error('Error processing reminders:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Process a single reminder
 * @param {string} reminderId - ID of the reminder document
 * @param {Object} reminder - Reminder data
 * @returns {Promise<void>}
 */
async function processReminder(reminderId, reminder) {
  try {
    const { userId, message } = reminder;
    
    // Format the reminder message
    const reminderText = `🔔 Reminder: ${message}`;
    
    // Send the reminder to the user
    await telegram.sendMessage(userId, reminderText);
    
    // Mark the reminder as notified
    await db.collection('reminders').doc(reminderId).update({
      notified: true,
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Sent reminder to user ${userId}: ${message}`);
  } catch (error) {
    console.error(`Error processing reminder ${reminderId}:`, error);
    
    // If this is a specific Telegram error that means the user blocked the bot,
    // we should still mark the reminder as processed to avoid repeated attempts
    if (error.code === 403) {
      await db.collection('reminders').doc(reminderId).update({
        notified: true,
        error: 'User blocked bot',
        errorAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
}
