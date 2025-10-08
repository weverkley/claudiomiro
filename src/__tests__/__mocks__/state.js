/**
 * Mock State Module
 * Provides a jest-mocked version of the state configuration
 */

const path = require('path');

class MockState {
  constructor() {
    this._folder = null;
    this._claudiomiroFolder = null;
  }

  setFolder(folderPath) {
    this._folder = path.resolve(folderPath);
    this._claudiomiroFolder = path.join(this._folder, '.claudiomiro');
  }

  get folder() {
    return this._folder;
  }

  get claudiomiroFolder() {
    return this._claudiomiroFolder;
  }

  reset() {
    this._folder = null;
    this._claudiomiroFolder = null;
  }
}

// Create a new instance for mocking
const mockState = new MockState();

// Spy on methods for testing
jest.spyOn(mockState, 'setFolder');

module.exports = mockState;
