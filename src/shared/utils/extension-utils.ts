/**
 * Utility functions for extension-related operations
 */

/**
 * Checks if the extension is running in developer mode (loaded unpacked)
 * @returns Promise that resolves to true if the extension is in developer mode, false otherwise
 */
export async function isInDeveloperMode(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.management || !chrome.management.getSelf) {
      // If chrome.management API is not available, assume we're not in developer mode
      console.warn('chrome.management API not available, cannot determine developer mode');
      resolve(false);
      return;
    }

    chrome.management.getSelf((info) => {
      if (chrome.runtime.lastError) {
        console.error('Error checking extension info:', chrome.runtime.lastError);
        resolve(false);
        return;
      }

      // Extensions loaded unpacked (developer mode) have installType "development"
      const isDeveloperMode = info.installType === 'development';
      console.log(`Extension is running in ${isDeveloperMode ? 'developer' : 'production'} mode`);
      resolve(isDeveloperMode);
    });
  });
}

/**
 * Synchronous check for developer mode based on extension ID
 * This is less reliable but doesn't require the management permission
 * @returns boolean indicating if the extension is likely in developer mode
 */
export function isLikelyInDeveloperMode(): boolean {
  // Extensions loaded from Chrome Web Store have IDs that are 32 characters long
  // Developer mode extensions often have IDs that look like "extension-name-directory-hash"
  const extensionId = chrome.runtime.id;
  
  // Check if the ID matches the pattern of Web Store extensions (32 character alphanumeric)
  const isWebStorePattern = /^[a-z]{32}$/.test(extensionId);
  
  // If it doesn't match the Web Store pattern, it's likely in developer mode
  return !isWebStorePattern;
}
