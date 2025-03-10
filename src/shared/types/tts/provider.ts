/**
 * TTS provider interfaces
 */

/**
 * TTS provider configuration
 */
export interface TTSProviderConfig {
  provider: string;
  apiKey: string;
  apiEndpoint: string;
  voice?: string;
  rate?: number;
  pitch?: number;
}

/**
 * TTS voice
 */
export interface TTSVoice {
  id: string;
  name: string;
  languageCode: string;
  gender?: string;
}

/**
 * TTS error
 */
export interface TTSError {
  message: string;
  request?: {
    endpoint?: string;
    provider?: string;
    text?: string;
  };
  response?: any;
}

/**
 * TTS provider interface
 */
export interface TTSProvider {
  /**
   * Synthesize speech from text
   * @param text - Text to synthesize
   * @param config - Provider configuration
   * @returns Promise resolving to audio content as ArrayBuffer
   */
  synthesizeSpeech(text: string, config: TTSProviderConfig): Promise<ArrayBuffer>;

  /**
   * Get available voices
   * @param config - Provider configuration
   * @returns Promise resolving to array of voices
   */
  getAvailableVoices(config: TTSProviderConfig): Promise<TTSVoice[]>;
}
