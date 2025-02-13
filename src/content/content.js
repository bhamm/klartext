// Constants
const REPO_URL = 'https://github.com/bhamm/klartext';

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

  show(translation) {
    try {
      console.log('Showing translation overlay');
      
      // Clear previous content
      this.content.innerHTML = '';

      // Create and append translation container
      const translationContainer = document.createElement('div');
      translationContainer.className = 'klartext-translation';
      translationContainer.setAttribute('aria-label', 'Übersetzung in Leichte Sprache');

      // Process translation text
      const paragraphs = translation.split(/\n\n+/); // Split on multiple newlines
      paragraphs.forEach(paragraph => {
        if (paragraph.trim()) {
          const p = document.createElement('p');
          p.textContent = paragraph.trim().replace(/\s+/g, ' '); // Remove extra whitespace
          translationContainer.appendChild(p);
        }
      });

      this.content.appendChild(translationContainer);

      // Create rating container
      const ratingContainer = document.createElement('div');
      ratingContainer.className = 'klartext-rating';

      // Add rating label
      const ratingLabel = document.createElement('div');
      ratingLabel.className = 'klartext-rating-label';
      ratingLabel.textContent = 'Wie gut war diese Übersetzung?';
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
    this.overlay.classList.remove('visible');
    this.backdrop.classList.remove('visible');
  }

  isVisible() {
    return this.overlay.classList.contains('visible');
  }
}

// Initialize overlay instance
const overlay = new TranslationOverlay();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  try {
    switch (message.action) {
      case 'ping':
        // Only ping messages need a response
        sendResponse({ status: 'ok' });
        return false; // No async response needed

      case 'startTranslation':
        console.log('Starting translation, showing loading state');
        overlay.showLoading();
        break;

      case 'showTranslation':
        console.log('Showing translation:', message.translation);
        overlay.show(message.translation);
        break;

      case 'showError':
        console.error('Showing error:', message.error);
        overlay.showError(message.error);
        break;

      case 'updateTextSize':
        console.log('Updating text size:', message.largeText);
        document.body.classList.toggle('klartext-large-text', message.largeText);
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

// Log when content script is loaded
console.log('Klartext content script loaded');
