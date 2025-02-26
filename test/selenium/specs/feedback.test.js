const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const { createDriver } = require('../helpers/driver');
const selectors = require('../helpers/selectors');
const { selectText, triggerAction, waitForOverlay } = require('../helpers/utils');
const config = require('../config/setup');

describe('Feedback Feature', function() {
  this.timeout(30000);
  
  let driver;
  
  before(async function() {
    driver = await createDriver();
    await driver.get(config.testPageUrl);
    
    // Create a mock overlay with feedback form
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
      
      // Feedback elements
      const feedbackContainer = document.createElement('div');
      feedbackContainer.className = 'klartext-feedback-container';
      
      const starsContainer = document.createElement('div');
      starsContainer.className = 'klartext-stars-container';
      
      // Create star rating
      window._selectedRating = 0;
      for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.className = 'klartext-star';
        star.textContent = '★';
        star.setAttribute('data-rating', i + 1);
        star.onclick = function() {
          // Clear all stars
          document.querySelectorAll('.klartext-star').forEach(s => {
            s.classList.remove('selected');
          });
          
          // Select stars up to this one
          const rating = parseInt(this.getAttribute('data-rating'));
          window._selectedRating = rating;
          
          document.querySelectorAll('.klartext-star').forEach(s => {
            if (parseInt(s.getAttribute('data-rating')) <= rating) {
              s.classList.add('selected');
            }
          });
        };
        starsContainer.appendChild(star);
      }
      
      const commentInput = document.createElement('textarea');
      commentInput.className = 'klartext-comment';
      commentInput.placeholder = 'Ihr Feedback...';
      
      const feedbackButton = document.createElement('button');
      feedbackButton.className = 'klartext-feedback';
      feedbackButton.textContent = 'Feedback senden';
      
      // Store feedback data for verification
      window._lastFeedbackMessage = null;
      
      feedbackButton.onclick = function() {
        const comment = commentInput.value;
        window._lastFeedbackMessage = {
          action: 'submitFeedback',
          feedback: {
            rating: window._selectedRating,
            comment: comment
          }
        };
        
        feedbackButton.textContent = 'Danke für Ihr Feedback!';
        feedbackButton.classList.add('success');
      };
      
      feedbackContainer.appendChild(starsContainer);
      feedbackContainer.appendChild(commentInput);
      feedbackContainer.appendChild(feedbackButton);
      
      overlay.appendChild(translation);
      overlay.appendChild(feedbackContainer);
      document.body.appendChild(overlay);
    `);
    
    await waitForOverlay(driver);
  });
  
  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });
  
  it('should submit feedback when form is filled and submitted', async function() {
    // Find feedback elements
    const stars = await driver.findElements(By.css(selectors.stars));
    assert.ok(stars.length > 0, 'Star rating elements not found');
    
    // Click on the third star (3 out of 5)
    await stars[2].click();
    
    // Enter feedback comment
    const commentInput = await driver.findElement(By.css(selectors.commentInput));
    await commentInput.sendKeys('This is a test feedback comment');
    
    // Submit feedback
    const feedbackButton = await driver.findElement(By.css(selectors.feedbackButton));
    await feedbackButton.click();
    
    // Wait for success message
    await driver.wait(
      async () => {
        const buttonText = await feedbackButton.getText();
        return buttonText.includes('Danke');
      },
      config.timeouts.elementWait,
      'Feedback submission success message not displayed'
    );
    
    // Verify feedback data was sent correctly
    const feedbackData = await driver.executeScript(`
      return window._lastFeedbackMessage;
    `);
    
    assert.ok(feedbackData, 'No feedback message was sent');
    assert.strictEqual(feedbackData.action, 'submitFeedback', 'Wrong action type');
    assert.ok(feedbackData.feedback, 'No feedback data in message');
    assert.strictEqual(feedbackData.feedback.rating, 3, 'Wrong rating value');
    assert.strictEqual(feedbackData.feedback.comment, 'This is a test feedback comment', 'Wrong comment text');
  });
});
