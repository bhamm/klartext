/**
 * Example provider template
 * 
 * This file demonstrates how to create a new provider for the Klartext extension.
 * To add a new provider, simply create a new file in the providers directory
 * following this template, and it will be automatically registered and available
 * in the settings page.
 */
import { BaseProvider } from './base';
import { ProviderConfig } from '../../shared/types/provider';
import { ProviderMetadata } from './registry';

/**
 * Example provider implementation
 */
export class ExampleProvider extends BaseProvider {
  /**
   * Provider metadata
   * This is used to register the provider with the registry
   * and to display information in the settings page
   */
  static {
    const metadata: ProviderMetadata = {
      id: 'example',                                // Unique identifier for the provider
      name: 'Example Provider',                     // Display name in the settings
      models: ['model-1', 'model-2', 'model-3'],    // Available models
      defaultEndpoint: 'https://api.example.com/v1/completions', // Default API endpoint
      keyPlaceholder: 'Your API key here',          // Placeholder for API key input
      keyHint: 'Example API key format: ex-...'     // Hint text for API key format
    };
    
    // Register the provider with the registry
    this.register(metadata, new ExampleProvider());
  }

  /**
   * Translate text using this provider
   * @param text - Text to translate
   * @param config - Provider configuration
   * @param isArticle - Whether the text is an article
   * @returns Translated text
   */
  async translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string> {
    // Validate the configuration
    this.validateConfig(config);
    
    try {
      // Make API request to the provider
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          prompt: this.systemPrompt + '\n\n' + text,
          temperature: 0.1,
          max_tokens: 4000
        })
      });

      // Parse the response
      const data = await response.json();
      
      // Handle API errors
      if (!response.ok) {
        this.handleApiError(data, config, text);
      }

      // Extract the translation from the response
      // (This will vary depending on the provider's API response format)
      const translation = data.choices[0].text;
      
      // Clean and return the translation
      return this.cleanResponse(translation);
    } catch (error) {
      // Handle syntax errors
      if (error instanceof SyntaxError) {
        this.handleSyntaxError(config.provider);
      }
      throw error;
    }
  }
}

/**
 * To use this provider:
 * 1. Rename this file to match your provider (e.g., 'my-provider.ts')
 * 2. Rename the class to match your provider (e.g., 'MyProvider')
 * 3. Update the metadata with your provider's information
 * 4. Implement the translate method to use your provider's API
 * 5. Add your provider's API endpoint to the host_permissions in manifest.json
 * 6. Add your provider's API key to api-keys.json (optional)
 * 
 * That's it! The provider will be automatically registered and available in the settings.
 */

// Note: This line is commented out because this is just a template
// export const exampleProvider = new ExampleProvider();
