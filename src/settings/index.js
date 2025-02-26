/**
 * Main entry point for the popup
 */
import { initProviderSelector } from './components/provider-selector.js';
import { initSettingsPanel } from './components/settings-panel.js';
import { loadApiKeys, loadSettings, saveAllSettings } from './services/settings-service.js';
import { validateForm } from './services/validation-service.js';
import { getElement, getElementByClass, showStatus, addSafeEventListener } from './utils/dom-utils.js';

/**
 * Initialize the settings page
 */
async function initSettings() {
  try {
    console.log('Initializing settings page...');
    
    // Load API keys and settings
    const apiKeys = await loadApiKeys();
    console.log('API keys loaded:', apiKeys);
    
    const settings = await loadSettings();
    console.log('Settings loaded:', settings);
    
    // Initialize components
    const providerSelector = initProviderSelector({ 
      apiKeys,
      onProviderChange: (provider) => {
        console.log(`Provider changed to: ${provider}`);
      }
    });
    
    const settingsPanel = initSettingsPanel();
    
    if (!providerSelector || !settingsPanel) {
      throw new Error('Failed to initialize components');
    }
    
    // Set initial values
    console.log('Setting initial values...');
    providerSelector.setProvider(settings.provider, settings.model);
    settingsPanel.setSettings(settings);
    console.log('Initial values set');
    
    // Set up save button
    const saveButton = getElementByClass('save-button');
    if (!saveButton) {
      console.error('Save button not found by class name');
      throw new Error('Save button not found');
    }
    console.log('Save button found:', saveButton);
    
    addSafeEventListener(saveButton, 'click', async () => {
      // Disable button during save
      saveButton.disabled = true;
      
      try {
        // Get values from components
        const providerConfig = providerSelector.getProviderConfig();
        const settingsValues = settingsPanel.getSettings();
        
        // Combine values
        const formData = {
          ...providerConfig,
          ...settingsValues
        };
        
        // Validate form
        const validation = validateForm(formData);
        if (!validation.success) {
          showStatus(validation.error, 'error');
          return;
        }
        
        // Save settings
        const result = await saveAllSettings(formData);
        
        if (result.success) {
          showStatus('Einstellungen gespeichert', 'success');
        } else {
          showStatus(`Fehler beim Speichern: ${result.error}`, 'error');
        }
      } finally {
        // Re-enable button
        saveButton.disabled = false;
      }
    });
    
    // Set up Enter key in inputs
    const apiKeyInput = getElement('api-key');
    const apiEndpointInput = getElement('api-endpoint');
    
    if (apiKeyInput && apiEndpointInput) {
      [apiKeyInput, apiEndpointInput].forEach(input => {
        addSafeEventListener(input, 'keypress', async (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            saveButton.click();
          }
        });
      });
    }
    
    console.log('Popup initialized successfully');
  } catch (error) {
    console.error('Error initializing popup:', error);
    showStatus(`Initialisierungsfehler: ${error.message}`, 'error');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSettings);
