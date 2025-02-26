const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const config = require('../config/setup');

/**
 * Creates and configures a WebDriver instance for testing
 * @returns {Promise<WebDriver>} Configured WebDriver instance
 */
async function createDriver() {
  // Get absolute path to extension
  const extensionPath = path.resolve(process.cwd(), config.extensionPath);
  
  // Configure Chrome options
  const options = new chrome.Options();
  options.addArguments(`--disable-extensions-except=${extensionPath}`);
  options.addArguments(`--load-extension=${extensionPath}`);
  
  if (config.browserOptions.headless) {
    options.addArguments('--headless=new');
  }
  
  if (config.browserOptions.windowSize) {
    options.addArguments(
      `--window-size=${config.browserOptions.windowSize.width},${config.browserOptions.windowSize.height}`
    );
  }
  
  // Create driver
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  
  // Configure timeouts
  await driver.manage().setTimeouts({
    implicit: config.timeouts.implicit,
    pageLoad: config.timeouts.pageLoad,
    script: config.timeouts.scriptTimeout
  });
  
  return driver;
}

/**
 * Gets the extension ID from the background service worker URL
 * @param {WebDriver} driver - WebDriver instance
 * @returns {Promise<string>} Extension ID
 */
async function getExtensionId(driver) {
  // Wait for service worker to be available
  const targets = await driver.getAllWindowHandles();
  
  // Get the extension ID from the background service worker URL
  for (const target of targets) {
    try {
      await driver.switchTo().window(target);
      const url = await driver.getCurrentUrl();
      
      if (url.startsWith('chrome-extension://') && url.includes('background')) {
        const extensionId = url.split('/')[2];
        // Switch back to the first window
        await driver.switchTo().window(targets[0]);
        return extensionId;
      }
    } catch (e) {
      // Ignore errors when switching to service worker windows
    }
  }
  
  // Switch back to the first window
  await driver.switchTo().window(targets[0]);
  throw new Error('Could not determine extension ID');
}

module.exports = {
  createDriver,
  getExtensionId
};
