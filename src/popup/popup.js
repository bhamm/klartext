// Provider configurations
const PROVIDERS = {
  openAI: {
    name: 'OpenAI',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1', 'gpt-4o-mini', 'gpt-4o', 'o3-mini'],
    defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
    keyPlaceholder: 'sk-...',
    keyHint: 'OpenAI API-Schlüssel beginnt mit "sk-"'
  },
  google: {
    name: 'Google Gemini',
    models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite-preview-02-05', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'],
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
    keyPlaceholder: 'Ihr Google API-Schlüssel',
    keyHint: 'Google Cloud API-Schlüssel'
  },
  anthropic: {
    name: 'Anthropic Claude',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    defaultEndpoint: 'https://api.anthropic.com/v1/messages',
    keyPlaceholder: 'sk-...',
    keyHint: 'Anthropic API-Schlüssel beginnt mit "sk-"'
  },
  local: {
    name: 'Local Model',
    models: ['llama-2-70b', 'llama-2-13b', 'llama-2-7b'],
    defaultEndpoint: 'http://localhost:1234/completion',
    keyPlaceholder: 'Optional für lokale Installation',
    keyHint: 'API-Schlüssel optional bei lokaler Installation'
  }
};

// DOM Elements
const providerSelect = document.getElementById('provider-select');
const modelSelect = document.getElementById('model-select');
const apiKeyInput = document.getElementById('api-key');
const apiEndpointInput = document.getElementById('api-endpoint');
const apiHint = document.getElementById('api-hint');
const compareViewCheckbox = document.getElementById('compare-view');
const excludeCommentsCheckbox = document.getElementById('exclude-comments');
const saveButton = document.querySelector('.save-button');
const statusDiv = document.getElementById('status');

// Load API keys from config
let apiKeys = {};

async function loadApiKeys() {
  try {
    const response = await fetch(chrome.runtime.getURL('src/config/api-keys.json'));
    apiKeys = await response.json();
  } catch (error) {
    console.error('Error loading API keys:', error);
  }
}

// Load saved settings
async function loadSettings() {
  await loadApiKeys();
  
  chrome.storage.sync.get(
    {
      provider: 'openAI',
      model: '',
      apiKey: '',
      apiEndpoint: '',
      textSize: 'normal',
      experimentalFeatures: {
        fullPageTranslation: false
      },
      compareView: false,
      excludeComments: true
    },
    (items) => {
      const provider = items.provider;
      const config = PROVIDERS[provider];
      
      providerSelect.value = provider;
      // Use API key from config if available, otherwise use saved key
      apiKeyInput.value = apiKeys[provider]?.apiKey || items.apiKey;
      // Use API endpoint from config if available, otherwise use saved endpoint or default
      apiEndpointInput.value = apiKeys[provider]?.apiEndpoint || items.apiEndpoint || config.defaultEndpoint;
      document.querySelector(`input[name="text-size"][value="${items.textSize}"]`).checked = true;
      compareViewCheckbox.checked = items.compareView;
      excludeCommentsCheckbox.checked = items.excludeComments;
      
      // Initialize experimental features
      const enableFullpageCheckbox = document.getElementById('enable-fullpage');
      const fullpageSettings = document.getElementById('fullpage-settings');
      
      enableFullpageCheckbox.checked = items.experimentalFeatures?.fullPageTranslation || false;
      fullpageSettings.classList.toggle('enabled', enableFullpageCheckbox.checked);
      
      // Update UI and save settings to ensure default endpoint is stored
      updateProviderUI(provider, items.model);
      if (!items.apiEndpoint) {
        saveSettings().catch(console.error);
      }
    }
  );
}

// Initialize settings when popup opens
loadSettings().catch(console.error);

// Update UI based on selected provider
function updateProviderUI(provider, selectedModel = '') {
  const config = PROVIDERS[provider];
  
  // Update API key field
  apiKeyInput.placeholder = config.keyPlaceholder;
  apiHint.textContent = config.keyHint;

  // Update endpoint field
  apiEndpointInput.placeholder = config.defaultEndpoint;
  // Set default endpoint if field is empty
  if (!apiEndpointInput.value) {
    apiEndpointInput.value = config.defaultEndpoint;
  }
  
  // Update model select options
  modelSelect.innerHTML = config.models
    .map(model => `<option value="${model}">${model}</option>`)
    .join('');

  if (selectedModel && config.models.includes(selectedModel)) {
    modelSelect.value = selectedModel;
  }
}

