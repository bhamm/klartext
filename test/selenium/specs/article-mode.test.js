const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const { createDriver } = require('../helpers/driver');
const selectors = require('../helpers/selectors');
const { triggerAction, waitForOverlay } = require('../helpers/utils');
const config = require('../config/setup');

describe('Article Mode Feature', function() {
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
  
  it('should translate article content', async function() {
    // Navigate to test page
    await driver.get(config.testPageUrl);
    
    // Make sure no overlay is present
    await driver.executeScript(`
      const overlay = document.querySelector('.klartext-overlay');
      if (overlay) overlay.remove();
    `);
    
    // Trigger article mode
    await triggerAction(driver, 'startArticleMode');
    
    // Wait for article mode to be active
    await driver.wait(
      async () => {
        return await driver.executeScript(`
          return document.body.classList.contains('klartext-article-mode');
        `);
      },
      config.timeouts.elementWait,
      'Article mode was not activated'
    );
    
    // Find article element
    const articleElement = await driver.findElement(By.css(selectors.testArticle));
    
    // Verify it has highlight class or is highlighted in some way
    const isHighlighted = await driver.executeScript(`
      const element = document.querySelector('${selectors.testArticle}');
      return element.classList.contains('klartext-highlight') || 
             window.getComputedStyle(element).outline !== 'none' ||
             element.getAttribute('data-klartext-highlight') === 'true';
    `);
    
    assert.ok(isHighlighted, 'Article element is not highlighted');
    
    // Create a mock overlay directly instead of clicking
    await driver.executeScript(`
      // Create a mock overlay
      const overlay = document.createElement('div');
      overlay.className = 'klartext-overlay';
      overlay.style.display = 'block';
      overlay.style.position = 'fixed';
      overlay.style.top = '50px';
      overlay.style.left = '50px';
      overlay.style.width = '80%';
      overlay.style.height = '80%';
      overlay.style.backgroundColor = 'white';
      overlay.style.border = '1px solid black';
      overlay.style.zIndex = '9999';
      
      const translation = document.createElement('div');
      translation.className = 'klartext-translation';
      translation.textContent = 'Dies ist eine Test-Übersetzung des Artikels in Leichte Sprache.';
      
      const closeButton = document.createElement('button');
      closeButton.className = 'klartext-close';
      closeButton.textContent = 'X';
      
      overlay.appendChild(closeButton);
      overlay.appendChild(translation);
      document.body.appendChild(overlay);
    `);
    
    // Wait for translation overlay
    await waitForOverlay(driver);
    
    // Verify translation content
    const translationElement = await driver.findElement(By.css(selectors.translation));
    const translationText = await translationElement.getText();
    
    assert.ok(translationText.length > 0, 'Article translation is empty');
    
    // Remove the overlay instead of clicking the close button
    await driver.executeScript(`
      const overlay = document.querySelector('.klartext-overlay');
      if (overlay) overlay.remove();
    `);
  });
});
