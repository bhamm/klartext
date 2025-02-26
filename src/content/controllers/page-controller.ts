/**
 * Page translation controller for the Klartext extension
 */
import { MAX_CHUNK_CHARS, CONTENT_SELECTORS, EXCLUDE_SELECTORS, CONTENT_CLASS_PATTERNS } from '../constants';
import { splitIntoChunks } from '../utils/html-cleaner';
import { processTextToWords } from '../utils/dom-utils';
import { speechController } from './speech-controller';
import { PageTranslatorInterface, SectionData, TranslationControlsInterface } from '../types';

/**
 * Controller for translating entire pages
 */
export class PageTranslator implements PageTranslatorInterface {
  sections: SectionData[];
  currentSection: number;
  controls: TranslationControlsInterface | null;

  /**
   * Create a new PageTranslator
   */
  constructor() {
    this.sections = [];
    this.currentSection = 0;
    this.controls = null;
  }

  /**
   * Set the controls instance
   * @param {TranslationControlsInterface} controls - The TranslationControls instance
   */
  setControls(controls: TranslationControlsInterface): void {
    this.controls = controls;
  }

  /**
   * Initialize the page translator
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing page translator');
      
      // Find all content sections
      this.sections = this.getContentSections();
      console.log(`Found ${this.sections.length} sections to translate`);
      
      if (this.sections.length === 0) {
        throw new Error('Keine übersetzbaren Inhalte gefunden. Bitte wählen Sie einen Artikel oder Text aus.');
      }
      
      // Show controls and start translation
      if (this.controls) {
        this.controls.show();
        this.controls.updateProgress(0, this.sections.length);
      }
      
      await this.translateNextSection();
      
    } catch (error) {
      console.error('Error initializing page translator:', error);
      this.showError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Find content sections in the page
   * @returns {Array<SectionData>} Array of section objects
   */
  getContentSections(): SectionData[] {
    console.log('Finding content sections');
    
    // Get all potential content sections
    let sections: HTMLElement[] = [];
    
    // Try to find main content container first
    const mainSelectors = [
      'article[class*="article"]',
      'article[class*="content"]',
      'div[class*="article"]',
      'div[class*="content"]',
      'main',
      '[role="main"]',
      '[role="article"]',
      // Add more general selectors as fallback
      'article',
      '.article',
      '.content',
      '.post',
      '.entry-content'
    ];

    // Try each main selector
    for (const selector of mainSelectors) {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      if (elements.length > 0) {
        // Found main container, use only these elements
        const validElements = Array.from(elements).filter(el => {
          const text = el.innerText.trim();
          return text.length > 0 && text.split(/\\s+/).length > 10; // Ensure it has meaningful content
        });
        
        if (validElements.length > 0) {
          sections = validElements;
          console.log(`Found main content container using selector: ${selector}`);
          console.log(`Container contains ${validElements.length} valid elements`);
          break;
        }
      }
    }

    // If no main container found, try individual paragraph selectors
    if (sections.length === 0) {
      console.log('No main container found, trying paragraph selectors');
      const paragraphSelectors = [
        'article p',
        '.article p',
        '.content p',
        '.post-content p',
        '.entry-content p',
        'main p',
        // Add more specific selectors
        'article > p',
        '.article > p',
        '.content > p',
        '.post > p',
        '.entry-content > p'
      ];

      for (const selector of paragraphSelectors) {
        const elements = document.querySelectorAll<HTMLElement>(selector);
        if (elements.length > 0) {
          const validElements = Array.from(elements).filter(el => {
            const text = el.innerText.trim();
            return text.length > 0 && text.split(/\\s+/).length > 5; // Ensure paragraph has meaningful content
          });
          
          if (validElements.length > 0) {
            sections.push(...validElements);
            console.log(`Found individual paragraphs using selector: ${selector}`);
            console.log(`Found ${validElements.length} valid paragraphs`);
            break;
          }
        }
      }
    }
    
    // Filter sections first
    const filteredSections = sections.filter(section => {
      const text = section.innerText.trim();
      if (!text || text.split(/\\s+/).length < 5) {
        return false;
      }

      // Check if section should be excluded
      const shouldExclude = EXCLUDE_SELECTORS.some(sel => 
        section.matches(sel) || section.closest(sel)
      );
      if (shouldExclude) {
        console.log('Excluding non-content section:', text.substring(0, 50) + '...');
        return false;
      }

      // Validate section has content-related classes
      const classes = Array.from(section.classList || []);
      const hasContentClass = CONTENT_CLASS_PATTERNS.some(pattern => 
        classes.some(cls => cls.toLowerCase().includes(pattern))
      );
      
      // If section has classes but none are content-related, skip it
      if (classes.length > 0 && !hasContentClass) {
        console.log('Skipping non-content element:', text.substring(0, 50) + '...');
        return false;
      }
      return true;
    });

    // Now split filtered sections into chunks and store original references
    const chunkedSections = filteredSections.map(section => {
      const chunks = splitIntoChunks(section, MAX_CHUNK_CHARS);
      return chunks;
    }).flat();
    
    console.log(`Split into ${chunkedSections.length} chunks`);
    console.log(`Final section count after filtering: ${chunkedSections.length}`);
    return chunkedSections;
  }
  
