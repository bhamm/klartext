/**
 * Speech settings component for the Klartext extension
 */
import { SpeechSettings, ApiKeysConfig } from '../../shared/types/settings';
import { getTTSProvidersMetadata } from '../../background/tts-providers';
import { loadApiKeys } from '../services/settings-service';

/**
 * Component for managing speech synthesis settings
 */
export class SpeechSettingsComponent {
  private voiceSelect: HTMLSelectElement;
  private rateInput: HTMLInputElement;
  private rateValue: HTMLElement;
  private ttsProviderSelect: HTMLSelectElement;
  private ttsApiKeyInput: HTMLInputElement;
  private voicesLoaded: boolean = false;
  private pendingVoiceURI: string | null = null;
  private saveButton: HTMLElement | null = null;
  private apiKeys: ApiKeysConfig | null = null;
  
  /**
   * Create a new SpeechSettingsComponent
   */
  constructor() {
    this.voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;
    this.rateInput = document.getElementById('speech-rate') as HTMLInputElement;
    this.rateValue = document.getElementById('rate-value') as HTMLElement;
    this.ttsProviderSelect = document.getElementById('tts-provider-select') as HTMLSelectElement;
    this.ttsApiKeyInput = document.getElementById('tts-api-key') as HTMLInputElement;
    this.saveButton = document.querySelector('.save-button');
    
    this.initialize();
  }
  
