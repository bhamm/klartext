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
  excludeComments: true,
  speech: {
    voiceURI: '',  // Empty string means use default voice
    rate: 0.9,
    pitch: 1.0,
    ttsProvider: 'browser'
  }
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
  
  // Validate speech settings if present
  if (settingsObj.speech) {
    if (typeof settingsObj.speech !== 'object') {
      return false;
    }
    
    const speech = settingsObj.speech;
    
    // Validate rate (if present)
    if ('rate' in speech && (typeof speech.rate !== 'number' || speech.rate < 0.1 || speech.rate > 2.0)) {
      return false;
    }
    
    // Validate pitch (if present)
    if ('pitch' in speech && (typeof speech.pitch !== 'number' || speech.pitch < 0.1 || speech.pitch > 2.0)) {
      return false;
    }
    
    // Validate voiceURI (if present)
    if ('voiceURI' in speech && typeof speech.voiceURI !== 'string') {
      return false;
    }
    
    // Validate ttsProvider (if present)
    if ('ttsProvider' in speech && typeof speech.ttsProvider !== 'string') {
      return false;
    }
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
    },
    speech: {
      ...DEFAULT_SETTINGS.speech,
      ...(userSettings.speech || {})
    }
  };
}
