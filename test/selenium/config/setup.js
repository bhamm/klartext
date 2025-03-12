const chrome = require('selenium-webdriver/chrome');
const options = new chrome.Options();

// Add headless mode for CI environment
if (process.env.CI) {
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
}

// Configuration for Selenium tests
module.exports = {
  // Extension path (relative to project root)
  extensionPath: './',
  
  // Test page URL (local file or hosted)
  testPageUrl: 'file://' + __dirname + '/../fixtures/test-page.html',
  
  // Browser options
  browserOptions: options,
  
  // Test timeouts
  timeouts: {
    implicit: 5000,        // Default wait time
    pageLoad: 10000,       // Page load timeout
    scriptTimeout: 10000,  // Script execution timeout
    elementWait: 5000      // Wait for element timeout
  }
};
