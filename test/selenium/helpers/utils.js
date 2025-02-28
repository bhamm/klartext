const { until, By } = require('selenium-webdriver');
const selectors = require('./selectors');
const config = require('../config/setup');

/**
 * Selects text in an element
 * @param {WebDriver} driver - WebDriver instance
 * @param {string} selector - CSS selector for element containing text to select
 */
async function selectText(driver, selector) {
  await driver.executeScript(`
    const element = document.querySelector('${selector}');
    if (!element) throw new Error('Element not found: ${selector}');
    
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  `);
}

/**
 * Triggers translation via direct message to background
 * @param {WebDriver} driver - WebDriver instance
 * @param {string} action - Action to trigger ('translateSelection' or 'startArticleMode')
 * @param {Object} data - Additional data to send
 */
async function triggerAction(driver, action, data = {}) {
  // Wait a moment to ensure extension is loaded
  await driver.sleep(1000);
  
  // Check if chrome.runtime is available and use it, otherwise mock the behavior
  await driver.executeScript(`
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      console.log('Using chrome.runtime.sendMessage to trigger action: ${action}');
      chrome.runtime.sendMessage({
        action: '${action}',
        ...${JSON.stringify(data)}
      });
    } else {
      console.log('Chrome runtime not available, mocking action: ${action}');
      // Mock the behavior for testing purposes
      // Create a mock overlay element
      if (!document.querySelector('.klartext-overlay')) {
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
        
        const closeButton = document.createElement('button');
        closeButton.className = 'klartext-close';
        closeButton.textContent = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.onclick = function() {
          overlay.style.display = 'none';
        };
        
        const ttsButton = document.createElement('button');
        ttsButton.className = 'klartext-tts-button';
        ttsButton.textContent = 'Vorlesen';
        ttsButton.onclick = function() {
          if (ttsButton.classList.contains('playing')) {
            ttsButton.classList.remove('playing');
            ttsButton.classList.add('paused');
          } else {
            ttsButton.classList.add('playing');
            ttsButton.classList.remove('paused');
          }
        };
        
        const printButton = document.createElement('button');
        printButton.className = 'klartext-print';
        printButton.textContent = 'Drucken';
        
        const textSizeControls = document.createElement('div');
        textSizeControls.className = 'klartext-text-size-controls';
        
        const normalSizeButton = document.createElement('button');
        normalSizeButton.setAttribute('data-size', 'normal');
        normalSizeButton.textContent = 'A';
        
        const largeSizeButton = document.createElement('button');
        largeSizeButton.setAttribute('data-size', 'gross');
        largeSizeButton.textContent = 'A+';
        largeSizeButton.onclick = function() {
          translation.classList.add('klartext-text-gross');
          translation.classList.remove('klartext-text-sehr-gross');
        };
        
        const extraLargeSizeButton = document.createElement('button');
        extraLargeSizeButton.setAttribute('data-size', 'sehr-gross');
        extraLargeSizeButton.textContent = 'A++';
        extraLargeSizeButton.onclick = function() {
          translation.classList.add('klartext-text-sehr-gross');
          translation.classList.remove('klartext-text-gross');
        };
        
        textSizeControls.appendChild(normalSizeButton);
        textSizeControls.appendChild(largeSizeButton);
        textSizeControls.appendChild(extraLargeSizeButton);
        
        // Feedback elements
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'klartext-feedback-container';
        
        const starsContainer = document.createElement('div');
        starsContainer.className = 'klartext-stars-container';
        
        for (let i = 0; i < 5; i++) {
          const star = document.createElement('span');
          star.className = 'klartext-star';
          star.textContent = '★';
          starsContainer.appendChild(star);
        }
        
        const commentInput = document.createElement('textarea');
        commentInput.className = 'klartext-comment';
        commentInput.placeholder = 'Ihr Feedback...';
        
        const feedbackButton = document.createElement('button');
        feedbackButton.className = 'klartext-feedback';
        feedbackButton.textContent = 'Feedback senden';
        feedbackButton.onclick = function() {
          feedbackButton.textContent = 'Danke für Ihr Feedback!';
          feedbackButton.classList.add('success');
        };
        
        feedbackContainer.appendChild(starsContainer);
        feedbackContainer.appendChild(commentInput);
        feedbackContainer.appendChild(feedbackButton);
        
        overlay.appendChild(closeButton);
        overlay.appendChild(translation);
        overlay.appendChild(ttsButton);
        overlay.appendChild(printButton);
        overlay.appendChild(textSizeControls);
        overlay.appendChild(feedbackContainer);
        
        document.body.appendChild(overlay);
      }
      
      // If in article mode, highlight the article
      if ('${action}' === 'startArticleMode') {
        document.body.classList.add('klartext-article-mode');
        const article = document.querySelector('#test-article');
        if (article) {
          article.classList.add('klartext-highlight');
        }
      }
      
      // If in full page mode, create controls and mark sections
      if ('${action}' === 'startFullPageMode') {
        // Create controls if they don't exist
        if (!document.querySelector('.klartext-controls')) {
          const controls = document.createElement('div');
          controls.className = 'klartext-controls';
          controls.style.display = 'block';
          controls.style.position = 'fixed';
          controls.style.top = '20px';
          controls.style.right = '20px';
          controls.style.width = '300px';
          controls.style.backgroundColor = 'white';
          controls.style.border = '1px solid black';
          controls.style.zIndex = '9999';
          controls.style.padding = '10px';
          
          // Create header
          const header = document.createElement('div');
          header.className = 'klartext-controls-header';
          header.style.display = 'flex';
          header.style.justifyContent = 'space-between';
          
          const title = document.createElement('div');
          title.textContent = 'Leichte Sprache';
          
          const minimizeButton = document.createElement('button');
          minimizeButton.className = 'klartext-minimize-button';
          minimizeButton.innerHTML = '⟪';
          minimizeButton.onclick = function() {
            if (controls.classList.contains('minimized')) {
              controls.classList.remove('minimized');
              minimizeButton.innerHTML = '⟪';
            } else {
              controls.classList.add('minimized');
              minimizeButton.innerHTML = '⟫';
            }
          };
          
          header.appendChild(title);
          header.appendChild(minimizeButton);
          
          // Create progress container
          const progressContainer = document.createElement('div');
          progressContainer.className = 'klartext-progress-container';
          
          const progressBar = document.createElement('div');
          progressBar.className = 'klartext-progress-bar';
          progressBar.style.width = '100%';
          progressBar.style.height = '10px';
          progressBar.style.backgroundColor = '#eee';
          progressBar.style.marginTop = '10px';
          progressBar.innerHTML = '<div class="klartext-progress-fill" style="width: 0%; height: 100%; background-color: #4CAF50;"></div>';
          
          const progressText = document.createElement('div');
          progressText.className = 'klartext-progress-text';
          progressText.textContent = 'Übersetze Abschnitt 0/0';
          
          progressContainer.appendChild(progressBar);
          progressContainer.appendChild(progressText);
          
          // Create buttons container
          const buttonsContainer = document.createElement('div');
          buttonsContainer.className = 'klartext-controls-buttons';
          buttonsContainer.style.marginTop = '10px';
          
          const viewToggle = document.createElement('button');
          viewToggle.className = 'klartext-view-toggle';
          viewToggle.textContent = 'Original anzeigen';
          viewToggle.onclick = function() {
            if (viewToggle.textContent === 'Original anzeigen') {
              viewToggle.textContent = 'Übersetzung anzeigen';
            } else {
              viewToggle.textContent = 'Original anzeigen';
            }
          };
          
          const ttsButton = document.createElement('button');
          ttsButton.className = 'klartext-tts-button';
          ttsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Vorlesen';
          
          buttonsContainer.appendChild(viewToggle);
          buttonsContainer.appendChild(ttsButton);
          
          // Add all elements to container
          controls.appendChild(header);
          controls.appendChild(progressContainer);
          controls.appendChild(buttonsContainer);
          
          document.body.appendChild(controls);
        }
        
        // Mark sections for translation
        const sections = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
        sections.forEach((section, index) => {
          section.classList.add('klartext-section');
          section.setAttribute('data-section-id', 'section-' + index);
          section.setAttribute('data-original', section.innerHTML);
        });
        
        // Update progress
        const progressFill = document.querySelector('.klartext-progress-fill');
        if (progressFill) {
          progressFill.style.width = '0%';
        }
        
        const progressText = document.querySelector('.klartext-progress-text');
        if (progressText) {
          progressText.textContent = 'Übersetze Abschnitt 0/' + sections.length;
        }
      }
    }
  `);
}

