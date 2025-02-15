// Constants
const MENU_ITEMS = {
  SELECTION: 'translate-selection-to-leichte-sprache',
  ARTICLE: 'translate-article-to-leichte-sprache',
  FULLPAGE: 'translate-fullpage-to-leichte-sprache'
};
const REPO_URL = 'https://github.com/bhamm/klartext';

// Provider configurations with translation handlers
const PROVIDERS = {
  gpt4: {
    async translate(text, config, isArticle = false) {
      try {
        // Validate configuration
        if (!config.apiEndpoint) {
          throw new Error('OpenAI API endpoint is not configured');
        }
        if (!config.apiKey) {
          throw new Error('OpenAI API key is not configured');
        }

        const systemPrompt = isArticle ?
          'You are an expert in German "Leichte Sprache" and HTML formatting. Extract the article content from HTML, ignoring navigation, ads, and captions. Translate the text into "Leichte Sprache" following DIN SPEC 33429 rules. Format the result as clean HTML with paragraphs (<p>), clear headings (<h2>, <h3>), and simple lists (<ul>, <li>) where appropriate. One sentence per line. Respond with properly formatted HTML only. Keep the sentiment, tone and meaning of the original text.' :
          'You are an expert in German "Leichte Sprache". Translate the following text into "Leichte Sprache" following DIN SPEC 33429 rules. Keep the HTML structure intact, only translate the text content. Keep headings (<h1>-<h6>), paragraphs (<p>), and lists (<ul>, <li>). One sentence per line. Keep the sentiment, tone and meaning of the original text.';

        const requestBody = {
          model: config.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
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
          throw new Error('Invalid response from OpenAI API. Please check your API endpoint configuration.');
        }
        throw error;
      }
    }
  },
  gemini: {
    async translate(text, config, isArticle = false) {
      try {
        // Validate configuration
        if (!config.apiEndpoint) {
          throw new Error('Gemini API endpoint is not configured');
        }
        if (!config.apiKey) {
          throw new Error('Gemini API key is not configured');
        }

        const prompt = isArticle ?
          `You are an expert in German "Leichte Sprache" and HTML formatting.
           
           Process the following HTML content:
           1. Extract the main article content, ignoring navigation, ads, captions, etc.
           2. Translate the text into "Leichte Sprache" following Netzwerk für deutsche Sprache rules
           3. Format the result as clean HTML with:
              - Short paragraphs (<p>)
              - Clear headings (<h2>, <h3>)
              - Simple lists (<ul>, <li>) where appropriate
              - No nested structures
              - No images or complex elements
           
           Input HTML:
           ${text}
           
           Respond with properly formatted HTML only.` :
          `Translate the following German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache:\n\n${text}`;

        const requestBody = {
          contents: [{
            parts: [{
              text: prompt
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
          throw new Error('Invalid response from Gemini API. Please check your API endpoint configuration.');
        }
        throw error;
      }
    }
  },
  claude: {
    async translate(text, config, isArticle = false) {
      try {
        // Validate configuration
        if (!config.apiKey) {
          throw new Error('Claude API key is not configured');
        }

        const prompt = isArticle ?
          `You are an expert in German "Leichte Sprache" and HTML formatting.
           
           Process the following HTML content:
           1. Extract the main article content, ignoring navigation, ads, captions, etc.
           2. Translate the text into "Leichte Sprache" following Netzwerk für deutsche Sprache rules
           3. Format the result as clean HTML with:
              - Short paragraphs (<p>)
              - Clear headings (<h2>, <h3>)
              - Simple lists (<ul>, <li>) where appropriate
              - No nested structures
              - No images or complex elements
           
           Input HTML:
           ${text}
           
           Respond with properly formatted HTML only.` :
          `Translate the following German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache:\n\n${text}`;

        const requestBody = {
          model: config.model,
          messages: [{
            role: 'user',
            content: prompt
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
          throw new Error('Invalid response from Claude API. Please check your API configuration.');
        }
        throw error;
      }
    }
  },
  llama: {
    async translate(text, config, isArticle = false) {
      try {
        // Validate configuration
        if (!config.apiEndpoint) {
          throw new Error('Llama API endpoint is not configured');
        }

        const prompt = isArticle ?
          `You are an expert in German "Leichte Sprache" and HTML formatting.
           
           Process the following HTML content:
           1. Extract the main article content, ignoring navigation, ads, captions, etc.
           2. Translate the text into "Leichte Sprache" following Netzwerk für deutsche Sprache rules
           3. Format the result as clean HTML with:
              - Short paragraphs (<p>)
              - Clear headings (<h2>, <h3>)
              - Simple lists (<ul>, <li>) where appropriate
              - No nested structures
              - No images or complex elements
           
           Input HTML:
           ${text}
           
           Respond with properly formatted HTML only.` :
          `Translate the following German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache:\n\n${text}`;

        const requestBody = {
          model: config.model,
          prompt: prompt,
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
          throw new Error('Invalid response from Llama API. Please check your API endpoint configuration.');
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
async function loadApiConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['provider', 'model', 'apiKey', 'apiEndpoint'], (items) => {
      console.log('Loading API configuration from storage');
      if (items.provider) API_CONFIG.provider = items.provider;
      if (items.model) API_CONFIG.model = items.model;
      if (items.apiKey) API_CONFIG.apiKey = items.apiKey;
      if (items.apiEndpoint) API_CONFIG.apiEndpoint = items.apiEndpoint;
      console.log('API configuration loaded:', { provider: API_CONFIG.provider, model: API_CONFIG.model });
      resolve(API_CONFIG);
    });
  });
}

// Initialize configuration on extension load
chrome.runtime.onInstalled.addListener(loadApiConfig);
chrome.runtime.onStartup.addListener(loadApiConfig);

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
    // Create menu items
    chrome.contextMenus.create({
      id: MENU_ITEMS.SELECTION,
      title: 'Markierten Text in Leichte Sprache übersetzen',
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error creating selection menu item:', chrome.runtime.lastError);
      }
    });

    chrome.contextMenus.create({
      id: MENU_ITEMS.ARTICLE,
      title: 'Artikel in Leichte Sprache übersetzen',
      contexts: ['all']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error creating article menu item:', chrome.runtime.lastError);
      }
    });

    chrome.contextMenus.create({
      id: MENU_ITEMS.FULLPAGE,
      title: 'Ganze Seite in Leichte Sprache übersetzen',
      contexts: ['all']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error creating fullpage menu item:', chrome.runtime.lastError);
      } else {
        console.log('Context menu items created successfully');
      }
    });
  });
});