// Save settings
async function saveSettings() {
  const settings = {
    provider: providerSelect.value,
    model: modelSelect.value,
    apiKey: apiKeyInput.value.trim(),
    apiEndpoint: apiEndpointInput.value.trim(),
    textSize: document.querySelector('input[name="text-size"]:checked').value,
    experimentalFeatures: {
      fullPageTranslation: document.getElementById('enable-fullpage').checked
    },
    compareView: compareViewCheckbox.checked,
    excludeComments: excludeCommentsCheckbox.checked
  };

  try {
    // Save to storage
    await new Promise((resolve, reject) => {
      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });

    // Update API configuration in background script
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'updateApiConfig',
        config: {
          provider: settings.provider,
          model: settings.model,
          apiKey: settings.apiKey,
          apiEndpoint: settings.apiEndpoint || PROVIDERS[settings.provider].defaultEndpoint,
          compareView: settings.compareView,
          excludeComments: settings.excludeComments
        }
      }, resolve);
    });

    if (response && response.success) {
      // Update text size only in active tab if it's a supported URL
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.url && 
          (activeTab.url.startsWith('http') || activeTab.url.startsWith('file'))) {
        try {
          // Check if content script is already loaded
          const pingResponse = await new Promise((resolve) => {
            chrome.tabs.sendMessage(activeTab.id, { action: 'ping' }, (response) => {
              resolve(response);
            });
          }).catch(() => null);

          // Only inject if content script is not loaded
          if (!pingResponse) {
            await chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              files: ['src/content/content.js']
            });
            // Wait a bit for the content script to initialize
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Update settings in content script
          await chrome.tabs.sendMessage(activeTab.id, {
            action: 'updateSettings',
            settings: {
              textSize: settings.textSize,
              compareView: settings.compareView,
              excludeComments: settings.excludeComments
            }
          });
        } catch (err) {
          // Log but don't throw error for script injection issues
          console.warn('Could not update settings in content script:', err);
        }
      }

      showStatus('Einstellungen gespeichert', 'success');
    } else {
      throw new Error(response?.error || 'Failed to update API configuration');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus(`Fehler beim Speichern: ${error.message}`, 'error');
  }
}

// Show status message
function showStatus(message, type = 'success') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;

  // Clear status after 3 seconds
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }, 3000);
}

// Input validation
function validateInputs() {
  const provider = providerSelect.value;
  const apiKey = apiKeyInput.value.trim();
  
  // API key validation based on provider
  if (provider !== 'llama' && !apiKey) {
    showStatus('API-Schlüssel wird benötigt', 'error');
    return false;
  }

  // Validate API key format
  if (apiKey) {
    if ((provider === 'gpt4' || provider === 'claude') && !apiKey.startsWith('sk-')) {
      showStatus(`Ungültiger ${PROVIDERS[provider].name} API-Schlüssel Format`, 'error');
      return false;
    }
  }

  // Validate endpoint if provided
  const endpoint = apiEndpointInput.value.trim();
  if (endpoint && !endpoint.startsWith('http')) {
    showStatus('Ungültiger API-Endpoint Format', 'error');
    return false;
  }

  return true;
}

// Event Listeners
const enableFullpageCheckbox = document.getElementById('enable-fullpage');
const fullpageSettings = document.getElementById('fullpage-settings');

enableFullpageCheckbox.addEventListener('change', () => {
  fullpageSettings.classList.toggle('enabled', enableFullpageCheckbox.checked);
});

providerSelect.addEventListener('change', () => {
  const provider = providerSelect.value;
  const config = PROVIDERS[provider];
  
  // Use API key and endpoint from api-keys.json if available
  if (apiKeys[provider]) {
    apiKeyInput.value = apiKeys[provider].apiKey || '';
    apiEndpointInput.value = apiKeys[provider].apiEndpoint || config.defaultEndpoint;
  } else {
    apiKeyInput.value = '';
    apiEndpointInput.value = config.defaultEndpoint;
  }
  
  updateProviderUI(provider);
});

saveButton.addEventListener('click', async () => {
  if (validateInputs()) {
    saveButton.disabled = true;
    try {
      await saveSettings();
    } finally {
      saveButton.disabled = false;
    }
  }
});

// Handle Enter key in inputs
[apiKeyInput, apiEndpointInput].forEach(input => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && validateInputs()) {
      saveSettings();
    }
  });
});

// Secure input handling
function sanitizeInput(input) {
  return input.replace(/[<>]/g, '');
}

apiKeyInput.addEventListener('input', (e) => {
  e.target.value = sanitizeInput(e.target.value);
});

apiEndpointInput.addEventListener('input', (e) => {
  e.target.value = sanitizeInput(e.target.value);
});
