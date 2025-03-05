import { ProviderConfig } from '../../shared/types/provider';
import { providerRegistry, ProviderId } from './registry';

/**
 * Get default endpoint for a provider
 * @param providerId - Provider ID
 * @returns Default endpoint URL
 */
export function getDefaultEndpoint(providerId: ProviderId): string {
  try {
    return providerRegistry.getMetadata(providerId).defaultEndpoint;
  } catch (error) {
    console.warn(`Provider ${providerId} not found, using fallback endpoint`);
    return 'https://api.openai.com/v1/chat/completions'; // Fallback
  }
}

/**
 * Get default model for a provider
 * @param providerId - Provider ID
 * @returns Default model name
 */
export function getDefaultModel(providerId: ProviderId): string {
  try {
    const models = providerRegistry.getMetadata(providerId).models;
    return models.length > 0 ? models[0] : '';
  } catch (error) {
    console.warn(`Provider ${providerId} not found, using fallback model`);
    return 'gpt-4-turbo'; // Fallback
  }
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: ProviderConfig = {
  provider: 'openAI',
  model: getDefaultModel('openAI'),
  apiKey: '',
  apiEndpoint: getDefaultEndpoint('openAI')
};

/**
 * Validate provider configuration
 * @param config - Provider configuration
 * @returns Error message or null if valid
 */
export function validateConfig(config: Partial<ProviderConfig>): string | null {
  if (!config.provider) {
    return 'Provider is required';
  }

  if (!providerRegistry.hasProvider(config.provider)) {
    return `Unsupported provider: ${config.provider}`;
  }

  if (!config.apiKey) {
    return `API key is required for ${config.provider}`;
  }

  if (!config.apiEndpoint) {
    return `API endpoint is required for ${config.provider}`;
  }

  return null;
}

/**
 * Create provider configuration
 * @param provider - Provider ID
 * @param apiKey - API key
 * @param model - Model name (optional)
 * @param apiEndpoint - API endpoint (optional)
 * @returns Provider configuration
 */
export function createConfig(
  provider: ProviderId,
  apiKey: string,
  model?: string,
  apiEndpoint?: string
): ProviderConfig {
  return {
    provider,
    apiKey,
    model: model || getDefaultModel(provider),
    apiEndpoint: apiEndpoint || getDefaultEndpoint(provider)
  };
}
