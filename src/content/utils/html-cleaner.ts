/**
 * HTML cleaning utilities for the Klartext extension
 */
import { SectionData, CleaningMode } from '../types';

/**
 * Cleans article HTML by removing unnecessary elements
 * @param {string} html - The HTML to clean
 * @param {CleaningMode} mode - The cleaning mode to use (standard or aggressive)
 * @returns {string} The cleaned HTML
 */
export function cleanArticleHTML(html: string, mode: CleaningMode = 'aggressive'): string {
  if (!html) return '';
  
  try {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    
    tempDiv.innerHTML = html;
    
    // Apply standard cleaning
    applyStandardCleaning(tempDiv);
    
    // Apply aggressive cleaning if requested
    if (mode === 'aggressive') {
      applyAggressiveCleaning(tempDiv);
    }
    
    return tempDiv.innerHTML;
  } catch (error) {
    console.error('Error cleaning HTML:', error);
    return html;
  }
}

/**
 * Apply standard cleaning to an HTML element
 * @param {HTMLElement} element - The element to clean
 */
function applyStandardCleaning(element: HTMLElement): void {
  // Remove script tags
  const scripts = element.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove style tags
  const styles = element.querySelectorAll('style');
  styles.forEach(style => style.remove());
  
  // Remove iframe tags
  const iframes = element.querySelectorAll('iframe');
  iframes.forEach(iframe => iframe.remove());
  
  // Remove form tags
  const forms = element.querySelectorAll('form');
  forms.forEach(form => form.remove());
  
  // Remove comments
  removeComments(element);
  
  // Remove hidden elements
  const hiddenElements = element.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"], .hidden');
  hiddenElements.forEach(element => element.remove());
  
  // Remove social media widgets
  const socialWidgets = element.querySelectorAll(
    '[class*="twitter"], [class*="facebook"], [class*="social"], [class*="share"], ' +
    '[class*="follow"], [class*="like"], [class*="tweet"], [class*="shariff"], ' +
    '[id*="social"], [id*="share"], [data-share], [aria-label*="Share"]'
  );
  socialWidgets.forEach(widget => widget.remove());
  
  // Remove advertisement elements
  const adElements = element.querySelectorAll(
    '[class*="ad-"], [class*="advertisement"], [id*="ad-"], [class*="advert"], ' +
    '[class*="banner"], [id*="banner"], [class*="sponsor"], [class*="promo"], ' +
    '[id*="google_ads"], [class*="dfp"], [class*="gpt-ad"], [class*="adsense"], ' +
    '[data-ad], [data-ad-unit], [data-ad-slot], [data-ad-client]'
  );
  adElements.forEach(ad => ad.remove());
  
  // Remove navigation elements
  const navElements = element.querySelectorAll('nav, [role="navigation"], .navigation, .menu, .toolbar');
  navElements.forEach(nav => nav.remove());
  
  // Remove footer elements
  const footerElements = element.querySelectorAll('footer, .footer');
  footerElements.forEach(footer => footer.remove());
  
  // Remove header elements (except main article header)
  const headerElements = element.querySelectorAll('header:not(.article-header), .header:not(.article-header)');
  headerElements.forEach(header => header.remove());
  
  // Remove sidebar elements
  const sidebarElements = element.querySelectorAll('.sidebar, [role="complementary"], aside');
  sidebarElements.forEach(sidebar => sidebar.remove());
  
  // Remove comment sections
  const commentElements = element.querySelectorAll(
    '#comments, .comments, .comment-section, [data-component="comments"], ' +
    '.comment-list, [id*="disqus"], [class*="disqus"]'
  );
  commentElements.forEach(comment => comment.remove());
  
  // Remove newsletter signup forms
  const newsletterElements = element.querySelectorAll(
    '.newsletter, [class*="newsletter"], [id*="newsletter"], ' +
    '[class*="subscribe"], [id*="subscribe"]'
  );
  newsletterElements.forEach(newsletter => newsletter.remove());
  
  // Remove related articles sections
  const relatedElements = element.querySelectorAll(
    '.related, [class*="related"], [id*="related"], ' +
    '.recommendations, [class*="recommend"], [id*="recommend"]'
  );
  relatedElements.forEach(related => related.remove());
  
  // Remove audio player elements
  const audioElements = element.querySelectorAll(
    '.audio-player, [class*="audio-player"], [class*="player"], ' +
    '[class*="podcast"], [class*="sound"]'
  );
  audioElements.forEach(audio => audio.remove());
  
  // Remove video player elements
  const videoElements = element.querySelectorAll(
    '.video-player, [class*="video-player"], [class*="video"], ' +
    'video, [class*="youtube"], [class*="vimeo"]'
  );
  videoElements.forEach(video => video.remove());
  
  // Remove interactive elements
  const interactiveElements = element.querySelectorAll(
    '.interactive, [class*="interactive"], [class*="widget"], ' +
    '[class*="tool"], [class*="calculator"], [class*="quiz"]'
  );
  interactiveElements.forEach(interactive => interactive.remove());
  
  // Remove job listings
  const jobElements = element.querySelectorAll(
    '.jobbox, [class*="job"], [class*="career"], [class*="vacancy"]'
  );
  jobElements.forEach(job => job.remove());
}

