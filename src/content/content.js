// Constants
const REPO_URL = 'https://github.com/bhamm/klartext';
const PLAY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
const PAUSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

// Speech synthesis controller
class SpeechController {
  constructor() {
    this.utterance = null;
    this.currentWordIndex = 0;
    this.words = [];
    this.isPlaying = false;
    this.button = null;
  }

  setup(text, words, button) {
    this.words = words;
    this.button = button;
    this.currentWordIndex = 0;
    
    // Create utterance
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = 'de-DE';
    this.utterance.rate = 0.9;
    
    // Handle word boundaries
    this.utterance.onboundary = (event) => {
      if (event.name === 'word' && this.currentWordIndex < this.words.length) {
        // Remove highlight from previous word
        if (this.currentWordIndex > 0) {
          this.words[this.currentWordIndex - 1].classList.remove('active');
        }
        // Add highlight to current word
        this.words[this.currentWordIndex].classList.add('active');
        this.currentWordIndex++;
      }
    };

    // Handle end of speech
    this.utterance.onend = () => {
      this.stop();
    };

    // Handle errors
    this.utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.stop();
    };
  }

  start() {
    if (!this.utterance) return;
    
    this.isPlaying = true;
    this.button.innerHTML = PAUSE_ICON + 'Pause';
    this.button.classList.add('playing');
    
    speechSynthesis.speak(this.utterance);
  }

  pause() {
    speechSynthesis.pause();
    this.isPlaying = false;
    this.button.innerHTML = PLAY_ICON + 'Vorlesen';
    this.button.classList.remove('playing');
  }

  resume() {
    speechSynthesis.resume();
    this.isPlaying = true;
    this.button.innerHTML = PAUSE_ICON + 'Pause';
    this.button.classList.add('playing');
  }

  stop() {
    speechSynthesis.cancel();
    this.isPlaying = false;
    this.currentWordIndex = 0;
    
    // Remove all highlights
    this.words.forEach(word => word.classList.remove('active'));
    
    // Reset button
    if (this.button) {
      this.button.innerHTML = PLAY_ICON + 'Vorlesen';
      this.button.classList.remove('playing');
    }
  }

  toggle() {
    if (!this.isPlaying) {
      if (speechSynthesis.paused) {
        this.resume();
      } else {
        this.start();
      }
    } else {
      this.pause();
    }
  }
}

// Initialize speech controller
const speechController = new SpeechController();
const ARTICLE_SELECTORS = [
  'article',
  '[role="article"]',
  '.article',
  '.post',
  'main p',
  '.content p',
  '.entry-content',
  '.post-content'
];

// Track mode states
let isArticleMode = false;
let isFullPageMode = false;
let currentHighlight = null;
let pageTranslator = null;

// Page translator class
class PageTranslator {
  constructor() {
    this.sections = [];
    this.currentSection = 0;
    this.compareView = false;
    this.excludeComments = true;
  }

  async initialize() {
    // Get settings
    const settings = await new Promise(resolve => {
      chrome.storage.sync.get({
        compareView: false,
        excludeComments: true
      }, resolve);
    });
    
    this.compareView = settings.compareView;
    this.excludeComments = settings.excludeComments;
    
    // Find all content sections
    this.sections = this.getContentSections();
    
    // Show initial loading state
    overlay.showPageTranslation({
      total: this.sections.length,
      compareView: this.compareView
    });
    
    // Start translating first section
    await this.translateNextSection();
  }
  
