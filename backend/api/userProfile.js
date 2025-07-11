const { CosmosClient } = require('@azure/cosmos');
const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = 'userProfiles';

const client = new CosmosClient({ endpoint, key });

module.exports = async function (context, req) {
  const container = client.database(databaseId).container(containerId);
  if (req.method === 'POST') {
    // Create or update user profile
    const profile = req.body;
    await container.items.upsert(profile);
    context.res = { status: 200, body: { message: 'Profile saved', profile } };
  } else if (req.method === 'GET') {
    // Fetch user profile
    const id = req.query.id;
    if (!id) {
      context.res = { status: 400, body: { error: 'Missing id' } };
      return;
    }
    const { resource } = await container.item(id, id).read();
    context.res = { status: 200, body: resource };
  } else {
    context.res = { status: 405, body: { error: 'Method not allowed' } };
  }
}; 