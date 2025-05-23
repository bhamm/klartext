import { BaseProvider } from './base';
import { ProviderConfig } from '../../shared/types/provider';
import { ProviderMetadata } from './registry';

export class AnthropicProvider extends BaseProvider {
  /**
   * Provider metadata
   */
  static {
    const metadata: ProviderMetadata = {
      id: 'anthropic',
      name: 'Anthropic Claude',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      defaultEndpoint: 'https://api.anthropic.com/v1/messages',
      keyPlaceholder: 'sk-...',
      keyHint: 'Anthropic API-Schlüssel beginnt mit "sk-"'
    };
    
    this.register(metadata, new AnthropicProvider());
  }
  async translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string> {
    this.validateConfig(config);
    
    try {
      const prompt = `${this.getSystemPrompt(config)} Erstelle immer gültigen HTML-Code. Antworte direkt mit dem Inhalt, ohne eine Einführung. Input HTML:\n\n${text}`;

      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
          temperature: 0.1
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        this.handleApiError(data, config, text);
      }

      const translation = data.content[0].text;
      return this.cleanResponse(translation);
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.handleSyntaxError(config.provider);
      }
      throw error;
    }
  }
}

export const anthropicProvider = new AnthropicProvider();
