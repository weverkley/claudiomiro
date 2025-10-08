## OBJECTIVE
Create comprehensive unit tests for src/services/prompt-reader.js (interactive user input).
Done when: getMultilineInput tested, readline mocked, line handling covered, SIGINT tested, >90% coverage, runs independently.

## DEPENDENCIES
- Requires: TASK1 (Jest setup)
- Provides for: TASK20 (Integration tests)

## PARALLELIZATION
- Layer: 1 (Unit Tests)
- Parallel with: TASK2-10, TASK12-19 (17 other unit test tasks)
- Complexity: Medium

## CONSTRAINTS
- Mock all external dependencies (readline, logger, process)
- TODO.md first line: "Fully implemented: NO"
- Test async input handling
- Verify event listener registration
- Test cleanup on close
- No manual/deployment steps

## IMPLEMENTATION REQUIREMENTS
1. Create __tests__/services/prompt-reader.test.js
2. Mock readline.createInterface with EventEmitter
3. Mock logger (info, error)
4. Mock process.stdin, process.stdout
5. Test cases:
   - getMultilineInput: resolves with accumulated lines
   - Line accumulation: multiple 'line' events append to result
   - Double-enter: empty line → close → resolve
   - SIGINT: ctrl-c → close interface → exit process
   - Interface cleanup: close() called on completion
   - Edge case: immediate submission (one line + enter)
   - Edge case: empty input
6. Use EventEmitter mock for 'line', 'close', 'SIGINT' events
7. Mock rl.close() and verify it's called
8. Use jest.spyOn(process, 'exit')

## RISKS
1. EventEmitter complexity → Use simple mock with on/once methods
2. Async Promise handling → Use async/await in tests
3. Process.exit → Mock to prevent test termination
