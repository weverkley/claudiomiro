const fs = require('fs');
const path = require('path');
const { step3 } = require('../step3');
const { executeClaude } = require('../../services/claude-executor');
const state = require('../../config/state');

// Mock all dependencies
jest.mock('fs');
jest.mock('../../services/claude-executor');
jest.mock('../../config/state');

describe('step3', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup state mock
    state.claudiomiroFolder = '/test/.claudiomiro';

    // Setup fs mocks
    fs.existsSync = jest.fn().mockReturnValue(false);
    fs.rmSync = jest.fn();

    // Setup executeClaude mock
    executeClaude.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Setup test infrastructure and mocks', () => {
    it('should have fs mocks properly configured', () => {
      fs.existsSync('test.txt');
      expect(fs.existsSync).toHaveBeenCalledWith('test.txt');

      fs.rmSync('test.txt');
      expect(fs.rmSync).toHaveBeenCalledWith('test.txt');
    });

    it('should have state mock properly configured', () => {
      expect(state.claudiomiroFolder).toBe('/test/.claudiomiro');
    });

    it('should have executeClaude mock returning resolved promise', async () => {
      const result = executeClaude('test');
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('Basic step3 execution flow and prompt generation', () => {
    it('should call executeClaude with a prompt and task name', async () => {
      await step3('TASK1');

      expect(executeClaude).toHaveBeenCalledTimes(1);
      expect(executeClaude).toHaveBeenCalledWith(expect.any(String), 'TASK1');
    });

    it('should include TODO.md path in prompt', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('/test/.claudiomiro/TASK1/TODO.md');
    });

    it('should include critical rules about git commits in prompt', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('Never run git add/commit/push');
      expect(promptArg).toContain('RULES');
    });

    it('should include PHASE identifier in prompt', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('PHASE: EXECUTION LOOP (DEPENDENCY + SAFETY)');
    });

    it('should include "Fully implemented" requirement in prompt', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('Fully implemented: YES');
      expect(promptArg).toContain('"Fully implemented: YES" or "NO"');
    });

    it('should return the promise from executeClaude', async () => {
      const result = step3('TASK1');

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('CODE_REVIEW.md cleanup logic', () => {
    it('should check if CODE_REVIEW.md exists', async () => {
      await step3('TASK1');

      expect(fs.existsSync).toHaveBeenCalledWith('/test/.claudiomiro/TASK1/CODE_REVIEW.md');
    });

    it('should delete CODE_REVIEW.md when it exists', async () => {
      fs.existsSync.mockReturnValue(true);

      await step3('TASK1');

      expect(fs.rmSync).toHaveBeenCalledWith('/test/.claudiomiro/TASK1/CODE_REVIEW.md');
    });

    it('should not delete CODE_REVIEW.md when it does not exist', async () => {
      fs.existsSync.mockReturnValue(false);

      await step3('TASK1');

      expect(fs.rmSync).not.toHaveBeenCalled();
    });

    it('should call rmSync with correct path for different task', async () => {
      fs.existsSync.mockReturnValue(true);

      await step3('TASK10');

      expect(fs.existsSync).toHaveBeenCalledWith('/test/.claudiomiro/TASK10/CODE_REVIEW.md');
      expect(fs.rmSync).toHaveBeenCalledWith('/test/.claudiomiro/TASK10/CODE_REVIEW.md');
    });

    it('should throw error when fs.existsSync fails', () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      expect(() => step3('TASK1')).toThrow('File system error');
      expect(executeClaude).not.toHaveBeenCalled();
    });
  });

  describe('Folder path resolution and state integration', () => {
    it('should construct paths using state.claudiomiroFolder', async () => {
      state.claudiomiroFolder = '/custom/.claudiomiro';

      await step3('TASK1');

      expect(fs.existsSync).toHaveBeenCalledWith('/custom/.claudiomiro/TASK1/CODE_REVIEW.md');
    });

    it('should use task parameter in path construction', async () => {
      await step3('TASK5');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('/test/.claudiomiro/TASK5/TODO.md');
    });

    it('should construct correct paths for different task names', async () => {
      await step3('TASK20');

      expect(fs.existsSync).toHaveBeenCalledWith('/test/.claudiomiro/TASK20/CODE_REVIEW.md');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('/test/.claudiomiro/TASK20/TODO.md');
    });

    it('should handle folder helper for multiple files', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      // The folder helper is used for TODO.md in multiple places
      const todoMdCount = (promptArg.match(/\/test\/\.claudiomiro\/TASK1\/TODO\.md/g) || []).length;
      expect(todoMdCount).toBeGreaterThan(1);
    });
  });

  describe('Error handling and promise rejection scenarios', () => {
    it('should propagate executeClaude errors', async () => {
      const testError = new Error('Claude execution failed');
      executeClaude.mockRejectedValue(testError);

      await expect(step3('TASK1')).rejects.toThrow('Claude execution failed');
    });

    it('should throw error when fs.rmSync fails', () => {
      fs.existsSync.mockReturnValue(true);
      fs.rmSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => step3('TASK1')).toThrow('Permission denied');
      expect(executeClaude).not.toHaveBeenCalled();
    });

    it('should handle executeClaude rejection with different error', async () => {
      executeClaude.mockRejectedValue(new Error('Network timeout'));

      await expect(step3('TASK1')).rejects.toThrow('Network timeout');
    });

    it('should maintain promise chain when executeClaude resolves', async () => {
      executeClaude.mockResolvedValue('success');

      const result = await step3('TASK1');

      expect(result).toBe('success');
    });

    it('should throw error when state.claudiomiroFolder is undefined', () => {
      state.claudiomiroFolder = undefined;

      expect(() => step3('TASK1')).toThrow('path');
    });
  });

  describe('Prompt content completeness', () => {
    it('should include LOOP section in prompt', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('LOOP:');
      expect(promptArg).toContain('Read');
      expect(promptArg).toContain('BLOCKED');
    });

    it('should include TESTS section in prompt', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('TESTS:');
      expect(promptArg).toContain('Run only affected tests');
      expect(promptArg).toContain('Never run full-project checks');
    });

    it('should include BLOCKED policy in prompt', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('Only mark BLOCKED if external/manual dependency');
    });

    it('should include FAILURES section in prompt', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('FAILURES:');
      expect(promptArg).toContain('FAILED: test');
    });

    it('should include exit condition in prompt', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('Stop only when all items are [X] or BLOCKED/FAILED');
    });

    it('should include STOP-DIFF section in prompt', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('STOP-DIFF:');
      expect(promptArg).toContain('Do not rename TODO items');
    });

    it('should include STATE section in prompt', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('STATE:');
      expect(promptArg).toContain('Persist updates');
    });

    it('should include MCP section in prompt', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('MCP:');
      expect(promptArg).toContain('Use MCPs only for analysis/testing');
    });

    it('should include objective about implementing actionable items', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('OBJECTIVE');
      expect(promptArg).toContain('Execute all actionable items');
      expect(promptArg).toContain('BLOCKED/FAILED');
    });

    it('should include critical git safety rules', async () => {
      await step3('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('RULES');
      expect(promptArg).toContain('Never run git add/commit/push');
    });
  });
});
