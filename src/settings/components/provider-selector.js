/**
 * Provider selector component
 */
import { PROVIDERS } from '../constants/providers.js';
import { getElement, populateSelect, addSafeEventListener } from '../utils/dom-utils.js';
import { sanitizeInput } from '../services/validation-service.js';

/**
 * Initialize provider selector component
 * @param {Object} options - Component options
 * @param {Function} options.onProviderChange - Callback when provider changes
 * @param {Object} options.apiKeys - API keys configuration
 * @returns {Object} Component interface
 */
export function initProviderSelector({ onProviderChange, apiKeys = {} }) {
  // Get DOM elements
  const providerSelect = getElement('provider-select');
  const modelSelect = getElement('model-select');
  const apiKeyInput = getElement('api-key');
  const apiEndpointInput = getElement('api-endpoint');
  const apiHint = getElement('api-hint');
  
  if (!providerSelect || !modelSelect || !apiKeyInput || !apiEndpointInput || !apiHint) {
    console.error('Provider selector: Required DOM elements not found');
    return null;
  }
  
  /**
   * Update UI based on selected provider
   * @param {string} provider - Provider ID
   * @param {string} selectedModel - Selected model
   */
  function updateProviderUI(provider, selectedModel = '') {
    const config = PROVIDERS[provider];
    if (!config) return;
    
    // Update API key field
    apiKeyInput.placeholder = config.keyPlaceholder;
    apiHint.textContent = config.keyHint;

    // Update endpoint field
    apiEndpointInput.placeholder = config.defaultEndpoint;
    
    // Set default endpoint if field is empty
    if (!apiEndpointInput.value) {
      apiEndpointInput.value = config.defaultEndpoint;
    }
    
    // Update model select options
    populateSelect(modelSelect, config.models, selectedModel);
  }
  
  /**
   * Handle provider change
   * @param {Event} event - Change event
   */
  function handleProviderChange(event) {
    const provider = event.target.value;
    const config = PROVIDERS[provider];
    
    // Use API key and endpoint from api-keys.json if available
    if (apiKeys.providers?.[provider]) {
      apiKeyInput.value = apiKeys.providers[provider].apiKey || '';
      apiEndpointInput.value = apiKeys.providers[provider].apiEndpoint || config.defaultEndpoint;
    } else {
      apiKeyInput.value = '';
      apiEndpointInput.value = config.defaultEndpoint;
    }
    
    updateProviderUI(provider);
    
    // Call external handler if provided
    if (typeof onProviderChange === 'function') {
      onProviderChange(provider);
    }
  }
  
  // Set up event listeners
  addSafeEventListener(providerSelect, 'change', handleProviderChange);
  
  // Set up input sanitization
  addSafeEventListener(apiKeyInput, 'input', (e) => {
    e.target.value = sanitizeInput(e.target.value);
  });
  
  addSafeEventListener(apiEndpointInput, 'input', (e) => {
    e.target.value = sanitizeInput(e.target.value);
  });
  
  // Public interface
  return {
    /**
     * Set provider and update UI
     * @param {string} provider - Provider ID
     * @param {string} model - Model ID
     */
    setProvider(provider, model = '') {
      if (providerSelect && PROVIDERS[provider]) {
        providerSelect.value = provider;
        
        // Set API key and endpoint from api-keys.json if available
        const config = PROVIDERS[provider];
        if (apiKeys.providers?.[provider]) {
          apiKeyInput.value = apiKeys.providers[provider].apiKey || '';
          apiEndpointInput.value = apiKeys.providers[provider].apiEndpoint || config.defaultEndpoint;
        } else {
          // Only set default endpoint if field is empty
          if (!apiEndpointInput.value) {
            apiEndpointInput.value = config.defaultEndpoint;
          }
        }
        
        updateProviderUI(provider, model);
      }
    },
    
    /**
     * Get current provider configuration
     * @returns {Object} Provider configuration
     */
    getProviderConfig() {
      return {
        provider: providerSelect.value,
        model: modelSelect.value,
        apiKey: apiKeyInput.value.trim(),
        apiEndpoint: apiEndpointInput.value.trim()
      };
    },
    
    /**
     * Update API keys configuration
     * @param {Object} newApiKeys - New API keys configuration
     */
    updateApiKeys(newApiKeys) {
      apiKeys = newApiKeys || {};
    }
  };
}
