/**
 * HTML cleaning utilities for the Klartext extension
 */
import { SectionData } from '../types';

/**
 * Clean HTML content for article translation
 * @param {string} html - The HTML content to clean
 * @returns {string} Cleaned HTML
 */
export function cleanArticleHTML(html: string): string {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove script tags
  const scripts = tempDiv.getElementsByTagName('script');
  while (scripts.length > 0) {
    const script = scripts[0];
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  }
  
  // Remove style tags
  const styles = tempDiv.getElementsByTagName('style');
  while (styles.length > 0) {
    const style = styles[0];
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  }
  
  // Remove SVG elements
  const svgs = tempDiv.getElementsByTagName('svg');
  while (svgs.length > 0) {
    const svg = svgs[0];
    if (svg.parentNode) {
      svg.parentNode.removeChild(svg);
    }
  }
  
  // Remove iframes
  const iframes = tempDiv.getElementsByTagName('iframe');
  while (iframes.length > 0) {
    const iframe = iframes[0];
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
  
  // Convert images to alt text or remove them
  const images = tempDiv.getElementsByTagName('img');
  Array.from(images).forEach(img => {
    if (img.alt && img.parentNode) {
      const textNode = document.createTextNode(`[Bild: ${img.alt}]`);
      img.parentNode.replaceChild(textNode, img);
    } else if (img.parentNode) {
      img.parentNode.removeChild(img);
    }
  });
  
  // Convert links to plain text
  const links = tempDiv.getElementsByTagName('a');
  Array.from(links).forEach(link => {
    if (link.parentNode) {
      const textNode = document.createTextNode(link.textContent || '');
      link.parentNode.replaceChild(textNode, link);
    }
  });
  
  // Remove all event handlers
  const allElements = tempDiv.getElementsByTagName('*');
  Array.from(allElements).forEach(element => {
    // Remove all event handler attributes
    const attrs = element.attributes;
    for (let i = attrs.length - 1; i >= 0; i--) {
      if (attrs[i].name.startsWith('on')) {
        element.removeAttribute(attrs[i].name);
      }
    }
  });
  
  // Clean the entire content
  cleanNode(tempDiv);
  
  // Return cleaned HTML
  return tempDiv.innerHTML;
}

/**
 * Recursively clean a DOM node
 * @param {Node} node - The node to clean
 */
function cleanNode(node: Node): void {
  // List of allowed HTML tags
  const allowedTags: string[] = [
    'article', 'section', 'main', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'p', 'ul', 'ol', 'li', 
    'strong', 'em', 'b', 'i'
  ];
  
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    if (!allowedTags.includes(element.tagName.toLowerCase())) {
      // Check if node has a parent before replacing
      if (element.parentNode) {
        // Replace element with its text content
        const textContent = element.textContent || '';
        const textNode = document.createTextNode(textContent);
        element.parentNode.replaceChild(textNode, element);
      }
      return;
    }
    
    // Clean children recursively
    Array.from(element.childNodes).forEach(child => cleanNode(child));
    
    // Remove all attributes except essential ones
    const attrs = element.attributes;
    for (let i = attrs.length - 1; i >= 0; i--) {
      const attrName = attrs[i].name;
      if (!['class', 'id'].includes(attrName)) {
        element.removeAttribute(attrName);
      }
    }
  }
}

/**
 * Split text into chunks for translation
 * @param {HTMLElement} element - The element containing text to split
 * @param {number} maxChars - Maximum characters per chunk
 * @returns {Array<SectionData>} Array of chunk objects
 */
export function splitIntoChunks(element: HTMLElement, maxChars: number): SectionData[] {
  const chunks: SectionData[] = [];
  let currentChunk: Element[] = [];
  let currentLength = 0;
  
  // Get all text-containing elements
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node: Node): number => {
        if ((node as Element).matches('p, h1, h2, h3, h4, h5, h6, li')) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );
  
  let node: Node | null;
  while (node = walker.nextNode()) {
    const currentElement = node as Element;
    const text = currentElement.innerHTML;
    const length = text.length;
    
    if (currentLength + length > maxChars && currentChunk.length > 0) {
      // Create a new section with current chunk
      const section = document.createElement('div');
      currentChunk.forEach(n => section.appendChild(n.cloneNode(true)));
      chunks.push({
        originalSection: element, // Use the parent element as the original section
        content: section.innerHTML
      });
      
      // Start new chunk
      currentChunk = [currentElement];
      currentLength = length;
    } else {
      currentChunk.push(currentElement);
      currentLength += length;
    }
  }
  
  // Add remaining chunk if any
  if (currentChunk.length > 0) {
    const section = document.createElement('div');
    currentChunk.forEach(n => section.appendChild(n.cloneNode(true)));
    chunks.push({
      originalSection: element, // Use the parent element as the original section
      content: section.innerHTML
    });
  }
  
  return chunks;
}
