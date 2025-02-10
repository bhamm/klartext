// Singleton overlay instance
let overlayInstance = null;

// Create and manage overlay
class TranslationOverlay {
  constructor() {
    if (overlayInstance) {
      return overlayInstance;
    }
    
    this.overlay = null;
    this.content = null;
    this.closeButton = null;
    this.setupOverlay();
    overlayInstance = this;
  }

  setupOverlay() {
    try {
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

// Initialize overlay instance
const overlay = new TranslationOverlay();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  if (message.action === 'ping') {
    // Respond to ping to indicate content script is loaded
    sendResponse({ status: 'ok' });
  } else if (message.action === 'showTranslation') {
    console.log('Showing translation:', message.translation);
    overlay.show(message.translation);
  } else if (message.action === 'showError') {
    console.error('Showing error:', message.error);
    overlay.showError(message.error);
  } else if (message.action === 'updateTextSize') {
    console.log('Updating text size:', message.largeText);
    document.body.classList.toggle('klartext-large-text', message.largeText);
  }

  // Return true if we need to send a response asynchronously
  return message.action === 'ping';
});

// Log when content script is loaded
console.log('Klartext content script loaded');
