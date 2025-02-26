/**
 * Service for validating user inputs
 */
import { PROVIDERS } from '../constants/providers';
import { ValidationResult, SettingsFormData } from '../../shared/types/settings';

/**
 * Validate API key format based on provider
 * @param apiKey - API key to validate
 * @param provider - Provider ID
 * @returns True if API key is valid
 */
export function validateApiKey(apiKey: string | undefined, provider: string): boolean {
  // Skip validation for local provider
  if (provider === 'local') {
    return true;
  }
  
  // API key is required for all other providers
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Specific format validation
  if ((provider === 'openAI' || provider === 'anthropic') && !apiKey.startsWith('sk-')) {
    return false;
  }
  
  return true;
}

/**
 * Validate API endpoint format
 * @param endpoint - API endpoint to validate
 * @returns True if endpoint is valid
 */
export function validateEndpoint(endpoint: string | undefined): boolean {
  if (!endpoint) {
    return false;
  }
  
  try {
    // Check if it's a valid URL
    new URL(endpoint);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Validate model selection
 * @param model - Selected model
 * @param provider - Provider ID
 * @returns True if model is valid for the provider
 */
export function validateModel(model: string | undefined, provider: string): boolean {
  if (!model || !provider) {
    return false;
  }
  
  const config = PROVIDERS[provider];
  if (!config) {
    return false;
  }
  
  return config.models.includes(model);
}

/**
 * Sanitize input to prevent XSS
 * @param input - Input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string | undefined): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(/[<>]/g, '');
}

/**
 * Validate all form inputs
 * @param formData - Form data to validate
 * @returns Validation result with success flag and error message
 */
export function validateForm(formData: Partial<SettingsFormData>): ValidationResult {
  const { provider, apiKey, apiEndpoint, model } = formData;
  
  // Validate provider
  if (!provider || !PROVIDERS[provider]) {
    return {
      success: false,
      error: 'Ungültiger KI-Anbieter'
    };
  }
  
  // Validate API key (except for local provider)
  if (provider !== 'local' && !validateApiKey(apiKey, provider)) {
    return {
      success: false,
      error: `Ungültiger ${PROVIDERS[provider].name} API-Schlüssel Format`
    };
  }
  
  // Validate endpoint if provided
  if (apiEndpoint && !validateEndpoint(apiEndpoint)) {
    return {
      success: false,
      error: 'Ungültiger API-Endpoint Format'
    };
  }
  
  // Validate model
  if (!model || !validateModel(model, provider)) {
    return {
      success: false,
      error: 'Ungültiges Modell für den ausgewählten Anbieter'
    };
  }
  
  return { success: true };
}
