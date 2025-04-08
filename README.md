# Telegram MCP Bot

A Google Cloud Function that serves as a webhook for a Telegram bot. The function integrates with FastMCP to process user messages and generate intelligent responses.

## Features

- Handles Telegram webhook events
- Stores user conversation history in Firebase
- Uses FastMCP to process messages and select appropriate tools
- Maintains conversation context through summarization
- Implements sample tools for weather, search, and reminders

## Setup

### Prerequisites

- Node.js 18 or higher
- A Telegram bot created via [BotFather](https://t.me/botfather)
- A Firebase project with Firestore enabled
- A FastMCP API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/hotelbuddy-online/telegram-mcp-bot.git
   cd telegram-mcp-bot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create an environment file:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file and add your Telegram bot token and FastMCP API key.

### Local Development

Run the function locally for development:

```
npm start
```

Use a tool like [ngrok](https://ngrok.com/) to create a public URL for local testing.

### Deployment to Google Cloud Functions

1. Make sure you have the [Google Cloud SDK](https://cloud.google.com/sdk) installed and configured.

2. Deploy the function:
   ```
   gcloud functions deploy telegramWebhook \
     --runtime nodejs18 \
     --trigger-http \
     --allow-unauthenticated \
     --set-env-vars TELEGRAM_BOT_TOKEN=your_telegram_bot_token,MCP_API_KEY=your_mcp_api_key
   ```

3. Once deployed, get the function URL and set it as the webhook for your Telegram bot:
   ```
   curl -F "url=https://your-function-url" https://api.telegram.org/bot<your_telegram_bot_token>/setWebhook
   ```

## Customizing Tools

You can add, modify, or remove tools by editing the `tools` array in `index.js`. Each tool should have an `id`, `description`, and a `handler` function that processes parameters and returns a response.

## License

MIT
