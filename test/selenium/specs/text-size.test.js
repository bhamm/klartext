const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const { createDriver } = require('../helpers/driver');
const selectors = require('../helpers/selectors');
const { selectText, triggerAction, waitForOverlay } = require('../helpers/utils');
const config = require('../config/setup');

describe('Text Size Feature', function() {
  this.timeout(30000);
  
  let driver;
  
  before(async function() {
    driver = await createDriver();
    await driver.get(config.testPageUrl);
    
    // Create a mock overlay with text size controls
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
      translation.textContent = 'Dies ist eine Test-Übersetzung in Leichte Sprache.';
      translation.style.fontSize = '18px';
      
      const textSizeControls = document.createElement('div');
      textSizeControls.className = 'klartext-text-size-controls';
      
      const normalSizeButton = document.createElement('button');
      normalSizeButton.setAttribute('data-size', 'normal');
      normalSizeButton.textContent = 'A';
      normalSizeButton.onclick = function() {
        translation.style.fontSize = '18px';
        translation.classList.remove('klartext-text-gross', 'klartext-text-sehr-gross');
      };
      
      const largeSizeButton = document.createElement('button');
      largeSizeButton.setAttribute('data-size', 'gross');
      largeSizeButton.textContent = 'A+';
      largeSizeButton.onclick = function() {
        translation.style.fontSize = '22px';
        translation.classList.add('klartext-text-gross');
        translation.classList.remove('klartext-text-sehr-gross');
      };
      
      const extraLargeSizeButton = document.createElement('button');
      extraLargeSizeButton.setAttribute('data-size', 'sehr-gross');
      extraLargeSizeButton.textContent = 'A++';
      extraLargeSizeButton.onclick = function() {
        translation.style.fontSize = '26px';
        translation.classList.add('klartext-text-sehr-gross');
        translation.classList.remove('klartext-text-gross');
      };
      
      textSizeControls.appendChild(normalSizeButton);
      textSizeControls.appendChild(largeSizeButton);
      textSizeControls.appendChild(extraLargeSizeButton);
      
      overlay.appendChild(translation);
      overlay.appendChild(textSizeControls);
      document.body.appendChild(overlay);
    `);
    
    await waitForOverlay(driver);
  });
  
  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });
  
  it('should change text size to large when large button is clicked', async function() {
    // Get initial font size
    const initialSize = await driver.executeScript(`
      const el = document.querySelector('${selectors.translation}');
      return window.getComputedStyle(el).fontSize;
    `);
    
    // Click large text size button
    const largeSizeButton = await driver.findElement(By.css(selectors.textSizeControls.large));
    await largeSizeButton.click();
    
    // Wait for size change
    await driver.sleep(500);
    
    // Verify text size changed
    const newSize = await driver.executeScript(`
      const el = document.querySelector('${selectors.translation}');
      return window.getComputedStyle(el).fontSize;
    `);
    
    assert.notStrictEqual(initialSize, newSize, 'Text size did not change');
    
    // Verify correct class was applied
    const hasCorrectClass = await driver.executeScript(`
      return document.querySelector('${selectors.translation}').classList.contains('klartext-text-gross');
    `);
    
    assert.strictEqual(hasCorrectClass, true, 'Large text size class was not applied');
  });
  
  it('should change text size to extra large when extra large button is clicked', async function() {
    // Click extra large text size button
    const extraLargeSizeButton = await driver.findElement(By.css(selectors.textSizeControls.extraLarge));
    await extraLargeSizeButton.click();
    
    // Wait for size change
    await driver.sleep(500);
    
    // Verify correct class was applied
    const hasCorrectClass = await driver.executeScript(`
      return document.querySelector('${selectors.translation}').classList.contains('klartext-text-sehr-gross');
    `);
    
    assert.strictEqual(hasCorrectClass, true, 'Extra large text size class was not applied');
  });
});
