/**
 * Test Utilities for Claudiomiro
 * Provides common testing utilities and helpers
 */

/**
 * Setup test environment
 * - Mocks console methods
 * - Initializes common test state
 */
function setupTestEnvironment() {
  const mocks = {
    consoleLog: jest.spyOn(console, 'log').mockImplementation(),
    consoleError: jest.spyOn(console, 'error').mockImplementation(),
    consoleWarn: jest.spyOn(console, 'warn').mockImplementation(),
  };

  return mocks;
}

/**
 * Cleanup test environment
 * - Restores all mocked functions
 * - Clears all mocks
 */
function cleanupTestEnvironment(mocks = {}) {
  Object.values(mocks).forEach(mock => {
    if (mock && typeof mock.mockRestore === 'function') {
      mock.mockRestore();
    }
  });

  jest.clearAllMocks();
}

/**
 * Mock console methods
 * @returns {Object} Object with mocked console methods
 */
function mockConsole() {
  return {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation(),
  };
}

/**
 * Restore console methods
 * @param {Object} consoleMocks - Object containing mocked console methods
 */
function restoreConsole(consoleMocks) {
  if (!consoleMocks) return;

  Object.values(consoleMocks).forEach(mock => {
    if (mock && typeof mock.mockRestore === 'function') {
      mock.mockRestore();
    }
  });
}

/**
 * Create a mock logger instance
 * @returns {Object} Mock logger with all methods
 */
function createMockLogger() {
  return {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    step: jest.fn(),
    task: jest.fn(),
    subtask: jest.fn(),
    path: jest.fn(),
    command: jest.fn(),
    separator: jest.fn(),
    newline: jest.fn(),
    indent: jest.fn(),
    outdent: jest.fn(),
    resetIndent: jest.fn(),
    getIndent: jest.fn(() => ''),
    startSpinner: jest.fn(),
    updateSpinner: jest.fn(),
    succeedSpinner: jest.fn(),
    failSpinner: jest.fn(),
    stopSpinner: jest.fn(),
    progress: jest.fn(),
    createProgressBar: jest.fn(() => ''),
    banner: jest.fn(),
    box: jest.fn(),
    clear: jest.fn(),
    spinner: null,
    indentLevel: 0,
  };
}

/**
 * Assert that a function throws an error
 * @param {Function} fn - Function to test
 * @param {String|RegExp} expectedError - Expected error message or pattern
 */
function assertThrows(fn, expectedError) {
  expect(fn).toThrow(expectedError);
}

/**
 * Assert that a function does not throw
 * @param {Function} fn - Function to test
 */
function assertDoesNotThrow(fn) {
  expect(fn).not.toThrow();
}

module.exports = {
  setupTestEnvironment,
  cleanupTestEnvironment,
  mockConsole,
  restoreConsole,
  createMockLogger,
  assertThrows,
  assertDoesNotThrow,
};
