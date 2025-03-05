import { ProviderConfig, TranslationProvider } from '../../shared/types/provider';
import { providerRegistry, ProviderId } from './registry';

// Import all providers to ensure they register themselves
import './openai';
import './google';
import './anthropic';
import './deepseek';
import './local';


/**
 * Get a provider by ID
 * @param id - Provider ID
 * @returns Provider implementation
 */
export function getProvider(id: ProviderId): TranslationProvider {
  try {
    return providerRegistry.getProvider(id);
  } catch (error) {
    throw new Error(`Unsupported provider: ${id}`);
  }
}

/**
 * Translate text using the specified provider
 * @param text - Text to translate
 * @param config - Provider configuration
 * @param isArticle - Whether the text is an article
 * @returns Translated text
 */
export async function translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string> {
  const provider = getProvider(config.provider);
  return provider.translate(text, config, isArticle);
}

/**
 * Get all provider IDs
 * @returns Array of provider IDs
 */
export function getProviderIds(): string[] {
  return providerRegistry.getProviderIds();
}

/**
 * Get all provider metadata
 * @returns Object mapping provider IDs to metadata
 */
export function getProvidersMetadata() {
  return providerRegistry.getAllMetadata();
}

export * from './config';
export * from './registry';
