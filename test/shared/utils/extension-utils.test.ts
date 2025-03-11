import { describe, test, expect, beforeEach, jest, afterAll } from '@jest/globals';
import { isInDeveloperMode, isLikelyInDeveloperMode } from '../../../src/shared/utils/extension-utils';

// Mock the Chrome API
const mockChrome = {
  runtime: {
    id: 'test-extension-id',
    lastError: null as null | { message: string }
  },
  management: {
    getSelf: jest.fn()
  }
};

// Save the original global chrome object if it exists
const originalChrome = global.chrome;

describe('Extension Utilities', () => {
  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();
    mockChrome.runtime.lastError = null;
    
    // Set up the global chrome object with our mock
    global.chrome = mockChrome as unknown as typeof chrome;
  });
  
  afterAll(() => {
    // Restore the original global chrome object
    global.chrome = originalChrome;
  });
  
  describe('isInDeveloperMode', () => {
    test('should return true when installType is development', async () => {
      // Setup mock to return development installType
      mockChrome.management.getSelf.mockImplementation((callback: any) => {
        callback({ installType: 'development' });
      });
      
      const result = await isInDeveloperMode();
      
      expect(mockChrome.management.getSelf).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    test('should return false when installType is not development', async () => {
      // Setup mock to return normal installType
      mockChrome.management.getSelf.mockImplementation((callback: any) => {
        callback({ installType: 'normal' });
      });
      
      const result = await isInDeveloperMode();
      
      expect(mockChrome.management.getSelf).toHaveBeenCalled();
      expect(result).toBe(false);
    });
    
    test('should return false when chrome.runtime.lastError occurs', async () => {
      // Setup mock to simulate an error
      mockChrome.management.getSelf.mockImplementation((callback: any) => {
        // Set the lastError
        mockChrome.runtime.lastError = { message: 'Test error' };
        callback({ installType: 'unknown' });
      });
      
      const result = await isInDeveloperMode();
      
      expect(mockChrome.management.getSelf).toHaveBeenCalled();
      expect(result).toBe(false);
    });
    
    test('should return false when chrome.management API is not available', async () => {
      // Create a new mock without the getSelf method
      const tempMock = {
        runtime: { ...mockChrome.runtime },
        management: {}
      };
      
      // Replace the global chrome object with our temporary mock
      global.chrome = tempMock as unknown as typeof chrome;
      
      const result = await isInDeveloperMode();
      
      expect(result).toBe(false);
      
      // Restore the original mock
      global.chrome = mockChrome as unknown as typeof chrome;
    });
  });
  
  describe('isLikelyInDeveloperMode', () => {
    test('should return true for non-standard extension IDs', () => {
      // Test with a non-standard ID (contains hyphens)
      mockChrome.runtime.id = 'test-extension-id';
      
      const result = isLikelyInDeveloperMode();
      
      expect(result).toBe(true);
    });
    
    test('should return true for IDs that are not 32 characters', () => {
      // Test with an ID that's not 32 characters
      mockChrome.runtime.id = 'abcdef';
      
      const result = isLikelyInDeveloperMode();
      
      expect(result).toBe(true);
    });
    
    test('should return true for IDs with non-lowercase letters', () => {
      // Test with an ID that contains uppercase letters
      mockChrome.runtime.id = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef';
      
      const result = isLikelyInDeveloperMode();
      
      expect(result).toBe(true);
    });
    
    test('should return false for standard Web Store extension IDs', () => {
      // Test with a standard Web Store ID (32 lowercase letters)
      mockChrome.runtime.id = 'abcdefghijklmnopqrstuvwxyzabcdef';
      
      const result = isLikelyInDeveloperMode();
      
      expect(result).toBe(false);
    });
  });
});
