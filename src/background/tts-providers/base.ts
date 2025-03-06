/**
 * Base TTS provider implementation
 */
import { TTSProvider, TTSProviderConfig, TTSVoice, TTSError } from '../../shared/types/tts/provider';
import { TTSProviderMetadata, ttsProviderRegistry } from './registry';

/**
 * Base class for TTS providers
 */
export abstract class BaseTTSProvider implements TTSProvider {
  /**
   * Register a provider with the registry
   * @param metadata - Provider metadata
   * @param implementation - Provider implementation
   */
  static register(metadata: TTSProviderMetadata, implementation: TTSProvider): void {
    ttsProviderRegistry.register(metadata, implementation);
  }
  /**
   * Provider ID
   */
  protected id: string;

  /**
   * Provider name
   */
  protected name: string;

  /**
   * Provider description
   */
  protected description: string;

  /**
   * Create a new TTS provider
   * @param id - Provider ID
   * @param name - Provider name
   * @param description - Provider description
   */
  constructor(id: string = '', name: string = '', description: string = '') {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  /**
   * Get provider metadata
   * @returns Provider metadata
   */
  getMetadata(): { id: string; name: string; description: string } {
    return {
      id: this.id,
      name: this.name,
      description: this.description
    };
  }

  /**
   * Synthesize speech from text
   * @param text - Text to synthesize
   * @param config - Provider configuration
   * @returns Promise resolving to audio content as ArrayBuffer
   */
  abstract synthesizeSpeech(text: string, config: TTSProviderConfig): Promise<ArrayBuffer>;

  /**
   * Get available voices
   * @param config - Provider configuration
   * @returns Promise resolving to array of voices
   */
  abstract getAvailableVoices(config: TTSProviderConfig): Promise<TTSVoice[]>;

  /**
   * Create error object
   * @param message - Error message
   * @param config - Provider configuration
   * @param text - Text that was being synthesized
   * @param response - Error response
   * @returns TTS error object
   */
  protected createError(
    message: string,
    config: TTSProviderConfig,
    text?: string,
    response?: any
  ): TTSError {
    return {
      message,
      request: {
        endpoint: config.apiEndpoint,
        provider: config.provider,
        text
      },
      response
    };
  }

  /**
   * Validate provider configuration
   * @param config - Provider configuration
   * @throws Error if configuration is invalid
   */
  protected validateConfig(config: TTSProviderConfig): void {
    if (!config) {
      throw new Error('Provider configuration is required');
    }

    if (!config.provider) {
      throw new Error('Provider ID is required');
    }

    if (config.provider !== this.id && this.id) {
      throw new Error(`Provider ID mismatch: expected ${this.id}, got ${config.provider}`);
    }

    if (!config.apiKey && this.id !== 'browser') {
      throw new Error('API key is required');
    }

    if (!config.apiEndpoint && this.id !== 'browser') {
      throw new Error('API endpoint is required');
    }
  }

  /**
   * Handle syntax error
   * @param provider - Provider ID
   * @throws Error with formatted message
   */
  protected handleSyntaxError(provider: string): never {
    throw new Error(`Invalid response from ${provider} API. Please check your API configuration.`);
  }

  /**
   * Handle API error
   * @param error - Error object
   * @param config - Provider configuration
   * @param text - Text that was being synthesized
   * @throws Error with formatted message
   */
  protected handleApiError(error: unknown, config: TTSProviderConfig, text?: string): never {
    const errorDetails = this.createError(
      error instanceof Error ? error.message : 'Unknown error',
      config,
      text,
      error
    );
    throw new Error(`${config.provider} API error: ${JSON.stringify(errorDetails, null, 2)}`);
  }
}
