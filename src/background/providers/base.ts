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
  
  // Default system prompt as fallback
  protected systemPrompt = 
    'Du erhältst im folgenden HTML-Code einen deutschen Nachrichtenartikel. ' +
    'Bitte extrahiere den Artikeltext, übersetze ihn in deutsche Leichte Sprache gemäß DIN SPEC 33429 ' +
    'und formatiere den übersetzten Artikel in HTML. Verwende <h1> oder <h2> für Überschriften, ' +
    '<p> für Absätze und <ul>/<li> für Listen. Ignoriere Navigationsleisten, Werbung und sonstige ' +
    'nicht relevante Inhalte. Beginne den Text nicht mit dem Wort "html"';
  
  // Cached prompts
  private static prompts: Record<string, Record<string, string>> | null = null;
  private static promptsLoaded = false;
  private static promptsLoading = false;

  /**
   * Initialize and load prompts synchronously
   * This should be called early in the extension lifecycle
   */
  public static async initializePrompts(): Promise<void> {
    if (this.promptsLoaded || this.promptsLoading) {
      return;
    }

    this.promptsLoading = true;
    try {
      const promptsPath = chrome.runtime.getURL('dist/config/prompts.json');
      const response = await fetch(promptsPath);
      if (!response.ok) {
        throw new Error(`Failed to load prompts: ${response.status} ${response.statusText}`);
      }
      this.prompts = await response.json();
      this.promptsLoaded = true;
      console.log('Prompts loaded successfully');
    } catch (error) {
      console.error('Error loading prompts:', error);
      // Initialize with empty object to prevent repeated failed loading attempts
      this.prompts = {};
    } finally {
      this.promptsLoading = false;
    }
  }

  /**
   * Get the appropriate system prompt based on provider and translation level
   * @param config - Provider configuration
   * @returns System prompt
   */
  protected getSystemPrompt(config: ProviderConfig): string {
    try {
      // Ensure prompts are loaded
      if (!BaseProvider.promptsLoaded && !BaseProvider.promptsLoading) {
        // Start loading prompts if not already loading
        BaseProvider.initializePrompts().catch(error => {
          console.error('Failed to initialize prompts:', error);
        });
      }
      
      // Get provider-specific prompt for the selected level
      const level = config.translationLevel || 'leichte_sprache';
      
      if (BaseProvider.prompts && 
          BaseProvider.prompts[config.provider] && 
          BaseProvider.prompts[config.provider][level]) {
        console.log('Using provider-specific prompt for level & provider:', level, config.provider);
        return BaseProvider.prompts[config.provider][level];
      }
      
      // Fallback to default prompt
      console.log('Using default prompt for level & provider:', level, config.provider);
      return this.systemPrompt;
    } catch (error) {
      console.error('Error getting system prompt:', error);
      return this.systemPrompt;
    }
  }

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

  private static rateLimiter = {
    lastCall: 0,
    minInterval: 1000, // 1 second between calls
    maxCallsPerMinute: 60
  };

  protected async checkRateLimit() {
    const now = Date.now();
    if (now - BaseProvider.rateLimiter.lastCall < BaseProvider.rateLimiter.minInterval) {
      throw new Error('Rate limit exceeded');
    }
    BaseProvider.rateLimiter.lastCall = now;
  }
}
