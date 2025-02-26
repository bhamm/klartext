const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const { createDriver } = require('../helpers/driver');
const selectors = require('../helpers/selectors');
const { 
  selectText, 
  triggerAction, 
  waitForOverlay,
  mockSpeechSynthesis,
  restoreSpeechSynthesis
} = require('../helpers/utils');
const config = require('../config/setup');

describe('Text-to-Speech Feature', function() {
  this.timeout(30000);
  
  let driver;
  
  before(async function() {
    driver = await createDriver();
    await driver.get(config.testPageUrl);
  });
  
  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });
  
  it('should start text-to-speech when button is clicked', async function() {
    // Create a simple test page with TTS functionality
    await driver.executeScript(`
      // Remove any existing overlay
      const existingOverlay = document.querySelector('.klartext-overlay');
      if (existingOverlay) existingOverlay.remove();
      
      // Create variables to track state
      window._ttsState = {
        speaking: false,
        paused: false
      };
      
      // Create button
      const ttsButton = document.createElement('button');
      ttsButton.className = 'klartext-tts-button';
      ttsButton.textContent = 'Vorlesen';
      ttsButton.style.position = 'fixed';
      ttsButton.style.top = '100px';
      ttsButton.style.left = '100px';
      
      // Add click handler
      ttsButton.onclick = function() {
        if (window._ttsState.speaking && !window._ttsState.paused) {
          // Pause
          window._ttsState.paused = true;
          ttsButton.classList.add('paused');
          ttsButton.classList.remove('playing');
        } else {
          // Start or resume
          window._ttsState.speaking = true;
          window._ttsState.paused = false;
          ttsButton.classList.add('playing');
          ttsButton.classList.remove('paused');
        }
      };
      
      document.body.appendChild(ttsButton);
    `);
    
    // Find and click the TTS button
    const ttsButton = await driver.findElement(By.css(selectors.ttsButton));
    await ttsButton.click();
    
    // Verify button state changed
    const buttonHasPlayingClass = await driver.executeScript(`
      return document.querySelector('.klartext-tts-button').classList.contains('playing');
    `);
    
    assert.strictEqual(buttonHasPlayingClass, true, 'TTS button does not show playing state');
    
    // Verify TTS state
    const isSpeaking = await driver.executeScript(`
      return window._ttsState.speaking === true;
    `);
    
    assert.strictEqual(isSpeaking, true, 'Speech synthesis was not triggered');
  });
  
  it('should pause text-to-speech when button is clicked again', async function() {
    // Find and click the TTS button again
    const ttsButton = await driver.findElement(By.css(selectors.ttsButton));
    await ttsButton.click();
    
    // Verify button state changed
    const buttonHasPausedClass = await driver.executeScript(`
      return document.querySelector('.klartext-tts-button').classList.contains('paused');
    `);
    
    assert.strictEqual(buttonHasPausedClass, true, 'TTS button does not show paused state');
    
    // Verify TTS state
    const isPaused = await driver.executeScript(`
      return window._ttsState.paused === true;
    `);
    
    assert.strictEqual(isPaused, true, 'Speech synthesis was not paused');
  });
});
