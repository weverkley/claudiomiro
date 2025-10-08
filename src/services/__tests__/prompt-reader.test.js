const readline = require('readline');
const chalk = require('chalk');
const { getMultilineInput } = require('../prompt-reader');
const logger = require('../../../logger');

jest.mock('readline');
jest.mock('chalk', () => {
    const mockFn = jest.fn(str => str);
    const mockChain = {
        bold: mockFn,
        cyan: mockFn,
        white: mockFn,
        gray: mockFn,
        blue: mockFn,
        green: mockFn,
        yellow: mockFn,
        red: mockFn,
        magenta: mockFn,
        dim: mockFn
    };

    // Create chainable methods
    Object.keys(mockChain).forEach(key => {
        mockChain[key] = Object.assign(mockFn, mockChain);
    });

    return Object.assign(mockFn, mockChain);
});
jest.mock('../../../logger');

describe('prompt-reader', () => {
    let mockRl;
    let consoleLogSpy;
    let stdoutWriteSpy;
    let processExitSpy;

    beforeEach(() => {
        // Mock readline interface
        mockRl = {
            on: jest.fn(),
            close: jest.fn()
        };
        readline.createInterface.mockReturnValue(mockRl);

        // Spy on console methods
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
        consoleLogSpy.mockRestore();
        stdoutWriteSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    describe('Setup test infrastructure for prompt-reader', () => {
        it('should create readline interface with correct options', async () => {
            // Trigger immediate resolution
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    // Simulate two empty lines to trigger submission
                    handler('');
                    handler('');
                }
            });

            await getMultilineInput();

            expect(readline.createInterface).toHaveBeenCalledWith({
                input: process.stdin,
                output: process.stdout,
                terminal: true
            });
        });

        it('should display initial prompts with chalk formatting', async () => {
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    handler('');
                    handler('');
                }
            });

            await getMultilineInput();

            expect(consoleLogSpy).toHaveBeenCalled();
            expect(chalk.bold.cyan).toHaveBeenCalled();
            expect(chalk.white).toHaveBeenCalled();
            expect(chalk.gray).toHaveBeenCalled();
        });
    });

    describe('Test basic multiline input collection', () => {
        it('should handle single line input', async () => {
            let lineHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    lineHandler = handler;
                }
            });

            const promise = getMultilineInput();

            // Simulate single line input followed by two empty lines
            lineHandler('Hello world');
            lineHandler('');
            lineHandler('');

            const result = await promise;
            expect(result).toBe('Hello world');
        });

        it('should handle multiple lines input', async () => {
            let lineHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    lineHandler = handler;
                }
            });

            const promise = getMultilineInput();

            // Simulate multiple lines
            lineHandler('Line 1');
            lineHandler('Line 2');
            lineHandler('Line 3');
            lineHandler('');
            lineHandler('');

            const result = await promise;
            expect(result).toBe('Line 1\nLine 2\nLine 3');
        });

        it('should trim whitespace correctly from final result', async () => {
            let lineHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    lineHandler = handler;
                }
            });

            const promise = getMultilineInput();

            // Simulate input with trailing spaces
            lineHandler('  Line with spaces  ');
            lineHandler('');
            lineHandler('');

            const result = await promise;
            expect(result).toBe('Line with spaces');
        });

        it('should preserve internal whitespace in lines', async () => {
            let lineHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    lineHandler = handler;
                }
            });

            const promise = getMultilineInput();

            lineHandler('Line   with   spaces');
            lineHandler('');
            lineHandler('');

            const result = await promise;
            expect(result).toBe('Line   with   spaces');
        });
    });

    describe('Test double-enter submission behavior', () => {
        it('should trigger submission on two consecutive empty lines', async () => {
            let lineHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    lineHandler = handler;
                }
            });

            const promise = getMultilineInput();

            lineHandler('Test input');
            lineHandler('');
            lineHandler('');

            const result = await promise;
            expect(result).toBe('Test input');
            expect(mockRl.close).toHaveBeenCalled();
        });

        it('should exclude trailing empty line from result', async () => {
            let lineHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    lineHandler = handler;
                }
            });

            const promise = getMultilineInput();

            lineHandler('Line 1');
            lineHandler('Line 2');
            lineHandler('');
            lineHandler('');

            const result = await promise;
            expect(result).toBe('Line 1\nLine 2');
            expect(result).not.toContain('\n\n');
        });

        it('should not trigger on single empty line', async () => {
            let lineHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    lineHandler = handler;
                }
            });

            const promise = getMultilineInput();

            lineHandler('Line 1');
            lineHandler('');
            lineHandler('Line 2');
            lineHandler('');
            lineHandler('');

            const result = await promise;
            expect(result).toBe('Line 1\n\nLine 2');
        });

        it('should handle empty lines in the middle of input', async () => {
            let lineHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    lineHandler = handler;
                }
            });

            const promise = getMultilineInput();

            lineHandler('First');
            lineHandler('');
            lineHandler('Second');
            lineHandler('');
            lineHandler('');

            const result = await promise;
            expect(result).toBe('First\n\nSecond');
        });
    });

    describe('Test SIGINT cancellation', () => {
        it('should close readline on SIGINT', async () => {
            let sigintHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'SIGINT') {
                    sigintHandler = handler;
                }
                if (event === 'line') {
                    // Keep promise pending
                }
            });

            getMultilineInput();

            // Trigger SIGINT
            sigintHandler();

            expect(mockRl.close).toHaveBeenCalled();
        });

        it('should log error on SIGINT', async () => {
            let sigintHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'SIGINT') {
                    sigintHandler = handler;
                }
            });

            getMultilineInput();

            sigintHandler();

            expect(logger.error).toHaveBeenCalledWith('Operation cancelled');
        });

        it('should exit process with code 0 on SIGINT', async () => {
            let sigintHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'SIGINT') {
                    sigintHandler = handler;
                }
            });

            getMultilineInput();

            sigintHandler();

            expect(processExitSpy).toHaveBeenCalledWith(0);
        });
    });

    describe('Test readline interface interactions', () => {
        it('should create readline with correct input/output options', async () => {
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    handler('');
                    handler('');
                }
            });

            await getMultilineInput();

            expect(readline.createInterface).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: process.stdin,
                    output: process.stdout,
                    terminal: true
                })
            );
        });

        it('should close readline after submission', async () => {
            let lineHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    lineHandler = handler;
                }
            });

            const promise = getMultilineInput();

            lineHandler('Input');
            lineHandler('');
            lineHandler('');

            await promise;

            expect(mockRl.close).toHaveBeenCalled();
        });

        it('should close readline after cancellation', async () => {
            let sigintHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'SIGINT') {
                    sigintHandler = handler;
                }
            });

            getMultilineInput();

            sigintHandler();

            expect(mockRl.close).toHaveBeenCalled();
        });

        it('should write prompt indicator to stdout', async () => {
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    handler('');
                    handler('');
                }
            });

            await getMultilineInput();

            expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('🤖 >'));
        });
    });

    describe('Coverage edge cases', () => {
        it('should handle empty input (just two empty lines)', async () => {
            let lineHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    lineHandler = handler;
                }
            });

            const promise = getMultilineInput();

            lineHandler('');
            lineHandler('');

            const result = await promise;
            expect(result).toBe('');
        });

        it('should handle input with only whitespace', async () => {
            let lineHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    lineHandler = handler;
                }
            });

            const promise = getMultilineInput();

            lineHandler('   ');
            lineHandler('');
            lineHandler('');

            const result = await promise;
            expect(result).toBe('');
        });

        it('should handle very long multiline input', async () => {
            let lineHandler;
            mockRl.on.mockImplementation((event, handler) => {
                if (event === 'line') {
                    lineHandler = handler;
                }
            });

            const promise = getMultilineInput();

            for (let i = 1; i <= 100; i++) {
                lineHandler(`Line ${i}`);
            }
            lineHandler('');
            lineHandler('');

            const result = await promise;
            const lines = result.split('\n');
            expect(lines).toHaveLength(100);
            expect(lines[0]).toBe('Line 1');
            expect(lines[99]).toBe('Line 100');
        });
    });
});
