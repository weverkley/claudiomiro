@dependencies [TASK1, TASK2]
# Task: Unit Tests for src/services/file-manager.js

## Objective
Create comprehensive unit tests for src/services/file-manager.js covering the startFresh function and file cleanup operations.

## Dependencies
- **Depends on:** TASK1, TASK2
- **Blocks:** NONE
- **Parallel with:** TASK3, TASK4, TASK5, TASK6, TASK7, TASK8, TASK9, TASK11, TASK12, TASK13, TASK14, TASK15, TASK16, TASK17

## Files Affected
**CREATE:**
- __tests__/services/file-manager.test.js

**MODIFY:**
- NONE

## Steps
1. Create file-manager.test.js
2. Mock fs, logger, and state modules
3. Test startFresh() function
4. Test directory cleanup logic
5. Test file deletion operations
6. Test state reset functionality
7. Test error handling for file operations
8. Verify logger calls for user feedback
9. Ensure all tests pass with `npm test`

## Done When
- [ ] __tests__/services/file-manager.test.js exists
- [ ] startFresh() is tested
- [ ] Directory cleanup is verified
- [ ] File deletion is tested
- [ ] State reset is tested
- [ ] Error scenarios are covered
- [ ] All tests pass when running `npm test`
- [ ] Test coverage is > 80% for src/services/file-manager.js

## Verify
```bash
npm test -- file-manager.test.js
```
→ Expected: All tests pass, coverage > 80%
