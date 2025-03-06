import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { SpeechController } from '../../../src/content/controllers/speech-controller';

describe('SpeechController', () => {
  let controller: SpeechController;
  let mockButton: HTMLElement;
  let mockUtterance: SpeechSynthesisUtterance;
  let originalSpeechSynthesis: typeof window.speechSynthesis;
  
  beforeEach(() => {
    // Create mock button
    mockButton = document.createElement('button');
    mockButton.innerHTML = 'Play';
    document.body.appendChild(mockButton);
    
    // Mock SpeechSynthesisUtterance
    mockUtterance = {
      text: '',
      voice: null,
      volume: 1,
      rate: 0.9,
      pitch: 1,
      lang: 'de-DE',
      onstart: null,
      onend: null,
      onerror: null,
      onpause: null,
      onresume: null,
      onboundary: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    } as unknown as SpeechSynthesisUtterance;
    
    // Save original speechSynthesis
    originalSpeechSynthesis = window.speechSynthesis;
    
    // Mock speechSynthesis
    window.speechSynthesis = {
      speaking: false,
      paused: false,
      pending: false,
      onvoiceschanged: null,
      getVoices: jest.fn().mockReturnValue([]),
      speak: jest.fn(),
      cancel: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    } as unknown as typeof window.speechSynthesis;
    
    // Mock SpeechSynthesisUtterance constructor
    global.SpeechSynthesisUtterance = jest.fn().mockImplementation(() => mockUtterance);
    
    // Create controller
    controller = new SpeechController();
  });
  
  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    
    // Restore original speechSynthesis
    window.speechSynthesis = originalSpeechSynthesis;
  });
  
  describe('setup', () => {
    test('should initialize with text and words', async () => {
      const text = 'This is a test sentence.';
      const words = ['This', 'is', 'a', 'test', 'sentence'];
      
      // Mock the SpeechSynthesisUtterance constructor to set the text
      (global.SpeechSynthesisUtterance as jest.Mock).mockImplementation((inputText) => {
        mockUtterance.text = inputText;
        return mockUtterance;
      });
      
      // Mock loadVoices to resolve immediately
      jest.spyOn(controller, 'loadVoices').mockResolvedValue();
      
      // Call setup and wait for it to complete
      await controller.setup(text, words, mockButton);
      
      expect(controller.words).toEqual(words);
      expect(controller.button).toBe(mockButton);
      expect(controller.isPlaying).toBe(false);
    });
    
    test('should set German language', () => {
      const text = 'Test text';
      const words = ['Test', 'text'];
      
      controller.setup(text, words, mockButton);
      
      expect(mockUtterance.lang).toBe('de-DE');
    });
  });
  
  describe('start', () => {
    test('should start speech synthesis', async () => {
      // Setup controller
      const text = 'Test text';
      const words = ['Test', 'text'];
      
      // Mock loadVoices to resolve immediately
      jest.spyOn(controller, 'loadVoices').mockResolvedValue();
      
      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 0 as any;
      });
      
      // Setup controller and wait for it to complete
      await controller.setup(text, words, mockButton);
      
      // Set utterance directly to ensure it's available
      controller.utterance = mockUtterance;
      
      // Start speech
      await controller.start();
      
      // Verify isPlaying is set to true
      expect(controller.isPlaying).toBe(true);
    });
    
    test('should update button state', () => {
      // Setup controller
      const text = 'Test text';
      const words = ['Test', 'text'];
      controller.setup(text, words, mockButton);
      
      // Mock updateButtonState
      const updateButtonStateSpy = jest.spyOn(controller, 'updateButtonState');
      
      // Start speech
      controller.start();
      
      expect(updateButtonStateSpy).toHaveBeenCalledWith(true);
    });
  });
  
  describe('pause', () => {
    test('should pause speech synthesis', () => {
      // Setup controller
      const text = 'Test text';
      const words = ['Test', 'text'];
      controller.setup(text, words, mockButton);
      
      // Start and then pause
      controller.start();
      controller.pause();
      
      expect(window.speechSynthesis.pause).toHaveBeenCalled();
    });
  });
  
  describe('resume', () => {
    test('should resume speech synthesis', () => {
      // Setup controller
      const text = 'Test text';
      const words = ['Test', 'text'];
      controller.setup(text, words, mockButton);
      
      // Start, pause, and then resume
      controller.start();
      controller.pause();
      controller.resume();
      
      expect(window.speechSynthesis.resume).toHaveBeenCalled();
    });
  });
  
  describe('stop', () => {
    test('should stop speech synthesis', () => {
      // Setup controller
      const text = 'Test text';
      const words = ['Test', 'text'];
      controller.setup(text, words, mockButton);
      
      // Start and then stop
      controller.start();
      controller.stop();
      
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
      expect(controller.isPlaying).toBe(false);
    });
    
    test('should update button state', () => {
      // Setup controller
      const text = 'Test text';
      const words = ['Test', 'text'];
      controller.setup(text, words, mockButton);
      
      // Mock updateButtonState
      const updateButtonStateSpy = jest.spyOn(controller, 'updateButtonState');
      
      // Start and then stop
      controller.start();
      controller.stop();
      
      expect(updateButtonStateSpy).toHaveBeenCalledWith(false);
    });
  });
  
  describe('toggle', () => {
    test('should start speech if not playing', () => {
      // Setup controller
      const text = 'Test text';
      const words = ['Test', 'text'];
      controller.setup(text, words, mockButton);
      
      // Mock start
      const startSpy = jest.spyOn(controller, 'start');
      
      // Toggle
      controller.toggle();
      
      expect(startSpy).toHaveBeenCalled();
    });
  });
  
  describe('updateButtonState', () => {
    test('should update button text and class for playing state', () => {
      // Setup controller
      const text = 'Test text';
      const words = ['Test', 'text'];
      controller.setup(text, words, mockButton);
      
      // Update button state to playing
      controller.updateButtonState(true);
      
      expect(mockButton.textContent).toContain('Pause');
      expect(mockButton.classList.contains('playing')).toBe(true);
    });
    
    test('should update button text and class for stopped state', () => {
      // Setup controller
      const text = 'Test text';
      const words = ['Test', 'text'];
      controller.setup(text, words, mockButton);
      
      // First set to playing
      controller.updateButtonState(true);
      
      // Then update to stopped
      controller.updateButtonState(false);
      
      expect(mockButton.textContent).toContain('Vorlesen');
      expect(mockButton.classList.contains('playing')).toBe(false);
    });
  });
});
