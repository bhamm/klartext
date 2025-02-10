// DOM Elements
const gpt4KeyInput = document.getElementById('gpt4-key');
const geminiKeyInput = document.getElementById('gemini-key');
const largeTextToggle = document.getElementById('large-text');
const saveButton = document.querySelector('.save-button');
const statusDiv = document.getElementById('status');

// Load saved settings
chrome.storage.sync.get(
  {
    gpt4Key: '',
    geminiKey: '',
    largeText: false
  },
  (items) => {
    gpt4KeyInput.value = items.gpt4Key;
    geminiKeyInput.value = items.geminiKey;
    largeTextToggle.checked = items.largeText;
  }
);

// Save settings
async function saveSettings() {
  const settings = {
    gpt4Key: gpt4KeyInput.value.trim(),
    geminiKey: geminiKeyInput.value.trim(),
    largeText: largeTextToggle.checked
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

    // Update API endpoints in background script
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'updateApiKeys',
        gpt4Key: settings.gpt4Key,
        geminiKey: settings.geminiKey
      }, resolve);
    });

    if (response && response.success) {
    // Update text size in all tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        // Inject content script first
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/content.js']
        });
        
        // Then send the message
        await chrome.tabs.sendMessage(tab.id, {
          action: 'updateTextSize',
          largeText: settings.largeText
        });
      } catch (err) {
        // Ignore errors for tabs where we can't inject scripts (e.g., chrome:// pages)
        console.warn(`Could not update text size for tab ${tab.id}:`, err);
      }
    }

      showStatus('Einstellungen gespeichert', 'success');
    } else {
      throw new Error(response?.error || 'Failed to update API keys');
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
  const gpt4Key = gpt4KeyInput.value.trim();
  const geminiKey = geminiKeyInput.value.trim();
  
  // At least one API key must be provided
  if (!gpt4Key && !geminiKey) {
    showStatus('Mindestens ein API-Schlüssel wird benötigt', 'error');
    return false;
  }

  // Validate GPT-4 key format if provided
  if (gpt4Key && !gpt4Key.startsWith('sk-')) {
    showStatus('Ungültiger GPT-4 API-Schlüssel Format', 'error');
    return false;
  }

  // Basic length check for Gemini key if provided
  if (geminiKey && geminiKey.length < 20) {
    showStatus('Ungültiger Gemini API-Schlüssel Format', 'error');
    return false;
  }

  return true;
}

// Event Listeners
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
[gpt4KeyInput, geminiKeyInput].forEach(input => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && validateInputs()) {
      saveSettings();
    }
  });
});

// Apply text size immediately when toggled
largeTextToggle.addEventListener('change', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      // Ensure content script is loaded
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/content.js']
      });
      
      // Send message to update text size
      await chrome.tabs.sendMessage(tab.id, {
        action: 'updateTextSize',
        largeText: largeTextToggle.checked
      });
    }
  } catch (error) {
    console.warn('Could not update text size for current tab:', error);
  }
});

// Handle errors
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'showError') {
    showStatus(message.error, 'error');
  }
});

// Secure input handling
function sanitizeInput(input) {
  return input.replace(/[<>]/g, '');
}

gpt4KeyInput.addEventListener('input', (e) => {
  e.target.value = sanitizeInput(e.target.value);
});

geminiKeyInput.addEventListener('input', (e) => {
  e.target.value = sanitizeInput(e.target.value);
});
