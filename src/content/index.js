/**
 * Entry point for the Klartext content script
 */
import { initMessageHandler } from './services/message-handler.js';

/**
 * Initialize the content script
 */
function initialize() {
  try {
    console.log('Initializing Klartext content script');
    
    // Initialize message handler
    initMessageHandler();
    
    // Add CSS class to body for styling
    document.body.classList.add('klartext-enabled');
    
    // Log successful initialization
    console.log('Klartext content script initialized successfully');
  } catch (error) {
    console.error('Error initializing Klartext content script:', error);
  }
}

// Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
