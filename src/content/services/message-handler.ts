/**
 * Message handler service for the Klartext extension
 */
import { translationOverlay } from '../ui/translation-overlay';
import { translationControls } from '../ui/translation-controls';
import { pageTranslator } from '../controllers/page-controller';
import { ARTICLE_SELECTORS } from '../constants';
import { findClosestMatchingElement } from '../utils/dom-utils';
import { cleanArticleHTML, stripWhitespace } from '../utils/html-cleaner';
import { ContentMessage } from '../types';

// Track mode states
let isArticleMode = false;
let currentHighlight: HTMLElement | null = null;

// Track if speech controller is loaded
let speechControllerLoaded = false;
let pendingSpeechSettings: any = null;

/**
 * Initialize message handler
 */
export function initMessageHandler(): void {
  // Set up message listener
  chrome.runtime.onMessage.addListener(handleMessage);
  console.log('Klartext message handler initialized');
}

/**
 * Handle messages from the background script
 * @param {ContentMessage} message - The message object
 * @param {chrome.runtime.MessageSender} sender - The message sender
 * @param {(response?: any) => void} sendResponse - Function to send a response
 * @returns {boolean} Whether the response will be sent asynchronously
 */
function handleMessage(
  message: ContentMessage, 
  sender: chrome.runtime.MessageSender, 
  sendResponse: (response?: any) => void
): boolean {
  console.log('Content script received message:', message);

  try {
    switch (message.action) {
      case 'ping':
        // Only ping messages need a response
        sendResponse({ status: 'ok' });
        return false; // No async response needed
        
      case 'startArticleMode':
        console.log('Starting article mode');
        startArticleMode();
        break;


      case 'startTranslation':
        console.log('Starting translation, showing loading state');
        // Store the original text from the current selection
        translationOverlay.originalText = window.getSelection()?.toString() || '';
        console.log('Stored original text for feedback:', translationOverlay.originalText);
        translationOverlay.showLoading();
        break;

      case 'showTranslation':
        console.log('Showing translation:', message.translation);
        if (message.translation) {
          translationOverlay.show(message.translation);
        }
        
        preloadSpeechController();
        break;

      case 'showError':
        console.error('Showing error:', message.error);
        if (message.error) {
          translationOverlay.showError(message.error);
        }
        stopArticleMode();
        break;

      case 'updateSettings':
        console.log('Updating settings:', message.settings);
        if (message.settings) {
          if (message.settings.textSize) {
            // Remove any existing text size classes
            document.body.classList.remove('klartext-text-normal', 'klartext-text-gross', 'klartext-text-sehr-gross');
            // Add new text size class
            document.body.classList.add(`klartext-text-${message.settings.textSize}`);
          }
          
          // Update speech settings if provided
          if (message.settings.speech) {
            // Log the speech settings we're about to apply
            console.log('Received speech settings to apply:', JSON.stringify(message.settings.speech));
            
            // Store settings for later if speech controller isn't loaded yet
            if (!speechControllerLoaded) {
              pendingSpeechSettings = message.settings.speech;
              preloadSpeechController();
            } else {
              applySpeechSettings(message.settings.speech);
            }
          }
        }
        break;

      default:
        console.warn('Unknown message action:', message.action);
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }

  // No response needed for non-ping messages
  return false;
}

/**
 * Preload the speech controller
 */
function preloadSpeechController(): void {
  if (speechControllerLoaded) return;
  
  console.log('Preloading speech controller...');
  
  // Import the speech controller
  import('../controllers/speech-controller').then(({ speechController }) => {
    console.log('Speech controller loaded successfully');
    speechControllerLoaded = true;
    
    // Apply any pending settings
    if (pendingSpeechSettings) {
      console.log('Applying pending speech settings:', pendingSpeechSettings);
      applySpeechSettings(pendingSpeechSettings);
      pendingSpeechSettings = null;
    }
  }).catch(error => {
    console.error('Error importing speech controller:', error);
  });
}

/**
 * Apply speech settings to the speech controller
 * @param settings - Speech settings to apply
 */
async function applySpeechSettings(settings: any): Promise<void> {
  try {
    console.log('Applying speech settings:', settings);
    
    // Import the speech controller
    const { speechController } = await import('../controllers/speech-controller');
    
    // Force a small delay to ensure the speech controller is fully initialized
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Apply the settings
    await speechController.setSettings(settings);
    
    console.log('Speech settings updated successfully');
    
    // If we're currently playing speech, restart it with the new settings
    if (speechController.isPlaying && speechController.utterance) {
      console.log('Restarting speech with new settings');
      const currentText = speechController.utterance.text;
      speechController.stop();
      
      // Create a new utterance with the updated settings
      setTimeout(() => {
        // Create a new utterance with the text
        const newUtterance = new SpeechSynthesisUtterance(currentText);
        speechController.utterance = newUtterance;
        
        // Apply the voice settings
        speechController.start();
      }, 300);
    }
  } catch (error) {
    console.error('Error applying speech settings:', error);
  }
}

/**
 * Start article mode
 */
export function startArticleMode(): void {
  if (isArticleMode) return;
  isArticleMode = true;
  
  // Add mousemove listener
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleArticleClick);
  
  // Change cursor to indicate clickable state
  document.body.style.cursor = 'pointer';
  
  preloadSpeechController();
}

/**
 * Stop article mode
 */
export function stopArticleMode(): void {
  if (!isArticleMode) return;
  isArticleMode = false;
  
  // Remove listeners
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleArticleClick);
  
  // Reset cursor
  document.body.style.cursor = '';
  
  // Remove any existing highlight
  if (currentHighlight) {
    currentHighlight.classList.remove('klartext-highlight');
    currentHighlight = null;
  }
}

/**
 * Handle mouse movement in article mode
 * @param {MouseEvent} event - The mouse event
 */
function handleMouseMove(event: MouseEvent): void {
  if (!isArticleMode) return;
  
  // Find potential article container under cursor
  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (!element) return;
  
  // Find closest matching container
  const container = findClosestMatchingElement(element as HTMLElement, ARTICLE_SELECTORS);
  
  // Update highlight
  if (container !== currentHighlight) {
    if (currentHighlight) {
      currentHighlight.classList.remove('klartext-highlight');
    }
    if (container) {
      container.classList.add('klartext-highlight');
    }
    currentHighlight = container;
  }
}

/**
 * Handle click in article mode
 * @param {MouseEvent} event - The click event
 */
function handleArticleClick(event: MouseEvent): void {
  if (!isArticleMode || !currentHighlight) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  // Get and clean HTML content
  const html = currentHighlight.innerHTML;
  if (!html.trim()) return;
  
  // Store the original text for feedback
  translationOverlay.originalText = currentHighlight.innerText || '';
  console.log('Stored original article text for feedback:', translationOverlay.originalText.substring(0, 100) + '...');
  
  // Stop article mode
  stopArticleMode();
  
  // Show loading state
  translationOverlay.showLoading();
  
  // Clean HTML before sending (using aggressive mode to reduce token count)
  const cleanedHtml = cleanArticleHTML(html, 'aggressive');
  
  // Strip whitespace to further reduce token count
  const strippedHtml = stripWhitespace(cleanedHtml);
  
  // Send cleaned and stripped HTML to background script
  chrome.runtime.sendMessage({
    action: 'translateArticle',
    html: strippedHtml
  });
}
