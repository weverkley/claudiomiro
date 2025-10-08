const path = require('path');
const { step4 } = require('../step4');
const state = require('../../config/state');
const { executeClaude } = require('../../services/claude-executor');

// Mock all dependencies
jest.mock('fs');
jest.mock('../../config/state');
jest.mock('../../services/claude-executor');

describe('step4', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    state.claudiomiroFolder = '/test/.claudiomiro';
    executeClaude.mockResolvedValue();
  });

  describe('Create step4.test.js with test setup and basic structure', () => {
    it('should call executeClaude with a prompt', async () => {
      await step4('TASK1');

      expect(executeClaude).toHaveBeenCalledTimes(1);
      expect(executeClaude).toHaveBeenCalledWith(expect.any(String));
    });

    it('should return a promise that resolves', async () => {
      const result = step4('TASK1');

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    it('should call executeClaude with task parameter', async () => {
      await step4('TASK5');

      expect(executeClaude).toHaveBeenCalled();
      const prompt = executeClaude.mock.calls[0][0];
      expect(typeof prompt).toBe('string');
    });
  });

  describe('Test successful execution flow (all tests pass)', () => {
    it('should include GITHUB_PR.md creation instructions in prompt', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('GITHUB_PR.md');
      expect(prompt).toContain('Create');
    });

    it('should use correct folder path for GITHUB_PR.md', async () => {
      state.claudiomiroFolder = '/custom/.claudiomiro';
      await step4('TASK10');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('/custom/.claudiomiro/TASK10/GITHUB_PR.md');
    });

    it('should reference state.claudiomiroFolder in folder construction', async () => {
      state.claudiomiroFolder = '/project/.claudiomiro';
      await step4('TASK3');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('/project/.claudiomiro/TASK3');
    });

    it('should include explanation requirement for GITHUB_PR.md', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('explaining in one paragraph what was done');
    });
  });

  describe('Test failure handling and TODO.md refactoring', () => {
    it('should include instructions to delete CODE_REVIEW.md on failure', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('Delete');
      expect(prompt).toContain('CODE_REVIEW.md');
    });

    it('should include instructions to refactor TODO.md on failure', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('Refactor');
      expect(prompt).toContain('TODO.md');
    });

    it('should include instructions to update TODO.md first line to "Fully implemented: NO"', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('Fully implemented: NO');
      expect(prompt).toContain('first line');
    });

    it('should include correct path for CODE_REVIEW.md deletion', async () => {
      state.claudiomiroFolder = '/test/.claudiomiro';
      await step4('TASK2');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('/test/.claudiomiro/TASK2/CODE_REVIEW.md');
    });

    it('should include correct path for TODO.md refactoring', async () => {
      state.claudiomiroFolder = '/test/.claudiomiro';
      await step4('TASK7');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('/test/.claudiomiro/TASK7/TODO.md');
    });
  });

  describe('Test folder path construction and file references', () => {
    it('should construct folder path using task parameter', async () => {
      state.claudiomiroFolder = '/base';
      await step4('TASK99');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('/base/TASK99');
    });

    it('should use folder() helper for all file paths', async () => {
      state.claudiomiroFolder = '/project/.claudiomiro';
      await step4('TASK5');

      const prompt = executeClaude.mock.calls[0][0];
      // All file references should use the folder pattern
      expect(prompt).toContain('/project/.claudiomiro/TASK5/GITHUB_PR.md');
      expect(prompt).toContain('/project/.claudiomiro/TASK5/CODE_REVIEW.md');
      expect(prompt).toContain('/project/.claudiomiro/TASK5/TODO.md');
    });

    it('should handle different task names correctly', async () => {
      const taskNames = ['TASK1', 'TASK10', 'TASK100'];

      for (const taskName of taskNames) {
        jest.clearAllMocks();
        await step4(taskName);

        const prompt = executeClaude.mock.calls[0][0];
        expect(prompt).toContain(`/${taskName}/GITHUB_PR.md`);
        expect(prompt).toContain(`/${taskName}/CODE_REVIEW.md`);
        expect(prompt).toContain(`/${taskName}/TODO.md`);
      }
    });

    it('should join paths using path.join logic', async () => {
      state.claudiomiroFolder = '/test/.claudiomiro';
      await step4('TASK8');

      const prompt = executeClaude.mock.calls[0][0];
      // Path should be properly joined without double slashes
      expect(prompt).not.toContain('//');
      expect(prompt).toContain('/test/.claudiomiro/TASK8');
    });
  });

  describe('Test task-specific testing instructions in prompt', () => {
    it('should warn against running full test suite', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('DO NOT run full test suite');
      expect(prompt).toContain('DO NOT run integration tests');
      expect(prompt).toContain('DO NOT run e2e tests');
    });

    it('should include task-specific test examples', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('npm test');
      expect(prompt).toContain('pytest');
      expect(prompt).toContain('go test');
      expect(prompt).toContain('cargo test');
    });

    it('should include critical rules about no commits', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('DO NOT create any git commits');
      expect(prompt).toContain('DO NOT run git add, git commit, or git push commands');
    });

    it('should explain why full tests are not run', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('parallel');
      expect(prompt).toContain('step5');
    });

    it('should instruct to run only task-related tests', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('Run ONLY the tests related to THIS task');
      expect(prompt).toContain('Unit tests for the modules created/modified');
    });

    it('should include typecheck and lint instructions', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('Typecheck');
      expect(prompt).toContain('lint');
    });

    it('should reference TODO.md for files to test', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain("TODO.md");
    });

    it('should include phase label in prompt', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('PHASE: QUALITY GATE & PR PACKAGING');
    });
  });

  describe('Edge cases and variations', () => {
    it('should handle empty task name', async () => {
      await step4('');

      expect(executeClaude).toHaveBeenCalled();
      const prompt = executeClaude.mock.calls[0][0];
      expect(typeof prompt).toBe('string');
    });

    it('should handle special characters in claudiomiroFolder path', async () => {
      state.claudiomiroFolder = '/path with spaces/.claudiomiro';
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('/path with spaces/.claudiomiro/TASK1');
    });

    it('should handle executeClaude rejection', async () => {
      const error = new Error('Claude failed');
      executeClaude.mockRejectedValue(error);

      await expect(step4('TASK1')).rejects.toThrow('Claude failed');
    });

    it('should maintain prompt structure consistency', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      // Check that prompt has standard structure
      expect(prompt).toContain('CRITICAL RULES:');
      expect(prompt).toContain('GATES');
      expect(prompt).toContain('If all task-specific tests pass:');
      expect(prompt).toContain('If any fails:');
    });

    it('should handle multiple sequential calls', async () => {
      await step4('TASK1');
      await step4('TASK2');
      await step4('TASK3');

      expect(executeClaude).toHaveBeenCalledTimes(3);

      const prompts = executeClaude.mock.calls.map(call => call[0]);
      expect(prompts[0]).toContain('TASK1');
      expect(prompts[1]).toContain('TASK2');
      expect(prompts[2]).toContain('TASK3');
    });
  });

  describe('Prompt content verification', () => {
    it('should include all critical sections in prompt', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      const requiredSections = [
        'PHASE:',
        'CRITICAL RULES:',
        'GATES',
        'If all task-specific tests pass:',
        'If any fails:',
        'How to Run Task-Specific Tests'
      ];

      for (const section of requiredSections) {
        expect(prompt).toContain(section);
      }
    });

    it('should not include unrelated task names in prompt', async () => {
      await step4('TASK5');

      const prompt = executeClaude.mock.calls[0][0];
      expect(prompt).toContain('TASK5');
      expect(prompt).not.toContain('TASK1/');
      expect(prompt).not.toContain('TASK2/');
    });

    it('should have proper prompt formatting', async () => {
      await step4('TASK1');

      const prompt = executeClaude.mock.calls[0][0];
      // Should have newlines and structure
      expect(prompt.split('\n').length).toBeGreaterThan(10);
      expect(prompt).toContain('---');
    });
  });
});
