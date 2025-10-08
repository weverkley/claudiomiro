const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { executeClaude } = require('../claude-executor');

// Mock all dependencies
jest.mock('fs');
jest.mock('child_process');
jest.mock('../../../logger');
jest.mock('../../config/state');
jest.mock('../claude-logger');

const logger = require('../../../logger');
const state = require('../../config/state');
const { processClaudeMessage } = require('../claude-logger');
const { MockChildProcess } = require('../../__tests__/mocks/child_process');

describe('claude-executor', () => {
  let mockChildProcess;
  let mockWriteStream;
  let writeStreamWriteSpy;
  let writeStreamEndSpy;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup state mock
    state.folder = '/test/folder';
    state.claudiomiroFolder = '/test/.claudiomiro';

    // Setup fs mocks
    fs.writeFileSync = jest.fn();
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.unlinkSync = jest.fn();

    // Setup write stream mock
    writeStreamWriteSpy = jest.fn();
    writeStreamEndSpy = jest.fn();
    mockWriteStream = {
      write: writeStreamWriteSpy,
      end: writeStreamEndSpy
    };
    fs.createWriteStream = jest.fn().mockReturnValue(mockWriteStream);

    // Setup logger mocks
    logger.stopSpinner = jest.fn();
    logger.command = jest.fn();
    logger.separator = jest.fn();
    logger.newline = jest.fn();
    logger.success = jest.fn();
    logger.error = jest.fn();

    // Setup child_process mock
    mockChildProcess = new MockChildProcess();
    spawn.mockReturnValue(mockChildProcess);

    // Setup processClaudeMessage mock
    processClaudeMessage.mockImplementation((line) => {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'text' && parsed.text) {
          return parsed.text;
        }
      } catch (e) {
        // Not JSON, ignore
      }
      return null;
    });

    // Mock console.log to prevent test output pollution
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('Setup test infrastructure and mocks', () => {
    it('should create child_process mock with spawn returning EventEmitter', () => {
      const child = spawn('test', ['arg']);
      expect(child).toBeInstanceOf(MockChildProcess);
      expect(child).toBeInstanceOf(require('events').EventEmitter);
      expect(child.stdout).toBeInstanceOf(require('events').EventEmitter);
      expect(child.stderr).toBeInstanceOf(require('events').EventEmitter);
    });

    it('should have fs mocks properly configured', () => {
      fs.writeFileSync('test.txt', 'content');
      expect(fs.writeFileSync).toHaveBeenCalledWith('test.txt', 'content');

      fs.existsSync('test.txt');
      expect(fs.existsSync).toHaveBeenCalledWith('test.txt');

      fs.unlinkSync('test.txt');
      expect(fs.unlinkSync).toHaveBeenCalledWith('test.txt');

      const stream = fs.createWriteStream('log.txt');
      expect(stream).toBe(mockWriteStream);
    });

    it('should have logger mocks properly configured', () => {
      logger.stopSpinner();
      logger.command('test');
      logger.separator();
      logger.success('test');
      logger.error('test');

      expect(logger.stopSpinner).toHaveBeenCalled();
      expect(logger.command).toHaveBeenCalledWith('test');
      expect(logger.separator).toHaveBeenCalled();
      expect(logger.success).toHaveBeenCalledWith('test');
      expect(logger.error).toHaveBeenCalledWith('test');
    });
  });

  describe('executeClaude success flow', () => {
    it('should resolve promise on successful execution (code 0)', async () => {
      const promise = executeClaude('test prompt');

      // Simulate successful execution
      setTimeout(() => {
        mockChildProcess.emit('close', 0);
      }, 10);

      await expect(promise).resolves.toBeUndefined();
      expect(logger.success).toHaveBeenCalledWith('Claude execution completed');
    });

    it('should spawn with correct arguments', async () => {
      const promise = executeClaude('test prompt');

      expect(spawn).toHaveBeenCalledWith(
        'sh',
        ['-c', expect.stringContaining('claude --dangerously-skip-permissions')],
        expect.objectContaining({
          cwd: '/test/folder',
          stdio: ['ignore', 'pipe', 'pipe']
        })
      );

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should create temporary file with prompt text', async () => {
      const promise = executeClaude('test prompt content');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/claudiomiro-prompt-\d+\.txt$/),
        'test prompt content',
        'utf-8'
      );

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should clean up temporary file after execution', async () => {
      const promise = executeClaude('test prompt');

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringMatching(/claudiomiro-prompt-\d+\.txt$/)
      );
    });

    it('should call logger methods in correct sequence', async () => {
      const promise = executeClaude('test prompt');

      expect(logger.stopSpinner).toHaveBeenCalled();
      expect(logger.command).toHaveBeenCalledWith(
        expect.stringContaining('claude --dangerously-skip-permissions')
      );
      expect(logger.separator).toHaveBeenCalled();

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;

      expect(logger.success).toHaveBeenCalledWith('Claude execution completed');
    });

    it('should create log file with correct path', async () => {
      const promise = executeClaude('test prompt');

      expect(fs.createWriteStream).toHaveBeenCalledWith(
        '/test/.claudiomiro/log.txt',
        { flags: 'a' }
      );

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should write log separator and timestamp to log file', async () => {
      const promise = executeClaude('test prompt');

      expect(writeStreamWriteSpy).toHaveBeenCalledWith(expect.stringContaining('='.repeat(80)));
      expect(writeStreamWriteSpy).toHaveBeenCalledWith(expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T.+\] Claude execution started/));

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });
  });

  describe('stdout streaming and message processing', () => {
    it('should process complete JSON lines from stdout', async () => {
      const promise = executeClaude('test prompt');

      const jsonLine1 = JSON.stringify({ type: 'text', text: 'Hello' });
      const jsonLine2 = JSON.stringify({ type: 'text', text: 'World' });

      mockChildProcess.stdout.emit('data', Buffer.from(jsonLine1 + '\n' + jsonLine2 + '\n'));

      expect(processClaudeMessage).toHaveBeenCalledWith(jsonLine1);
      expect(processClaudeMessage).toHaveBeenCalledWith(jsonLine2);

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should handle partial JSON lines with buffering', async () => {
      const promise = executeClaude('test prompt');

      const jsonLine = JSON.stringify({ type: 'text', text: 'Complete message' });
      const part1 = jsonLine.substring(0, 20);
      const part2 = jsonLine.substring(20);

      // Send partial data
      mockChildProcess.stdout.emit('data', Buffer.from(part1));
      expect(processClaudeMessage).not.toHaveBeenCalled();

      // Send rest with newline
      mockChildProcess.stdout.emit('data', Buffer.from(part2 + '\n'));
      expect(processClaudeMessage).toHaveBeenCalledWith(jsonLine);

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should call processClaudeMessage for each complete line', async () => {
      const promise = executeClaude('test prompt');

      mockChildProcess.stdout.emit('data', Buffer.from('line1\nline2\nline3\n'));

      expect(processClaudeMessage).toHaveBeenCalledTimes(3);
      expect(processClaudeMessage).toHaveBeenNthCalledWith(1, 'line1');
      expect(processClaudeMessage).toHaveBeenNthCalledWith(2, 'line2');
      expect(processClaudeMessage).toHaveBeenNthCalledWith(3, 'line3');

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should write stdout data to log file', async () => {
      const promise = executeClaude('test prompt');

      const testData = 'test output data\n';
      mockChildProcess.stdout.emit('data', Buffer.from(testData));

      expect(writeStreamWriteSpy).toHaveBeenCalledWith(testData);

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should output Claude messages to console', async () => {
      const promise = executeClaude('test prompt');

      const jsonLine = JSON.stringify({ type: 'text', text: 'Test message' });
      mockChildProcess.stdout.emit('data', Buffer.from(jsonLine + '\n'));

      expect(console.log).toHaveBeenCalledWith('💬 Claude:');
      expect(console.log).toHaveBeenCalledWith('Test message');

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should write completion message to log file', async () => {
      const promise = executeClaude('test prompt');

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;

      expect(writeStreamWriteSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T.+\] Claude execution completed with code 0/)
      );
      expect(writeStreamEndSpy).toHaveBeenCalled();
    });
  });

  describe('error handling scenarios', () => {
    it('should reject promise on non-zero exit code', async () => {
      const promise = executeClaude('test prompt');

      setTimeout(() => mockChildProcess.emit('close', 1), 10);

      await expect(promise).rejects.toThrow('Claude exited with code 1');
      expect(logger.error).toHaveBeenCalledWith('Claude exited with code 1');
    });

    it('should clean up temp file on non-zero exit code', async () => {
      const promise = executeClaude('test prompt');

      setTimeout(() => mockChildProcess.emit('close', 1), 10);

      await expect(promise).rejects.toThrow();
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should reject promise on spawn error', async () => {
      const promise = executeClaude('test prompt');

      const testError = new Error('Spawn failed');
      setTimeout(() => mockChildProcess.emit('error', testError), 10);

      await expect(promise).rejects.toThrow('Spawn failed');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to execute Claude'));
    });

    it('should clean up temp file on spawn error', async () => {
      const promise = executeClaude('test prompt');

      setTimeout(() => mockChildProcess.emit('error', new Error('Test error')), 10);

      await expect(promise).rejects.toThrow();
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should write error to log file on spawn error', async () => {
      const promise = executeClaude('test prompt');

      setTimeout(() => mockChildProcess.emit('error', new Error('Test error message')), 10);

      await expect(promise).rejects.toThrow();
      expect(writeStreamWriteSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR: Test error message'));
      expect(writeStreamEndSpy).toHaveBeenCalled();
    });

    it('should handle temp file cleanup failure gracefully', async () => {
      fs.unlinkSync.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      const promise = executeClaude('test prompt');

      setTimeout(() => mockChildProcess.emit('close', 0), 10);

      await expect(promise).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to cleanup temp file'));
    });

    it('should handle missing temp file during cleanup', async () => {
      fs.existsSync.mockReturnValue(false);

      const promise = executeClaude('test prompt');

      setTimeout(() => mockChildProcess.emit('close', 0), 10);

      await expect(promise).resolves.toBeUndefined();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('edge cases and integration', () => {
    it('should handle stderr data and write to log file', async () => {
      const promise = executeClaude('test prompt');

      const stderrData = 'Error output\n';
      mockChildProcess.stderr.emit('data', Buffer.from(stderrData));

      expect(writeStreamWriteSpy).toHaveBeenCalledWith('[STDERR] ' + stderrData);

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should maintain buffer with incomplete lines', async () => {
      const promise = executeClaude('test prompt');

      // Send data without newline
      mockChildProcess.stdout.emit('data', Buffer.from('incomplete'));
      expect(processClaudeMessage).not.toHaveBeenCalled();

      // Send more data, still no newline
      mockChildProcess.stdout.emit('data', Buffer.from(' line'));
      expect(processClaudeMessage).not.toHaveBeenCalled();

      // Complete the line
      mockChildProcess.stdout.emit('data', Buffer.from(' complete\n'));
      expect(processClaudeMessage).toHaveBeenCalledWith('incomplete line complete');

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should handle long text wrapping in console output', async () => {
      // Mock a narrow terminal
      const originalColumns = process.stdout.columns;
      process.stdout.columns = 20;

      const promise = executeClaude('test prompt');

      const longText = 'a'.repeat(50);
      const jsonLine = JSON.stringify({ type: 'text', text: longText });
      mockChildProcess.stdout.emit('data', Buffer.from(jsonLine + '\n'));

      // Should wrap into multiple console.log calls
      expect(console.log).toHaveBeenCalledWith('💬 Claude:');
      // Line wrapping should occur
      const logCalls = console.log.mock.calls.filter(call => call[0] !== '💬 Claude:');
      expect(logCalls.length).toBeGreaterThan(1);

      process.stdout.columns = originalColumns;

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should handle multiple stdout chunks in sequence', async () => {
      const promise = executeClaude('test prompt');

      mockChildProcess.stdout.emit('data', Buffer.from('line1\n'));
      mockChildProcess.stdout.emit('data', Buffer.from('line2\n'));
      mockChildProcess.stdout.emit('data', Buffer.from('line3\n'));

      expect(processClaudeMessage).toHaveBeenCalledTimes(3);

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should handle empty lines in stdout', async () => {
      const promise = executeClaude('test prompt');

      mockChildProcess.stdout.emit('data', Buffer.from('line1\n\nline2\n'));

      expect(processClaudeMessage).toHaveBeenCalledWith('line1');
      expect(processClaudeMessage).toHaveBeenCalledWith('');
      expect(processClaudeMessage).toHaveBeenCalledWith('line2');

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should handle non-JSON lines gracefully', async () => {
      processClaudeMessage.mockReturnValue(null);

      const promise = executeClaude('test prompt');

      mockChildProcess.stdout.emit('data', Buffer.from('not json\n'));

      // Should not crash, processClaudeMessage returns null
      expect(processClaudeMessage).toHaveBeenCalledWith('not json');
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('not json'));

      setTimeout(() => mockChildProcess.emit('close', 0), 10);
      await promise;
    });

    it('should complete full execution flow end-to-end', async () => {
      const promise = executeClaude('integration test prompt');

      // Simulate realistic execution
      mockChildProcess.stdout.emit('data', Buffer.from(JSON.stringify({ type: 'text', text: 'Starting...' }) + '\n'));
      mockChildProcess.stderr.emit('data', Buffer.from('debug info\n'));
      mockChildProcess.stdout.emit('data', Buffer.from(JSON.stringify({ type: 'text', text: 'Done!' }) + '\n'));

      setTimeout(() => mockChildProcess.emit('close', 0), 10);

      await expect(promise).resolves.toBeUndefined();

      // Verify complete flow
      expect(fs.writeFileSync).toHaveBeenCalled(); // Temp file created
      expect(spawn).toHaveBeenCalled(); // Process spawned
      expect(processClaudeMessage).toHaveBeenCalled(); // Messages processed
      expect(writeStreamWriteSpy).toHaveBeenCalled(); // Log written
      expect(fs.unlinkSync).toHaveBeenCalled(); // Temp file cleaned
      expect(logger.success).toHaveBeenCalled(); // Success logged
    });
  });
});
