/**
 * Translation controls UI component for the Klartext extension
 */
import { PLAY_ICON, PAUSE_ICON } from '../constants.js';
import { createElement } from '../utils/dom-utils.js';
import { speechController } from '../controllers/speech-controller.js';

/**
 * Floating controls for full page translation
 */
export class TranslationControls {
  /**
   * Create a new TranslationControls
   */
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

  /**
   * Set up the controls elements
   */
  setupControls() {
    // Create container
    this.container = createElement('div', {
      className: 'klartext-controls'
    });

    // Create header
    const header = createElement('div', {
      className: 'klartext-controls-header'
    });

    // Create title
    const title = createElement('div', {
      textContent: 'Leichte Sprache'
    });

    // Create minimize button
    this.minimizeButton = createElement('button', {
      className: 'klartext-minimize-button',
      innerHTML: '⟪',
      onclick: () => this.toggleMinimize()
    });

    header.appendChild(title);
    header.appendChild(this.minimizeButton);

    // Create progress container
    const progressContainer = createElement('div', {
      className: 'klartext-progress-container'
    });

    // Create progress bar
    this.progressBar = createElement('div', {
      className: 'klartext-progress-bar',
      innerHTML: '<div class="klartext-progress-fill"></div>'
    });

    // Create progress text
    this.progressText = createElement('div', {
      className: 'klartext-progress-text'
    });

    progressContainer.appendChild(this.progressBar);
    progressContainer.appendChild(this.progressText);

    // Create buttons container
    const buttonsContainer = createElement('div', {
      className: 'klartext-controls-buttons'
    });

    // Create view toggle button
    this.viewToggle = createElement('button', {
      className: 'klartext-view-toggle',
      textContent: 'Original anzeigen',
      onclick: () => this.toggleView()
    });

    // Create TTS button
    this.ttsButton = createElement('button', {
      className: 'klartext-tts-button',
      innerHTML: PLAY_ICON + 'Vorlesen'
    });

    buttonsContainer.appendChild(this.viewToggle);
    buttonsContainer.appendChild(this.ttsButton);

    // Add all elements to container
    this.container.appendChild(header);
    this.container.appendChild(progressContainer);
    this.container.appendChild(buttonsContainer);

    // Add to document
    document.body.appendChild(this.container);
    
    // Initially hide the container
    this.container.style.display = 'none';
  }

  /**
   * Update the progress bar and text
   * @param {number} current - Current section number
   * @param {number} total - Total number of sections
   */
  updateProgress(current, total) {
    const progress = this.progressBar.querySelector('.klartext-progress-fill');
    progress.style.width = `${(current/total) * 100}%`;
    this.progressText.textContent = `Übersetze Abschnitt ${current}/${total}`;
  }

  /**
   * Toggle between minimized and expanded states
   */
  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.container.classList.toggle('minimized', this.isMinimized);
    this.minimizeButton.innerHTML = this.isMinimized ? '⟫' : '⟪';
  }

  /**
   * Toggle between original and translated views
   */
  toggleView() {
    const showingOriginal = this.viewToggle.textContent === 'Übersetzung anzeigen';
    this.viewToggle.textContent = showingOriginal ? 'Original anzeigen' : 'Übersetzung anzeigen';
    
    document.querySelectorAll('.klartext-section').forEach(section => {
      const originalContent = section.getAttribute('data-original');
      const translatedContent = section.getAttribute('data-translation');
      
      if (showingOriginal) {
        section.innerHTML = translatedContent || section.innerHTML;
      } else {
        section.innerHTML = originalContent;
      }
    });
  }

  /**
   * Show the controls
   */
  show() {
    this.container.style.display = 'block';
  }

  /**
   * Hide the controls
   */
  hide() {
    this.container.style.display = 'none';
  }

  /**
   * Set up text-to-speech functionality
   * @param {string} text - The text to speak
   * @param {string[]} words - Array of words for highlighting
   */
  setupTTS(text, words) {
    speechController.setup(text, words, this.ttsButton);
    this.ttsButton.onclick = () => speechController.toggle();
  }
}

// Create and export a singleton instance
export const translationControls = new TranslationControls();
