// Constants
const MENU_ITEM_ID = 'translate-to-leichte-sprache';
const REPO_URL = 'https://github.com/bhamm/klartext';

// Provider configurations with translation handlers
const PROVIDERS = {
  gpt4: {
    async translate(text, config) {
      try {
        const requestBody = {
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
        };

        const response = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (!response.ok) {
          const errorDetails = {
            message: data.error?.message || 'Unknown error',
            request: {
              endpoint: config.apiEndpoint,
              model: config.model,
              text: text
            },
            response: data,
            status: response.status,
            statusText: response.statusText
          };
          throw new Error(`OpenAI API error: ${JSON.stringify(errorDetails, null, 2)}`);
        }

        return data.choices[0].message.content;
      } catch (error) {
        if (error.name === 'SyntaxError') {
          throw new Error(`Invalid response from OpenAI API: ${error.message}. ${text} - ${config}`);
        }
        throw error;
      }
    }
  },
  gemini: {
    async translate(text, config) {
      try {
        const requestBody = {
          contents: [{
            parts: [{
              text: `Translate the following German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache:\n\n${text}`
            }]
          }],
          generationConfig: {
            temperature: 0.7
          }
        };

        const response = await fetch(`${config.apiEndpoint}/${config.model}:generateContent?key=${config.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (!response.ok) {
          const errorDetails = {
            message: data.error?.message || 'Unknown error',
            request: {
              endpoint: config.apiEndpoint,
              model: config.model,
              text: text
            },
            response: data,
            status: response.status,
            statusText: response.statusText
          };
          throw new Error(`Gemini API error: ${JSON.stringify(errorDetails, null, 2)}`);
        }

        return data.candidates[0].content.parts[0].text;
      } catch (error) {
        if (error.name === 'SyntaxError') {
          throw new Error(`Invalid response from Gemini API: ${error.message}`);
        }
        throw error;
      }
    }
  },
  claude: {
    async translate(text, config) {
      try {
        const requestBody = {
          model: config.model,
          messages: [{
            role: 'user',
            content: `Translate the following German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache:\n\n${text}`
          }],
          max_tokens: 1000,
          temperature: 0.7
        };

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (!response.ok) {
          const errorDetails = {
            message: data.error?.message || 'Unknown error',
            request: {
              endpoint: 'https://api.anthropic.com/v1/messages',
              model: config.model,
              text: text
            },
            response: data,
            status: response.status,
            statusText: response.statusText
          };
          throw new Error(`Claude API error: ${JSON.stringify(errorDetails, null, 2)}`);
        }

        return data.content[0].text;
      } catch (error) {
        if (error.name === 'SyntaxError') {
          throw new Error(`Invalid response from Claude API: ${error.message}`);
        }
        throw error;
      }
    }
  },
  llama: {
    async translate(text, config) {
      try {
        const requestBody = {
          model: config.model,
          prompt: `Translate the following German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache:\n\n${text}`,
          temperature: 0.7,
          max_tokens: 1000
        };

        const response = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (!response.ok) {
          const errorDetails = {
            message: data.error?.message || 'Unknown error',
            request: {
              endpoint: config.apiEndpoint,
              model: config.model,
              text: text
            },
            response: data,
            status: response.status,
            statusText: response.statusText
          };
          throw new Error(`Llama API error: ${JSON.stringify(errorDetails, null, 2)}`);
        }

        return data.generated_text;
      } catch (error) {
        if (error.name === 'SyntaxError') {
          throw new Error(`Invalid response from Llama API: ${error.message}`);
        }
        throw error;
      }
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

// Translation cache using chrome.storage.local for persistence
async function getCachedTranslation(text) {
  try {
    const result = await chrome.storage.local.get(['translationCache']);
    const cache = result.translationCache || {};
    return cache[text];
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

async function cacheTranslation(text, translation) {
  try {
    const result = await chrome.storage.local.get(['translationCache']);
    const cache = result.translationCache || {};
    
    // Add new translation
    cache[text] = translation;
    
    // Limit cache size to 100 entries
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
        console.error('Error creating context menu:', chrome.runtime.lastError);
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
  
  try {
    // Check cache first
    const cachedTranslation = await getCachedTranslation(text);
    if (cachedTranslation) {
      console.log('Found translation in cache');
      return cachedTranslation;
    }

    // Get provider handler
    const provider = PROVIDERS[API_CONFIG.provider];
    if (!provider) {
      throw new Error(`Unsupported provider: ${API_CONFIG.provider}`);
    }

    // Perform translation
    const translation = await provider.translate(text, API_CONFIG);
    
    // Cache the result
    await cacheTranslation(text, translation);

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

    // Helper function to check if content script is loaded
    const checkContentScript = async () => {
      try {
        const response = await new Promise(resolve => {
          chrome.tabs.sendMessage(tab.id, { action: 'ping' }, response => {
            if (chrome.runtime.lastError) {
              resolve(null);
            } else {
              resolve(response);
            }
          });
        });
        return response?.status === 'ok';
      } catch (error) {
        return false;
      }
    };

    // Helper function to inject content script and styles
    const injectContentScript = async () => {
      try {
        // First inject CSS
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['src/content/overlay.css']
        });

        // Then inject JS
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/content.js']
        });

        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify script is loaded
        const isLoaded = await checkContentScript();
        if (!isLoaded) {
          throw new Error('Content script failed to initialize after injection');
        }

        return true;
      } catch (error) {
        console.error('Failed to inject content script:', error);
        return false;
      }
    };

    // Helper function to send message to content script
    const sendMessage = async (message) => {
      try {
        // For ping messages, we expect a response
        if (message.action === 'ping') {
          return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tab.id, message, response => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(response);
              }
            });
          });
        }
        
        // For other messages, just send without waiting for response
        chrome.tabs.sendMessage(tab.id, message);
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    };

    // Main translation function
    const performTranslation = async () => {
      try {
        // Check if content script is loaded
        let isLoaded = await checkContentScript();
        
        // If not loaded, try to inject it
        if (!isLoaded) {
          console.log('Content script not loaded, injecting...');
          const injected = await injectContentScript();
          if (!injected) {
            throw new Error('Failed to inject content script');
          }
          isLoaded = await checkContentScript();
          if (!isLoaded) {
            throw new Error('Content script failed to initialize');
          }
        }

        // Perform translation
        console.log('Starting translation...');
        const translation = await handleTranslation(info.selectionText);
        console.log('Translation completed, showing result');

        // Show translation (don't await response)
        sendMessage({
          action: 'showTranslation',
          translation: translation
        });
      } catch (error) {
        console.error('Error during translation:', error);
        try {
          // Ensure content script is loaded for error display
          if (!await checkContentScript()) {
            await injectContentScript();
          }
          sendMessage({
            action: 'showError',
            error: error.message
          });
        } catch (e) {
          console.error('Failed to show error:', e);
        }
      }
    };

    // Execute translation
    performTranslation().catch(error => {
      console.error('Critical error:', error);
    });
  }
});

// Log when background script is loaded
console.log('Klartext background script loaded');
