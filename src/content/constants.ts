/**
 * Constants for the Klartext extension
 */

// Repository URL
export const REPO_URL: string = 'https://github.com/bhamm/klartext';

// SVG Icons
export const PLAY_ICON: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
export const PAUSE_ICON: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

// Article selectors for finding content
export const ARTICLE_SELECTORS: string[] = [
  'article',
  '[role="article"]',
  '.article',
  '.post',
  'main p',
  '.content p',
  '.entry-content',
  '.post-content'
];

// Content selectors for page translation
export const CONTENT_SELECTORS: string[] = [
  // Main article containers
  'article',
  '[role="article"]',
  '[role="main"]',
  'main',
  
  // Common content containers
  '.article',
  '.post',
  '.entry-content',
  '.content',
  '.page-content',
  '.main-content',
  
  // Fallback to semantic sections
  'section',
  
  // Individual content blocks if no container found
  '.post-content p',
  'article p',
  'main p',
  '.content p',
  '.entry-content p'
];

// Selectors for elements to exclude from translation
export const EXCLUDE_SELECTORS: string[] = [
  // Comments
  '#comments', '.comments', '.comment-section',
  '[data-component="comments"]', '.comment-list',
  // Social media and sharing
  '.social', '.share', '.sharing', '.social-media',
  '[class*="share-"], [class*="social-"]',
  // Navigation and UI elements
  '.nav', '.navigation', '.menu', '.toolbar',
  '.header', '.footer', '.sidebar',
  // Ads and promotional content
  '.ad', '.advertisement', '.promo', '.sponsored',
  '[class*="ad-"], [class*="advert"], [class*="banner"], [class*="adsense"]',
  '#ad-container', '#banner-ad', '#ad-wrapper', '#adContainer',
  '[data-ad]', '[data-ad-unit]', '[data-ad-slot]', '[data-ad-client]',
  '[id*="google_ads_"]', '[id*="div-gpt-ad"]', '[class*="gpt-ad"]',
  '.adsbygoogle', '.ad-unit', '.ad-slot', '.ad-banner', '.ad-container',
  '.dfp-ad', '.pub_300x250', '.pub_300x250m', '.pub_728x90',
  '.text-ad', '.text-ad-links', '.ad-text', '.ad-block',
  // Interactive elements
  '.widget', '.tool', '.interactive',
  // Specific sharing elements
  '.shariff', '.shariff-button', '.social-media-title',
  // Other non-content elements
  '.related', '.recommendations', '.newsletter',
  '[role="complementary"]'
];

// Content-specific class indicators
export const CONTENT_CLASS_PATTERNS: string[] = [
  'text', 'content', 'article', 'story', 'post',
  'body', 'entry', 'main', 'description'
];

// Maximum characters for text chunks
export const MAX_CHUNK_CHARS: number = 1000;
