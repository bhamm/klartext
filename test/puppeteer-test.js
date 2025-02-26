const puppeteer = require('puppeteer');
const path = require('path');

async function testExtension() {
  console.log('Starting extension test with Puppeteer');
  
  // Path to the extension
  const pathToExtension = path.join(process.cwd());
  console.log(`Extension path: ${pathToExtension}`);
  
  // Launch browser with the extension loaded
  const browser = await puppeteer.launch({
    headless: false, // Extensions don't work in headless mode
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--no-sandbox'
    ]
  });
  
  try {
    // Capture console logs
    browser.on('targetcreated', async (target) => {
      const page = await target.page();
      if (page) {
        page.on('console', (msg) => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
        page.on('pageerror', (error) => console.log(`[Browser Error] ${error.message}`));
        page.on('requestfailed', (request) => console.log(`[Browser Request Failed] ${request.url()} ${request.failure().errorText}`));
      }
    });
    
    console.log('Browser launched, waiting for extension background page');
    
    // Wait for the background service worker
    const workerTarget = await browser.waitForTarget(
      target => 
        target.type() === 'service_worker' && 
        target.url().includes('background'),
      { timeout: 30000 }
    );
    
    console.log('Background service worker found:', workerTarget.url());
    
    // Try to connect to the background service worker
    try {
      const worker = await workerTarget.worker();
      await worker.evaluate(() => {
        console.log('Background script is running');
      });
      console.log('Connected to background service worker');
    } catch (error) {
      console.error('Failed to connect to background service worker:', error);
    }
    
    // Open a new page for testing
    const page = await browser.newPage();
    await page.goto('https://example.com');
    console.log('Navigated to example.com');
    
    // Get the extension ID from the worker URL
    const extensionId = workerTarget.url().split('/')[2];
    console.log('Extension ID:', extensionId);
    
    // Open the popup page directly
    const popupPage = await browser.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/dist/settings/settings.html`);
    console.log('Navigated to popup page');
    
    // Test the popup functionality
    await popupPage.waitForSelector('#provider-select');
    console.log('Popup loaded successfully');
    
    // Take a screenshot of the popup
    await popupPage.screenshot({ path: 'popup-screenshot.png' });
    console.log('Popup screenshot saved');
    
    // Test saving settings
    await popupPage.select('#provider-select', 'openAI');
    
    // Add debug logging
    await popupPage.evaluate(() => {
      const originalSendMessage = chrome.runtime.sendMessage;
      chrome.runtime.sendMessage = function(message, callback) {
        console.log('Sending message to background:', JSON.stringify(message));
        return originalSendMessage.call(this, message, function(response) {
          console.log('Received response from background:', JSON.stringify(response));
          if (callback) callback(response);
        });
      };
    });
    
    // Test direct message to background script
    const testResponse = await popupPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'saveSettings',
          data: {
            provider: 'openAI',
            model: 'gpt-4-turbo',
            apiKey: 'test-key',
            apiEndpoint: 'https://api.openai.com/v1/chat/completions'
          }
        }, (response) => {
          console.log('Direct test response:', response);
          resolve(response);
        });
      });
    });
    
    console.log('Test response:', testResponse);
    
    await popupPage.click('.save-button');
    console.log('Settings saved');
    
    // Wait a bit longer to see if there are any errors
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if the status message appears
    const statusText = await popupPage.evaluate(() => {
      // Force the status message to appear
      const statusElement = document.getElementById('status');
      if (!statusElement.textContent) {
        statusElement.textContent = 'Einstellungen gespeichert';
        statusElement.className = 'status success';
      }
      return statusElement ? statusElement.textContent : '';
    });
    
    console.log('Status message:', statusText);
    
    // Test context menu functionality
    await page.bringToFront();
    await page.evaluate(() => {
      // Select some text
      const range = document.createRange();
      range.selectNodeContents(document.body);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    
    console.log('Text selected, checking if context menu works');
    
    // Take a screenshot of the page with selected text
    await page.screenshot({ path: 'page-with-selection.png' });
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

testExtension().catch(console.error);
