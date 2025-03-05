/**
 * Speech synthesis controller for the Klartext extension
 */
import { PLAY_ICON, PAUSE_ICON } from '../constants';
import { SpeechControllerInterface } from '../types';
import { SpeechSettings } from '../../shared/types/settings';

/**
 * Controller for text-to-speech functionality
 */
export class SpeechController implements SpeechControllerInterface {
  utterance: SpeechSynthesisUtterance | null;
  words: string[];
  isPlaying: boolean;
  button: HTMLElement | null;
  debugMode: boolean;
  
  // Speech settings
  availableVoices: SpeechSynthesisVoice[] = [];
  selectedVoiceURI: string = '';
  rate: number = 0.9;
  pitch: number = 1.0;
  useGoogleTTS: boolean = false;

  /**
   * Create a new SpeechController
   */
  constructor() {
    this.utterance = null;
    this.words = [];
    this.isPlaying = false;
    this.button = null;
    this.debugMode = true; // Enable debug logging to diagnose issues
    
    // Initialize voices
    this.loadVoices();
    
    // Handle voices changing (happens asynchronously in some browsers)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
    }
    
    // Ensure speech is stopped when page unloads
    window.addEventListener('beforeunload', () => {
      this.stop();
    });
    
    // Periodically check if speech synthesis is still active when it shouldn't be
    setInterval(() => {
      if (!this.isPlaying && speechSynthesis.speaking) {
        console.log('Speech synthesis still active when it should be stopped, forcing stop');
        speechSynthesis.cancel();
      }
    }, 5000);
  }
  
  /**
   * Load available voices for German
   * @returns Promise that resolves when voices are loaded
   */
  loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      // Function to process voices once they're available
      const processVoices = () => {
        const allVoices = speechSynthesis.getVoices();
        
        if (this.debugMode) {
          console.log('All available voices:', allVoices);
        }
        
        this.availableVoices = allVoices.filter(voice => 
          voice.lang.startsWith('de') || voice.lang === 'de-DE'
        );
        
        if (this.debugMode) {
          console.log('Available German voices:', this.availableVoices);
          console.log('Current selected voice URI:', this.selectedVoiceURI);
          
          // Log detailed information about each voice for debugging
          this.availableVoices.forEach((voice, index) => {
            console.log(`Voice ${index + 1}:`, {
              name: voice.name,
              voiceURI: voice.voiceURI,
              lang: voice.lang,
              localService: voice.localService,
              default: voice.default
            });
          });
        }
        
        // If we have a selected voice URI, check if it's still available
        if (this.selectedVoiceURI) {
          const voiceExists = this.availableVoices.some(
            voice => voice.voiceURI === this.selectedVoiceURI
          );
          
          if (!voiceExists && this.availableVoices.length > 0) {
            // If the selected voice is no longer available, use the first available voice
            this.selectedVoiceURI = this.availableVoices[0].voiceURI;
            console.log('Selected voice not available, using:', this.selectedVoiceURI);
          }
        } else if (this.availableVoices.length > 0) {
          // If no voice is selected but we have German voices, use the first one
          this.selectedVoiceURI = this.availableVoices[0].voiceURI;
          console.log('No voice selected, using first available German voice:', this.selectedVoiceURI);
        }
        
        resolve();
      };
      
      // Check if voices are already available
      const voices = speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        processVoices();
      } else {
        // If voices aren't available yet, set up the onvoiceschanged event
        speechSynthesis.onvoiceschanged = () => {
          processVoices();
        };
      }
    });
  }
  
  /**
   * Set speech settings
   * @param settings - Speech settings
   */
  async setSettings(settings: SpeechSettings): Promise<void> {
    console.log('Updating speech settings:', settings);
    
    // Store previous voice URI for comparison
    const previousVoiceURI = this.selectedVoiceURI;
    
    this.selectedVoiceURI = settings.voiceURI;
    this.rate = settings.rate || 0.9;
    this.pitch = settings.pitch || 1.0;
    this.useGoogleTTS = settings.useGoogleTTS || false;
    
    // Make sure we have the latest voices
    await this.loadVoices();
    
    // If voice changed and we're currently playing, restart with new voice
    if (previousVoiceURI !== this.selectedVoiceURI && this.isPlaying && this.utterance) {
      console.log('Voice changed while playing, restarting speech with new voice');
      const currentText = this.utterance.text;
      speechSynthesis.cancel();
      
      // Create new utterance with updated settings
      this.utterance = new SpeechSynthesisUtterance(currentText);
      this.applyVoiceSettings(this.utterance);
      
      // Resume playback
      speechSynthesis.speak(this.utterance);
    }
    
    console.log('Speech settings updated successfully');
  }

  /**
   * Apply voice settings to an utterance
   * @param utterance - The utterance to apply settings to
   */
  private applyVoiceSettings(utterance: SpeechSynthesisUtterance): void {
    utterance.lang = 'de-DE';
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    
    // Set voice if specified
    if (this.selectedVoiceURI && this.selectedVoiceURI !== '') {
      // Find the voice by URI
      const selectedVoice = this.availableVoices.find(
        voice => voice.voiceURI === this.selectedVoiceURI
      );
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('Using voice:', selectedVoice.name, 'with URI:', selectedVoice.voiceURI);
      } else {
        console.log('Selected voice not found, using default');
        
        // Try to find a voice by name if URI doesn't work
        const germanVoices = this.availableVoices.filter(voice => 
          voice.lang.startsWith('de') || voice.lang === 'de-DE'
        );
        
        if (germanVoices.length > 0) {
          utterance.voice = germanVoices[0];
          console.log('Fallback to first German voice:', germanVoices[0].name);
        }
      }
    } else if (this.availableVoices.length > 0) {
      // If no voice is selected but we have German voices, use the first one
      utterance.voice = this.availableVoices[0];
      console.log('No voice selected, using first available German voice:', this.availableVoices[0].name);
    }
    
    if (this.debugMode) {
      console.log('Utterance configuration:', {
        voice: utterance.voice ? utterance.voice.name : 'default',
        voiceURI: utterance.voice ? utterance.voice.voiceURI : 'none',
        rate: utterance.rate,
        pitch: utterance.pitch,
        lang: utterance.lang
      });
    }
  }

  /**
   * Set up the speech controller with text and button
   * @param {string} text - The text to speak
   * @param {string[]} words - Array of words for highlighting
   * @param {HTMLElement} button - The button element to control playback
   */
  async setup(text: string, words: string[], button: HTMLElement): Promise<void> {
    this.words = words;
    this.button = button;
    
    // Force stop any ongoing speech
    this.stop();
    
    // Make sure we have the latest voices
    await this.loadVoices();
    
    // Log for debugging
    if (this.debugMode) {
      console.log('Setting up speech with', words.length, 'words');
      console.log('Current speech settings:', {
        selectedVoiceURI: this.selectedVoiceURI,
        rate: this.rate,
        pitch: this.pitch
      });
    }
    
    // Create utterance
    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice settings
    this.applyVoiceSettings(this.utterance);
    
    // Handle end of speech
    this.utterance.onend = () => {
      console.log('Speech ended normally');
      this.stop();
    };

    // Handle errors
    this.utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      
      // Log detailed error information
      const errorEvent = event as SpeechSynthesisErrorEvent;
      console.error('Error type:', errorEvent.error);
      
      // Try to recover from interrupted errors by restarting
      if (errorEvent.error === 'interrupted') {
        console.log('Speech was interrupted, attempting to restart...');
        setTimeout(() => {
          if (this.utterance && this.isPlaying) {
            speechSynthesis.speak(this.utterance);
          }
        }, 500);
      } else {
        this.stop();
      }
    };
  }
  
  /**
   * Get all available German voices
   * @returns Array of German voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  /**
   * Start speech synthesis
   */
  start(): void {
    if (!this.utterance) return;
    
    // Cancel any ongoing speech first
    this.stop();
    
    this.isPlaying = true;
    this.updateButtonState(true);
    
    // Start speech with a small delay to ensure everything is ready
    setTimeout(() => {
      if (this.utterance) {
        console.log('Starting speech synthesis...');
        
        // Ensure the voice settings are applied before speaking
        this.applyVoiceSettings(this.utterance);
        
        speechSynthesis.speak(this.utterance);
        
        // Check if speech actually started
        setTimeout(() => {
          if (this.isPlaying && !speechSynthesis.speaking) {
            console.log('Speech did not start properly, trying again...');
            speechSynthesis.cancel();
            
            // Re-apply voice settings to ensure they're set correctly
            this.applyVoiceSettings(this.utterance!);
            
            speechSynthesis.speak(this.utterance!);
          }
        }, 500);
      }
    }, 100);
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
    // Cancel speech synthesis
    speechSynthesis.cancel();
    
    // Make sure it's really stopped
    setTimeout(() => {
      if (speechSynthesis.speaking) {
        console.log('Speech still active after cancel, forcing stop again');
        speechSynthesis.cancel();
      }
    }, 100);
    
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
