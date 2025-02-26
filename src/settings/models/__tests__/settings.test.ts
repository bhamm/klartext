import { DEFAULT_SETTINGS, validateSettings, mergeWithDefaults } from '../settings';
import { Settings } from '../../../shared/types/settings';

describe('Settings Model', () => {
  describe('DEFAULT_SETTINGS', () => {
    test('has correct initial values', () => {
      expect(DEFAULT_SETTINGS).toEqual({
        provider: 'openAI',
        model: '',
        apiKey: '',
        apiEndpoint: '',
        textSize: 'normal',
        experimentalFeatures: {
          fullPageTranslation: false
        },
        compareView: false,
        excludeComments: true
      });
    });
  });

  describe('validateSettings', () => {
    test('returns true for valid settings', () => {
      const settings: Settings = {
        provider: 'openAI',
        model: 'gpt-4-turbo',
        apiKey: 'test-key',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        textSize: 'normal',
        experimentalFeatures: {
          fullPageTranslation: false
        },
        compareView: false,
        excludeComments: true
      };
      expect(validateSettings(settings)).toBe(true);
    });

    test('returns false for null or undefined settings', () => {
      expect(validateSettings(null as any)).toBe(false);
      expect(validateSettings(undefined as any)).toBe(false);
    });

    test('returns false for non-object settings', () => {
      expect(validateSettings('string' as any)).toBe(false);
      expect(validateSettings(123 as any)).toBe(false);
      expect(validateSettings([] as any)).toBe(false);
    });

    test('returns false for missing required properties', () => {
      const missingProvider = { ...DEFAULT_SETTINGS };
      delete (missingProvider as any).provider;
      expect(validateSettings(missingProvider)).toBe(false);

      const missingModel = { ...DEFAULT_SETTINGS };
      delete (missingModel as any).model;
      expect(validateSettings(missingModel)).toBe(false);

      const missingTextSize = { ...DEFAULT_SETTINGS };
      delete (missingTextSize as any).textSize;
      expect(validateSettings(missingTextSize)).toBe(false);
    });

    test('returns false for invalid provider', () => {
      const settings = { 
        ...DEFAULT_SETTINGS,
        provider: ''
      };
      expect(validateSettings(settings)).toBe(false);

      const nonStringProvider = { 
        ...DEFAULT_SETTINGS,
        provider: 123 as any
      };
      expect(validateSettings(nonStringProvider)).toBe(false);
    });

    test('returns false for invalid model', () => {
      const nonStringModel = { 
        ...DEFAULT_SETTINGS,
        model: 123 as any
      };
      expect(validateSettings(nonStringModel)).toBe(false);
    });

    test('returns false for invalid textSize', () => {
      const invalidTextSize = { 
        ...DEFAULT_SETTINGS,
        textSize: 'invalid-size' as any
      };
      expect(validateSettings(invalidTextSize)).toBe(false);

      const nonStringTextSize = { 
        ...DEFAULT_SETTINGS,
        textSize: 123 as any
      };
      expect(validateSettings(nonStringTextSize)).toBe(false);
    });

    test('returns false for invalid experimentalFeatures', () => {
      const nonObjectExperimentalFeatures = { 
        ...DEFAULT_SETTINGS,
        experimentalFeatures: 'not-an-object' as any
      };
      expect(validateSettings(nonObjectExperimentalFeatures)).toBe(false);
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
        ...userSettings,
        experimentalFeatures: {
          ...DEFAULT_SETTINGS.experimentalFeatures
        }
      };
      
      expect(mergeWithDefaults(userSettings)).toEqual(expected);
    });

    test('merges experimentalFeatures correctly', () => {
      const userSettings = {
        experimentalFeatures: {
          fullPageTranslation: true,
          newFeature: true
        }
      };
      
      const expected = {
        ...DEFAULT_SETTINGS,
        experimentalFeatures: {
          ...DEFAULT_SETTINGS.experimentalFeatures,
          ...userSettings.experimentalFeatures
        }
      };
      
      const result = mergeWithDefaults(userSettings);
      expect(result.experimentalFeatures).toEqual(expected.experimentalFeatures);
    });

    test('handles empty experimentalFeatures', () => {
      const userSettings = {
        provider: 'anthropic',
        experimentalFeatures: null as any
      };
      
      const result = mergeWithDefaults(userSettings);
      expect(result.experimentalFeatures).toEqual(DEFAULT_SETTINGS.experimentalFeatures);
    });
  });
});
