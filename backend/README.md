# Finance-AI Azure Functions Backend

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Configure `local.settings.json` with your Cosmos DB and Notification Hub credentials.
3. Start the local Azure Functions runtime:
   ```
   npm start
   ```

## Deployment
- Use Azure CLI or VS Code Azure Functions extension to deploy to your Azure subscription.

## Functions
- `api/userProfile.js` - User profile CRUD
- `api/income.js` - Income entry CRUD and summaries
- `api/goals.js` - Savings goals CRUD
- `api/literacy.js` - Literacy lessons
- `api/community.js` - Community threads