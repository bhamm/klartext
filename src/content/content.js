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
let overlayInstance = null;

// Create and manage overlay for article mode
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
      this.overlay.setAttribute('tabindex', '-1');

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

// Floating controls for full page translation
class TranslationControls {
  constructor() {
    this.container = null;
    this.progressBar = null;
    this.progressText = null;
    this.viewToggle = null;
    this.ttsButton = null;
    this.minimizeButton = null;
    this.isMinimized = false;
    this.setupControls();
  }

  setupControls() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'klartext-controls';

    // Create header
    const header = document.createElement('div');
    header.className = 'klartext-controls-header';

    // Create title
    const title = document.createElement('div');
    title.textContent = 'Leichte Sprache';

    // Create minimize button
    this.minimizeButton = document.createElement('button');
    this.minimizeButton.className = 'klartext-minimize-button';
    this.minimizeButton.innerHTML = '⟪';
    this.minimizeButton.onclick = () => this.toggleMinimize();

    header.appendChild(title);
    header.appendChild(this.minimizeButton);

    // Create progress container
    const progressContainer = document.createElement('div');
    progressContainer.className = 'klartext-progress-container';

    // Create progress bar
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'klartext-progress-bar';
    this.progressBar.innerHTML = '<div class="klartext-progress-fill"></div>';

    // Create progress text
    this.progressText = document.createElement('div');
    this.progressText.className = 'klartext-progress-text';

    progressContainer.appendChild(this.progressBar);
    progressContainer.appendChild(this.progressText);

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'klartext-controls-buttons';

    // Create view toggle button
    this.viewToggle = document.createElement('button');
    this.viewToggle.className = 'klartext-view-toggle';
    this.viewToggle.textContent = 'Original anzeigen';
    this.viewToggle.onclick = () => this.toggleView();

    // Create TTS button
    this.ttsButton = document.createElement('button');
    this.ttsButton.className = 'klartext-tts-button';
    this.ttsButton.innerHTML = PLAY_ICON + 'Vorlesen';

    buttonsContainer.appendChild(this.viewToggle);
    buttonsContainer.appendChild(this.ttsButton);

    // Add all elements to container
    this.container.appendChild(header);
    this.container.appendChild(progressContainer);
    this.container.appendChild(buttonsContainer);

    // Add to document
    document.body.appendChild(this.container);
  }

  updateProgress(current, total) {
    const progress = this.progressBar.querySelector('.klartext-progress-fill');
    progress.style.width = `${(current/total) * 100}%`;
    this.progressText.textContent = `Übersetze Abschnitt ${current}/${total}`;
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.container.classList.toggle('minimized', this.isMinimized);
    this.minimizeButton.innerHTML = this.isMinimized ? '⟫' : '⟪';
  }

  toggleView() {
    const showingOriginal = this.viewToggle.textContent === 'Übersetzung anzeigen';
    this.viewToggle.textContent = showingOriginal ? 'Original anzeigen' : 'Übersetzung anzeigen';
    document.querySelectorAll('.klartext-section').forEach(section => {
      const originalContent = section.getAttribute('data-original');
      const translatedContent = section.getAttribute('data-translation');
      
      if (showingOriginal) {
        section.innerHTML = originalContent;
      } else {
        section.innerHTML = translatedContent || section.innerHTML;
      }
    });
  }

  show() {
    this.container.style.display = 'block';
  }

  hide() {
    this.container.style.display = 'none';
  }

  setupTTS(text, words) {
    speechController.setup(text, words, this.ttsButton);
    this.ttsButton.onclick = () => speechController.toggle();
  }
}

// Controls instance
let controls = null;

// Page translator class
class PageTranslator {
  constructor() {
    this.sections = [];
    this.currentSection = 0;
  }

