# Provider Registry System

This directory contains the provider registry system for the Klartext extension. The system allows for easy addition of new translation providers without having to modify multiple files across the codebase.

## How It Works

The provider registry system consists of the following components:

1. **Registry**: A central registry that keeps track of all available providers.
2. **Base Provider**: An abstract base class that all providers extend.
3. **Provider Implementations**: Concrete implementations of the base provider.

When a provider is implemented, it registers itself with the registry, making it automatically available throughout the application.

## Adding a New Provider

To add a new provider, follow these steps:

1. Create a new file in the `providers` directory (e.g., `my-provider.ts`).
2. Implement your provider by extending the `BaseProvider` class.
3. Define the provider metadata and register it with the registry.
4. Implement the `translate` method to use your provider's API.
5. Add your provider's API endpoint to the `host_permissions` in `manifest.json`.
6. Optionally, add your provider's API key to `api-keys.json`.

See the `example-provider-template.ts` file for a complete example.

## Provider Metadata

Each provider must define metadata that describes its capabilities and UI requirements:

```typescript
const metadata: ProviderMetadata = {
  id: 'my-provider',                            // Unique identifier
  name: 'My Provider',                          // Display name in settings
  models: ['model-1', 'model-2'],               // Available models
  defaultEndpoint: 'https://api.example.com/v1', // Default API endpoint
  keyPlaceholder: 'Your API key here',          // Placeholder for API key input
  keyHint: 'API key format: xyz-...'            // Hint text for API key format
};
```

## Provider Registration

Providers register themselves with the registry using the static initializer block:

```typescript
static {
  const metadata = { /* ... */ };
  this.register(metadata, new MyProvider());
}
```

## Provider Implementation

Each provider must implement the `translate` method, which takes text and configuration and returns translated text:

```typescript
async translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string> {
  // Implementation here
}
```

## Example

Here's a simplified example of a provider implementation:

```typescript
import { BaseProvider } from './base';
import { ProviderConfig } from '../../shared/types/provider';
import { ProviderMetadata } from './registry';

export class MyProvider extends BaseProvider {
  static {
    const metadata: ProviderMetadata = {
      id: 'my-provider',
      name: 'My Provider',
      models: ['model-1', 'model-2'],
      defaultEndpoint: 'https://api.example.com/v1',
      keyPlaceholder: 'Your API key here',
      keyHint: 'API key format: xyz-...'
    };
    
    this.register(metadata, new MyProvider());
  }

  async translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string> {
    this.validateConfig(config);
    
    try {
      // Make API request
      const response = await fetch(/* ... */);
      const data = await response.json();
      
      // Extract translation
      const translation = data.result;
      
      return this.cleanResponse(translation);
    } catch (error) {
      // Handle errors
      if (error instanceof SyntaxError) {
        this.handleSyntaxError(config.provider);
      }
      throw error;
    }
  }
}
```

## Benefits

This system provides several benefits:

1. **Decoupling**: Providers are decoupled from the rest of the application.
2. **Self-contained**: Each provider contains all its own metadata and implementation.
3. **Automatic registration**: Providers register themselves with the registry.
4. **Dynamic UI**: The settings UI is generated dynamically based on available providers.
5. **Easy to add**: Adding a new provider requires minimal changes to the codebase.
