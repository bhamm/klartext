import { translate } from './providers';
import { 
  ErrorDetails, 
  ProviderConfig, 
  ConfigStore, 
  FeedbackDetails, 
  MenuItemConfig,
  ExperimentalFeatures 
} from '../shared/types/error';
import {
  ApiConfig,
  StorageItems,
  TranslationMessage,
  ConfigMessage,
  FeedbackMessage,
  PingResponse,
  Tab,
  Message
} from '../shared/types/api';

// Constants
const MENU_ITEMS: { [key: string]: string } = {
  SELECTION: 'translate-selection-to-leichte-sprache',
  ARTICLE: 'translate-article-to-leichte-sprache',
  FULLPAGE: 'translate-fullpage-to-leichte-sprache'
};
const REPO_URL = 'https://github.com/bhamm/klartext';

// Load provider API keys from config file
let CONFIG_STORE: ConfigStore = { providers: {} };
fetch(chrome.runtime.getURL('dist/config/api-keys.json'))
  .then(response => response.json())
  .then((data: ConfigStore) => {
    CONFIG_STORE = data;
    // Store default provider and model in chrome.storage
    chrome.storage.sync.set({
      provider: API_CONFIG.provider,
      model: API_CONFIG.model
    }, () => {
      console.log('Provider API keys and defaults loaded');
    });
  })
  .catch((error: Error) => {
    console.error('Error loading provider API keys:', error);
  });

// Utility class for API error handling
class ApiErrorHandler {
  static createErrorDetails(error: unknown, config: ApiConfig, text: string, provider: string): ErrorDetails {
    const err = error as { message?: string; status?: number; statusText?: string };
    return {
      message: err?.message || 'Unknown error',
      request: {
        endpoint: config.apiEndpoint,
        model: config.model,
        text: text
      },
      response: error,
      status: err?.status,
      statusText: err?.statusText
    };
  }

  static handleApiError(error: unknown, config: ApiConfig, text: string, provider: string): never {
    const errorDetails = this.createErrorDetails(error, config, text, provider);
    throw new Error(`${provider} API error: ${JSON.stringify(errorDetails, null, 2)}`);
  }

  static handleSyntaxError(provider: string): never {
    throw new Error(`Invalid response from ${provider} API. Please check your API configuration.`);
  }
}

// Canny feedback handler
class CannyFeedback {
  static async submitFeedback(feedback: FeedbackDetails) {
    try {
      const version = chrome.runtime.getManifest().version;
      const response = await fetch('https://canny.io/api/v1/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: CONFIG_STORE.canny?.apiKey,
          authorID: CONFIG_STORE.canny?.userID,
          boardID: CONFIG_STORE.canny?.boardID,
          categoryID: CONFIG_STORE.canny?.categoryID,
          title: `Translation Feedback (${feedback.rating} stars)`,
          details: `Comment:\n${feedback.comment}\n\nOriginal Text:\n${feedback.details.originalText}\n\nTranslated Text:\n${feedback.details.translatedText}\n\nContext:\n- URL: ${feedback.details.url}\n- Provider: ${feedback.details.provider}\n- Model: ${feedback.details.model}\n- Version: ${version}`
        })
      });

      console.log('Feedback submitted to Canny:', response);

      if (!response.ok) {
        throw new Error('Failed to submit feedback to Canny');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }
}

