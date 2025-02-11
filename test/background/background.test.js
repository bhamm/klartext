import '@testing-library/jest-dom';
import { chrome } from 'jest-chrome';

// Mock fetch
global.fetch = jest.fn();

describe('Background Script', () => {
  let background;
  let installedListener;
  let clickedListener;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    chrome.runtime.lastError = { message: '' };

    // Reset fetch mock
    global.fetch.mockReset();

    // Reset chrome API mocks
    chrome.storage.sync.get.mockClear();
    chrome.storage.sync.set.mockClear();
    chrome.contextMenus.create = jest.fn((options, callback) => {
      if (callback) callback();
    });
    chrome.contextMenus.removeAll = jest.fn((callback) => {
      if (callback) callback();
    });
    chrome.tabs.sendMessage.mockClear();

    // Setup event listeners
    chrome.runtime.onInstalled = {
      addListener: jest.fn((listener) => {
        installedListener = listener;
      })
    };

    chrome.contextMenus.onClicked = {
      addListener: jest.fn((listener) => {
        clickedListener = listener;
      })
    };

    // Import background script and get exports
    const module = await import('../../src/background/background.js');
    background = {
      PROVIDERS: module.PROVIDERS,
      MENU_ITEM_ID: module.MENU_ITEM_ID,
      translationCache: module.translationCache
    };
  });

  describe('API Configuration', () => {
    it('should load API keys from storage on startup', () => {
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(
        ['provider', 'model', 'apiKey', 'apiEndpoint'],
        expect.any(Function)
      );
    });

    it('should update API configuration on message', () => {
      const message = {
        action: 'updateApiConfig',
        config: {
          provider: 'claude',
          model: 'claude-2',
          apiKey: 'test-key',
          apiEndpoint: 'https://api.test.com'
        }
      };
      const sendResponse = jest.fn();

      chrome.runtime.onMessage.callListeners(message, {}, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Translation Providers', () => {
    const testText = 'Test German text';
    const mockTranslation = 'Translated text';

    describe('GPT-4 Provider', () => {
      beforeEach(() => {
        global.fetch.mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              choices: [{ message: { content: mockTranslation } }]
            })
          })
        );
      });

      it('should translate text using GPT-4', async () => {
        const translation = await background.PROVIDERS.gpt4.translate(testText, {
          apiKey: 'test-key',
          model: 'gpt-4',
          apiEndpoint: 'https://api.openai.com/v1/chat/completions'
        });

        expect(translation).toBe(mockTranslation);
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-key'
            })
          })
        );
      });
    });

    describe('Claude Provider', () => {
      beforeEach(() => {
        global.fetch.mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              content: [{ text: mockTranslation }]
            })
          })
        );
      });

      it('should translate text using Claude', async () => {
        const translation = await background.PROVIDERS.claude.translate(testText, {
          apiKey: 'test-key',
          model: 'claude-2',
          apiEndpoint: 'https://api.anthropic.com/v1/messages'
        });

        expect(translation).toBe(mockTranslation);
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'x-api-key': 'test-key'
            })
          })
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle API errors', async () => {
        global.fetch.mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
              error: { message: 'API Error' }
            })
          })
        );

        await expect(background.PROVIDERS.gpt4.translate(testText, {
          apiKey: 'test-key',
          model: 'gpt-4',
          apiEndpoint: 'https://api.openai.com/v1/chat/completions'
        })).rejects.toThrow('GPT-4 API error: API Error');
      });

      it('should handle network errors', async () => {
        global.fetch.mockImplementationOnce(() =>
          Promise.reject(new Error('Network Error'))
        );

        await expect(background.PROVIDERS.claude.translate(testText, {
          apiKey: 'test-key',
          model: 'claude-2',
          apiEndpoint: 'https://api.anthropic.com/v1/messages'
        })).rejects.toThrow();
      });
    });
  });

  describe('Context Menu', () => {
    it('should create context menu on installation', () => {
      // Call the installed listener
      installedListener();

      expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
      expect(chrome.contextMenus.create).toHaveBeenCalledWith({
        id: 'translate-to-leichte-sprache',
        title: 'In Leichte Sprache übersetzen',
        contexts: ['selection']
      }, expect.any(Function));
    });

    it('should handle context menu clicks', async () => {
      const info = {
        menuItemId: 'translate-to-leichte-sprache',
        selectionText: 'Test text'
      };
      const tab = { id: 1 };

      // Call the click listener
      clickedListener(info, tab);

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        tab.id,
        expect.objectContaining({ action: 'ping' }),
        expect.any(Function)
      );
    });
  });

  describe('Translation Cache', () => {
    it('should return cached translations', async () => {
      const testText = 'Test text';
      const mockTranslation = 'Cached translation';

      // Perform initial translation
      background.translationCache.set(testText, mockTranslation);

      // Get translation from cache
      const cachedTranslation = background.translationCache.get(testText);
      expect(cachedTranslation).toBe(mockTranslation);
    });

    it('should limit cache size', async () => {
      // Fill cache beyond limit
      for (let i = 0; i < 1100; i++) {
        background.translationCache.set(`text${i}`, `translation${i}`);
        // Allow cache operations to complete
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      expect(background.translationCache.size).toBe(1000);
    });
  });
});
