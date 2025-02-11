import '@testing-library/jest-dom';
import { chrome } from 'jest-chrome';

// Mock chrome API
global.chrome = chrome;

// Mock window.getSelection
global.getSelection = () => ({
  toString: () => 'Test text'
});

// Mock manifest
chrome.runtime.getManifest.mockImplementation(() => ({
  name: 'Klartext - Leichte Sprache',
  version: '1.0.0'
}));

// Mock storage
const mockStorage = {
  sync: {
    get: jest.fn(),
    set: jest.fn()
  }
};
chrome.storage = mockStorage;

// Mock messaging
chrome.runtime.sendMessage.mockImplementation(() => Promise.resolve({ success: true }));
chrome.tabs.sendMessage.mockImplementation(() => Promise.resolve({ status: 'ok' }));

// Mock scripting
chrome.scripting = {
  executeScript: jest.fn().mockImplementation(() => Promise.resolve([{ result: true }]))
};

// Mock tabs
chrome.tabs = {
  ...chrome.tabs,
  query: jest.fn().mockImplementation(() => Promise.resolve([{ id: 1, url: 'https://example.com' }]))
};

// Mock context menus
chrome.contextMenus = {
  create: jest.fn(),
  removeAll: jest.fn(),
  onClicked: {
    addListener: jest.fn()
  }
};