// Menu manager for context menu operations
class MenuManager {
  static createMenuItem(id: string, title: string, contexts: chrome.contextMenus.ContextType[], callback?: () => void) {
    chrome.contextMenus.create({
      id,
      title,
      contexts
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error creating menu item ${id}:`, chrome.runtime.lastError);
      } else {
        callback?.();
      }
    });
  }

  static setupContextMenu(experimentalFeatures: ExperimentalFeatures) {
    chrome.contextMenus.removeAll(() => {
      this.createMenuItem(
        MENU_ITEMS.SELECTION,
        'Markierten Text in Leichte Sprache übersetzen',
        ['selection'],
        () => {}
      );

      this.createMenuItem(
        MENU_ITEMS.ARTICLE,
        'Artikel in Leichte Sprache übersetzen',
        ['all'],
        () => {}
      );

      if (experimentalFeatures?.fullPageTranslation) {
        this.createMenuItem(
          MENU_ITEMS.FULLPAGE,
          'Ganze Seite in Leichte Sprache übersetzen (Beta)',
          ['all'],
          () => console.log('Context menu items created successfully')
        );
      }
    });
  }
}

// Current API configuration
let API_CONFIG: ApiConfig = {
  provider: 'openAI', // Must match the key in providers object
  model: 'gpt-4-turbo',
  apiKey: '',
  apiEndpoint: ''
};

// Helper function to normalize provider names
function normalizeProviderName(provider: string): string {
  const providerMap: { [key: string]: string } = {
    'openai': 'openAI',
    'openAI': 'openAI',
    'OPENAI': 'openAI'
  };
  return providerMap[provider.toLowerCase()] || provider;
}

// Load API configuration from storage and config file
async function loadApiConfig(): Promise<ApiConfig> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['provider', 'model', 'apiKey', 'apiEndpoint'], (items: StorageItems) => {
      console.log('Loading API configuration from storage');
      
      // Update provider and model from storage
      if (items.provider) API_CONFIG.provider = normalizeProviderName(items.provider);
      if (items.model) API_CONFIG.model = items.model;
      
      // Prioritize user-provided keys and endpoints from storage
      if (items.apiKey) {
        API_CONFIG.apiKey = items.apiKey;
      } else if (API_CONFIG.provider && CONFIG_STORE.providers[API_CONFIG.provider]?.apiKey) {
        API_CONFIG.apiKey = CONFIG_STORE.providers[API_CONFIG.provider].apiKey;
      }

      if (items.apiEndpoint) {
        API_CONFIG.apiEndpoint = items.apiEndpoint;
      } else if (API_CONFIG.provider && CONFIG_STORE.providers[API_CONFIG.provider]?.apiEndpoint) {
        API_CONFIG.apiEndpoint = CONFIG_STORE.providers[API_CONFIG.provider].apiEndpoint;
      }
      
      console.log('API configuration loaded:', { 
        provider: API_CONFIG.provider, 
        model: API_CONFIG.model,
        hasApiKey: !!API_CONFIG.apiKey,
        hasEndpoint: !!API_CONFIG.apiEndpoint
      });
      
      resolve(API_CONFIG);
    });
  });
}

// Initialize configuration on extension load
chrome.runtime.onInstalled.addListener(loadApiConfig);
chrome.runtime.onStartup.addListener(loadApiConfig);

// Translation cache
class TranslationCache {
  static async get(text: string): Promise<string | null> {
    try {
      const result = await chrome.storage.local.get(['translationCache']);
      return (result.translationCache || {})[text];
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  static async set(text: string, translation: string): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['translationCache']);
      const cache = result.translationCache || {};
      cache[text] = translation;
      
      const entries = Object.entries(cache);
      if (entries.length > 100) {
        const newCache = Object.fromEntries(entries.slice(-100));
        await chrome.storage.local.set({ translationCache: newCache });
      } else {
        await chrome.storage.local.set({ translationCache: cache });
      }
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }
}

// Initialize context menu
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated, creating context menu');
  chrome.storage.sync.get(['experimentalFeatures'], (items: StorageItems) => {
    MenuManager.setupContextMenu(items.experimentalFeatures || {});
  });
});

// Message handling
chrome.runtime.onMessage.addListener((message: TranslationMessage | ConfigMessage | FeedbackMessage, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'translateText' || message.action === 'translateArticle' || message.action === 'translateSection') {
    const content = message.action === 'translateArticle' || message.action === 'translateSection' ? message.html : message.text;
    const isHtml = message.action === 'translateArticle' || message.action === 'translateSection';
    
    (async () => {
      try {
        if (!content) throw new Error('No content provided for translation');
        const translation = await handleTranslation(content, isHtml);
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'showTranslation',
            translation: translation,
            id: message.id
          });
        }

        if (message.action === 'translateSection') {
          sendResponse({ success: true });
        }
      } catch (error) {
        console.error('Error translating:', error);
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'showError',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        if (message.action === 'translateSection') {
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    })();
    return true;
  }
  else if (message.action === 'updateApiConfig') {
    try {
      if (!message.config) throw new Error('No configuration provided');
      
      API_CONFIG = { ...API_CONFIG, ...message.config };
      
      // Store updated config in chrome.storage
      chrome.storage.sync.set({
        provider: API_CONFIG.provider,
        model: API_CONFIG.model,
        apiKey: API_CONFIG.apiKey,
        apiEndpoint: API_CONFIG.apiEndpoint
      }, () => {
        console.log('API Configuration updated:', {
          provider: API_CONFIG.provider,
          model: API_CONFIG.model
        });

        chrome.storage.sync.get(['experimentalFeatures'], (items: StorageItems) => {
          MenuManager.setupContextMenu(items.experimentalFeatures || {});
        });
      });
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error updating API configuration:', error);
      sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  else if (message.action === 'submitFeedback') {
    (async () => {
      try {
        const result = await CannyFeedback.submitFeedback(message.feedback);
        sendResponse({ success: true, result });
      } catch (error) {
        console.error('Error submitting feedback:', error);
        sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    })();
    return true;
  }
  
  return true;
});

// Translation handler
async function handleTranslation(text: string, isArticle = false): Promise<string> {
  console.log('Starting translation with provider:', API_CONFIG.provider);
  
  try {
    const cachedTranslation = await TranslationCache.get(text);
    if (cachedTranslation) {
      console.log('Found translation in cache');
      return cachedTranslation;
    }

    await loadApiConfig();

    if (!API_CONFIG.provider) {
      throw new Error('No translation provider selected. Please configure a provider in the extension settings.');
    }

    console.log('Translation configuration:', {
      provider: API_CONFIG.provider,
      model: API_CONFIG.model,
      endpoint: API_CONFIG.apiEndpoint,
      textLength: text.length,
      isArticle: isArticle
    });

    const translation = await translate(text, API_CONFIG, isArticle);
    await TranslationCache.set(text, translation);
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// Content script management
class ContentScriptManager {
  static async checkIfLoaded(tab: chrome.tabs.Tab): Promise<boolean> {
    if (!tab.id) return false;
    try {
      const response = await new Promise<PingResponse | null>(resolve => {
        if (!tab.id) {
          resolve(null);
          return;
        }
        chrome.tabs.sendMessage(tab.id, { action: 'ping' }, response => {
          if (chrome.runtime.lastError) {
            resolve(null);
          } else {
            resolve(response as PingResponse);
          }
        });
      });
      return response?.status === 'ok';
    } catch (error) {
      return false;
    }
  }

  static async inject(tab: chrome.tabs.Tab): Promise<boolean> {
    if (!tab.id) return false;
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['dist/content/overlay.css']
      });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['dist/content/content.js']
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const isLoaded = await this.checkIfLoaded(tab);
      if (!isLoaded) {
        throw new Error('Content script failed to initialize after injection');
      }

      return true;
    } catch (error) {
      console.error('Failed to inject content script:', error);
      return false;
    }
  }

  static async sendMessage(tab: chrome.tabs.Tab, message: Message): Promise<void> {
    if (!tab.id) return;
    try {
      if (message.action === 'ping') {
        return new Promise((resolve, reject) => {
          if (!tab.id) {
            reject(new Error('Tab ID is undefined'));
            return;
          }
          chrome.tabs.sendMessage(tab.id, message, response => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
      }
      
      if (!tab.id) return;
      chrome.tabs.sendMessage(tab.id, message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  
  console.log('Context menu clicked:', info.menuItemId);
  
  if (info.menuItemId === MENU_ITEMS.SELECTION || info.menuItemId === MENU_ITEMS.ARTICLE || info.menuItemId === MENU_ITEMS.FULLPAGE) {
    if (info.menuItemId === MENU_ITEMS.SELECTION && !info.selectionText) return;
    
    console.log('Current API configuration:', {
      provider: API_CONFIG.provider,
      model: API_CONFIG.model
    });

    const performTranslation = async () => {
      try {
        let isLoaded = await ContentScriptManager.checkIfLoaded(tab);
        
        if (!isLoaded) {
          console.log('Content script not loaded, injecting...');
          const injected = await ContentScriptManager.inject(tab);
          if (!injected) {
            throw new Error('Failed to inject content script');
          }
          isLoaded = await ContentScriptManager.checkIfLoaded(tab);
          if (!isLoaded) {
            throw new Error('Content script failed to initialize');
          }
        }

        if (info.menuItemId === MENU_ITEMS.ARTICLE) {
          ContentScriptManager.sendMessage(tab, { action: 'startArticleMode' });
        } else if (info.menuItemId === MENU_ITEMS.FULLPAGE) {
          ContentScriptManager.sendMessage(tab, { action: 'startFullPageMode' });
        } else if (info.selectionText) {
          ContentScriptManager.sendMessage(tab, { action: 'startTranslation' });
          const translation = await handleTranslation(info.selectionText);
          ContentScriptManager.sendMessage(tab, {
            action: 'showTranslation',
            translation: translation
          });
        }
      } catch (error) {
        console.error('Error during translation:', error);
        try {
          if (!await ContentScriptManager.checkIfLoaded(tab)) {
            await ContentScriptManager.inject(tab);
          }
          ContentScriptManager.sendMessage(tab, {
            action: 'showError',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        } catch (e) {
          console.error('Failed to show error:', e);
        }
      }
    };

    performTranslation().catch(error => {
      console.error('Critical error:', error);
    });
  }
});

console.log('Klartext background script loaded');
