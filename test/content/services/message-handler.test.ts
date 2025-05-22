import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { initMessageHandler, startArticleMode, stopArticleMode } from '../../../src/content/services/message-handler';
import { ContentMessage } from '../../../src/content/types';
import { ARTICLE_SELECTORS } from '../../../src/content/constants';

// Mock dependencies
jest.mock('../../../src/content/ui/translation-overlay', () => ({
  translationOverlay: {
    show: jest.fn(),
    showLoading: jest.fn(),
    showError: jest.fn(),
    hide: jest.fn()
  }
}));

jest.mock('../../../src/content/ui/translation-controls', () => ({
  translationControls: {
    show: jest.fn(),
    hide: jest.fn()
  }
}));

jest.mock('../../../src/content/utils/dom-utils', () => ({
  findClosestMatchingElement: jest.fn(),
  cleanArticleHTML: jest.fn().mockReturnValue('<p>Test content</p>')
}));

jest.mock('../../../src/content/utils/html-cleaner', () => ({
  cleanArticleHTML: jest.fn((html) => html)
}));

// Import mocked modules
import { translationOverlay } from '../../../src/content/ui/translation-overlay';
import { findClosestMatchingElement } from '../../../src/content/utils/dom-utils';

describe('Message Handler', () => {
  let addListenerSpy: jest.SpyInstance<any>;
  let sendMessageSpy: jest.SpyInstance<any>;
  let mockElement: HTMLElement;
  let mockHighlightElement: HTMLElement;
  
  beforeEach(() => {
    // Setup DOM
    document.body = document.createElement('body');
    
    // Create mock elements
    mockElement = document.createElement('div');
    mockHighlightElement = document.createElement('div');
    document.body.appendChild(mockElement);
    document.body.appendChild(mockHighlightElement);
    
    // Setup spies
    addListenerSpy = jest.spyOn(global.chrome.runtime.onMessage, 'addListener');
    sendMessageSpy = jest.spyOn(global.chrome.runtime, 'sendMessage');
    
    // Mock document.elementFromPoint
    document.elementFromPoint = jest.fn().mockReturnValue(mockElement) as any;
    
    // Mock findClosestMatchingElement
    (findClosestMatchingElement as jest.Mock).mockReturnValue(mockHighlightElement);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    
    // Reset module state by re-initializing
    stopArticleMode();
  });
  
  describe('initMessageHandler', () => {
    test('should add message listener on initialization', () => {
      initMessageHandler();
      expect(addListenerSpy).toHaveBeenCalled();
    });
  });
  
  describe('handleMessage', () => {
    let handleMessage: (message: ContentMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => boolean;
    
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Initialize to get the handleMessage function
      initMessageHandler();
      
      // Extract the handleMessage function from the addListener call
      handleMessage = addListenerSpy.mock.calls[0][0];
    });
    
    test('should handle ping message and respond', () => {
      const sendResponse = jest.fn();
      const result = handleMessage({ action: 'ping' }, {} as chrome.runtime.MessageSender, sendResponse);
      
      expect(sendResponse).toHaveBeenCalledWith({ status: 'ok' });
      expect(result).toBe(false); // No async response
    });
    
    test('should handle startArticleMode message', () => {
      const sendResponse = jest.fn();
      const startArticleModeSpy = jest.spyOn(document, 'addEventListener');
      
      handleMessage({ action: 'startArticleMode' }, {} as chrome.runtime.MessageSender, sendResponse);
      
      // We expect addEventListener to be called at least once
      expect(startArticleModeSpy).toHaveBeenCalled();
      expect(document.body.style.cursor).toBe('pointer');
    });
    
    
    test('should handle startTranslation message in article mode', () => {
      const sendResponse = jest.fn();
      
      // Reset the mocks to ensure clean state
      (translationOverlay.showLoading as jest.Mock).mockClear();
      
      handleMessage({ action: 'startTranslation' }, {} as chrome.runtime.MessageSender, sendResponse);
      
      // Check if showLoading was called
      expect(translationOverlay.showLoading).toHaveBeenCalled();
    });
    
    
    test('should handle showTranslation message in article mode', () => {
      const sendResponse = jest.fn();
      const translation = '<p>Translated text</p>';
      
      handleMessage({ action: 'showTranslation', translation }, {} as chrome.runtime.MessageSender, sendResponse);
      
      expect(translationOverlay.show).toHaveBeenCalledWith(translation);
    });
    
    
    test('should handle showError message in article mode', () => {
      const sendResponse = jest.fn();
      const error = 'Error message';
      
      // Reset the mocks to ensure clean state
      (translationOverlay.showError as jest.Mock).mockClear();
      
      handleMessage({ action: 'showError', error }, {} as chrome.runtime.MessageSender, sendResponse);
      
      expect(translationOverlay.showError).toHaveBeenCalledWith(error);
    });
    
    
    test('should handle updateSettings message', () => {
      const sendResponse = jest.fn();
      const settings = { textSize: 'gross' as const };
      
      handleMessage({ action: 'updateSettings', settings }, {} as chrome.runtime.MessageSender, sendResponse);
      
      expect(document.body.classList.contains('klartext-text-gross')).toBe(true);
    });
    
    test('should handle unknown message action', () => {
      const sendResponse = jest.fn();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      handleMessage({ action: 'unknown' as any }, {} as chrome.runtime.MessageSender, sendResponse);
      
      expect(consoleSpy).toHaveBeenCalledWith('Unknown message action:', 'unknown');
    });
    
    test('should catch and log errors', () => {
      const sendResponse = jest.fn();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Force an error
      (translationOverlay.showLoading as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });
      
      handleMessage({ action: 'startTranslation' }, {} as chrome.runtime.MessageSender, sendResponse);
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
  
  describe('startArticleMode', () => {
    test('should add event listeners and change cursor', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      startArticleMode();
      
      // Check that addEventListener was called at least once
      expect(addEventListenerSpy).toHaveBeenCalled();
      expect(document.body.style.cursor).toBe('pointer');
    });
  });
  
  describe('stopArticleMode', () => {
    test('should remove event listeners and reset cursor', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      // First start article mode
      startArticleMode();
      
      // Then stop it
      stopArticleMode();
      
      // Check that removeEventListener was called at least once
      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(document.body.style.cursor).toBe('');
    });
    
    test('should remove highlight from current element', () => {
      // First start article mode
      startArticleMode();
      
      // Trigger mousemove to set currentHighlight
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100
      });
      document.dispatchEvent(mouseMoveEvent);
      
      // Then stop article mode
      stopArticleMode();
      
      expect(mockHighlightElement.classList.contains('klartext-highlight')).toBe(false);
    });
  });
  
  describe('handleMouseMove', () => {
    test('should highlight element under cursor', () => {
      // Start article mode
      startArticleMode();
      
      // Trigger mousemove
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100
      });
      document.dispatchEvent(mouseMoveEvent);
      
      expect(document.elementFromPoint).toHaveBeenCalledWith(100, 100);
      expect(findClosestMatchingElement).toHaveBeenCalledWith(mockElement, ARTICLE_SELECTORS);
      expect(mockHighlightElement.classList.contains('klartext-highlight')).toBe(true);
    });
    
    test('should remove highlight from previous element', () => {
      // Start article mode
      startArticleMode();
      
      // First mousemove
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));
      
      // Change the return value for the second mousemove
      const newElement = document.createElement('div');
      (findClosestMatchingElement as jest.Mock).mockReturnValue(newElement);
      
      // Second mousemove
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }));
      
      expect(mockHighlightElement.classList.contains('klartext-highlight')).toBe(false);
      expect(newElement.classList.contains('klartext-highlight')).toBe(true);
    });
  });
  
  describe('handleArticleClick', () => {
    test('should not send request if no highlight or empty content', () => {
      // Start article mode
      startArticleMode();
      
      // Don't trigger mousemove, so no currentHighlight
      
      // Trigger click
      document.dispatchEvent(new MouseEvent('click'));
      
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });
  });
  
});
