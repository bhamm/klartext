/**
 * TTS provider registry for managing text-to-speech providers
 */
import { TTSProvider } from '../../shared/types/tts/provider';

/**
 * TTS provider metadata interface
 */
export interface TTSProviderMetadata {
  id: string;
  name: string;
  voices: string[];
  defaultEndpoint: string;
  keyPlaceholder: string;
  keyHint: string;
}

/**
 * TTS provider registration interface
 */
export interface RegisteredTTSProvider {
  metadata: TTSProviderMetadata;
  implementation: TTSProvider;
}

/**
 * TTS provider registry class
 */
class TTSProviderRegistry {
  private providers: Map<string, RegisteredTTSProvider> = new Map();

  /**
   * Register a provider
   * @param metadata - Provider metadata
   * @param implementation - Provider implementation
   */
  register(metadata: TTSProviderMetadata, implementation: TTSProvider): void {
    if (this.providers.has(metadata.id)) {
      console.warn(`TTS Provider with ID ${metadata.id} is already registered. Overwriting.`);
    }
    
    this.providers.set(metadata.id, { metadata, implementation });
    console.log(`TTS Provider ${metadata.name} (${metadata.id}) registered successfully`);
  }

  /**
   * Get a provider by ID
   * @param id - Provider ID
   * @returns Provider implementation
   */
  getProvider(id: string): TTSProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`TTS Provider with ID ${id} not found`);
    }
    return provider.implementation;
  }

  /**
   * Get all registered providers
   * @returns Map of provider IDs to registered providers
   */
  getAllProviders(): Map<string, RegisteredTTSProvider> {
    return new Map(this.providers);
  }

  /**
   * Get all provider metadata
   * @returns Object mapping provider IDs to metadata
   */
  getAllMetadata(): Record<string, TTSProviderMetadata> {
    const result: Record<string, TTSProviderMetadata> = {};
    this.providers.forEach((provider, id) => {
      result[id] = provider.metadata;
    });
    return result;
  }

  /**
   * Get provider metadata by ID
   * @param id - Provider ID
   * @returns Provider metadata
   */
  getMetadata(id: string): TTSProviderMetadata {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`TTS Provider with ID ${id} not found`);
    }
    return provider.metadata;
  }

  /**
   * Check if a provider is registered
   * @param id - Provider ID
   * @returns True if the provider is registered
   */
  hasProvider(id: string): boolean {
    return this.providers.has(id);
  }

  /**
   * Get the number of registered providers
   * @returns Number of registered providers
   */
  get size(): number {
    return this.providers.size;
  }

  /**
   * Get all provider IDs
   * @returns Array of provider IDs
   */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Create and export singleton instance
export const ttsProviderRegistry = new TTSProviderRegistry();

// Export type for provider ID
export type TTSProviderId = string;
