const { CosmosClient } = require('@azure/cosmos');
const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = 'lessonCompletions';

const LESSONS = [
  { id: '1', title: 'How to Save for a Visa', content: '...', language: 'en' },
  { id: '2', title: 'Understanding US Taxes', content: '...', language: 'en' },
  { id: '3', title: 'Building Credit', content: '...', language: 'en' },
];

const client = new CosmosClient({ endpoint, key });

module.exports = async function (context, req) {
  const container = client.database(databaseId).container(containerId);
  if (req.method === 'GET') {
    // List all lessons (static)
    context.res = { status: 200, body: LESSONS };
  } else if (req.method === 'POST') {
    // Mark lesson as complete for a user
    const { userId, lessonId } = req.body;
    if (!userId || !lessonId) {
      context.res = { status: 400, body: { error: 'Missing userId or lessonId' } };
      return;
    }
    await container.items.upsert({ id: `${userId}_${lessonId}`, userId, lessonId, completed: true });
    context.res = { status: 200, body: { message: 'Lesson marked as complete' } };
  } else {
    context.res = { status: 405, body: { error: 'Method not allowed' } };
  }
}; 