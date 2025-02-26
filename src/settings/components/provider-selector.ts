/**
 * Provider selector component
 */
import { PROVIDERS } from '../constants/providers';
import { getElement, populateSelect, addSafeEventListener } from '../utils/dom-utils';
import { sanitizeInput } from '../services/validation-service';
import { ApiKeysConfig, ProviderSelectorComponent } from '../../shared/types/settings';
import { ProviderConfig } from '../../shared/types/provider';

interface ProviderSelectorOptions {
  onProviderChange?: (provider: string) => void;
  apiKeys?: ApiKeysConfig;
}

/**
 * Initialize provider selector component
 * @param options - Component options
 * @param options.onProviderChange - Callback when provider changes
 * @param options.apiKeys - API keys configuration
 * @returns Component interface
 */
export function initProviderSelector({ 
  onProviderChange, 
  apiKeys = {} 
}: ProviderSelectorOptions): ProviderSelectorComponent | null {
  // Get DOM elements
  const providerSelect = getElement<HTMLSelectElement>('provider-select');
  const modelSelect = getElement<HTMLSelectElement>('model-select');
  const apiKeyInput = getElement<HTMLInputElement>('api-key');
  const apiEndpointInput = getElement<HTMLInputElement>('api-endpoint');
  const apiHint = getElement<HTMLElement>('api-hint');
  
  if (!providerSelect || !modelSelect || !apiKeyInput || !apiEndpointInput || !apiHint) {
    console.error('Provider selector: Required DOM elements not found');
    return null;
  }
  
  /**
   * Update UI based on selected provider
   * @param provider - Provider ID
   * @param selectedModel - Selected model
   */
  function updateProviderUI(provider: string, selectedModel: string = ''): void {
    const config = PROVIDERS[provider];
    if (!config) return;
    
    // Update API key field
    apiKeyInput!.placeholder = config.keyPlaceholder;
    apiHint!.textContent = config.keyHint;

    // Update endpoint field
    apiEndpointInput!.placeholder = config.defaultEndpoint;
    
    // Set default endpoint if field is empty
    if (!apiEndpointInput!.value) {
      apiEndpointInput!.value = config.defaultEndpoint;
    }
    
    // Update model select options
    populateSelect(modelSelect!, config.models, selectedModel);
  }
  
  /**
   * Handle provider change
   * @param event - Change event
   */
  function handleProviderChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const provider = target.value;
    const config = PROVIDERS[provider];
    
    // Use API key and endpoint from api-keys.json if available
    if (apiKeys.providers?.[provider]) {
      apiKeyInput!.value = apiKeys.providers[provider].apiKey || '';
      apiEndpointInput!.value = apiKeys.providers[provider].apiEndpoint || config.defaultEndpoint;
    } else {
      apiKeyInput!.value = '';
      apiEndpointInput!.value = config.defaultEndpoint;
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
    const target = e.target as HTMLInputElement;
    target.value = sanitizeInput(target.value);
  });
  
  addSafeEventListener(apiEndpointInput, 'input', (e) => {
    const target = e.target as HTMLInputElement;
    target.value = sanitizeInput(target.value);
  });
  
  // Public interface
  return {
    /**
     * Set provider and update UI
     * @param provider - Provider ID
     * @param model - Model ID
     */
    setProvider(provider: string, model: string = ''): void {
      if (providerSelect && PROVIDERS[provider]) {
        providerSelect.value = provider;
        
        // Set API key and endpoint from api-keys.json if available
        const config = PROVIDERS[provider];
        if (apiKeys.providers?.[provider]) {
          apiKeyInput!.value = apiKeys.providers[provider].apiKey || '';
          apiEndpointInput!.value = apiKeys.providers[provider].apiEndpoint || config.defaultEndpoint;
        } else {
          // Only set default endpoint if field is empty
          if (!apiEndpointInput!.value) {
            apiEndpointInput!.value = config.defaultEndpoint;
          }
        }
        
        updateProviderUI(provider, model);
      }
    },
    
    /**
     * Get current provider configuration
     * @returns Provider configuration
     */
    getProviderConfig(): ProviderConfig {
      return {
        provider: providerSelect!.value,
        model: modelSelect!.value,
        apiKey: apiKeyInput!.value.trim(),
        apiEndpoint: apiEndpointInput!.value.trim()
      };
    },
    
    /**
     * Update API keys configuration
     * @param newApiKeys - New API keys configuration
     */
    updateApiKeys(newApiKeys: ApiKeysConfig): void {
      apiKeys = newApiKeys || {};
    }
  };
}
