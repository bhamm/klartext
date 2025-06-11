import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { BrowserTTSProvider } from '../browser';
import { TTSProviderConfig } from '../../../shared/types/tts/provider';

describe('BrowserTTSProvider', () => {
  let provider: BrowserTTSProvider;
  let mockConfig: TTSProviderConfig;

  beforeEach(() => {
    provider = new BrowserTTSProvider('browser', 'Browser Text-to-Speech', 'Browser-based speech synthesis');
    mockConfig = {
      provider: 'browser',
      apiKey: '',
      apiEndpoint: '',
      voice: 'en-US',
      rate: 1.0,
      pitch: 1.0
    };
  });

  describe('synthesizeSpeech', () => {
    test('should reject with error message indicating content script handling', async () => {
      await expect(provider.synthesizeSpeech('Hello world', mockConfig))
        .rejects
        .toThrow('Browser TTS should be handled in content script');
    });
  });

  describe('getAvailableVoices', () => {
    test('should return empty array as placeholder', async () => {
      const voices = await provider.getAvailableVoices(mockConfig);
      expect(voices).toEqual([]);
    });
  });

  describe('provider instance', () => {
    test('should be instance of BrowserTTSProvider', () => {
      expect(provider).toBeInstanceOf(BrowserTTSProvider);
    });

    test('should be properly instantiated', () => {
      // Test that the provider is properly instantiated without accessing protected properties
      expect(provider).toBeDefined();
      expect(typeof provider.synthesizeSpeech).toBe('function');
      expect(typeof provider.getAvailableVoices).toBe('function');
    });
  });
});
