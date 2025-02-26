/**
 * Settings model for the Klartext extension
 */

/**
 * Default settings values
 * @type {Object}
 */
export const DEFAULT_SETTINGS = {
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
 * @param {Object} settings - Settings object to validate
 * @returns {boolean} True if settings are valid
 */
export function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  // Check required properties
  const requiredProps = ['provider', 'model', 'textSize'];
  for (const prop of requiredProps) {
    if (!(prop in settings)) {
      return false;
    }
  }

  // Validate provider
  if (typeof settings.provider !== 'string' || !settings.provider) {
    return false;
  }

  // Validate model
  if (typeof settings.model !== 'string') {
    return false;
  }

  // Validate textSize
  if (!['normal', 'gross', 'sehr-gross'].includes(settings.textSize)) {
    return false;
  }

  // Validate experimentalFeatures if present
  if (settings.experimentalFeatures && typeof settings.experimentalFeatures !== 'object') {
    return false;
  }

  return true;
}

/**
 * Merges default settings with user settings
 * @param {Object} userSettings - User settings to merge with defaults
 * @returns {Object} Complete settings object
 */
export function mergeWithDefaults(userSettings = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...userSettings,
    experimentalFeatures: {
      ...DEFAULT_SETTINGS.experimentalFeatures,
      ...(userSettings.experimentalFeatures || {})
    }
  };
}
