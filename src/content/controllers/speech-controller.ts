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
  utterance: SpeechSynthesisUtterance | null = null;
  words: string[] = [];
  isPlaying: boolean = false;
  button: HTMLElement | null = null;
  debugMode: boolean = true;
  
  // Speech settings
  availableVoices: SpeechSynthesisVoice[] = [];
  selectedVoiceURI: string = '';
  rate: number = 0.9;
  ttsProvider: string = 'browser';
  
  // Flag to track if settings have been explicitly set
  private settingsInitialized: boolean = false;
  
  // Store the current text for potential replay
  private currentText: string = '';

  /**
   * Create a new SpeechController
   */
  constructor() {
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
    // Pitch is no longer configurable, using default value of 1.0
    this.ttsProvider = settings.ttsProvider || 'browser';
    
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
          pitch: 1.0, // Fixed default pitch value
          ttsProvider: this.ttsProvider
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
    utterance.pitch = 1.0; // Fixed default pitch value
    
    // Force refresh available voices to ensure we have the latest
    const allVoices = speechSynthesis.getVoices();
    this.availableVoices = allVoices.filter(voice => 
      voice.lang.startsWith('de') || voice.lang === 'de-DE'
    );
    
    // Set voice if specified
    if (this.selectedVoiceURI && this.selectedVoiceURI !== '') {
      // Try to find the voice by exact URI match first
      let selectedVoice = this.availableVoices.find(
        voice => voice.voiceURI === this.selectedVoiceURI
      );
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else if (this.availableVoices.length > 0) {
        utterance.voice = this.availableVoices[0];
      }
    } else if (this.availableVoices.length > 0) {
      // If no voice is selected but we have German voices, use the first one
      utterance.voice = this.availableVoices[0];
    }
  }

  /**
   * Set up the speech controller with text and button
   * @param text - The text to speak
   * @param words - Array of words for highlighting
   * @param button - The button element to control playback
   */
  async setup(text: string, words: string[], button: HTMLElement): Promise<void> {
    console.log('Setting up speech controller with new text');
    
    // Reset state
    this.words = words;
    this.button = button;
    this.currentText = text;
    this.isPlaying = false;
    
    // Force stop any ongoing speech
    this.stop();
    
    // Cancel any ongoing speech synthesis
    speechSynthesis.cancel();
    
    // Make sure we have the latest voices
    await this.loadVoices();
    
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
    this.utterance.onerror = () => {
      console.error('Speech synthesis error');
      this.stop();
    };
    
    // Update button state to initial state
    this.updateButtonState(false);
  }
  
  /**
   * Get all available German voices
   * @returns Array of German voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  /**
   * Use external TTS provider
   * @param text - Text to synthesize
   * @returns Promise resolving to audio content as ArrayBuffer
   */
  private async useExternalTTS(text: string): Promise<ArrayBuffer> {
    console.log(`Using external TTS provider: ${this.ttsProvider}`);
    
    // Send message to background script to use selected TTS provider
    return new Promise((resolve, reject) => {
      const settings = {
        provider: this.ttsProvider,
        voiceURI: this.selectedVoiceURI,
        rate: this.rate,
        pitch: 1.0 // Fixed default pitch value
      };
      
      chrome.runtime.sendMessage({
        action: 'synthesizeSpeech',
        text,
        settings
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        
        if (!response || response.error || !response.audioContent) {
          reject(new Error(response?.error || 'No audio content received'));
          return;
        }
        
        resolve(response.audioContent);
      });
    });
  }

  /**
   * Start speech synthesis
   */
  async start(): Promise<void> {
    console.log('Starting speech synthesis');
    
    if (!this.currentText) {
      console.log('No current text to speak, aborting');
      return;
    }
    
    // Cancel any ongoing speech first
    this.stop();
    
    // Force reset the speech synthesis state
    speechSynthesis.cancel();
    
    // Set playing state
    this.isPlaying = true;
    this.updateButtonState(true);
    
    // If the utterance is null, recreate it
    if (!this.utterance) {
      this.utterance = new SpeechSynthesisUtterance(this.currentText);
      this.applyVoiceSettings(this.utterance);
      
      // Set up event handlers
      this.utterance.onend = () => {
        this.stop();
      };
      
      this.utterance.onerror = () => {
        this.stop();
      };
    }
    
    try {
      // Check if we should use an external TTS provider
      if (this.ttsProvider !== 'browser') {
        try {
          // Use external TTS provider
          const audioContent = await this.useExternalTTS(this.currentText);
          
          if (audioContent instanceof ArrayBuffer && audioContent.byteLength > 0) {
            // Create audio element to play the audio
            const audioBlob = new Blob([audioContent], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            // Set up event handlers
            audio.onended = () => {
              this.stop();
              URL.revokeObjectURL(audioUrl);
            };
            
            audio.onerror = () => {
              this.stop();
              URL.revokeObjectURL(audioUrl);
              this.fallbackToBrowserTTS();
            };
            
            // Play the audio
            audio.play().catch(() => {
              this.fallbackToBrowserTTS();
            });
            
            return;
          }
        } catch (error) {
          console.error(`Error using ${this.ttsProvider} TTS:`, error);
          // Fall back to browser TTS
        }
      }
      
      // Use browser TTS
      if (!this.utterance) {
        this.utterance = new SpeechSynthesisUtterance(this.currentText);
        this.applyVoiceSettings(this.utterance);
      }
      
      speechSynthesis.speak(this.utterance);
    } catch (error) {
      console.error('Error starting speech synthesis:', error);
      this.stop();
    }
  }

  /**
   * Pause speech synthesis
   */
  pause(): void {
    console.log('Pausing speech synthesis');
    
    if (speechSynthesis.speaking) {
      speechSynthesis.pause();
    }
    
    this.isPlaying = false;
    this.updateButtonState(false);
  }

  /**
   * Resume speech synthesis
   */
  resume(): void {
    console.log('Resuming speech synthesis');
    
    // Start fresh instead of trying to resume
    this.start();
  }

  /**
   * Stop speech synthesis
   */
  stop(): void {
    // Cancel speech synthesis
    speechSynthesis.cancel();
    
    this.isPlaying = false;
    
    // Reset button
    if (this.button) {
      this.updateButtonState(false);
    }
  }

  /**
   * Fall back to browser TTS when external TTS fails
   */
  private fallbackToBrowserTTS(): void {
    console.log('Falling back to browser TTS');
    this.stop();
    
    // Create a new utterance with the current text
    this.utterance = new SpeechSynthesisUtterance(this.currentText);
    this.applyVoiceSettings(this.utterance);
    
    // Start browser speech synthesis
    speechSynthesis.speak(this.utterance);
  }

  /**
   * Toggle between play and pause
   */
  toggle(): void {
    console.log('Toggle called, current state:', this.isPlaying);
    
    if (this.isPlaying) {
      this.pause();
    } else {
      this.start();
    }
  }

  /**
   * Update the button state based on playing status
   * @param isPlaying - Whether speech is currently playing
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