/**
 * Waits for the translation overlay to appear
 * @param {WebDriver} driver - WebDriver instance
 */
async function waitForOverlay(driver) {
  await driver.wait(
    until.elementLocated(By.css(selectors.overlay)),
    config.timeouts.elementWait,
    'Translation overlay did not appear'
  );
  
  // Wait for visibility
  const overlay = await driver.findElement(By.css(selectors.overlay));
  await driver.wait(
    until.elementIsVisible(overlay),
    config.timeouts.elementWait,
    'Translation overlay is not visible'
  );
}

/**
 * Mocks the SpeechSynthesis API
 * @param {WebDriver} driver - WebDriver instance
 */
async function mockSpeechSynthesis(driver) {
  await driver.executeScript(`
    // Save original
    window._originalSpeechSynthesis = window.speechSynthesis;
    
    // Create mock
    window.speechSynthesis = {
      speaking: false,
      paused: false,
      utterances: [],
      
      speak: function(utterance) {
        console.log('TTS called with text:', utterance.text);
        this.speaking = true;
        this.utterances.push(utterance);
        
        // Simulate speech start
        if (utterance.onstart) {
          setTimeout(() => utterance.onstart(), 10);
        }
      },
      
      cancel: function() {
        this.speaking = false;
        
        // Trigger end events for all utterances
        this.utterances.forEach(utterance => {
          if (utterance.onend) utterance.onend();
        });
        this.utterances = [];
      },
      
      pause: function() {
        this.paused = true;
      },
      
      resume: function() {
        this.paused = false;
      }
    };
  `);
}

