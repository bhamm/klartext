/**
 * Settings panel component for text size and settings
 */
import { getElement } from '../utils/dom-utils';
import { Settings, SettingsPanelComponent } from '../../shared/types/settings';
import { speechSettings } from './speech-settings';

/**
 * Initialize settings panel component
 * @returns Component interface
 */
export function initSettingsPanel(): SettingsPanelComponent | null {
  // Get DOM elements
  const textSizeRadios = document.querySelectorAll<HTMLInputElement>('input[name="text-size"]');
  const translationLevelSlider = getElement<HTMLInputElement>('translation-level');
  
  if (!textSizeRadios.length || !translationLevelSlider) {
    console.error('Settings panel: Required DOM elements not found');
    return null;
  }
  
  // Public interface
  return {
    /**
     * Set settings values
     * @param settings - Settings to set
     */
    setSettings(settings: Partial<Settings>): void {
      if (!settings) return;
      
      // Set text size
      if (settings.textSize) {
        const textSizeRadio = document.querySelector<HTMLInputElement>(`input[name="text-size"][value="${settings.textSize}"]`);
        if (textSizeRadio) {
          textSizeRadio.checked = true;
        }
      }
      
      // Set translation level
      if (settings.translationLevel) {
        const levelIndex = ['einfachere_sprache', 'einfache_sprache', 'leichte_sprache'].indexOf(settings.translationLevel);
        if (levelIndex !== -1) {
          translationLevelSlider.value = levelIndex.toString();
        }
      }
            
      // Set speech settings
      if (settings.speech) {
        speechSettings.setSettings(settings.speech);
      }
    },
    
    /**
     * Get current settings values
     * @returns Current settings
     */
    getSettings(): Partial<Settings> {
      // Get selected text size
      const selectedTextSize = document.querySelector<HTMLInputElement>('input[name="text-size"]:checked');
      const textSize = selectedTextSize ? selectedTextSize.value as Settings['textSize'] : 'normal';
      
      // Get translation level
      const translationLevelValue = translationLevelSlider.value;
      const translationLevel = ['einfachere_sprache', 'einfache_sprache', 'leichte_sprache'][parseInt(translationLevelValue)] as Settings['translationLevel'];
      
      // Get speech settings
      const speech = speechSettings.getSettings();
      
      return {
        textSize,
        translationLevel,
        speech
      };
    }
  };
}
