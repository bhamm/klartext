/**
 * Type definitions for settings-related data structures
 */

import { ProviderConfig } from './provider';

/**
 * Speech synthesis settings
 */
export interface SpeechSettings {
  voiceURI: string;  // Identifier for the selected voice
  rate: number;      // Speech rate (0.1 to 2.0)
  pitch?: number;    // Speech pitch (0.1 to 2.0)
  ttsProvider: string; // TTS provider ID (browser, googleTTS, etc.)
  apiKey?: string;   // API key for external TTS providers
}

/**
 * Settings object structure
 */
export interface Settings {
  provider: string;
  model: string;
  apiKey: string;
  apiEndpoint: string;
  textSize: 'normal' | 'gross' | 'sehr-gross';
  experimentalFeatures: ExperimentalFeatures;
  compareView: boolean;
  excludeComments: boolean;
  speech: SpeechSettings;
}

/**
 * Experimental features configuration
 */
export interface ExperimentalFeatures {
  fullPageTranslation: boolean;
  [key: string]: boolean;
}

/**
 * Default settings
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
    ttsProvider: 'browser',
    apiKey: ''
  }
};

/**
 * Form data for settings form
 */
export interface SettingsFormData extends ProviderConfig {
  textSize: Settings['textSize'];
  experimentalFeatures: ExperimentalFeatures;
  compareView: boolean;
  excludeComments: boolean;
  speech: SpeechSettings;
}

/**
 * Validation result
 */
export interface ValidationResult {
  success: boolean;
  error?: string;
}

/**
 * Settings service response
 */
export interface SettingsResponse {
  success: boolean;
  error?: string;
}

/**
 * Provider selector component interface
 */
export interface ProviderSelectorComponent {
  setProvider: (provider: string, model?: string) => void;
  getProviderConfig: () => ProviderConfig;
  updateApiKeys: (apiKeys: ApiKeysConfig) => void;
}

/**
 * Settings panel component interface
 */
export interface SettingsPanelComponent {
  setSettings: (settings: Settings) => void;
  getSettings: () => Partial<Settings>;
}

/**
 * API keys configuration
 */
export interface ApiKeysConfig {
  canny?: {
    apiKey: string;
    boardID: string;
    categoryID: string;
    userID: string;
  };
  providers?: {
    [provider: string]: {
      apiKey: string;
      apiEndpoint: string;
    };
  };
}

/**
 * Provider model configuration
 */
export interface ProviderModelConfig {
  name: string;
  models: string[];
  defaultEndpoint: string;
  keyPlaceholder: string;
  keyHint: string;
}

/**
 * Provider models configuration
 */
export interface ProvidersConfig {
  [provider: string]: ProviderModelConfig;
}
