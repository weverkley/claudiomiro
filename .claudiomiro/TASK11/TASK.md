# Task: Unit Tests for src/services/prompt-reader.js

## Objective
Create comprehensive unit tests for the prompt reader service, including readline interface handling, line processing, SIGINT handling, and double-enter detection.

## Dependencies
- **Depends on:** TASK1 (Jest setup)
- **Blocks:** TASK20 (Integration tests)
- **Parallel with:** TASK2, TASK3, TASK4, TASK5, TASK6, TASK7, TASK8, TASK9, TASK10, TASK12, TASK13, TASK14, TASK15, TASK16, TASK17, TASK18, TASK19

## Files Affected
**CREATE:**
- __tests__/services/prompt-reader.test.js (unit tests for prompt-reader.js)

**MODIFY:**
- NONE

## Steps
1. Import and mock dependencies (readline, logger, process.stdin/stdout)
2. Test getMultilineInput function initialization
3. Test line-by-line input accumulation
4. Test double-enter detection (empty line submission)
5. Test SIGINT handling and cleanup
6. Test readline interface closure
7. Test error scenarios and edge cases
8. Verify logger calls and user prompts

## Done When
- [ ] All prompt-reader functions are tested
- [ ] Readline interface is mocked
- [ ] Line handling is covered
- [ ] SIGINT behavior is tested
- [ ] Double-enter detection works
- [ ] Coverage > 90% for prompt-reader.js
- [ ] Tests run independently

## Verify
```bash
npm test __tests__/services/prompt-reader.test.js
```
Expected: All tests pass with >90% coverage for src/services/prompt-reader.js
