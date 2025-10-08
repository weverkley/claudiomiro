# Task: Unit Tests for src/steps/code-review.js

## Objective
Create comprehensive unit tests for the code review step, including CODE_REVIEW.md generation, quality checks, and review feedback processing.

## Dependencies
- **Depends on:** TASK1 (Jest setup)
- **Blocks:** TASK20 (Integration tests)
- **Parallel with:** TASK2, TASK3, TASK4, TASK5, TASK6, TASK7, TASK8, TASK9, TASK10, TASK11, TASK12, TASK13, TASK14, TASK15, TASK16, TASK17, TASK18

## Files Affected
**CREATE:**
- __tests__/steps/code-review.test.js (unit tests for code-review.js)

**MODIFY:**
- NONE

## Steps
1. Import and mock dependencies (fs, executeClaude, logger, state)
2. Test codeReview function execution flow
3. Test code analysis via Claude
4. Test CODE_REVIEW.md file generation
5. Test quality check validation
6. Test review feedback processing
7. Test state updates for code review
8. Verify error handling and edge cases

## Done When
- [ ] All code-review functions are tested
- [ ] Code analysis is covered
- [ ] CODE_REVIEW.md generation verified
- [ ] Quality checks tested
- [ ] Review feedback handled
- [ ] Coverage > 90% for code-review.js
- [ ] Tests run independently

## Verify
```bash
npm test __tests__/steps/code-review.test.js
```
Expected: All tests pass with >90% coverage for src/steps/code-review.js
