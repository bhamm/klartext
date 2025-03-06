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
  ttsProvider: string = 'browser';
  
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
          pitch: this.pitch,
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
        pitch: this.pitch
      };
      
      console.log('Sending synthesizeSpeech message with settings:', settings);
      
      chrome.runtime.sendMessage({
        action: 'synthesizeSpeech',
        text,
        settings
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error when using TTS provider:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        
        if (!response) {
          console.error('No response received from background script');
          reject(new Error('No response received from background script'));
          return;
        }
        
        if (response.error) {
          console.error(`Error from TTS provider ${this.ttsProvider}:`, response.error);
          reject(response.error);
          return;
        }
        
        if (!response.audioContent) {
          console.error('No audio content received from TTS provider');
          reject(new Error('No audio content received from TTS provider'));
          return;
        }
        
        console.log(`Received audio content from ${this.ttsProvider}, size: ${response.audioContent.byteLength} bytes`);
        resolve(response.audioContent);
      });
    });
  }

  /**
   * Start speech synthesis
   */
  async start(): Promise<void> {
    if (!this.currentText) {
      return;
    }
    
    // Cancel any ongoing speech first
    this.stop();
    
    this.isPlaying = true;
    this.updateButtonState(true);
    
    try {
      // Check if we should use an external TTS provider
      if (this.ttsProvider !== 'browser') {
        console.log(`Using external TTS provider: ${this.ttsProvider}`);
        
        try {
          // Use external TTS provider
          const audioContent = await this.useExternalTTS(this.currentText);
          
          // Check if audioContent is valid
          if (!audioContent || audioContent.byteLength === 0) {
            console.error('Invalid audio content received:', audioContent);
            throw new Error('Invalid audio content received from TTS provider');
          }
          
          // Create audio element to play the audio
          const audioBlob = new Blob([audioContent], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio();
          
          // Set audio properties
          audio.src = audioUrl;
          audio.preload = 'auto';
          
          console.log(`Created audio element with URL: ${audioUrl}, blob size: ${audioContent.byteLength} bytes`);
          
          // Set up event handlers
          audio.onended = () => {
            console.log('Audio playback ended');
            this.stop();
            URL.revokeObjectURL(audioUrl);
          };
          
          audio.onerror = (event) => {
            console.error('Audio playback error:', event);
            console.error('Audio error details:', {
              error: audio.error ? audio.error.code : 'unknown',
              networkState: audio.networkState,
              readyState: audio.readyState
            });
            this.stop();
            URL.revokeObjectURL(audioUrl);
          };
          
          // Add more event listeners for debugging
          audio.oncanplay = () => console.log('Audio can play');
          audio.oncanplaythrough = () => console.log('Audio can play through');
          audio.onloadeddata = () => console.log('Audio data loaded');
          audio.onloadedmetadata = () => console.log('Audio metadata loaded');
          audio.onpause = () => console.log('Audio paused');
          audio.onplay = () => console.log('Audio play started');
          audio.onplaying = () => console.log('Audio playing');
          audio.onstalled = () => console.log('Audio stalled');
          audio.onsuspend = () => console.log('Audio suspended');
          audio.onwaiting = () => console.log('Audio waiting');
          
          // Wait for the audio to be loaded before playing
          audio.oncanplaythrough = async () => {
            console.log('Audio can play through, attempting to play');
            
            try {
              // Create a user gesture simulation
              const playPromise = audio.play();
              
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log('Audio playback started successfully');
                  })
                  .catch(error => {
                    console.error('Error during audio playback:', error);
                    
                    // Check if it's an autoplay policy error
                    if (error.name === 'NotAllowedError') {
                      console.log('Autoplay policy prevented playback, creating a play button');
                      
                      // Create a temporary play button to get user interaction
                      const playButton = document.createElement('button');
                      playButton.textContent = 'Play Audio';
                      playButton.style.position = 'fixed';
                      playButton.style.top = '10px';
                      playButton.style.right = '10px';
                      playButton.style.zIndex = '10000';
                      playButton.style.padding = '10px';
                      playButton.style.backgroundColor = '#007bff';
                      playButton.style.color = 'white';
                      playButton.style.border = 'none';
                      playButton.style.borderRadius = '5px';
                      playButton.style.cursor = 'pointer';
                      
                      playButton.onclick = () => {
                        console.log('Play button clicked, attempting to play audio');
                        audio.play()
                          .then(() => {
                            console.log('Audio playback started after user interaction');
                            document.body.removeChild(playButton);
                          })
                          .catch(playError => {
                            console.error('Error playing audio after user interaction:', playError);
                            document.body.removeChild(playButton);
                            this.fallbackToBrowserTTS();
                          });
                      };
                      
                      document.body.appendChild(playButton);
                      
                      // Auto-remove the button after 10 seconds if not clicked
                      setTimeout(() => {
                        if (document.body.contains(playButton)) {
                          document.body.removeChild(playButton);
                          this.fallbackToBrowserTTS();
                        }
                      }, 10000);
                    } else {
                      // For other errors, fall back to browser TTS
                      this.fallbackToBrowserTTS();
                    }
                  });
              }
            } catch (error) {
              console.error('Exception during audio.play():', error);
              this.fallbackToBrowserTTS();
            }
          };
          
          // Store the audio element in a global variable to prevent garbage collection
          (window as any).__ttsAudio = audio;
          
          // Load the audio
          audio.load();
          
          // Create an audio element directly in the page
          const audioElement = document.createElement('audio');
          audioElement.controls = true;
          audioElement.style.position = 'fixed';
          audioElement.style.bottom = '10px';
          audioElement.style.right = '10px';
          audioElement.style.zIndex = '10000';
          audioElement.style.backgroundColor = 'white';
          audioElement.style.padding = '5px';
          audioElement.style.borderRadius = '5px';
          audioElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
          
          // Create a source element for the audio
          const sourceElement = document.createElement('source');
          sourceElement.type = 'audio/mp3';
          
          // Create a blob URL from the audio content
          const newBlob = new Blob([audioContent], { type: 'audio/mpeg' });
          const newBlobUrl = URL.createObjectURL(newBlob);
          sourceElement.src = newBlobUrl;
          
          // Add the source to the audio element
          audioElement.appendChild(sourceElement);
          
          // Add a close button
          const closeButton = document.createElement('button');
          closeButton.textContent = 'X';
          closeButton.style.position = 'absolute';
          closeButton.style.top = '-10px';
          closeButton.style.right = '-10px';
          closeButton.style.backgroundColor = 'red';
          closeButton.style.color = 'white';
          closeButton.style.border = 'none';
          closeButton.style.borderRadius = '50%';
          closeButton.style.width = '20px';
          closeButton.style.height = '20px';
          closeButton.style.cursor = 'pointer';
          closeButton.style.fontSize = '12px';
          closeButton.style.lineHeight = '20px';
          closeButton.style.textAlign = 'center';
          closeButton.style.padding = '0';
          
          closeButton.onclick = () => {
            document.body.removeChild(audioWrapper);
            URL.revokeObjectURL(newBlobUrl);
          };
          
          // Create a wrapper for the audio element and close button
          const audioWrapper = document.createElement('div');
          audioWrapper.style.position = 'fixed';
          audioWrapper.style.bottom = '10px';
          audioWrapper.style.right = '10px';
          audioWrapper.style.zIndex = '10000';
          
          // Add the audio element and close button to the wrapper
          audioWrapper.appendChild(audioElement);
          audioWrapper.appendChild(closeButton);
          
          // Add the wrapper to the page
          document.body.appendChild(audioWrapper);
          
          // Auto-remove after 30 seconds
          setTimeout(() => {
            if (document.body.contains(audioWrapper)) {
              document.body.removeChild(audioWrapper);
              URL.revokeObjectURL(newBlobUrl);
            }
          }, 30000);
          
          // Try to play the audio
          audioElement.oncanplaythrough = () => {
            console.log('Audio element can play through, attempting to play');
            audioElement.play()
              .then(() => console.log('Audio playback started successfully'))
              .catch(err => {
                console.error('Error playing audio:', err);
                // Show a message to the user
                const message = document.createElement('div');
                message.textContent = 'Click to play audio';
                message.style.position = 'absolute';
                message.style.top = '-30px';
                message.style.left = '0';
                message.style.backgroundColor = '#007bff';
                message.style.color = 'white';
                message.style.padding = '5px';
                message.style.borderRadius = '5px';
                message.style.cursor = 'pointer';
                
                message.onclick = () => {
                  audioElement.play()
                    .then(() => {
                      audioWrapper.removeChild(message);
                    })
                    .catch(playErr => {
                      console.error('Error playing audio after click:', playErr);
                    });
                };
                
                audioWrapper.appendChild(message);
              });
          };
          
          // Load the audio
          audioElement.load();
          
          return;
        } catch (error) {
          console.error(`Error using ${this.ttsProvider} TTS:`, error);
          console.log('Falling back to browser TTS');
          // Fall back to browser TTS
        }
      }
      
      // Use browser TTS
      if (!this.utterance) {
        this.utterance = new SpeechSynthesisUtterance(this.currentText);
        this.applyVoiceSettings(this.utterance);
      }
      
      // Start speech with a small delay to ensure everything is ready
      setTimeout(() => {
        if (this.utterance) {
          console.log('Starting browser speech synthesis...');
          
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
    } catch (error) {
      console.error('Error starting speech synthesis:', error);
      this.stop();
    }
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
