// Configuration for Selenium tests
module.exports = {
  // Extension path (relative to project root)
  extensionPath: './',
  
  // Test page URL (local file or hosted)
  testPageUrl: 'file://' + __dirname + '/../fixtures/test-page.html',
  
  // Browser options
  browserOptions: {
    headless: false, // Set to true for CI environments with '--headless=new'
    windowSize: { width: 1280, height: 800 }
  },
  
  // Test timeouts
  timeouts: {
    implicit: 5000,        // Default wait time
    pageLoad: 10000,       // Page load timeout
    scriptTimeout: 10000,  // Script execution timeout
    elementWait: 5000      // Wait for element timeout
  }
};
