/**
 * Utility functions for DOM manipulation
 */

/**
 * Get element by ID with type checking
 * @param id - Element ID
 * @returns Element or null if not found
 */
export function getElement<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * Get element by class name (returns the first matching element)
 * @param className - Class name
 * @returns Element or null if not found
 */
export function getElementByClass<T extends HTMLElement = HTMLElement>(className: string): T | null {
  const elements = document.getElementsByClassName(className);
  return elements.length > 0 ? elements[0] as T : null;
}

/**
 * Create a status message
 * @param message - Message to display
 * @param type - Message type (success, error)
 * @param duration - Duration in milliseconds
 */
export function showStatus(message: string, type: 'success' | 'error' = 'success', duration: number = 3000): void {
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
 * @param selectElement - Select element to populate
 * @param options - Array of option values
 * @param selectedValue - Currently selected value
 */
export function populateSelect(
  selectElement: HTMLSelectElement, 
  options: string[], 
  selectedValue: string = ''
): void {
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
 * @param formData - Object with field IDs as keys and values to set
 */
export function setFormValues(formData: Record<string, unknown>): void {
  if (!formData || typeof formData !== 'object') return;
  
  Object.entries(formData).forEach(([id, value]) => {
    const element = getElement(id);
    if (!element) return;
    
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        element.checked = Boolean(value);
      } else if (element.type === 'radio') {
        const radioGroup = document.querySelectorAll<HTMLInputElement>(`input[name="${element.name}"]`);
        radioGroup.forEach(radio => {
          radio.checked = radio.value === String(value);
        });
      } else {
        element.value = String(value);
      }
    } else if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
      element.value = String(value);
    }
  });
}

/**
 * Get form field values
 * @param fieldIds - Array of field IDs to get values for
 * @returns Object with field IDs as keys and their values
 */
export function getFormValues(fieldIds: string[]): Record<string, unknown> {
  if (!Array.isArray(fieldIds)) return {};
  
  return fieldIds.reduce<Record<string, unknown>>((values, id) => {
    const element = getElement(id);
    if (!element) return values;
    
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        values[id] = element.checked;
      } else if (element.type === 'radio') {
        if (element.checked) {
          values[element.name] = element.value;
        }
      } else {
        values[id] = element.value;
      }
    } else if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
      values[id] = element.value;
    }
    
    return values;
  }, {});
}

/**
 * Toggle element visibility
 * @param element - Element to toggle
 * @param visible - Whether element should be visible
 * @param visibilityClass - CSS class to toggle
 */
export function toggleVisibility(
  element: HTMLElement | null, 
  visible: boolean, 
  visibilityClass: string = 'enabled'
): void {
  if (!element) return;
  
  if (visible) {
    element.classList.add(visibilityClass);
  } else {
    element.classList.remove(visibilityClass);
  }
}

/**
 * Add event listener with error handling
 * @param element - Element to add listener to
 * @param eventType - Event type (click, change, etc.)
 * @param handler - Event handler function
 */
export function addSafeEventListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement | null,
  eventType: K,
  handler: (event: HTMLElementEventMap[K]) => Promise<void> | void
): void {
  if (!element || !eventType || typeof handler !== 'function') return;
  
  element.addEventListener(eventType, async (event) => {
    try {
      await handler(event as HTMLElementEventMap[K]);
    } catch (error) {
      console.error(`Error in ${eventType} handler:`, error);
      if (error instanceof Error) {
        showStatus(`Fehler: ${error.message}`, 'error');
      } else {
        showStatus('Ein unbekannter Fehler ist aufgetreten', 'error');
      }
    }
  });
}
