// Constants
const MENU_ITEM_ID = 'translate-to-leichte-sprache';

// Provider configurations with translation handlers
const PROVIDERS = {
  gpt4: {
    async translate(text, config) {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: 'You are a translator specialized in converting German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GPT-4 API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }
  },
  gemini: {
    async translate(text, config) {
      const response = await fetch(`${config.apiEndpoint}/${config.model}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache:\n\n${text}`
            }]
          }],
          generationConfig: {
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
  },
  claude: {
    async translate(text, config) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{
            role: 'user',
            content: `Translate the following German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache:\n\n${text}`
          }],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      let error;
      try {
        const data = await response.json();
        if (!response.ok) {
          error = data;
          throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
        }
        // Extract the translation from the response
        return data.content[0].text;
      } catch (e) {
        if (error) {
          throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
        }
        throw new Error(`Failed to parse Claude API response: ${e.message}`);
      }
    }
  },
  llama: {
    async translate(text, config) {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        },
        body: JSON.stringify({
          model: config.model,
          prompt: `Translate the following German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache:\n\n${text}`,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Llama API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.generated_text;
    }
  }
};

// Current API configuration
let API_CONFIG = {
  provider: 'gpt4',
  model: 'gpt-4',
  apiKey: '',
  apiEndpoint: ''
};

// Load API configuration from storage
chrome.storage.sync.get(['provider', 'model', 'apiKey', 'apiEndpoint'], (items) => {
  console.log('Loading API configuration from storage');
  if (items.provider) API_CONFIG.provider = items.provider;
  if (items.model) API_CONFIG.model = items.model;
  if (items.apiKey) API_CONFIG.apiKey = items.apiKey;
  if (items.apiEndpoint) API_CONFIG.apiEndpoint = items.apiEndpoint;
  console.log('API configuration loaded:', { provider: API_CONFIG.provider, model: API_CONFIG.model });
});

// Cache for storing translations with size limit
const translationCache = {
  _cache: new Map(),
  _maxSize: 1000,
  
  set(key, value) {
    if (this._cache.size >= this._maxSize) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }
    this._cache.set(key, value);
  },
  
  get(key) {
    return this._cache.get(key);
  },
  
  get size() {
    return this._cache.size;
  }
};

// Initialize context menu
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated, creating context menu');
  // Remove existing menu item if it exists
  chrome.contextMenus.removeAll(() => {
    // Create new menu item
    chrome.contextMenus.create({
      id: MENU_ITEM_ID,
      title: 'In Leichte Sprache übersetzen',
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error creating context menu: ${chrome.runtime.lastError.message}`);
      } else {
        console.log('Context menu created successfully');
      }
    });
  });
});

// Listen for API configuration updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'updateApiConfig') {
    console.log('Updating API configuration');
    try {
      if (!message.config) {
        throw new Error('No configuration provided');
      }
      
      API_CONFIG = { ...API_CONFIG, ...message.config };
      
      console.log('API Configuration updated:', {
        provider: API_CONFIG.provider,
        model: API_CONFIG.model
      });
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error updating API configuration:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  // Return true to indicate we'll send a response asynchronously
  return true;
});

// Handle translation
async function handleTranslation(text) {
  console.log('Starting translation with provider:', API_CONFIG.provider);
  
  // Check cache first
  const cachedTranslation = translationCache.get(text);
  if (cachedTranslation) {
    console.log('Found translation in cache');
    return cachedTranslation;
  }

  try {
    // Get provider handler
    const provider = PROVIDERS[API_CONFIG.provider];
    if (!provider) {
      throw new Error(`Unsupported provider: ${API_CONFIG.provider}`);
    }

    // Perform translation
    const translation = await provider.translate(text, API_CONFIG);
    
    // Cache the result
    translationCache.set(text, translation);
    if (translationCache.size > 1000) {
      const firstKey = translationCache.keys().next().value;
      translationCache.delete(firstKey);
    }

    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  
  if (info.menuItemId === MENU_ITEM_ID && info.selectionText) {
    console.log('Selected text:', info.selectionText.substring(0, 50) + '...');
    console.log('Current API configuration:', {
      provider: API_CONFIG.provider,
      model: API_CONFIG.model
    });

    // Check if content script is already injected
    chrome.tabs.sendMessage(tab.id, { action: 'ping' }, response => {
      const injectAndTranslate = async () => {
        try {
          // Only inject if we got no response (content script not loaded)
          if (chrome.runtime.lastError) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['src/content/content.js']
            });
            // Wait a bit for the content script to initialize
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          const translation = await handleTranslation(info.selectionText);
          console.log('Sending translation to content script');
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showTranslation',
            translation: translation
          });
        } catch (error) {
          console.error('Error during translation:', error);
          chrome.tabs.sendMessage(tab.id, {
            action: 'showError',
            error: error.message
          });
        }
      };

      injectAndTranslate();
    });
  }
});

// Log when background script is loaded
console.log('Klartext background script loaded');
