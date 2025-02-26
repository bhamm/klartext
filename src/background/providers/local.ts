import { BaseProvider } from './base';
import { ProviderConfig } from '../../shared/types/provider';

export class LocalProvider extends BaseProvider {
  async translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string> {
    this.validateConfig(config);
    
    try {
      const prompt = 
        `Du erhältst im folgenden HTML-Code einen deutschen Nachrichtenartikel. ` +
        `Bitte extrahiere den Artikeltext, übersetze ihn in deutsche Leichte Sprache gemäß DIN SPEC 33429 ` +
        `und formatiere den übersetzten Artikel in HTML. Verwende <h1> oder <h2> für Überschriften, ` +
        `<p> für Absätze und <ul>/<li> für Listen. Ignoriere Navigationsleisten, Werbung und sonstige ` +
        `nicht relevante Inhalte. Erstelle immer gültigen HTML-Code. Antworte direkt mit dem Inhalt, ` +
        `ohne eine Einführung. Input HTML:\n\n${text}`;

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
