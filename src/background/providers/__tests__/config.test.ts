import {
  PROVIDER_ENDPOINTS,
  DEFAULT_CONFIG,
  DEFAULT_MODELS,
  validateConfig,
  createConfig,
  ProviderName
} from '../config';
import { ProviderConfig } from '../../../shared/types/provider';

describe('Provider Configuration', () => {
  describe('Constants', () => {
    test('PROVIDER_ENDPOINTS contains all required endpoints', () => {
      expect(PROVIDER_ENDPOINTS).toHaveProperty('openAI');
      expect(PROVIDER_ENDPOINTS).toHaveProperty('google');
      expect(PROVIDER_ENDPOINTS).toHaveProperty('anthropic');
      expect(PROVIDER_ENDPOINTS).toHaveProperty('local');
    });

    test('DEFAULT_CONFIG has correct initial values', () => {
      expect(DEFAULT_CONFIG).toEqual({
        provider: 'openAI',
        model: 'gpt-4-turbo',
        apiKey: '',
        apiEndpoint: PROVIDER_ENDPOINTS.openAI
      });
    });

    test('DEFAULT_MODELS contains models for all providers', () => {
      expect(DEFAULT_MODELS).toHaveProperty('openAI', 'gpt-4-turbo');
      expect(DEFAULT_MODELS).toHaveProperty('google', 'gemini-pro');
      expect(DEFAULT_MODELS).toHaveProperty('anthropic', 'claude-3-opus');
      expect(DEFAULT_MODELS).toHaveProperty('local', 'llama-2-70b');
    });
  });

  describe('validateConfig', () => {
    test('returns null for valid config', () => {
      const config: ProviderConfig = {
        provider: 'openAI',
        apiKey: 'test-key',
        model: 'gpt-4-turbo',
        apiEndpoint: PROVIDER_ENDPOINTS.openAI
      };
      expect(validateConfig(config)).toBeNull();
    });

    test('returns error for missing provider', () => {
      const config: Partial<ProviderConfig> = {
        apiKey: 'test-key',
        model: 'gpt-4-turbo',
        apiEndpoint: PROVIDER_ENDPOINTS.openAI
      };
      expect(validateConfig(config)).toBe('Provider is required');
    });

    test('returns error for unsupported provider', () => {
      const config: Partial<ProviderConfig> = {
        provider: 'unsupported',
        apiKey: 'test-key',
        model: 'test-model',
        apiEndpoint: 'https://test.com'
      };
      expect(validateConfig(config)).toBe('Unsupported provider: unsupported');
    });

    test('returns error for missing API key', () => {
      const config: Partial<ProviderConfig> = {
        provider: 'openAI',
        model: 'gpt-4-turbo',
        apiEndpoint: PROVIDER_ENDPOINTS.openAI
      };
      expect(validateConfig(config)).toBe('API key is required for openAI');
    });

    test('returns error for missing API endpoint', () => {
      const config: Partial<ProviderConfig> = {
        provider: 'openAI',
        apiKey: 'test-key',
        model: 'gpt-4-turbo'
      };
      expect(validateConfig(config)).toBe('API endpoint is required for openAI');
    });
  });

  describe('createConfig', () => {
    test('creates config with default values', () => {
      const config = createConfig('openAI', 'test-key');
      expect(config).toEqual({
        provider: 'openAI',
        apiKey: 'test-key',
        model: DEFAULT_MODELS.openAI,
        apiEndpoint: PROVIDER_ENDPOINTS.openAI
      });
    });

    test('creates config with custom values', () => {
      const config = createConfig(
        'google',
        'test-key',
        'custom-model',
        'https://custom-endpoint.com'
      );
      expect(config).toEqual({
        provider: 'google',
        apiKey: 'test-key',
        model: 'custom-model',
        apiEndpoint: 'https://custom-endpoint.com'
      });
    });

    test('creates config for each provider type', () => {
      const providers: ProviderName[] = ['openAI', 'google', 'anthropic', 'local'];
      providers.forEach(provider => {
        const config = createConfig(provider, 'test-key');
        expect(config).toEqual({
          provider,
          apiKey: 'test-key',
          model: DEFAULT_MODELS[provider],
          apiEndpoint: PROVIDER_ENDPOINTS[provider]
        });
      });
    });
  });
});
