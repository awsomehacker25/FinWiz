const { CosmosClient } = require('@azure/cosmos');
const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = 'communityThreads';

const client = new CosmosClient({ endpoint, key });

module.exports = async function (context, req) {
  const container = client.database(databaseId).container(containerId);
  if (req.method === 'POST') {
    // Create a new thread
    const thread = req.body;
    await container.items.create(thread);
    context.res = { status: 200, body: { message: 'Thread created', thread } };
  } else if (req.method === 'GET') {
    // List all threads
    const { resources } = await container.items.readAll().fetchAll();
    context.res = { status: 200, body: resources };
  } else {
    context.res = { status: 405, body: { error: 'Method not allowed' } };
  }
}; 