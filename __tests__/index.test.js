/**
 * Tests for index.js - Main entry point
 * Tests the init() success flow, error handling, and async behavior
 */

const logger = require('../logger');
const { init } = require('../src/cli');

// Mock dependencies
jest.mock('../logger');
jest.mock('../src/cli');

describe('index.js - Main Entry Point', () => {
  let mockExit;
  let consoleLog;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock process.exit to prevent actual exit
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    // Mock console.log to prevent output during tests
    consoleLog = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    // Restore mocks after each test
    mockExit.mockRestore();
    consoleLog.mockRestore();
  });

  describe('init() success flow', () => {
    it('should call init() and resolve without errors', async () => {
      // Mock init to resolve successfully
      init.mockResolvedValue();

      // Require index.js to execute the init call
      jest.isolateModules(() => {
        require('../index');
      });

      // Wait for any pending promises
      await new Promise(process.nextTick);

      // Verify init was called
      expect(init).toHaveBeenCalledTimes(1);

      // Verify process.exit was NOT called
      expect(mockExit).not.toHaveBeenCalled();

      // Verify logger methods were NOT called (success path)
      expect(logger.newline).not.toHaveBeenCalled();
      expect(logger.failSpinner).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should not exit process on successful init', async () => {
      init.mockResolvedValue();

      jest.isolateModules(() => {
        require('../index');
      });

      await new Promise(process.nextTick);

      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should not call logger on successful init', async () => {
      init.mockResolvedValue();

      jest.isolateModules(() => {
        require('../index');
      });

      await new Promise(process.nextTick);

      expect(logger.failSpinner).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe('init() error handling', () => {
    it('should handle init() rejection with error logging', async () => {
      const testError = new Error('Test error message');
      init.mockRejectedValue(testError);

      jest.isolateModules(() => {
        require('../index');
      });

      // Wait for promise to reject and catch handler to execute
      await new Promise(process.nextTick);

      // Verify logger was called in correct sequence
      expect(logger.newline).toHaveBeenCalledTimes(2);
      expect(logger.failSpinner).toHaveBeenCalledWith('An error occurred');
      expect(logger.error).toHaveBeenCalledWith('Test error message');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should call logger.failSpinner with correct message', async () => {
      const testError = new Error('Another error');
      init.mockRejectedValue(testError);

      jest.isolateModules(() => {
        require('../index');
      });

      await new Promise(process.nextTick);

      expect(logger.failSpinner).toHaveBeenCalledWith('An error occurred');
    });

    it('should call logger.error with error message', async () => {
      const testError = new Error('Specific error message');
      init.mockRejectedValue(testError);

      jest.isolateModules(() => {
        require('../index');
      });

      await new Promise(process.nextTick);

      expect(logger.error).toHaveBeenCalledWith('Specific error message');
    });

    it('should call process.exit with code 1', async () => {
      const testError = new Error('Fatal error');
      init.mockRejectedValue(testError);

      jest.isolateModules(() => {
        require('../index');
      });

      await new Promise(process.nextTick);

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockExit).toHaveBeenCalledTimes(1);
    });

    it('should handle errors without message property', async () => {
      // Test with a string error instead of Error object
      init.mockRejectedValue({ message: 'Object with message' });

      jest.isolateModules(() => {
        require('../index');
      });

      await new Promise(process.nextTick);

      expect(logger.error).toHaveBeenCalledWith('Object with message');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('async behavior and promise chain', () => {
    it('should properly chain catch handler to init promise', async () => {
      const testError = new Error('Async error');
      init.mockRejectedValue(testError);

      jest.isolateModules(() => {
        require('../index');
      });

      await new Promise(process.nextTick);

      // Verify the catch handler was executed
      expect(logger.failSpinner).toHaveBeenCalled();
    });

    it('should handle async errors without throwing unhandled rejection', async () => {
      const testError = new Error('Unhandled promise rejection test');
      init.mockRejectedValue(testError);

      // Listen for unhandled rejections
      const unhandledRejectionHandler = jest.fn();
      process.on('unhandledRejection', unhandledRejectionHandler);

      jest.isolateModules(() => {
        require('../index');
      });

      await new Promise(process.nextTick);

      // Verify no unhandled rejection occurred
      expect(unhandledRejectionHandler).not.toHaveBeenCalled();

      // Cleanup
      process.removeListener('unhandledRejection', unhandledRejectionHandler);
    });

    it('should propagate error message correctly through promise chain', async () => {
      const errorMessage = 'Propagated error message';
      const testError = new Error(errorMessage);
      init.mockRejectedValue(testError);

      jest.isolateModules(() => {
        require('../index');
      });

      await new Promise(process.nextTick);

      expect(logger.error).toHaveBeenCalledWith(errorMessage);
    });

    it('should execute catch handler asynchronously', async () => {
      const testError = new Error('Async catch test');
      init.mockRejectedValue(testError);

      let catchExecuted = false;
      logger.failSpinner.mockImplementation(() => {
        catchExecuted = true;
      });

      jest.isolateModules(() => {
        require('../index');
      });

      // Catch should not execute immediately
      expect(catchExecuted).toBe(false);

      // Wait for async execution
      await new Promise(process.nextTick);

      // Now catch should have executed
      expect(catchExecuted).toBe(true);
    });
  });

  describe('integration - full error flow', () => {
    it('should execute complete error handling sequence', async () => {
      const errorObj = {
        message: 'Complete flow test error',
        stack: 'Error stack trace...',
      };
      init.mockRejectedValue(errorObj);

      // Track call order
      const callOrder = [];
      logger.newline.mockImplementation(() => callOrder.push('newline'));
      logger.failSpinner.mockImplementation(() => callOrder.push('failSpinner'));
      logger.error.mockImplementation(() => callOrder.push('error'));
      mockExit.mockImplementation(() => callOrder.push('exit'));

      jest.isolateModules(() => {
        require('../index');
      });

      await new Promise(process.nextTick);

      // Verify correct sequence: newline -> failSpinner -> error -> newline -> exit
      expect(callOrder).toEqual(['newline', 'failSpinner', 'error', 'newline', 'exit']);
      expect(logger.newline).toHaveBeenCalledTimes(2);
    });

    it('should handle error with all expected properties', async () => {
      const completeError = new Error('Full error test');
      completeError.code = 'ERR_TEST';
      completeError.stack = 'Stack trace here';

      init.mockRejectedValue(completeError);

      jest.isolateModules(() => {
        require('../index');
      });

      await new Promise(process.nextTick);

      // Verify error message is extracted correctly
      expect(logger.error).toHaveBeenCalledWith('Full error test');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should verify complete logger state after error', async () => {
      const testError = new Error('Logger state test');
      init.mockRejectedValue(testError);

      jest.isolateModules(() => {
        require('../index');
      });

      await new Promise(process.nextTick);

      // Verify all logger methods were called as expected
      expect(logger.newline.mock.calls.length).toBe(2);
      expect(logger.failSpinner.mock.calls.length).toBe(1);
      expect(logger.error.mock.calls.length).toBe(1);

      // Verify logger methods were called with correct arguments
      expect(logger.failSpinner.mock.calls[0][0]).toBe('An error occurred');
      expect(logger.error.mock.calls[0][0]).toBe('Logger state test');
    });
  });
});
