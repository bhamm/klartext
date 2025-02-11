import '@testing-library/jest-dom';
import { TranslationOverlay, overlayInstance } from '../../src/content/content';

describe('TranslationOverlay', () => {
  let overlay;
  let container;

  beforeEach(async () => {
    // Reset DOM and overlayInstance
    document.body.innerHTML = '';
    jest.resetModules();
    
    // Import fresh instance of content script
    const module = await import('../../src/content/content.js');
    const { TranslationOverlay, overlayInstance } = module;
    
    // Reset overlayInstance
    global.overlayInstance = null;
    
    // Create new overlay instance
    overlay = new TranslationOverlay();
    
    // Wait for any async operations
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  afterEach(() => {
    // Cleanup
    document.body.innerHTML = '';
    jest.clearAllMocks();
    
    // Reset overlayInstance
    global.overlayInstance = null;
    
    // Reset chrome API mocks
    chrome.storage.sync.get.mockReset();
    chrome.runtime.getManifest.mockReset();
    chrome.runtime.sendMessage.mockReset();
  });

  describe('initialization', () => {
    it('should create a singleton instance', () => {
      const secondOverlay = new TranslationOverlay();
      
      // Verify instance references
      expect(secondOverlay).toBe(overlayInstance);
      expect(overlayInstance).toEqual(overlay);
      
      // Verify DOM elements are the same
      const overlayElement = document.querySelector('.klartext-overlay');
      const contentElement = document.querySelector('.klartext-content');
      const closeButton = document.querySelector('.klartext-close');
      
      expect(overlayElement).toBe(overlay.overlay);
      expect(contentElement).toBe(overlay.content);
      expect(closeButton).toBe(overlay.closeButton);
      
      // Verify instance properties
      expect(Object.keys(secondOverlay)).toEqual(['overlay', 'content', 'closeButton']);
      expect(Object.keys(overlayInstance)).toEqual(['overlay', 'content', 'closeButton']);
    });

    it('should create overlay with correct attributes', async () => {
      // Wait for DOM updates
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const overlayElement = document.querySelector('.klartext-overlay');
      expect(overlayElement).toBeInTheDocument();
      expect(overlayElement).toHaveAttribute('role', 'dialog');
      expect(overlayElement).toHaveAttribute('aria-label', 'Leichte Sprache Übersetzung');
      expect(overlayElement).toHaveAttribute('tabindex', '-1');
    });

    it('should create close button with correct attributes', () => {
      const closeButton = document.querySelector('.klartext-close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Schließen');
    });
  });

  describe('show method', () => {
    it('should display translation in overlay', () => {
      const testTranslation = 'Test translation';
      overlay.show(testTranslation);

      const translationElement = document.querySelector('.klartext-translation');
      expect(translationElement).toBeInTheDocument();
      expect(translationElement).toHaveTextContent(testTranslation);
    });

    it('should show feedback button', () => {
      overlay.show('Test translation');

      const feedbackButton = document.querySelector('.klartext-feedback');
      expect(feedbackButton).toBeInTheDocument();
      expect(feedbackButton).toHaveTextContent('Feedback geben');
    });

    it('should make overlay visible', () => {
      overlay.show('Test translation');
      const overlayElement = document.querySelector('.klartext-overlay');
      expect(overlayElement).toHaveClass('visible');
    });
  });

  describe('hide method', () => {
    beforeEach(() => {
      overlay.show('Test translation');
    });

    it('should hide overlay', () => {
      overlay.hide();
      const overlayElement = document.querySelector('.klartext-overlay');
      expect(overlayElement).not.toHaveClass('visible');
    });
  });

  describe('error handling', () => {
    it('should show error message', () => {
      const errorMessage = 'Test error';
      overlay.showError(errorMessage);

      const errorElement = document.querySelector('.klartext-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(errorMessage);
    });
  });

  describe('event handling', () => {
    beforeEach(() => {
      overlay.show('Test translation');
    });

    it('should close on escape key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      const overlayElement = document.querySelector('.klartext-overlay');
      expect(overlayElement).not.toHaveClass('visible');
    });

    it('should close on outside click', () => {
      const overlayElement = document.querySelector('.klartext-overlay');
      overlayElement.click();

      expect(overlayElement).not.toHaveClass('visible');
    });

    it('should not close on content click', () => {
      const contentElement = document.querySelector('.klartext-content');
      contentElement.click();

      const overlayElement = document.querySelector('.klartext-overlay');
      expect(overlayElement).toHaveClass('visible');
    });

    it('should open GitHub issue on feedback click', async () => {
      // Setup mocks
      const windowSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ provider: 'test-provider', model: 'test-model' });
      });
      chrome.runtime.getManifest.mockReturnValue({
        name: 'Klartext',
        version: '1.0.0'
      });

      try {
        // Show overlay
        overlay.show('Test translation');
        await new Promise(resolve => setTimeout(resolve, 0));

        // Find and click feedback button
        const feedbackButton = document.querySelector('.klartext-feedback');
        expect(feedbackButton).toBeInTheDocument();
        
        await feedbackButton.click();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Verify GitHub issue URL
        expect(windowSpy).toHaveBeenCalledWith(
          expect.stringContaining('https://github.com/borishamm/klartext/issues/new'),
          '_blank'
        );
      } finally {
        windowSpy.mockRestore();
      }
    });
  });
});
