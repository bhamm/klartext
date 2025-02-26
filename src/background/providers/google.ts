import { BaseProvider } from './base';
import { ProviderConfig } from '../../shared/types/provider';

export class GoogleProvider extends BaseProvider {
  async translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string> {
    this.validateConfig(config);
    
    try {
      const prompt = 
        `Du erhältst im folgenden HTML-Code einen deutschen Nachrichtenartikel. ` +
        `Bitte extrahiere den Artikeltext, übersetze ihn in deutsche Leichte Sprache gemäß DIN SPEC 33429 ` +
        `und formatiere den übersetzten Artikel in HTML. Verwende <h1> oder <h2> für Überschriften, ` +
        `<p> für Absätze und <ul>/<li> für Listen. Ignoriere Navigationsleisten, Werbung und sonstige ` +
        `nicht relevante Inhalte. Beginne den Text nicht mit dem wort "html". Input HTML:\n\n${text}`;

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
