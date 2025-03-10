export interface ProviderConfig {
  provider: string;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  translationLevel?: 'einfachere_sprache' | 'einfache_sprache' | 'leichte_sprache';
}

export interface TranslationProvider {
  translate(text: string, config: ProviderConfig, isArticle?: boolean): Promise<string>;
}

export interface ProviderKeys {
  [provider: string]: {
    apiKey: string;
    apiEndpoint: string;
  };
}

export interface TranslationResponse {
  translation: string;
  metadata?: {
    provider: string;
    model: string;
    timestamp: string;
  };
}

export interface TranslationError {
  message: string;
  request?: {
    endpoint: string;
    model: string;
    text: string;
  };
  response?: any;
  status?: number;
  statusText?: string;
}
