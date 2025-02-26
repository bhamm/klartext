/**
 * Service for managing extension settings
 */
import { DEFAULT_SETTINGS, mergeWithDefaults, validateSettings } from '../models/settings.js';
import { getDefaultModel, getDefaultEndpoint } from '../constants/providers.js';

/**
 * Load API keys from config file
 * @returns {Promise<Object>} API keys configuration
 */
export async function loadApiKeys() {
  try {
    console.log('Loading API keys from config file...');
    const url = chrome.runtime.getURL('dist/config/api-keys.json');
    console.log('API keys URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load API keys: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API keys loaded successfully');
    return data;
  } catch (error) {
    console.error('Error loading API keys:', error);
    return { providers: {} };
  }
}

/**
 * Load settings from Chrome storage
 * @returns {Promise<Object>} Settings object
 */
export async function loadSettings() {
  console.log('Loading settings from Chrome storage...');
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      console.log('Raw settings from storage:', items);
      
      if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError);
      }
      
      const settings = mergeWithDefaults(items);
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
 * @param {Object} settings - Settings to save
 * @returns {Promise<Object>} Saved settings
 */
export async function saveSettings(settings) {
  console.log('Saving settings to Chrome storage:', settings);
  
  if (!validateSettings(settings)) {
    console.error('Invalid settings format:', settings);
    throw new Error('Invalid settings format');
  }

  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving settings:', chrome.runtime.lastError);
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        console.log('Settings saved successfully');
        resolve(settings);
      }
    });
  });
}

/**
 * Update API configuration in background script
 * @param {Object} config - API configuration
 * @returns {Promise<Object>} Response from background script
 */
export async function updateApiConfig(config) {
  console.log('Updating API configuration in background script:', config);
  
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'updateApiConfig',
      config
    }, (response) => {
      console.log('Response from background script:', response);
      if (!response) {
        console.warn('No response from background script');
      }
      resolve(response || { success: false, error: 'No response from background script' });
    });
  });
}

/**
 * Update settings in content script of active tab
 * @param {Object} settings - Settings to update
 * @returns {Promise<void>}
 */
export async function updateContentSettings(settings) {
  // Get active tab
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!activeTab || !activeTab.url || 
      !(activeTab.url.startsWith('http') || activeTab.url.startsWith('file'))) {
    return;
  }
  
  try {
    // Check if content script is already loaded
    const pingResponse = await new Promise((resolve) => {
      chrome.tabs.sendMessage(activeTab.id, { action: 'ping' }, (response) => {
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
 * @param {Object} settings - Settings to save
 * @returns {Promise<Object>} Result object with success status
 */
export async function saveAllSettings(settings) {
  console.log('Saving all settings:', settings);
  
  try {
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
    return { success: false, error: error.message };
  }
}
