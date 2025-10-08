/**
 * Mock Logger Module
 * Provides a jest-mocked version of the logger for testing
 */

const mockLogger = {
  // Basic logging methods
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),

  // Step and task logging
  step: jest.fn(),
  task: jest.fn(),
  subtask: jest.fn(),

  // Special logging
  path: jest.fn(),
  command: jest.fn(),
  banner: jest.fn(),
  box: jest.fn(),

  // Indentation
  indent: jest.fn(),
  outdent: jest.fn(),
  resetIndent: jest.fn(),
  getIndent: jest.fn().mockReturnValue(''),

  // Spinner methods
  startSpinner: jest.fn(),
  updateSpinner: jest.fn(),
  succeedSpinner: jest.fn(),
  failSpinner: jest.fn(),
  stopSpinner: jest.fn(),

  // Progress
  progress: jest.fn(),
  createProgressBar: jest.fn().mockReturnValue(''),

  // Utility methods
  separator: jest.fn(),
  newline: jest.fn(),
  clear: jest.fn(),

  // Properties
  spinner: null,
  indentLevel: 0,
};

module.exports = mockLogger;
