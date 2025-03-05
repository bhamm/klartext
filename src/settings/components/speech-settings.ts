/**
 * Speech settings component for the Klartext extension
 */
import { SpeechSettings } from '../../shared/types/settings';

/**
 * Component for managing speech synthesis settings
 */
export class SpeechSettingsComponent {
  private voiceSelect: HTMLSelectElement;
  private rateInput: HTMLInputElement;
  private rateValue: HTMLElement;
  private pitchInput: HTMLInputElement;
  private pitchValue: HTMLElement;
  private voicesLoaded: boolean = false;
  private pendingVoiceURI: string | null = null;
  
  /**
   * Create a new SpeechSettingsComponent
   */
  constructor() {
    this.voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;
    this.rateInput = document.getElementById('speech-rate') as HTMLInputElement;
    this.rateValue = document.getElementById('rate-value') as HTMLElement;
    this.pitchInput = document.getElementById('speech-pitch') as HTMLInputElement;
    this.pitchValue = document.getElementById('pitch-value') as HTMLElement;
    
    this.initialize();
  }
  
  /**
   * Initialize the component
   */
  private initialize(): void {
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
    
    this.pitchInput.addEventListener('input', () => {
      this.pitchValue.textContent = this.pitchInput.value;
    });
    
    // Add change event listener to voice select
    this.voiceSelect.addEventListener('change', () => {
      console.log('Voice selection changed to:', this.voiceSelect.value);
    });
  }
  
  /**
   * Load available voices and populate select element
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
    
    // Try to find the option with the matching value
    for (let i = 0; i < this.voiceSelect.options.length; i++) {
      if (this.voiceSelect.options[i].value === voiceURI) {
        this.voiceSelect.selectedIndex = i;
        console.log('Voice found and selected:', voiceURI);
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
    
    if (settings.voiceURI) {
      const voiceFound = this.setVoice(settings.voiceURI);
      
      if (!voiceFound && this.voicesLoaded) {
        // If the voice wasn't found but voices are loaded, try loading voices again
        console.log('Voice not found, trying to reload voices');
        this.loadVoices();
        this.setVoice(settings.voiceURI);
      }
    }
    
    this.rateInput.value = settings.rate.toString();
    this.rateValue.textContent = settings.rate.toString();
    
    if (settings.pitch) {
      this.pitchInput.value = settings.pitch.toString();
      this.pitchValue.textContent = settings.pitch.toString();
    }
    
    console.log('Speech settings applied to UI');
  }
  
  /**
   * Get speech settings from the UI
   * @returns Speech settings
   */
  public getSettings(): SpeechSettings {
    return {
      voiceURI: this.voiceSelect.value,
      rate: parseFloat(this.rateInput.value),
      pitch: parseFloat(this.pitchInput.value),
      useGoogleTTS: false // For now, always false until Google TTS is implemented
    };
  }
}

// Create and export a singleton instance
export const speechSettings = new SpeechSettingsComponent();