/**
 * Apply aggressive cleaning to an HTML element
 * @param {HTMLElement} element - The element to clean
 */
function applyAggressiveCleaning(element: HTMLElement): void {
  // Define content elements to keep
  const contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'figure', 'figcaption', 'img', 'strong', 'em', 'b', 'i', 'a', 'br', 'div', 'span', 'article', 'section'];
  
  // Remove all elements except content elements
  const allElements = Array.from(element.getElementsByTagName('*'));
  for (const el of allElements) {
    if (!contentTags.includes(el.tagName.toLowerCase())) {
      el.remove();
    }
  }
  
  // Remove all attributes except essential ones
  const elementsWithAttributes = Array.from(element.querySelectorAll('*'));
  for (const el of elementsWithAttributes) {
    const attributes = Array.from(el.attributes);
    for (const attr of attributes) {
      // Keep only essential attributes
      if (!['src', 'href', 'alt', 'title'].includes(attr.name)) {
        el.removeAttribute(attr.name);
      }
    }
  }
  
  // Remove empty elements (except br and img)
  removeEmptyElements(element);
  
  // Remove duplicate br tags
  const brElements = element.querySelectorAll('br + br');
  brElements.forEach(br => br.remove());
  
  // Remove any remaining non-content elements
  const nonContentElements = element.querySelectorAll(
    'button, input, select, textarea, canvas, svg, iframe, ' +
    'noscript, script, style, link, meta, [role="banner"], ' +
    '[role="search"], [role="contentinfo"], [role="dialog"], ' +
    '[aria-hidden="true"]'
  );
  nonContentElements.forEach(el => el.remove());
  
  // Remove data attributes from all elements
  const elementsWithDataAttrs = element.querySelectorAll('*');
  elementsWithDataAttrs.forEach(el => {
    const attributes = Array.from(el.attributes);
    for (const attr of attributes) {
      if (attr.name.startsWith('data-')) {
        el.removeAttribute(attr.name);
      }
    }
  });
}

/**
 * Recursively removes empty elements from an element
 * @param {HTMLElement} element - The element to process
 */
function removeEmptyElements(element: HTMLElement): void {
  const children = Array.from(element.children);
  
  for (const child of children) {
    // Skip br and img tags
    if (child.tagName.toLowerCase() === 'br' || child.tagName.toLowerCase() === 'img') {
      continue;
    }
    
    // Recursively process child elements
    if (child.children.length > 0) {
      removeEmptyElements(child as HTMLElement);
    }
    
    // Remove element if it has no text content and no children
    if (
      child.textContent?.trim() === '' && 
      child.children.length === 0 &&
      !child.querySelector('img')
    ) {
      child.remove();
    }
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
 * @param {CleaningMode} cleaningMode - The cleaning mode to use
 * @returns {SectionData[]} Array of section data objects
 */
export function splitIntoChunks(
  input: HTMLElement | string, 
  chunkSize: number = 5000,
  cleaningMode: CleaningMode = 'aggressive'
): SectionData[] {
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
    
    // Clean the HTML before splitting if aggressive mode is requested
    if (cleaningMode === 'aggressive') {
      // Apply aggressive cleaning to reduce token count
      const cleanedHtml = cleanArticleHTML(html, 'aggressive');
      tempDiv.innerHTML = cleanedHtml;
    } else {
      tempDiv.innerHTML = html;
    }
    
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
