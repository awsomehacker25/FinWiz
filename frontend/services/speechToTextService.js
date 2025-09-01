import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { AZURE_SPEECH_API_KEY, AZURE_SPEECH_REGION } from '@env';

class SpeechToTextService {
  constructor() {
    this.subscriptionKey = AZURE_SPEECH_API_KEY;
    this.region = AZURE_SPEECH_REGION || 'eastus';
  }

  /**
   * Convert audio file to text using Azure Speech to Text REST API
   * @param {string} audioFilePath - Path to the audio file
   * @returns {Promise<string>} - Transcribed text
   */
  async convertAudioToText(audioFilePath) {
    try {
      console.log('Starting speech to text conversion...');
      
      if (!this.subscriptionKey) {
        throw new Error('Azure Speech API key is not configured. Please add AZURE_SPEECH_API_KEY to your .env file.');
      }

      // Validate the audio file first
      await this.validateAudioFile(audioFilePath);

      // Read the audio file as base64
      const audioData = await FileSystem.readAsStringAsync(audioFilePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Use the REST API endpoint for speech recognition
      const endpoint = `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;

      console.log('Making request to Azure Speech API...');

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('audio', {
        uri: audioFilePath,
        type: 'audio/wav',
        name: 'audio.wav'
      });

      const response = await fetch(endpoint + '?language=en-US&format=detailed', {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
          'Accept': 'application/json'
        },
        body: audioData ? this.base64ToArrayBuffer(audioData) : null
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Azure Speech API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Azure Speech API Response:', result);

      // Extract text from response
      if (result.RecognitionStatus === 'Success' && result.DisplayText) {
        return result.DisplayText;
      } else if (result.NBest && result.NBest.length > 0) {
        return result.NBest[0].Display || result.NBest[0].Lexical;
      } else {
        console.log('No speech recognized or poor audio quality');
        return 'No speech detected. Please try speaking more clearly or check your microphone.';
      }

    } catch (error) {
      console.error('Speech to text conversion error:', error);
      
      // Return user-friendly error messages
      if (error.message.includes('API key')) {
        throw new Error('Speech recognition service is not configured properly.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw new Error('Failed to convert speech to text. Please try again.');
      }
    }
  }

  /**
   * Alternative method using simpler HTTP request
   */
  async convertAudioToTextSimple(audioFilePath) {
    try {
      console.log('Using simple conversion method...');
      
      if (!this.subscriptionKey) {
        throw new Error('Azure Speech API key is not configured');
      }

      // Read audio file
      const fileInfo = await FileSystem.getInfoAsync(audioFilePath);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      // For now, return a mock response to test the UI
      // In a real implementation, you would send the audio to Azure
      return "This is a test transcription. The speech to text service is working! Please configure your Azure Speech API key to get real transcriptions.";

    } catch (error) {
      console.error('Simple conversion error:', error);
      throw error;
    }
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Validate audio file format and size
   */
  async validateAudioFile(audioFilePath) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(audioFilePath);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      // Check file size (limit to 25MB for Azure Speech Service)
      const maxSizeBytes = 25 * 1024 * 1024; // 25MB
      if (fileInfo.size > maxSizeBytes) {
        throw new Error('Audio file is too large. Maximum size is 25MB');
      }

      console.log(`Audio file validated: ${fileInfo.size} bytes`);
      return true;
    } catch (error) {
      console.error('Audio file validation error:', error);
      throw error;
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured() {
    return !!(this.subscriptionKey && this.region);
  }

  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      hasApiKey: !!this.subscriptionKey,
      region: this.region,
      isReady: this.isConfigured()
    };
  }
}

export default new SpeechToTextService();
