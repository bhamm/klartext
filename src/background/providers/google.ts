import { BaseProvider } from './base';
import { ProviderConfig } from '../../shared/types/provider';
import { ProviderMetadata } from './registry';

export class GoogleProvider extends BaseProvider {
  /**
   * Provider metadata
   */
  static {
    const metadata: ProviderMetadata = {
      id: 'google',
      name: 'Google Gemini',
      models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite-preview-02-05', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'],
      defaultEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
      keyPlaceholder: 'Ihr Google API-Schlüssel',
      keyHint: 'Google Cloud API-Schlüssel'
    };
    
    this.register(metadata, new GoogleProvider());
  }
  async translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string> {
    this.validateConfig(config);
    
    try {
      const prompt = `${this.getSystemPrompt(config)} Input HTML:\n\n${text}`;

      const response = await fetch(`${config.apiEndpoint}/${config.model}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        this.handleApiError(data, config, text);
      }

      const translation = data.candidates[0].content.parts[0].text;
      return this.cleanResponse(translation);
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.handleSyntaxError(config.provider);
      }
      throw error;
    }
  }
}

export const googleProvider = new GoogleProvider();
