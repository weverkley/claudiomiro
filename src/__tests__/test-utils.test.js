const {
  setupTestEnvironment,
  cleanupTestEnvironment,
  mockConsole,
  restoreConsole,
  createMockLogger,
  assertThrows,
  assertDoesNotThrow,
} = require('./test-utils');

describe('Test Utils', () => {
  describe('setupTestEnvironment', () => {
    test('should return mocked console methods', () => {
      const mocks = setupTestEnvironment();

      expect(mocks.consoleLog).toBeDefined();
      expect(mocks.consoleError).toBeDefined();
      expect(mocks.consoleWarn).toBeDefined();
      expect(typeof mocks.consoleLog.mockRestore).toBe('function');

      cleanupTestEnvironment(mocks);
    });

    test('should mock console.log', () => {
      const mocks = setupTestEnvironment();

      console.log('test message');
      expect(mocks.consoleLog).toHaveBeenCalledWith('test message');

      cleanupTestEnvironment(mocks);
    });
  });

  describe('cleanupTestEnvironment', () => {
    test('should restore all mocks', () => {
      const mocks = setupTestEnvironment();

      cleanupTestEnvironment(mocks);

      // After cleanup, console.log should be restored
      expect(typeof console.log).toBe('function');
    });

    test('should handle empty mocks object', () => {
      expect(() => cleanupTestEnvironment({})).not.toThrow();
    });

    test('should handle undefined mocks', () => {
      expect(() => cleanupTestEnvironment()).not.toThrow();
    });
  });

  describe('mockConsole', () => {
    test('should return all console method mocks', () => {
      const consoleMocks = mockConsole();

      expect(consoleMocks.log).toBeDefined();
      expect(consoleMocks.error).toBeDefined();
      expect(consoleMocks.warn).toBeDefined();
      expect(consoleMocks.info).toBeDefined();

      restoreConsole(consoleMocks);
    });

    test('should mock console methods correctly', () => {
      const consoleMocks = mockConsole();

      console.log('log test');
      console.error('error test');
      console.warn('warn test');
      console.info('info test');

      expect(consoleMocks.log).toHaveBeenCalledWith('log test');
      expect(consoleMocks.error).toHaveBeenCalledWith('error test');
      expect(consoleMocks.warn).toHaveBeenCalledWith('warn test');
      expect(consoleMocks.info).toHaveBeenCalledWith('info test');

      restoreConsole(consoleMocks);
    });
  });

  describe('restoreConsole', () => {
    test('should restore all console methods', () => {
      const consoleMocks = mockConsole();

      restoreConsole(consoleMocks);

      expect(typeof console.log).toBe('function');
    });

    test('should handle undefined consoleMocks', () => {
      expect(() => restoreConsole()).not.toThrow();
    });

    test('should handle null consoleMocks', () => {
      expect(() => restoreConsole(null)).not.toThrow();
    });
  });

  describe('createMockLogger', () => {
    test('should return a mock logger with all methods', () => {
      const mockLogger = createMockLogger();

      expect(typeof mockLogger.info).toBe('function');
      expect(typeof mockLogger.success).toBe('function');
      expect(typeof mockLogger.error).toBe('function');
      expect(typeof mockLogger.warning).toBe('function');
      expect(typeof mockLogger.step).toBe('function');
      expect(typeof mockLogger.task).toBe('function');
      expect(typeof mockLogger.subtask).toBe('function');
      expect(typeof mockLogger.indent).toBe('function');
      expect(typeof mockLogger.outdent).toBe('function');
      expect(typeof mockLogger.startSpinner).toBe('function');
      expect(typeof mockLogger.stopSpinner).toBe('function');
    });

    test('should have callable mock methods', () => {
      const mockLogger = createMockLogger();

      mockLogger.info('test');
      mockLogger.success('test');
      mockLogger.error('test');

      expect(mockLogger.info).toHaveBeenCalledWith('test');
      expect(mockLogger.success).toHaveBeenCalledWith('test');
      expect(mockLogger.error).toHaveBeenCalledWith('test');
    });

    test('should have initial properties set correctly', () => {
      const mockLogger = createMockLogger();

      expect(mockLogger.spinner).toBeNull();
      expect(mockLogger.indentLevel).toBe(0);
      expect(mockLogger.getIndent()).toBe('');
    });
  });

  describe('assertThrows', () => {
    test('should pass when function throws', () => {
      const throwingFn = () => {
        throw new Error('Test error');
      };

      assertThrows(throwingFn, 'Test error');
    });

    test('should work with error patterns', () => {
      const throwingFn = () => {
        throw new Error('Test error message');
      };

      assertThrows(throwingFn, /Test error/);
    });
  });

  describe('assertDoesNotThrow', () => {
    test('should pass when function does not throw', () => {
      const nonThrowingFn = () => {
        return 'success';
      };

      assertDoesNotThrow(nonThrowingFn);
    });
  });

  describe('Integration test', () => {
    test('should work together: setup, mock logger, and cleanup', () => {
      // Setup environment
      const envMocks = setupTestEnvironment();

      // Create mock logger
      const mockLogger = createMockLogger();

      // Use mock logger
      mockLogger.info('Test message');
      mockLogger.success('Success message');

      // Verify calls
      expect(mockLogger.info).toHaveBeenCalledWith('Test message');
      expect(mockLogger.success).toHaveBeenCalledWith('Success message');

      // Cleanup
      cleanupTestEnvironment(envMocks);

      // Verify cleanup
      expect(console.log).toBeDefined();
    });
  });
});
