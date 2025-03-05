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
  
  // Flag to track if settings have been explicitly set
  private settingsInitialized: boolean = false;
  
  // Store the current text for potential replay
  private currentText: string = '';

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
      speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
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
    
    // Try to load settings from storage
    this.loadSettingsFromStorage();
  }
  
  /**
   * Try to load speech settings from storage
   */
  private async loadSettingsFromStorage(): Promise<void> {
    try {
      // Check if we're in a context where chrome.storage is available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        console.log('Attempting to load speech settings from storage');
        
        // Load settings from storage
        chrome.storage.sync.get(['speech'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error loading speech settings from storage:', chrome.runtime.lastError);
            return;
          }
          
          if (result.speech) {
            console.log('Found speech settings in storage:', result.speech);
            this.setSettings(result.speech);
          } else {
            console.log('No speech settings found in storage');
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings from storage:', error);
    }
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
        
        // Only set default voice if no voice has been explicitly set
        if (!this.settingsInitialized) {
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
        } else {
          console.log('Settings already initialized, keeping selected voice:', this.selectedVoiceURI);
        }
        
        // If we have an utterance, make sure it has the correct voice
        if (this.utterance) {
          this.applyVoiceSettings(this.utterance);
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
    
    // Set the flag to indicate settings have been explicitly set
    this.settingsInitialized = true;
    
    // Update settings
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
    
    // If we have a current text but we're not playing, update the utterance
    if (this.currentText && !this.isPlaying) {
      this.utterance = new SpeechSynthesisUtterance(this.currentText);
      this.applyVoiceSettings(this.utterance);
    }
    
    console.log('Speech settings updated successfully, selected voice URI:', this.selectedVoiceURI);
    
    // Save settings to storage for persistence
    this.saveSettingsToStorage();
  }
  
  /**
   * Save current speech settings to storage
   */
  private saveSettingsToStorage(): void {
    try {
      // Check if we're in a context where chrome.storage is available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        const settings: SpeechSettings = {
          voiceURI: this.selectedVoiceURI,
          rate: this.rate,
          pitch: this.pitch,
          useGoogleTTS: this.useGoogleTTS
        };
        
        console.log('Saving speech settings to storage:', settings);
        
        chrome.storage.sync.set({ speech: settings }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving speech settings to storage:', chrome.runtime.lastError);
          } else {
            console.log('Speech settings saved to storage successfully');
          }
        });
      }
    } catch (error) {
      console.error('Error saving settings to storage:', error);
    }
  }

  /**
   * Apply voice settings to an utterance
   * @param utterance - The utterance to apply settings to
   */
  private applyVoiceSettings(utterance: SpeechSynthesisUtterance): void {
    utterance.lang = 'de-DE';
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    
    // Force refresh available voices to ensure we have the latest
    const allVoices = speechSynthesis.getVoices();
    this.availableVoices = allVoices.filter(voice => 
      voice.lang.startsWith('de') || voice.lang === 'de-DE'
    );
    
    if (this.debugMode) {
      console.log('Available voices when applying settings:', this.availableVoices);
      console.log('Selected voice URI:', this.selectedVoiceURI);
    }
    
    // Set voice if specified
    if (this.selectedVoiceURI && this.selectedVoiceURI !== '') {
      // Try to find the voice by exact URI match first
      let selectedVoice = this.availableVoices.find(
        voice => voice.voiceURI === this.selectedVoiceURI
      );
      
      // If not found, try to find by name
      if (!selectedVoice) {
        console.log('Voice not found by exact URI, trying to find by name');
        
        // Extract name from URI (often the URI contains the name)
        const nameFromURI = this.selectedVoiceURI.split('/').pop() || '';
        
        // Try to find a voice with a similar name
        selectedVoice = this.availableVoices.find(voice => 
          voice.name.includes(nameFromURI) || 
          nameFromURI.includes(voice.name) ||
          voice.voiceURI.includes(nameFromURI) ||
          nameFromURI.includes(voice.voiceURI)
        );
        
        // If still not found, try case-insensitive exact match
        if (!selectedVoice) {
          selectedVoice = this.availableVoices.find(voice => 
            voice.name.toLowerCase() === nameFromURI.toLowerCase() ||
            voice.voiceURI.toLowerCase() === this.selectedVoiceURI.toLowerCase()
          );
        }
        
        // If still not found, try to find by name containing the selected voice name
        if (!selectedVoice) {
          // Try to find a voice by name containing the selected voice name
          const rockoMatch = this.availableVoices.find(voice => 
            voice.name.toLowerCase().includes('rocko') ||
            voice.voiceURI.toLowerCase().includes('rocko')
          );
          
          if (rockoMatch) {
            selectedVoice = rockoMatch;
            console.log('Found Rocko voice by name match:', rockoMatch.name);
          }
        }
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('Using voice:', selectedVoice.name, 'with URI:', selectedVoice.voiceURI);
      } else if (this.availableVoices.length > 0) {
        // Only fall back to first voice if we haven't explicitly set settings
        if (!this.settingsInitialized) {
          utterance.voice = this.availableVoices[0];
          console.log('Fallback to first German voice:', this.availableVoices[0].name);
        } else {
          console.log('Not falling back to default voice because settings were explicitly set');
          
          // Try to find Rocko voice specifically
          const rockoVoice = this.availableVoices.find(voice => 
            voice.name.includes('Rocko') || voice.voiceURI.includes('Rocko')
          );
          
          if (rockoVoice) {
            utterance.voice = rockoVoice;
            console.log('Found and using Rocko voice:', rockoVoice.name);
          }
        }
      } else {
        console.log('No German voices available, using browser default');
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
    this.currentText = text;
    
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
        pitch: this.pitch,
        settingsInitialized: this.settingsInitialized
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
    if (!this.utterance) {
      // If we don't have an utterance but we have text, create a new one
      if (this.currentText) {
        this.utterance = new SpeechSynthesisUtterance(this.currentText);
        this.applyVoiceSettings(this.utterance);
      } else {
        return;
      }
    }
    
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
