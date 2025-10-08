## OBJECTIVE
Modify Claude executor to capture and update ParallelStateManager with Claude's latest message per task in real-time.
Done when:
- executeClaude() accepts optional taskName parameter
- ParallelStateManager updated with latest Claude message when taskName provided
- All step files (step2, step3, code-review, step4) pass task name to executeClaude()
- Backward compatibility maintained (works without taskName)
- State updates happen in real-time as messages stream
- Unit tests verify state updates with correct task names
- Tests pass: `npm test -- claude-executor.test.js`
- Parallel executions update separate state entries correctly

## DEPENDENCIES
- Requires: TASK1 (ParallelStateManager implementation)
- Provides for: TASK7 (final integration)

## PARALLELIZATION
- Layer: 1 (Core Features)
- Parallel with: TASK3, TASK5, TASK6
- Complexity: Medium
- Estimated effort: Medium

## CONSTRAINTS
- Include tests with implementation
- TODO.md first line: "Fully implemented: NO"
- No manual/deployment steps
- TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO
- Must maintain backward compatibility (optional parameter)
- State updates must not block Claude execution
- Must modify all step files consistently

## RISKS & MITIGATIONS
1. **Breaking existing step calls** → Make taskName parameter optional with default null
2. **Performance impact from frequent updates** → State updates are synchronous and fast, no blocking
3. **Task name mismatches** → Use consistent task names from DAG executor
4. **Parallel execution conflicts** → State manager handles concurrent updates safely (TASK1)
5. **Tests becoming complex** → Mock state manager, verify calls with specific matchers

## ACCEPTANCE CRITERIA (Detailed)
- [ ] Function signature: `executeClaude(text, taskName = null)` in claude-executor.js
- [ ] ParallelStateManager imported: `const { ParallelStateManager } = require('./parallel-state-manager')`
- [ ] Get singleton instance: `const stateManager = ParallelStateManager.getInstance()`
- [ ] In stdout handler, after `const text = processClaudeMessage(line)`, if text and taskName: `stateManager.updateClaudeMessage(taskName, text)`
- [ ] step2.js updated: `await executeClaude(prompt, taskName)`
- [ ] step3.js updated: `await executeClaude(prompt, taskName)`
- [ ] code-review.js updated: `await executeClaude(prompt, taskName)`
- [ ] step4.js updated: `await executeClaude(prompt, taskName)`
- [ ] Unit tests mock ParallelStateManager.getInstance() and verify updateClaudeMessage() calls
- [ ] Tests verify correct task names passed: `npm test -- claude-executor.test.js`
- [ ] Legacy tests without taskName still pass (backward compatibility verified)
