// authConfig.js
// Configuration values come from environment variables (.env locally,
// or Azure App Service "Application settings" once deployed).
// Get these values from your App Registration in the Entra admin center.

require('dotenv').config();

const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID, // Application (client) ID
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`, // Directory (tenant) ID
    clientSecret: process.env.CLIENT_SECRET, // Client secret value
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message) {
        // Uncomment for verbose MSAL debug logs
        // console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 'Info',
    },
  },
};

// Scopes requested at sign-in and when calling Microsoft Graph
const GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';
const scopes = ['user.read'];

const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/redirect';
const POST_LOGOUT_REDIRECT_URI = process.env.POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000';

module.exports = {
  msalConfig,
  scopes,
  REDIRECT_URI,
  POST_LOGOUT_REDIRECT_URI,
  GRAPH_ME_ENDPOINT,
};
