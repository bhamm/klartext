// Export for testing
let overlayInstance = null;

// Create and manage overlay
class TranslationOverlay {
  constructor() {
    if (overlayInstance) {
      return overlayInstance;
    }
    
    // Initialize instance
    overlayInstance = this;
    this.overlay = null;
    this.content = null;
    this.closeButton = null;
    this.setupOverlay();
    
    // Return singleton instance
    return overlayInstance;
  }

  setupOverlay() {
    try {
      // Check if overlay already exists
      if (document.querySelector('.klartext-overlay')) {
        return;
      }
      
      console.log('Setting up Klartext overlay');
      
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
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          console.log('Clicked outside content, hiding overlay');
          this.hide();
        }
      });

      // Add overlay to document
      document.body.appendChild(this.overlay);
      console.log('Overlay setup complete');
    } catch (error) {
      console.error('Error setting up overlay:', error);
      throw new Error('Failed to setup translation overlay');
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
      translationContainer.textContent = translation;
      translationContainer.setAttribute('aria-label', 'Übersetzung in Leichte Sprache');
      this.content.appendChild(translationContainer);

      // Create feedback button
      const feedbackButton = document.createElement('button');
      feedbackButton.className = 'klartext-feedback';
      feedbackButton.textContent = 'Feedback geben';
      feedbackButton.setAttribute('aria-label', 'Feedback zur Übersetzung geben');
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
            `https://github.com/borishamm/klartext/issues/new?title=${issueTitle}&body=${issueBody}`,
            '_blank'
          );
        } catch (error) {
          console.error('Error creating feedback:', error);
          this.showError('Fehler beim Erstellen des Feedbacks');
        }
      });
      this.content.appendChild(feedbackButton);

      // Show overlay with animation
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
    this.content.innerHTML = `
      <div class="klartext-error">
        <p>Entschuldigung, es gab einen Fehler:</p>
        <p>${message}</p>
      </div>
    `;
    this.overlay.classList.add('visible');
  }

  hide() {
    this.overlay.classList.remove('visible');
  }

  isVisible() {
    return this.overlay.classList.contains('visible');
  }
}

// Initialize overlay instance for production use
const overlay = new TranslationOverlay();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  // Parse message if it's a string
  let parsedMessage = message;
  if (typeof message === 'string') {
    try {
      parsedMessage = JSON.parse(message);
    } catch (error) {
      console.error('Error parsing message:', error);
      overlay.showError(error.message);
      return;
    }
  }

  if (parsedMessage.action === 'ping') {
    // Respond to ping to indicate content script is loaded
    sendResponse({ status: 'ok' });
  } else if (parsedMessage.action === 'showTranslation') {
    console.log('Showing translation:', parsedMessage.translation);
    overlay.show(parsedMessage.translation);
  } else if (parsedMessage.action === 'showError') {
    console.error('Showing error:', parsedMessage.error);
    overlay.showError(parsedMessage.error);
  } else if (parsedMessage.action === 'updateTextSize') {
    console.log('Updating text size:', parsedMessage.largeText);
    document.body.classList.toggle('klartext-large-text', parsedMessage.largeText);
  }

  // Return true if we need to send a response asynchronously
  return message.action === 'ping';
});

// Log when content script is loaded
console.log('Klartext content script loaded');
