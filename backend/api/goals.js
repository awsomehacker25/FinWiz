const { CosmosClient } = require('@azure/cosmos');
const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = 'savingsGoals';

const client = new CosmosClient({ endpoint, key });

module.exports = async function (context, req) {
  const container = client.database(databaseId).container(containerId);
  if (req.method === 'POST') {
    // Create or update savings goal
    const goal = req.body;
    await container.items.upsert(goal);
    context.res = { status: 200, body: { message: 'Goal saved', goal } };
  } else if (req.method === 'GET') {
    const userId = req.query.userId;
    if (!userId) {
      context.res = { status: 400, body: { error: 'Missing userId' } };
      return;
    }
    // List all goals for user
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }]
    }).fetchAll();
    context.res = { status: 200, body: resources };
  } else {
    context.res = { status: 405, body: { error: 'Method not allowed' } };
  }
}; 