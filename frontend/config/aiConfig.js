// Configuration for the AI Financial Coach
import {FASTAPI_ENDPOINT} from '@env';
export const AI_CONFIG = {
  // Replace this with your actual FastAPI endpoint URL
  // Example: 'https://your-fastapi-app.azurewebsites.net'
  // or for local development: 'http://localhost:8000'
  FASTAPI_ENDPOINT: FASTAPI_ENDPOINT,
  
  // Timeout for API calls (in milliseconds)
  TIMEOUT: 30000,
  
  // Maximum message length
  MAX_MESSAGE_LENGTH: 500,
};

// You can also use environment variables by adding this to your .env file:
// FASTAPI_ENDPOINT=your_fastapi_endpoint_here
// Then import it like: import { FASTAPI_ENDPOINT } from '@env';
