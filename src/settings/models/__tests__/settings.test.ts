import { DEFAULT_SETTINGS, validateSettings, mergeWithDefaults } from '../settings';
import { Settings } from '../../../shared/types/settings';

describe('Settings Model', () => {

  describe('validateSettings', () => {
    test('returns true for valid settings', () => {
      const settings: Settings = {
        provider: 'openAI',
        model: 'gpt-4-turbo',
        apiKey: 'test-key',
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
      expect(validateSettings(settings)).toBe(true);
    });

    test('returns false for invalid input types', () => {
      const invalidInputs = ['string', 123, [], null, undefined];
      invalidInputs.forEach(input => {
        expect(validateSettings(input as any)).toBe(false);
      });
    });

    test('returns false for missing required properties', () => {
      const requiredProps = ['provider', 'model', 'textSize'];
      requiredProps.forEach(prop => {
        const settings = { ...DEFAULT_SETTINGS };
        delete (settings as any)[prop];
        expect(validateSettings(settings)).toBe(false);
      });
    });

    test('returns false for invalid property values', () => {
      const invalidCases = [
        { provider: '' },
        { provider: 123 },
        { model: 123 },
        { textSize: 'invalid-size' },
        { textSize: 123 }
      ];
      
      invalidCases.forEach(invalidProps => {
        const settings = { ...DEFAULT_SETTINGS, ...invalidProps };
        expect(validateSettings(settings)).toBe(false);
      });
    });

  });

  describe('mergeWithDefaults', () => {
    test('returns default settings when no user settings provided', () => {
      expect(mergeWithDefaults()).toEqual(DEFAULT_SETTINGS);
    });

    test('merges user settings with defaults', () => {
      const userSettings = {
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'user-key'
      };
      
      const expected = {
        ...DEFAULT_SETTINGS,
        ...userSettings
      };
      
      expect(mergeWithDefaults(userSettings)).toEqual(expected);
    });

  });
});
