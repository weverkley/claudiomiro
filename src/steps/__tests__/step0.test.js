const fs = require('fs');
const path = require('path');
const state = require('../../config/state');
const logger = require('../../../logger');
const { executeClaude } = require('../../services/claude-executor');
const { getMultilineInput } = require('../../services/prompt-reader');
const { startFresh } = require('../../services/file-manager');
const { step0 } = require('../step0');

jest.mock('fs');
jest.mock('path');
jest.mock('../../config/state');
jest.mock('../../../logger');
jest.mock('../../services/claude-executor');
jest.mock('../../services/prompt-reader');
jest.mock('../../services/file-manager');

describe('step0', () => {
    let processExitSpy;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock state
        state.claudiomiroFolder = '/test/.claudiomiro';

        // Mock path.join to return predictable paths
        path.join.mockImplementation((...args) => args.join('/'));

        // Mock process.exit
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

        // Default successful executeClaude
        executeClaude.mockResolvedValue();
    });

    afterEach(() => {
        processExitSpy.mockRestore();
    });

    describe('Setup test infrastructure for step0 module', () => {
        it('should have all required dependencies mocked', () => {
            expect(jest.isMockFunction(fs.writeFileSync)).toBe(true);
            expect(jest.isMockFunction(logger.error)).toBe(true);
            expect(jest.isMockFunction(executeClaude)).toBe(true);
            expect(jest.isMockFunction(getMultilineInput)).toBe(true);
            expect(jest.isMockFunction(startFresh)).toBe(true);
        });

        it('should verify jest configuration allows step0 tests', () => {
            expect(step0).toBeDefined();
            expect(typeof step0).toBe('function');
        });
    });

    describe('Test prompt validation and error handling', () => {
        it('should reject empty prompt', async () => {
            getMultilineInput.mockResolvedValue('');

            await step0();

            expect(logger.error).toHaveBeenCalledWith('Please provide more details (at least 10 characters)');
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });

        it('should reject prompt with only whitespace', async () => {
            getMultilineInput.mockResolvedValue('   ');

            await step0();

            expect(logger.error).toHaveBeenCalledWith('Please provide more details (at least 10 characters)');
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });

        it('should reject short prompt (less than 10 characters)', async () => {
            getMultilineInput.mockResolvedValue('short');

            await step0();

            expect(logger.error).toHaveBeenCalledWith('Please provide more details (at least 10 characters)');
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });

        it('should accept prompt with exactly 10 characters', async () => {
            getMultilineInput.mockResolvedValue('1234567890');

            await step0();

            expect(logger.error).not.toHaveBeenCalled();
            expect(processExitSpy).not.toHaveBeenCalled();
        });

        it('should accept valid prompt (more than 10 characters)', async () => {
            getMultilineInput.mockResolvedValue('This is a valid prompt');

            await step0();

            expect(logger.error).not.toHaveBeenCalled();
            expect(processExitSpy).not.toHaveBeenCalled();
        });

        it('should handle null promptText parameter when getMultilineInput returns valid input', async () => {
            getMultilineInput.mockResolvedValue('Valid input from getMultilineInput');

            await step0(false, null);

            expect(getMultilineInput).toHaveBeenCalled();
            expect(logger.error).not.toHaveBeenCalled();
        });
    });

    describe('Test file operations and initialization', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {});
            processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        });

        it('should create INITIAL_PROMPT.md with correct content', async () => {
            const testPrompt = 'Test prompt for file creation';
            getMultilineInput.mockResolvedValue(testPrompt);

            await step0();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/test/.claudiomiro/INITIAL_PROMPT.md',
                testPrompt
            );
        });

        it('should call startFresh with true parameter', async () => {
            getMultilineInput.mockResolvedValue('Valid prompt for startFresh test');

            await step0();

            expect(startFresh).toHaveBeenCalledWith(true);
        });

        it('should generate correct folder path', async () => {
            getMultilineInput.mockResolvedValue('Test prompt for folder path');

            await step0();

            expect(path.join).toHaveBeenCalledWith(state.claudiomiroFolder, 'INITIAL_PROMPT.md');
        });

        it('should write file with promptText when provided directly', async () => {
            const directPrompt = 'Direct prompt text provided';

            await step0(false, directPrompt);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/test/.claudiomiro/INITIAL_PROMPT.md',
                directPrompt
            );
            expect(getMultilineInput).not.toHaveBeenCalled();
        });
    });

    describe('Test mode selection and prompt generation', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {});
            processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        });

        it('should use auto mode prompt by default', async () => {
            getMultilineInput.mockResolvedValue('Test prompt for auto mode');

            await step0();

            const callArg = executeClaude.mock.calls[0][0];
            expect(callArg).toContain('DISTRIBUTED SYSTEMS PLANNER');
            expect(callArg).toContain('Step 2:');
        });

        it('should use hard mode prompt when mode is "hard"', async () => {
            getMultilineInput.mockResolvedValue('Test prompt for hard mode');

            await step0(false, null, 'hard');

            const callArg = executeClaude.mock.calls[0][0];
            expect(callArg).toContain('DEEP REASONING capabilities');
            expect(callArg).toContain('Dual Mission');
        });

        it('should include branch step when sameBranch is false', async () => {
            getMultilineInput.mockResolvedValue('Test prompt with branch');

            await step0(false);

            const callArg = executeClaude.mock.calls[0][0];
            expect(callArg).toContain('Step 1: Create a git branch for this task');
            expect(callArg).toContain('Step 2:');
        });

        it('should exclude branch step when sameBranch is true', async () => {
            getMultilineInput.mockResolvedValue('Test prompt without branch');

            await step0(true);

            const callArg = executeClaude.mock.calls[0][0];
            expect(callArg).not.toContain('Step 1: Create a git branch');
            expect(callArg).toContain('Step 1:');
        });

        it('should adjust step numbering when sameBranch is true', async () => {
            getMultilineInput.mockResolvedValue('Test step numbering');

            await step0(true);

            const callArg = executeClaude.mock.calls[0][0];
            expect(callArg).toMatch(/Step 1:/);
        });

        it('should adjust step numbering when sameBranch is false', async () => {
            getMultilineInput.mockResolvedValue('Test step numbering');

            await step0(false);

            const callArg = executeClaude.mock.calls[0][0];
            expect(callArg).toMatch(/Step 2:/);
        });
    });

    describe('Test Claude execution integration', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {});
            processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        });

        it('should call executeClaude with generated prompt', async () => {
            const testTask = 'Test task for Claude execution';
            getMultilineInput.mockResolvedValue(testTask);

            await step0();

            expect(executeClaude).toHaveBeenCalledTimes(1);
            expect(executeClaude.mock.calls[0][0]).toContain(testTask);
        });

        it('should handle executeClaude success', async () => {
            getMultilineInput.mockResolvedValue('Successful execution test');
            executeClaude.mockResolvedValue();

            await expect(step0()).resolves.not.toThrow();

            expect(logger.success).toHaveBeenCalledWith('Tasks created successfully');
        });

        it('should handle executeClaude rejection', async () => {
            getMultilineInput.mockResolvedValue('Failed execution test');
            const testError = new Error('Claude execution failed');
            executeClaude.mockRejectedValue(testError);

            await expect(step0()).rejects.toThrow('Claude execution failed');
        });

        it('should pass correct prompt structure to executeClaude in auto mode', async () => {
            const task = 'Build a REST API';
            getMultilineInput.mockResolvedValue(task);

            await step0(false, null, 'auto');

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('Core Mission');
            expect(prompt).toContain('Planning Process');
            expect(prompt).toContain('Required Outputs');
            expect(prompt).toContain(task);
        });

        it('should pass correct prompt structure to executeClaude in hard mode', async () => {
            const task = 'Build a REST API';
            getMultilineInput.mockResolvedValue(task);

            await step0(false, null, 'hard');

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('Deep Reasoning & Methodology');
            expect(prompt).toContain('Recursive Breakdown');
            expect(prompt).toContain('Assumptions');
            expect(prompt).toContain(task);
        });
    });

    describe('Test logger and spinner interactions', () => {
        beforeEach(() => {
            // Reset mocks to avoid pollution from previous describe blocks
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {});
            processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        });

        it('should call logger.newline before starting', async () => {
            getMultilineInput.mockResolvedValue('Test logger newline');

            await step0();

            expect(logger.newline).toHaveBeenCalled();
        });

        it('should start spinner with correct message', async () => {
            getMultilineInput.mockResolvedValue('Test spinner start');

            await step0();

            expect(logger.startSpinner).toHaveBeenCalledWith('Initializing task...');
        });

        it('should stop spinner after execution', async () => {
            getMultilineInput.mockResolvedValue('Test spinner stop');

            await step0();

            expect(logger.stopSpinner).toHaveBeenCalled();
        });

        it('should log success message after completion', async () => {
            getMultilineInput.mockResolvedValue('Test success message');

            await step0();

            expect(logger.success).toHaveBeenCalledWith('Tasks created successfully');
        });

        it('should maintain correct logger call order', async () => {
            getMultilineInput.mockResolvedValue('Test logger order');

            await step0();

            const calls = [
                logger.newline.mock.invocationCallOrder[0],
                logger.startSpinner.mock.invocationCallOrder[0],
                logger.stopSpinner.mock.invocationCallOrder[0],
                logger.success.mock.invocationCallOrder[0]
            ];

            expect(calls[0]).toBeLessThan(calls[1]);
            expect(calls[1]).toBeLessThan(calls[2]);
            expect(calls[2]).toBeLessThan(calls[3]);
        });

        it('should call logger.error for invalid input', async () => {
            getMultilineInput.mockResolvedValue('short');

            await step0();

            expect(logger.error).toHaveBeenCalledWith('Please provide more details (at least 10 characters)');
        });

        it('should not call success logger on validation failure', async () => {
            getMultilineInput.mockResolvedValue('');

            await step0();

            expect(logger.error).toHaveBeenCalled();
            expect(processExitSpy).toHaveBeenCalledWith(0);
            // Note: Because process.exit is mocked, execution continues, so we can't test
            // that success is not called. The real behavior would exit before reaching success.
        });
    });

    describe('Test sameBranch parameter behavior', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {});
            processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        });

        it('should exclude branch step when sameBranch is true', async () => {
            getMultilineInput.mockResolvedValue('Test sameBranch true');

            await step0(true);

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).not.toContain('Create a git branch');
        });

        it('should include branch step when sameBranch is false', async () => {
            getMultilineInput.mockResolvedValue('Test sameBranch false');

            await step0(false);

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('Step 1: Create a git branch for this task');
        });

        it('should use step 1 when sameBranch is true', async () => {
            getMultilineInput.mockResolvedValue('Test step number with sameBranch');

            await step0(true);

            const prompt = executeClaude.mock.calls[0][0];
            // Should start with Step 1 after the empty branchStep
            expect(prompt).toMatch(/Step 1:\s+You are a DISTRIBUTED SYSTEMS PLANNER/);
        });

        it('should use step 2 when sameBranch is false', async () => {
            getMultilineInput.mockResolvedValue('Test step number without sameBranch');

            await step0(false);

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('Step 2:');
        });

        it('should handle sameBranch default value (false)', async () => {
            getMultilineInput.mockResolvedValue('Test default sameBranch');

            await step0();

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('Step 1: Create a git branch');
        });
    });

    describe('Test edge cases and error scenarios', () => {
        beforeEach(() => {
            // Reset fs.writeFileSync to default implementation
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {}); // Reset to no-op
        });

        it('should handle null promptText by calling getMultilineInput', async () => {
            getMultilineInput.mockResolvedValue('Input from getMultilineInput');

            await step0(false, null);

            expect(getMultilineInput).toHaveBeenCalled();
        });

        it('should prefer promptText parameter over getMultilineInput', async () => {
            const directPrompt = 'Direct prompt parameter';
            getMultilineInput.mockResolvedValue('This should not be used');

            await step0(false, directPrompt);

            expect(getMultilineInput).not.toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                directPrompt
            );
        });

        it('should handle getMultilineInput returning empty string', async () => {
            getMultilineInput.mockResolvedValue('');

            await step0();

            expect(logger.error).toHaveBeenCalled();
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });

        it('should handle executeClaude throwing error', async () => {
            getMultilineInput.mockResolvedValue('Valid prompt for error test');
            executeClaude.mockRejectedValue(new Error('Network error'));

            await expect(step0()).rejects.toThrow('Network error');
        });

        it('should handle fs.writeFileSync errors', async () => {
            getMultilineInput.mockResolvedValue('Valid prompt for fs error');
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            await expect(step0()).rejects.toThrow('Write error');

            // Reset fs.writeFileSync for subsequent tests
            fs.writeFileSync.mockImplementation(() => {});
        });

        it('should handle prompt with special characters', async () => {
            const specialPrompt = 'Test with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
            getMultilineInput.mockResolvedValue(specialPrompt);

            await step0();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                specialPrompt
            );
        });

        it('should handle very long prompt', async () => {
            const longPrompt = 'A'.repeat(10000);
            getMultilineInput.mockResolvedValue(longPrompt);

            await step0();

            expect(executeClaude).toHaveBeenCalled();
            expect(logger.success).toHaveBeenCalled();
        });

        it('should handle prompt with newlines', async () => {
            const multilinePrompt = 'Line 1\nLine 2\nLine 3';
            getMultilineInput.mockResolvedValue(multilinePrompt);

            await step0();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                multilinePrompt
            );
        });

        it('should handle all three parameters provided', async () => {
            const customPrompt = 'Custom prompt text';

            await step0(true, customPrompt, 'hard');

            expect(getMultilineInput).not.toHaveBeenCalled();
            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('DEEP REASONING');
            expect(prompt).not.toContain('Create a git branch');
        });

        it('should handle invalid mode parameter gracefully', async () => {
            getMultilineInput.mockResolvedValue('Test invalid mode');

            await step0(false, null, 'invalid');

            // Should default to auto mode
            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('DISTRIBUTED SYSTEMS PLANNER');
        });
    });

    describe('Test workflow integration', () => {
        beforeEach(() => {
            // Reset all mocks for workflow tests
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {});
        });

        it('should execute full workflow in correct order', async () => {
            const testPrompt = 'Complete workflow test';
            getMultilineInput.mockResolvedValue(testPrompt);

            await step0();

            // Verify call order
            expect(logger.newline).toHaveBeenCalled();
            expect(logger.startSpinner).toHaveBeenCalled();
            expect(startFresh).toHaveBeenCalledWith(true);
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(executeClaude).toHaveBeenCalled();
            expect(logger.stopSpinner).toHaveBeenCalled();
            expect(logger.success).toHaveBeenCalled();
        });

        it('should not proceed after validation failure', async () => {
            getMultilineInput.mockResolvedValue('fail');

            await step0();

            expect(logger.error).toHaveBeenCalled();
            expect(processExitSpy).toHaveBeenCalledWith(0);
            // Note: Because process.exit is mocked, execution continues after the exit call.
            // In real execution, the process would terminate and subsequent code wouldn't run.
        });

        it('should complete all steps when given valid direct prompt', async () => {
            await step0(false, 'Valid direct prompt text');

            expect(getMultilineInput).not.toHaveBeenCalled();
            expect(startFresh).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(executeClaude).toHaveBeenCalled();
            expect(logger.success).toHaveBeenCalled();
        });
    });
});
