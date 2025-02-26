import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { BaseProvider } from '../base';
import { ProviderConfig } from '../../../shared/types/provider';

// Concrete implementation for testing
class TestProvider extends BaseProvider {
  async translate(text: string, config: ProviderConfig): Promise<string> {
    this.validateConfig(config);
    
    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          text,
          model: config.model
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        this.handleApiError(data, config, text);
      }

      return this.cleanResponse(data.translation);
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.handleSyntaxError(config.provider);
      }
      throw error;
    }
  }
}

describe('BaseProvider', () => {
  let provider: TestProvider;
  let mockConfig: ProviderConfig;

  beforeEach(() => {
    provider = new TestProvider();
    mockConfig = {
      provider: 'test',
      apiKey: 'test-key',
      apiEndpoint: 'https://api.test.com',
      model: 'test-model'
    };
    globalThis.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateConfig', () => {
    test('throws error when apiKey is missing', () => {
      const config = { ...mockConfig, apiKey: '' };
      expect(() => provider['validateConfig'](config))
        .toThrow('test API key not found in config file or extension settings');
    });

    test('throws error when apiEndpoint is missing', () => {
      const config = { ...mockConfig, apiEndpoint: '' };
      expect(() => provider['validateConfig'](config))
        .toThrow('test API endpoint is not configured');
    });

    test('does not throw error for valid config', () => {
      expect(() => provider['validateConfig'](mockConfig)).not.toThrow();
    });
  });

  describe('createErrorDetails', () => {
    test('creates error details with all fields', () => {
      const error = {
        message: 'Test error',
        status: 400,
        statusText: 'Bad Request'
      };

      const details = provider['createErrorDetails'](error, mockConfig, 'test text');
      
      expect(details).toEqual({
        message: 'Test error',
        request: {
          endpoint: mockConfig.apiEndpoint,
          model: mockConfig.model,
          text: 'test text'
        },
        response: error,
        status: 400,
        statusText: 'Bad Request'
      });
    });

    test('handles missing error fields', () => {
      const details = provider['createErrorDetails'](null, mockConfig, 'test text');
      
      expect(details).toEqual({
        message: 'Unknown error',
        request: {
          endpoint: mockConfig.apiEndpoint,
          model: mockConfig.model,
          text: 'test text'
        },
        response: null,
        status: undefined,
        statusText: undefined
      });
    });
  });

  describe('handleApiError', () => {
    test('throws formatted error message', () => {
      const error = { message: 'API Error' };
      
      expect(() => provider['handleApiError'](error, mockConfig, 'test text'))
        .toThrow(/test API error:/);
    });
  });

  describe('handleSyntaxError', () => {
    test('throws formatted syntax error message', () => {
      expect(() => provider['handleSyntaxError']('TestProvider'))
        .toThrow('Invalid response from TestProvider API. Please check your API configuration.');
    });
  });

  describe('cleanResponse', () => {
    test('removes markdown code blocks', () => {
      expect(provider['cleanResponse']('```html\n<p>test</p>\n```'))
        .toBe('<p>test</p>');
    });

    test('removes html prefix', () => {
      expect(provider['cleanResponse']('html<p>test</p>'))
        .toBe('<p>test</p>');
    });

    test('trims whitespace', () => {
      expect(provider['cleanResponse']('  <p>test</p>  '))
        .toBe('<p>test</p>');
    });
  });

  describe('translate', () => {
    test('successful translation', async () => {
      const mockResponse = new Response(
        JSON.stringify({ translation: '<p>translated text</p>' }),
        { status: 200, statusText: 'OK' }
      );
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);

      const result = await provider.translate('test text', mockConfig);
      expect(result).toBe('<p>translated text</p>');
    });

    test('handles API error', async () => {
      const mockResponse = new Response(
        JSON.stringify({ error: 'API Error' }),
        { status: 400, statusText: 'Bad Request' }
      );
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);

      await expect(provider.translate('test text', mockConfig))
        .rejects
        .toThrow(/test API error:/);
    });

    test('handles network error', async () => {
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network Error'));

      await expect(provider.translate('test text', mockConfig))
        .rejects
        .toThrow('Network Error');
    });

    test('handles syntax error', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.reject(new SyntaxError('Invalid JSON'))
      };
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as unknown as Response);

      await expect(provider.translate('test text', mockConfig))
        .rejects
        .toThrow(/Invalid response from test API/);
    });
  });
});
