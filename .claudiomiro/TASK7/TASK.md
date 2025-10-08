# Task: Wire Parallel Logging into DAG Executor Main Loop

## Objective
Integrate all parallel logging components into the DAG executor's main execution loop, replacing the old sequential logging with the new live-updating parallel task UI.

## Assumptions
- All foundation tasks completed (TASK1-6)
- ParallelStateManager is tracking all task states (TASK3 done)
- Claude executor is updating messages per task (TASK4 done)
- UI renderer can display live parallel task status (TASK5 done)
- Progress calculator provides total completion percentage (TASK6 done)
- Need to replace old logger calls with new parallel UI
- Old log.txt file should still be written for debugging
- UI should start when first task runs, stop when all tasks complete

## Dependencies
- **Depends on:** TASK3, TASK4, TASK5, TASK6
- **Blocks:** None (final integration task)
- **Parallel with:** None

## Files Affected
**CREATE:**
- None

**MODIFY:**
- src/services/dag-executor.js (integrate parallel UI renderer)
- src/services/__tests__/dag-executor.test.js (verify integration)

## Steps to Implement
1. Import ParallelUIRenderer in dag-executor.js
2. Import calculateProgress utility in dag-executor.js
3. Initialize UI renderer in run() method before execution loop
4. Start UI renderer with state manager and progress calculator
5. Remove old logger.info() calls that show task progress (keep error/success logs)
6. Let UI renderer handle all visual updates during execution
7. Stop UI renderer after execution completes (all tasks done)
8. Show final summary using existing logger (completed/failed counts)
9. Ensure log.txt file is still written by Claude executor (unchanged)
10. Update unit tests to mock UI renderer and verify start/stop called
11. Test that UI updates happen during parallel execution
12. Verify old functionality preserved (errors logged, final summary shown)

## Research Summary
- **Integration points:**
  - run() method start: Initialize and start UI renderer
  - Main execution loop: UI updates automatically via internal interval
  - run() method end: Stop UI renderer, show final summary
- **Cleanup needed:**
  - Remove logger.info() for individual task updates
  - Keep logger.error() for failures
  - Keep logger.success() for final summary
- **Testing approach:**
  - Mock ParallelUIRenderer
  - Verify start() called with correct parameters
  - Verify stop() called after execution
  - Verify state manager and progress calculator passed correctly
- **Backward compatibility:**
  - log.txt still written by Claude executor
  - Final summary still shown
  - Error handling unchanged

## Acceptance Criteria (Rigorous)
- [ ] ParallelUIRenderer imported in dag-executor.js
- [ ] calculateProgress imported in dag-executor.js
- [ ] UI renderer instantiated in run() method: `const uiRenderer = new ParallelUIRenderer()`
- [ ] UI renderer started before execution: `uiRenderer.start(this.stateManager, calculateProgress)`
- [ ] Old logger.info() calls for task progress removed (lines 53, 74, 96, 117, etc.)
- [ ] UI renderer stopped after execution: `uiRenderer.stop()`
- [ ] Final summary still shown with logger.success() (existing code preserved)
- [ ] Error logging still works (logger.error() calls preserved)
- [ ] log.txt file still written by Claude executor (no changes to that flow)
- [ ] Unit tests mock UI renderer and verify start/stop lifecycle
- [ ] All tests pass: `npm test -- dag-executor.test.js`
- [ ] Integration verified: parallel tasks show live UI updates

## Self-Verification Logic
Before marking this task as completed:
1. Run `npm test -- dag-executor.test.js` → all tests pass
2. Verify UI renderer start/stop called correctly via test assertions
3. Check old logger calls removed, new UI integrated
4. Manual test: run parallel tasks, verify live UI appears
5. If any criterion fails → mark as "RETRY REQUIRED" and fix
6. If all pass → mark as "SUCCESS"

## Reasoning Trace
**Why this approach?**
- Minimal changes to existing DAG executor logic (just add UI layer)
- UI renderer encapsulates all display logic (clean separation)
- State manager and progress calculator work together seamlessly
- Old log.txt debugging preserved for troubleshooting
- Final summary still provides high-level overview

**What alternatives were rejected?**
- Replacing logger entirely: Too risky, breaks error handling
- Manual UI updates in DAG executor: Couples rendering with execution logic
- Separate process for UI: Overkill, adds IPC complexity
- Streaming updates to external tool: Unnecessary, built-in terminal works

**What risks exist?**
- UI rendering breaks DAG execution flow (mitigated by try/catch in renderer)
- Performance impact from UI updates (mitigated by 200ms interval, async rendering)
- Terminal compatibility issues (acceptable, works on modern terminals)
- Tests becoming flaky due to timing (mitigated by proper mocking)

## Escalation Protocol
If blocked or encountering undefined behavior:
1. Stop execution
2. Save state in /Users/samuelfajreldines/Desenvolvimento/claudiomiro copy/.claudiomiro/BLOCKED.md
3. Add entry: reason, attempted fix, next suggestion

## Verify
```bash
npm test -- dag-executor.test.js
```
→ Expected output: All tests pass, UI renderer lifecycle verified

**Manual verification:**
```bash
claudiomiro --mode=auto
```
→ Expected: Live parallel task UI appears, updates in real-time
