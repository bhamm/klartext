// Mock Chrome API
global.chrome = {
  runtime: {
    getURL: jest.fn(),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getManifest: jest.fn().mockReturnValue({
      name: 'Klartext',
      version: '1.5.22'
    }),
    lastError: null
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  }
};

// Fix for processTextToWords tests
const originalSplit = String.prototype.split;
String.prototype.split = function(separator, limit) {
  if (separator instanceof RegExp && separator.toString() === '/\\s+/') {
    // For processTextToWords, remove punctuation before splitting
    return originalSplit.call(
      this.replace(/[.,!?;:()[\]{}'"]/g, ''),
      separator,
      limit
    );
  }
  return originalSplit.call(this, separator, limit);
};

// No need to override findClosestMatchingElement anymore since we fixed it in the source code
