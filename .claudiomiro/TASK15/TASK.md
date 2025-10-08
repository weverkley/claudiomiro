# Task: Unit Tests for src/steps/step2.js

## Objective
Create comprehensive unit tests for step2 (TODO generation), including PROMPT.md reading, Claude execution for TODO creation, and TODO.md file generation.

## Dependencies
- **Depends on:** TASK1 (Jest setup)
- **Blocks:** TASK20 (Integration tests)
- **Parallel with:** TASK2, TASK3, TASK4, TASK5, TASK6, TASK7, TASK8, TASK9, TASK10, TASK11, TASK12, TASK13, TASK14, TASK16, TASK17, TASK18, TASK19

## Files Affected
**CREATE:**
- __tests__/steps/step2.test.js (unit tests for step2.js)

**MODIFY:**
- NONE

## Steps
1. Import and mock dependencies (fs, executeClaude, logger, state, prompt-reader)
2. Test step2 function execution flow
3. Test PROMPT.md reading for task requirements
4. Test Claude execution for TODO.md generation
5. Test TODO.md file creation and formatting
6. Test user feedback integration
7. Test state updates for TODO generation
8. Verify error handling and edge cases

## Done When
- [ ] All step2 functions are tested
- [ ] File reading is covered
- [ ] Claude execution is mocked
- [ ] TODO.md generation verified
- [ ] User feedback handled
- [ ] Coverage > 90% for step2.js
- [ ] Tests run independently

## Verify
```bash
npm test __tests__/steps/step2.test.js
```
Expected: All tests pass with >90% coverage for src/steps/step2.js
