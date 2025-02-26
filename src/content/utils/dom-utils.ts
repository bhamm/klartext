/**
 * DOM utility functions for the Klartext extension
 */
import { ElementAttributes } from '../types';

/**
 * Creates an element with attributes and optional children
 * @param {string} tag - The HTML tag name
 * @param {ElementAttributes} attributes - Key-value pairs of attributes
 * @param {Array<Node|string>|Node|string} [children] - Child elements, nodes, or text content
 * @returns {HTMLElement} The created element
 */
export function createElement(
  tag: string, 
  attributes: ElementAttributes = {}, 
  children: Array<Node|string>|Node|string|null = null
): HTMLElement {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value as string;
    } else if (key === 'textContent') {
      element.textContent = value as string;
    } else if (key === 'innerHTML') {
      element.innerHTML = value as string;
    } else if (key.startsWith('on') && typeof value === 'function') {
      // Event listeners
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, value as EventListener);
    } else {
      // Regular attributes
      element.setAttribute(key, String(value));
    }
  });
  
  // Add children if provided
  if (children) {
    if (Array.isArray(children)) {
      children.forEach(child => {
        if (child) {
          appendChildToElement(element, child);
        }
      });
    } else {
      appendChildToElement(element, children);
    }
  }
  
  return element;
}

/**
 * Helper function to append a child to an element
 * @param {HTMLElement} element - The parent element
 * @param {Node|string} child - The child element, node, or text content
 */
function appendChildToElement(element: HTMLElement, child: Node|string): void {
  if (typeof child === 'string') {
    element.appendChild(document.createTextNode(child));
  } else if (child instanceof Node) {
    element.appendChild(child);
  }
}

/**
 * Finds the closest element matching any of the provided selectors
 * @param {HTMLElement} element - The starting element
 * @param {string[]} selectors - Array of CSS selectors
 * @returns {HTMLElement|null} The matching element or null
 */
export function findClosestMatchingElement(
  element: HTMLElement, 
  selectors: string[]
): HTMLElement|null {
  let result: HTMLElement|null = null;
  
  for (const selector of selectors) {
    const match = element.closest(selector);
    if (match && match instanceof HTMLElement) {
      result = match;
      break;
    }
  }
  
  return result;
}

/**
 * Safely removes an element from the DOM
 * @param {HTMLElement} element - The element to remove
 */
export function removeElement(element: HTMLElement|null): void {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Adds multiple classes to an element
 * @param {HTMLElement} element - The element to modify
 * @param {string[]} classes - Array of class names
 */
export function addClasses(element: HTMLElement|null, classes: string[]): void {
  if (element && classes && classes.length) {
    element.classList.add(...classes);
  }
}

/**
 * Removes multiple classes from an element
 * @param {HTMLElement} element - The element to modify
 * @param {string[]} classes - Array of class names
 */
export function removeClasses(element: HTMLElement|null, classes: string[]): void {
  if (element && classes && classes.length) {
    element.classList.remove(...classes);
  }
}

/**
 * Processes text into words for speech synthesis
 * @param {string} text - The text to process
 * @returns {string[]} Array of words
 */
export function processTextToWords(text: string): string[] {
  return text.split(/\s+/).filter(word => word.trim().length > 0);
}

/**
 * Creates a document fragment from HTML string
 * @param {string} html - The HTML string
 * @returns {DocumentFragment} The document fragment
 */
export function createFragmentFromHTML(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content;
}

/**
 * Checks if an element has any of the specified classes
 * @param {HTMLElement} element - The element to check
 * @param {string[]} classPatterns - Array of class name patterns
 * @returns {boolean} True if the element has any of the classes
 */
export function hasAnyClass(
  element: HTMLElement|null, 
  classPatterns: string[]
): boolean {
  if (!element || !element.classList) return false;
  
  const classes = Array.from(element.classList);
  return classPatterns.some(pattern => 
    classes.some(cls => cls.toLowerCase().includes(pattern))
  );
}
