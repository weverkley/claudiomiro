# Task: Unit Tests for src/cli.js

## Objective
Create comprehensive unit tests for the CLI module including argument parsing, workflow orchestration, DAG executor integration, and step execution logic.

## Dependencies
- **Depends on:** TASK1 (Jest setup)
- **Blocks:** TASK20 (Integration tests)
- **Parallel with:** TASK2, TASK3, TASK5, TASK6, TASK7, TASK8, TASK9, TASK10, TASK11, TASK12, TASK13, TASK14, TASK15, TASK16, TASK17, TASK18, TASK19

## Files Affected
**CREATE:**
- __tests__/cli.test.js (unit tests for src/cli.js)

**MODIFY:**
- NONE

## Steps
1. Mock dependencies (fs, state, file-manager, steps, DAGExecutor)
2. Test argument parsing (--prompt, --maxCycles, --fresh, --push, --same-branch, --mode, --steps, --maxConcurrent)
3. Test chooseAction workflow logic for different scenarios
4. Test buildTaskGraph function with various dependency configurations
5. Test DAG executor activation and step filtering
6. Test init() main loop and cycle management
7. Verify folder validation and error handling
8. Test step execution conditions and skipping logic

## Done When
- [ ] All CLI functions are tested
- [ ] Argument parsing verified for all flags
- [ ] Workflow logic tested (step0 → step1 → DAG → step5)
- [ ] buildTaskGraph tested with edge cases
- [ ] Error handling verified
- [ ] Coverage > 90% for cli.js
- [ ] Tests run independently

## Verify
```bash
npm test __tests__/cli.test.js
```
Expected: All tests pass with >90% coverage for cli.js
