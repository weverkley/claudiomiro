# Task: Integration and E2E Tests

## Objective
Create comprehensive integration and end-to-end tests covering full workflow execution, CLI scenarios, DAG orchestration, and step coordination.

## Dependencies
- **Depends on:** TASK2, TASK3, TASK4, TASK5, TASK6, TASK7, TASK8, TASK9, TASK10, TASK11, TASK12, TASK13, TASK14, TASK15, TASK16, TASK17, TASK18, TASK19 (all unit tests)
- **Blocks:** NONE (Final task)
- **Parallel with:** NONE

## Files Affected
**CREATE:**
- __tests__/integration/full-workflow.test.js (integration tests)
- __tests__/e2e/cli.e2e.test.js (end-to-end CLI tests)
- __tests__/helpers/test-utils.js (test utilities and fixtures)

**MODIFY:**
- NONE

## Steps
1. Create test utilities for temp directories and fixtures
2. Create integration tests for step orchestration
3. Test full workflow: step0 → step1 → step2 → step3 → step4 → step5
4. Test DAG execution with parallel tasks
5. Create E2E tests for CLI commands
6. Test error recovery and state persistence
7. Test file system operations in real temp directories
8. Verify complete system behavior

## Done When
- [ ] Integration tests cover step coordination
- [ ] E2E tests cover CLI usage
- [ ] Full workflow tested end-to-end
- [ ] DAG parallel execution tested
- [ ] Error scenarios covered
- [ ] Coverage > 90% overall
- [ ] All tests pass independently
- [ ] CI-ready test suite

## Verify
```bash
npm test __tests__/integration/
```
Expected: All integration tests pass

```bash
npm test __tests__/e2e/
```
Expected: All E2E tests pass

```bash
npm run test:coverage
```
Expected: Overall coverage > 90%
