/**
 * Settings model for the Klartext extension
 */
import { Settings, ExperimentalFeatures } from '../../shared/types/settings';

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: Settings = {
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
};

/**
 * Validates settings object structure
 * @param settings - Settings object to validate
 * @returns True if settings are valid
 */
export function validateSettings(settings: unknown): settings is Settings {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  const settingsObj = settings as Partial<Settings>;

  // Check required properties
  const requiredProps: Array<keyof Settings> = ['provider', 'model', 'textSize'];
  for (const prop of requiredProps) {
    if (!(prop in settingsObj)) {
      return false;
    }
  }

  // Validate provider
  if (typeof settingsObj.provider !== 'string' || !settingsObj.provider) {
    return false;
  }

  // Validate model
  if (typeof settingsObj.model !== 'string') {
    return false;
  }

  // Validate textSize
  if (settingsObj.textSize !== 'normal' && 
      settingsObj.textSize !== 'gross' && 
      settingsObj.textSize !== 'sehr-gross') {
    return false;
  }

  // Validate experimentalFeatures if present
  if (settingsObj.experimentalFeatures && 
      typeof settingsObj.experimentalFeatures !== 'object') {
    return false;
  }

  return true;
}

/**
 * Merges default settings with user settings
 * @param userSettings - User settings to merge with defaults
 * @returns Complete settings object
 */
export function mergeWithDefaults(userSettings: Partial<Settings> = {}): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...userSettings,
    experimentalFeatures: {
      ...DEFAULT_SETTINGS.experimentalFeatures,
      ...(userSettings.experimentalFeatures || {})
    }
  };
}