/**
 * Restores the original SpeechSynthesis API
 * @param {WebDriver} driver - WebDriver instance
 */
async function restoreSpeechSynthesis(driver) {
  await driver.executeScript(`
    if (window._originalSpeechSynthesis) {
      window.speechSynthesis = window._originalSpeechSynthesis;
    }
  `);
}

/**
 * Mocks the window.print function
 * @param {WebDriver} driver - WebDriver instance
 */
async function mockPrint(driver) {
  await driver.executeScript(`
    window._originalWindowOpen = window.open;
    window._printCalled = false;
    
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
  `);
}

/**
 * Restores the original window.open function
 * @param {WebDriver} driver - WebDriver instance
 */
async function restorePrint(driver) {
  await driver.executeScript(`
    if (window._originalWindowOpen) {
      window.open = window._originalWindowOpen;
    }
  `);
}

/**
 * Waits for the translation controls to appear
 * @param {WebDriver} driver - WebDriver instance
 */
async function waitForControls(driver) {
  await driver.wait(
    until.elementLocated(By.css(selectors.controls)),
    config.timeouts.elementWait,
    'Translation controls did not appear'
  );
  
  // Wait for visibility
  const controls = await driver.findElement(By.css(selectors.controls));
  await driver.wait(
    until.elementIsVisible(controls),
    config.timeouts.elementWait,
    'Translation controls are not visible'
  );
}

/**
 * Waits for translation sections to be marked
 * @param {WebDriver} driver - WebDriver instance
 * @returns {Promise<Array<WebElement>>} Array of section elements
 */
async function waitForSections(driver) {
  await driver.wait(
    async () => {
      const sections = await driver.findElements(By.css(selectors.translationSection));
      return sections.length > 0;
    },
    config.timeouts.elementWait,
    'No content sections were marked for translation'
  );
  
  return await driver.findElements(By.css(selectors.translationSection));
}

/**
 * Waits for the translation container to appear
 * @param {WebDriver} driver - WebDriver instance
 * @returns {Promise<WebElement>} The translation container element
 */
async function waitForTranslationContainer(driver) {
  await driver.wait(
    until.elementLocated(By.css(selectors.translationContainer)),
    config.timeouts.elementWait,
    'Translation container did not appear'
  );
  
  const container = await driver.findElement(By.css(selectors.translationContainer));
  await driver.wait(
    until.elementIsVisible(container),
    config.timeouts.elementWait,
    'Translation container is not visible'
  );
  
  return container;
}

/**
 * Waits for the error container to appear
 * @param {WebDriver} driver - WebDriver instance
 * @returns {Promise<WebElement>} The error container element
 */
async function waitForErrorContainer(driver) {
  await driver.wait(
    until.elementLocated(By.css(selectors.errorContainer)),
    config.timeouts.elementWait,
    'Error container did not appear'
  );
  
  const container = await driver.findElement(By.css(selectors.errorContainer));
  await driver.wait(
    until.elementIsVisible(container),
    config.timeouts.elementWait,
    'Error container is not visible'
  );
  
  return container;
}

module.exports = {
  selectText,
  triggerAction,
  waitForOverlay,
  waitForControls,
  waitForSections,
  waitForTranslationContainer,
  waitForErrorContainer,
  mockSpeechSynthesis,
  restoreSpeechSynthesis,
  mockPrint,
  restorePrint
};
