# Task: Unit Tests for src/steps/step0.js

## Objective
Create comprehensive unit tests for step0 (task generation), including PROMPT.md creation, dependency analysis, task structure generation, and git branch creation.

## Dependencies
- **Depends on:** TASK1 (Jest setup)
- **Blocks:** TASK20 (Integration tests)
- **Parallel with:** TASK2, TASK3, TASK4, TASK5, TASK6, TASK7, TASK8, TASK9, TASK10, TASK11, TASK12, TASK14, TASK15, TASK16, TASK17, TASK18, TASK19

## Files Affected
**CREATE:**
- __tests__/steps/step0.test.js (unit tests for step0.js)

**MODIFY:**
- NONE

## Steps
1. Import and mock dependencies (fs, executeClaude, logger, state, prompt-reader)
2. Test step0 function execution flow
3. Test user prompt collection via getMultilineInput
4. Test PROMPT.md file creation
5. Test Claude execution for task generation
6. Test dependency analysis and task parsing
7. Test git branch creation
8. Test state updates and task registration
9. Verify error handling and edge cases

## Done When
- [ ] All step0 functions are tested
- [ ] User input handling is covered
- [ ] File creation is verified
- [ ] Claude execution is mocked
- [ ] Git operations are tested
- [ ] Coverage > 90% for step0.js
- [ ] Tests run independently

## Verify
```bash
npm test __tests__/steps/step0.test.js
```
Expected: All tests pass with >90% coverage for src/steps/step0.js
