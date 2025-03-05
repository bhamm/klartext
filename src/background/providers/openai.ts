import { BaseProvider } from './base';
import { ProviderConfig } from '../../shared/types/provider';
import { ProviderMetadata } from './registry';

export class OpenAIProvider extends BaseProvider {
  /**
   * Provider metadata
   */
  static {
    const metadata: ProviderMetadata = {
      id: 'openAI',
      name: 'OpenAI',
      models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1', 'gpt-4o-mini', 'gpt-4o', 'o3-mini'],
      defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
      keyPlaceholder: 'sk-...',
      keyHint: 'OpenAI API-Schlüssel beginnt mit "sk-"'
    };
    
    this.register(metadata, new OpenAIProvider());
  }
  async translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string> {
    this.validateConfig(config);
    
    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.1
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        this.handleApiError(data, config, text);
      }

      const translation = data.choices[0].message.content;
      return this.cleanResponse(translation);
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.handleSyntaxError(config.provider);
      }
      throw error;
    }
  }
}

export const openAIProvider = new OpenAIProvider();
