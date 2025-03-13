/**
 * HTML cleaning utilities for the Klartext extension
 */
import { SectionData, CleaningMode } from '../types';

/**
 * Strips unnecessary whitespace and linebreaks from HTML content
 * @param {string} html - The HTML content to process
 * @returns {string} The processed HTML with reduced whitespace
 */
export function stripWhitespace(html: string): string {
  if (!html) return '';
  
  try {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Process all text nodes to normalize whitespace
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const nodesToProcess: Text[] = [];
    let currentNode: Text | null = walker.nextNode() as Text;
    
    // Collect all text nodes first to avoid modifying during traversal
    while (currentNode) {
      nodesToProcess.push(currentNode);
      currentNode = walker.nextNode() as Text;
    }
    
    // Process each text node
    for (const node of nodesToProcess) {
      // Skip text nodes in script, style, pre, textarea, etc.
      const parentNodeName = node.parentNode?.nodeName.toLowerCase();
      if (parentNodeName === 'script' || 
          parentNodeName === 'style' || 
          parentNodeName === 'pre' || 
          parentNodeName === 'textarea' || 
          parentNodeName === 'code') {
        continue;
      }
      
      // Normalize whitespace in text content
      const text = node.textContent || '';
      if (text.trim() === '') {
        // If the text is only whitespace, replace with a single space
        node.textContent = ' ';
      } else {
        // Replace multiple spaces with a single space
        node.textContent = text.replace(/\s+/g, ' ');
      }
    }
    
    // Get the processed HTML
    let processedHtml = tempDiv.innerHTML;
    
    // Remove whitespace between tags
    processedHtml = processedHtml
      // Remove whitespace between closing and opening tags
      .replace(/>\s+</g, '><')
      // Remove whitespace at the start of the content
      .replace(/^\s+/, '')
      // Remove whitespace at the end of the content
      .replace(/\s+$/, '');
    
    return processedHtml;
  } catch (error) {
    console.error('Error stripping whitespace from HTML:', error);
    return html;
  }
}

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
  const contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'strong', 'em', 'b', 'i', 'a', 'br', 'div', 'span', 'article', 'section'];
  
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
      if (!['href', 'title'].includes(attr.name)) {
        el.removeAttribute(attr.name);
      }
    }
  }
  
  // Remove specific elements that aren't needed for translation
  removeSpecificElements(element);
  
  // Remove empty elements (except br)
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
 * Remove specific elements that aren't needed for translation
 * @param {HTMLElement} element - The element to clean
 */
