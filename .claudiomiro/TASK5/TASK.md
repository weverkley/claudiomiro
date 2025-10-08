@dependencies [TASK1, TASK2]
# Task: Unit Tests for src/cli.js

## Objective
Create comprehensive unit tests for src/cli.js covering all CLI functions including init, chooseAction, startFresh, and buildTaskGraph.

## Dependencies
- **Depends on:** TASK1, TASK2
- **Blocks:** NONE
- **Parallel with:** TASK3, TASK4, TASK6, TASK7, TASK8, TASK9, TASK10, TASK11, TASK12, TASK13, TASK14, TASK15, TASK16, TASK17

## Files Affected
**CREATE:**
- __tests__/cli.test.js

**MODIFY:**
- NONE

## Steps
1. Create __tests__/cli.test.js
2. Mock all dependencies (logger, state, steps, DAGExecutor, fs, path)
3. Test init() function flow
4. Test chooseAction() with different user choices
5. Test startFresh() functionality
6. Test buildTaskGraph() with valid EXECUTION_PLAN.md
7. Test error handling for invalid inputs
8. Test file system operations are properly mocked
9. Ensure all tests pass with `npm test`

## Done When
- [ ] __tests__/cli.test.js exists
- [ ] init() function is tested
- [ ] chooseAction() covers all menu options
- [ ] startFresh() is tested
- [ ] buildTaskGraph() parses execution plan correctly
- [ ] Error scenarios are covered
- [ ] All tests pass when running `npm test`
- [ ] Test coverage is > 80% for src/cli.js

## Verify
```bash
npm test -- cli.test.js
```
→ Expected: All tests pass, coverage > 80%
