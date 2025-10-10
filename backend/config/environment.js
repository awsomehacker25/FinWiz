// Environment configuration for the Finance AI backend
require('dotenv').config();

const config = {
  // Azure Cosmos DB Configuration
  cosmos: {
    uri: process.env.COSMOS_DB_URI || 'https://your-cosmos-db.documents.azure.com:443/',
    key: process.env.COSMOS_DB_KEY || 'your-cosmos-db-key',
    database: process.env.COSMOS_DB_DATABASE || 'FinanceAI'
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key'
  },

  // Azure Notification Hubs
  notifications: {
    connectionString: process.env.NOTIFICATION_HUB_CONNECTION_STRING || 'your-notification-hub-connection-string',
    hubName: process.env.NOTIFICATION_HUB_NAME || 'your-notification-hub-name'
  },

  // Azure AD B2C Configuration
  auth: {
    tenantId: process.env.AZURE_AD_B2C_TENANT_ID || 'your-tenant-id',
    clientId: process.env.AZURE_AD_B2C_CLIENT_ID || 'your-client-id',
    clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET || 'your-client-secret'
  },

  // Application Settings
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 7071
  }
};

module.exports = config;