function removeSpecificElements(element: HTMLElement): void {
  // Remove all images
  const images = element.querySelectorAll('img');
  images.forEach(img => img.remove());
  
  // Remove figure and figcaption elements
  const figures = element.querySelectorAll('figure, figcaption');
  figures.forEach(fig => fig.remove());
  
  // Remove tracking pixels (common in news sites)
  const trackingPixels = element.querySelectorAll(
    'img[src*="vgwort"], ' +
    'img[src*="count"], ' +
    'img[src*="pixel"], ' +
    'img[src*="tracking"], ' +
    'img[src*="analytics"], ' +
    'img[width="1"], img[height="1"], ' +
    'img[width="0"], img[height="0"]'
  );
  trackingPixels.forEach(pixel => pixel.remove());
  
  // Remove author information sections
  const authorSections = element.querySelectorAll(
    '[class*="author"], [id*="author"], ' +
    '[class*="byline"], [id*="byline"], ' +
    '[class*="writer"], [id*="writer"], ' +
    '[class*="profile"], [id*="profile"], ' +
    '[class*="contributor"], [id*="contributor"], ' +
    'figure[title*="author"], figure[title*="Author"]'
  );
  authorSections.forEach(section => section.remove());
  
  // Find and remove text nodes containing author information
  const authorTextNodes = findTextNodesWithContent(element, ['By ', 'Von ', 'Author: ', 'Autor: ']);
  authorTextNodes.forEach(node => {
    if (node.parentNode && !isContentElement(node.parentNode)) {
      node.parentNode.removeChild(node);
    }
  });
  
  // Remove article metadata (IDs, timestamps, etc.)
  const metadataElements = element.querySelectorAll(
    '[class*="meta"], [id*="meta"], ' +
    '[class*="date"], [id*="date"], ' +
    '[class*="time"], [id*="time"], ' +
    '[class*="timestamp"], [id*="timestamp"], ' +
    '[class*="article-info"], [id*="article-info"], ' +
    '[class*="article-meta"], [id*="article-meta"]'
  );
  metadataElements.forEach(meta => meta.remove());
  
  // Find and remove numeric IDs (common in news articles)
  const numericIdNodes = findTextNodesWithPattern(element, /^\d{5,}$/);
  numericIdNodes.forEach(node => {
    if (node.parentNode && !isContentElement(node.parentNode)) {
      node.parentNode.removeChild(node);
    }
  });
  
  // Remove donation/subscription prompts
  const donationElements = element.querySelectorAll(
    '[class*="donate"], [id*="donate"], ' +
    '[class*="donation"], [id*="donation"], ' +
    '[class*="support"], [id*="support"], ' +
    '[class*="subscribe"], [id*="subscribe"], ' +
    '[class*="subscription"], [id*="subscription"], ' +
    '[class*="paywall"], [id*="paywall"], ' +
    '[class*="membership"], [id*="membership"]'
  );
  donationElements.forEach(donation => donation.remove());
  
  // Find and remove donation text
  const donationTextNodes = findTextNodesWithContent(element, [
    'Please support', 'Bitte unterstützen', 'Unterstützen Sie', 
    'Spenden', 'Donate', 'Support us', 'Jetzt unterstützen',
    'Als Genossenschaft', 'Genossenschaft', 'konzernfrei', 'kostenfrei zugänglich'
  ]);
  donationTextNodes.forEach(node => {
    if (node.parentNode && !isContentElement(node.parentNode)) {
      node.parentNode.removeChild(node);
    }
  });
  
  // Remove social media sharing elements
  const socialElements = element.querySelectorAll(
    '[class*="share"], [id*="share"], ' +
    '[class*="social"], [id*="social"], ' +
    '[class*="twitter"], [id*="twitter"], ' +
    '[class*="facebook"], [id*="facebook"], ' +
    '[class*="linkedin"], [id*="linkedin"], ' +
    '[data-share], [aria-label*="Share"]'
  );
  socialElements.forEach(social => social.remove());
}

/**
 * Find text nodes containing specific content
 * @param {Node} node - The node to search
 * @param {string[]} contentPhrases - Phrases to look for
 * @returns {Text[]} Array of matching text nodes
 */
function findTextNodesWithContent(node: Node, contentPhrases: string[]): Text[] {
  const matches: Text[] = [];
  const walker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  let currentNode = walker.nextNode();
  while (currentNode) {
    const text = currentNode.textContent || '';
    if (contentPhrases.some(phrase => text.includes(phrase))) {
      matches.push(currentNode as Text);
    }
    currentNode = walker.nextNode();
  }
  
  return matches;
}

/**
 * Find text nodes matching a pattern
 * @param {Node} node - The node to search
 * @param {RegExp} pattern - Pattern to match
 * @returns {Text[]} Array of matching text nodes
 */
function findTextNodesWithPattern(node: Node, pattern: RegExp): Text[] {
  const matches: Text[] = [];
  const walker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  let currentNode = walker.nextNode();
  while (currentNode) {
    const text = currentNode.textContent || '';
    if (pattern.test(text.trim())) {
      matches.push(currentNode as Text);
    }
    currentNode = walker.nextNode();
  }
  
  return matches;
}

/**
 * Check if a node is a content element that should be preserved
 * @param {Node} node - The node to check
 * @returns {boolean} True if it's a content element
 */
function isContentElement(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  
  const contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote'];
  return contentTags.includes((node as Element).tagName.toLowerCase());
}

/**
 * Recursively removes empty elements from an element
 * @param {HTMLElement} element - The element to process
 */
function removeEmptyElements(element: HTMLElement): void {
  const children = Array.from(element.children);
  
  for (const child of children) {
    // Skip br tags
    if (child.tagName.toLowerCase() === 'br') {
      continue;
    }
    
    // Recursively process child elements
    if (child.children.length > 0) {
      removeEmptyElements(child as HTMLElement);
    }
    
    // Remove element if it has no text content and no children
    if (
      child.textContent?.trim() === '' && 
      child.children.length === 0
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
