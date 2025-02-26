/**
 * Settings panel component for text size and experimental features
 */
import { getElement, toggleVisibility, addSafeEventListener } from '../utils/dom-utils.js';

/**
 * Initialize settings panel component
 * @returns {Object} Component interface
 */
export function initSettingsPanel() {
  // Get DOM elements
  const textSizeRadios = document.querySelectorAll('input[name="text-size"]');
  const enableFullpageCheckbox = getElement('enable-fullpage');
  const fullpageSettings = getElement('fullpage-settings');
  const compareViewCheckbox = getElement('compare-view');
  const excludeCommentsCheckbox = getElement('exclude-comments');
  
  if (!textSizeRadios.length || !enableFullpageCheckbox || !fullpageSettings || 
      !compareViewCheckbox || !excludeCommentsCheckbox) {
    console.error('Settings panel: Required DOM elements not found');
    return null;
  }
  
  /**
   * Handle fullpage translation toggle
   * @param {Event} event - Change event
   */
  function handleFullpageToggle(event) {
    toggleVisibility(fullpageSettings, event.target.checked);
  }
  
  // Set up event listeners
  addSafeEventListener(enableFullpageCheckbox, 'change', handleFullpageToggle);
  
  // Public interface
  return {
    /**
     * Set settings values
     * @param {Object} settings - Settings to set
     */
    setSettings(settings) {
      if (!settings) return;
      
      // Set text size
      if (settings.textSize) {
        const textSizeRadio = document.querySelector(`input[name="text-size"][value="${settings.textSize}"]`);
        if (textSizeRadio) {
          textSizeRadio.checked = true;
        }
      }
      
      // Set experimental features
      if (settings.experimentalFeatures) {
        enableFullpageCheckbox.checked = Boolean(settings.experimentalFeatures.fullPageTranslation);
        toggleVisibility(fullpageSettings, enableFullpageCheckbox.checked);
      }
      
      // Set fullpage settings
      if (settings.compareView !== undefined) {
        compareViewCheckbox.checked = Boolean(settings.compareView);
      }
      
      if (settings.excludeComments !== undefined) {
        excludeCommentsCheckbox.checked = Boolean(settings.excludeComments);
      }
    },
    
    /**
     * Get current settings values
     * @returns {Object} Current settings
     */
    getSettings() {
      // Get selected text size
      const selectedTextSize = document.querySelector('input[name="text-size"]:checked');
      const textSize = selectedTextSize ? selectedTextSize.value : 'normal';
      
      return {
        textSize,
        experimentalFeatures: {
          fullPageTranslation: enableFullpageCheckbox.checked
        },
        compareView: compareViewCheckbox.checked,
        excludeComments: excludeCommentsCheckbox.checked
      };
    }
  };
}
