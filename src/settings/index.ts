/**
 * Main entry point for the popup
 */
import { initProviderSelector } from './components/provider-selector';
import { initSettingsPanel } from './components/settings-panel';
import { loadApiKeys, loadSettings, saveAllSettings } from './services/settings-service';
import { validateForm } from './services/validation-service';
import { getElement, getElementByClass, showStatus, addSafeEventListener } from './utils/dom-utils';
import { Settings } from '../shared/types/settings';

/**
 * Initialize the settings page
 */
async function initSettings(): Promise<void> {
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
      onProviderChange: (provider: string) => {
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
    const saveButton = getElementByClass<HTMLButtonElement>('save-button');
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
        } as Settings;
        
        // Validate form
        const validation = validateForm(formData);
        if (!validation.success) {
          showStatus(validation.error || 'Validation error', 'error');
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
    const apiKeyInput = getElement<HTMLInputElement>('api-key');
    const apiEndpointInput = getElement<HTMLInputElement>('api-endpoint');
    
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
    if (error instanceof Error) {
      showStatus(`Initialisierungsfehler: ${error.message}`, 'error');
    } else {
      showStatus('Ein unbekannter Fehler ist aufgetreten', 'error');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSettings);
