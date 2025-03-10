export interface ApiConfig {
  provider: string;
  model: string;
  apiKey: string;
  apiEndpoint: string;
  translationLevel?: 'einfachere_sprache' | 'einfache_sprache' | 'leichte_sprache';
}

export interface StorageItems {
  provider?: string;
  model?: string;
  apiKey?: string;
  apiEndpoint?: string;
  translationLevel?: 'einfachere_sprache' | 'einfache_sprache' | 'leichte_sprache';
  experimentalFeatures?: {
    fullPageTranslation?: boolean;
  };
  translationCache?: {
    [key: string]: string;
  };
}

export interface TranslationMessage {
  action: 'translateText' | 'translateArticle' | 'translateSection';
  text?: string;
  html?: string;
  id?: string;
}

export interface ConfigMessage {
  action: 'updateApiConfig';
  config: Partial<ApiConfig>;
}

export interface FeedbackMessage {
  action: 'submitFeedback';
  feedback: {
    rating: number;
    comment: string;
    details: {
      originalText: string;
      translatedText: string;
      url: string;
      provider: string;
      model: string;
    };
  };
}

export interface TTSProviderMessage {
  action: 'getTTSProviders';
}

export interface GetProviderVoicesMessage {
  action: 'getProviderVoices';
  provider: string;
  apiKey?: string;
}

export interface SynthesizeSpeechMessage {
  action: 'synthesizeSpeech';
  text: string;
  settings: {
    provider: string;
    voiceURI: string;
    rate: number;
    pitch?: number;
    apiKey?: string;
  };
}

export interface PingResponse {
  status: 'ok';
}

export interface Tab extends chrome.tabs.Tab {
  id: number;
}

export interface Message {
  action: string;
  translation?: string;
  error?: string;
  id?: string;
  provider?: string;
}
