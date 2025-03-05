/**
 * Settings panel component for text size and experimental features
 */
import { getElement, toggleVisibility, addSafeEventListener } from '../utils/dom-utils';
import { Settings, SettingsPanelComponent, ExperimentalFeatures } from '../../shared/types/settings';
import { speechSettings } from './speech-settings';

/**
 * Initialize settings panel component
 * @returns Component interface
 */
export function initSettingsPanel(): SettingsPanelComponent | null {
  // Get DOM elements
  const textSizeRadios = document.querySelectorAll<HTMLInputElement>('input[name="text-size"]');
  const enableFullpageCheckbox = getElement<HTMLInputElement>('enable-fullpage');
  const fullpageSettings = getElement<HTMLElement>('fullpage-settings');
  const compareViewCheckbox = getElement<HTMLInputElement>('compare-view');
  const excludeCommentsCheckbox = getElement<HTMLInputElement>('exclude-comments');
  
  if (!textSizeRadios.length || !enableFullpageCheckbox || !fullpageSettings || 
      !compareViewCheckbox || !excludeCommentsCheckbox) {
    console.error('Settings panel: Required DOM elements not found');
    return null;
  }
  
  /**
   * Handle fullpage translation toggle
   * @param event - Change event
   */
  function handleFullpageToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    toggleVisibility(fullpageSettings, target.checked);
  }
  
  // Set up event listeners
  addSafeEventListener(enableFullpageCheckbox, 'change', handleFullpageToggle);
  
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
      
      // Set experimental features
      if (settings.experimentalFeatures) {
        enableFullpageCheckbox!.checked = Boolean(settings.experimentalFeatures.fullPageTranslation);
        toggleVisibility(fullpageSettings!, enableFullpageCheckbox!.checked);
      }
      
      // Set fullpage settings
      if (settings.compareView !== undefined) {
        compareViewCheckbox!.checked = Boolean(settings.compareView);
      }
      
      if (settings.excludeComments !== undefined) {
        excludeCommentsCheckbox!.checked = Boolean(settings.excludeComments);
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
      
      // Get speech settings
      const speech = speechSettings.getSettings();
      
      return {
        textSize,
        experimentalFeatures: {
          fullPageTranslation: enableFullpageCheckbox!.checked
        } as ExperimentalFeatures,
        compareView: compareViewCheckbox!.checked,
        excludeComments: excludeCommentsCheckbox!.checked,
        speech
      };
    }
  };
}
