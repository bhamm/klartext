// Provider configurations
const PROVIDERS = {
  gpt4: {
    name: 'OpenAI GPT-4',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
    keyPlaceholder: 'sk-...',
    keyHint: 'OpenAI API-Schlüssel beginnt mit "sk-"'
  },
  gemini: {
    name: 'Google Gemini',
    models: ['gemini-pro', 'gemini-pro-vision'],
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
    keyPlaceholder: 'Ihr Google API-Schlüssel',
    keyHint: 'Google Cloud API-Schlüssel'
  },
  claude: {
    name: 'Anthropic Claude',
    models: ['claude-2', 'claude-instant'],
    defaultEndpoint: 'https://api.anthropic.com/v1/messages',
    keyPlaceholder: 'sk-...',
    keyHint: 'Anthropic API-Schlüssel beginnt mit "sk-"'
  },
  llama: {
    name: 'Meta Llama 2',
    models: ['llama-2-70b', 'llama-2-13b', 'llama-2-7b'],
    defaultEndpoint: 'http://localhost:8080/completion',
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
const largeTextToggle = document.getElementById('large-text');
const saveButton = document.querySelector('.save-button');
const statusDiv = document.getElementById('status');

// Load saved settings
chrome.storage.sync.get(
  {
    provider: 'gpt4',
    model: '',
    apiKey: '',
    apiEndpoint: '',
    textSize: 'normal'
  },
  (items) => {
    providerSelect.value = items.provider;
    apiKeyInput.value = items.apiKey;
    apiEndpointInput.value = items.apiEndpoint;
    document.querySelector(`input[name="text-size"][value="${items.textSize}"]`).checked = true;
    updateProviderUI(items.provider, items.model);
  }
);

// Update UI based on selected provider
function updateProviderUI(provider, selectedModel = '') {
  const config = PROVIDERS[provider];
  
  // Update API key field
  apiKeyInput.placeholder = config.keyPlaceholder;
  apiHint.textContent = config.keyHint;

  // Update endpoint field
  apiEndpointInput.placeholder = config.defaultEndpoint;
  
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
    textSize: document.querySelector('input[name="text-size"]:checked').value
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
          apiEndpoint: settings.apiEndpoint || PROVIDERS[settings.provider].defaultEndpoint
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
          
          // Update text size
          await chrome.tabs.sendMessage(activeTab.id, {
            action: 'updateTextSize',
            textSize: settings.textSize
          });
        } catch (err) {
          // Log but don't throw error for script injection issues
          console.warn('Could not update text size:', err);
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
providerSelect.addEventListener('change', () => {
  updateProviderUI(providerSelect.value);
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
