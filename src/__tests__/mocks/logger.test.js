/**
 * Tests for the logger mock module
 */

// Use the mock logger directly
const mockLogger = require('../__mocks__/logger');

describe('Logger Mock', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    jest.clearAllMocks();
  });

  describe('Basic logging methods', () => {
    test('info() should be mockable', () => {
      mockLogger.info('test message');
      expect(mockLogger.info).toHaveBeenCalledWith('test message');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
    });

    test('success() should be mockable', () => {
      mockLogger.success('success message');
      expect(mockLogger.success).toHaveBeenCalledWith('success message');
      expect(mockLogger.success).toHaveBeenCalledTimes(1);
    });

    test('error() should be mockable', () => {
      mockLogger.error('error message');
      expect(mockLogger.error).toHaveBeenCalledWith('error message');
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    test('warning() should be mockable', () => {
      mockLogger.warning('warning message');
      expect(mockLogger.warning).toHaveBeenCalledWith('warning message');
      expect(mockLogger.warning).toHaveBeenCalledTimes(1);
    });
  });

  describe('Step and task logging', () => {
    test('step() should be mockable', () => {
      mockLogger.step(1, 5, 2, 'Step message');
      expect(mockLogger.step).toHaveBeenCalledWith(1, 5, 2, 'Step message');
    });

    test('task() should be mockable', () => {
      mockLogger.task('Task message');
      expect(mockLogger.task).toHaveBeenCalledWith('Task message');
    });

    test('subtask() should be mockable', () => {
      mockLogger.subtask('Subtask message');
      expect(mockLogger.subtask).toHaveBeenCalledWith('Subtask message');
    });
  });

  describe('Special logging methods', () => {
    test('path() should be mockable', () => {
      mockLogger.path('/test/path');
      expect(mockLogger.path).toHaveBeenCalledWith('/test/path');
    });

    test('command() should be mockable', () => {
      mockLogger.command('npm test');
      expect(mockLogger.command).toHaveBeenCalledWith('npm test');
    });

    test('banner() should be mockable', () => {
      mockLogger.banner();
      expect(mockLogger.banner).toHaveBeenCalled();
    });

    test('box() should be mockable', () => {
      mockLogger.box('Important message', { borderColor: 'red' });
      expect(mockLogger.box).toHaveBeenCalledWith('Important message', { borderColor: 'red' });
    });
  });

  describe('Indentation methods', () => {
    test('indent() should be mockable', () => {
      mockLogger.indent();
      expect(mockLogger.indent).toHaveBeenCalled();
    });

    test('outdent() should be mockable', () => {
      mockLogger.outdent();
      expect(mockLogger.outdent).toHaveBeenCalled();
    });

    test('resetIndent() should be mockable', () => {
      mockLogger.resetIndent();
      expect(mockLogger.resetIndent).toHaveBeenCalled();
    });

    test('getIndent() should be mockable and return value', () => {
      const result = mockLogger.getIndent();
      expect(mockLogger.getIndent).toHaveBeenCalled();
      expect(typeof result).toBe('string');
    });
  });

  describe('Spinner methods', () => {
    test('startSpinner() should be mockable', () => {
      mockLogger.startSpinner('Loading...');
      expect(mockLogger.startSpinner).toHaveBeenCalledWith('Loading...');
    });

    test('updateSpinner() should be mockable', () => {
      mockLogger.updateSpinner('Still loading...');
      expect(mockLogger.updateSpinner).toHaveBeenCalledWith('Still loading...');
    });

    test('succeedSpinner() should be mockable', () => {
      mockLogger.succeedSpinner('Done!');
      expect(mockLogger.succeedSpinner).toHaveBeenCalledWith('Done!');
    });

    test('failSpinner() should be mockable', () => {
      mockLogger.failSpinner('Failed!');
      expect(mockLogger.failSpinner).toHaveBeenCalledWith('Failed!');
    });

    test('stopSpinner() should be mockable', () => {
      mockLogger.stopSpinner();
      expect(mockLogger.stopSpinner).toHaveBeenCalled();
    });
  });

  describe('Progress methods', () => {
    test('progress() should be mockable', () => {
      mockLogger.progress(5, 10, 'Loading');
      expect(mockLogger.progress).toHaveBeenCalledWith(5, 10, 'Loading');
    });

    test('createProgressBar() should be mockable and return value', () => {
      const result = mockLogger.createProgressBar(50);
      expect(mockLogger.createProgressBar).toHaveBeenCalledWith(50);
      expect(typeof result).toBe('string');
    });
  });

  describe('Utility methods', () => {
    test('separator() should be mockable', () => {
      mockLogger.separator();
      expect(mockLogger.separator).toHaveBeenCalled();
    });

    test('newline() should be mockable', () => {
      mockLogger.newline();
      expect(mockLogger.newline).toHaveBeenCalled();
    });

    test('clear() should be mockable', () => {
      mockLogger.clear();
      expect(mockLogger.clear).toHaveBeenCalled();
    });
  });

  describe('Properties', () => {
    test('should have spinner property', () => {
      expect(mockLogger).toHaveProperty('spinner');
    });

    test('should have indentLevel property', () => {
      expect(mockLogger).toHaveProperty('indentLevel');
    });
  });

  describe('Mock reset behavior', () => {
    test('should reset call counts after clearAllMocks', () => {
      mockLogger.info('message 1');
      mockLogger.info('message 2');
      expect(mockLogger.info).toHaveBeenCalledTimes(2);

      jest.clearAllMocks();

      mockLogger.info('message 3');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
    });
  });
});
