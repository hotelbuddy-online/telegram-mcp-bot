# Firebase Setup Guide

This guide will help you set up Firebase for the Telegram MCP Bot.

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click "Add project" and follow the prompts to create a new project.
3. Give your project a name (e.g., "telegram-mcp-bot").
4. Enable Google Analytics if you want (optional).
5. Click "Create Project".

## 2. Set Up Firestore

1. From your Firebase project dashboard, click on "Firestore Database" in the left sidebar.
2. Click "Create database".
3. Start in production mode or test mode (you can change this later).
4. Select a location closest to your users.
5. Click "Enable".

## 3. Set Up Authentication (Optional)

If you want to secure your data with user authentication:

1. From your Firebase project dashboard, click on "Authentication" in the left sidebar.
2. Click "Get started".
3. Enable any sign-in methods you want to use (e.g., Email/Password, Google, etc.).

## 4. Set Up Service Account for Cloud Functions

1. From your Firebase project dashboard, click on the gear icon (⚙️) next to "Project Overview" and select "Project settings".
2. Go to the "Service accounts" tab.
3. Click "Generate new private key" under the Firebase Admin SDK section.
4. Save the JSON file securely - you'll need this for local development.

## 5. Configure Firestore Security Rules

1. From your Firebase project dashboard, click on "Firestore Database" in the left sidebar.
2. Go to the "Rules" tab.
3. Copy the contents of the `firestore.rules` file from this repository.
4. Click "Publish".

## 6. Set Up Firebase for Local Development

1. Install the Firebase CLI:
   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```
   firebase login
   ```

3. Initialize Firebase in your project directory:
   ```
   firebase init
   ```

4. Select the following options:
   - Firestore
   - Functions (if you plan to deploy functions locally)
   - Select your project
   - Accept the default options for the rest of the setup

5. Set up environment variables for your service account:
   ```
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account-file.json"
   ```

## 7. Database Structure

The Telegram MCP Bot uses the following Firestore collections:

1. `users` - Stores user information and conversation history
   - Document ID: Telegram user ID
   - Fields:
     - `telegramId`: String - Telegram user ID
     - `firstName`: String - User's first name
     - `lastName`: String - User's last name (optional)
     - `username`: String - Telegram username (optional)
     - `createdAt`: Timestamp - When the user was first created
     - `lastActivity`: Timestamp - Last interaction time
     - `conversationHistory`: Array - Recent message history
     - `preferences`: Map - User preferences (optional)

2. `reminders` - Stores user reminders
   - Document ID: Auto-generated
   - Fields:
     - `userId`: String - Telegram user ID
     - `message`: String - Reminder message
     - `time`: Timestamp - When to send the reminder
     - `notified`: Boolean - Whether the user has been notified
     - `createdAt`: Timestamp - When the reminder was created

## 8. Setting Up Indexes (If Needed)

If you plan to query reminders by user ID and time, you may need to create a composite index:

1. In the Firestore Database section, go to the "Indexes" tab.
2. Click "Add Index".
3. Collection ID: `reminders`
4. Fields to index:
   - `userId` (Ascending)
   - `time` (Ascending)
   - `notified` (Ascending)
5. Click "Create".

This will allow efficient queries for finding upcoming reminders for a specific user.