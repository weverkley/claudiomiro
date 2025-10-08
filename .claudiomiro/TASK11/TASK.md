@dependencies [TASK1, TASK2]
# Task: Unit Tests for src/services/prompt-reader.js

## Objective
Create comprehensive unit tests for src/services/prompt-reader.js covering the getMultilineInput function and readline operations.

## Dependencies
- **Depends on:** TASK1, TASK2
- **Blocks:** NONE
- **Parallel with:** TASK3, TASK4, TASK5, TASK6, TASK7, TASK8, TASK9, TASK10, TASK12, TASK13, TASK14, TASK15, TASK16, TASK17

## Files Affected
**CREATE:**
- __tests__/services/prompt-reader.test.js

**MODIFY:**
- NONE

## Steps
1. Create prompt-reader.test.js
2. Mock readline and logger modules
3. Test getMultilineInput() with single line input
4. Test getMultilineInput() with multiline input
5. Test EOF handling (Ctrl+D)
6. Test empty input handling
7. Test readline interface creation and closure
8. Verify logger output for prompts
9. Ensure all tests pass with `npm test`

## Done When
- [ ] __tests__/services/prompt-reader.test.js exists
- [ ] getMultilineInput() single-line case is tested
- [ ] getMultilineInput() multi-line case is tested
- [ ] EOF handling is tested
- [ ] Empty input is handled correctly
- [ ] Readline interface lifecycle is tested
- [ ] All tests pass when running `npm test`
- [ ] Test coverage is > 80% for src/services/prompt-reader.js

## Verify
```bash
npm test -- prompt-reader.test.js
```
→ Expected: All tests pass, coverage > 80%
