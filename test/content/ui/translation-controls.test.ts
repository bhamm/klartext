import { describe, test, expect, beforeEach } from '@jest/globals';
import { TranslationControls } from '../../../src/content/ui/translation-controls';
import { speechController } from '../../../src/content/controllers/speech-controller';

// Mock dependencies
jest.mock('../../../src/content/controllers/speech-controller', () => ({
  speechController: {
    setup: jest.fn(),
    toggle: jest.fn(),
    stop: jest.fn()
  }
}));

describe('TranslationControls', () => {
  let controls: TranslationControls;
  
  beforeEach(() => {
    // Setup DOM
    document.body = document.createElement('body');
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Create controls
    controls = new TranslationControls();
  });
  
  describe('setupControls', () => {
    test('should create control elements', () => {
      controls.setupControls();
      
      expect(controls.container).not.toBeNull();
      expect(controls.progressBar).not.toBeNull();
      expect(controls.progressText).not.toBeNull();
      expect(controls.viewToggle).not.toBeNull();
      expect(controls.ttsButton).not.toBeNull();
      expect(controls.minimizeButton).not.toBeNull();
      
      // Check if container is added to the document
      expect(document.body.contains(controls.container)).toBe(true);
    });
    
    test('should set up event listeners', () => {
      // Spy on event listeners
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      controls.setupControls();
      
      // Check if event listener for Escape key is added
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      // Check if minimize button has click handler
      const minimizeButton = controls.minimizeButton as HTMLElement;
      const minimizeSpy = jest.spyOn(controls, 'toggleMinimize');
      minimizeButton.click();
      expect(minimizeSpy).toHaveBeenCalled();
      
      // Check if view toggle button has click handler
      const viewToggle = controls.viewToggle as HTMLElement;
      const viewToggleSpy = jest.spyOn(controls, 'toggleView');
      viewToggle.click();
      expect(viewToggleSpy).toHaveBeenCalled();
      
      // Check if TTS button has click handler
      const ttsButton = controls.ttsButton as HTMLElement;
      ttsButton.click();
      expect(speechController.toggle).toHaveBeenCalled();
    });
    
    test('should handle Escape key press', () => {
      controls.setupControls();
      
      // Spy on hide method
      const hideSpy = jest.spyOn(controls, 'hide');
      
      // Simulate Escape key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      
      expect(hideSpy).toHaveBeenCalled();
    });
  });
  
  describe('updateProgress', () => {
    test('should update progress bar and text', () => {
      controls.setupControls();
      
      controls.updateProgress(3, 10);
      
      // Check progress bar width
      expect(controls.progressBar?.style.width).toBe('30%');
      
      // Check progress text
      expect(controls.progressText?.textContent).toBe('3 / 10');
    });
    
    test('should handle zero total', () => {
      controls.setupControls();
      
      controls.updateProgress(0, 0);
      
      // Check progress bar width
      expect(controls.progressBar?.style.width).toBe('0%');
      
      // Check progress text
      expect(controls.progressText?.textContent).toBe('0 / 0');
    });
    
    test('should handle current greater than total', () => {
      controls.setupControls();
      
      controls.updateProgress(15, 10);
      
      // Check progress bar width (should be capped at 100%)
      expect(controls.progressBar?.style.width).toBe('100%');
      
      // Check progress text
      expect(controls.progressText?.textContent).toBe('15 / 10');
    });
  });
  
  describe('toggleMinimize', () => {
    test('should toggle minimized state', () => {
      controls.setupControls();
      
      // Initially not minimized
      expect(controls.isMinimized).toBe(false);
      expect(controls.container?.classList.contains('minimized')).toBe(false);
      
      // Toggle to minimized
      controls.toggleMinimize();
      
      expect(controls.isMinimized).toBe(true);
      expect(controls.container?.classList.contains('minimized')).toBe(true);
      
      // Toggle back to not minimized
      controls.toggleMinimize();
      
      expect(controls.isMinimized).toBe(false);
      expect(controls.container?.classList.contains('minimized')).toBe(false);
    });
    
    test('should update minimize button text', () => {
      controls.setupControls();
      
      // Get initial text
      const initialText = controls.minimizeButton?.textContent;
      
      // Toggle to minimized
      controls.toggleMinimize();
      
      // Get minimized text
      const minimizedText = controls.minimizeButton?.textContent;
      
      // Toggle back
      controls.toggleMinimize();
      
      // Get restored text
      const restoredText = controls.minimizeButton?.textContent;
      
      // Check that text changes
      expect(minimizedText).not.toBe(initialText);
      expect(restoredText).toBe(initialText);
    });
  });
  
  describe('toggleView', () => {
    test('should toggle compare view class on body', () => {
      controls.setupControls();
      
      // Initially no compare view
      expect(document.body.classList.contains('klartext-compare-view')).toBe(false);
      
      // Toggle to compare view
      controls.toggleView();
      
      expect(document.body.classList.contains('klartext-compare-view')).toBe(true);
      
      // Toggle back
      controls.toggleView();
      
      expect(document.body.classList.contains('klartext-compare-view')).toBe(false);
    });
    
    test('should update view toggle button text', () => {
      controls.setupControls();
      
      // Get initial text
      const initialText = controls.viewToggle?.textContent;
      
      // Toggle to compare view
      controls.toggleView();
      
      // Get compare view text
      const compareText = controls.viewToggle?.textContent;
      
      // Toggle back
      controls.toggleView();
      
      // Get restored text
      const restoredText = controls.viewToggle?.textContent;
      
      // Check that text changes
      expect(compareText).not.toBe(initialText);
      expect(restoredText).toBe(initialText);
    });
  });
  
  describe('show', () => {
    test('should make controls visible', () => {
      controls.setupControls();
      
      // First hide
      controls.container?.classList.remove('visible');
      
      // Then show
      controls.show();
      
      expect(controls.container?.classList.contains('visible')).toBe(true);
    });
  });
  
  describe('hide', () => {
    test('should hide controls and stop speech', () => {
      controls.setupControls();
      
      // First show
      controls.container?.classList.add('visible');
      
      // Then hide
      controls.hide();
      
      expect(controls.container?.classList.contains('visible')).toBe(false);
      expect(speechController.stop).toHaveBeenCalled();
    });
  });
  
  describe('setupTTS', () => {
    test('should set up speech controller', () => {
      controls.setupControls();
      
      const text = 'Test text';
      const words = ['Test', 'text'];
      
      controls.setupTTS(text, words);
      
      expect(speechController.setup).toHaveBeenCalledWith(text, words, controls.ttsButton);
    });
  });
  
  describe('singleton pattern', () => {
    test('should return same instance when created multiple times', () => {
      const controls1 = new TranslationControls();
      const controls2 = new TranslationControls();
      
      expect(controls1).toBe(controls2);
    });
  });
});
