const { getCosmosClient } = require('../../shared/cosmosClient');
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = 'spendingEntries';

const client = getCosmosClient();

module.exports = async function (context, req) {
  const container = client.database(databaseId).container(containerId);
  
  if (req.method === 'POST') {
    // Add spending entry
    const entry = req.body;
    await container.items.create(entry);
    context.res = { status: 200, body: { message: 'Spending entry added', entry } };
  } else if (req.method === 'GET') {
    const userId = req.query.userId;
    if (!userId) {
      context.res = { status: 400, body: { error: 'Missing userId' } };
      return;
    }
    // List all spending entries for user
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.date DESC',
      parameters: [{ name: '@userId', value: userId }]
    }).fetchAll();
    context.res = { status: 200, body: resources };
  } else if (req.method === 'PUT') {
    // Update spending entry
    const id = req.query.id;
    const updatedEntry = req.body;
    if (!id) {
      context.res = { status: 400, body: { error: 'Missing id' } };
      return;
    }
    try {
      await container.item(id, id).replace(updatedEntry);
      context.res = { status: 200, body: { message: 'Spending entry updated', entry: updatedEntry } };
    } catch (err) {
      context.res = { status: 404, body: { error: 'Spending entry not found', details: err.message } };
    }
  } else if (req.method === 'DELETE') {
    // Delete spending entry
    const id = req.query.id;
    if (!id) {
      context.res = { status: 400, body: { error: 'Missing id' } };
      return;
    }
    try {
      await container.item(id, id).delete();
      context.res = { status: 200, body: { message: 'Spending entry deleted', id } };
    } catch (err) {
      context.res = { status: 404, body: { error: 'Spending entry not found', details: err.message } };
    }
  } else {
    context.res = { status: 405, body: { error: 'Method not allowed' } };
  }
};
