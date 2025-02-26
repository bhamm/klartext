/**
 * Translation overlay UI component for the Klartext extension
 */
import { REPO_URL, PLAY_ICON } from '../constants.js';
import { createElement } from '../utils/dom-utils.js';
import { processTextToWords } from '../utils/dom-utils.js';
import { speechController } from '../controllers/speech-controller.js';

/**
 * Overlay for displaying translations
 */
export class TranslationOverlay {
  /**
   * Create a new TranslationOverlay
   */
  constructor() {
    // Singleton pattern
    if (TranslationOverlay.instance) {
      return TranslationOverlay.instance;
    }
    
    this.overlay = null;
    this.backdrop = null;
    this.content = null;
    this.closeButton = null;
    this.setupOverlay();
    TranslationOverlay.instance = this;
  }

  /**
   * Set up the overlay elements
   */
  setupOverlay() {
    try {
      console.log('Setting up Klartext overlay');
      
      // Create backdrop
      this.backdrop = createElement('div', {
        className: 'klartext-backdrop'
      });
      document.body.appendChild(this.backdrop);
      
      // Create overlay elements
      this.overlay = createElement('div', {
        className: 'klartext-overlay',
        role: 'dialog',
        'aria-label': 'Leichte Sprache Übersetzung',
        tabindex: '-1'
      });

      // Create content container
      this.content = createElement('div', {
        className: 'klartext-content'
      });
      this.overlay.appendChild(this.content);

      // Create header controls
      const headerControls = createElement('div', {
        className: 'klartext-header-controls'
      });

      // Create text size button group
      const textSizeGroup = createElement('div', {
        className: 'klartext-text-size-group'
      });

      // Create text size buttons
      const sizes = [
        { id: 'normal', label: 'A' },
        { id: 'gross', label: 'A+' },
        { id: 'sehr-gross', label: 'A++' }
      ];

      sizes.forEach(size => {
        const button = createElement('button', {
          className: 'klartext-text-size-button',
          textContent: size.label,
          'data-size': size.id,
          'aria-label': `Textgröße ${size.label}`,
          onclick: () => {
            // Remove active class from all buttons
            textSizeGroup.querySelectorAll('.klartext-text-size-button').forEach(btn => {
              btn.classList.remove('active');
            });
            // Add active class to clicked button
            button.classList.add('active');
            // Update translation text size
            const translation = this.overlay.querySelector('.klartext-translation');
            if (translation) {
              translation.classList.remove('klartext-text-normal', 'klartext-text-gross', 'klartext-text-sehr-gross');
              translation.classList.add(`klartext-text-${size.id}`);
            }
          }
        });
        textSizeGroup.appendChild(button);
      });

      // Create print button
      const printButton = createElement('button', {
        className: 'klartext-print',
        innerHTML: '🖨️',
        'aria-label': 'Drucken',
        onclick: () => this.handlePrint()
      });

      // Create close button
      this.closeButton = createElement('button', {
        className: 'klartext-close',
        'aria-label': 'Schließen',
        textContent: '×',
        onclick: () => {
          console.log('Close button clicked');
          this.hide();
        }
      });

      // Add components to header controls
      headerControls.appendChild(textSizeGroup);
      headerControls.appendChild(printButton);
      headerControls.appendChild(this.closeButton);

      this.overlay.appendChild(headerControls);

      // Add keyboard event listener for accessibility
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isVisible()) {
          console.log('Escape key pressed, hiding overlay');
          this.hide();
        }
      });

      // Add click outside listener
      this.backdrop.addEventListener('click', () => {
        console.log('Clicked outside content, hiding overlay');
        this.hide();
      });

      // Add overlay to document
      document.body.appendChild(this.overlay);
      console.log('Overlay setup complete');
    } catch (error) {
      console.error('Error setting up overlay:', error);
      throw new Error('Failed to setup translation overlay');
    }
  }

  /**
   * Handle print button click
   */
  handlePrint() {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Add complete HTML structure and styles
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Leichte Sprache Übersetzung</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Open Sans', Verdana, sans-serif;
          }
          .klartext-translation {
            font-family: 'Open Sans', Verdana, sans-serif;
            line-height: 1.8;
            color: #1a1a1a;
            max-width: 800px;
            margin: 0 auto;
          }
          .klartext-translation h1 { font-size: 2em; margin: 0.67em 0; }
          .klartext-translation h2 { font-size: 1.75em; margin: 0.75em 0; }
          .klartext-translation h3 { font-size: 1.5em; margin: 0.83em 0; }
          .klartext-translation p { margin: 1em 0; }
          .klartext-translation ul, .klartext-translation ol { margin: 1em 0; padding-left: 40px; }
          .klartext-translation li { margin: 0.5em 0; }
          @media print {
            body { padding: 0; }
            .klartext-translation { max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="klartext-translation">
    `);
    
    // Get translation content and remove TTS button
    const translation = this.overlay.querySelector('.klartext-translation');
    if (translation) {
      // Clone the translation to avoid modifying the original
      const printContent = translation.cloneNode(true);
      // Remove TTS button
      const ttsButton = printContent.querySelector('.klartext-tts-button');
      if (ttsButton) {
        ttsButton.remove();
      }
      printWindow.document.write(printContent.innerHTML);
    }
    
    // Close HTML structure
    printWindow.document.write(`
        </div>
      </body>
      </html>
    `);
    
    // Close the document and wait for load before printing
    printWindow.document.close();
    
    // Wait for window to load before printing
    printWindow.onload = () => {
      printWindow.focus(); // Focus window to ensure print dialog appears
      setTimeout(() => {
        printWindow.print();
        // Only close after print dialog is closed
        const checkPrintDialogClosed = setInterval(() => {
          if (printWindow.document.readyState === 'complete') {
            clearInterval(checkPrintDialogClosed);
            printWindow.close();
          }
        }, 1000);
      }, 250);
    };
  }

  /**
   * Show loading state
   */
  showLoading() {
    try {
      console.log('Showing loading state');
      
      // Clear previous content
      this.content.innerHTML = '';

      // Create loading container
      const loadingContainer = createElement('div', {
        className: 'klartext-loading'
      });

      // Add spinner
      const spinner = createElement('div', {
        className: 'klartext-spinner',
        role: 'progressbar',
        'aria-label': 'Übersetze...'
      });
      loadingContainer.appendChild(spinner);

      // Add loading text
      const loadingText = createElement('p', {
        className: 'klartext-loading-text',
        textContent: 'Übersetze...'
      });
      loadingContainer.appendChild(loadingText);

      this.content.appendChild(loadingContainer);

      // Show overlay and backdrop with animation
      this.backdrop.classList.add('visible');
      this.overlay.classList.add('visible');

      // Set focus to the overlay for accessibility
      this.overlay.focus();
      
      console.log('Loading state shown successfully');
    } catch (error) {
      console.error('Error showing loading state:', error);
    }
  }

  /**
   * Show translation in the overlay
   * @param {string} translation - The translated content
   */
  show(translation) {
    try {
      console.log('Showing translation overlay');
      
      // Clear previous content
      this.content.innerHTML = '';

      // Create and append translation container
      const translationContainer = createElement('div', {
        className: 'klartext-translation',
        'aria-label': 'Übersetzung in Leichte Sprache'
      });

      // Process translation content
      let allWords = [];
      let plainText = '';

      // Check if translation is HTML
      if (translation.trim().startsWith('<')) {
        // Parse HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(translation, 'text/html');
        
        // Extract plain text
        const textNodes = [];
        const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node);
          plainText += node.textContent + ' ';
        }

        // Add HTML to container directly without word spans
        translationContainer.innerHTML = translation;
        
        // Process words for speech
        const words = processTextToWords(plainText);
        words.forEach(word => allWords.push(word));
      } else {
        // Process plain text
        plainText = translation;
        const paragraphs = translation.split(/\n\n+/);
        paragraphs.forEach(paragraph => {
          if (paragraph.trim()) {
            const p = createElement('p', {
              textContent: paragraph.trim()
            });
            translationContainer.appendChild(p);
          }
        });
        
        // Process words for speech
        const words = processTextToWords(plainText);
        words.forEach(word => allWords.push(word));
      }

      // Create text-to-speech button
      const ttsButton = createElement('button', {
        className: 'klartext-tts-button',
        innerHTML: PLAY_ICON + 'Vorlesen',
        'aria-label': 'Text vorlesen',
        onclick: () => speechController.toggle()
      });
      
      // Setup speech controller with plain text
      speechController.setup(plainText, allWords, ttsButton);

      // Add button before translation
      translationContainer.insertBefore(ttsButton, translationContainer.firstChild);

      this.content.appendChild(translationContainer);

      // Create feedback container
      const feedbackContainer = this.createFeedbackContainer(translation);
      this.content.appendChild(feedbackContainer);

      // Show overlay and backdrop with animation
      this.backdrop.classList.add('visible');
      this.overlay.classList.add('visible');

      // Set focus to the overlay for accessibility
      this.overlay.focus();
      
      console.log('Translation overlay shown successfully');
    } catch (error) {
      console.error('Error showing translation:', error);
      this.showError('Fehler beim Anzeigen der Übersetzung');
    }
  }

  /**
   * Create feedback container with rating stars and comment field
   * @param {string} translation - The translated content
   * @returns {HTMLElement} The feedback container
   */
  createFeedbackContainer(translation) {
    // Create feedback container
    const feedbackContainer = createElement('div', {
      className: 'klartext-feedback-container'
    });

    // Create rating container with label first
    const ratingContainer = createElement('div', {
      className: 'klartext-rating'
    });

    // Add rating label
    const ratingLabel = createElement('div', {
      className: 'klartext-rating-label',
      textContent: 'Wie gut ist diese Übersetzung?'
    });
    ratingContainer.appendChild(ratingLabel);

    // Create stars container
    const starsContainer = createElement('div', {
      className: 'klartext-stars'
    });

    // Create and add stars
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const star = createElement('span', {
        className: 'klartext-star',
        textContent: '★',
        role: 'button',
        'aria-label': `${i} Sterne`,
        'data-rating': i
      });

      // Hover effect
      star.addEventListener('mouseenter', () => {
        stars.forEach((s, index) => {
          if (index < i) s.classList.add('hover');
          else s.classList.remove('hover');
        });
      });

      // Click handler
      star.addEventListener('click', async () => {
        // Update visual state
        stars.forEach((s, index) => {
          if (index < i) s.classList.add('selected');
          else s.classList.remove('selected');
        });

        // Show feedback button for translation feedback
        feedbackButton.style.display = 'block';
      });

      stars.push(star);
      starsContainer.appendChild(star);
    }

    // Mouse leave handler for stars container
    starsContainer.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hover'));
    });

    // Add stars container after label
    ratingContainer.appendChild(starsContainer);

    // Add comment container
    const commentContainer = createElement('div', {
      className: 'klartext-comment-container'
    });

    // Add comment label
    const commentLabel = createElement('label', {
      textContent: 'Zusätzlicher Kommentar (optional):',
      htmlFor: 'klartext-comment'
    });
    commentContainer.appendChild(commentLabel);

    // Add comment textarea
    const commentInput = createElement('textarea', {
      id: 'klartext-comment',
      className: 'klartext-comment',
      placeholder: 'Ihr Kommentar zur Übersetzung...'
    });
    commentContainer.appendChild(commentInput);

    // Add include texts checkbox container
    const includeContainer = createElement('div', {
      className: 'klartext-include-container'
    });

    // Add checkbox
    const includeCheckbox = createElement('input', {
      type: 'checkbox',
      id: 'klartext-include-texts',
      checked: true
    });

    // Add checkbox label
    const includeLabel = createElement('label', {
      htmlFor: 'klartext-include-texts',
      textContent: 'Original- und übersetzten Text einschließen'
    });

    includeContainer.appendChild(includeCheckbox);
    includeContainer.appendChild(includeLabel);

    // Create feedback button (initially hidden)
    const feedbackButton = createElement('button', {
      className: 'klartext-feedback',
      textContent: 'Mitteilung senden',
      'aria-label': 'Mitteilung zur Übersetzung geben',
      style: 'display: none;',
      onclick: async () => this.submitFeedback(stars, commentInput, includeCheckbox, translation, feedbackButton)
    });

    // Add components to feedback container
    feedbackContainer.appendChild(ratingContainer);      // Rating label and stars
    feedbackContainer.appendChild(commentContainer);     // Comment field
    feedbackContainer.appendChild(includeContainer);     // Checkbox
    feedbackContainer.appendChild(feedbackButton);       // Submit button

    return feedbackContainer;
  }

  /**
   * Submit feedback to background script
   * @param {HTMLElement[]} stars - Array of star elements
   * @param {HTMLTextAreaElement} commentInput - Comment textarea
   * @param {HTMLInputElement} includeCheckbox - Include texts checkbox
   * @param {string} translation - The translated content
   * @param {HTMLButtonElement} feedbackButton - The feedback button
   */
  async submitFeedback(stars, commentInput, includeCheckbox, translation, feedbackButton) {
    try {
      const originalText = window.getSelection().toString();
      const { provider, model } = await new Promise(resolve => {
        chrome.storage.sync.get(['provider', 'model'], items => {
          resolve({
            provider: items.provider,
            model: items.model
          });
        });
      });

      console.log('Provider:', provider);
      console.log('Model:', model);

      // Get selected rating and comment
      const rating = stars.filter(s => s.classList.contains('selected')).length;
      const comment = commentInput.value.trim();
      const includedTexts = includeCheckbox.checked;

      // Submit feedback to Canny
      chrome.runtime.sendMessage({
        action: 'submitFeedback',
        feedback: {
          rating,
          category: 'Translation Quality',
          comment,
          details: includedTexts ? {
            originalText: originalText,
            translatedText: translation,
            url: window.location.href,
            provider: provider,
            model: model
          } : {
            originalText: 'not provided',
            translatedText: 'not provided',
            url: 'not provided',
            provider: provider,
            model: model
          }
        }
      }, response => {
        if (response.success) {
          feedbackButton.textContent = 'Danke für Ihr Feedback!';
          feedbackButton.disabled = true;
        } else {
          this.showError('Fehler beim Senden des Feedbacks');
        }
      });
    } catch (error) {
      console.error('Error creating feedback:', error);
      this.showError('Fehler beim Erstellen des Feedbacks');
    }
  }

  /**
   * Show error message in the overlay
   * @param {string} message - The error message
   */
  showError(message) {
    try {
      // Clear previous content
      this.content.innerHTML = '';

      // Create error container
      const errorContainer = createElement('div', {
        className: 'klartext-error'
      });
      
      // Add error message
      const errorTitle = createElement('p', {
        textContent: 'Entschuldigung, es gab einen Fehler:'
      });
      errorContainer.appendChild(errorTitle);
      
      const errorMessage = createElement('p', {
        textContent: message
      });
      errorContainer.appendChild(errorMessage);
      
      this.content.appendChild(errorContainer);

      // Create feedback button
      const feedbackButton = createElement('button', {
        className: 'klartext-feedback',
        textContent: 'Fehler melden',
        'aria-label': 'Diesen Fehler melden',
        onclick: async () => this.reportError(message)
      });
      this.content.appendChild(feedbackButton);

      // Show overlay and backdrop with animation
      this.backdrop.classList.add('visible');
      this.overlay.classList.add('visible');
    } catch (error) {
      console.error('Error showing error message:', error);
    }
  }

  /**
   * Report an error to GitHub
   * @param {string} message - The error message
   */
  async reportError(message) {
    try {
      const { provider, model } = await new Promise(resolve => {
        chrome.storage.sync.get(['provider', 'model'], items => {
          resolve({
            provider: items.provider,
            model: items.model
          });
        });
      });

      // Try to parse error details if it's a JSON string
      let errorDetails = message;
      try {
        if (message.includes('{')) {
          const jsonStart = message.indexOf('{');
          const jsonString = message.slice(jsonStart);
          const parsedError = JSON.parse(jsonString);
          errorDetails = JSON.stringify(parsedError, null, 2);
        }
      } catch (e) {
        console.error('Error parsing error details:', e);
      }

      const issueTitle = encodeURIComponent('Fehler: Klartext Extension');
      const issueBody = encodeURIComponent(
        `## Fehlerbericht\n\n` +
        `### Fehlermeldung\n\`\`\`json\n${errorDetails}\n\`\`\`\n\n` +
        `### Kontext\n` +
        `- URL: ${window.location.href}\n` +
        `- Extension: ${chrome.runtime.getManifest().name}\n` +
        `- Version: ${chrome.runtime.getManifest().version}\n` +
        `- Provider: ${provider}\n` +
        `- Model: ${model}\n\n` +
        `### Zusätzliche Informationen\n` +
        `[Bitte beschreiben Sie hier, was Sie gemacht haben, als der Fehler auftrat]\n`
      );

      window.open(
        `${REPO_URL}/issues/new?title=${issueTitle}&body=${issueBody}&labels=bug`,
        '_blank'
      );
    } catch (error) {
      console.error('Error creating error report:', error);
    }
  }

  /**
   * Hide the overlay
   */
  hide() {
    speechController.stop();
    this.overlay.classList.remove('visible');
    this.backdrop.classList.remove('visible');
  }

  /**
   * Check if the overlay is visible
   * @returns {boolean} True if the overlay is visible
   */
  isVisible() {
    return this.overlay.classList.contains('visible');
  }
}

// Create and export a singleton instance
export const translationOverlay = new TranslationOverlay();