  async initialize() {
    try {
      console.log('Initializing page translator');
      
      // Find all content sections
      this.sections = this.getContentSections();
      console.log(`Found ${this.sections.length} sections to translate`);
      
      if (this.sections.length === 0) {
        throw new Error('Keine übersetzbaren Inhalte gefunden. Bitte wählen Sie einen Artikel oder Text aus.');
      }
      
      // Show controls and start translation
      controls.show();
      controls.updateProgress(0, this.sections.length);
      await this.translateNextSection();
      
    } catch (error) {
      console.error('Error initializing page translator:', error);
      this.showError(error.message);
      throw error; // Re-throw to trigger error handling in startFullPageMode
    }
  }
  
  getContentSections() {
    console.log('Finding content sections');
    
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
    
    // Selectors for elements to exclude
    const excludeSelectors = [
      // Comments
      '#comments', '.comments', '.comment-section',
      '[data-component="comments"]', '.comment-list',
      // Social media and sharing
      '.social', '.share', '.sharing', '.social-media',
      '[class*="share-"], [class*="social-"]',
      // Navigation and UI elements
      '.nav', '.navigation', '.menu', '.toolbar',
      '.header', '.footer', '.sidebar',
      // Ads and promotional content
      '.ad', '.advertisement', '.promo', '.sponsored',
      // Interactive elements
      '.widget', '.tool', '.interactive',
      // Specific sharing elements
      '.shariff', '.shariff-button', '.social-media-title',
      // Other non-content elements
      '.related', '.recommendations', '.newsletter',
      '[role="complementary"]'
    ];

    // Content-specific class indicators
    const contentClassPatterns = [
      'text', 'content', 'article', 'story', 'post',
      'body', 'entry', 'main', 'description'
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
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        // Found main container, use only these elements
        const validElements = Array.from(elements).filter(el => {
          const text = el.innerText.trim();
          return text.length > 0 && text.split(/\s+/).length > 10; // Ensure it has meaningful content
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
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const validElements = Array.from(elements).filter(el => {
            const text = el.innerText.trim();
            return text.length > 0 && text.split(/\s+/).length > 5; // Ensure paragraph has meaningful content
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
      if (!text || text.split(/\s+/).length < 5) {
        return false;
      }

      // Check if section should be excluded
      const shouldExclude = excludeSelectors.some(sel => 
        section.matches(sel) || section.closest(sel)
      );
      if (shouldExclude) {
        console.log('Excluding non-content section:', text.substring(0, 50) + '...');
        return false;
      }

      // Validate section has content-related classes
      const classes = Array.from(section.classList || []);
      const hasContentClass = contentClassPatterns.some(pattern => 
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
      const chunks = splitIntoChunks(section);
      return chunks.map(chunk => ({
        originalSection: section,
        content: chunk.innerHTML
      }));
    }).flat();
    
    console.log(`Split into ${chunkedSections.length} chunks`);
    console.log(`Final section count after filtering: ${chunkedSections.length}`);
    return chunkedSections;
  }
  
  async translateNextSection() {
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
        controls.updateProgress(this.currentSection + 1, this.sections.length);
        
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

  appendTranslation(translation, id) {
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
      this.showError(error.message);
    }
  }

  completeTranslation() {
    // Get all text for speech
    const textNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: node => {
          if (node.parentElement.closest('.original')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let plainText = '';
    let node;
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
    
    // Setup TTS
    controls.setupTTS(plainText, allWords);
  }

  showError(message) {
    console.error('Translation error:', message);
    alert(`Fehler bei der Übersetzung: ${message}`);
    stopFullPageMode();
  }
}

// Initialize overlay instance for article mode
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
        if (isFullPageMode) {
          if (controls) {
            controls.show();
          }
        } else {
          // Initialize overlay if not already done
          if (!overlayInstance) {
            overlay = new TranslationOverlay();
          }
          overlay.showLoading();
        }
        break;

      case 'showTranslation':
        console.log('Showing translation:', message.translation);
        if (isFullPageMode && pageTranslator) {
          pageTranslator.appendTranslation(message.translation, message.id);
        } else {
          overlay.show(message.translation);
        }
        break;

      case 'showError':
        console.error('Showing error:', message.error);
        if (isFullPageMode && pageTranslator) {
          pageTranslator.showError(message.error);
        } else {
          overlay.showError(message.error);
        }
        stopArticleMode();
        stopFullPageMode();
        break;

      case 'updateSettings':
        console.log('Updating settings:', message.settings);
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
  
  // Get and clean HTML content
  const html = currentHighlight.innerHTML;
  if (!html.trim()) return;
  
  // Stop article mode
  stopArticleMode();
  
  // Show loading state
  overlay.showLoading();
  
  // Clean HTML before sending
  const cleanedHtml = cleanArticleHTML(html);
  
  // Send cleaned HTML to background script
  chrome.runtime.sendMessage({
    action: 'translateArticle',
    html: cleanedHtml
  });
}

// Clean HTML for article translation
function cleanArticleHTML(html) {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove script tags
  const scripts = tempDiv.getElementsByTagName('script');
  while (scripts.length > 0) {
    scripts[0].parentNode.removeChild(scripts[0]);
  }
  
  // Remove style tags
  const styles = tempDiv.getElementsByTagName('style');
  while (styles.length > 0) {
    styles[0].parentNode.removeChild(styles[0]);
  }
  
  // Remove SVG elements
  const svgs = tempDiv.getElementsByTagName('svg');
  while (svgs.length > 0) {
    svgs[0].parentNode.removeChild(svgs[0]);
  }
  
  // Remove iframes
  const iframes = tempDiv.getElementsByTagName('iframe');
  while (iframes.length > 0) {
    iframes[0].parentNode.removeChild(iframes[0]);
  }
  
  // Convert images to alt text or remove them
  const images = tempDiv.getElementsByTagName('img');
  Array.from(images).forEach(img => {
    if (img.alt) {
      const textNode = document.createTextNode(`[Bild: ${img.alt}]`);
      img.parentNode.replaceChild(textNode, img);
    } else {
      img.parentNode.removeChild(img);
    }
  });
  
  // Convert links to plain text
  const links = tempDiv.getElementsByTagName('a');
  Array.from(links).forEach(link => {
    const textNode = document.createTextNode(link.textContent);
    link.parentNode.replaceChild(textNode, link);
  });
  
  // Remove all event handlers
  const allElements = tempDiv.getElementsByTagName('*');
  Array.from(allElements).forEach(element => {
    // Remove all event handler attributes
    const attrs = element.attributes;
    for (let i = attrs.length - 1; i >= 0; i--) {
      if (attrs[i].name.startsWith('on')) {
        element.removeAttribute(attrs[i].name);
      }
    }
  });
  
  // Remove all elements except allowed ones
  const allowedTags = ['article', 'section', 'main', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i'];
  
  function cleanNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (!allowedTags.includes(node.tagName.toLowerCase())) {
        // Check if node has a parent before replacing
        if (node.parentNode) {
          // Replace element with its text content
          const textContent = node.textContent;
          const textNode = document.createTextNode(textContent);
          node.parentNode.replaceChild(textNode, node);
        }
        return;
      }
      
      // Clean children recursively
      Array.from(node.childNodes).forEach(child => cleanNode(child));
      
      // Remove all attributes except essential ones
      const attrs = node.attributes;
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attrName = attrs[i].name;
        if (!['class', 'id'].includes(attrName)) {
          node.removeAttribute(attrName);
        }
      }
    }
  }
  
  // Clean the entire content
  cleanNode(tempDiv);
  
  // Return cleaned HTML
  return tempDiv.innerHTML;
}

// Start full page translation mode
async function startFullPageMode() {
  if (isFullPageMode) return;
  isFullPageMode = true;
  
  // Initialize controls and page translator
  controls = new TranslationControls();
  pageTranslator = new PageTranslator();
  
  try {
    await pageTranslator.initialize();
  } catch (error) {
    console.error('Error initializing page translator:', error);
    pageTranslator.showError(error.message);
    stopFullPageMode();
  }
}

// Stop full page translation mode
function stopFullPageMode() {
  if (!isFullPageMode) return;
  isFullPageMode = false;
  pageTranslator = null;
  if (controls) {
    controls.hide();
    controls = null;
  }
}

// Log when content script is loaded
console.log('Klartext content script loaded');
