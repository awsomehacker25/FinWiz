const { CosmosClient } = require('@azure/cosmos');
const RAGService = require('../services/ragService');
const { v4: uuidv4 } = require('uuid');

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;

const client = new CosmosClient({ endpoint, key });
const ragService = new RAGService();

module.exports = async function (context, req) {
  try {
    await ragService.initialize();
    
    const container = client.database(databaseId).container('financialKnowledge');
    
    if (req.method === 'POST') {
      // Add new financial knowledge
      const { content, metadata = {}, category, priority = 'medium' } = req.body;
      
      if (!content) {
        context.res = { 
          status: 400, 
          body: { error: 'Content is required' } 
        };
        return;
      }

      const knowledgeItem = {
        id: uuidv4(),
        type: 'embedding',
        content: content,
        metadata: {
          ...metadata,
          category: category,
          priority: priority,
          createdAt: new Date().toISOString()
        }
      };

      await container.items.create(knowledgeItem);
      
      // Add to vector store
      const { Document } = require('langchain/document');
      const document = new Document({
        pageContent: content,
        metadata: knowledgeItem.metadata
      });
      
      await ragService.vectorStore.addDocuments([document]);
      
      context.res = { 
        status: 201, 
        body: { 
          message: 'Knowledge item added successfully',
          item: knowledgeItem 
        } 
      };
      
    } else if (req.method === 'GET') {
      // Get knowledge items
      const category = req.query.category;
      const priority = req.query.priority;
      
      let query = 'SELECT * FROM c WHERE c.type = "embedding"';
      const parameters = [];
      
      if (category) {
        query += ' AND c.metadata.category = @category';
        parameters.push({ name: '@category', value: category });
      }
      
      if (priority) {
        query += ' AND c.metadata.priority = @priority';
        parameters.push({ name: '@priority', value: priority });
      }
      
      query += ' ORDER BY c.metadata.createdAt DESC';
      
      const { resources } = await container.items.query({
        query: query,
        parameters: parameters
      }).fetchAll();
      
      context.res = { 
        status: 200, 
        body: resources 
      };
      
    } else if (req.method === 'PUT') {
      // Update knowledge item
      const { id, content, metadata, category, priority } = req.body;
      
      if (!id) {
        context.res = { 
          status: 400, 
          body: { error: 'ID is required' } 
        };
        return;
      }

      const { resource: existingItem } = await container.item(id, id).read();
      
      if (!existingItem) {
        context.res = { 
          status: 404, 
          body: { error: 'Knowledge item not found' } 
        };
        return;
      }

      const updatedItem = {
        ...existingItem,
        content: content || existingItem.content,
        metadata: {
          ...existingItem.metadata,
          ...metadata,
          category: category || existingItem.metadata.category,
          priority: priority || existingItem.metadata.priority,
          updatedAt: new Date().toISOString()
        }
      };

      await container.items.upsert(updatedItem);
      
      context.res = { 
        status: 200, 
        body: { 
          message: 'Knowledge item updated successfully',
          item: updatedItem 
        } 
      };
      
    } else if (req.method === 'DELETE') {
      // Delete knowledge item
      const id = req.query.id;
      
      if (!id) {
        context.res = { 
          status: 400, 
          body: { error: 'ID is required' } 
        };
        return;
      }

      await container.item(id, id).delete();
      
      context.res = { 
        status: 200, 
        body: { message: 'Knowledge item deleted successfully' } 
      };
      
    } else {
      context.res = { 
        status: 405, 
        body: { error: 'Method not allowed' } 
      };
    }
    
  } catch (error) {
    console.error('Error in knowledge management:', error);
    context.res = { 
      status: 500, 
      body: { error: 'Internal server error', details: error.message } 
    };
  }
};
