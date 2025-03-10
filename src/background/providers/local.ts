import { BaseProvider } from './base';
import { ProviderConfig } from '../../shared/types/provider';
import { ProviderMetadata } from './registry';

export class LocalProvider extends BaseProvider {
  /**
   * Provider metadata
   */
  static {
    const metadata: ProviderMetadata = {
      id: 'local',
      name: 'Local Model',
      models: ['llama-2-70b', 'llama-2-13b', 'llama-2-7b'],
      defaultEndpoint: 'http://localhost:1234/completion',
      keyPlaceholder: 'Optional für lokale Installation',
      keyHint: 'API-Schlüssel optional bei lokaler Installation'
    };
    
    this.register(metadata, new LocalProvider());
  }
  async translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string> {
    this.validateConfig(config);
    
    try {
      const prompt = `${this.getSystemPrompt(config)} Erstelle immer gültigen HTML-Code. Antworte direkt mit dem Inhalt, ohne eine Einführung. Input HTML:\n\n${text}`;

      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        },
        body: JSON.stringify({
          model: config.model,
          prompt: prompt,
          temperature: 0.1,
          max_tokens: 4000
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        this.handleApiError(data, config, text);
      }

      const translation = data.generated_text;
      return this.cleanResponse(translation);
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.handleSyntaxError(config.provider);
      }
      throw error;
    }
  }
}

export const localProvider = new LocalProvider();
