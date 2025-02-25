// Mock Chrome API
global.chrome = {
  runtime: {
    getURL: jest.fn(),
    lastError: null,
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    }
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
    sendMessage: jest.fn()
  },
  contextMenus: {
    create: jest.fn(),
    removeAll: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  scripting: {
    insertCSS: jest.fn(),
    executeScript: jest.fn()
  }
};

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
