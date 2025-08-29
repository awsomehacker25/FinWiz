import { OCR_CONFIG } from '../config/ocrConfig';
import { AI_CONFIG } from '../config/aiConfig';
import axios from 'axios';

/**
 * Service for handling bill scanning and OCR operations
 */
export class BillScanService {
  
  /**
   * Extract text from image using OCR.space API
   */
  static async extractTextFromImage(imageUri) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'bill.jpg',
      });
      formData.append('apikey', OCR_CONFIG.API_KEY);
      formData.append('language', OCR_CONFIG.LANGUAGE);
      formData.append('isOverlayRequired', OCR_CONFIG.IS_OVERLAY_REQUIRED.toString());
      formData.append('detectOrientation', OCR_CONFIG.DETECT_ORIENTATION.toString());
      formData.append('scale', OCR_CONFIG.SCALE.toString());
      formData.append('OCREngine', OCR_CONFIG.OCR_ENGINE.toString());

      const response = await fetch(OCR_CONFIG.ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();
      
      if (result.ParsedResults && result.ParsedResults.length > 0) {
        return result.ParsedResults[0].ParsedText;
      } else {
        throw new Error('No text found in image');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Extract bill data from OCR text
   */
  static extractBillData(ocrText) {
    const lines = ocrText.split('\n').filter(line => line.trim());
    let total = null;
    let merchantName = '';
    const context = [];

    // Look for total amount patterns
    const totalPatterns = [
      /total[:\s]*\$?(\d+\.\d{2})/i,
      /amount[:\s]*\$?(\d+\.\d{2})/i,
      /subtotal[:\s]*\$?(\d+\.\d{2})/i,
      /grand\s*total[:\s]*\$?(\d+\.\d{2})/i,
      /balance[:\s]*\$?(\d+\.\d{2})/i,
      /total[:\s]*\$?(\d+\.?\d*)/i,
      /amount[:\s]*\$?(\d+\.?\d*)/i,
      /subtotal[:\s]*\$?(\d+\.?\d*)/i,
      /grand\s*total[:\s]*\$?(\d+\.?\d*)/i,
      /balance[:\s]*\$?(\d+\.?\d*)/i,
      /\$(\d+\.\d{2})/g
    ];

    // Look for merchant name (usually at the top)
    if (lines.length > 0) {
      // Try to find the best merchant name from the first few lines
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i].trim();
        // Skip lines that look like addresses, phone numbers, or dates
        if (line.length > 2 && 
            !line.match(/^\d+/) && 
            !line.match(/\d{3}-\d{3}-\d{4}/) && 
            !line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) &&
            !line.toLowerCase().includes('receipt') &&
            !line.toLowerCase().includes('invoice')) {
          merchantName = line;
          break;
        }
      }
      // Clean up merchant name
      merchantName = merchantName.replace(/[^a-zA-Z0-9\s&]/g, '').trim();
    }

    // Find total amount
    for (const pattern of totalPatterns) {
      if (pattern.global) {
        // For dollar amount pattern, get the largest amount
        const matches = Array.from(ocrText.matchAll(pattern))
          .map(match => parseFloat(match[1]))
          .filter(amount => !isNaN(amount) && amount > 0)
          .sort((a, b) => b - a);
        if (matches.length > 0) {
          total = matches[0];
          break;
        }
      } else {
        const matches = ocrText.match(pattern);
        if (matches) {
          total = parseFloat(matches[1]);
          if (total && total > 0) break;
        }
      }
    }

    // Collect context for AI
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.length > 2 && 
          !cleanLine.match(/^\d+$/) && 
          !cleanLine.match(/^[\d\s\-\(\)]+$/)) { // Skip phone numbers and purely numeric lines
        context.push(cleanLine);
      }
    });

    return {
      total: total,
      merchantName: merchantName || 'Unknown Merchant',
      context: context.slice(0, 10), // Limit context to first 10 relevant lines
      rawText: ocrText
    };
  }

  /**
   * Generate title and description using the AI model's /generate-bill-entry endpoint
   */
  static async generateTitleAndDescription(billData, userId) {
    try {
      // Prepare the request payload matching the BillData model in main.py
      const requestPayload = {
        merchantName: billData.merchantName,
        total: billData.total,
        context: billData.context
      };

      console.log('Calling AI model with payload:', requestPayload);

      // Call the dedicated bill entry generation endpoint
      const response = await axios.post(
        `${AI_CONFIG.FASTAPI_ENDPOINT}/generate-bill-entry`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: AI_CONFIG.TIMEOUT,
        }
      );

      console.log('AI model response:', response.data);

      // The endpoint returns a BillEntryResponse with title, description, and category
      const aiData = response.data;
      
      return {
        title: (aiData.title || `${billData.merchantName} Purchase`).substring(0, 30),
        description: aiData.description || `Purchase from ${billData.merchantName}`,
        category: aiData.category || BillScanService.inferCategory(billData)
      };

    } catch (error) {
      console.error('AI Generation Error:', error);
      
      // Enhanced error handling
      if (error.response) {
        console.error('API Response Error:', error.response.data);
        throw new Error(error.response.data?.detail || 'Failed to generate bill entry details');
      } else if (error.request) {
        console.error('Network Error:', error.request);
        throw new Error('Unable to connect to AI service');
      } else {
        console.error('General Error:', error.message);
        throw new Error('An error occurred while processing the bill');
      }
    }
  }

  /**
   * Infer category based on merchant name and context
   */
  static inferCategory(billData) {
    const text = `${billData.merchantName} ${billData.context.join(' ')}`.toLowerCase();
    
    // Food & Dining
    if (text.match(/restaurant|food|cafe|coffee|pizza|burger|taco|sushi|deli|bakery|bar|pub|diner|bistro|grill|kitchen|eatery|mcdonald|subway|starbucks|dunkin|kfc|domino|papa|chipotle/)) {
      return 'Food';
    }
    
    // Shopping & Retail
    if (text.match(/store|shop|market|retail|mall|target|walmart|amazon|costco|clothing|clothes|fashion|electronics|best buy|home depot|lowes/)) {
      return 'Shopping';
    }
    
    // Transportation
    if (text.match(/gas|fuel|station|shell|exxon|chevron|bp|mobil|uber|lyft|taxi|parking|metro|bus|train|airline|flight/)) {
      return 'Transportation';
    }
    
    // Entertainment
    if (text.match(/movie|cinema|theater|entertainment|gaming|netflix|spotify|gym|fitness|sports|concert|show|tickets/)) {
      return 'Entertainment';
    }
    
    // Healthcare
    if (text.match(/pharmacy|hospital|clinic|doctor|medical|health|cvs|walgreens|urgent care|dental/)) {
      return 'Healthcare';
    }
    
    // Utilities & Services
    if (text.match(/utility|electric|water|gas|internet|phone|cable|insurance|bank|atm|service/)) {
      return 'Utilities';
    }
    
    // Groceries
    if (text.match(/grocery|supermarket|kroger|safeway|publix|whole foods|trader joe|aldi/)) {
      return 'Groceries';
    }
    
    return 'Other';
  }

  /**
   * Complete bill processing pipeline: OCR -> Data extraction -> AI enhancement
   */
  static async processBillImage(imageUri, userId) {
    try {
      console.log('Starting bill processing for image:', imageUri);

      // Step 1: Extract text using OCR
      const ocrText = await BillScanService.extractTextFromImage(imageUri);
      console.log('OCR extraction completed, text length:', ocrText.length);

      // Step 2: Extract structured data from OCR text
      const billData = BillScanService.extractBillData(ocrText);
      console.log('Bill data extracted:', billData);

      if (!billData.total || billData.total <= 0) {
        throw new Error('Could not find a valid total amount on this bill');
      }

      // Step 3: Generate AI-enhanced details with fallback
      let aiData;
      try {
        aiData = await BillScanService.generateTitleAndDescription(billData, userId);
        console.log('AI enhancement completed:', aiData);
      } catch (aiError) {
        console.warn('AI enhancement failed, using fallback:', aiError.message);
        // Use fallback values if AI fails
        aiData = {
          title: `${billData.merchantName} Purchase`.substring(0, 30),
          description: `Purchase at ${billData.merchantName}`,
          category: BillScanService.inferCategory(billData)
        };
      }

      // Step 4: Return processed bill entry
      return {
        success: true,
        data: {
          amount: billData.total,
          category: aiData.category,
          description: aiData.description,
          merchantName: billData.merchantName,
          rawOcrText: billData.rawText
        },
        message: `Successfully processed bill from ${billData.merchantName} for $${billData.total}`
      };

    } catch (error) {
      console.error('Bill processing failed:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

export default BillScanService;
