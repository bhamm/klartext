import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { pageTranslator, PageTranslator } from '../../../src/content/controllers/page-controller';
import { TranslationControls } from '../../../src/content/ui/translation-controls';
import fs from 'fs';
import path from 'path';

// Load complex test page HTML
const complexTestPagePath = path.resolve(__dirname, '../../content/fixtures/complex-test-page.html');
const complexTestPageHTML = fs.readFileSync(complexTestPagePath, 'utf8');

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
global.chrome = {
  runtime: {
    sendMessage: mockSendMessage,
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListeners: jest.fn(),
      listeners: []
    },
    lastError: null
  }
} as any;

describe('PageTranslator', () => {
  let translator: PageTranslator;
  
  beforeEach(() => {
    // Reset singleton instance before each test
    PageTranslator.resetInstance();
    
    // Setup DOM with complex test page
    document.body.innerHTML = complexTestPageHTML;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test instance
    translator = PageTranslator.getInstance();
    
    // Add test content directly for specific tests
    // This is needed because JSDOM doesn't fully render the HTML
    const article = document.createElement('article');
    article.className = 'article';
    article.innerHTML = '<h2>Test Article</h2><p>Test content for article</p>';
    document.body.appendChild(article);
    
    const dynamicContent = document.createElement('div');
    dynamicContent.className = 'dynamic-content';
    dynamicContent.innerHTML = '<h3>Dynamic Content</h3><p>Test dynamic content</p>';
    document.body.appendChild(dynamicContent);
    
    const nestedContent = document.createElement('div');
    nestedContent.className = 'nested-content';
    nestedContent.innerHTML = '<h4>Nested Content</h4><p>Test nested content</p>';
    document.body.appendChild(nestedContent);
    
    const customLayout = document.createElement('div');
    customLayout.className = 'custom-layout-item';
    customLayout.innerHTML = '<h4>Custom Layout</h4><p>Test custom layout</p>';
    document.body.appendChild(customLayout);
    
    const mixedContent = document.createElement('div');
    mixedContent.className = 'mixed-content-item';
    mixedContent.innerHTML = '<h4>Mixed Content</h4><p>Test mixed content</p>';
    document.body.appendChild(mixedContent);
    
    const contentWithAttributes = document.createElement('div');
    contentWithAttributes.className = 'content-with-attributes';
    contentWithAttributes.setAttribute('data-translatable', 'true');
    contentWithAttributes.innerHTML = '<h4>Content with Attributes</h4><p>Test content with attributes</p>';
    document.body.appendChild(contentWithAttributes);
  });
  
  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
  });
  
  describe('setControls', () => {
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
  
  describe('initialize', () => {
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
    
    test('should throw error when no content sections are found', async () => {
      // Clear the document body to simulate a page with no content
      document.body.innerHTML = '<div class="empty-page"></div>';
      
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
      
      await expect(translator.initialize()).rejects.toThrow();
    });
    
    test('should show controls and update progress when content is found', async () => {
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
      
      expect(mockControls.show).toHaveBeenCalled();
      expect(mockControls.updateProgress).toHaveBeenCalledWith(0, expect.any(Number));
    });
  });

  describe('getContentSections', () => {
    test('should find article content in complex page', () => {
      const sections = translator.getContentSections();
      
      expect(sections.length).toBeGreaterThan(0);
      
      // Check if sections include article elements
      const hasArticle = sections.some(section => 
        section.originalSection.tagName === 'ARTICLE' || 
        section.originalSection.classList.contains('article') ||
        section.originalSection.classList.contains('article-content')
      );
      
      expect(hasArticle).toBe(true);
      
      // Check if content contains paragraphs or headings text
      const hasContentWithHeadings = sections.some(section => 
        section.content.includes('<h2>') || 
        section.content.includes('<h3>') || 
        section.content.includes('<h4>')
      );
      
      const hasContentWithParagraphs = sections.some(section => 
        section.content.includes('<p>')
      );
      
      expect(hasContentWithHeadings || hasContentWithParagraphs).toBe(true);
    });
    
    test('should exclude sidebar content', () => {
      const sections = translator.getContentSections();
      
      // Check if sections exclude sidebar
      const hasSidebar = sections.some(section => 
        section.originalSection.closest('.sidebar')
      );
      
      expect(hasSidebar).toBe(false);
    });
    
    test('should exclude advertisements and comments', () => {
      const sections = translator.getContentSections();
      
      // Check if sections exclude advertisements and comments
      const hasAdvertisement = sections.some(section => 
        section.originalSection.closest('.advertisement')
      );
      
      const hasComments = sections.some(section => 
        section.originalSection.closest('.comments-section') ||
        section.originalSection.closest('#comments')
      );
      
      expect(hasAdvertisement).toBe(false);
      expect(hasComments).toBe(false);
    });
    
    test('should extract text content from article sections', () => {
      const sections = translator.getContentSections();
      
      // Check if content is extracted
      expect(sections[0].content).toBeTruthy();
      
      // Check for specific content from the complex test page
      const hasBarrierefreiheitContent = sections.some(section => 
        section.content.includes('Barrierefreiheit') || 
        section.content.includes('digitalen Zeitalter')
      );
      
      const hasLeichteSpracheContent = sections.some(section => 
        section.content.includes('Leichte Sprache') || 
        section.content.includes('digitalen Teilhabe')
      );
      
      expect(hasBarrierefreiheitContent).toBe(true);
      expect(hasLeichteSpracheContent).toBe(true);
    });
    
    test('should handle nested content structures', () => {
      const sections = translator.getContentSections();
      
      // Check if nested content is found
      const hasNestedContent = sections.some(section => 
        section.originalSection.classList.contains('nested-content') ||
        section.content.includes('verschachtelt')
      );
      
      expect(hasNestedContent).toBe(true);
    });
    
    test('should handle dynamic content', () => {
      const sections = translator.getContentSections();
      
      // Check if dynamic content is found
      const hasDynamicContent = sections.some(section => 
        section.originalSection.classList.contains('dynamic-content') ||
        section.content.includes('dynamisch generierte Inhalte')
      );
      
      expect(hasDynamicContent).toBe(true);
    });
    
    test('should handle content with data attributes', () => {
      const sections = translator.getContentSections();
      
      // Check if content with data attributes is found
      const hasContentWithAttributes = sections.some(section => 
        section.originalSection.classList.contains('content-with-attributes') ||
        section.content.includes('Datenattributen')
      );
      
      expect(hasContentWithAttributes).toBe(true);
    });
    
    test('should ignore iframe and script content', () => {
      const sections = translator.getContentSections();
      
      // Check if iframe and script tags are removed or ignored
      const hasIframeTag = sections.some(section => 
        section.content.includes('<iframe')
      );
      
      const hasScriptTag = sections.some(section => 
        section.content.includes('<script')
      );
      
      expect(hasIframeTag).toBe(false);
      expect(hasScriptTag).toBe(false);
    });
    
    test('should handle custom layouts', () => {
      const sections = translator.getContentSections();
      
      // Check if content in custom layouts is found
      const hasCustomLayoutContent = sections.some(section => 
        section.originalSection.classList.contains('custom-layout-item') ||
        section.content.includes('benutzerdefiniert') ||
        section.content.includes('Grid-Layout')
      );
      
      expect(hasCustomLayoutContent).toBe(true);
    });
    
    test('should handle mixed content', () => {
      const sections = translator.getContentSections();
      
      // Check if mixed content is found
      const hasMixedContent = sections.some(section => 
        section.originalSection.classList.contains('mixed-content-item') ||
        section.content.includes('Gemischte Inhalte')
      );
      
      expect(hasMixedContent).toBe(true);
    });
  });
  
  describe('translateNextSection', () => {
    test('should send message to translate next section', async () => {
      // Setup sections
      const originalSection = document.querySelector('p') as HTMLElement;
      translator.sections = [
        {
          originalSection,
          content: 'Test content'
        }
      ];
      translator.currentSection = 0;
      
      await translator.translateNextSection();
      
      expect(mockSendMessage).toHaveBeenCalledWith(expect.objectContaining({
        action: 'translateSection',
        html: 'Test content',
        id: expect.stringContaining('klartext-section-')
      }));
    });
    
    test('should update progress when translating sections', async () => {
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
          content: 'Test content'
        }
      ];
      translator.currentSection = 0;
      
      await translator.translateNextSection();
      
      expect(mockControls.updateProgress).toHaveBeenCalledWith(1, 1);
    });
    
    test('should call completeTranslation when all sections are translated', async () => {
      // Spy on completeTranslation
      const completeSpy = jest.spyOn(translator, 'completeTranslation');
      
      // Setup sections with currentSection past the end
      translator.sections = [];
      translator.currentSection = 1;
      
      await translator.translateNextSection();
      
      expect(completeSpy).toHaveBeenCalled();
    });
    
    test('should add loading indicator to section being translated', async () => {
      // Setup sections
      const originalSection = document.querySelector('p') as HTMLElement;
      translator.sections = [
        {
          originalSection,
          content: 'Test content'
        }
      ];
      translator.currentSection = 0;
      
      await translator.translateNextSection();
      
      // Check if loading indicator is added
      const loadingIndicator = originalSection.querySelector('.klartext-loading');
      expect(loadingIndicator).not.toBeNull();
    });
    
    test('should add appropriate classes to section being translated', async () => {
      // Setup sections
      const originalSection = document.querySelector('p') as HTMLElement;
      translator.sections = [
        {
          originalSection,
          content: 'Test content'
        }
      ];
      translator.currentSection = 0;
      
      await translator.translateNextSection();
      
      // Check if classes are added
      expect(originalSection.classList.contains('klartext-section')).toBe(true);
      expect(originalSection.classList.contains('translating')).toBe(true);
    });
    
    test('should store original content as data attribute', async () => {
      // Setup sections
      const originalSection = document.querySelector('p') as HTMLElement;
      translator.sections = [
        {
          originalSection,
          content: 'Test content'
        }
      ];
      translator.currentSection = 0;
      
      await translator.translateNextSection();
      
      // Check if data attribute is set
      expect(originalSection.getAttribute('data-original')).toBe('Test content');
    });
    
    test('should handle errors gracefully and continue with next section', async () => {
      // Setup sections with a problematic section
      const originalSection = document.querySelector('p') as HTMLElement;
      const problematicSection = null as unknown as HTMLElement; // This will cause an error
      
      translator.sections = [
        {
          originalSection: problematicSection,
          content: 'Problematic content'
        },
        {
          originalSection,
          content: 'Valid content'
        }
      ];
      translator.currentSection = 0;
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await translator.translateNextSection();
      
      // Should have logged an error but continued
      expect(consoleSpy).toHaveBeenCalled();
      expect(translator.currentSection).toBe(1);
    });
  });
  
  describe('appendTranslation', () => {
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
      const id = 'klartext-section-1';
      
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
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
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
      const id = 'klartext-section-1';
      
      translator.appendTranslation(translation, id);
      
      expect(mockControls.setupTTS).toHaveBeenCalled();
    });
  });
  
  describe('completeTranslation', () => {
    test('should add completed class to body', () => {
      translator.completeTranslation();
      
      expect(document.body.classList.contains('klartext-translation-completed')).toBe(true);
    });
  });
  
  describe('showError', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
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
  
  describe('singleton pattern', () => {
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
