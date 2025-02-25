import { ProviderConfig } from '../../shared/types/provider';

export const PROVIDER_ENDPOINTS = {
  openAI: 'https://api.openai.com/v1/chat/completions',
  google: 'https://generativelanguage.googleapis.com/v1/models',
  anthropic: 'https://api.anthropic.com/v1/messages',
  local: 'http://localhost:1234/v1/completions'
} as const;

export type ProviderName = keyof typeof PROVIDER_ENDPOINTS;

export const DEFAULT_CONFIG: ProviderConfig = {
  provider: 'openAI',
  model: 'gpt-4-turbo',
  apiKey: '',
  apiEndpoint: PROVIDER_ENDPOINTS.openAI
};

export const DEFAULT_MODELS = {
  openAI: 'gpt-4-turbo',
  google: 'gemini-pro',
  anthropic: 'claude-3-opus',
  local: 'llama-2-70b'
} as const;

export function validateConfig(config: Partial<ProviderConfig>): string | null {
  if (!config.provider) {
    return 'Provider is required';
  }

  if (!Object.keys(PROVIDER_ENDPOINTS).includes(config.provider)) {
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

export function createConfig(
  provider: ProviderName,
  apiKey: string,
  model?: string,
  apiEndpoint?: string
): ProviderConfig {
  return {
    provider,
    apiKey,
    model: model || DEFAULT_MODELS[provider],
    apiEndpoint: apiEndpoint || PROVIDER_ENDPOINTS[provider]
  };
}
