# Task: Unit Tests for src/services/file-manager.js

## Objective
Create comprehensive unit tests for the file manager service, including directory cleanup, folder creation, and state initialization.

## Dependencies
- **Depends on:** TASK1 (Jest setup)
- **Blocks:** TASK20 (Integration tests)
- **Parallel with:** TASK2, TASK3, TASK4, TASK5, TASK6, TASK7, TASK8, TASK10, TASK11, TASK12, TASK13, TASK14, TASK15, TASK16, TASK17, TASK18, TASK19

## Files Affected
**CREATE:**
- __tests__/services/file-manager.test.js (unit tests for file-manager.js)

**MODIFY:**
- NONE

## Steps
1. Import and mock dependencies (fs, logger, state)
2. Test startFresh function initialization
3. Test directory cleanup (removal of existing folders)
4. Test folder creation for .claudiomiro structure
5. Test state initialization calls
6. Test error handling for file system operations
7. Verify logger output for each operation
8. Test edge cases: missing directories, permission errors

## Done When
- [ ] All file-manager functions are tested
- [ ] Directory operations are mocked and verified
- [ ] State initialization is tested
- [ ] Error scenarios are covered
- [ ] Coverage > 90% for file-manager.js
- [ ] Tests run independently

## Verify
```bash
npm test __tests__/services/file-manager.test.js
```
Expected: All tests pass with >90% coverage for src/services/file-manager.js
