import {
  DEFAULT_CONFIG,
  validateConfig,
  createConfig,
  getDefaultEndpoint,
  getDefaultModel
} from '../config';
import { ProviderConfig } from '../../../shared/types/provider';
import { providerRegistry, ProviderId } from '../registry';

// Mock the provider registry
jest.mock('../registry', () => ({
  providerRegistry: {
    hasProvider: jest.fn(),
    getMetadata: jest.fn(),
    getProviderIds: jest.fn()
  },
  ProviderId: String
}));

describe('Provider Configuration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock behavior
    (providerRegistry.hasProvider as jest.Mock).mockImplementation((id) => 
      ['openAI', 'google', 'anthropic', 'local'].includes(id)
    );
    
    (providerRegistry.getMetadata as jest.Mock).mockImplementation((id) => {
      const endpoints = {
        openAI: 'https://api.openai.com/v1/chat/completions',
        google: 'https://generativelanguage.googleapis.com/v1/models',
        anthropic: 'https://api.anthropic.com/v1/messages',
        local: 'http://localhost:1234/v1/completions'
      };
      
      const models = {
        openAI: ['gpt-4-turbo'],
        google: ['gemini-pro'],
        anthropic: ['claude-3-opus'],
        local: ['llama-2-70b']
      };
      
      return {
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        models: models[id as keyof typeof models] || [],
        defaultEndpoint: endpoints[id as keyof typeof endpoints] || '',
        keyPlaceholder: 'API key',
        keyHint: 'API key hint'
      };
    });
    
    (providerRegistry.getProviderIds as jest.Mock).mockReturnValue(['openAI', 'google', 'anthropic', 'local']);
  });

  describe('Constants', () => {
    test('DEFAULT_CONFIG has correct initial values', () => {
      expect(DEFAULT_CONFIG).toEqual({
        provider: 'openAI',
        model: expect.any(String),
        apiKey: '',
        apiEndpoint: expect.any(String)
      });
    });
  });

  describe('getDefaultEndpoint', () => {
    test('returns correct endpoints for providers', () => {
      expect(getDefaultEndpoint('openAI')).toBe('https://api.openai.com/v1/chat/completions');
      expect(getDefaultEndpoint('google')).toBe('https://generativelanguage.googleapis.com/v1/models');
      expect(getDefaultEndpoint('anthropic')).toBe('https://api.anthropic.com/v1/messages');
      expect(getDefaultEndpoint('local')).toBe('http://localhost:1234/v1/completions');
    });
    
    test('returns fallback for unknown provider', () => {
      (providerRegistry.getMetadata as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Provider not found');
      });
      
      expect(getDefaultEndpoint('unknown')).toBe('https://api.openai.com/v1/chat/completions');
    });
  });
  
  describe('getDefaultModel', () => {
    test('returns correct models for providers', () => {
      expect(getDefaultModel('openAI')).toBe('gpt-4-turbo');
      expect(getDefaultModel('google')).toBe('gemini-pro');
      expect(getDefaultModel('anthropic')).toBe('claude-3-opus');
      expect(getDefaultModel('local')).toBe('llama-2-70b');
    });
    
    test('returns fallback for unknown provider', () => {
      (providerRegistry.getMetadata as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Provider not found');
      });
      
      expect(getDefaultModel('unknown')).toBe('gpt-4-turbo');
    });
  });

  describe('validateConfig', () => {
    test('returns null for valid config', () => {
      const config: ProviderConfig = {
        provider: 'openAI',
        apiKey: 'test-key',
        model: 'gpt-4-turbo',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions'
      };
      expect(validateConfig(config)).toBeNull();
    });

    test('returns error for missing provider', () => {
      const config: Partial<ProviderConfig> = {
        apiKey: 'test-key',
        model: 'gpt-4-turbo',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions'
      };
      expect(validateConfig(config)).toBe('Provider is required');
    });

    test('returns error for unsupported provider', () => {
      (providerRegistry.hasProvider as jest.Mock).mockReturnValueOnce(false);
      
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
        apiEndpoint: 'https://api.openai.com/v1/chat/completions'
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
        model: 'gpt-4-turbo',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions'
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
      const providers = ['openAI', 'google', 'anthropic', 'local'];
      providers.forEach(provider => {
        const config = createConfig(provider, 'test-key');
        expect(config).toEqual({
          provider,
          apiKey: 'test-key',
          model: getDefaultModel(provider),
          apiEndpoint: getDefaultEndpoint(provider)
        });
      });
    });
  });
});
