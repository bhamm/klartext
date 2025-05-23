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
  
  // Store the audio element for external TTS providers
  private externalAudio: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;

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
    
    // Periodically check TTS state and sync with our internal state
    setInterval(() => {
      // Handle browser TTS state checks
      if (this.ttsProvider === 'browser') {
        // Only force stop if we're confident there's a state mismatch
        if (!this.isPlaying && speechSynthesis.speaking && !speechSynthesis.paused) {
          console.log('Speech synthesis state mismatch detected');
          
          // Double-check if we're really not playing before forcing stop
          if (this.utterance && !this.isPlaying) {
            console.log('Speech synthesis still active when it should be stopped, forcing stop');
            speechSynthesis.cancel();
          }
        }
        
        // If we think we're playing but speech synthesis is not active, update our state
        if (this.isPlaying && !speechSynthesis.speaking && !speechSynthesis.pending) {
          console.log('Speech synthesis stopped unexpectedly, updating state');
          this.isPlaying = false;
          this.updateButtonState(false);
        }
      } 
      // Handle external TTS state checks
      else if (this.externalAudio) {
        // Check if the audio element state doesn't match our internal state
        const audioIsPlaying = !this.externalAudio.paused && !this.externalAudio.ended;
        
        if (this.isPlaying !== audioIsPlaying) {
          console.log('External TTS state mismatch detected, syncing state. Audio playing:', audioIsPlaying);
          
          if (!this.isPlaying && audioIsPlaying) {
            // If we think we're not playing but the audio is playing, update our state
            this.isPlaying = true;
            this.updateButtonState(true);
          } else if (this.isPlaying && !audioIsPlaying) {
            // If we think we're playing but the audio is not playing, update our state
            this.isPlaying = false;
            this.updateButtonState(false);
          }
        }
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
        // First get the existing speech settings to preserve the API key
        chrome.storage.sync.get(['speech'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting existing speech settings:', chrome.runtime.lastError);
            return;
          }
          
          // Get the existing API key if available
          const existingApiKey = result.speech?.apiKey || '';
          
          const settings: SpeechSettings = {
            voiceURI: this.selectedVoiceURI,
            rate: this.rate,
            pitch: 1.0, // Fixed default pitch value
            ttsProvider: this.ttsProvider,
            apiKey: existingApiKey // Preserve the existing API key
          };
          
          console.log('Saving speech settings to storage with preserved API key:', settings);
          
          chrome.storage.sync.set({ speech: settings }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error saving speech settings to storage:', chrome.runtime.lastError);
            } else {
              console.log('Speech settings saved to storage successfully');
              
              // Verify the settings were saved correctly
              chrome.storage.sync.get(['speech'], (verifyResult) => {
                console.log('Verified speech settings in storage after save:', verifyResult.speech);
              });
            }
          });
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
    
    // Set up event handlers for speech synthesis events
    this.utterance.onstart = () => {
      console.log('Speech synthesis started');
      this.isPlaying = true;
      this.updateButtonState(true);
    };
    
    // Handle end of speech
    this.utterance.onend = () => {
      console.log('Speech ended normally');
      this.isPlaying = false;
      this.updateButtonState(false);
    };

    // Handle errors
    this.utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isPlaying = false;
      this.updateButtonState(false);
    };
    
    // Handle pause events
    this.utterance.onpause = () => {
      console.log('Speech synthesis paused');
      this.isPlaying = false;
      this.updateButtonState(false);
    };
    
    // Handle resume events
    this.utterance.onresume = () => {
      console.log('Speech synthesis resumed');
      this.isPlaying = true;
      this.updateButtonState(true);
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
   * Convert base64 string to ArrayBuffer
   * @param base64 - Base64 encoded string
   * @returns ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Use external TTS provider
   * @param text - Text to synthesize
   * @returns Promise resolving to audio content response
   */
  private async useExternalTTS(text: string): Promise<{ audioContent: ArrayBuffer | string, format?: string }> {
    console.log(`Using external TTS provider: ${this.ttsProvider}`);
    
    // Send message to background script to use selected TTS provider
    return new Promise((resolve, reject) => {
      // Get the current speech settings from storage to include the API key
      chrome.storage.sync.get(['speech'], (result) => {
        const apiKey = result.speech?.apiKey || '';
        
        const settings = {
          provider: this.ttsProvider,
          voiceURI: this.selectedVoiceURI,
          rate: this.rate,
          pitch: 1.0, // Fixed default pitch value
          apiKey: apiKey
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
          
          if (!response || response.error) {
            reject(new Error(response?.error || 'No response received'));
            return;
          }
          
          if (!response.audioContent) {
            reject(new Error('No audio content received'));
            return;
          }
          
          resolve({
            audioContent: response.audioContent,
            format: response.format
          });
        });
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
    
    // We'll set isPlaying to true when we actually hear the onstart event
    // This ensures our state is synchronized with the actual speech state
    
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
        console.log(`Using external TTS provider: ${this.ttsProvider}`);
        try {
          // Use external TTS provider
          const result = await this.useExternalTTS(this.currentText);
          
          if (result && result.audioContent) {
            let audioContent: ArrayBuffer;
            
            // Check if the audio content is a base64 string
            if (result.format === 'base64' && typeof result.audioContent === 'string') {
              // Convert base64 to ArrayBuffer
              audioContent = this.base64ToArrayBuffer(result.audioContent);
              console.log(`Received base64 audio content from ${this.ttsProvider}, converted to ArrayBuffer, size: ${audioContent.byteLength} bytes`);
            } else {
              audioContent = result.audioContent as ArrayBuffer;
              console.log(`Received audio content from ${this.ttsProvider}, size: ${audioContent.byteLength} bytes`);
            }
            
            if (audioContent.byteLength > 0) {
              // Create audio element to play the audio
              const audioBlob = new Blob([audioContent], { type: 'audio/mpeg' });
              this.audioUrl = URL.createObjectURL(audioBlob);
              this.externalAudio = new Audio(this.audioUrl);
              
              // Store the audio element to prevent garbage collection
              (window as any).__klartextAudio = this.externalAudio;
              
              // Set up event handlers for external audio
              this.externalAudio.onplay = () => {
                console.log('External TTS audio playback started');
                this.isPlaying = true;
                this.updateButtonState(true);
              };
              
              this.externalAudio.onpause = () => {
                console.log('External TTS audio playback paused');
                // Only update state if this wasn't triggered by stop()
                if (this.externalAudio) {
                  this.isPlaying = false;
                  this.updateButtonState(false);
                }
              };
              
              this.externalAudio.onended = () => {
                console.log('External TTS audio playback ended');
                this.isPlaying = false;
                this.updateButtonState(false);
                
                // Clean up resources
                if (this.audioUrl) {
                  URL.revokeObjectURL(this.audioUrl);
                  this.audioUrl = null;
                }
                this.externalAudio = null;
                delete (window as any).__klartextAudio;
              };
              
              this.externalAudio.onerror = (e: Event | string) => {
                console.error('Error playing external TTS audio:', e);
                this.isPlaying = false;
                this.updateButtonState(false);
                
                // Clean up resources
                if (this.audioUrl) {
                  URL.revokeObjectURL(this.audioUrl);
                  this.audioUrl = null;
                }
                this.externalAudio = null;
                delete (window as any).__klartextAudio;
              };
              
              // Play the audio
              console.log('Playing external TTS audio...');
              try {
                await this.externalAudio.play();
                console.log('External TTS audio playback started successfully');
                return;
              } catch (playError) {
                console.error('Failed to play external TTS audio:', playError);
                if (this.audioUrl) {
                  URL.revokeObjectURL(this.audioUrl);
                  this.audioUrl = null;
                }
                this.externalAudio = null;
                delete (window as any).__klartextAudio;
              }
            } else {
              console.error('Invalid audio content received from external TTS provider');
            }
          } else {
            console.error('No audio content received from external TTS provider');
          }
        } catch (error) {
          console.error(`Error using ${this.ttsProvider} TTS:`, error);
          return;
        }
      } else {
        console.log('Using browser TTS');
        // Use browser TTS
        if (!this.utterance) {
          this.utterance = new SpeechSynthesisUtterance(this.currentText);
          this.applyVoiceSettings(this.utterance);
        }
        
        speechSynthesis.speak(this.utterance);
      }
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
    
    // Handle browser speech synthesis
    if (speechSynthesis.speaking) {
      speechSynthesis.pause();
    }
    
    // Handle external TTS provider
    if (this.externalAudio) {
      console.log('Pausing external TTS audio');
      this.externalAudio.pause();
    }
    
    this.isPlaying = false;
    this.updateButtonState(false);
  }

  /**
   * Resume speech synthesis
   */
  resume(): void {
    console.log('Resuming speech synthesis');
    
    // Handle browser speech synthesis
    if (this.ttsProvider === 'browser') {
      // For browser TTS, always use start() to ensure proper state management
      // This is more reliable than trying to resume
      if (this.utterance) {
        // If we have an utterance but it's not actively speaking, we need to start fresh
        if (!speechSynthesis.speaking) {
          this.start();
        } else {
          // If it's speaking but paused, try to resume
          speechSynthesis.resume();
          // We'll set isPlaying to true when we hear the onresume event
        }
      } else {
        this.start();
      }
    } 
    // Handle external TTS provider
    else if (this.externalAudio) {
      console.log('Resuming external TTS audio');
      this.externalAudio.play()
        .then(() => {
          console.log('External TTS audio playback resumed successfully');
          this.isPlaying = true;
          this.updateButtonState(true);
        })
        .catch((error) => {
          console.error('Failed to resume external TTS audio:', error);
          // If resume fails, try to start fresh
          this.start();
        });
    } else {
      // If no audio element exists, start fresh
      this.start();
    }
  }

  /**
   * Stop speech synthesis
   */
  stop(): void {
    // Cancel browser speech synthesis
    speechSynthesis.cancel();
    
    // Stop external TTS audio if it exists
    if (this.externalAudio) {
      console.log('Stopping external TTS audio');
      this.externalAudio.pause();
      this.externalAudio.currentTime = 0;
      
      // Clean up resources
      if (this.audioUrl) {
        URL.revokeObjectURL(this.audioUrl);
        this.audioUrl = null;
      }
      
      this.externalAudio = null;
      delete (window as any).__klartextAudio;
    }
    
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
    console.log('Toggle called, current state:', this.isPlaying);
    
    // Check if we need to sync state based on provider type
    if (this.ttsProvider === 'browser') {
      // For browser TTS, check the actual speech synthesis state
      const actuallyPlaying = speechSynthesis.speaking && !speechSynthesis.paused;
      
      if (this.isPlaying !== actuallyPlaying) {
        console.log('State mismatch detected, syncing state. Actual state:', actuallyPlaying);
        this.isPlaying = actuallyPlaying;
      }
    } else if (this.externalAudio) {
      // For external TTS, check the audio element state
      const actuallyPlaying = !this.externalAudio.paused;
      
      if (this.isPlaying !== actuallyPlaying) {
        console.log('External TTS state mismatch detected, syncing state. Actual state:', actuallyPlaying);
        this.isPlaying = actuallyPlaying;
      }
    }
    
    if (this.isPlaying) {
      this.pause();
    } else {
      // Handle different providers appropriately
      if (this.ttsProvider === 'browser') {
        // For browser TTS, prefer start() for reliability
        if (!this.utterance || !speechSynthesis.speaking) {
          this.start();
        } else {
          this.resume();
        }
      } else {
        // For external TTS, use resume() if we have audio, otherwise start fresh
        if (this.externalAudio) {
          this.resume();
        } else {
          this.start();
        }
      }
    }
  }

  /**
   * Update the button state based on playing status
   * @param isPlaying - Whether speech is currently playing
   */
  updateButtonState(isPlaying: boolean): void {
    if (!this.button) return;
    
    // Check if this is a header button (smaller, icon-only) or a regular button
    const isHeaderButton = this.button.classList.contains('klartext-header-tts-button');
    
    if (isPlaying) {
      if (isHeaderButton) {
        this.button.innerHTML = PAUSE_ICON;
      } else {
        this.button.innerHTML = PAUSE_ICON + 'Pause';
      }
      this.button.classList.add('playing');
    } else {
      if (isHeaderButton) {
        this.button.innerHTML = PLAY_ICON;
      } else {
        this.button.innerHTML = PLAY_ICON + 'Vorlesen';
      }
      this.button.classList.remove('playing');
    }
  }
}

// Create and export a singleton instance
export const speechController = new SpeechController();
