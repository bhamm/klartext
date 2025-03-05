/**
 * Service for managing extension settings
 */
import { DEFAULT_SETTINGS, mergeWithDefaults, validateSettings } from '../models/settings';
import { Settings, ApiKeysConfig, SettingsResponse } from '../../shared/types/settings';
import { ProviderConfig } from '../../shared/types/provider';
import { getDefaultEndpoint, getDefaultModel } from '../../background/providers/config';

/**
 * Load API keys from config file
 * @returns API keys configuration
 */
export async function loadApiKeys(): Promise<ApiKeysConfig> {
  try {
    console.log('Loading API keys from config file...');
    const url = chrome.runtime.getURL('dist/config/api-keys.json');
    console.log('API keys URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load API keys: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as ApiKeysConfig;
    console.log('API keys loaded successfully');
    return data;
  } catch (error) {
    console.error('Error loading API keys:', error);
    return { providers: {} };
  }
}

/**
 * Load settings from Chrome storage
 * @returns Settings object
 */
export async function loadSettings(): Promise<Settings> {
  console.log('Loading settings from Chrome storage...');
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      console.log('Raw settings from storage:', items);
      
      if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError);
      }
      
      const settings = mergeWithDefaults(items as Partial<Settings>);
      console.log('Settings after merging with defaults:', settings);
      
      // Ensure model is set if empty
      if (!settings.model) {
        settings.model = getDefaultModel(settings.provider);
        console.log(`Model was empty, set to default: ${settings.model}`);
      }
      
      // Ensure endpoint is set if empty
      if (!settings.apiEndpoint) {
        settings.apiEndpoint = getDefaultEndpoint(settings.provider);
        console.log(`API endpoint was empty, set to default: ${settings.apiEndpoint}`);
      }
      
      console.log('Final settings:', settings);
      resolve(settings);
    });
  });
}

/**
 * Save settings to Chrome storage
 * @param settings - Settings to save
 * @returns Saved settings
 */
export async function saveSettings(settings: Settings): Promise<Settings> {
  console.log('Saving settings to Chrome storage:', settings);
  
  if (!validateSettings(settings)) {
    console.error('Invalid settings format:', settings);
    throw new Error('Invalid settings format');
  }

  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.set(settings, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.error('Error saving settings:', error);
          reject(new Error(error.message));
        } else {
          console.log('Settings saved successfully');
          resolve(settings);
        }
      });
    } catch (error) {
      console.error('Unexpected error in saveSettings:', error);
      reject(error);
    }
  });
}

interface ApiConfigResponse {
  success: boolean;
  error?: string;
}

/**
 * Update API configuration in background script
 * @param config - API configuration
 * @returns Response from background script
 */
export async function updateApiConfig(config: ProviderConfig & { 
  compareView?: boolean; 
  excludeComments?: boolean;
}): Promise<ApiConfigResponse> {
  console.log('Updating API configuration in background script:', config);
  
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({
        action: 'updateApiConfig',
        config
      }, (response: ApiConfigResponse | undefined) => {
        console.log('Response from background script:', response);
        if (!response) {
          const error = 'No response from background script';
          console.warn(error);
          resolve({ success: false, error: error });
          return;
        }
        resolve(response);
      });
    } catch (error) {
      console.error('Error sending message to background script:', error);
      resolve({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}

/**
 * Update settings in content script of active tab
 * @param settings - Settings to update
 */
export async function updateContentSettings(settings: Settings): Promise<void> {
  // Get active tab
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!activeTab || !activeTab.url || !activeTab.id ||
      !(activeTab.url.startsWith('http') || activeTab.url.startsWith('file'))) {
    return;
  }
  
  try {
    // Check if content script is already loaded
    const pingResponse = await new Promise<unknown>((resolve) => {
      chrome.tabs.sendMessage(activeTab.id!, { action: 'ping' }, (response) => {
        resolve(response);
      });
    }).catch(() => null);

    // Only inject if content script is not loaded
    if (!pingResponse) {
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['src/content/content.js']
      });
      // Wait a bit for the content script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update settings in content script
    await chrome.tabs.sendMessage(activeTab.id, {
      action: 'updateSettings',
      settings: {
        textSize: settings.textSize,
        compareView: settings.compareView,
        excludeComments: settings.excludeComments
      }
    });
  } catch (err) {
    console.warn('Could not update settings in content script:', err);
  }
}

/**
 * Save all settings and update related components
 * @param settings - Settings to save
 * @returns Result object with success status
 */
export async function saveAllSettings(settings: Settings): Promise<SettingsResponse> {
  console.log('Saving all settings:', settings);
  
  try {
    // Ensure model is compatible with the selected provider
    // This is important when switching providers
    const providerMetadata = (await import('../../background/providers/index')).getProvidersMetadata();
    const metadata = providerMetadata[settings.provider];
    
    if (metadata) {
      // Check if the current model is valid for this provider
      const isModelValid = metadata.models.includes(settings.model);
      
      if (!isModelValid) {
        // Set to default model for this provider
        settings.model = metadata.models.length > 0 ? metadata.models[0] : '';
        console.log(`Model not valid for provider ${settings.provider}, set to default: ${settings.model}`);
      }
    }
    
    // Save to storage
    console.log('Step 1: Saving to Chrome storage...');
    await saveSettings(settings);
    console.log('Settings saved to Chrome storage successfully');

    // Update API configuration in background script
    console.log('Step 2: Updating API configuration in background script...');
    const apiConfig = {
      provider: settings.provider,
      model: settings.model,
      apiKey: settings.apiKey,
      apiEndpoint: settings.apiEndpoint || getDefaultEndpoint(settings.provider),
      compareView: settings.compareView,
      excludeComments: settings.excludeComments
    };
    console.log('API config to send:', apiConfig);
    
    const response = await updateApiConfig(apiConfig);
    console.log('Background script response:', response);

    if (!response.success) {
      console.error('Background script returned error:', response.error);
      throw new Error(response.error || 'Failed to update API configuration');
    }

    // Update content script settings
    console.log('Step 3: Updating content script settings...');
    await updateContentSettings(settings);
    console.log('Content script settings updated successfully');

    console.log('All settings saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Error saving all settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
