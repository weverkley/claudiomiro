## OBJECTIVE
Create comprehensive unit tests for src/services/file-manager.js (directory and state management).
Done when: startFresh tested, cleanup verified, folder creation covered, state initialized, >90% coverage, runs independently.

## DEPENDENCIES
- Requires: TASK1 (Jest setup)
- Provides for: TASK20 (Integration tests)

## PARALLELIZATION
- Layer: 1 (Unit Tests)
- Parallel with: TASK2-8, TASK10-19 (17 other unit test tasks)
- Complexity: Low

## CONSTRAINTS
- Mock all external dependencies (fs, logger, state)
- TODO.md first line: "Fully implemented: NO"
- Test directory creation and cleanup
- Verify state initialization
- Test error scenarios
- No manual/deployment steps

## IMPLEMENTATION REQUIREMENTS
1. Create __tests__/services/file-manager.test.js
2. Mock fs (existsSync, rmSync, mkdirSync)
3. Mock logger (info, error, warn)
4. Mock state (initialize, reset)
5. Test cases:
   - startFresh: creates .claudiomiro directory structure
   - Directory cleanup: removes existing folders if present
   - Folder creation: creates TASK1-N directories
   - State initialization: calls state.initialize()
   - Error handling: fs operation failures
   - Edge case: directory already exists
   - Edge case: permission denied
6. Verify fs method call order and arguments
7. Verify logger calls for each operation

## RISKS
1. File system mocking → Use jest.mock('fs') at module level
2. Directory structure → Ensure mock matches actual folder patterns
