const { getCosmosClient } = require('../../shared/cosmosClient');
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = 'communityThreads';

const client = getCosmosClient();

module.exports = async function (context, req) {
  const container = client.database(databaseId).container(containerId);
  const method = req.method;

  if (method === 'POST') {
    // Create a new thread
    const thread = req.body;
    if (!thread.userId || !thread.title || !thread.body) {
      context.res = { status: 400, body: { error: 'Missing required fields' } };
      return;
    }
    if (!thread.id) {
      thread.id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    thread.createdAt = new Date().toISOString();
    thread.replies = thread.replies || [];
    await container.items.create(thread);
    context.res = { status: 200, body: { message: 'Thread created', thread } };

  } else if (method === 'GET') {
    // List all threads, include 'Created by: userId'
    const { resources } = await container.items.readAll().fetchAll();
    const threads = resources.map(t => ({
      ...t,
      createdBy: t.userId ? `Created by: ${t.userId}` : 'Created by: Unknown',
    }));
    context.res = { status: 200, body: threads };

  } else if (method === 'PUT') {
    // Edit a thread (only by creator)
    const { id, userId, title, body } = req.body;
    if (!id || !userId || !title || !body) {
      context.res = { status: 400, body: { error: 'Missing required fields' } };
      return;
    }
    try {
      const { resource: thread } = await container.item(id, id).read();
      if (!thread) {
        context.res = { status: 404, body: { error: 'Thread not found' } };
        return;
      }
      if (thread.userId !== userId) {
        context.res = { status: 403, body: { error: 'Not authorized to edit this thread' } };
        return;
      }
      thread.title = title;
      thread.body = body;
      await container.item(id, id).replace(thread);
      context.res = { status: 200, body: { message: 'Thread updated', thread } };
    } catch (err) {
      context.res = { status: 500, body: { error: 'Failed to update thread', details: err.message } };
    }

  } else if (method === 'DELETE') {
    // Delete a thread (only by creator)
    const { id, userId } = req.body;
    if (!id || !userId) {
      context.res = { status: 400, body: { error: 'Missing required fields' } };
      return;
    }
    try {
      const { resource: thread } = await container.item(id, id).read();
      if (!thread) {
        context.res = { status: 404, body: { error: 'Thread not found' } };
        return;
      }
      if (thread.userId !== userId) {
        context.res = { status: 403, body: { error: 'Not authorized to delete this thread' } };
        return;
      }
      await container.item(id, id).delete();
      context.res = { status: 200, body: { message: 'Thread deleted' } };
    } catch (err) {
      context.res = { status: 500, body: { error: 'Failed to delete thread', details: err.message } };
    }

  } else if (method === 'PATCH') {
    // Add a reply to a thread
    const { threadId, userId, body } = req.body;
    if (!threadId || !userId || !body) {
      context.res = { status: 400, body: { error: 'Missing required fields' } };
      return;
    }
    try {
      const { resource: thread } = await container.item(threadId, threadId).read();
      if (!thread) {
        context.res = { status: 404, body: { error: 'Thread not found' } };
        return;
      }
      const reply = {
        replyId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        body,
        createdAt: new Date().toISOString(),
      };
      thread.replies = thread.replies || [];
      thread.replies.push(reply);
      await container.item(threadId, threadId).replace(thread);
      context.res = { status: 200, body: { message: 'Reply added', reply } };
    } catch (err) {
      context.res = { status: 500, body: { error: 'Failed to add reply', details: err.message } };
    }

  } else if (method === 'PUT' && req.body.replyId) {
    // Edit a reply (only by creator)
    const { threadId, replyId, userId, body } = req.body;
    if (!threadId || !replyId || !userId || !body) {
      context.res = { status: 400, body: { error: 'Missing required fields' } };
      return;
    }
    try {
      const { resource: thread } = await container.item(threadId, threadId).read();
      if (!thread) {
        context.res = { status: 404, body: { error: 'Thread not found' } };
        return;
      }
      const replyIndex = (thread.replies || []).findIndex(r => r.replyId === replyId);
      if (replyIndex === -1) {
        context.res = { status: 404, body: { error: 'Reply not found' } };
        return;
      }
      if (thread.replies[replyIndex].userId !== userId) {
        context.res = { status: 403, body: { error: 'Not authorized to edit this reply' } };
        return;
      }
      thread.replies[replyIndex].body = body;
      thread.replies[replyIndex].editedAt = new Date().toISOString();
      await container.item(threadId, threadId).replace(thread);
      context.res = { status: 200, body: { message: 'Reply updated', reply: thread.replies[replyIndex] } };
    } catch (err) {
      context.res = { status: 500, body: { error: 'Failed to update reply', details: err.message } };
    }

  } else if (method === 'DELETE' && req.body.replyId) {
    // Delete a reply (only by creator)
    const { threadId, replyId, userId } = req.body;
    if (!threadId || !replyId || !userId) {
      context.res = { status: 400, body: { error: 'Missing required fields' } };
      return;
    }
    try {
      const { resource: thread } = await container.item(threadId, threadId).read();
      if (!thread) {
        context.res = { status: 404, body: { error: 'Thread not found' } };
        return;
      }
      const replyIndex = (thread.replies || []).findIndex(r => r.replyId === replyId);
      if (replyIndex === -1) {
        context.res = { status: 404, body: { error: 'Reply not found' } };
        return;
      }
      if (thread.replies[replyIndex].userId !== userId) {
        context.res = { status: 403, body: { error: 'Not authorized to delete this reply' } };
        return;
      }
      thread.replies.splice(replyIndex, 1);
      await container.item(threadId, threadId).replace(thread);
      context.res = { status: 200, body: { message: 'Reply deleted' } };
    } catch (err) {
      context.res = { status: 500, body: { error: 'Failed to delete reply', details: err.message } };
    }

  } else {
    context.res = { status: 405, body: { error: 'Method not allowed' } };
  }
}; 