/**
 * HTML cleaning utilities for the Klartext extension
 */

/**
 * Clean HTML content for article translation
 * @param {string} html - The HTML content to clean
 * @returns {string} Cleaned HTML
 */
export function cleanArticleHTML(html) {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove script tags
  const scripts = tempDiv.getElementsByTagName('script');
  while (scripts.length > 0) {
    scripts[0].parentNode.removeChild(scripts[0]);
  }
  
  // Remove style tags
  const styles = tempDiv.getElementsByTagName('style');
  while (styles.length > 0) {
    styles[0].parentNode.removeChild(styles[0]);
  }
  
  // Remove SVG elements
  const svgs = tempDiv.getElementsByTagName('svg');
  while (svgs.length > 0) {
    svgs[0].parentNode.removeChild(svgs[0]);
  }
  
  // Remove iframes
  const iframes = tempDiv.getElementsByTagName('iframe');
  while (iframes.length > 0) {
    iframes[0].parentNode.removeChild(iframes[0]);
  }
  
  // Convert images to alt text or remove them
  const images = tempDiv.getElementsByTagName('img');
  Array.from(images).forEach(img => {
    if (img.alt) {
      const textNode = document.createTextNode(`[Bild: ${img.alt}]`);
      img.parentNode.replaceChild(textNode, img);
    } else {
      img.parentNode.removeChild(img);
    }
  });
  
  // Convert links to plain text
  const links = tempDiv.getElementsByTagName('a');
  Array.from(links).forEach(link => {
    const textNode = document.createTextNode(link.textContent);
    link.parentNode.replaceChild(textNode, link);
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
function cleanNode(node) {
  // List of allowed HTML tags
  const allowedTags = [
    'article', 'section', 'main', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'p', 'ul', 'ol', 'li', 
    'strong', 'em', 'b', 'i'
  ];
  
  if (node.nodeType === Node.ELEMENT_NODE) {
    if (!allowedTags.includes(node.tagName.toLowerCase())) {
      // Check if node has a parent before replacing
      if (node.parentNode) {
        // Replace element with its text content
        const textContent = node.textContent;
        const textNode = document.createTextNode(textContent);
        node.parentNode.replaceChild(textNode, node);
      }
      return;
    }
    
    // Clean children recursively
    Array.from(node.childNodes).forEach(child => cleanNode(child));
    
    // Remove all attributes except essential ones
    const attrs = node.attributes;
    for (let i = attrs.length - 1; i >= 0; i--) {
      const attrName = attrs[i].name;
      if (!['class', 'id'].includes(attrName)) {
        node.removeAttribute(attrName);
      }
    }
  }
}

/**
 * Split text into chunks for translation
 * @param {HTMLElement} element - The element containing text to split
 * @param {number} maxChars - Maximum characters per chunk
 * @returns {Array<{originalSection: HTMLElement, content: string}>} Array of chunk objects
 */
export function splitIntoChunks(element, maxChars) {
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;
  
  // Get all text-containing elements
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (node.matches('p, h1, h2, h3, h4, h5, h6, li')) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    const text = node.innerHTML;
    const length = text.length;
    
    if (currentLength + length > maxChars && currentChunk.length > 0) {
      // Create a new section with current chunk
      const section = document.createElement('div');
      currentChunk.forEach(n => section.appendChild(n.cloneNode(true)));
      chunks.push({
        originalSection: element,
        content: section.innerHTML
      });
      
      // Start new chunk
      currentChunk = [node];
      currentLength = length;
    } else {
      currentChunk.push(node);
      currentLength += length;
    }
  }
  
  // Add remaining chunk if any
  if (currentChunk.length > 0) {
    const section = document.createElement('div');
    currentChunk.forEach(n => section.appendChild(n.cloneNode(true)));
    chunks.push({
      originalSection: element,
      content: section.innerHTML
    });
  }
  
  return chunks;
}
