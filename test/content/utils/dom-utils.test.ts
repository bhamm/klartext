import { describe, test, expect, beforeEach } from '@jest/globals';
import { findClosestMatchingElement, createElement, processTextToWords } from '../../../src/content/utils/dom-utils';

describe('DOM Utilities', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
  });
  
  describe('createElement', () => {
    test('should create element with specified tag', () => {
      const element = createElement('div');
      
      expect(element.tagName).toBe('DIV');
    });
    
    test('should set attributes on created element', () => {
      const element = createElement('button', {
        className: 'test-class',
        textContent: 'Test Button',
        'data-test': 'test-data',
        'aria-label': 'Test Label'
      });
      
      expect(element.className).toBe('test-class');
      expect(element.textContent).toBe('Test Button');
      expect(element.getAttribute('data-test')).toBe('test-data');
      expect(element.getAttribute('aria-label')).toBe('Test Label');
    });
    
    test('should set event handlers on created element', () => {
      const clickHandler = jest.fn();
      
      const element = createElement('button', {
        onclick: clickHandler
      });
      
      element.click();
      
      expect(clickHandler).toHaveBeenCalled();
    });
    
    test('should set innerHTML if provided', () => {
      const element = createElement('div', {
        innerHTML: '<span>Test</span>'
      });
      
      expect(element.innerHTML).toBe('<span>Test</span>');
      expect(element.firstChild?.nodeName).toBe('SPAN');
    });
  });
  
  describe('findClosestMatchingElement', () => {
    test('should return null if element is null', () => {
      // Use type assertion to satisfy TypeScript
      const result = findClosestMatchingElement(null as unknown as HTMLElement, ['article', '.content']);
      
      expect(result).toBeNull();
    });
    
    test('should return element if it matches selector', () => {
      const element = document.createElement('article');
      document.body.appendChild(element);
      
      const result = findClosestMatchingElement(element, ['article', '.content']);
      
      expect(result).toBe(element);
    });
    
    test('should return parent element if it matches selector', () => {
      const parent = document.createElement('article');
      const child = document.createElement('p');
      parent.appendChild(child);
      document.body.appendChild(parent);
      
      const result = findClosestMatchingElement(child, ['article', '.content']);
      
      expect(result).toBe(parent);
    });
    
    test('should return ancestor element if it matches selector', () => {
      const grandparent = document.createElement('div');
      grandparent.className = 'content';
      
      const parent = document.createElement('div');
      const child = document.createElement('p');
      
      parent.appendChild(child);
      grandparent.appendChild(parent);
      document.body.appendChild(grandparent);
      
      const result = findClosestMatchingElement(child, ['article', '.content']);
      
      expect(result).toBe(grandparent);
    });
    
    test('should return null if no matching element is found', () => {
      const element = document.createElement('p');
      document.body.appendChild(element);
      
      const result = findClosestMatchingElement(element, ['article', '.content']);
      
      expect(result).toBeNull();
    });
    
    test('should handle multiple selectors', () => {
      // Create elements
      const article = document.createElement('article');
      const content = document.createElement('div');
      content.className = 'content';
      const child = document.createElement('p');
      
      // Build DOM structure
      content.appendChild(child);
      document.body.appendChild(article);
      document.body.appendChild(content);
      
      // Test with child in content div
      const result1 = findClosestMatchingElement(child, ['article', '.content']);
      expect(result1).toBe(content);
      
      // Move child to article
      content.removeChild(child);
      article.appendChild(child);
      
      // Test with child in article
      const result2 = findClosestMatchingElement(child, ['article', '.content']);
      expect(result2).toBe(article);
    });
  });
  
  describe('processTextToWords', () => {
    test('should split text into words', () => {
      const text = 'This is a test sentence.';
      const words = processTextToWords(text);
      
      expect(words).toEqual(['This', 'is', 'a', 'test', 'sentence']);
    });
    
    test('should handle multiple sentences', () => {
      const text = 'First sentence. Second sentence! Third sentence?';
      const words = processTextToWords(text);
      
      expect(words).toEqual([
        'First', 'sentence', 'Second', 'sentence', 'Third', 'sentence'
      ]);
    });
    
    test('should handle special characters and punctuation', () => {
      const text = 'Hello, world! This is a "quoted" text with some (parentheses).';
      const words = processTextToWords(text);
      
      expect(words).toEqual([
        'Hello', 'world', 'This', 'is', 'a', 'quoted', 'text', 'with', 'some', 'parentheses'
      ]);
    });
    
    test('should handle whitespace and line breaks', () => {
      const text = 'Line one\nLine two\r\nLine three';
      const words = processTextToWords(text);
      
      expect(words).toEqual([
        'Line', 'one', 'Line', 'two', 'Line', 'three'
      ]);
    });
    
    test('should handle empty text', () => {
      const text = '';
      const words = processTextToWords(text);
      
      expect(words).toEqual([]);
    });
    
    test('should handle text with only punctuation and whitespace', () => {
      const text = '... , ! ? \n\r\t';
      const words = processTextToWords(text);
      
      expect(words).toEqual([]);
    });
  });
});