  getContentSections() {
    // Main content selectors in order of priority
    const contentSelectors = [
      // Main article containers
      'article',
      '[role="article"]',
      '[role="main"]',
      'main',
      
      // Common content containers
      '.article',
      '.post',
      '.entry-content',
      '.content',
      '.page-content',
      '.main-content',
      
      // Fallback to semantic sections
      'section',
      
      // Individual content blocks if no container found
      '.post-content p',
      'article p',
      'main p',
      '.content p',
      '.entry-content p'
    ];
    
    // Comment section selectors to exclude
    const commentSelectors = [
      '#comments', '.comments', '.comment-section',
      '[data-component="comments"]', '.comment-list'
    ];
    
    // Helper function to split text into chunks
    const splitIntoChunks = (element) => {
      const MAX_CHARS = 1000; // Roughly 250-300 tokens
      const chunks = [];
      let currentChunk = [];
      let currentLength = 0;
      
      // Get all text-containing elements
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            if (node.matches('p, h1, h2, h3, h4, h5, h6, li')) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );
      
      let node;
      while (node = walker.nextNode()) {
        const text = node.innerHTML;
        const length = text.length;
        
        if (currentLength + length > MAX_CHARS && currentChunk.length > 0) {
          // Create a new section with current chunk
          const section = document.createElement('div');
          currentChunk.forEach(n => section.appendChild(n.cloneNode(true)));
          chunks.push(section);
          
          // Start new chunk
          currentChunk = [node];
          currentLength = length;
        } else {
          currentChunk.push(node);
          currentLength += length;
        }
      }
      
      // Add remaining chunk if any
      if (currentChunk.length > 0) {
        const section = document.createElement('div');
        currentChunk.forEach(n => section.appendChild(n.cloneNode(true)));
        chunks.push(section);
      }
      
      return chunks;
    };
    
    // Get all potential content sections
    let sections = [];
    let foundMainContainer = false;
    
    for (const selector of contentSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        // If we find a main container, use only that
        if (!foundMainContainer && 
            (selector.includes('article') || 
             selector.includes('main') || 
             selector.includes('content'))) {
          // Split main container into chunks
          const mainSections = Array.from(elements).flatMap(el => splitIntoChunks(el));
          sections = mainSections;
          foundMainContainer = true;
          break;
        }
        // Otherwise add individual sections
        if (!foundMainContainer) {
          const newSections = Array.from(elements).flatMap(el => splitIntoChunks(el));
          sections.push(...newSections);
        }
      }
    }
    
    // Filter out empty sections and comments if excluded
    return sections.filter(section => {
      if (!section.innerText.trim()) return false;
      if (this.excludeComments) {
        return !commentSelectors.some(sel => 
          section.matches(sel) || section.closest(sel)
        );
      }
      return true;
    });
  }
  
  async translateNextSection() {
    if (this.currentSection >= this.sections.length) {
      overlay.completePageTranslation();
      return;
    }
    
    const section = this.sections[this.currentSection];
    try {
      // Create a unique ID for this section if it doesn't have one
      if (!section.id) {
        section.id = `klartext-section-${this.currentSection + 1}`;
      }
      
      // Update progress before translation
      overlay.updateProgress(this.currentSection + 1, this.sections.length);
      
      // Send section for translation
      chrome.runtime.sendMessage({
        action: 'translateSection',
        html: section.innerHTML,
        id: section.id
      });
      
      // Translation will continue in message handler
    } catch (error) {
      console.error('Error translating section:', error);
      overlay.showError(error.message);
    }
  }
}

// Singleton overlay instance
let overlayInstance = null;

// Create and manage overlay
class TranslationOverlay {
  constructor() {
    if (overlayInstance) {
      return overlayInstance;
    }
    
    this.overlay = null;
    this.backdrop = null;
    this.content = null;
    this.closeButton = null;
    this.setupOverlay();
    overlayInstance = this;
  }

