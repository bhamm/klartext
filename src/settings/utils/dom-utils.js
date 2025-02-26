/**
 * Utility functions for DOM manipulation
 */

/**
 * Get element by ID with type checking
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Element or null if not found
 */
export function getElement(id) {
  return document.getElementById(id);
}

/**
 * Get element by class name (returns the first matching element)
 * @param {string} className - Class name
 * @returns {HTMLElement|null} Element or null if not found
 */
export function getElementByClass(className) {
  const elements = document.getElementsByClassName(className);
  return elements.length > 0 ? elements[0] : null;
}

/**
 * Create a status message
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, error)
 * @param {number} duration - Duration in milliseconds
 * @returns {void}
 */
export function showStatus(message, type = 'success', duration = 3000) {
  const statusDiv = getElement('status');
  if (!statusDiv) return;
  
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;

  // Clear status after specified duration
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }, duration);
}

/**
 * Populate a select element with options
 * @param {HTMLSelectElement} selectElement - Select element to populate
 * @param {string[]} options - Array of option values
 * @param {string} selectedValue - Currently selected value
 * @returns {void}
 */
export function populateSelect(selectElement, options, selectedValue = '') {
  if (!selectElement || !Array.isArray(options)) return;
  
  // Clear existing options
  selectElement.innerHTML = '';
  
  // Add new options
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    selectElement.appendChild(optionElement);
  });
  
  // Set selected value if provided and valid
  if (selectedValue && options.includes(selectedValue)) {
    selectElement.value = selectedValue;
  } else if (options.length > 0) {
    // Default to first option
    selectElement.value = options[0];
  }
}

/**
 * Set form field values
 * @param {Object} formData - Object with field IDs as keys and values to set
 * @returns {void}
 */
export function setFormValues(formData) {
  if (!formData || typeof formData !== 'object') return;
  
  Object.entries(formData).forEach(([id, value]) => {
    const element = getElement(id);
    if (!element) return;
    
    if (element.type === 'checkbox') {
      element.checked = Boolean(value);
    } else if (element.type === 'radio') {
      const radioGroup = document.querySelectorAll(`input[name="${element.name}"]`);
      radioGroup.forEach(radio => {
        radio.checked = radio.value === value;
      });
    } else {
      element.value = value;
    }
  });
}

/**
 * Get form field values
 * @param {string[]} fieldIds - Array of field IDs to get values for
 * @returns {Object} Object with field IDs as keys and their values
 */
export function getFormValues(fieldIds) {
  if (!Array.isArray(fieldIds)) return {};
  
  return fieldIds.reduce((values, id) => {
    const element = getElement(id);
    if (!element) return values;
    
    if (element.type === 'checkbox') {
      values[id] = element.checked;
    } else if (element.type === 'radio') {
      if (element.checked) {
        values[element.name] = element.value;
      }
    } else {
      values[id] = element.value;
    }
    
    return values;
  }, {});
}

/**
 * Toggle element visibility
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} visible - Whether element should be visible
 * @param {string} visibilityClass - CSS class to toggle
 * @returns {void}
 */
export function toggleVisibility(element, visible, visibilityClass = 'enabled') {
  if (!element) return;
  
  if (visible) {
    element.classList.add(visibilityClass);
  } else {
    element.classList.remove(visibilityClass);
  }
}

/**
 * Add event listener with error handling
 * @param {HTMLElement} element - Element to add listener to
 * @param {string} eventType - Event type (click, change, etc.)
 * @param {Function} handler - Event handler function
 * @returns {void}
 */
export function addSafeEventListener(element, eventType, handler) {
  if (!element || !eventType || typeof handler !== 'function') return;
  
  element.addEventListener(eventType, async (event) => {
    try {
      await handler(event);
    } catch (error) {
      console.error(`Error in ${eventType} handler:`, error);
      showStatus(`Fehler: ${error.message}`, 'error');
    }
  });
}
