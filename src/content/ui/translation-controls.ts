/**
 * Translation controls UI component for the Klartext extension
 */
import { PLAY_ICON, PAUSE_ICON } from '../constants';
import { createElement } from '../utils/dom-utils';
import { speechController } from '../controllers/speech-controller';
import { TranslationControlsInterface } from '../types';

/**
 * Floating controls for full page translation
 */
export class TranslationControls implements TranslationControlsInterface {
  container: HTMLElement | null;
  progressBar: HTMLElement | null;
  progressText: HTMLElement | null;
  viewToggle: HTMLElement | null;
  ttsButton: HTMLElement | null;
  minimizeButton: HTMLElement | null;
  isMinimized: boolean;

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
  setupControls(): void {
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
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Update the progress bar and text
   * @param {number} current - Current section number
   * @param {number} total - Total number of sections
   */
  updateProgress(current: number, total: number): void {
    if (this.progressBar) {
      const progress = this.progressBar.querySelector('.klartext-progress-fill') as HTMLElement;
      if (progress) {
        progress.style.width = `${(current/total) * 100}%`;
      }
    }
    
    if (this.progressText) {
      this.progressText.textContent = `Übersetze Abschnitt ${current}/${total}`;
    }
  }

  /**
   * Toggle between minimized and expanded states
   */
  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
    
    if (this.container) {
      this.container.classList.toggle('minimized', this.isMinimized);
    }
    
    if (this.minimizeButton) {
      this.minimizeButton.innerHTML = this.isMinimized ? '⟫' : '⟪';
    }
  }

  /**
   * Toggle between original and translated views
   */
  toggleView(): void {
    if (!this.viewToggle) return;
    
    const showingOriginal = this.viewToggle.textContent === 'Übersetzung anzeigen';
    this.viewToggle.textContent = showingOriginal ? 'Original anzeigen' : 'Übersetzung anzeigen';
    
    document.querySelectorAll('.klartext-section').forEach(section => {
      const originalContent = section.getAttribute('data-original');
      const translatedContent = section.getAttribute('data-translation');
      
      if (showingOriginal && translatedContent) {
        section.innerHTML = translatedContent;
      } else if (originalContent) {
        section.innerHTML = originalContent;
      }
    });
  }

  /**
   * Show the controls
   */
  show(): void {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  /**
   * Hide the controls
   */
  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Set up text-to-speech functionality
   * @param {string} text - The text to speak
   * @param {string[]} words - Array of words for highlighting
   */
  setupTTS(text: string, words: string[]): void {
    if (this.ttsButton) {
      speechController.setup(text, words, this.ttsButton);
      this.ttsButton.onclick = () => speechController.toggle();
    }
  }
}

// Create and export a singleton instance
export const translationControls = new TranslationControls();
