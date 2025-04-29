import { 
  validateApiKey, 
  validateEndpoint, 
  validateModel, 
  sanitizeInput, 
  validateForm 
} from '../validation-service';
import { getProvidersMetadata } from '../../../background/providers/index';
import { SettingsFormData } from '../../../shared/types/settings';

// Mock the provider registry
jest.mock('../../../background/providers/index', () => ({
  getProvidersMetadata: jest.fn()
}));

describe('Validation Service', () => {
  describe('validateApiKey', () => {
    test('returns true for local provider regardless of key', () => {
      expect(validateApiKey('', 'local')).toBe(true);
      expect(validateApiKey(undefined, 'local')).toBe(true);
      expect(validateApiKey('any-key', 'local')).toBe(true);
    });

    test('returns false for empty or undefined key for non-local providers', () => {
      expect(validateApiKey('', 'openAI')).toBe(false);
      expect(validateApiKey(undefined, 'google')).toBe(false);
      expect(validateApiKey(undefined, 'anthropic')).toBe(false);
    });

    test('returns false for non-string key', () => {
      expect(validateApiKey(123 as any, 'openAI')).toBe(false);
      expect(validateApiKey({} as any, 'google')).toBe(false);
    });

    test('validates OpenAI and Anthropic keys start with sk-', () => {
      expect(validateApiKey('sk-test', 'openAI')).toBe(true);
      expect(validateApiKey('sk-test', 'anthropic')).toBe(true);
      expect(validateApiKey('test', 'openAI')).toBe(false);
      expect(validateApiKey('test', 'anthropic')).toBe(false);
    });

    test('accepts any non-empty string for Google', () => {
      expect(validateApiKey('any-key', 'google')).toBe(true);
    });
  });

  describe('validateEndpoint', () => {
    test('returns false for empty or undefined endpoint', () => {
      expect(validateEndpoint('')).toBe(false);
      expect(validateEndpoint(undefined)).toBe(false);
    });

    test('returns true for valid URL', () => {
      expect(validateEndpoint('https://api.openai.com/v1/chat/completions')).toBe(true);
      expect(validateEndpoint('http://localhost:1234/completion')).toBe(true);
    });

    test('returns false for invalid URL', () => {
      expect(validateEndpoint('not-a-url')).toBe(false);
      expect(validateEndpoint('http://')).toBe(false);
    });
  });

  describe('validateModel', () => {
    beforeEach(() => {
      // Setup mock for getProvidersMetadata
      (getProvidersMetadata as jest.Mock).mockReturnValue({
        openAI: {
          id: 'openAI',
          name: 'OpenAI',
          models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
          defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
          keyPlaceholder: 'sk-...',
          keyHint: 'OpenAI API-Schlüssel beginnt mit "sk-"'
        },
        google: {
          id: 'google',
          name: 'Google Gemini',
          models: ['gemini-pro'],
          defaultEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
          keyPlaceholder: 'Ihr Google API-Schlüssel',
          keyHint: 'Google Cloud API-Schlüssel'
        },
        anthropic: {
          id: 'anthropic',
          name: 'Anthropic Claude',
          models: ['claude-3-opus'],
          defaultEndpoint: 'https://api.anthropic.com/v1/messages',
          keyPlaceholder: 'sk-...',
          keyHint: 'Anthropic API-Schlüssel beginnt mit "sk-"'
        },
        local: {
          id: 'local',
          name: 'Local Model',
          models: ['llama-2-70b'],
          defaultEndpoint: 'http://localhost:1234/completion',
          keyPlaceholder: 'Optional für lokale Installation',
          keyHint: 'API-Schlüssel optional bei lokaler Installation'
        }
      });
    });

    test('returns false for empty or undefined model or provider', () => {
      expect(validateModel('', 'openAI')).toBe(false);
      expect(validateModel(undefined, 'openAI')).toBe(false);
      expect(validateModel('gpt-4-turbo', '')).toBe(false);
      expect(validateModel('gpt-4-turbo', undefined as any)).toBe(false);
    });

    test('returns false for unknown provider', () => {
      expect(validateModel('model', 'unknown-provider' as any)).toBe(false);
    });

    test('returns true for model in provider models list', () => {
      // For each provider, test with their first model
      const providers = getProvidersMetadata();
      Object.entries(providers).forEach(([provider, metadata]) => {
        const model = metadata.models[0];
        expect(validateModel(model, provider)).toBe(true);
      });
    });

    test('returns false for model not in provider models list', () => {
      expect(validateModel('unknown-model', 'openAI')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('returns empty string for non-string input', () => {
      expect(sanitizeInput(123 as any)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput({} as any)).toBe('');
    });

    test('removes HTML tags', () => {
      expect(sanitizeInput('text with <script>alert("xss")</script>')).toBe('text with alert("xss")');
      expect(sanitizeInput('<div>content</div>')).toBe('content');
    });

    test('preserves normal text', () => {
      expect(sanitizeInput('normal text')).toBe('normal text');
      expect(sanitizeInput('text with symbols: !@#$%^&*()')).toBe('text with symbols: !@#$%^&*()');
    });
  });

  describe('validateForm', () => {
    beforeEach(() => {
      // Setup mock for getProvidersMetadata
      (getProvidersMetadata as jest.Mock).mockReturnValue({
        openAI: {
          id: 'openAI',
          name: 'OpenAI',
          models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
          defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
          keyPlaceholder: 'sk-...',
          keyHint: 'OpenAI API-Schlüssel beginnt mit "sk-"'
        },
        google: {
          id: 'google',
          name: 'Google Gemini',
          models: ['gemini-pro'],
          defaultEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
          keyPlaceholder: 'Ihr Google API-Schlüssel',
          keyHint: 'Google Cloud API-Schlüssel'
        },
        anthropic: {
          id: 'anthropic',
          name: 'Anthropic Claude',
          models: ['claude-3-opus'],
          defaultEndpoint: 'https://api.anthropic.com/v1/messages',
          keyPlaceholder: 'sk-...',
          keyHint: 'Anthropic API-Schlüssel beginnt mit "sk-"'
        },
        local: {
          id: 'local',
          name: 'Local Model',
          models: ['llama-2-70b'],
          defaultEndpoint: 'http://localhost:1234/completion',
          keyPlaceholder: 'Optional für lokale Installation',
          keyHint: 'API-Schlüssel optional bei lokaler Installation'
        }
      });
    });

    test('returns success for valid form data', () => {
      const formData: SettingsFormData = {
        provider: 'openAI',
        model: 'gpt-4-turbo',
        apiKey: 'sk-test',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        textSize: 'normal',
        translationLevel: 'leichte_sprache',
        speech: {
          voiceURI: '',
          rate: 0.9,
          pitch: 1.0,
          ttsProvider: 'browser'
        }
      };
      
      expect(validateForm(formData)).toEqual({ success: true });
    });

    test('returns error for invalid provider', () => {
      // Mock getProvidersMetadata to return empty object for this test
      (getProvidersMetadata as jest.Mock).mockReturnValueOnce({});
      
      const formData: Partial<SettingsFormData> = {
        provider: 'invalid',
        model: 'gpt-4-turbo',
        apiKey: 'sk-test',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        translationLevel: 'leichte_sprache',
        speech: {
          voiceURI: '',
          rate: 0.9,
          ttsProvider: 'browser'
        }
      };
      
      expect(validateForm(formData)).toEqual({
        success: false,
        error: 'Ungültiger KI-Anbieter'
      });
    });

    test('returns error for invalid API key', () => {
      const formData: Partial<SettingsFormData> = {
        provider: 'openAI',
        model: 'gpt-4-turbo',
        apiKey: 'invalid-key', // Missing sk- prefix
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        translationLevel: 'leichte_sprache',
        speech: {
          voiceURI: '',
          rate: 0.9,
          ttsProvider: 'browser'
        }
      };
      
      expect(validateForm(formData)).toEqual({
        success: false,
        error: 'Ungültiger OpenAI API-Schlüssel Format'
      });
    });

    test('returns error for invalid endpoint', () => {
      const formData: Partial<SettingsFormData> = {
        provider: 'openAI',
        model: 'gpt-4-turbo',
        apiKey: 'sk-test',
        apiEndpoint: 'invalid-url',
        translationLevel: 'leichte_sprache',
        speech: {
          voiceURI: '',
          rate: 0.9,
          ttsProvider: 'browser'
        }
      };
      
      expect(validateForm(formData)).toEqual({
        success: false,
        error: 'Ungültiger API-Endpoint Format'
      });
    });

    test('returns error for invalid model', () => {
      const formData: Partial<SettingsFormData> = {
        provider: 'openAI',
        model: 'invalid-model',
        apiKey: 'sk-test',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        translationLevel: 'leichte_sprache',
        speech: {
          voiceURI: '',
          rate: 0.9,
          ttsProvider: 'browser'
        }
      };
      
      expect(validateForm(formData)).toEqual({
        success: false,
        error: 'Ungültiges Modell für den ausgewählten Anbieter'
      });
    });

    test('skips API key validation for local provider', () => {
      const formData: Partial<SettingsFormData> = {
        provider: 'local',
        model: 'llama-2-70b',
        apiKey: '', // Empty API key should be valid for local
        apiEndpoint: 'http://localhost:1234/completion',
        translationLevel: 'leichte_sprache',
        speech: {
          voiceURI: '',
          rate: 0.9,
          ttsProvider: 'browser'
        }
      };
      
      expect(validateForm(formData)).toEqual({ success: true });
    });
  });
});
