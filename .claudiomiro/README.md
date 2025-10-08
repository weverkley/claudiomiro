# Test Coverage Implementation Plan

## Overview
This plan decomposes the requirement to "ensure each file has unit tests (jest) and create GitHub Actions" into **17 parallelizable tasks** optimized for maximum concurrent execution.

## Quick Stats
- **Total Tasks:** 17
- **Total Layers:** 4
- **Max Parallel Tasks:** 15 (in Layer 2)
- **Parallelism Ratio:** 4.25
- **Files to Test:** 17 JavaScript modules

## Architecture

### Layer 0: Foundation (1 task)
- **TASK1:** Jest configuration and GitHub Actions setup
  - Installs Jest, creates config, sets up CI/CD
  - Blocks all other tasks

### Layer 1: Test Infrastructure (1 task)
- **TASK2:** Test utilities and mocks
  - Creates shared test helpers and mocks
  - Enables consistent testing patterns across all test files

### Layer 2: Core Module Tests (15 tasks - PARALLEL)
All these tasks run **simultaneously** as they test independent files:

| Task | Target File | Complexity |
|------|-------------|------------|
| TASK3 | logger.js | Medium |
| TASK4 | index.js | Low |
| TASK5 | src/cli.js | High |
| TASK6 | src/config/state.js | Medium |
| TASK7 | src/utils/validation.js | Low |
| TASK8 | src/services/claude-logger.js | Medium |
| TASK9 | src/services/claude-executor.js | High |
| TASK10 | src/services/file-manager.js | Medium |
| TASK11 | src/services/prompt-reader.js | Medium |
| TASK12 | src/services/dag-executor.js | High |
| TASK13 | src/steps/step0.js | Medium |
| TASK14 | src/steps/step1.js | Medium |
| TASK15 | src/steps/step2.js | Medium |
| TASK16 | src/steps/step3.js | Medium |
| TASK17 | src/steps/step4.js | Medium |

### Layer 3: Verification
- No additional tasks required
- Each task includes its own verification
- GitHub Actions validates all tests in CI/CD

## Execution Strategy

### Sequential Path (Critical Path)
```
TASK1 (Jest setup)
  ↓
TASK2 (Test utilities)
  ↓
[Any of TASK3-17] (Pick any test to run)
```

### Parallel Execution
After TASK2 completes, all 15 test tasks (TASK3-17) can run **simultaneously**:
```
TASK1 → TASK2 ─┬─→ TASK3  (logger.js)
               ├─→ TASK4  (index.js)
               ├─→ TASK5  (cli.js)
               ├─→ TASK6  (state.js)
               ├─→ TASK7  (validation.js)
               ├─→ TASK8  (claude-logger.js)
               ├─→ TASK9  (claude-executor.js)
               ├─→ TASK10 (file-manager.js)
               ├─→ TASK11 (prompt-reader.js)
               ├─→ TASK12 (dag-executor.js)
               ├─→ TASK13 (step0.js)
               ├─→ TASK14 (step1.js)
               ├─→ TASK15 (step2.js)
               ├─→ TASK16 (step3.js)
               └─→ TASK17 (step4.js)
```

## Task Independence

Tasks are independent because:
1. **Different files:** Each task creates a separate test file
2. **No output dependencies:** No task needs another task's output
3. **Shared foundation:** All use TASK1 (Jest) and TASK2 (utilities)
4. **No file conflicts:** No two tasks modify the same file

## Success Criteria

Each task must:
- [ ] Create comprehensive test file
- [ ] Achieve >80% code coverage for target module
- [ ] Pass all tests locally (`npm test`)
- [ ] Include proper mocking of dependencies
- [ ] Test error scenarios and edge cases

Overall project:
- [ ] All 17 test files created
- [ ] GitHub Actions workflow runs on every push/PR
- [ ] CI/CD pipeline validates all tests
- [ ] Overall project coverage >80%

## Files Structure
```
.claudiomiro/
├── EXECUTION_PLAN.md        # Detailed execution plan
├── README.md                 # This file
├── TASK1/
│   ├── TASK.md              # Human-readable task description
│   └── PROMPT.md            # Claude-optimized prompt
├── TASK2/
│   ├── TASK.md
│   └── PROMPT.md
...
└── TASK17/
    ├── TASK.md
    └── PROMPT.md
```

## Next Steps

1. Execute TASK1 to set up Jest and GitHub Actions
2. Execute TASK2 to create test utilities
3. Execute TASK3-17 in parallel (can be distributed to multiple agents/workers)
4. Verify all tests pass in CI/CD
5. Review coverage reports

## Parallelization Benefits

- **Time reduction:** 15 tasks run simultaneously instead of sequentially
- **Resource efficiency:** Each task is independent and self-contained
- **Scalability:** Can distribute to multiple developers/agents
- **Risk mitigation:** Failure in one test doesn't block others
