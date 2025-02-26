const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const { createDriver } = require('../helpers/driver');
const selectors = require('../helpers/selectors');
const { selectText, triggerAction, waitForOverlay } = require('../helpers/utils');
const config = require('../config/setup');

describe('Translate Selection Feature', function() {
  // Increase timeout for extension tests
  this.timeout(30000);
  
  let driver;
  
  before(async function() {
    driver = await createDriver();
  });
  
  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });
  
  it('should translate selected text', async function() {
    // Navigate to test page
    await driver.get(config.testPageUrl);
    
    // Select text in test paragraph
    await selectText(driver, selectors.testParagraph);
    
    // Get the selected text
    const selectedText = await driver.executeScript(`
      return window.getSelection().toString();
    `);
    
    // Verify text was selected
    assert.ok(selectedText.length > 0, 'No text was selected');
    
    // Trigger translation
    await triggerAction(driver, 'translateSelection', { 
      text: selectedText 
    });
    
    // Wait for overlay to appear
    await waitForOverlay(driver);
    
    // Verify translation content appears
    const translationElement = await driver.findElement(By.css(selectors.translation));
    const translationText = await translationElement.getText();
    
    assert.ok(translationText.length > 0, 'Translation is empty');
    
    // Close the overlay
    const closeButton = await driver.findElement(By.css(selectors.closeButton));
    await closeButton.click();
    
    // Verify overlay is closed
    await driver.wait(
      async () => {
        const overlay = await driver.findElement(By.css(selectors.overlay));
        return !(await overlay.isDisplayed());
      },
      config.timeouts.elementWait,
      'Overlay did not close'
    );
  });
});