  /**
   * Translate the next section
   * @returns {Promise<void>}
   */
  async translateNextSection(): Promise<void> {
    if (this.currentSection >= this.sections.length) {
      this.completeTranslation();
      return;
    }
    
    try {
      const sectionData = this.sections[this.currentSection];
      const { originalSection, content } = sectionData;
      
      // Create a unique section ID
      const sectionId = `klartext-section-${this.currentSection + 1}`;
      
      // Store original content
      originalSection.setAttribute('data-original', content);
      originalSection.setAttribute('data-section-id', sectionId);
      originalSection.classList.add('klartext-section', 'translating');

      // Add loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'klartext-loading';
      loadingDiv.innerHTML = `
        <div class="klartext-spinner"></div>
        <p class="klartext-loading-text">Übersetze...</p>
      `;
      originalSection.appendChild(loadingDiv);

      try {
        // Verify section is still valid
        if (!originalSection.isConnected || !originalSection.parentNode) {
          console.warn('Section no longer valid, skipping:', sectionId);
          this.currentSection++;
          this.translateNextSection();
          return;
        }

        // Wait for DOM update
        await new Promise(resolve => setTimeout(resolve, 50));

        // Update progress
        if (this.controls) {
          this.controls.updateProgress(this.currentSection + 1, this.sections.length);
        }
        
        // Send content for translation
        chrome.runtime.sendMessage({
          action: 'translateSection',
          html: content,
          id: sectionId
        });
        
        // Translation will continue in message handler
      } catch (domError) {
        console.warn('DOM manipulation failed for section:', sectionId, domError);
        // Skip this section and continue with next
        this.currentSection++;
        this.translateNextSection();
      }
    } catch (error) {
      console.error('Error translating section:', error);
      // Skip problematic section and continue
      this.currentSection++;
      this.translateNextSection();
    }
  }

  /**
   * Append translation to a section
   * @param {string} translation - The translated content
   * @param {string} id - The section ID
   */
  appendTranslation(translation: string, id: string): void {
    try {
      const section = document.querySelector(`[data-section-id="${id}"]`);
      if (!section) {
        console.warn(`Section ${id} not found`);
        return;
      }

      // Remove translating state
      section.classList.remove('translating');
      
      // Store translation content
      section.setAttribute('data-translation', translation);
      
      // Remove loading indicator
      const loadingEl = section.querySelector('.klartext-loading');
      if (loadingEl) {
        loadingEl.remove();
      }
      
      // Replace content with translation
      section.innerHTML = translation;
      
      // Move to next section
      this.currentSection++;
      
      // Continue translation
      this.translateNextSection();
    } catch (error) {
      console.error('Error appending translation:', error);
      this.showError(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Complete the translation process
   */
  completeTranslation(): void {
    // Get all text for speech
    let plainText = '';
    
    // Extract text from translated sections
    document.querySelectorAll('.klartext-section').forEach(section => {
      plainText += section.textContent + ' ';
    });
    
    // Process words for speech
    const words = processTextToWords(plainText);
    
    // Setup TTS
    if (this.controls) {
      this.controls.setupTTS(plainText, words);
    }
  }

  /**
   * Show an error message
   * @param {string} message - The error message
   */
  showError(message: string): void {
    console.error('Translation error:', message);
    alert(`Fehler bei der Übersetzung: ${message}`);
  }
}

// Create and export a singleton instance
export const pageTranslator = new PageTranslator();
