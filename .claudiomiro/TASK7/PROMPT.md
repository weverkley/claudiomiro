## OBJECTIVE
Integrate all parallel logging components into DAG executor's main loop, replacing sequential logging with live-updating parallel task UI.
Done when:
- ParallelUIRenderer and calculateProgress imported in dag-executor.js
- UI renderer initialized and started in run() method with state manager and progress calculator
- Old sequential logger.info() calls for task updates removed
- UI renderer stopped after execution completes
- Final summary and error logging preserved (logger.success/error)
- log.txt file still written (Claude executor unchanged)
- Unit tests verify UI renderer start/stop lifecycle
- Tests pass: `npm test -- dag-executor.test.js`
- Manual test shows live parallel UI during execution

## DEPENDENCIES
- Requires: TASK3 (state tracking), TASK4 (message capture), TASK5 (UI renderer), TASK6 (progress calc)
- Provides for: None (final integration)

## PARALLELIZATION
- Layer: 2 (Integration)
- Parallel with: None (depends on all Layer 1 tasks)
- Complexity: Medium
- Estimated effort: Medium

## CONSTRAINTS
- Include tests with implementation
- TODO.md first line: "Fully implemented: NO"
- No manual/deployment steps
- TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO
- Must not break existing DAG executor functionality
- Must preserve error handling and final summary
- Must keep log.txt file writing (debugging)
- UI must start before first task, stop after last task

## RISKS & MITIGATIONS
1. **UI rendering breaks execution flow** → Wrap UI calls in try/catch, don't let UI errors stop tasks
2. **Performance degradation** → UI renderer uses efficient 200ms interval, minimal impact
3. **Tests become flaky** → Properly mock UI renderer, verify method calls not output
4. **Terminal compatibility** → Document modern terminal requirement, acceptable limitation
5. **Regression in existing features** → Keep all error handling and final summary logic intact

## ACCEPTANCE CRITERIA (Detailed)
- [ ] Imports added: `const { ParallelUIRenderer } = require('./parallel-ui-renderer');`
- [ ] Import added: `const { calculateProgress } = require('../utils/progress-calculator');`
- [ ] In run() method, before while loop: `const uiRenderer = new ParallelUIRenderer();`
- [ ] Before while loop: `uiRenderer.start(this.getStateManager(), calculateProgress);`
- [ ] After while loop: `uiRenderer.stop();`
- [ ] Removed: logger.info() calls at lines ~53, 74, 96, 117, 139 (task progress updates)
- [ ] Preserved: logger.error() for failures (lines ~164, 204)
- [ ] Preserved: logger.success() for final summary (line ~216)
- [ ] Unit tests mock ParallelUIRenderer constructor and start/stop methods
- [ ] Tests verify start() called with stateManager and calculateProgress
- [ ] Tests verify stop() called after execution completes
- [ ] All tests pass: `npm test -- dag-executor.test.js`
- [ ] No regression in existing functionality (errors and summary still work)
