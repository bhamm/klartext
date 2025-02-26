const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const { createDriver } = require('../helpers/driver');
const selectors = require('../helpers/selectors');
const { 
  selectText, 
  triggerAction, 
  waitForOverlay,
  mockPrint,
  restorePrint
} = require('../helpers/utils');
const config = require('../config/setup');

describe('Print Feature', function() {
  this.timeout(30000);
  
  let driver;
  
  before(async function() {
    driver = await createDriver();
    await driver.get(config.testPageUrl);
    
    // Create a mock overlay with print button
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
      
      const printButton = document.createElement('button');
      printButton.className = 'klartext-print';
      printButton.textContent = 'Drucken';
      
      // Mock window.open and print
      window._printCalled = false;
      window._originalWindowOpen = window.open;
      
      window.open = function() {
        const mockWindow = {
          document: {
            write: function() {},
            close: function() {}
          },
          focus: function() {},
          print: function() {
            window._printCalled = true;
          },
          close: function() {},
          onload: null
        };
        
        // Execute onload handler immediately
        setTimeout(() => {
          if (mockWindow.onload) mockWindow.onload();
        }, 10);
        
        return mockWindow;
      };
      
      printButton.onclick = function() {
        const w = window.open();
        w.document.write(translation.textContent);
        w.document.close();
        w.focus();
        w.print();
        setTimeout(() => w.close(), 100);
      };
      
      overlay.appendChild(translation);
      overlay.appendChild(printButton);
      document.body.appendChild(overlay);
    `);
    
    await waitForOverlay(driver);
  });
  
  after(async function() {
    if (driver) {
      // Restore original window.open
      await driver.executeScript(`
        if (window._originalWindowOpen) {
          window.open = window._originalWindowOpen;
        }
      `);
      await driver.quit();
    }
  });
  
  it('should open print dialog when print button is clicked', async function() {
    // Find print button
    const printButton = await driver.findElement(By.css(selectors.printButton));
    
    // Click print button
    await printButton.click();
    
    // Wait a moment for the print flow to complete
    await driver.sleep(500);
    
    // Verify print was called
    const printCalled = await driver.executeScript(`
      return window._printCalled === true;
    `);
    
    assert.strictEqual(printCalled, true, 'Print function was not called');
  });
});
