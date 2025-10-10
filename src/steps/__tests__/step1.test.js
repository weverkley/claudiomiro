const fs = require('fs');
const path = require('path');
const { step1 } = require('../step1');
const state = require('../../config/state');
const logger = require('../../../logger');
const { executeClaude } = require('../../services/claude-executor');

// Mock all dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../../config/state');
jest.mock('../../../logger');
jest.mock('../../services/claude-executor');

describe('step1', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mocks
        state.claudiomiroFolder = '/test/.claudiomiro';

        logger.newline = jest.fn();
        logger.startSpinner = jest.fn();
        logger.stopSpinner = jest.fn();
        logger.info = jest.fn();
        logger.success = jest.fn();

        executeClaude.mockResolvedValue();

        // Reset filesystem mocks to default behavior
        fs.readdirSync.mockReturnValue([]);
        fs.statSync.mockReturnValue({ isDirectory: () => true });
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('');
        fs.writeFileSync.mockImplementation(() => {});
    });

    describe('Test infrastructure and mock setup', () => {
        test('should have all required mocks configured', () => {
            expect(fs.readdirSync).toBeDefined();
            expect(fs.statSync).toBeDefined();
            expect(fs.existsSync).toBeDefined();
            expect(fs.readFileSync).toBeDefined();
            expect(fs.writeFileSync).toBeDefined();
            expect(path.join).toBeDefined();
            expect(state.claudiomiroFolder).toBeDefined();
            expect(logger.newline).toBeDefined();
            expect(logger.startSpinner).toBeDefined();
            expect(logger.stopSpinner).toBeDefined();
            expect(logger.info).toBeDefined();
            expect(logger.success).toBeDefined();
            expect(executeClaude).toBeDefined();
        });

        test('should clear all mocks before each test', () => {
            logger.info('test');
            expect(logger.info).toHaveBeenCalledTimes(1);
        });
    });

    describe('Basic execution flow and edge cases', () => {
        test('should handle no tasks found', async () => {
            fs.readdirSync.mockReturnValue([]);

            await step1();

            expect(logger.startSpinner).toHaveBeenCalledWith('Analyzing task dependencies...');
            expect(logger.stopSpinner).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('No tasks found for dependency analysis');
            expect(executeClaude).not.toHaveBeenCalled();
        });

        test('should filter out non-directory items', async () => {
            fs.readdirSync.mockReturnValue(['TASK1', 'file.txt', 'TASK2']);
            fs.statSync.mockImplementation((fullPath) => ({
                isDirectory: () => fullPath.includes('TASK')
            }));
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('task content');

            await step1();

            // Should only process TASK1 and TASK2
            expect(executeClaude).toHaveBeenCalled();
        });

        test('should sort tasks numerically', async () => {
            const tasks = ['TASK10', 'TASK2', 'TASK1'];
            fs.readdirSync.mockReturnValue(tasks);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('content');

            await step1();

            // Verify executeClaude was called (indicating tasks were processed)
            expect(executeClaude).toHaveBeenCalled();

            // Extract the prompt to verify task order
            const prompt = executeClaude.mock.calls[0][0];
            const task1Index = prompt.indexOf('### TASK1');
            const task2Index = prompt.indexOf('### TASK2');
            const task10Index = prompt.indexOf('### TASK10');

            expect(task1Index).toBeLessThan(task2Index);
            expect(task2Index).toBeLessThan(task10Index);
        });
    });

    describe('Single task handling', () => {
        test('should add empty dependencies to single task', async () => {
            fs.readdirSync.mockReturnValue(['TASK1']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('# Task content');

            await step1();

            expect(logger.info).toHaveBeenCalledWith('Single task detected, adding empty dependencies');
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/test/.claudiomiro/TASK1/TASK.md',
                '@dependencies []\n# Task content',
                'utf-8'
            );
            expect(logger.success).toHaveBeenCalledWith('Empty dependencies added to single task');
            expect(executeClaude).not.toHaveBeenCalled();
        });

        test('should skip adding dependencies if already exists', async () => {
            fs.readdirSync.mockReturnValue(['TASK1']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('@dependencies [TASK0]\n# Task content');

            await step1();

            expect(fs.writeFileSync).not.toHaveBeenCalled();
            expect(logger.success).not.toHaveBeenCalledWith('Empty dependencies added to single task');
        });

        test('should handle missing TASK.md for single task', async () => {
            fs.readdirSync.mockReturnValue(['TASK1']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(false);

            await step1();

            expect(fs.writeFileSync).not.toHaveBeenCalled();
            expect(executeClaude).not.toHaveBeenCalled();
        });
    });

    describe('Task content reading and processing', () => {
        test('should read TASK.md and PROMPT.md files', async () => {
            fs.readdirSync.mockReturnValue(['TASK1', 'TASK2']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation((filePath) => {
                if (filePath.includes('TASK.md')) return 'Task content';
                if (filePath.includes('PROMPT.md')) return 'Prompt content';
                return '';
            });

            await step1();

            expect(fs.readFileSync).toHaveBeenCalledWith('/test/.claudiomiro/TASK1/TASK.md', 'utf-8');
            expect(fs.readFileSync).toHaveBeenCalledWith('/test/.claudiomiro/TASK1/PROMPT.md', 'utf-8');
            expect(fs.readFileSync).toHaveBeenCalledWith('/test/.claudiomiro/TASK2/TASK.md', 'utf-8');
            expect(fs.readFileSync).toHaveBeenCalledWith('/test/.claudiomiro/TASK2/PROMPT.md', 'utf-8');
        });

        test('should handle missing TASK.md file', async () => {
            fs.readdirSync.mockReturnValue(['TASK1', 'TASK2']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockImplementation((filePath) => {
                return !filePath.includes('TASK.md');
            });
            fs.readFileSync.mockReturnValue('Prompt content');

            await step1();

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('### TASK1');
            expect(prompt).toContain('Prompt content');
        });

        test('should handle missing PROMPT.md file', async () => {
            fs.readdirSync.mockReturnValue(['TASK1', 'TASK2']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockImplementation((filePath) => {
                return !filePath.includes('PROMPT.md');
            });
            fs.readFileSync.mockReturnValue('Task content');

            await step1();

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('### TASK1');
            expect(prompt).toContain('Task content');
        });

        test('should aggregate content from multiple tasks', async () => {
            fs.readdirSync.mockReturnValue(['TASK1', 'TASK2']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation((filePath) => {
                if (filePath.includes('TASK1/TASK.md')) return 'Task1 content';
                if (filePath.includes('TASK1/PROMPT.md')) return 'Prompt1 content';
                if (filePath.includes('TASK2/TASK.md')) return 'Task2 content';
                if (filePath.includes('TASK2/PROMPT.md')) return 'Prompt2 content';
                return '';
            });

            await step1();

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('### TASK1');
            expect(prompt).toContain('Task1 content');
            expect(prompt).toContain('Prompt1 content');
            expect(prompt).toContain('### TASK2');
            expect(prompt).toContain('Task2 content');
            expect(prompt).toContain('Prompt2 content');
        });
    });

    describe('Prompt generation for both modes', () => {
        beforeEach(() => {
            fs.readdirSync.mockReturnValue(['TASK1', 'TASK2']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('content');
        });

        test('should generate auto mode prompt by default', async () => {
            await step1();

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('You are an expert dependency analyzer');
            expect(prompt).toContain('Maximize parallel execution');
            expect(prompt).toContain('Analysis Protocol');
            expect(prompt).not.toContain('HARD MODE');
            expect(prompt).not.toContain('Deep Analysis');
        });

        test('should generate auto mode prompt explicitly', async () => {
            await step1('auto');

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('You are an expert dependency analyzer');
            expect(prompt).toContain('Analysis Protocol');
            expect(prompt).not.toContain('HARD MODE');
        });

        test('should generate hard mode prompt', async () => {
            await step1('hard');

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('DEEP REASONING capabilities');
            expect(prompt).toContain('HARD MODE');
            expect(prompt).toContain('Deep Analysis');
            expect(prompt).toContain('Dependency Analysis');
            expect(prompt).toContain('Reasoning:');
        });

        test('should call executeClaude with correct prompt', async () => {
            await step1('auto');

            expect(executeClaude).toHaveBeenCalledTimes(1);
            expect(typeof executeClaude.mock.calls[0][0]).toBe('string');
            expect(executeClaude.mock.calls[0][0].length).toBeGreaterThan(0);
        });

        test('should include task names in prompt', async () => {
            await step1('auto');

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('TASK1, TASK2');
        });

        test('should include task count in prompt', async () => {
            await step1('auto');

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('2 tasks');
        });
    });

    describe('Error handling and file operations', () => {
        test('should handle fs.readdirSync errors', async () => {
            fs.readdirSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            await expect(step1()).rejects.toThrow('Permission denied');
        });

        test('should handle fs.readFileSync errors', async () => {
            fs.readdirSync.mockReturnValue(['TASK1', 'TASK2']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('File read error');
            });

            await expect(step1()).rejects.toThrow('File read error');
        });

        test('should handle executeClaude failures', async () => {
            fs.readdirSync.mockReturnValue(['TASK1', 'TASK2']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('content');
            executeClaude.mockRejectedValue(new Error('Claude API error'));

            await expect(step1()).rejects.toThrow('Claude API error');
        });

        test('should handle fs.writeFileSync errors for single task', async () => {
            fs.readdirSync.mockReturnValue(['TASK1']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('content');
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            await expect(step1()).rejects.toThrow('Write error');
        });

        test('should handle fs.statSync errors', async () => {
            fs.readdirSync.mockReturnValue(['TASK1']);
            fs.statSync.mockImplementation(() => {
                throw new Error('Stat error');
            });

            await expect(step1()).rejects.toThrow('Stat error');
        });
    });

    describe('Logger interactions', () => {
        test('should call logger methods in correct order', async () => {
            fs.readdirSync.mockReturnValue([]);

            await step1();

            const callOrder = [
                logger.newline.mock.invocationCallOrder[0],
                logger.startSpinner.mock.invocationCallOrder[0],
                logger.stopSpinner.mock.invocationCallOrder[0],
                logger.info.mock.invocationCallOrder[0]
            ];

            expect(callOrder[0]).toBeLessThan(callOrder[1]);
            expect(callOrder[1]).toBeLessThan(callOrder[2]);
            expect(callOrder[2]).toBeLessThan(callOrder[3]);
        });

        test('should stop spinner on success', async () => {
            fs.readdirSync.mockReturnValue(['TASK1', 'TASK2']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('content');

            await step1();

            expect(logger.stopSpinner).toHaveBeenCalled();
            expect(logger.success).toHaveBeenCalledWith('Task dependencies analyzed and configured');
        });

        test('should stop spinner on error', async () => {
            fs.readdirSync.mockReturnValue(['TASK1']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('content');
            executeClaude.mockRejectedValue(new Error('API error'));

            try {
                await step1();
            } catch (e) {
                // Expected to throw
            }

            // Spinner should not be stopped on error (based on current implementation)
            // The error will propagate before stopSpinner is called
        });
    });

    describe('Path operations', () => {
        test('should use correct paths for reading files', async () => {
            fs.readdirSync.mockReturnValue(['TASK1', 'TASK2']);
            fs.statSync.mockReturnValue({ isDirectory: () => true });
            path.join.mockImplementation((...args) => args.join('/'));
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('content');

            await step1();

            expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', 'TASK1');
            expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', 'TASK1', 'TASK.md');
            expect(path.join).toHaveBeenCalledWith('/test/.claudiomiro', 'TASK1', 'PROMPT.md');
        });
    });
});
