import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { GoogleTTSProvider, googleTTSProvider } from '../google';
import { TTSProviderConfig } from '../../../shared/types/tts/provider';
import { ttsProviderRegistry } from '../registry';

describe('GoogleTTSProvider', () => {
  let provider: GoogleTTSProvider;
  let mockConfig: TTSProviderConfig;

  beforeEach(() => {
    provider = new GoogleTTSProvider('googleTTS', 'Google Text-to-Speech', 'Google Cloud Text-to-Speech API');
    mockConfig = {
      provider: 'googleTTS',
      apiKey: 'test-api-key',
      apiEndpoint: 'https://texttospeech.googleapis.com/v1',
      voice: 'de-DE-Standard-A',
      rate: 1.0,
      pitch: 0.0
    };
    
    // Mock fetch
    globalThis.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    
    // Mock console methods to prevent noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Registration', () => {
    test('provider is registered with the registry', () => {
      // Check if the provider is registered with the registry
      expect(ttsProviderRegistry.hasProvider('googleTTS')).toBe(true);
      
      // Get the provider from the registry
      const registeredProvider = ttsProviderRegistry.getProvider('googleTTS');
      expect(registeredProvider).toBeDefined();
      
      // Check metadata
      const metadata = ttsProviderRegistry.getMetadata('googleTTS');
      expect(metadata).toEqual({
        id: 'googleTTS',
        name: 'Google Text-to-Speech',
        voices: [], // Will be populated dynamically
        defaultEndpoint: 'https://texttospeech.googleapis.com/v1',
        keyPlaceholder: 'Ihr Google API-Schlüssel',
        keyHint: 'Google Cloud API-Schlüssel für Text-to-Speech'
      });
    });
  });

  describe('validateConfig', () => {
    test('throws error when apiKey is missing', () => {
      const config = { ...mockConfig, apiKey: '' };
      expect(() => provider['validateConfig'](config))
        .toThrow('API key is required');
    });

    test('throws error when apiEndpoint is missing', () => {
      const config = { ...mockConfig, apiEndpoint: '' };
      expect(() => provider['validateConfig'](config))
        .toThrow('API endpoint is required');
    });

    test('throws error when provider ID is missing', () => {
      const config = { ...mockConfig, provider: '' };
      expect(() => provider['validateConfig'](config))
        .toThrow('Provider ID is required');
    });

    test('throws error when provider ID mismatches', () => {
      const config = { ...mockConfig, provider: 'wrongProvider' };
      expect(() => provider['validateConfig'](config))
        .toThrow('Provider ID mismatch: expected googleTTS, got wrongProvider');
    });

    test('does not throw error for valid config', () => {
      expect(() => provider['validateConfig'](mockConfig)).not.toThrow();
    });
  });

  describe('synthesizeSpeech', () => {
    test('successfully synthesizes speech', async () => {
      // Mock successful response
      const mockAudioContent = 'mocked-base64-audio-content';
      const mockResponse = new Response(
        JSON.stringify({ audioContent: mockAudioContent }),
        { status: 200, statusText: 'OK' }
      );
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);
      
      // Mock atob function
      const originalAtob = global.atob;
      const mockAtob = jest.fn().mockReturnValue('decoded-audio-content');
      global.atob = mockAtob as unknown as typeof global.atob;
      
      try {
        const result = await provider.synthesizeSpeech('Hello world', mockConfig);
        
        // Verify fetch was called with correct parameters
        expect(fetch).toHaveBeenCalledWith(
          `${mockConfig.apiEndpoint}/text:synthesize?key=${mockConfig.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text: 'Hello world' },
              voice: {
                languageCode: 'de-DE',
                name: 'de-DE-Standard-A'
              },
              audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 1.0
              }
            })
          }
        );
        
        // Verify atob was called with the base64 content
        expect(global.atob).toHaveBeenCalledWith(mockAudioContent);
        
        // Verify result is an ArrayBuffer
        expect(result).toBeInstanceOf(ArrayBuffer);
      } finally {
        // Restore original atob
        global.atob = originalAtob;
      }
    });

    test('handles API error', async () => {
      // Mock error response
      const mockResponse = new Response(
        JSON.stringify({ 
          error: { 
            message: 'Invalid API key', 
            status: 'INVALID_ARGUMENT' 
          } 
        }),
        { status: 400, statusText: 'Bad Request' }
      );
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);
      
      await expect(provider.synthesizeSpeech('Hello world', mockConfig))
        .rejects
        .toThrow(/googleTTS API error:/);
    });

    test('handles missing audio content', async () => {
      // Mock response with no audio content
      const mockResponse = new Response(
        JSON.stringify({}),
        { status: 200, statusText: 'OK' }
      );
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);
      
      await expect(provider.synthesizeSpeech('Hello world', mockConfig))
        .rejects
        .toThrow('No audio content returned from Google TTS API');
    });

    test('handles base64 conversion error', async () => {
      // Mock successful response
      const mockResponse = new Response(
        JSON.stringify({ audioContent: 'invalid-base64' }),
        { status: 200, statusText: 'OK' }
      );
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);
      
      // Mock atob to throw an error
      const originalAtob = global.atob;
      const mockAtob = jest.fn().mockImplementation(() => {
        throw new Error('Invalid character');
      });
      global.atob = mockAtob as unknown as typeof global.atob;
      
      try {
        await expect(provider.synthesizeSpeech('Hello world', mockConfig))
          .rejects
          .toThrow(/googleTTS API error:/);
      } finally {
        // Restore original atob
        global.atob = originalAtob;
      }
    });

    test('handles network error', async () => {
      // Mock network error
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network Error'));
      
      await expect(provider.synthesizeSpeech('Hello world', mockConfig))
        .rejects
        .toThrow(/googleTTS API error:/);
    });

    test('handles syntax error', async () => {
      // Mock invalid JSON response
      const mockResponse = {
        ok: true,
        json: () => Promise.reject(new SyntaxError('Invalid JSON'))
      };
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as unknown as Response);
      
      await expect(provider.synthesizeSpeech('Hello world', mockConfig))
        .rejects
        .toThrow(/Invalid response from googleTTS API/);
    });
  });

  describe('getAvailableVoices', () => {
    test('successfully retrieves voices', async () => {
      // Mock successful response
      const mockVoices = [
        {
          name: 'de-DE-Standard-A',
          languageCodes: ['de-DE'],
          ssmlGender: 'FEMALE'
        },
        {
          name: 'de-DE-Standard-B',
          languageCodes: ['de-DE'],
          ssmlGender: 'MALE'
        },
        {
          name: 'en-US-Standard-A',
          languageCodes: ['en-US'],
          ssmlGender: 'FEMALE'
        }
      ];
      
      const mockResponse = new Response(
        JSON.stringify({ voices: mockVoices }),
        { status: 200, statusText: 'OK' }
      );
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);
      
      const voices = await provider.getAvailableVoices(mockConfig);
      
      // Verify fetch was called with correct parameters
      expect(fetch).toHaveBeenCalledWith(
        `${mockConfig.apiEndpoint}/voices?key=${mockConfig.apiKey}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      // Verify only German voices are returned
      expect(voices).toHaveLength(2);
      expect(voices[0]).toEqual({
        id: 'de-DE-Standard-A',
        name: 'de-DE-Standard-A',
        languageCode: 'de-DE',
        gender: 'FEMALE'
      });
      expect(voices[1]).toEqual({
        id: 'de-DE-Standard-B',
        name: 'de-DE-Standard-B',
        languageCode: 'de-DE',
        gender: 'MALE'
      });
    });

    test('handles API error', async () => {
      // Mock error response
      const mockResponse = new Response(
        JSON.stringify({ 
          error: { 
            message: 'Invalid API key', 
            status: 'INVALID_ARGUMENT' 
          } 
        }),
        { status: 400, statusText: 'Bad Request' }
      );
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);
      
      const voices = await provider.getAvailableVoices(mockConfig);
      
      // Should return empty array on error
      expect(voices).toEqual([]);
    });

    test('handles network error', async () => {
      // Mock network error
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network Error'));
      
      const voices = await provider.getAvailableVoices(mockConfig);
      
      // Should return empty array on error
      expect(voices).toEqual([]);
    });
  });

  describe('Exported instance', () => {
    test('googleTTSProvider is exported correctly', () => {
      expect(googleTTSProvider).toBeInstanceOf(GoogleTTSProvider);
      expect(googleTTSProvider['id']).toBe('googleTTS');
      expect(googleTTSProvider['name']).toBe('Google Text-to-Speech');
      expect(googleTTSProvider['description']).toBe('Google Cloud Text-to-Speech API');
    });
  });
});
