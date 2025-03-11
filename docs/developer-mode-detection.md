# Developer Mode Detection

This document explains how to detect if the Klartext extension is running in developer mode (loaded unpacked) versus production mode (installed from the Chrome Web Store).

## Overview

The extension provides two methods to detect developer mode:

1. **Primary Method (Management API)**: Uses the Chrome Management API to check if the extension's `installType` is "development".
2. **Fallback Method (Extension ID)**: Checks the extension ID pattern, as developer mode extensions typically have different ID patterns than Web Store extensions.

## How to Use

To check if the extension is running in developer mode, send a message to the background script with the action `checkDeveloperMode`:

```javascript
chrome.runtime.sendMessage(
    { action: 'checkDeveloperMode' },
    function(response) {
        if (response && response.success) {
            console.log('Developer mode (Management API):', response.isDeveloperMode);
            console.log('Likely developer mode (ID check):', response.isLikelyDeveloperMode);
            
            // Use the result
            if (response.isDeveloperMode || response.isLikelyDeveloperMode) {
                // Extension is in developer mode
                // Show developer features, debug info, etc.
            } else {
                // Extension is in production mode
                // Hide developer features, etc.
            }
        } else {
            console.error('Error checking developer mode:', response?.error);
        }
    }
);
```

## Response Format

The response object contains the following properties:

- `success`: Boolean indicating if the check was successful
- `isDeveloperMode`: Boolean indicating if the extension is in developer mode (based on Management API)
- `isLikelyDeveloperMode`: Boolean indicating if the extension is likely in developer mode (based on ID pattern)
- `error`: Error message if the check failed (only present if `success` is `false`)

## Implementation Details

### Management API Method

This method uses the Chrome Management API to check the `installType` of the extension. It requires the `management` permission in the manifest.

```typescript
async function isInDeveloperMode(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.management || !chrome.management.getSelf) {
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
      resolve(isDeveloperMode);
    });
  });
}
```

### Extension ID Method

This method checks the pattern of the extension ID. Extensions installed from the Chrome Web Store typically have IDs that are 32 characters long and only contain lowercase letters. Developer mode extensions often have different patterns.

```typescript
function isLikelyInDeveloperMode(): boolean {
  // Extensions loaded from Chrome Web Store have IDs that are 32 characters long
  // Developer mode extensions often have IDs that look like "extension-name-directory-hash"
  const extensionId = chrome.runtime.id;
  
  // Check if the ID matches the pattern of Web Store extensions (32 character alphanumeric)
  const isWebStorePattern = /^[a-z]{32}$/.test(extensionId);
  
  // If it doesn't match the Web Store pattern, it's likely in developer mode
  return !isWebStorePattern;
}
```

## Use Cases

- Show/hide developer-only features
- Display debug information in developer mode
- Enable additional logging in developer mode
- Show different UI elements based on mode
- Adjust API endpoints based on mode (e.g., use staging APIs in developer mode)

## Translation Payload Logging

When the extension is running in developer mode, it will automatically log the translation payload and results to the console. This is useful for debugging translation issues and understanding how the translation process works.

The following information is logged:

1. **Translation Payload**:
   - The first 500 characters of the text being translated (truncated for readability)
   - The full length of the text
   - API configuration (provider, model, endpoint, translation level)
   - Whether the text is an article or not

2. **Translation Result**:
   - The first 500 characters of the translated text (truncated for readability)
   - The full length of the translated text

Example console output:

```
[DEVELOPER MODE] Translation payload: {
  text: "Der Bundestag ist das Parlament der Bundesrepublik Deutschland mit Sitz in Berlin...",
  fullTextLength: 1250,
  apiConfig: {
    provider: "openAI",
    model: "gpt-4-turbo",
    endpoint: "https://api.openai.com/v1/chat/completions",
    translationLevel: "leichte_sprache"
  },
  isArticle: true
}

[DEVELOPER MODE] Translation result: {
  result: "Der Bundestag ist das Parlament in Deutschland. Das Parlament ist in Berlin...",
  fullResultLength: 980
}
```

This logging is automatically enabled when the extension is running in developer mode and requires no additional configuration.

## Example

See the `examples/developer-mode-detection.html` file for a complete example of how to use this feature.
