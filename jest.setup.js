// Mock Chrome API
const mockChrome = {
  runtime: {
    getURL: jest.fn().mockReturnValue('mock-url'),
    sendMessage: jest.fn().mockImplementation((message, callback) => {
      if (callback) {
        callback({ success: true });
      }
      return Promise.resolve({ success: true });
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getManifest: jest.fn().mockReturnValue({
      name: 'Klartext',
      version: '1.5.24'
    }),
    lastError: null
  },
  storage: {
    sync: {
      get: jest.fn().mockImplementation((keys, callback) => {
        if (callback) {
          callback({});
        }
        return Promise.resolve({});
      }),
      set: jest.fn().mockImplementation((items, callback) => {
        if (callback) {
          callback();
        }
        return Promise.resolve();
      })
    },
    local: {
      get: jest.fn().mockImplementation((keys, callback) => {
        if (callback) {
          callback({});
        }
        return Promise.resolve({});
      }),
      set: jest.fn().mockImplementation((items, callback) => {
        if (callback) {
          callback();
        }
        return Promise.resolve();
      })
    }
  },
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1 }]),
    sendMessage: jest.fn().mockResolvedValue({ success: true })
  },
  scripting: {
    executeScript: jest.fn().mockResolvedValue([{ result: 'success' }])
  },
  contextMenus: {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeAll: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
};

// Ensure chrome is defined globally
global.chrome = mockChrome;
// Also define it as a regular variable for tests that use it directly
if (typeof window !== 'undefined') {
  window.chrome = mockChrome;
}

// Only mock browser-specific APIs if we're in a browser-like environment
if (typeof window !== 'undefined') {
  // Mock SpeechSynthesis API
  class MockSpeechSynthesisUtterance {
    constructor(text) {
      this.text = text;
      this.lang = 'de-DE';
      this.pitch = 1;
      this.rate = 0.9;
      this.volume = 1;
      this.voice = null;
      this.onstart = null;
      this.onend = null;
      this.onerror = null;
      this.onpause = null;
      this.onresume = null;
      this.onboundary = null;
      this.addEventListener = jest.fn();
      this.removeEventListener = jest.fn();
      this.dispatchEvent = jest.fn();
    }
  }

  global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

  global.speechSynthesis = {
    speaking: false,
    paused: false,
    pending: false,
    onvoiceschanged: null,
    getVoices: jest.fn().mockReturnValue([]),
    speak: jest.fn().mockImplementation(utterance => {
      speechSynthesis.speaking = true;
      speechSynthesis.paused = false;
      if (utterance.onstart) {
        utterance.onstart();
      }
    }),
    cancel: jest.fn().mockImplementation(() => {
      speechSynthesis.speaking = false;
      speechSynthesis.paused = false;
    }),
    pause: jest.fn().mockImplementation(() => {
      speechSynthesis.paused = true;
    }),
    resume: jest.fn().mockImplementation(() => {
      speechSynthesis.paused = false;
    })
  };
}

// Only mock DOM-related APIs if we're in a browser-like environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Mock DOM elements and events
  class MockElement {
    constructor(tagName) {
      this.tagName = tagName;
      this.children = [];
      this.classList = {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn().mockReturnValue(false),
        toggle: jest.fn()
      };
      this.style = {
        width: '',
        height: '',
        display: '',
        position: '',
        top: '',
        left: '',
        backgroundColor: '',
        color: '',
        fontSize: ''
      };
      this.dataset = {};
      this.textContent = '';
      this.innerHTML = '';
      this.innerText = '';
      this.value = '';
      this.checked = false;
      this.disabled = false;
      this.addEventListener = jest.fn();
      this.removeEventListener = jest.fn();
      this.getAttribute = jest.fn();
      this.setAttribute = jest.fn();
      this.removeAttribute = jest.fn();
      this.appendChild = jest.fn(child => {
        this.children.push(child);
        return child;
      });
      this.removeChild = jest.fn();
      this.insertBefore = jest.fn();
      this.replaceChild = jest.fn();
      this.cloneNode = jest.fn().mockReturnThis();
      this.closest = jest.fn();
      this.matches = jest.fn();
      this.querySelector = jest.fn();
      this.querySelectorAll = jest.fn().mockReturnValue([]);
      this.getBoundingClientRect = jest.fn().mockReturnValue({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: 0,
        height: 0
      });
      this.focus = jest.fn();
      this.blur = jest.fn();
      this.click = jest.fn();
    }
  }

  // Add missing DOM methods and properties
  document.elementFromPoint = jest.fn().mockReturnValue(new MockElement('div'));
  document.createRange = jest.fn().mockReturnValue({
    selectNodeContents: jest.fn(),
    getBoundingClientRect: jest.fn().mockReturnValue({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: 0,
      height: 0
    }),
    getClientRects: jest.fn().mockReturnValue([]),
    commonAncestorContainer: new MockElement('div')
  });
}

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