  setupOverlay() {
    try {
      console.log('Setting up Klartext overlay');
      
      // Create backdrop
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'klartext-backdrop';
      document.body.appendChild(this.backdrop);
      
      // Create overlay elements
      this.overlay = document.createElement('div');
      this.overlay.className = 'klartext-overlay';
      this.overlay.setAttribute('role', 'dialog');
      this.overlay.setAttribute('aria-label', 'Leichte Sprache Übersetzung');
      this.overlay.setAttribute('tabindex', '-1'); // Make focusable for accessibility

      // Create content container
      this.content = document.createElement('div');
      this.content.className = 'klartext-content';
      this.overlay.appendChild(this.content);

      // Create close button
      this.closeButton = document.createElement('button');
      this.closeButton.className = 'klartext-close';
      this.closeButton.setAttribute('aria-label', 'Schließen');
      this.closeButton.textContent = '×';
      this.closeButton.addEventListener('click', () => {
        console.log('Close button clicked');
        this.hide();
      });
      this.overlay.appendChild(this.closeButton);

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

  showLoading() {
    try {
      console.log('Showing loading state');
      
      // Clear previous content
      this.content.innerHTML = '';

      // Create loading container
      const loadingContainer = document.createElement('div');
      loadingContainer.className = 'klartext-loading';

      // Add spinner
      const spinner = document.createElement('div');
      spinner.className = 'klartext-spinner';
      spinner.setAttribute('role', 'progressbar');
      spinner.setAttribute('aria-label', 'Übersetze...');
      loadingContainer.appendChild(spinner);

      // Add loading text
      const loadingText = document.createElement('p');
      loadingText.className = 'klartext-loading-text';
      loadingText.textContent = 'Übersetze...';
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

  showPageTranslation({ total, compareView }) {
    try {
      console.log('Starting full page translation');
      
      // Clear previous content
      this.content.innerHTML = '';

      // Create container
      const container = document.createElement('div');
      container.className = 'klartext-fullpage';
      if (compareView) {
        container.classList.add('klartext-compare');
      }

      // Add progress bar
      const progress = document.createElement('div');
      progress.className = 'klartext-progress';
      progress.innerHTML = `
        <div class="klartext-progress-bar">
          <div class="klartext-progress-fill" style="width: 0%"></div>
        </div>
        <div class="klartext-progress-text">
          Übersetze Abschnitt 0/${total}
        </div>
      `;

      // Add view toggle
      const viewToggle = document.createElement('button');
      viewToggle.className = 'klartext-view-toggle';
      viewToggle.textContent = compareView ? 
        'Nur Übersetzung zeigen' : 'Original anzeigen';
      viewToggle.onclick = () => this.toggleCompareView();

      container.appendChild(progress);
      container.appendChild(viewToggle);
      this.content.appendChild(container);

      // Show overlay
      this.backdrop.classList.add('visible');
      this.overlay.classList.add('visible');
      this.overlay.focus();
    } catch (error) {
      console.error('Error showing page translation:', error);
      this.showError('Fehler beim Starten der Übersetzung');
    }
  }

  updateProgress(current, total) {
    try {
      const progress = this.content.querySelector('.klartext-progress-fill');
      const text = this.content.querySelector('.klartext-progress-text');
      
      if (progress && text) {
        progress.style.width = `${(current/total) * 100}%`;
        text.textContent = `Übersetze Abschnitt ${current}/${total}`;
        
        // Highlight current section
        const sections = this.content.querySelectorAll('.klartext-section');
        sections.forEach(s => s.classList.remove('translating'));
        sections[current-1]?.classList.add('translating');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }

  appendTranslation(translation, id) {
    try {
      const container = this.content.querySelector('.klartext-fullpage');
      const section = document.createElement('div');
      section.className = 'klartext-section';
      section.dataset.originalId = id;
      
      if (container.classList.contains('klartext-compare')) {
        const original = document.getElementById(id);
        if (original) {
          section.innerHTML = `
            <div class="original">${original.innerHTML}</div>
            <div class="translation">${translation}</div>
          `;
        } else {
          console.warn(`Original section with ID ${id} not found`);
          section.innerHTML = translation;
        }
      } else {
        section.innerHTML = translation;
      }
      
      container.appendChild(section);
    } catch (error) {
      console.error('Error appending translation:', error);
      this.showError('Fehler beim Hinzufügen der Übersetzung');
    }
  }

  toggleCompareView() {
    try {
      const container = this.content.querySelector('.klartext-fullpage');
      const isCompare = container.classList.toggle('klartext-compare');
      
      const button = this.content.querySelector('.klartext-view-toggle');
      button.textContent = isCompare ?
        'Nur Übersetzung zeigen' : 'Original anzeigen';
      
      // Update sections
      const sections = container.querySelectorAll('.klartext-section');
      sections.forEach(section => {
        const id = section.dataset.originalId;
        const original = document.getElementById(id);
        
        if (isCompare && !section.querySelector('.original')) {
          if (original) {
            section.innerHTML = `
              <div class="original">${original.innerHTML}</div>
              <div class="translation">${section.innerHTML}</div>
            `;
          }
        } else if (!isCompare && section.querySelector('.original')) {
          section.innerHTML = section.querySelector('.translation').innerHTML;
        }
      });
    } catch (error) {
      console.error('Error toggling compare view:', error);
    }
  }

  completePageTranslation() {
    try {
      // Remove progress bar
      const progress = this.content.querySelector('.klartext-progress');
      progress.remove();
      
      // Add text-to-speech button
      const container = this.content.querySelector('.klartext-fullpage');
      const ttsButton = document.createElement('button');
      ttsButton.className = 'klartext-tts-button';
      ttsButton.innerHTML = PLAY_ICON + 'Vorlesen';
      ttsButton.setAttribute('aria-label', 'Text vorlesen');
      
      // Get all text for speech
      const textNodes = [];
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: node => {
            // Skip original text in compare view
            if (node.parentElement.closest('.original')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      
      let node;
      let plainText = '';
      while (node = walker.nextNode()) {
        textNodes.push(node);
        plainText += node.textContent + ' ';
      }
      
      // Wrap words in spans
      const allWords = [];
      textNodes.forEach(textNode => {
        const words = textNode.textContent.trim().split(/\s+/);
        const spans = words.map((word, index) => {
          const span = document.createElement('span');
          span.className = 'klartext-word';
          span.textContent = word + (index < words.length - 1 ? ' ' : '');
          allWords.push(span);
          return span;
        });

        const fragment = document.createDocumentFragment();
        spans.forEach(span => fragment.appendChild(span));
        textNode.parentNode.replaceChild(fragment, textNode);
      });
      
      // Setup speech controller
      speechController.setup(plainText, allWords, ttsButton);
      
      // Add click handler
      ttsButton.addEventListener('click', () => {
        speechController.toggle();
      });
      
      // Add button at the top
      container.insertBefore(ttsButton, container.firstChild);
    } catch (error) {
      console.error('Error completing page translation:', error);
    }
  }

  show(translation) {
    try {
      console.log('Showing translation overlay');
      
      // Clear previous content
      this.content.innerHTML = '';

      // Create and append translation container
      const translationContainer = document.createElement('div');
      translationContainer.className = 'klartext-translation';
      translationContainer.setAttribute('aria-label', 'Übersetzung in Leichte Sprache');

      // Process translation content
      let allWords = [];
      let plainText = '';

      // Check if translation is HTML
      if (translation.trim().startsWith('<')) {
        // Parse HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(translation, 'text/html');
        
        // Process each text node
        const textNodes = [];
        const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node);
          plainText += node.textContent + ' ';
        }

        // Add HTML to container
        translationContainer.innerHTML = translation;

        // Wrap words in spans for text-to-speech
        textNodes.forEach(textNode => {
          const words = textNode.textContent.trim().split(/\s+/);
          const spans = words.map((word, index) => {
            const span = document.createElement('span');
            span.className = 'klartext-word';
            span.textContent = word + (index < words.length - 1 ? ' ' : '');
            allWords.push(span);
            return span;
          });

          const fragment = document.createDocumentFragment();
          spans.forEach(span => fragment.appendChild(span));
          textNode.parentNode.replaceChild(fragment, textNode);
        });
      } else {
        // Process plain text
        plainText = translation;
        const paragraphs = translation.split(/\n\n+/);
        paragraphs.forEach(paragraph => {
          if (paragraph.trim()) {
            const p = document.createElement('p');
            const words = paragraph.trim().replace(/\s+/g, ' ').split(' ');
            words.forEach((word, index) => {
              const span = document.createElement('span');
              span.className = 'klartext-word';
              span.textContent = word + (index < words.length - 1 ? ' ' : '');
              p.appendChild(span);
              allWords.push(span);
            });
            translationContainer.appendChild(p);
          }
        });
      }

      // Create text-to-speech button
      const ttsButton = document.createElement('button');
      ttsButton.className = 'klartext-tts-button';
      ttsButton.innerHTML = PLAY_ICON + 'Vorlesen';
      ttsButton.setAttribute('aria-label', 'Text vorlesen');
      
      // Setup speech controller with plain text
      speechController.setup(plainText, allWords, ttsButton);
      
      // Add click handler
      ttsButton.addEventListener('click', () => {
        speechController.toggle();
      });

      // Add button before translation
      translationContainer.insertBefore(ttsButton, translationContainer.firstChild);

      this.content.appendChild(translationContainer);

      // Create rating container
      const ratingContainer = document.createElement('div');
      ratingContainer.className = 'klartext-rating';

      // Add rating label
      const ratingLabel = document.createElement('div');
      ratingLabel.className = 'klartext-rating-label';
      ratingLabel.textContent = 'Wie gut ist diese Übersetzung?';
      ratingContainer.appendChild(ratingLabel);

      // Create stars container
      const starsContainer = document.createElement('div');
      starsContainer.className = 'klartext-stars';
      ratingContainer.appendChild(starsContainer);

      // Create feedback button (hidden by default)
      const feedbackButton = document.createElement('button');
      feedbackButton.className = 'klartext-feedback';
      feedbackButton.textContent = 'Mitteilung senden';
      feedbackButton.setAttribute('aria-label', 'Mitteilung zur Übersetzung geben');

      // Create and add stars
      const stars = [];
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'klartext-star';
        star.textContent = '★';
        star.setAttribute('role', 'button');
        star.setAttribute('aria-label', `${i} Sterne`);
        star.setAttribute('data-rating', i);

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

          // Store rating
          try {
            await chrome.storage.local.set({
              [`rating_${Date.now()}`]: {
                rating: i,
                text: translation,
                url: window.location.href
              }
            });
          } catch (error) {
            console.error('Error storing rating:', error);
          }

          // Show feedback button for low ratings
          if (i < 3) {
            feedbackButton.classList.add('visible');
          } else {
            feedbackButton.classList.remove('visible');
          }
        });

        stars.push(star);
        starsContainer.appendChild(star);
      }

      // Mouse leave handler for stars container
      starsContainer.addEventListener('mouseleave', () => {
        stars.forEach(s => s.classList.remove('hover'));
      });

      // Add feedback button click handler
      feedbackButton.addEventListener('click', async () => {
        try {
          const originalText = window.getSelection().toString();
          const provider = await new Promise(resolve => {
            chrome.storage.sync.get(['provider', 'model'], items => {
              resolve(`${items.provider || 'unknown'} (${items.model || 'unknown'})`);
            });
          });

          const issueTitle = encodeURIComponent('Feedback: Übersetzung in Leichte Sprache');
          const issueBody = encodeURIComponent(
            `## Feedback zur Übersetzung\n\n` +
            `### Originaltext\n\`\`\`\n${originalText}\n\`\`\`\n\n` +
            `### Übersetzung\n\`\`\`\n${translation}\n\`\`\`\n\n` +
            `### Feedback\n[Bitte beschreiben Sie hier Ihr Feedback zur Übersetzung]\n\n` +
            `### Technische Details\n` +
            `- Extension: ${chrome.runtime.getManifest().name}\n` +
            `- Version: ${chrome.runtime.getManifest().version}\n` +
            `- URL: ${window.location.href}\n` +
            `- Provider: ${provider}\n`
          );

          window.open(
            `${REPO_URL}/issues/new?title=${issueTitle}&body=${issueBody}`,
            '_blank'
          );
        } catch (error) {
          console.error('Error creating feedback:', error);
          this.showError('Fehler beim Erstellen des Feedbacks');
        }
      });
      // Add components to overlay
      this.content.appendChild(ratingContainer);
      this.content.appendChild(feedbackButton);

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

  showError(message) {
    try {
      // Clear previous content
      this.content.innerHTML = '';

      // Create error container
      const errorContainer = document.createElement('div');
      errorContainer.className = 'klartext-error';
      
      // Add error message
      const errorTitle = document.createElement('p');
      errorTitle.textContent = 'Entschuldigung, es gab einen Fehler:';
      errorContainer.appendChild(errorTitle);
      
      const errorMessage = document.createElement('p');
      errorMessage.textContent = message;
      errorContainer.appendChild(errorMessage);
      
      this.content.appendChild(errorContainer);

      // Create feedback button
      const feedbackButton = document.createElement('button');
      feedbackButton.className = 'klartext-feedback';
      feedbackButton.textContent = 'Fehler melden';
      feedbackButton.setAttribute('aria-label', 'Diesen Fehler melden');
      feedbackButton.addEventListener('click', async () => {
        try {
          const provider = await new Promise(resolve => {
            chrome.storage.sync.get(['provider', 'model'], items => {
              resolve(`${items.provider || 'unknown'} (${items.model || 'unknown'})`);
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
            `- Provider: ${provider}\n\n` +
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
      });
      this.content.appendChild(feedbackButton);

      // Show overlay and backdrop with animation
      this.backdrop.classList.add('visible');
      this.overlay.classList.add('visible');
    } catch (error) {
      console.error('Error showing error message:', error);
    }
  }

  hide() {
    speechController.stop();
    this.overlay.classList.remove('visible');
    this.backdrop.classList.remove('visible');
  }

  isVisible() {
    return this.overlay.classList.contains('visible');
  }
}

// Initialize overlay instance
const overlay = new TranslationOverlay();

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  try {
    switch (message.action) {
      case 'ping':
        // Only ping messages need a response
        sendResponse({ status: 'ok' });
        return false; // No async response needed

      case 'startArticleMode':
        console.log('Starting article mode');
        startArticleMode();
        break;

      case 'startFullPageMode':
        console.log('Starting full page translation mode');
        startFullPageMode();
        break;

      case 'startTranslation':
        console.log('Starting translation, showing loading state');
        overlay.showLoading();
        break;

      case 'showTranslation':
        console.log('Showing translation:', message.translation);
        if (isFullPageMode && pageTranslator) {
          overlay.appendTranslation(message.translation, message.id);
          // Move to next section
          pageTranslator.currentSection++;
          // Continue translation
          pageTranslator.translateNextSection().catch(error => {
            console.error('Error continuing translation:', error);
            overlay.showError(error.message);
          });
        } else {
          overlay.show(message.translation);
        }
        break;

      case 'showError':
        console.error('Showing error:', message.error);
        overlay.showError(message.error);
        stopArticleMode();
        stopFullPageMode();
        break;

      case 'updateSettings':
        console.log('Updating settings:', message.settings);
        if (message.settings.compareView !== undefined && pageTranslator) {
          pageTranslator.compareView = message.settings.compareView;
          overlay.toggleCompareView(message.settings.compareView);
        }
        if (message.settings.excludeComments !== undefined && pageTranslator) {
          pageTranslator.excludeComments = message.settings.excludeComments;
        }
        if (message.settings.textSize) {
          // Remove any existing text size classes
          document.body.classList.remove('klartext-text-normal', 'klartext-text-gross', 'klartext-text-sehr-gross');
          // Add new text size class
          document.body.classList.add(`klartext-text-${message.settings.textSize}`);
        }
        break;

      default:
        console.warn('Unknown message action:', message.action);
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }

  // No response needed for non-ping messages
  return false;
});

// Article mode functions
function startArticleMode() {
  if (isArticleMode) return;
  isArticleMode = true;
  
  // Add mousemove listener
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleArticleClick);
  
  // Change cursor to indicate clickable state
  document.body.style.cursor = 'pointer';
}

function stopArticleMode() {
  if (!isArticleMode) return;
  isArticleMode = false;
  
  // Remove listeners
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleArticleClick);
  
  // Reset cursor
  document.body.style.cursor = '';
  
  // Remove any existing highlight
  if (currentHighlight) {
    currentHighlight.classList.remove('klartext-highlight');
    currentHighlight = null;
  }
}

function handleMouseMove(event) {
  if (!isArticleMode) return;
  
  // Find potential article container under cursor
  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (!element) return;
  
  // Find closest matching container
  const container = ARTICLE_SELECTORS.reduce((closest, selector) => {
    if (closest) return closest;
    return element.closest(selector);
  }, null);
  
  // Update highlight
  if (container !== currentHighlight) {
    if (currentHighlight) {
      currentHighlight.classList.remove('klartext-highlight');
    }
    if (container) {
      container.classList.add('klartext-highlight');
    }
    currentHighlight = container;
  }
}

function handleArticleClick(event) {
  if (!isArticleMode || !currentHighlight) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  // Get HTML content
  const html = currentHighlight.innerHTML;
  if (!html.trim()) return;
  
  // Stop article mode
  stopArticleMode();
  
  // Show loading state
  overlay.showLoading();
  
  // Send HTML to background script
  chrome.runtime.sendMessage({
    action: 'translateArticle',
    html: html
  });
}

// Start full page translation mode
function startFullPageMode() {
  if (isFullPageMode) return;
  isFullPageMode = true;
  
  // Initialize page translator
  pageTranslator = new PageTranslator();
  pageTranslator.initialize().catch(error => {
    console.error('Error initializing page translator:', error);
    overlay.showError(error.message);
    stopFullPageMode();
  });
}

// Stop full page translation mode
function stopFullPageMode() {
  if (!isFullPageMode) return;
  isFullPageMode = false;
  pageTranslator = null;
}

// Log when content script is loaded
console.log('Klartext content script loaded');
