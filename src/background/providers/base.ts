import { TranslationProvider, ProviderConfig, TranslationError } from '../../shared/types/provider';
import { ProviderMetadata, providerRegistry } from './registry';

export abstract class BaseProvider implements TranslationProvider {
  /**
   * Provider metadata
   */
  protected static metadata: ProviderMetadata;
  
  /**
   * Register the provider with the registry
   * @param metadata - Provider metadata
   * @param implementation - Provider implementation
   */
  protected static register(metadata: ProviderMetadata, implementation: TranslationProvider): void {
    this.metadata = metadata;
    providerRegistry.register(metadata, implementation);
  }
  protected systemPrompt = 
    'Du erhältst im folgenden HTML-Code einen deutschen Nachrichtenartikel. ' +
    'Bitte extrahiere den Artikeltext, übersetze ihn in deutsche Leichte Sprache gemäß DIN SPEC 33429 ' +
    'und formatiere den übersetzten Artikel in HTML. Verwende <h1> oder <h2> für Überschriften, ' +
    '<p> für Absätze und <ul>/<li> für Listen. Ignoriere Navigationsleisten, Werbung und sonstige ' +
    'nicht relevante Inhalte. Beginne den Text nicht mit dem wort "html"';

  abstract translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string>;

  protected validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error(`${config.provider} API key not found in config file or extension settings`);
    }

    if (!config.apiEndpoint) {
      throw new Error(`${config.provider} API endpoint is not configured`);
    }
  }

  protected createErrorDetails(error: any, config: ProviderConfig, text: string): TranslationError {
    return {
      message: error?.message || 'Unknown error',
      request: {
        endpoint: config.apiEndpoint,
        model: config.model,
        text: text
      },
      response: error,
      status: error?.status,
      statusText: error?.statusText
    };
  }

  protected handleApiError(error: any, config: ProviderConfig, text: string): never {
    const errorDetails = this.createErrorDetails(error, config, text);
    throw new Error(`${config.provider} API error: ${JSON.stringify(errorDetails, null, 2)}`);
  }

  protected handleSyntaxError(provider: string): never {
    throw new Error(`Invalid response from ${provider} API. Please check your API configuration.`);
  }

  protected cleanResponse(text: string): string {
    return text.replace(/(^```html|^```|```$|^html)/g, '').trim();
  }
}