  /**
   * Initialize the component
   */
  private async initialize(): Promise<void> {
    // Load API keys
    try {
      this.apiKeys = await loadApiKeys();
      console.log('API keys loaded for speech settings:', this.apiKeys);
    } catch (error) {
      console.error('Error loading API keys for speech settings:', error);
      this.apiKeys = { providers: {} };
    }
    
    // Populate TTS provider options
    this.loadTTSProviders();
    
    // Populate voice options
    this.loadVoices();
    
    // Handle voices changing (happens asynchronously in some browsers)
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
        
        // If we had a pending voice URI to set, try to set it now
        if (this.pendingVoiceURI) {
          this.setVoice(this.pendingVoiceURI);
          this.pendingVoiceURI = null;
        }
      };
    }
    
    // Set up event listeners for range inputs
    this.rateInput.addEventListener('input', () => {
      this.rateValue.textContent = this.rateInput.value;
    });
    
    // Add change event listener to voice select
    this.voiceSelect.addEventListener('change', () => {
      console.log('Voice selection changed to:', this.voiceSelect.value);
      
      // Save the settings directly to storage
      this.saveSettingsToStorage();
      
      // Force a save when voice is changed to ensure it takes effect immediately
      if (this.saveButton) {
        console.log('Triggering save button click to apply voice change immediately');
        this.saveButton.click();
      } else {
        console.warn('Save button not found, cannot auto-save voice change');
      }
    });
    
    // Add change event listener to TTS provider select
    if (this.ttsProviderSelect) {
      this.ttsProviderSelect.addEventListener('change', () => {
        console.log('TTS provider changed to:', this.ttsProviderSelect.value);
        
        // Update API key from api-keys.json if available
        this.updateApiKeyForProvider(this.ttsProviderSelect.value);
        
        // Update voices based on the selected provider
        this.updateVoicesForProvider(this.ttsProviderSelect.value);
        
        // Save the settings directly to storage
        this.saveSettingsToStorage();
        
        // Force a save when provider is changed to ensure it takes effect immediately
        if (this.saveButton) {
          console.log('Triggering save button click to apply TTS provider change immediately');
          this.saveButton.click();
        } else {
          console.warn('Save button not found, cannot auto-save TTS provider change');
        }
      });
    }
    
    // Add change and input event listeners to TTS API key input
    if (this.ttsApiKeyInput) {
      // Listen for change event (when input loses focus)
      this.ttsApiKeyInput.addEventListener('change', () => {
        console.log('TTS API key changed (change event)');
        
        // Only update voices if we're not using browser TTS
        if (this.ttsProviderSelect && this.ttsProviderSelect.value !== 'browser') {
          // Update voices based on the selected provider with the new API key
          this.updateVoicesForProvider(this.ttsProviderSelect.value);
        }
        
        // Save the settings directly to storage
        this.saveSettingsToStorage();
      });
      
      // Also listen for input event (as user types)
      this.ttsApiKeyInput.addEventListener('input', () => {
        console.log('TTS API key changed (input event)');
        
        // Save the settings directly to storage
        this.saveSettingsToStorage();
        
        // Force a save when API key is changed to ensure it takes effect immediately
        if (this.saveButton) {
          console.log('Triggering save button click to apply API key change immediately');
          this.saveButton.click();
        }
      });
    }
    
    // Try to load settings from storage
    this.loadSettingsFromStorage();
  }
  
  /**
   * Load available TTS providers and populate select element
   */
  private loadTTSProviders(): void {
    if (!this.ttsProviderSelect) {
      console.warn('TTS provider select element not found');
      return;
    }
    
    // Clear existing options
    while (this.ttsProviderSelect.options.length > 0) {
      this.ttsProviderSelect.remove(0);
    }
    
    try {
      // Add browser TTS option
      const browserOption = document.createElement('option');
      browserOption.value = 'browser';
      browserOption.textContent = 'Browser Text-to-Speech';
      this.ttsProviderSelect.appendChild(browserOption);
      
      // Try to get TTS providers from background script
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ action: 'getTTSProviders' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting TTS providers:', chrome.runtime.lastError);
            return;
          }
          
          if (response && response.providers) {
            // Add options for each provider
            Object.entries(response.providers).forEach(([id, metadata]: [string, any]) => {
              if (id !== 'browser') { // Skip browser provider as it's already added
                const option = document.createElement('option');
                option.value = id;
                option.textContent = metadata.name;
                this.ttsProviderSelect.appendChild(option);
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error loading TTS providers:', error);
    }
  }
  
  /**
   * Try to load speech settings from storage
   */
  private loadSettingsFromStorage(): void {
    try {
      // Check if we're in a context where chrome.storage is available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        console.log('Attempting to load speech settings from storage');
        
        // Load all settings to see what's actually in storage
        chrome.storage.sync.get(null, (allSettings) => {
          console.log('All settings in storage:', allSettings);
          
          if (chrome.runtime.lastError) {
            console.error('Error loading all settings from storage:', chrome.runtime.lastError);
          }
          
          // Now specifically get speech settings
          chrome.storage.sync.get(['speech'], (result) => {
            if (chrome.runtime.lastError) {
              console.error('Error loading speech settings from storage:', chrome.runtime.lastError);
              return;
            }
            
            if (result.speech) {
              console.log('Found speech settings in storage:', result.speech);
              
              // Log the TTS provider and voice URI before setting
              console.log(`TTS Provider from storage: ${result.speech.ttsProvider}`);
              console.log(`Voice URI from storage: ${result.speech.voiceURI}`);
              
              // Apply the settings
              this.setSettings(result.speech);
              
              // Log the current state after setting
              console.log('Current TTS provider select value:', this.ttsProviderSelect?.value);
              console.log('Current voice select value:', this.voiceSelect?.value);
            } else {
              console.log('No speech settings found in storage');
            }
          });
        });
      }
    } catch (error) {
      console.error('Error loading settings from storage:', error);
    }
  }
  
  /**
   * Save current speech settings to storage
   */
  private saveSettingsToStorage(): void {
    try {
      // Check if we're in a context where chrome.storage is available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        const settings = this.getSettings();
        
        console.log('Saving speech settings to storage:', settings);
        
        // First, get all settings to see what's already there
        chrome.storage.sync.get(null, (allSettings) => {
          console.log('Current settings before saving:', allSettings);
          
          // Now save the speech settings
          chrome.storage.sync.set({ speech: settings }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error saving speech settings to storage:', chrome.runtime.lastError);
            } else {
              console.log('Speech settings saved to storage successfully');
              
              // Verify the settings were saved correctly
              chrome.storage.sync.get(['speech'], (result) => {
                console.log('Verified speech settings in storage after save:', result.speech);
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
   * Update API key for the selected provider from api-keys.json or settings
   * @param provider - The selected TTS provider
   * @param savedApiKey - Optional API key from saved settings
   */
  private updateApiKeyForProvider(provider: string, savedApiKey?: string): void {
    console.log(`Updating API key for provider: ${provider}, saved API key:`, savedApiKey);
    
    if (provider === 'browser') {
      // Browser TTS doesn't need an API key
      this.ttsApiKeyInput.value = '';
      this.ttsApiKeyInput.disabled = true;
    } else {
      // Enable the API key input
      this.ttsApiKeyInput.disabled = false;
      
      // First try to use the saved API key from settings if provided and not empty
      if (savedApiKey && savedApiKey.trim() !== '') {
        this.ttsApiKeyInput.value = savedApiKey;
        console.log(`API key for ${provider} loaded from saved settings:`, savedApiKey);
      }
      // Otherwise check if we have an API key for this provider in api-keys.json
      else if (this.apiKeys && this.apiKeys.providers && this.apiKeys.providers[provider]) {
        this.ttsApiKeyInput.value = this.apiKeys.providers[provider].apiKey || '';
        console.log(`API key for ${provider} loaded from api-keys.json:`, this.ttsApiKeyInput.value);
      } else {
        // No API key found in api-keys.json, leave the field empty
        this.ttsApiKeyInput.value = '';
        console.log(`No API key found for ${provider} in api-keys.json`);
      }
      
      // Save the settings to storage to ensure the API key is persisted
      this.saveSettingsToStorage();
    }
  }
  
  /**
   * Update voices based on the selected provider
   * @param provider - The selected TTS provider
   */
  private updateVoicesForProvider(provider: string): void {
    console.log(`Updating voices for provider: ${provider}`);
    
    if (provider === 'browser') {
      // For browser TTS, load voices from speechSynthesis
      this.loadVoices();
    } else {
      // For other providers, fetch voices from the background script
      this.fetchProviderVoices(provider);
    }
  }
  
  /**
   * Fetch voices from a specific TTS provider
   * @param provider - The TTS provider ID
   */
  private fetchProviderVoices(provider: string): void {
    console.log(`Fetching voices for provider: ${provider}`);
    
    // Clear existing options (except default)
    while (this.voiceSelect.options.length > 1) {
      this.voiceSelect.remove(1);
    }
    
    // Send message to background script to get voices for this provider
    chrome.runtime.sendMessage({
      action: 'getProviderVoices',
      provider: provider,
      apiKey: this.ttsApiKeyInput.value
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error fetching provider voices:', chrome.runtime.lastError);
        return;
      }
      
      if (!response || !response.success || !response.voices) {
        console.error('Failed to fetch provider voices:', response?.error || 'Unknown error');
        return;
      }
      
      console.log(`Received ${response.voices.length} voices for provider ${provider}:`, response.voices);
      
      // Add options for each voice
      response.voices.forEach((voice: any) => {
        const option = document.createElement('option');
        option.value = voice.id;
        option.textContent = `${voice.name} (${voice.languageCode})`;
        
        // Add data attributes to help with voice matching
        option.dataset.name = voice.name;
        option.dataset.languageCode = voice.languageCode;
        
        this.voiceSelect.appendChild(option);
      });
      
      this.voicesLoaded = true;
      
      // If we had a pending voice URI to set, try to set it now
      if (this.pendingVoiceURI) {
        console.log(`Attempting to set pending voice URI after fetching voices: ${this.pendingVoiceURI}`);
        this.setVoice(this.pendingVoiceURI);
        this.pendingVoiceURI = null;
      }
    });
  }
  
  /**
   * Load available voices from browser and populate select element
   */
  private loadVoices(): void {
    // Clear existing options (except default)
    while (this.voiceSelect.options.length > 1) {
      this.voiceSelect.remove(1);
    }
    
    // Get all voices
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length === 0) {
      console.log('No voices available yet, will try again when voices change');
      return;
    }
    
    // Filter for German voices
    const germanVoices = voices.filter(voice => 
      voice.lang.startsWith('de') || voice.lang === 'de-DE'
    );
    
    console.log('Available German voices:', germanVoices);
    
    // Log detailed information about each voice for debugging
    germanVoices.forEach((voice, index) => {
      console.log(`Voice ${index + 1}:`, {
        name: voice.name,
        voiceURI: voice.voiceURI,
        lang: voice.lang,
        localService: voice.localService,
        default: voice.default
      });
    });
    
    // Add options for each voice
    germanVoices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.voiceURI;
      option.textContent = `${voice.name} (${voice.lang})`;
      this.voiceSelect.appendChild(option);
    });
    
    this.voicesLoaded = true;
    
    // If we had a pending voice URI to set, try to set it now
    if (this.pendingVoiceURI) {
      this.setVoice(this.pendingVoiceURI);
      this.pendingVoiceURI = null;
    }
  }
  
  /**
   * Set the voice by URI
   * @param voiceURI - The URI of the voice to select
   * @returns Whether the voice was found and selected
   */
  private setVoice(voiceURI: string): boolean {
    if (!voiceURI) {
      this.voiceSelect.value = '';
      return true;
    }
    
    // If voices aren't loaded yet, store the URI to set later
    if (!this.voicesLoaded) {
      console.log('Voices not loaded yet, storing voice URI for later:', voiceURI);
      this.pendingVoiceURI = voiceURI;
      return false;
    }
    
    console.log('Attempting to set voice to:', voiceURI);
    
    // Try to find the option with the matching value
    for (let i = 0; i < this.voiceSelect.options.length; i++) {
      if (this.voiceSelect.options[i].value === voiceURI) {
        this.voiceSelect.selectedIndex = i;
        console.log('Voice found and selected by exact match:', voiceURI);
        return true;
      }
    }
    
    // For Google TTS voices, try to match by the voice name part
    if (voiceURI && this.ttsProviderSelect && this.ttsProviderSelect.value === 'googleTTS') {
      // Google TTS voice IDs are in the format "de-DE-Standard-A", "de-DE-Wavenet-B", etc.
      // Extract the voice name from the URI
      const voiceParts = voiceURI.split('-');
      
      if (voiceParts.length >= 3) {
        // Try to match by language code and voice type
        const languageCode = `${voiceParts[0]}-${voiceParts[1]}`;
        const voiceType = voiceParts.slice(2).join('-');
        
        console.log(`Trying to match Google TTS voice by parts: languageCode=${languageCode}, voiceType=${voiceType}`);
        
        for (let i = 0; i < this.voiceSelect.options.length; i++) {
          const option = this.voiceSelect.options[i];
          const optionValue = option.value;
          
          // Check if the option value contains both the language code and voice type
          if (optionValue.includes(languageCode) && optionValue.includes(voiceType)) {
            this.voiceSelect.selectedIndex = i;
            console.log('Google TTS voice found by language and type match:', optionValue);
            return true;
          }
        }
      }
    }
    
    // If the exact URI wasn't found, try to find a voice with a similar name
    if (voiceURI) {
      const nameFromURI = voiceURI.split('/').pop() || '';
      
      // Try to find by name similarity
      for (let i = 0; i < this.voiceSelect.options.length; i++) {
        const optionValue = this.voiceSelect.options[i].value;
        const optionText = this.voiceSelect.options[i].textContent || '';
        
        if (optionValue.includes(nameFromURI) || 
            nameFromURI.includes(optionValue) ||
            optionText.includes(nameFromURI) ||
            nameFromURI.includes(optionText)) {
          this.voiceSelect.selectedIndex = i;
          console.log('Voice found by name similarity:', optionValue);
          return true;
        }
      }
      
      // Try exact name match (case insensitive)
      for (let i = 0; i < this.voiceSelect.options.length; i++) {
        const optionValue = this.voiceSelect.options[i].value;
        const optionText = this.voiceSelect.options[i].textContent || '';
        
        if (optionValue.toLowerCase() === voiceURI.toLowerCase() ||
            optionText.toLowerCase().includes(voiceURI.toLowerCase())) {
          this.voiceSelect.selectedIndex = i;
          console.log('Voice found by exact name match:', optionValue);
          return true;
        }
      }
      
      // If still not found and we have options, select the first one
      if (this.voiceSelect.options.length > 1) {
        this.voiceSelect.selectedIndex = 1; // Skip the default empty option
        console.log('No matching voice found, selecting first available voice:', this.voiceSelect.value);
        return true;
      }
    }
    
    console.log('Voice not found in options:', voiceURI);
    return false;
  }
  
  /**
   * Set speech settings values in the UI
   * @param settings - Speech settings
   */
  public setSettings(settings: SpeechSettings): void {
    console.log('Setting speech settings in UI:', settings);
    
    // Store the voice URI for later use
    const voiceURI = settings.voiceURI;
    
    // Set TTS provider
    if (settings.ttsProvider && this.ttsProviderSelect) {
      // Check if the provider options are loaded
      if (this.ttsProviderSelect.options.length <= 1) {
        console.log('TTS provider options not loaded yet, waiting for options to load');
        
        // Set a timeout to try again after a short delay
        setTimeout(() => {
          console.log('Retrying to set TTS provider after delay');
          this.setSettings(settings);
        }, 500);
        return;
      }
      
      // Try to find the option with the matching value
      let providerFound = false;
      for (let i = 0; i < this.ttsProviderSelect.options.length; i++) {
        if (this.ttsProviderSelect.options[i].value === settings.ttsProvider) {
          this.ttsProviderSelect.selectedIndex = i;
          console.log('TTS provider found and selected:', settings.ttsProvider);
          providerFound = true;
          break;
        }
      }
      
      if (!providerFound) {
        console.log('TTS provider not found in options:', settings.ttsProvider);
        // Default to browser TTS if provider not found
        this.ttsProviderSelect.value = 'browser';
      }
      
      // Update API key for the selected provider, passing the saved API key from settings
      this.updateApiKeyForProvider(settings.ttsProvider, settings.apiKey);
      
      // Update voices based on the selected provider
      this.updateVoicesForProvider(settings.ttsProvider);
      
      // Store the voice URI to set after voices are loaded
      this.pendingVoiceURI = voiceURI;
    }
    
    // Set rate
    this.rateInput.value = settings.rate.toString();
    this.rateValue.textContent = settings.rate.toString();
    
    console.log('Speech settings applied to UI, pending voice URI:', this.pendingVoiceURI);
  }
  
  /**
   * Get speech settings from the UI
   * @returns Speech settings
   */
  public getSettings(): SpeechSettings {
    const settings: SpeechSettings = {
      voiceURI: this.voiceSelect.value,
      rate: parseFloat(this.rateInput.value),
      pitch: 1.0, // Default pitch value, not configurable anymore
      ttsProvider: this.ttsProviderSelect ? this.ttsProviderSelect.value : 'browser',
      apiKey: this.ttsApiKeyInput ? this.ttsApiKeyInput.value : ''
    };
    
    console.log('Getting speech settings from UI:', settings);
    return settings;
  }
}

// Create and export a singleton instance
export const speechSettings = new SpeechSettingsComponent();
