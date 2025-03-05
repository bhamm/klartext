/**
 * Provider registry for managing translation providers
 */
import { TranslationProvider } from '../../shared/types/provider';

/**
 * Provider metadata interface
 */
export interface ProviderMetadata {
  id: string;
  name: string;
  models: string[];
  defaultEndpoint: string;
  keyPlaceholder: string;
  keyHint: string;
}

/**
 * Provider registration interface
 */
export interface RegisteredProvider {
  metadata: ProviderMetadata;
  implementation: TranslationProvider;
}

/**
 * Provider registry class
 */
class ProviderRegistry {
  private providers: Map<string, RegisteredProvider> = new Map();

  /**
   * Register a provider
   * @param metadata - Provider metadata
   * @param implementation - Provider implementation
   */
  register(metadata: ProviderMetadata, implementation: TranslationProvider): void {
    if (this.providers.has(metadata.id)) {
      console.warn(`Provider with ID ${metadata.id} is already registered. Overwriting.`);
    }
    
    this.providers.set(metadata.id, { metadata, implementation });
    console.log(`Provider ${metadata.name} (${metadata.id}) registered successfully`);
  }

  /**
   * Get a provider by ID
   * @param id - Provider ID
   * @returns Provider implementation
   */
  getProvider(id: string): TranslationProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider with ID ${id} not found`);
    }
    return provider.implementation;
  }

  /**
   * Get all registered providers
   * @returns Map of provider IDs to registered providers
   */
  getAllProviders(): Map<string, RegisteredProvider> {
    return new Map(this.providers);
  }

  /**
   * Get all provider metadata
   * @returns Object mapping provider IDs to metadata
   */
  getAllMetadata(): Record<string, ProviderMetadata> {
    const result: Record<string, ProviderMetadata> = {};
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
  getMetadata(id: string): ProviderMetadata {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider with ID ${id} not found`);
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
export const providerRegistry = new ProviderRegistry();

// Export type for provider ID
export type ProviderId = string;
