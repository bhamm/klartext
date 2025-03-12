export interface ErrorDetails {
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

export interface ProviderConfig {
  apiKey: string;
  apiEndpoint: string;
}

export interface ProviderKeys {
  [provider: string]: ProviderConfig;
}

export interface CannyConfig {
  apiKey: string;
  userID: string;
  boardID: string;
  categoryID: string;
}

export interface ConfigStore {
  providers: ProviderKeys;
  canny?: CannyConfig;
}

export interface FeedbackDetails {
  rating: number;
  comment: string;
  details: {
    originalText: string;
    translatedText: string;
    url: string;
    provider: string;
    model: string;
    translationLevel?: string;
  };
}

export interface MenuItemConfig {
  id: string;
  title: string;
  contexts: chrome.contextMenus.ContextType[];
  callback?: () => void;
}

export interface ExperimentalFeatures {
  fullPageTranslation?: boolean;
}
