/**
 * HTML cleaning utilities for the Klartext extension
 */
import { SectionData } from '../types';

/**
 * Cleans article HTML by removing unnecessary elements
 * @param {string} html - The HTML to clean
 * @returns {string} The cleaned HTML
 */
export function cleanArticleHTML(html: string): string {
  if (!html) return '';
  
  try {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove script tags
    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove style tags
    const styles = tempDiv.querySelectorAll('style');
    styles.forEach(style => style.remove());
    
    // Remove iframe tags
    const iframes = tempDiv.querySelectorAll('iframe');
    iframes.forEach(iframe => iframe.remove());
    
    // Remove form tags
    const forms = tempDiv.querySelectorAll('form');
    forms.forEach(form => form.remove());
    
    // Remove comments
    removeComments(tempDiv);
    
    // Remove hidden elements
    const hiddenElements = tempDiv.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"], .hidden');
    hiddenElements.forEach(element => element.remove());
    
    // Remove social media widgets
    const socialWidgets = tempDiv.querySelectorAll('[class*="twitter"], [class*="facebook"], [class*="social"], [class*="share"]');
    socialWidgets.forEach(widget => widget.remove());
    
    // Remove advertisement elements
    const adElements = tempDiv.querySelectorAll('[class*="ad-"], [class*="advertisement"], [id*="ad-"]');
    adElements.forEach(ad => ad.remove());
    
    // Remove navigation elements
    const navElements = tempDiv.querySelectorAll('nav, [role="navigation"]');
    navElements.forEach(nav => nav.remove());
    
    // Remove footer elements
    const footerElements = tempDiv.querySelectorAll('footer');
    footerElements.forEach(footer => footer.remove());
    
    return tempDiv.innerHTML;
  } catch (error) {
    console.error('Error cleaning HTML:', error);
    return html;
  }
}

/**
 * Recursively removes comment nodes from an element
 * @param {Node} node - The node to process
 */
function removeComments(node: Node): void {
  const childNodes = node.childNodes;
  
  for (let i = childNodes.length - 1; i >= 0; i--) {
    const child = childNodes[i];
    
    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      removeComments(child);
    }
  }
}

/**
 * Splits HTML content into chunks of approximately equal size
 * @param {HTMLElement|string} input - The HTML element or content to split
 * @param {number} chunkSize - The approximate size of each chunk in characters
 * @returns {SectionData[]} Array of section data objects
 */
export function splitIntoChunks(input: HTMLElement | string, chunkSize: number = 5000): SectionData[] {
  try {
    // Handle different input types
    let html: string;
    let originalElement: HTMLElement | null = null;
    
    if (typeof input === 'string') {
      html = input;
    } else if (input instanceof HTMLElement) {
      originalElement = input;
      html = input.innerHTML;
    } else {
      console.error('Invalid input type for splitIntoChunks:', input);
      return [];
    }
    
    if (!html) return [];
    if (html.length <= chunkSize && originalElement) {
      // If the content is small enough and we have an original element, return it as is
      return [{
        originalSection: originalElement,
        content: html
      }];
    }
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const chunks: SectionData[] = [];
    let currentChunk = document.createElement('div');
    let currentSize = 0;
    
    // Process all child nodes
    Array.from(tempDiv.childNodes).forEach(node => {
      const nodeSize = (node.textContent || '').length;
      
      // If adding this node would exceed the chunk size, start a new chunk
      if (currentSize > 0 && currentSize + nodeSize > chunkSize) {
        // Create a new section element for this chunk
        const sectionElement = document.createElement('div');
        sectionElement.innerHTML = currentChunk.innerHTML;
        
        chunks.push({
          originalSection: sectionElement,
          content: currentChunk.innerHTML
        });
        
        currentChunk = document.createElement('div');
        currentSize = 0;
      }
      
      // Clone the node and add it to the current chunk
      const clonedNode = node.cloneNode(true);
      currentChunk.appendChild(clonedNode);
      currentSize += nodeSize;
    });
    
    // Add the last chunk if it has content
    if (currentSize > 0) {
      // Create a new section element for this chunk
      const sectionElement = document.createElement('div');
      sectionElement.innerHTML = currentChunk.innerHTML;
      
      chunks.push({
        originalSection: sectionElement,
        content: currentChunk.innerHTML
      });
    }
    
    return chunks;
  } catch (error) {
    console.error('Error splitting HTML into chunks:', error);
    
    // Return a fallback if we have an original element
    if (input instanceof HTMLElement) {
      return [{
        originalSection: input,
        content: input.innerHTML
      }];
    }
    
    return [];
  }
}
