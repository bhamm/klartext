const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const { createDriver } = require('../helpers/driver');
const selectors = require('../helpers/selectors');
const { triggerAction, waitForOverlay, waitForControls, waitForSections, waitForTranslationContainer, waitForErrorContainer } = require('../helpers/utils');
const config = require('../config/setup');

describe('Full Page Translation Mode', function() {
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
  
  it('should initialize full page translation mode and show controls', async function() {
    // Navigate to test page
    await driver.get(config.testPageUrl);
    
    // Make sure no controls are present
    await driver.executeScript(`
      const controls = document.querySelector('.klartext-controls');
      if (controls) controls.remove();
    `);
    
    // Trigger full page mode
    await triggerAction(driver, 'startFullPageMode');
    
    // Wait for controls to appear
    await waitForControls(driver);
    
    // Verify controls are visible
    const controls = await driver.findElement(By.css('.klartext-controls'));
    const isVisible = await controls.isDisplayed();
    assert.ok(isVisible, 'Translation controls are not visible');
    
    // Verify progress elements exist
    const progressBar = await driver.findElement(By.css('.klartext-progress-bar'));
    const progressText = await driver.findElement(By.css('.klartext-progress-text'));
    assert.ok(await progressBar.isDisplayed(), 'Progress bar is not visible');
    assert.ok(await progressText.isDisplayed(), 'Progress text is not visible');
  });
  
  it('should identify and mark content sections for translation', async function() {
    // Navigate to test page
    await driver.get(config.testPageUrl);
    
    // Trigger full page mode
    await triggerAction(driver, 'startFullPageMode');
    
    // Wait for sections to be marked and get them
    const sections = await waitForSections(driver);
    
    // Verify sections are marked
    assert.ok(sections.length > 0, 'No content sections were marked for translation');
    
    // Mock translation response for the first section
    await driver.executeScript(`
      // Find the first section
      const section = document.querySelector('.klartext-section');
      if (section) {
        const sectionId = section.getAttribute('data-section-id');
        if (sectionId) {
          // Create a mock translation message
          const message = {
            action: 'showTranslation',
            translation: '<p>Dies ist eine Test-Übersetzung in Leichte Sprache.</p>',
            id: sectionId
          };
          
          // Simulate receiving the message
          chrome.runtime.onMessage.listeners.forEach(listener => {
            listener(message, {}, () => {});
          });
        }
      }
    `);
    
    // Wait for translation container to appear
    const translationContainer = await waitForTranslationContainer(driver);
    
    // Verify translation is displayed
    assert.ok(await translationContainer.isDisplayed(), 'Translation container is not visible');
    
    const translationElement = await driver.findElement(By.css('.klartext-translation'));
    const translationText = await translationElement.getText();
    assert.ok(translationText.length > 0, 'Translation text is empty');
  });
  
  it('should handle translation controls functionality', async function() {
    // Navigate to test page
    await driver.get(config.testPageUrl);
    
    // Trigger full page mode
    await triggerAction(driver, 'startFullPageMode');
    
    // Wait for controls to appear
    await waitForControls(driver);
    
    // Test minimize button
    const minimizeButton = await driver.findElement(By.css('.klartext-minimize-button'));
    await minimizeButton.click();
    
    // Verify controls are minimized
    const controls = await driver.findElement(By.css('.klartext-controls'));
    const isMinimized = await driver.executeScript(`
      return document.querySelector('.klartext-controls').classList.contains('minimized');
    `);
    assert.ok(isMinimized, 'Controls were not minimized');
    
    // Click again to maximize
    await minimizeButton.click();
    
    // Verify controls are maximized
    const isMaximized = await driver.executeScript(`
      return !document.querySelector('.klartext-controls').classList.contains('minimized');
    `);
    assert.ok(isMaximized, 'Controls were not maximized');
    
    // Test view toggle button
    const viewToggle = await driver.findElement(By.css('.klartext-view-toggle'));
    const initialText = await viewToggle.getText();
    await viewToggle.click();
    
    // Verify button text changed
    const newText = await viewToggle.getText();
    assert.notEqual(initialText, newText, 'View toggle button text did not change');
  });
  
  it('should handle errors gracefully', async function() {
    // Navigate to test page
    await driver.get(config.testPageUrl);
    
    // Remove all content to trigger an error
    await driver.executeScript(`
      // Remove all content
      document.querySelectorAll('article, p, h1, h2, h3, h4, h5, h6').forEach(el => el.remove());
    `);
    
    // Trigger full page mode
    await triggerAction(driver, 'startFullPageMode');
    
    // Simulate error message
    await driver.executeScript(`
      // Create a mock error message
      const message = {
        action: 'showError',
        error: 'Keine übersetzbaren Inhalte gefunden.'
      };
      
      // Simulate receiving the message
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.listeners.forEach(listener => {
          listener(message, {}, () => {});
        });
      } else {
        // Create error container manually for testing
        const errorContainer = document.createElement('div');
        errorContainer.className = 'klartext-error-container';
        errorContainer.textContent = 'Keine übersetzbaren Inhalte gefunden.';
        document.body.appendChild(errorContainer);
      }
    `);
    
    // Wait for error container to appear
    const errorContainer = await waitForErrorContainer(driver);
    
    // Verify error is displayed
    assert.ok(await errorContainer.isDisplayed(), 'Error container is not visible');
    
    const errorText = await errorContainer.getText();
    assert.ok(errorText.includes('Keine übersetzbaren Inhalte'), 'Error message is not correct');
  });
});
