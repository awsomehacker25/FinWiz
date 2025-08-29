// Configuration for OCR.space API
export const OCR_CONFIG = {
  // OCR.space API key - You should replace this with your own API key
  // Get a free API key at: https://ocr.space/ocrapi
  API_KEY: 'K87899142388957', // Free tier key - replace with your own for production
  
  // OCR.space API endpoint
  ENDPOINT: 'https://api.ocr.space/parse/image',
  
  // Default OCR settings
  LANGUAGE: 'eng',
  OCR_ENGINE: 2, // Engine 2 is more accurate for printed text
  DETECT_ORIENTATION: true,
  SCALE: true,
  IS_OVERLAY_REQUIRED: false,
  
  // Image quality settings
  IMAGE_QUALITY: 0.8,
  MAX_FILE_SIZE: 1024 * 1024, // 1MB
};

// Note: For production, store the API key in environment variables:
// 1. Add OCR_API_KEY=your_actual_api_key to your .env file
// 2. Import it like: import { OCR_API_KEY } from '@env';
// 3. Use OCR_API_KEY instead of the hardcoded key above
