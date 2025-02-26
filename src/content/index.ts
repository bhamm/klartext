/**
 * Content script entry point for the Klartext extension
 */
import { initMessageHandler } from './services/message-handler';

/**
 * Initialize the content script
 */
function init(): void {
  console.log('Klartext content script initialized');
  
  // Initialize message handler
  initMessageHandler();
  
  // Notify background script that content script is ready
  chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error pinging background script:', chrome.runtime.lastError);
      return;
    }
    
    if (response && response.status === 'ok') {
      console.log('Connected to background script');
    }
  });
}

// Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
