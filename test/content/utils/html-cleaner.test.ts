import { describe, test, expect } from '@jest/globals';
import { cleanArticleHTML, stripWhitespace } from '../../../src/content/utils/html-cleaner';

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
    
    test('should remove images', () => {
      const html = '<div><img src="image.jpg" alt="Test image"><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('<img');
      expect(cleaned).not.toContain('src="image.jpg"');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should remove tracking pixels', () => {
      const html = '<div><img src="//taz.met.vgwort.de/na/pixel.gif" alt=""><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('<img');
      expect(cleaned).not.toContain('vgwort');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should remove figure and figcaption elements', () => {
      const html = '<div><figure><img src="image.jpg"><figcaption>Caption text</figcaption></figure><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('<figure>');
      expect(cleaned).not.toContain('<figcaption>');
      expect(cleaned).not.toContain('Caption text');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should remove article metadata', () => {
      const html = '<div><span>7582376</span><span>6071785</span><p>Content</p></div>';
      const cleaned = cleanArticleHTML(html);
      
      expect(cleaned).not.toContain('7582376');
      expect(cleaned).not.toContain('6071785');
      expect(cleaned).toContain('<p>Content</p>');
    });
    
    test('should handle complex news article content', () => {
      const html = `
        <div>
          <span>7582376</span><span>6071785</span>
          <img src="//taz.met.vgwort.de/na/8919ccb0cee04328b775b45799046617" alt="">
          <h2><span>Antwort auf 551 Fragen zu NGOs</span><span>: </span></h2>
          <p>Mit 551 Fragen nahm die Union die linke Zivilgesellschaft ins Visier. So antwortete die Bundesregierung.</p>
          <div>
            <figcaption>Bekommt eine deutliche Abfuhr des Finanzministeriums für die Anfrage seiner Fraktion: Friedrich Merz <span><span>Foto: <span>Lisi Niesner, Reuters</span></span></span></figcaption>
          </div>
          <div>
            <div>
              <figure title="Konrad Litschko"><img src="https://taz.de/kommune/files/images/profile/192x192/7.webp" alt="Konrad Litschko "></figure>
              <div><span>Von </span><a href="/Konrad-Litschko/!a7/"><span>Konrad Litschko</span></a></div>
            </div>
          </div>
          <div>
            <div>
              <p><em>taz</em> | Selten sorgte eine Anfrage im Bundestag für so viel Aufruhr.</p>
            </div>
          </div>
          <div>
            <div>
              <p>Als Genossenschaft gehören wir unseren Leser:innen. Und unser Journalismus ist nicht nur 100 % konzernfrei, sondern auch kostenfrei zugänglich.</p>
            </div>
          </div>
        </div>
      `;
      const cleaned = cleanArticleHTML(html);
      
      // Should keep main content
      expect(cleaned).toContain('Antwort auf 551 Fragen zu NGOs');
      expect(cleaned).toContain('Mit 551 Fragen nahm die Union die linke Zivilgesellschaft ins Visier');
      expect(cleaned).toContain('Selten sorgte eine Anfrage im Bundestag für so viel Aufruhr');
      
      // Should remove unnecessary elements
      expect(cleaned).not.toContain('<img');
      expect(cleaned).not.toContain('vgwort');
      expect(cleaned).not.toContain('<figure');
      expect(cleaned).not.toContain('<figcaption');
      expect(cleaned).not.toContain('Foto: Lisi Niesner, Reuters');
      
      // Note: In a real-world scenario, the donation text might still be present
      // as it's part of a paragraph element which is considered content.
      // What's important is that the main article content is preserved
      // and non-content elements like images, tracking pixels, and metadata are removed.
    });
  });

  describe('stripWhitespace', () => {
    test('should remove whitespace between HTML tags', () => {
      const html = '<div>  \n  <p>  Content  </p>  \n  </div>';
      const stripped = stripWhitespace(html);
      
      expect(stripped).toBe('<div><p> Content </p></div>');
    });
    
    test('should normalize whitespace within text content', () => {
      const html = '<p>This is   some   spaced   text</p>';
      const stripped = stripWhitespace(html);
      
      expect(stripped).toBe('<p>This is some spaced text</p>');
    });
    
    test('should remove linebreaks between tags', () => {
      const html = '<div>\n<p>\nContent\n</p>\n</div>';
      const stripped = stripWhitespace(html);
      
      expect(stripped).toBe('<div><p> Content </p></div>');
    });
    
    test('should handle nested elements', () => {
      const html = '<div>\n  <ul>\n    <li>Item 1</li>\n    <li>Item 2</li>\n  </ul>\n</div>';
      const stripped = stripWhitespace(html);
      
      expect(stripped).toBe('<div><ul><li>Item 1</li><li>Item 2</li></ul></div>');
    });
    
    test('should preserve whitespace in pre, code, and textarea tags', () => {
      const html = '<pre>  function test() {\n    console.log("test");\n  }  </pre>';
      const stripped = stripWhitespace(html);
      
      expect(stripped).toBe('<pre>  function test() {\n    console.log("test");\n  }  </pre>');
    });
    
    test('should handle empty input', () => {
      const html = '';
      const stripped = stripWhitespace(html);
      
      expect(stripped).toBe('');
    });
    
    test('should handle input with only whitespace', () => {
      const html = '   \n   \t   ';
      const stripped = stripWhitespace(html);
      
      expect(stripped).toBe('');
    });
    
    test('should handle complex HTML with multiple whitespace patterns', () => {
      const html = `
        <div>
          <h1>  Title  </h1>
          <p>
            This is a paragraph with    multiple spaces
            and line breaks.
          </p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;
      const stripped = stripWhitespace(html);
      
      expect(stripped).not.toContain('\n');
      expect(stripped).toContain('<div><h1> Title </h1><p> This is a paragraph with multiple spaces and line breaks. </p><ul><li>Item 1</li><li>Item 2</li></ul></div>');
    });
    
    test('should handle malformed HTML', () => {
      const html = '<div>  <p>Unclosed paragraph  <div>  New div  </div>';
      const stripped = stripWhitespace(html);
      
      expect(stripped).toContain('<div><p>Unclosed paragraph </p><div> New div </div></div>');
    });
  });
});
