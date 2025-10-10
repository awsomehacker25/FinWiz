const { CosmosClient } = require('@azure/cosmos');
const RAGService = require('../services/ragService');

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;

const client = new CosmosClient({ endpoint, key });
const ragService = new RAGService();

module.exports = async function (context, req) {
  try {
    // Initialize RAG service
    await ragService.initialize();
    
    const container = client.database(databaseId).container('userProfiles');
    
    if (req.method === 'POST') {
      const { userId, query, context: requestContext } = req.body;
      
      if (!userId || !query) {
        context.res = { 
          status: 400, 
          body: { error: 'Missing userId or query' } 
        };
        return;
      }

      // Get user profile for context
      let userContext = {};
      try {
        const { resource: userProfile } = await container.item(userId, userId).read();
        if (userProfile) {
          userContext = {
            visaStatus: userProfile.visaStatus,
            incomeType: userProfile.incomeType,
            region: userProfile.region,
            language: userProfile.language,
            goals: userProfile.goals || []
          };
        }
      } catch (error) {
        console.log('No user profile found, using default context');
      }

      // Merge with request context
      userContext = { ...userContext, ...requestContext };

      // Generate AI suggestions using RAG
      const suggestions = await ragService.generateFinancialAdvice(query, userContext);
      
      // Store the interaction for learning
      await storeInteraction(userId, query, suggestions);
      
      context.res = { 
        status: 200, 
        body: suggestions 
      };
      
    } else if (req.method === 'GET') {
      const userId = req.query.userId;
      const type = req.query.type || 'general';
      
      if (!userId) {
        context.res = { 
          status: 400, 
          body: { error: 'Missing userId' } 
        };
        return;
      }

      // Get user profile
      let userContext = {};
      try {
        const { resource: userProfile } = await container.item(userId, userId).read();
        if (userProfile) {
          userContext = {
            visaStatus: userProfile.visaStatus,
            incomeType: userProfile.incomeType,
            region: userProfile.region,
            language: userProfile.language,
            goals: userProfile.goals || []
          };
        }
      } catch (error) {
        console.log('No user profile found');
      }

      // Generate contextual suggestions based on type
      let suggestions;
      switch (type) {
        case 'savings':
          suggestions = await ragService.generateFinancialAdvice(
            'How can I improve my savings strategy?', 
            userContext
          );
          break;
        case 'investment':
          suggestions = await ragService.generateFinancialAdvice(
            'What are good investment options for my situation?', 
            userContext
          );
          break;
        case 'credit':
          suggestions = await ragService.generateFinancialAdvice(
            'How can I build or improve my credit score?', 
            userContext
          );
          break;
        case 'taxes':
          suggestions = await ragService.generateFinancialAdvice(
            'What should I know about taxes and tax planning?', 
            userContext
          );
          break;
        case 'goals':
          suggestions = await ragService.generateFinancialAdvice(
            'How can I achieve my financial goals more effectively?', 
            userContext
          );
          break;
        default:
          suggestions = await ragService.generateFinancialAdvice(
            'What financial advice do you have for my situation?', 
            userContext
          );
      }
      
      context.res = { 
        status: 200, 
        body: suggestions 
      };
      
    } else {
      context.res = { 
        status: 405, 
        body: { error: 'Method not allowed' } 
      };
    }
    
  } catch (error) {
    console.error('Error in AI suggestions:', error);
    context.res = { 
      status: 500, 
      body: { error: 'Internal server error', details: error.message } 
    };
  }
};

async function storeInteraction(userId, query, response) {
  try {
    const container = client.database(databaseId).container('aiInteractions');
    
    const interaction = {
      id: `${userId}_${Date.now()}`,
      userId: userId,
      query: query,
      response: response.advice,
      sources: response.sources,
      userContext: response.userContext,
      timestamp: new Date().toISOString()
    };
    
    await container.items.create(interaction);
  } catch (error) {
    console.error('Error storing interaction:', error);
  }
}
