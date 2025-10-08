@dependencies [TASK1]

<!-- DEPENDENCY REASONING -->
## Dependency Analysis
- **Dependencies:** TASK1 (ParallelStateManager)
- **Reasoning:**
  - **Import Dependency:** Imports and uses `ParallelStateManager` singleton from `src/services/parallel-state-manager.js` (created by TASK1)
  - **Cannot parallelize with TASK1:** Needs the class definition to exist before message capture can update state
  - **Logical dependency:** Calls `updateClaudeMessage()` method which must be implemented first
- **Assumptions:**
  - `src/services/claude-executor.js` exists with `executeClaude()` function
  - All step files (`step2.js`, `step3.js`, `code-review.js`, `step4.js`) exist
  - ParallelStateManager singleton pattern works correctly
  - Message capture point is in stdout 'data' event handler
  - Optional parameter won't break existing calls
- **Blocks:** TASK7 (needs message capture functionality complete)
- **Parallel with:** TASK3 (modifies different files), TASK5 (modifies different files), TASK6 (modifies different files)
- **Risks:**
  - Breaking existing executeClaude() calls if parameter not truly optional
  - Task name mismatches between executor and DAG could cause state inconsistency
  - Frequent state updates might impact performance (unlikely, updates are fast)
  - Step files might have different function signatures than expected
- **Files Created:** None
- **Files Modified:** `src/services/claude-executor.js`, `src/steps/step2.js`, `src/steps/step3.js`, `src/steps/code-review.js`, `src/steps/step4.js`, `src/services/__tests__/claude-executor.test.js`
- **File Conflicts:** None (unique files not modified by other tasks)
- **Parallelization Opportunity:** Can run simultaneously with TASK3, TASK5, TASK6 (Wave 2, after TASK1)

# Task: Enhance Claude Executor for Per-Task Message Capture

## Objective
Modify the Claude executor to capture Claude's latest message per task and update the ParallelStateManager, enabling the UI to display what Claude is currently doing for each parallel task.

## Assumptions
- ParallelStateManager is already implemented (TASK1 completed)
- Claude executor currently processes messages via `processClaudeMessage()` from claude-logger
- Each executeClaude() call is associated with a specific task context
- Need to pass task name to executeClaude() for state updates
- Messages should be captured in real-time as they stream from Claude
- Only the latest message per task needs to be kept (overwrite previous)
- Message truncation is handled by ParallelStateManager (100 char limit)

## Dependencies
- **Depends on:** TASK1 (ParallelStateManager must exist)
- **Blocks:** TASK7
- **Parallel with:** TASK3, TASK5, TASK6

## Files Affected
**CREATE:**
- None

**MODIFY:**
- src/services/claude-executor.js (add task name parameter and state updates)
- src/steps/step2.js (pass task name to executeClaude)
- src/steps/step3.js (pass task name to executeClaude)
- src/steps/code-review.js (pass task name to executeClaude)
- src/steps/step4.js (pass task name to executeClaude)
- src/services/__tests__/claude-executor.test.js (update tests)

## Steps to Implement
1. Import ParallelStateManager in claude-executor.js
2. Add optional `taskName` parameter to executeClaude() function signature
3. When processing Claude messages, if taskName is provided, update state manager
4. Update state manager with latest message text after processClaudeMessage() returns content
5. Modify step2.js to pass task name when calling executeClaude()
6. Modify step3.js to pass task name when calling executeClaude()
7. Modify code-review.js to pass task name when calling executeClaude()
8. Modify step4.js to pass task name when calling executeClaude()
9. Handle case where taskName is undefined (legacy calls, no state update)
10. Update unit tests to verify state manager updates
11. Test that parallel executions correctly update separate task states

## Research Summary
- **Current flow:** executeClaude() → spawn Claude → process JSON stream → log to console
- **Modification point:** After processClaudeMessage() returns text, update state
- **State update location:** In stdout 'data' event handler, after text extraction
- **Key consideration:** taskName parameter optional for backward compatibility
- **Testing approach:** Mock ParallelStateManager, verify updateClaudeMessage() called with correct params
- **Edge cases:**
  - No task name provided (skip state update)
  - Empty messages (state manager handles gracefully)
  - Very frequent updates (state manager overwrites, no issue)

## Acceptance Criteria (Rigorous)
- [ ] executeClaude() accepts optional taskName parameter: `executeClaude(text, taskName = null)`
- [ ] ParallelStateManager imported in claude-executor.js
- [ ] State manager instance accessed (singleton pattern)
- [ ] When taskName provided and message processed, state updated via `stateManager.updateClaudeMessage(taskName, message)`
- [ ] step2.js calls `executeClaude(prompt, taskName)`
- [ ] step3.js calls `executeClaude(prompt, taskName)`
- [ ] code-review.js calls `executeClaude(prompt, taskName)`
- [ ] step4.js calls `executeClaude(prompt, taskName)`
- [ ] Legacy calls without taskName still work (backward compatible)
- [ ] Unit tests verify state updates happen with correct task names
- [ ] All tests pass: `npm test -- claude-executor.test.js`
- [ ] Parallel task executions update separate state entries correctly

## Self-Verification Logic
Before marking this task as completed:
1. Run `npm test -- claude-executor.test.js` → all tests pass
2. Verify all step files pass task name to executeClaude via code review
3. Check state manager receives correct updates via test assertions
4. If any criterion fails → mark as "RETRY REQUIRED" and fix
5. If all pass → mark as "SUCCESS"

## Reasoning Trace
**Why this approach?**
- Optional parameter maintains backward compatibility
- Updating state in stream handler ensures real-time updates
- Each step passing task name keeps coupling minimal
- Singleton state manager means no instance passing needed

**What alternatives were rejected?**
- Global variable for task name: Breaks in parallel execution
- Context object: More complex, unnecessary for single parameter
- State manager as dependency injection: Overkill, singleton is simpler

**What risks exist?**
- Frequent state updates could impact performance (unlikely, updates are fast)
- Task name mismatch between executor and state (mitigated by consistent naming)
- Messages lost if state update fails (acceptable, UI shows last successful update)

## Escalation Protocol
If blocked or encountering undefined behavior:
1. Stop execution
2. Save state in /Users/samuelfajreldines/Desenvolvimento/claudiomiro copy/.claudiomiro/BLOCKED.md
3. Add entry: reason, attempted fix, next suggestion

## Verify
```bash
npm test -- claude-executor.test.js
npm test -- step2.test.js step3.test.js step4.test.js
```
→ Expected output: All tests pass, state updates verified
