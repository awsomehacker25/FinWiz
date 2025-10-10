const { OpenAI } = require('openai');
const { FaissStore } = require('@langchain/community/vectorstores/faiss');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { Document } = require('langchain/document');
const { CosmosClient } = require('@azure/cosmos');
const { v4: uuidv4 } = require('uuid');
const financialKnowledgeBase = require('../data/financialKnowledgeBase');

class RAGService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    this.cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_DB_URI,
      key: process.env.COSMOS_DB_KEY,
    });
    
    this.database = this.cosmosClient.database(process.env.COSMOS_DB_DATABASE);
    this.vectorStore = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Initialize vector store with financial knowledge base
      await this.loadFinancialKnowledgeBase();
      this.isInitialized = true;
      console.log('RAG Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAG Service:', error);
      throw error;
    }
  }

  async loadFinancialKnowledgeBase() {
    const container = this.database.container('financialKnowledge');
    
    try {
      // Check if we have existing embeddings
      const { resources: existingDocs } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.type = "embedding"',
      }).fetchAll();

      if (existingDocs.length > 0) {
        // Load existing embeddings
        const documents = existingDocs.map(doc => 
          new Document({
            pageContent: doc.content,
            metadata: doc.metadata
          })
        );
        
        this.vectorStore = await FaissStore.fromDocuments(
          documents,
          this.embeddings
        );
      } else {
        // Create initial knowledge base
        await this.createInitialKnowledgeBase();
      }
    } catch (error) {
      console.error('Error loading financial knowledge base:', error);
      // Create initial knowledge base as fallback
      await this.createInitialKnowledgeBase();
    }
  }

  async createInitialKnowledgeBase() {
    const documents = financialKnowledgeBase.map(knowledge => 
      new Document({
        pageContent: knowledge.content,
        metadata: knowledge.metadata
      })
    );

    // Create vector store
    this.vectorStore = await FaissStore.fromDocuments(
      documents,
      this.embeddings
    );

    // Store in Cosmos DB for persistence
    const container = this.database.container('financialKnowledge');
    for (const doc of documents) {
      await container.items.create({
        id: uuidv4(),
        type: 'embedding',
        content: doc.pageContent,
        metadata: doc.metadata,
        createdAt: new Date().toISOString()
      });
    }
  }

  async getRelevantContext(query, userContext = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Enhance query with user context
      const enhancedQuery = this.enhanceQueryWithContext(query, userContext);
      
      // Retrieve relevant documents
      const relevantDocs = await this.vectorStore.similaritySearch(
        enhancedQuery,
        5 // Top 5 most relevant documents
      );

      // Filter and rank based on user context
      const filteredDocs = this.filterByUserContext(relevantDocs, userContext);
      
      return filteredDocs.map(doc => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        relevanceScore: this.calculateRelevanceScore(doc, userContext)
      }));
    } catch (error) {
      console.error('Error retrieving relevant context:', error);
      return [];
    }
  }

  enhanceQueryWithContext(query, userContext) {
    let enhancedQuery = query;
    
    if (userContext.visaStatus) {
      enhancedQuery += ` for ${userContext.visaStatus} visa holders`;
    }
    
    if (userContext.incomeType === 'gig') {
      enhancedQuery += ' for gig workers and freelancers';
    }
    
    if (userContext.region) {
      enhancedQuery += ` in ${userContext.region}`;
    }
    
    return enhancedQuery;
  }

  filterByUserContext(documents, userContext) {
    return documents.filter(doc => {
      const metadata = doc.metadata;
      
      // Filter by visa type if specified
      if (userContext.visaStatus && metadata.visa_type) {
        return metadata.visa_type === userContext.visaStatus;
      }
      
      // Filter by worker type if specified
      if (userContext.incomeType === 'gig' && metadata.worker_type) {
        return metadata.worker_type === 'gig';
      }
      
      // Always include high priority items
      if (metadata.priority === 'high') {
        return true;
      }
      
      // Include items targeted at immigrants if user is immigrant
      if (metadata.target_audience === 'immigrants') {
        return true;
      }
      
      return true; // Include all other documents
    });
  }

  calculateRelevanceScore(doc, userContext) {
    let score = 0.5; // Base score
    
    const metadata = doc.metadata;
    
    // Boost score for high priority items
    if (metadata.priority === 'high') score += 0.3;
    if (metadata.priority === 'medium') score += 0.1;
    
    // Boost score for matching visa type
    if (userContext.visaStatus && metadata.visa_type === userContext.visaStatus) {
      score += 0.2;
    }
    
    // Boost score for matching worker type
    if (userContext.incomeType === 'gig' && metadata.worker_type === 'gig') {
      score += 0.2;
    }
    
    // Boost score for immigrant-specific content
    if (metadata.target_audience === 'immigrants') {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  async generateFinancialAdvice(query, userContext = {}) {
    try {
      // Get relevant context
      const relevantContext = await this.getRelevantContext(query, userContext);
      
      // Prepare context for the AI
      const contextText = relevantContext
        .map(ctx => `- ${ctx.content}`)
        .join('\n');
      
      // Create user profile context
      const userProfileText = this.createUserProfileContext(userContext);
      
      // Generate advice using OpenAI
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a financial advisor specializing in helping immigrants and gig workers. Use the provided context to give personalized, actionable financial advice. Always consider the user's specific situation and provide practical steps they can take.

Context about financial best practices:
${contextText}

User Profile:
${userProfileText}

Guidelines:
1. Be specific and actionable
2. Consider the user's visa status and work situation
3. Provide step-by-step recommendations
4. Mention any relevant deadlines or timeframes
5. Include potential risks or considerations
6. Keep advice practical and achievable`
          },
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return {
        advice: completion.choices[0].message.content,
        sources: relevantContext.map(ctx => ({
          content: ctx.content,
          category: ctx.metadata.category,
          relevanceScore: ctx.relevanceScore
        })),
        userContext: userContext
      };
    } catch (error) {
      console.error('Error generating financial advice:', error);
      throw new Error('Failed to generate financial advice');
    }
  }

  createUserProfileContext(userContext) {
    const profile = [];
    
    if (userContext.visaStatus) {
      profile.push(`Visa Status: ${userContext.visaStatus}`);
    }
    
    if (userContext.incomeType) {
      profile.push(`Income Type: ${userContext.incomeType}`);
    }
    
    if (userContext.region) {
      profile.push(`Region: ${userContext.region}`);
    }
    
    if (userContext.language) {
      profile.push(`Preferred Language: ${userContext.language}`);
    }
    
    if (userContext.goals && userContext.goals.length > 0) {
      profile.push(`Financial Goals: ${userContext.goals.join(', ')}`);
    }
    
    return profile.length > 0 ? profile.join('\n') : 'No specific user context provided';
  }

  async addUserSpecificKnowledge(userId, content, metadata = {}) {
    try {
      const container = this.database.container('userKnowledge');
      
      const userKnowledge = {
        id: uuidv4(),
        userId: userId,
        content: content,
        metadata: {
          ...metadata,
          type: 'user_specific',
          createdAt: new Date().toISOString()
        }
      };
      
      await container.items.create(userKnowledge);
      
      // Add to vector store for future retrieval
      const document = new Document({
        pageContent: content,
        metadata: { ...metadata, userId: userId, type: 'user_specific' }
      });
      
      if (this.vectorStore) {
        await this.vectorStore.addDocuments([document]);
      }
      
      return userKnowledge;
    } catch (error) {
      console.error('Error adding user-specific knowledge:', error);
      throw error;
    }
  }

  async updateUserContext(userId, userContext) {
    try {
      const container = this.database.container('userProfiles');
      
      const userProfile = {
        id: userId,
        ...userContext,
        updatedAt: new Date().toISOString()
      };
      
      await container.items.upsert(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error updating user context:', error);
      throw error;
    }
  }
}

module.exports = RAGService;
