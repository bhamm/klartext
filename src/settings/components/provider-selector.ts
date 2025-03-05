/**
 * Provider selector component
 */
import { getElement, populateSelect, addSafeEventListener } from '../utils/dom-utils';
import { sanitizeInput } from '../services/validation-service';
import { ApiKeysConfig, ProviderSelectorComponent } from '../../shared/types/settings';
import { ProviderConfig } from '../../shared/types/provider';
import { getProvidersMetadata, ProviderId } from '../../background/providers/index';

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
  
  // Get all provider metadata
  const providers = getProvidersMetadata();
  
  // Populate provider select
  const providerOptions: Record<string, string> = {};
  Object.entries(providers).forEach(([id, metadata]) => {
    providerOptions[id] = metadata.name;
  });
  populateSelect(providerSelect, Object.keys(providerOptions), '', providerOptions);
  
  // Populate endpoint hints
  const endpointHint = getElement<HTMLElement>('endpoint-hint');
  if (endpointHint) {
    let hintText = 'Standart-Endpunkte:<br>';
    Object.entries(providers).forEach(([id, metadata]) => {
      hintText += `• ${metadata.name}: ${metadata.defaultEndpoint}<br>`;
    });
    endpointHint.innerHTML = hintText;
  }
  
  /**
   * Update UI based on selected provider
   * @param providerId - Provider ID
   * @param selectedModel - Selected model
   */
  function updateProviderUI(providerId: ProviderId, selectedModel: string = ''): void {
    const metadata = providers[providerId];
    if (!metadata) return;
    
    // Update API key field
    apiKeyInput!.placeholder = metadata.keyPlaceholder;
    apiHint!.textContent = metadata.keyHint;

    // Update endpoint field
    apiEndpointInput!.placeholder = metadata.defaultEndpoint;
    
    // Set default endpoint if field is empty
    if (!apiEndpointInput!.value) {
      apiEndpointInput!.value = metadata.defaultEndpoint;
    }
    
    // Update model select options
    populateSelect(modelSelect!, metadata.models, selectedModel);
  }
  
  /**
   * Handle provider change
   * @param event - Change event
   */
  function handleProviderChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const providerId = target.value;
    const metadata = providers[providerId];
    
    if (!metadata) return;
    
    // Use API key and endpoint from api-keys.json if available
    if (apiKeys.providers?.[providerId]) {
      apiKeyInput!.value = apiKeys.providers[providerId].apiKey || '';
      apiEndpointInput!.value = apiKeys.providers[providerId].apiEndpoint || metadata.defaultEndpoint;
    } else {
      apiKeyInput!.value = '';
      apiEndpointInput!.value = metadata.defaultEndpoint;
    }
    
    updateProviderUI(providerId);
    
    // Call external handler if provided
    if (typeof onProviderChange === 'function') {
      onProviderChange(providerId);
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
     * @param providerId - Provider ID
     * @param model - Model ID
     */
    setProvider(providerId: ProviderId, model: string = ''): void {
      if (providerSelect && providers[providerId]) {
        providerSelect.value = providerId;
        
        // Set API key and endpoint from api-keys.json if available
        const metadata = providers[providerId];
        if (apiKeys.providers?.[providerId]) {
          apiKeyInput!.value = apiKeys.providers[providerId].apiKey || '';
          apiEndpointInput!.value = apiKeys.providers[providerId].apiEndpoint || metadata.defaultEndpoint;
        } else {
          // Only set default endpoint if field is empty
          if (!apiEndpointInput!.value) {
            apiEndpointInput!.value = metadata.defaultEndpoint;
          }
        }
        
        updateProviderUI(providerId, model);
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
