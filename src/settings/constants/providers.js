/**
 * Provider configurations for different AI translation services
 */
export const PROVIDERS = {
  openAI: {
    name: 'OpenAI',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1', 'gpt-4o-mini', 'gpt-4o', 'o3-mini'],
    defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
    keyPlaceholder: 'sk-...',
    keyHint: 'OpenAI API-Schlüssel beginnt mit "sk-"'
  },
  google: {
    name: 'Google Gemini',
    models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite-preview-02-05', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'],
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
    keyPlaceholder: 'Ihr Google API-Schlüssel',
    keyHint: 'Google Cloud API-Schlüssel'
  },
  anthropic: {
    name: 'Anthropic Claude',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    defaultEndpoint: 'https://api.anthropic.com/v1/messages',
    keyPlaceholder: 'sk-...',
    keyHint: 'Anthropic API-Schlüssel beginnt mit "sk-"'
  },
  local: {
    name: 'Local Model',
    models: ['llama-2-70b', 'llama-2-13b', 'llama-2-7b'],
    defaultEndpoint: 'http://localhost:1234/completion',
    keyPlaceholder: 'Optional für lokale Installation',
    keyHint: 'API-Schlüssel optional bei lokaler Installation'
  }
};

/**
 * Get the default model for a provider
 * @param {string} provider - Provider ID
 * @returns {string} Default model for the provider
 */
export function getDefaultModel(provider) {
  const config = PROVIDERS[provider];
  return config && config.models.length > 0 ? config.models[0] : '';
}

/**
 * Get the default endpoint for a provider
 * @param {string} provider - Provider ID
 * @returns {string} Default endpoint URL
 */
export function getDefaultEndpoint(provider) {
  const config = PROVIDERS[provider];
  return config ? config.defaultEndpoint : '';
}
