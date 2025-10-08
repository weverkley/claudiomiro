const fs = require('fs');
const path = require('path');
const { step2 } = require('../step2');
const state = require('../../config/state');
const { executeClaude } = require('../../services/claude-executor');

// Mock all dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../../config/state');
jest.mock('../../services/claude-executor');

describe('step2', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup state mock
    state.claudiomiroFolder = '/test/.claudiomiro';

    // Setup path.join to work correctly
    path.join.mockImplementation((...args) => args.join('/'));

    // Setup executeClaude mock to resolve
    executeClaude.mockResolvedValue();
  });

  describe('Setup test infrastructure and mocks', () => {
    it('should have state mock properly configured', () => {
      expect(state.claudiomiroFolder).toBe('/test/.claudiomiro');
    });

    it('should have path.join mock properly configured', () => {
      const result = path.join('a', 'b', 'c');
      expect(result).toBe('a/b/c');
      expect(path.join).toHaveBeenCalledWith('a', 'b', 'c');
    });

    it('should have executeClaude mock properly configured', async () => {
      await executeClaude('test');
      expect(executeClaude).toHaveBeenCalledWith('test');
    });
  });

  describe('step2 function execution flow', () => {
    it('should call executeClaude with a prompt', async () => {
      await step2('TASK1');

      expect(executeClaude).toHaveBeenCalledTimes(1);
      expect(executeClaude).toHaveBeenCalledWith(expect.any(String));
    });

    it('should generate correct folder paths for task files', async () => {
      await step2('TASK1');

      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', 'TASK1', 'PROMPT.md');
      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', 'TASK1', 'TODO.md');
    });

    it('should include PROMPT.md path in the prompt text', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('/test/.claudiomiro/TASK1/PROMPT.md');
    });

    it('should include TODO.md path in the prompt text', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('/test/.claudiomiro/TASK1/TODO.md');
    });

    it('should include PHASE: IMPLEMENTATION PLANNING in prompt', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('PHASE: IMPLEMENTATION PLANNING');
    });

    it('should include critical rule about not creating commits', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('DO NOT create any git commits');
    });

    it('should include critical rule about first line being "Fully implemented: NO"', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('First line MUST be: "Fully implemented: NO"');
    });

    it('should include critical rule about creating 5-10 items MAX', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('Create 5-10 actionable items MAX');
    });

    it('should include TODO.md structure template', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('## TODO.md Structure');
      expect(promptArg).toContain('## Implementation Plan');
      expect(promptArg).toContain('## Verification');
    });

    it('should instruct to read PROMPT.md and create TODO.md', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('Read');
      expect(promptArg).toContain('create');
      expect(promptArg).toContain('PROMPT.md');
      expect(promptArg).toContain('TODO.md');
    });

    it('should include task breakdown instructions', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('Your Task');
      expect(promptArg).toContain('Identify the 5-10 main implementation steps');
      expect(promptArg).toContain('Group related work');
    });

    it('should mention context7 usage for understanding codebase', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('context7');
      expect(promptArg).toContain('codebase patterns');
    });

    it('should emphasize quality over quantity', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('Quality over quantity');
    });

    it('should return a promise', () => {
      const result = step2('TASK1');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve when executeClaude resolves', async () => {
      executeClaude.mockResolvedValue('success');

      const result = await step2('TASK1');
      expect(result).toBe('success');
    });
  });

  describe('state transitions and file operations', () => {
    it('should use state.claudiomiroFolder for path generation', async () => {
      state.claudiomiroFolder = '/custom/path';

      await step2('TASK1');

      expect(path.join).toHaveBeenCalledWith('/custom/path', 'TASK1', 'PROMPT.md');
      expect(path.join).toHaveBeenCalledWith('/custom/path', 'TASK1', 'TODO.md');
    });

    it('should handle different task names correctly', async () => {
      await step2('TASK99');

      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', 'TASK99', 'PROMPT.md');
      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', 'TASK99', 'TODO.md');
    });

    it('should handle task names with special characters', async () => {
      await step2('TASK-ABC-123');

      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', 'TASK-ABC-123', 'PROMPT.md');
      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', 'TASK-ABC-123', 'TODO.md');
    });

    it('should call path.join for PROMPT.md and TODO.md paths', async () => {
      await step2('TASK1');

      // path.join is called for PROMPT.md and TODO.md
      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', 'TASK1', 'PROMPT.md');
      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', 'TASK1', 'TODO.md');
    });

    it('should construct proper file paths with path.join', async () => {
      path.join.mockImplementation((...args) => args.join('/'));

      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('/test/.claudiomiro/TASK1/PROMPT.md');
      expect(promptArg).toContain('/test/.claudiomiro/TASK1/TODO.md');
    });
  });

  describe('error handling and edge cases', () => {
    it('should propagate errors from executeClaude', async () => {
      const testError = new Error('Claude execution failed');
      executeClaude.mockRejectedValue(testError);

      await expect(step2('TASK1')).rejects.toThrow('Claude execution failed');
    });

    it('should handle executeClaude rejection with custom error', async () => {
      executeClaude.mockRejectedValue(new Error('Custom error message'));

      await expect(step2('TASK1')).rejects.toThrow('Custom error message');
    });

    it('should handle empty task name', async () => {
      await step2('');

      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', '', 'PROMPT.md');
      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', '', 'TODO.md');
      expect(executeClaude).toHaveBeenCalled();
    });

    it('should handle undefined state.claudiomiroFolder', async () => {
      state.claudiomiroFolder = undefined;

      await step2('TASK1');

      expect(path.join).toHaveBeenCalledWith(undefined, 'TASK1', 'PROMPT.md');
      expect(executeClaude).toHaveBeenCalled();
    });

    it('should not catch executeClaude errors', async () => {
      executeClaude.mockRejectedValue(new Error('Test error'));

      await expect(step2('TASK1')).rejects.toThrow();
    });

    it('should handle long task names', async () => {
      const longTaskName = 'TASK_' + 'A'.repeat(100);
      await step2(longTaskName);

      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', longTaskName, 'PROMPT.md');
      expect(executeClaude).toHaveBeenCalled();
    });

    it('should handle task names with forward slashes', async () => {
      await step2('TASK/SUB/TASK');

      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', 'TASK/SUB/TASK', 'PROMPT.md');
    });

    it('should handle null task name', async () => {
      await step2(null);

      expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', null, 'PROMPT.md');
      expect(executeClaude).toHaveBeenCalled();
    });
  });

  describe('integration and coverage verification', () => {
    it('should complete full execution flow end-to-end', async () => {
      state.claudiomiroFolder = '/project/.claudiomiro';
      path.join.mockImplementation((...args) => args.join('/'));
      executeClaude.mockResolvedValue();

      await step2('TASK5');

      // Verify complete flow
      expect(path.join).toHaveBeenCalled();
      expect(executeClaude).toHaveBeenCalled();

      const promptArg = executeClaude.mock.calls[0][0];
      expect(promptArg).toContain('/project/.claudiomiro/TASK5/PROMPT.md');
      expect(promptArg).toContain('/project/.claudiomiro/TASK5/TODO.md');
      expect(promptArg).toContain('PHASE: IMPLEMENTATION PLANNING');
    });

    it('should verify all critical rules are present in prompt', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      const criticalRules = [
        'DO NOT create any git commits',
        'DO NOT run git add, git commit, or git push',
        'First line MUST be: "Fully implemented: NO"',
        'Create 5-10 actionable items MAX',
        'Group related changes together',
        'Only include what Claude can do'
      ];

      criticalRules.forEach(rule => {
        expect(promptArg).toContain(rule);
      });
    });

    it('should verify TODO.md structure elements are present', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      const structureElements = [
        'Fully implemented: NO',
        '## Implementation Plan',
        '- [ ] **Item 1**',
        'Files:',
        'Tests:',
        '## Verification',
        '- [ ] All tests pass',
        '- [ ] Code builds without errors',
        '- [ ] Feature works as expected'
      ];

      structureElements.forEach(element => {
        expect(promptArg).toContain(element);
      });
    });

    it('should verify task instructions are comprehensive', async () => {
      await step2('TASK1');

      const promptArg = executeClaude.mock.calls[0][0];
      const instructions = [
        'Read',
        'Identify the 5-10 main implementation steps',
        'Group related work',
        'Write',
        'Use context7 if needed'
      ];

      instructions.forEach(instruction => {
        expect(promptArg).toContain(instruction);
      });
    });

    it('should call executeClaude only once per invocation', async () => {
      await step2('TASK1');
      expect(executeClaude).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      await step2('TASK2');
      expect(executeClaude).toHaveBeenCalledTimes(1);
    });

    it('should create unique prompts for different tasks', async () => {
      await step2('TASK1');
      const prompt1 = executeClaude.mock.calls[0][0];

      jest.clearAllMocks();

      await step2('TASK2');
      const prompt2 = executeClaude.mock.calls[0][0];

      expect(prompt1).not.toBe(prompt2);
      expect(prompt1).toContain('TASK1');
      expect(prompt2).toContain('TASK2');
    });
  });
});
