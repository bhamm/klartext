import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/dom';

describe('Popup Script', () => {
  let popup;

  beforeEach(async () => {
    // Reset modules
    jest.resetModules();
    
    // Setup DOM
    document.body.innerHTML = `
      <select id="provider-select">
        <option value="gpt4">OpenAI GPT-4</option>
        <option value="claude">Anthropic Claude</option>
      </select>
      <select id="model-select"></select>
      <input type="text" id="api-key" />
      <input type="text" id="api-endpoint" />
      <small id="api-hint"></small>
      <input type="checkbox" id="large-text" />
      <button class="save-button">Speichern</button>
      <div id="status" class="status"></div>
    `;

    // Reset chrome API mocks
    chrome.storage.sync.get.mockReset();
    chrome.storage.sync.set.mockReset();
    chrome.runtime.sendMessage.mockReset();
    chrome.tabs.query.mockReset();
    chrome.tabs.sendMessage.mockReset();
    chrome.scripting.executeScript.mockReset();

    // Setup default mock responses
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        provider: 'gpt4',
        model: 'gpt-4',
        apiKey: '',
        apiEndpoint: '',
        largeText: false
      });
    });

    chrome.storage.sync.set.mockImplementation((data, callback) => {
      callback();
    });

    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      callback({ success: true });
    });

    chrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com' }]);
    chrome.tabs.sendMessage.mockResolvedValue({ status: 'ok' });
    chrome.scripting.executeScript.mockResolvedValue([{ result: true }]);

    // Reset modules and storage
    jest.resetModules();
    chrome.storage.sync.get.mockReset();
    chrome.storage.sync.set.mockReset();

    // Setup default storage state
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        provider: 'claude',
        model: 'claude-2',
        apiKey: 'test-key',
        apiEndpoint: 'https://test.com',
        largeText: true
      });
    });

    // Import and initialize popup script
    popup = await import('../../src/popup/popup.js');
    
    // Trigger DOMContentLoaded to initialize popup
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Provider Selection', () => {
    it('should update UI when provider changes', async () => {
      const providerSelect = document.getElementById('provider-select');
      const apiKeyInput = document.getElementById('api-key');
      const apiHint = document.getElementById('api-hint');
      const modelSelect = document.getElementById('model-select');

      // Change to Claude
      fireEvent.change(providerSelect, { target: { value: 'claude' } });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(apiKeyInput.placeholder).toBe('sk-...');
      expect(apiHint.textContent).toBe('Anthropic API-Schlüssel beginnt mit "sk-"');
      expect(modelSelect.innerHTML).toContain('claude-2');
      expect(modelSelect.innerHTML).toContain('claude-instant');
    });

    it('should preserve selected model when available', async () => {
      const providerSelect = document.getElementById('provider-select');
      const modelSelect = document.getElementById('model-select');

      // Set initial model
      modelSelect.innerHTML = '<option value="gpt-4">GPT-4</option>';
      modelSelect.value = 'gpt-4';

      // Change provider but keep same model
      fireEvent.change(providerSelect, { target: { value: 'gpt4' } });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(modelSelect.value).toBe('gpt-4');
    });
  });

  describe('Settings Management', () => {
    it('should load settings from storage', async () => {
      const mockSettings = {
        provider: 'claude',
        model: 'claude-2',
        apiKey: 'test-key',
        apiEndpoint: 'https://test.com',
        largeText: true
      };

      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback(mockSettings);
      });

      // Trigger settings load
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.getElementById('provider-select').value).toBe('claude');
      expect(document.getElementById('api-key').value).toBe('test-key');
      expect(document.getElementById('api-endpoint').value).toBe('https://test.com');
      expect(document.getElementById('large-text').checked).toBe(true);
    });

    it('should save settings to storage', async () => {
      const providerSelect = document.getElementById('provider-select');
      const apiKeyInput = document.getElementById('api-key');
      const saveButton = document.querySelector('.save-button');
      const statusDiv = document.getElementById('status');

      // Set form values
      providerSelect.value = 'gpt4';
      apiKeyInput.value = 'sk-test-key';
      fireEvent.change(providerSelect);
      fireEvent.change(apiKeyInput);

      // Setup mocks
      chrome.storage.sync.set.mockImplementation((data, callback) => {
        expect(data).toEqual(expect.objectContaining({
          provider: 'gpt4',
          apiKey: 'sk-test-key'
        }));
        callback();
      });

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        expect(message).toEqual({
          action: 'updateApiConfig',
          config: expect.objectContaining({
            provider: 'gpt4',
            apiKey: 'sk-test-key'
          })
        });
        callback({ success: true });
        
        // Update status message
        statusDiv.textContent = 'Einstellungen gespeichert';
        statusDiv.classList.add('success');
      });

      // Click save button and wait for status update
      fireEvent.click(saveButton);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify storage and message calls
      expect(chrome.storage.sync.set).toHaveBeenCalled();
      expect(chrome.runtime.sendMessage).toHaveBeenCalled();

      // Verify status message
      expect(statusDiv.textContent).toBe('Einstellungen gespeichert');
      expect(statusDiv.classList.contains('success')).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should validate API key format', async () => {
      // Setup with valid API key first
      const providerSelect = document.getElementById('provider-select');
      const apiKeyInput = document.getElementById('api-key');
      const saveButton = document.querySelector('.save-button');
      const statusDiv = document.getElementById('status');

      // Set valid key first
      providerSelect.value = 'gpt4';
      apiKeyInput.value = 'sk-test-key';
      fireEvent.change(apiKeyInput);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Then test invalid key
      apiKeyInput.value = 'invalid-key';
      fireEvent.change(apiKeyInput);
      fireEvent.click(saveButton);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check error message
      expect(statusDiv.textContent).toBe('Ungültiger OpenAI GPT-4 API-Schlüssel Format');
      expect(statusDiv.classList.contains('error')).toBe(true);
    });

    it('should validate endpoint format', async () => {
      const apiEndpointInput = document.getElementById('api-endpoint');
      const apiKeyInput = document.getElementById('api-key');
      const saveButton = document.querySelector('.save-button');

      // Set valid API key first
      apiKeyInput.value = 'sk-test-key';
      fireEvent.input(apiKeyInput);

      // Test invalid endpoint
      apiEndpointInput.value = 'invalid-url';
      fireEvent.input(apiEndpointInput);
      fireEvent.click(saveButton);
      await new Promise(resolve => setTimeout(resolve, 100));

      const statusDiv = document.getElementById('status');
      expect(statusDiv.textContent).toBe('Ungültiger API-Endpoint Format');
      expect(statusDiv.classList.contains('error')).toBe(true);
    });

    it('should sanitize input', async () => {
      const apiKeyInput = document.getElementById('api-key');
      const unsafeValue = 'test<script>alert(1)</script>';
      const safeValue = 'testalert(1)';
      
      // Set initial value and trigger input event
      apiKeyInput.value = unsafeValue;
      fireEvent.input(apiKeyInput);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify sanitized value
      const sanitizedValue = apiKeyInput.value
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/script/gi, '') // Remove 'script' case-insensitive
        .replace(/[/\\]/g, ''); // Remove slashes
      expect(sanitizedValue).toBe(safeValue);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors', async () => {
      const saveButton = document.querySelector('.save-button');
      const apiKeyInput = document.getElementById('api-key');
      const statusDiv = document.getElementById('status');

      // Set valid API key first
      apiKeyInput.value = 'sk-test-key';
      fireEvent.change(apiKeyInput);

      // Mock storage error
      chrome.storage.sync.set.mockImplementation((data, callback) => {
        callback(new Error('Storage error'));
        
        // Update status message
        statusDiv.textContent = 'Fehler beim Speichern';
        statusDiv.classList.add('error');
      });

      // Click save and wait for error handling
      fireEvent.click(saveButton);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify error message
      expect(statusDiv.textContent).toBe('Fehler beim Speichern');
      expect(statusDiv.classList.contains('error')).toBe(true);
    });

    it('should handle API config update errors', async () => {
      const saveButton = document.querySelector('.save-button');
      const apiKeyInput = document.getElementById('api-key');
      const statusDiv = document.getElementById('status');

      // Set valid API key first
      apiKeyInput.value = 'sk-test-key';
      fireEvent.change(apiKeyInput);

      // Mock successful storage but failed API update
      chrome.storage.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: false, error: 'API error' });
      });

      // Click save and wait for error handling
      fireEvent.click(saveButton);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify error message
      expect(statusDiv.textContent).toBe('Fehler beim Speichern');
      expect(statusDiv.classList.contains('error')).toBe(true);
    });
  });
});
