const { CosmosClient } = require('@azure/cosmos');
const RAGService = require('../services/ragService');

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = 'savingsGoals';

const client = new CosmosClient({ endpoint, key });
const ragService = new RAGService();

module.exports = async function (context, req) {
  try {
    await ragService.initialize();
    
    const container = client.database(databaseId).container(containerId);
    const userContainer = client.database(databaseId).container('userProfiles');
    
    if (req.method === 'POST') {
      // Create or update savings goal
      const goal = req.body;
      await container.items.upsert(goal);
      
      // Generate AI suggestions for the goal
      let suggestions = null;
      try {
        const { resource: userProfile } = await userContainer.item(goal.userId, goal.userId).read();
        const userContext = userProfile ? {
          visaStatus: userProfile.visaStatus,
          incomeType: userProfile.incomeType,
          region: userProfile.region,
          goals: [goal.goalName]
        } : {};
        
        const query = `I have a savings goal: ${goal.goalName} with target amount $${goal.target}. I've saved $${goal.saved} so far. What advice do you have to help me achieve this goal?`;
        const aiResponse = await ragService.generateFinancialAdvice(query, userContext);
        suggestions = aiResponse.advice;
      } catch (error) {
        console.error('Error generating goal suggestions:', error);
      }
      
      context.res = { 
        status: 200, 
        body: { 
          message: 'Goal saved', 
          goal,
          aiSuggestions: suggestions
        } 
      };
      
    } else if (req.method === 'GET') {
      const userId = req.query.userId;
      const includeSuggestions = req.query.includeSuggestions === 'true';
      
      if (!userId) {
        context.res = { status: 400, body: { error: 'Missing userId' } };
        return;
      }
      
      // List all goals for user
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }]
      }).fetchAll();
      
      let goalsWithSuggestions = resources;
      
      // Add AI suggestions if requested
      if (includeSuggestions && resources.length > 0) {
        try {
          const { resource: userProfile } = await userContainer.item(userId, userId).read();
          const userContext = userProfile ? {
            visaStatus: userProfile.visaStatus,
            incomeType: userProfile.incomeType,
            region: userProfile.region,
            goals: resources.map(goal => goal.goalName)
          } : {};
          
          const query = `I have multiple savings goals. What general advice do you have for achieving my financial goals more effectively?`;
          const aiResponse = await ragService.generateFinancialAdvice(query, userContext);
          
          goalsWithSuggestions = resources.map(goal => ({
            ...goal,
            aiSuggestions: aiResponse.advice
          }));
        } catch (error) {
          console.error('Error generating suggestions:', error);
        }
      }
      
      context.res = { status: 200, body: goalsWithSuggestions };
      
    } else {
      context.res = { status: 405, body: { error: 'Method not allowed' } };
    }
  } catch (error) {
    console.error('Error in goals API:', error);
    context.res = { 
      status: 500, 
      body: { error: 'Internal server error', details: error.message } 
    };
  }
}; 