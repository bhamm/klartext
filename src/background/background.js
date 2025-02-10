// Constants
const MENU_ITEM_ID = 'translate-to-leichte-sprache';
let API_CONFIG = {
  GPT4: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    key: ''
  },
  GEMINI: {
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    key: ''
  }
};

// Load API keys from storage
chrome.storage.sync.get(['gpt4Key', 'geminiKey'], (items) => {
  console.log('Loading API keys from storage');
  if (items.gpt4Key) {
    API_CONFIG.GPT4.key = items.gpt4Key;
    console.log('GPT-4 API key loaded');
  } else {
    console.warn('No GPT-4 API key found in storage');
  }
  
  if (items.geminiKey) {
    API_CONFIG.GEMINI.key = items.geminiKey;
    console.log('Gemini API key loaded');
  } else {
    console.warn('No Gemini API key found in storage');
  }
});

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

// Listen for API key updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'updateApiKeys') {
    console.log('Updating API keys');
    try {
      if (!message.gpt4Key && !message.geminiKey) {
        throw new Error('No API keys provided');
      }
      
      API_CONFIG.GPT4.key = message.gpt4Key;
      API_CONFIG.GEMINI.key = message.geminiKey;
      
      // Verify keys were set
      console.log('API Configuration status:', {
        gpt4KeyConfigured: !!API_CONFIG.GPT4.key,
        geminiKeyConfigured: !!API_CONFIG.GEMINI.key
      });
      
      // Send success response
      if (sendResponse) {
        sendResponse({ success: true });
      }
    } catch (error) {
      console.error('Error updating API keys:', error);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
    }
  }
  // Return true to indicate we'll send a response asynchronously
  return true;
});

// Cache for storing translations
let translationCache = new Map();

// Text complexity analysis
function analyzeComplexity(text) {
  // Simple complexity analysis based on:
  // - Sentence length
  // - Word length
  // - Presence of complex punctuation
  const complexityScore = text.split('.').reduce((score, sentence) => {
    const words = sentence.trim().split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    return score + (
      (words.length > 15 ? 2 : 1) * // Long sentences
      (avgWordLength > 6 ? 1.5 : 1) * // Long words
      (sentence.includes(',') ? 1.2 : 1) // Complex punctuation
    );
  }, 0) / text.split('.').length;

  return complexityScore > 2.5 ? 'complex' : 'simple';
}

// Check cache for existing translation
function checkCache(text) {
  return translationCache.get(text);
}

// Store translation in cache
function cacheTranslation(originalText, translation) {
  translationCache.set(originalText, translation);
  // Limit cache size to prevent memory issues
  if (translationCache.size > 1000) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
}

// Handle translation using appropriate model
async function handleTranslation(text) {
  console.log('Starting translation for text:', text.substring(0, 50) + '...');
  
  // Check cache first
  const cachedTranslation = checkCache(text);
  if (cachedTranslation) {
    console.log('Found translation in cache');
    return cachedTranslation;
  }

  // Analyze text complexity
  const complexity = analyzeComplexity(text);
  console.log('Text complexity analysis result:', complexity);
  
  try {
    let translation;
    if (complexity === 'complex') {
      console.log('Using GPT-4 for complex text');
      translation = await translateWithGPT4(text);
    } else {
      console.log('Using Gemini for simple text');
      translation = await translateWithGemini(text);
    }
    
    console.log('Translation successful');
    // Cache the result
    cacheTranslation(text, translation);
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// GPT-4 translation
async function translateWithGPT4(text) {
  if (!API_CONFIG.GPT4.key) {
    throw new Error('GPT-4 API key not configured');
  }

  const response = await fetch(API_CONFIG.GPT4.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_CONFIG.GPT4.key}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
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

// Gemini translation
async function translateWithGemini(text) {
  if (!API_CONFIG.GEMINI.key) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(`${API_CONFIG.GEMINI.endpoint}?key=${API_CONFIG.GEMINI.key}`, {
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
    console.error('Gemini API error response:', error);
    throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log('Gemini API response:', data);
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('Invalid response format from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  
  if (info.menuItemId === MENU_ITEM_ID && info.selectionText) {
    console.log('Selected text:', info.selectionText.substring(0, 50) + '...');
    console.log('Current API configuration:', {
      gpt4KeyConfigured: !!API_CONFIG.GPT4.key,
      geminiKeyConfigured: !!API_CONFIG.GEMINI.key
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
