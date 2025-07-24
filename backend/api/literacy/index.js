const { getCosmosClient } = require('../../shared/cosmosClient');
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = 'lessonCompletions';

const client = getCosmosClient();

module.exports = async function (context, req) {
  const container = client.database(databaseId).container(containerId);
  if (req.method === 'GET') {
    // Get user progress
    const userId = req.query.userId;
    if (!userId) {
      context.res = { status: 400, body: { error: 'Missing userId' } };
      return;
    }
    try {
      const { resource } = await container.item(userId, userId).read();
      if (!resource) {
        context.res = { status: 200, body: { userId, lessons: {} } };
      } else {
        context.res = { status: 200, body: resource };
      }
    } catch (err) {
      if (err.code === 404) {
        context.res = { status: 200, body: { userId, lessons: {} } };
      } else {
        context.res = { status: 500, body: { error: 'Failed to fetch progress', details: err.message } };
      }
    }
  } else if (req.method === 'POST') {
    // Upsert user progress
    const { userId, lessons } = req.body;
    if (!userId || !lessons) {
      context.res = { status: 400, body: { error: 'Missing userId or lessons' } };
      return;
    }
    try {
      await container.items.upsert({ id: userId, userId, lessons });
      context.res = { status: 200, body: { message: 'Progress updated' } };
    } catch (err) {
      context.res = { status: 500, body: { error: 'Failed to update progress', details: err.message } };
    }
  } else {
    context.res = { status: 405, body: { error: 'Method not allowed' } };
  }
}; 