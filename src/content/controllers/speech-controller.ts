/**
 * Speech synthesis controller for the Klartext extension
 */
import { PLAY_ICON, PAUSE_ICON } from '../constants';
import { SpeechControllerInterface } from '../types';

/**
 * Controller for text-to-speech functionality
 */
export class SpeechController implements SpeechControllerInterface {
  utterance: SpeechSynthesisUtterance | null;
  words: string[];
  isPlaying: boolean;
  button: HTMLElement | null;
  debugMode: boolean;

  /**
   * Create a new SpeechController
   */
  constructor() {
    this.utterance = null;
    this.words = [];
    this.isPlaying = false;
    this.button = null;
    this.debugMode = false; // Disable debug logging by default
  }

  /**
   * Set up the speech controller with text and button
   * @param {string} text - The text to speak
   * @param {string[]} words - Array of words for highlighting
   * @param {HTMLElement} button - The button element to control playback
   */
  setup(text: string, words: string[], button: HTMLElement): void {
    this.words = words;
    this.button = button;
    
    // Log for debugging
    if (this.debugMode) {
      console.log('Setting up speech with', words.length, 'words');
    }
    
    // Create utterance
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = 'de-DE';
    this.utterance.rate = 0.9;
    
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

  /**
   * Start speech synthesis
   */
  start(): void {
    if (!this.utterance) return;
    
    this.isPlaying = true;
    this.updateButtonState(true);
    
    // Start speech
    speechSynthesis.speak(this.utterance);
  }

  /**
   * Pause speech synthesis
   */
  pause(): void {
    speechSynthesis.pause();
    this.isPlaying = false;
    this.updateButtonState(false);
  }

  /**
   * Resume speech synthesis
   */
  resume(): void {
    speechSynthesis.resume();
    this.isPlaying = true;
    this.updateButtonState(true);
  }

  /**
   * Stop speech synthesis
   */
  stop(): void {
    speechSynthesis.cancel();
    this.isPlaying = false;
    
    // Reset button
    if (this.button) {
      this.updateButtonState(false);
    }
  }

  /**
   * Toggle between play and pause
   */
  toggle(): void {
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

  /**
   * Update the button state based on playing status
   * @param {boolean} isPlaying - Whether speech is currently playing
   */
  updateButtonState(isPlaying: boolean): void {
    if (!this.button) return;
    
    if (isPlaying) {
      this.button.innerHTML = PAUSE_ICON + 'Pause';
      this.button.classList.add('playing');
    } else {
      this.button.innerHTML = PLAY_ICON + 'Vorlesen';
      this.button.classList.remove('playing');
    }
  }
}

// Create and export a singleton instance
export const speechController = new SpeechController();
