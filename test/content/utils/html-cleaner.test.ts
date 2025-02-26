import { describe, test, expect } from '@jest/globals';
import { cleanArticleHTML } from '../../../src/content/utils/html-cleaner';

describe('HTML Cleaner', () => {
  describe('cleanArticleHTML', () => {
    test('should remove script tags and their content', () => {
      const html = '<div><script>alert("test");</script><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('<script>');
      expect(cleaned).not.toContain('alert("test");');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should remove style tags and their content', () => {
      const html = '<div><style>.test { color: red; }</style><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('<style>');
      expect(cleaned).not.toContain('.test { color: red; }');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should remove iframe tags', () => {
      const html = '<div><iframe src="https://example.com"></iframe><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('<iframe');
      expect(cleaned).not.toContain('src="https://example.com"');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should remove form tags', () => {
      const html = '<div><form action="/submit"><input type="text"></form><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('<form');
      expect(cleaned).not.toContain('action="/submit"');
      expect(cleaned).not.toContain('<input');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should remove comment tags', () => {
      const html = '<div><!-- This is a comment --><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('<!-- This is a comment -->');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should remove hidden elements', () => {
      const html = '<div><p style="display: none;">Hidden</p><p>Visible</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('Hidden');
      expect(cleaned).toContain('Visible');
    });
    
    test('should remove elements with hidden class', () => {
      const html = '<div><p class="hidden">Hidden</p><p>Visible</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('Hidden');
      expect(cleaned).toContain('Visible');
    });
    
    test('should remove elements with visibility: hidden', () => {
      const html = '<div><p style="visibility: hidden;">Hidden</p><p>Visible</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('Hidden');
      expect(cleaned).toContain('Visible');
    });
    
    test('should remove social media widgets', () => {
      const html = '<div><div class="twitter-widget">Tweet</div><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('twitter-widget');
      expect(cleaned).not.toContain('Tweet');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should remove advertisement elements', () => {
      const html = '<div><div class="ad-container">Ad</div><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('ad-container');
      expect(cleaned).not.toContain('Ad');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should remove navigation elements', () => {
      const html = '<div><nav>Menu</nav><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('<nav>');
      expect(cleaned).not.toContain('Menu');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should remove footer elements', () => {
      const html = '<div><footer>Copyright</footer><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('<footer>');
      expect(cleaned).not.toContain('Copyright');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should preserve important content tags', () => {
      const html = `
        <article>
          <h1>Title</h1>
          <h2>Subtitle</h2>
          <p>Paragraph <strong>with</strong> <em>formatting</em>.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
          <ol>
            <li>Numbered item 1</li>
            <li>Numbered item 2</li>
          </ol>
          <blockquote>Quote</blockquote>
        </article>
      `;
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).toContain('<h1>Title</h1>');
      expect(cleaned).toContain('<h2>Subtitle</h2>');
      expect(cleaned).toContain('<p>Paragraph <strong>with</strong> <em>formatting</em>.</p>');
      expect(cleaned).toContain('<ul>');
      expect(cleaned).toContain('<li>List item 1</li>');
      expect(cleaned).toContain('<ol>');
      expect(cleaned).toContain('<li>Numbered item 1</li>');
      expect(cleaned).toContain('<blockquote>Quote</blockquote>');
    });
    
    test('should handle empty input', () => {
      const html = '';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).toBe('');
    });
    
    test('should handle input with only removed elements', () => {
      const html = '<script>alert("test");</script><style>.test{}</style>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).toBe('');
    });
    
    test('should handle malformed HTML', () => {
      const html = '<div><p>Unclosed paragraph<div>New div</div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).toContain('<p>Unclosed paragraph</p>');
      expect(cleaned).toContain('<div>New div</div>');
    });
  });
});
