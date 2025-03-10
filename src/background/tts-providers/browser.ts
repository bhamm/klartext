/**
 * Browser TTS provider implementation
 */
import { BaseTTSProvider } from './base';
import { TTSProviderConfig, TTSVoice } from '../../shared/types/tts/provider';
import { TTSProviderMetadata } from './registry';

/**
 * Browser Text-to-Speech provider
 * This provider is a placeholder since browser TTS is handled directly in the content script
 */
export class BrowserTTSProvider extends BaseTTSProvider {
  /**
   * Provider metadata
   */
  static {
    const metadata: TTSProviderMetadata = {
      id: 'browser',
      name: 'Browser Text-to-Speech',
      voices: [], // Will be populated dynamically in the content script
      defaultEndpoint: '',
      keyPlaceholder: '',
      keyHint: 'Verwendet die im Browser eingebaute Sprachsynthese'
    };
    
    this.register(metadata, new BrowserTTSProvider('browser', 'Browser Text-to-Speech', 'Browser-based speech synthesis'));
  }

  /**
   * Synthesize speech using browser's SpeechSynthesis API
   * This is a placeholder - browser TTS is handled directly in the content script
   * @param text - Text to synthesize
   * @param config - Provider configuration
   * @returns Promise resolving to audio content as ArrayBuffer
   */
  async synthesizeSpeech(text: string, config: TTSProviderConfig): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      // This is a placeholder - browser TTS will be handled directly in the content script
      // since SpeechSynthesis API is not available in background scripts
      reject(new Error('Browser TTS should be handled in content script'));
    });
  }

  /**
   * Get available voices from browser's SpeechSynthesis API
   * This is a placeholder - browser voices are handled directly in the content script
   * @param config - Provider configuration
   * @returns Promise resolving to array of voices
   */
  async getAvailableVoices(config: TTSProviderConfig): Promise<TTSVoice[]> {
    return new Promise((resolve) => {
      // This is a placeholder - browser voices will be handled directly in the content script
      resolve([]);
    });
  }
}

export const browserTTSProvider = new BrowserTTSProvider('browser', 'Browser Text-to-Speech', 'Browser-based speech synthesis');
