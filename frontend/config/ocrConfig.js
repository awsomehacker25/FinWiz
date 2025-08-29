// Configuration for Azure Custom Vision OCR API
import { AZURE_VISION_API_KEY} from '@env';
import { AZURE_VISION_ENDPOINT } from '@env';
import { AZURE_VISION_REGION } from '@env';
export const OCR_CONFIG = {
  // Azure Custom Vision API key - now loaded from environment variables
  API_KEY: AZURE_VISION_API_KEY || 'your_api_key_here',
  
  // Azure Custom Vision OCR endpoint - now loaded from environment variables
  ENDPOINT: AZURE_VISION_ENDPOINT || 'https://your-resource.cognitiveservices.azure.com/vision/v3.2/read/analyze',
  
  // Azure region - now loaded from environment variables
  REGION: AZURE_VISION_REGION || 'eastus',
  
  // Default OCR settings for Azure
  LANGUAGE: 'en', // Azure uses different language codes
  READ_TYPE: 'printed', // 'printed' or 'handwritten'
  
  // Image quality settings
  IMAGE_QUALITY: 0.8,
  MAX_FILE_SIZE: 4 * 1024 * 1024, // 4MB - Azure supports larger files
  
  // Polling settings for async operations
  POLLING_INTERVAL: 1000, // 1 second
  MAX_POLLING_ATTEMPTS: 30, // 30 seconds total wait time
};

// Note: The API key, endpoint, and region are now loaded from environment variables
// 1. The .env file should contain:
//    AZURE_VISION_API_KEY=your_actual_api_key
//    AZURE_VISION_ENDPOINT=your_actual_endpoint  
//    AZURE_VISION_REGION=your_azure_region
// 2. Make sure your bundler (Metro, Webpack, etc.) supports loading environment variables
// 3. For React Native, you may need to use react-native-dotenv or similar packages
