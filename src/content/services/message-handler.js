/**
 * Message handler service for the Klartext extension
 */
import { translationOverlay } from '../ui/translation-overlay.js';
import { translationControls } from '../ui/translation-controls.js';
import { pageTranslator } from '../controllers/page-controller.js';
import { ARTICLE_SELECTORS } from '../constants.js';
import { findClosestMatchingElement } from '../utils/dom-utils.js';
import { cleanArticleHTML } from '../utils/html-cleaner.js';

// Track mode states
let isArticleMode = false;
let isFullPageMode = false;
let currentHighlight = null;

/**
 * Initialize message handler
 */
export function initMessageHandler() {
  // Set up message listener
  chrome.runtime.onMessage.addListener(handleMessage);
  console.log('Klartext message handler initialized');
}

/**
 * Handle messages from the background script
 * @param {Object} message - The message object
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Function to send a response
 * @returns {boolean} Whether the response will be sent asynchronously
 */
function handleMessage(message, sender, sendResponse) {
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

      case 'startFullPageMode':
        console.log('Starting full page translation mode');
        startFullPageMode();
        break;

      case 'startTranslation':
        console.log('Starting translation, showing loading state');
        if (isFullPageMode) {
          if (translationControls) {
            translationControls.show();
          }
        } else {
          translationOverlay.showLoading();
        }
        break;

      case 'showTranslation':
        console.log('Showing translation:', message.translation);
        if (isFullPageMode && pageTranslator) {
          pageTranslator.appendTranslation(message.translation, message.id);
        } else {
          translationOverlay.show(message.translation);
        }
        break;

      case 'showError':
        console.error('Showing error:', message.error);
        if (isFullPageMode && pageTranslator) {
          pageTranslator.showError(message.error);
        } else {
          translationOverlay.showError(message.error);
        }
        stopArticleMode();
        stopFullPageMode();
        break;

      case 'updateSettings':
        console.log('Updating settings:', message.settings);
        if (message.settings.textSize) {
          // Remove any existing text size classes
          document.body.classList.remove('klartext-text-normal', 'klartext-text-gross', 'klartext-text-sehr-gross');
          // Add new text size class
          document.body.classList.add(`klartext-text-${message.settings.textSize}`);
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
 * Start article mode
 */
export function startArticleMode() {
  if (isArticleMode) return;
  isArticleMode = true;
  
  // Add mousemove listener
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleArticleClick);
  
  // Change cursor to indicate clickable state
  document.body.style.cursor = 'pointer';
}

/**
 * Stop article mode
 */
export function stopArticleMode() {
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
function handleMouseMove(event) {
  if (!isArticleMode) return;
  
  // Find potential article container under cursor
  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (!element) return;
  
  // Find closest matching container
  const container = findClosestMatchingElement(element, ARTICLE_SELECTORS);
  
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
function handleArticleClick(event) {
  if (!isArticleMode || !currentHighlight) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  // Get and clean HTML content
  const html = currentHighlight.innerHTML;
  if (!html.trim()) return;
  
  // Stop article mode
  stopArticleMode();
  
  // Show loading state
  translationOverlay.showLoading();
  
  // Clean HTML before sending
  const cleanedHtml = cleanArticleHTML(html);
  
  // Send cleaned HTML to background script
  chrome.runtime.sendMessage({
    action: 'translateArticle',
    html: cleanedHtml
  });
}

/**
 * Start full page translation mode
 */
export async function startFullPageMode() {
  if (isFullPageMode) return;
  isFullPageMode = true;
  
  // Initialize page translator
  pageTranslator.setControls(translationControls);
  
  try {
    await pageTranslator.initialize();
  } catch (error) {
    console.error('Error initializing page translator:', error);
    pageTranslator.showError(error.message);
    stopFullPageMode();
  }
}

/**
 * Stop full page translation mode
 */
export function stopFullPageMode() {
  if (!isFullPageMode) return;
  isFullPageMode = false;
  translationControls.hide();
}
