// Constants
const MENU_ITEMS = {
  SELECTION: 'translate-selection-to-leichte-sprache',
  ARTICLE: 'translate-article-to-leichte-sprache',
  FULLPAGE: 'translate-fullpage-to-leichte-sprache'
};
const REPO_URL = 'https://github.com/bhamm/klartext';

// Utility class for API error handling
class ApiErrorHandler {
  static createErrorDetails(error, config, text, provider) {
    return {
      message: error?.message || 'Unknown error',
      request: {
        endpoint: config.apiEndpoint || 'https://api.anthropic.com/v1/messages',
        model: config.model,
        text: text
      },
      response: error,
      status: error?.status,
      statusText: error?.statusText
    };
  }

  static handleApiError(error, config, text, provider) {
    const errorDetails = this.createErrorDetails(error, config, text, provider);
    throw new Error(`${provider} API error: ${JSON.stringify(errorDetails, null, 2)}`);
  }

  static handleSyntaxError(provider) {
    throw new Error(`Invalid response from ${provider} API. Please check your API configuration.`);
  }
}

// Menu manager for context menu operations
class MenuManager {
  static createMenuItem(id, title, contexts, callback) {
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

  static setupContextMenu(experimentalFeatures) {
    chrome.contextMenus.removeAll(() => {
      this.createMenuItem(
        MENU_ITEMS.SELECTION,
        'Markierten Text in Leichte Sprache übersetzen',
        ['selection']
      );

      this.createMenuItem(
        MENU_ITEMS.ARTICLE,
        'Artikel in Leichte Sprache übersetzen',
        ['all']
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

// Provider configurations with translation handlers
const PROVIDERS = {
  gpt4: {
    async translate(text, config, isArticle = false) {
      try {
        if (!config.apiEndpoint) throw new Error('OpenAI API endpoint is not configured');
        if (!config.apiKey) throw new Error('OpenAI API key is not configured');

        const systemPrompt = 
        'Du bist ein Experte und Übersetzer für deutsche "Leichte Sprache". ' +
        'Der HTML-Text wurde bereits bereinigt und enthält nur den relevanten Artikelinhalt. ' +
        'Übersetze den Text in Leichte Sprache. ' +
        'Du beachtest dabei diese Regeln: ' +
        'Der Text verwendet kurze und allgemein bekannte Wörter. ' +
        'Der Text verwendet bildungssprachliche Wörter und Fachwörter nur, wenn sie häufig verwendet werden, und erklärt diese. ' +
        'Der Text verwendet nur dann Fremdwörter, wenn sie allgemein bekannt sind. ' +
        'Der Text verwendet für eine Sache immer das gleiche Wort. ' +
        'Der Text verwendet nur Hauptsätze und keine Subjunktionalsätze, keine Ergänzungssätze und keine Relativsätze. ' +
        'Der Text verwendet keine Genitivkonstruktionen. ' +
        'Der Text verwendet keine Pronomen der dritten Person. ' +
        'Der Text verwendet keine Sätze mit "man" oder "jemand". ' +
        'Der Text spricht die Leser direkt an, wenn dies das Thema verständlicher macht. ' +
        'Der Text verwendet keine Konjunktivkonstruktionen. ' +
        'Der Text verwendet keine Passivkonstruktionen. ' +
        'Der Text verwendet nur die Zeitformen Präsens und Perfekt. ' +
        'In den Sätzen gibt es keine Aufzählungen. ' +
        'Wenn Aufzählungen notwendig sind, werden diese als Liste mit Aufzählungszeichen hervorgehoben. ' +
        'Der Text verwendet Verneinungen nur, wenn sie notwendig sind, und bedient sich hierzu der Wörter „nicht", „nichts" und „kein". ' +
        'Der Text hat Absätze mit Überschriften. ' +
        'Jeder Satz beginnt in einer neuen Zeile. ' +
        'Der Text enthält nur Sätze mit einem kurzen Mittelfeld. ' +
        'Der Text legt Ereignisse oder Handlungen chronologisch dar. ' +
        'Der Text ist im Verbalstil verfasst und verzichtet auf Nominalkonstruktionen. ' +
        'Du veränderst nicht den Sinn oder den Ton der Texte.' +
        'Formatiere das Ergebnis als sauberes HTML mit Absätzen (<p>), klaren Überschriften (<h2>, <h3>) und einfachen Listen (<ul>, <li>), wenn nötig. ' +
        'Antworte nur mit korrekt formatiertem HTML. ';

        const response = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text }
            ],
            temperature: 0.7
          })
        });

        const data = await response.json();
        if (!response.ok) {
          ApiErrorHandler.handleApiError(data, config, text, 'OpenAI');
        }

        let translation = data.choices[0].message.content;
        return translation.replace(/^'''|'''$/g, '').trim();
      } catch (error) {
        if (error.name === 'SyntaxError') {
          ApiErrorHandler.handleSyntaxError('OpenAI');
        }
        throw error;
      }
    }
  },
  gemini: {
    async translate(text, config, isArticle = false) {
      try {
        if (!config.apiEndpoint) throw new Error('Gemini API endpoint is not configured');
        if (!config.apiKey) throw new Error('Gemini API key is not configured');

        const prompt = isArticle ?
          `You are an expert in German "Leichte Sprache".
           
           The provided HTML has been cleaned and contains only the relevant article content.
           Translate the text into "Leichte Sprache" following Netzwerk für deutsche Sprache rules.
           
           Format the result as clean HTML with:
           - Short paragraphs (<p>)
           - Clear headings (<h2>, <h3>)
           - Simple lists (<ul>, <li>) where appropriate
           - One sentence per line
           
           Input HTML:
           ${text}
           
           Respond with properly formatted HTML only.` :
          `Translate the following German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache:\n\n${text}`;

        const response = await fetch(`${config.apiEndpoint}/${config.model}:generateContent?key=${config.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
          })
        });

        const data = await response.json();
        if (!response.ok) {
          ApiErrorHandler.handleApiError(data, config, text, 'Gemini');
        }

        let translation = data.candidates[0].content.parts[0].text;
        return translation.replace(/^'''|'''$/g, '').trim();
      } catch (error) {
        if (error.name === 'SyntaxError') {
          ApiErrorHandler.handleSyntaxError('Gemini');
        }
        throw error;
      }
    }
  },
  claude: {
    async translate(text, config, isArticle = false) {
      try {
        if (!config.apiKey) throw new Error('Claude API key is not configured');

        const prompt = isArticle ?
          `You are an expert in German "Leichte Sprache".
           
           The provided HTML has been cleaned and contains only the relevant article content.
           Translate the text into "Leichte Sprache" following Netzwerk für deutsche Sprache rules.
           
           Format the result as clean HTML with:
           - Short paragraphs (<p>)
           - Clear headings (<h2>, <h3>)
           - Simple lists (<ul>, <li>) where appropriate
           - One sentence per line
           
           Input HTML:
           ${text}
           
           Respond with properly formatted HTML only.` :
          `Translate the following German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache:\n\n${text}`;

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
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.7
          })
        });

        const data = await response.json();
        if (!response.ok) {
          ApiErrorHandler.handleApiError(data, config, text, 'Claude');
        }

        let translation = data.content[0].text;
        return translation.replace(/^'''|'''$/g, '').trim();
      } catch (error) {
        if (error.name === 'SyntaxError') {
          ApiErrorHandler.handleSyntaxError('Claude');
        }
        throw error;
      }
    }
  },
  llama: {
    async translate(text, config, isArticle = false) {
      try {
        if (!config.apiEndpoint) throw new Error('Llama API endpoint is not configured');

        const prompt = isArticle ?
          `You are an expert in German "Leichte Sprache".
           
           The provided HTML has been cleaned and contains only the relevant article content.
           Translate the text into "Leichte Sprache" following Netzwerk für deutsche Sprache rules.
           
           Format the result as clean HTML with:
           - Short paragraphs (<p>)
           - Clear headings (<h2>, <h3>)
           - Simple lists (<ul>, <li>) where appropriate
           - One sentence per line
           
           Input HTML:
           ${text}
           
           Respond with properly formatted HTML only.` :
          `Translate the following German text into "Leichte Sprache" following the rules of the Netzwerk für deutsche Sprache:\n\n${text}`;

        const response = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
          },
          body: JSON.stringify({
            model: config.model,
            prompt: prompt,
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        const data = await response.json();
        if (!response.ok) {
          ApiErrorHandler.handleApiError(data, config, text, 'Llama');
        }

        let translation = data.generated_text;
        return translation.replace(/^'''|'''$/g, '').trim();
      } catch (error) {
        if (error.name === 'SyntaxError') {
          ApiErrorHandler.handleSyntaxError('Llama');
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

// Translation cache
class TranslationCache {
  static async get(text) {
    try {
      const result = await chrome.storage.local.get(['translationCache']);
      return (result.translationCache || {})[text];
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  static async set(text, translation) {
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
  chrome.storage.sync.get(['experimentalFeatures'], (items) => {
    MenuManager.setupContextMenu(items.experimentalFeatures);
  });
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'translateText' || message.action === 'translateArticle' || message.action === 'translateSection') {
    const content = message.action === 'translateArticle' || message.action === 'translateSection' ? message.html : message.text;
    const isHtml = message.action === 'translateArticle' || message.action === 'translateSection';
    
    (async () => {
      try {
        const translation = await handleTranslation(content, isHtml);
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'showTranslation',
          translation: translation,
          id: message.id
        });

        if (message.action === 'translateSection') {
          sendResponse({ success: true });
        }
      } catch (error) {
        console.error('Error translating:', error);
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'showError',
          error: error.message
        });

        if (message.action === 'translateSection') {
          sendResponse({ success: false, error: error.message });
        }
      }
    })();
    return true;
  }
  else if (message.action === 'updateApiConfig') {
    try {
      if (!message.config) throw new Error('No configuration provided');
      
      API_CONFIG = { ...API_CONFIG, ...message.config };
      console.log('API Configuration updated:', {
        provider: API_CONFIG.provider,
        model: API_CONFIG.model
      });

      chrome.storage.sync.get(['experimentalFeatures'], (items) => {
        MenuManager.setupContextMenu(items.experimentalFeatures);
      });
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error updating API configuration:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  return true;
});

// Translation handler
async function handleTranslation(text, isArticle = false) {
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

    const provider = PROVIDERS[API_CONFIG.provider];
    if (!provider) {
      throw new Error(`Unsupported provider: ${API_CONFIG.provider}`);
    }

    if (provider === PROVIDERS.gpt4 && !API_CONFIG.apiEndpoint) {
      throw new Error('OpenAI API endpoint is not configured. Please check your extension settings.');
    }

    console.log('Translation configuration:', {
      provider: API_CONFIG.provider,
      model: API_CONFIG.model,
      endpoint: API_CONFIG.apiEndpoint,
      textLength: text.length,
      isArticle: isArticle
    });

    const translation = await provider.translate(text, API_CONFIG, isArticle);
    await TranslationCache.set(text, translation);
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// Content script management
class ContentScriptManager {
  static async checkIfLoaded(tab) {
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
  }

  static async inject(tab) {
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['src/content/overlay.css']
      });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/content.js']
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

  static async sendMessage(tab, message) {
    try {
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
      
      chrome.tabs.sendMessage(tab.id, message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
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
        } else {
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
            error: error.message
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
