/**
 * Google TTS provider implementation
 */
import { BaseTTSProvider } from './base';
import { TTSProviderConfig, TTSVoice } from '../../shared/types/tts/provider';
import { TTSProviderMetadata } from './registry';

/**
 * Google Text-to-Speech provider
 */
export class GoogleTTSProvider extends BaseTTSProvider {
  /**
   * Provider metadata
   */
  static {
    const metadata: TTSProviderMetadata = {
      id: 'googleTTS',
      name: 'Google Text-to-Speech',
      voices: [], // Will be populated dynamically
      defaultEndpoint: 'https://texttospeech.googleapis.com/v1',
      keyPlaceholder: 'Ihr Google API-Schlüssel',
      keyHint: 'Google Cloud API-Schlüssel für Text-to-Speech'
    };
    
    this.register(metadata, new GoogleTTSProvider('googleTTS', 'Google Text-to-Speech', 'Google Cloud Text-to-Speech API'));
  }

  /**
   * Synthesize speech using Google TTS API
   * @param text - Text to synthesize
   * @param config - Provider configuration
   * @returns Promise resolving to audio content as ArrayBuffer
   */
  async synthesizeSpeech(text: string, config: TTSProviderConfig): Promise<ArrayBuffer> {
    this.validateConfig(config);
    
    try {
      const voice = config.voice || 'de-DE-Standard-A';
      const languageCode = voice.split('-').slice(0, 2).join('-');
      
      const request = {
        input: { text },
        voice: {
          languageCode,
          name: voice
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: config.rate || 1.0,
          pitch: config.pitch || 0.0
        }
      };
      
      console.log(`Google TTS request:`, {
        endpoint: `${config.apiEndpoint}/text:synthesize?key=${config.apiKey}`,
        request: JSON.stringify(request)
      });
      
      const response = await fetch(`${config.apiEndpoint}/text:synthesize?key=${config.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google TTS API error response:', errorData);
        throw {
          message: errorData.error?.message || 'Unknown error',
          status: response.status,
          statusText: response.statusText,
          response: errorData
        };
      }
      
      const data = await response.json();
      
      if (!data.audioContent) {
        console.error('Google TTS API returned no audio content:', data);
        throw new Error('No audio content returned from Google TTS API');
      }
      
      console.log('Google TTS API response received with audio content');
      
      // Convert base64 to ArrayBuffer
      try {
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        console.log(`Converted base64 to ArrayBuffer, size: ${bytes.buffer.byteLength} bytes`);
        return bytes.buffer;
      } catch (error) {
        console.error('Error converting base64 to ArrayBuffer:', error);
        throw error;
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.handleSyntaxError(config.provider);
      }
      return this.handleApiError(error, config, text);
    }
  }

  /**
   * Get available voices from Google TTS API
   * @param config - Provider configuration
   * @returns Promise resolving to array of voices
   */
  async getAvailableVoices(config: TTSProviderConfig): Promise<TTSVoice[]> {
    this.validateConfig(config);
    
    try {
      const response = await fetch(`${config.apiEndpoint}/voices?key=${config.apiKey}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw {
          message: errorData.error?.message || 'Unknown error',
          status: response.status,
          statusText: response.statusText,
          response: errorData
        };
      }
      
      const data = await response.json();
      
      // Filter for German voices
      const germanVoices = data.voices.filter(
        (voice: any) => voice.languageCodes.some((code: string) => code.startsWith('de'))
      );
      
      return germanVoices.map((voice: any) => ({
        id: voice.name,
        name: voice.name,
        languageCode: voice.languageCodes.find((code: string) => code.startsWith('de')) || 'de-DE',
        gender: voice.ssmlGender
      }));
    } catch (error) {
      console.error('Error fetching Google TTS voices:', error);
      return [];
    }
  }
}

export const googleTTSProvider = new GoogleTTSProvider('googleTTS', 'Google Text-to-Speech', 'Google Cloud Text-to-Speech API');
