import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { pageTranslator, PageTranslator } from '../../../src/content/controllers/page-controller';
import { TranslationControls } from '../../../src/content/ui/translation-controls';


// Mock dependencies
jest.mock('../../../src/content/ui/translation-controls', () => ({
  translationControls: {
    updateProgress: jest.fn(),
    setupTTS: jest.fn(),
    show: jest.fn(),
    hide: jest.fn()
  }
}));

// Mock chrome API
const mockSendMessage = jest.fn();
global.chrome.runtime.sendMessage = mockSendMessage;

describe.skip('PageTranslator', () => {
  let translator: PageTranslator;
  
  beforeEach(() => {
    // Reset singleton instance before each test
    PageTranslator.resetInstance();
    
    // Setup DOM
    document.body.innerHTML = `
      <article>
        <h1>Test Title</h1>
        <p>First paragraph</p>
        <p>Second paragraph</p>
      </article>
      <div class="sidebar">Sidebar content</div>
    `;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test instance
    translator = PageTranslator.getInstance();
  });
  
  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
  });
  
  describe.skip('setControls', () => {
    test('should set controls reference', () => {
      const mockControls = {
        container: null,
        progressBar: null,
        progressText: null,
        viewToggle: null,
        ttsButton: null,
        minimizeButton: null,
        isMinimized: false,
        updateProgress: jest.fn(),
        setupControls: jest.fn(),
        setupTTS: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
        toggleMinimize: jest.fn(),
        toggleView: jest.fn()
      };
      
      translator.setControls(mockControls);
      expect(translator.controls).toBe(mockControls);
    });
  });
  
  describe.skip('initialize', () => {
    test('should identify content sections', async () => {
      const mockControls = {
        container: null,
        progressBar: null,
        progressText: null,
        viewToggle: null,
        ttsButton: null,
        minimizeButton: null,
        isMinimized: false,
        updateProgress: jest.fn(),
        setupControls: jest.fn(),
        setupTTS: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
        toggleMinimize: jest.fn(),
        toggleView: jest.fn()
      };
      
      translator.setControls(mockControls);
      await translator.initialize();
      
      expect(translator.sections.length).toBeGreaterThan(0);
      expect(translator.currentSection).toBe(0);
    });
  });

  describe.skip('getContentSections', () => {
    test('should find paragraphs and headings', () => {
      const sections = translator.getContentSections();
      
      expect(sections.length).toBeGreaterThan(0);
      
      // Check if sections include paragraphs and headings
      const hasParagraph = sections.some(section => 
        section.originalSection.tagName === 'P'
      );
      const hasHeading = sections.some(section => 
        section.originalSection.tagName === 'H1'
      );
      
      expect(hasParagraph).toBe(true);
      expect(hasHeading).toBe(true);
    });
    
    test('should exclude sidebar content', () => {
      const sections = translator.getContentSections();
      
      // Check if sections exclude sidebar
      const hasSidebar = sections.some(section => 
        section.originalSection.closest('.sidebar')
      );
      
      expect(hasSidebar).toBe(false);
    });
    
    test('should extract text content from sections', () => {
      const sections = translator.getContentSections();
      
      // Check if content is extracted
      expect(sections[0].content).toBeTruthy();
      
      // Check specific content
      const titleSection = sections.find(section => 
        section.originalSection.tagName === 'H1'
      );
      expect(titleSection?.content).toContain('Test Title');
    });
  });
  
  describe.skip('translateNextSection', () => {
    test('should send message to translate next section', async () => {
      const mockControls = {
        container: null,
        progressBar: null,
        progressText: null,
        viewToggle: null,
        ttsButton: null,
        minimizeButton: null,
        isMinimized: false,
        updateProgress: jest.fn(),
        setupControls: jest.fn(),
        setupTTS: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
        toggleMinimize: jest.fn(),
        toggleView: jest.fn()
      };
      
      translator.setControls(mockControls);
      
      // Setup sections
      translator.sections = [
        {
          originalSection: document.querySelector('h1') as HTMLElement,
          content: 'Test Title'
        },
        {
          originalSection: document.querySelector('p') as HTMLElement,
          content: 'First paragraph'
        }
      ];
      translator.currentSection = 0;
      
      // Mock sendMessage to simulate response
      mockSendMessage.mockImplementation((message, callback) => {
        if (message.action === 'translateSection') {
          setTimeout(() => {
            callback({
              translation: '<p>Translated content</p>',
              id: message.id
            });
          }, 10);
        }
      });
      
      await translator.translateNextSection();
      
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'translateSection',
          html: 'Test Title'
        }),
        expect.any(Function)
      );
      
      // Should increment current section
      expect(translator.currentSection).toBe(1);
    });
    
    test('should update progress', async () => {
      const mockControls = {
        container: null,
        progressBar: null,
        progressText: null,
        viewToggle: null,
        ttsButton: null,
        minimizeButton: null,
        isMinimized: false,
        updateProgress: jest.fn(),
        setupControls: jest.fn(),
        setupTTS: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
        toggleMinimize: jest.fn(),
        toggleView: jest.fn()
      };
      
      translator.setControls(mockControls);
      
      // Setup sections
      translator.sections = [
        {
          originalSection: document.querySelector('h1') as HTMLElement,
          content: 'Test Title'
        },
        {
          originalSection: document.querySelector('p') as HTMLElement,
          content: 'First paragraph'
        }
      ];
      translator.currentSection = 0;
      
      // Mock sendMessage
      mockSendMessage.mockImplementation((message, callback) => {
        if (message.action === 'translateSection') {
          setTimeout(() => {
            callback({
              translation: '<p>Translated content</p>',
              id: message.id
            });
          }, 10);
        }
      });
      
      await translator.translateNextSection();
      
      expect(mockControls.updateProgress).toHaveBeenCalledWith(1, 2);
    });
    
    test('should call completeTranslation when all sections are translated', async () => {
      const mockControls = {
        container: null,
        progressBar: null,
        progressText: null,
        viewToggle: null,
        ttsButton: null,
        minimizeButton: null,
        isMinimized: false,
        updateProgress: jest.fn(),
        setupControls: jest.fn(),
        setupTTS: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
        toggleMinimize: jest.fn(),
        toggleView: jest.fn()
      };
      
      translator.setControls(mockControls);
      
      // Setup sections with only one section
      translator.sections = [
        {
          originalSection: document.querySelector('h1') as HTMLElement,
          content: 'Test Title'
        }
      ];
      translator.currentSection = 0;
      
      // Spy on completeTranslation
      const completeSpy = jest.spyOn(translator, 'completeTranslation');
      
      // Mock sendMessage
      mockSendMessage.mockImplementation((message, callback) => {
        if (message.action === 'translateSection') {
          setTimeout(() => {
            callback({
              translation: '<p>Translated content</p>',
              id: message.id
            });
          }, 10);
        }
      });
      
      await translator.translateNextSection();
      
      expect(completeSpy).toHaveBeenCalled();
    });
  });
  
  describe.skip('appendTranslation', () => {
    test('should create translation container next to original section', () => {
      const mockControls = {
        container: null,
        progressBar: null,
        progressText: null,
        viewToggle: null,
        ttsButton: null,
        minimizeButton: null,
        isMinimized: false,
        updateProgress: jest.fn(),
        setupControls: jest.fn(),
        setupTTS: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
        toggleMinimize: jest.fn(),
        toggleView: jest.fn()
      };
      
      translator.setControls(mockControls);
      
      // Setup sections
      const originalSection = document.querySelector('p') as HTMLElement;
      translator.sections = [
        {
          originalSection,
          content: 'First paragraph'
        }
      ];
      
      const translation = '<p>Translated paragraph</p>';
      const id = 'section-0';
      
      translator.appendTranslation(translation, id);
      
      // Check if translation container is created
      const container = document.querySelector('.klartext-translation-container');
      expect(container).not.toBeNull();
      
      // Check if translation is inserted
      const translationElement = document.querySelector('.klartext-translation');
      expect(translationElement).not.toBeNull();
      expect(translationElement?.innerHTML).toContain('Translated paragraph');
      
      // Check if original section has the correct class
      expect(originalSection.classList.contains('klartext-original')).toBe(true);
    });
    
    test('should handle invalid section ID', () => {
      const mockControls = {
        container: null,
        progressBar: null,
        progressText: null,
        viewToggle: null,
        ttsButton: null,
        minimizeButton: null,
        isMinimized: false,
        updateProgress: jest.fn(),
        setupControls: jest.fn(),
        setupTTS: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
        toggleMinimize: jest.fn(),
        toggleView: jest.fn()
      };
      
      translator.setControls(mockControls);
      
      // Setup sections
      translator.sections = [
        {
          originalSection: document.querySelector('p') as HTMLElement,
          content: 'First paragraph'
        }
      ];
      
      const translation = '<p>Translated paragraph</p>';
      const id = 'invalid-id';
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      translator.appendTranslation(translation, id);
      
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    test('should set up text-to-speech for translation', () => {
      const mockControls = {
        container: null,
        progressBar: null,
        progressText: null,
        viewToggle: null,
        ttsButton: null,
        minimizeButton: null,
        isMinimized: false,
        setupControls: jest.fn(),
        updateProgress: jest.fn(),
        toggleMinimize: jest.fn(),
        toggleView: jest.fn(),
        setupTTS: jest.fn(),
        show: jest.fn(),
        hide: jest.fn()
      };
      
      translator.setControls(mockControls);
      
      // Setup sections
      translator.sections = [
        {
          originalSection: document.querySelector('p') as HTMLElement,
          content: 'First paragraph'
        }
      ];
      
      const translation = '<p>Translated paragraph</p>';
      const id = 'section-0';
      
      translator.appendTranslation(translation, id);
      
      expect(mockControls.setupTTS).toHaveBeenCalled();
    });
  });
  
  describe.skip('completeTranslation', () => {
    test('should add completed class to body', () => {
      translator.completeTranslation();
      
      expect(document.body.classList.contains('klartext-translation-completed')).toBe(true);
    });
  });
  
  describe.skip('showError', () => {
    test('should create error message element', () => {
      const errorMessage = 'Test error message';
      
      // Call showError
      translator.showError(errorMessage);
      
      // Force a synchronous DOM update
      jest.runAllTimers();
      
      // Check if error container is created
      const errorContainer = document.querySelector('.klartext-error-container');
      expect(errorContainer).not.toBeNull();
      
      // Check if error message is displayed
      expect(errorContainer?.textContent).toBe(errorMessage);
    });
  });
  
  describe.skip('singleton pattern', () => {
    beforeEach(() => {
      PageTranslator.resetInstance();
    });

    test('should return same instance when created multiple times', () => {
      const translator1 = PageTranslator.getInstance();
      const translator2 = PageTranslator.getInstance();
      
      expect(Object.is(translator1, translator2)).toBe(true);
      expect(translator1.sections).toBe(translator2.sections);
      expect(translator1.currentSection).toBe(translator2.currentSection);
      expect(translator1.controls).toBe(translator2.controls);
      
      const translator3 = PageTranslator.getInstance();
      expect(Object.is(translator1, translator3)).toBe(true);
    });
  });
});
