const { getCosmosClient } = require('../../shared/cosmosClient');
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = 'savingsGoals';

const client = getCosmosClient();

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
  } else if (req.method === 'PUT') {
    // Update savings goal
    const id = req.query.id;
    const updatedGoal = req.body;
    if (!id) {
      context.res = { status: 400, body: { error: 'Missing id' } };
      return;
    }
    try {
      await container.item(id, id).replace(updatedGoal);
      context.res = { status: 200, body: { message: 'Goal updated', goal: updatedGoal } };
    } catch (err) {
      context.res = { status: 404, body: { error: 'Goal not found', details: err.message } };
    }
  } else if (req.method === 'DELETE') {
    // Delete savings goal
    const id = req.query.id;
    if (!id) {
      context.res = { status: 400, body: { error: 'Missing id' } };
      return;
    }
    try {
      await container.item(id, id).delete();
      context.res = { status: 200, body: { message: 'Goal deleted', id } };
    } catch (err) {
      context.res = { status: 404, body: { error: 'Goal not found', details: err.message } };
    }
  } else {
    context.res = { status: 405, body: { error: 'Method not allowed' } };
  }
}; 