// Listen for API configuration updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'translateText' || message.action === 'translateArticle' || message.action === 'translateSection') {
    // Handle translation
    console.log(`Received ${message.action} request`);
    
    const content = message.action === 'translateArticle' || message.action === 'translateSection' ? message.html : message.text;
    const isHtml = message.action === 'translateArticle' || message.action === 'translateSection';
    
    handleTranslation(content, isHtml)
      .then(translation => {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'showTranslation',
          translation: translation,
          id: message.id // Pass through the section ID for full page mode
        });
        // Send response for section translation
        if (message.action === 'translateSection') {
          sendResponse({ success: true });
        }
      })
      .catch(error => {
        console.error('Error translating:', error);
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'showError',
          error: error.message
        });
        // Send error response for section translation
        if (message.action === 'translateSection') {
          sendResponse({ success: false, error: error.message });
        }
      });
    return true;
  }
  else if (message.action === 'updateApiConfig') {
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
async function handleTranslation(text, isArticle = false) {
  console.log('Starting translation with provider:', API_CONFIG.provider);
  
  try {
    // Check cache first
    const cachedTranslation = await getCachedTranslation(text);
    if (cachedTranslation) {
      console.log('Found translation in cache');
      return cachedTranslation;
    }

    // Reload configuration to ensure it's fresh
    await loadApiConfig();

    // Validate API configuration
    if (!API_CONFIG.provider) {
      throw new Error('No translation provider selected. Please configure a provider in the extension settings.');
    }

    // Get provider handler
    const provider = PROVIDERS[API_CONFIG.provider];
    if (!provider) {
      throw new Error(`Unsupported provider: ${API_CONFIG.provider}`);
    }

    // Validate required configuration
    if (provider === PROVIDERS.gpt4 && !API_CONFIG.apiEndpoint) {
      throw new Error('OpenAI API endpoint is not configured. Please check your extension settings.');
    }

    // Log configuration (without sensitive data)
    console.log('Translation configuration:', {
      provider: API_CONFIG.provider,
      model: API_CONFIG.model,
      endpoint: API_CONFIG.apiEndpoint,
      textLength: text.length,
      isArticle: isArticle
    });

    // Perform translation
    const translation = await provider.translate(text, API_CONFIG, isArticle);
    
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
  
  if (info.menuItemId === MENU_ITEMS.SELECTION || info.menuItemId === MENU_ITEMS.ARTICLE || info.menuItemId === MENU_ITEMS.FULLPAGE) {
    if (info.menuItemId === MENU_ITEMS.SELECTION) {
      if (!info.selectionText) return;
      console.log('Selected text:', info.selectionText.substring(0, 50) + '...');
    }
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

          if (info.menuItemId === MENU_ITEMS.ARTICLE) {
            // Start article mode
            sendMessage({
              action: 'startArticleMode'
            });
          } else if (info.menuItemId === MENU_ITEMS.FULLPAGE) {
            console.log('Starting full page translation mode');
            // Start full page translation mode
            sendMessage({
              action: 'startFullPageMode'
            });
          } else {
            // Show loading state immediately
            sendMessage({
              action: 'startTranslation'
            });

            // Perform translation
            console.log('Starting translation...');
            const translation = await handleTranslation(info.selectionText);
            console.log('Translation completed, showing result');

            // Show translation result
            sendMessage({
              action: 'showTranslation',
              translation: translation
            });
          }
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
