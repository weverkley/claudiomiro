@dependencies []

<!-- DEPENDENCY REASONING -->
## Dependency Analysis
- **Dependencies:** None (Foundation Layer)
- **Reasoning:** Creates new files in `src/services/` with no imports from other tasks. This is a foundational infrastructure component that provides state management services to other tasks.
- **Assumptions:**
  - Directory `src/services/` exists or can be created
  - Jest testing framework is available
  - No existing state management conflicts
  - Singleton pattern works correctly in Node.js environment
- **Blocks:** TASK3 (imports ParallelStateManager), TASK4 (imports ParallelStateManager)
- **Parallel with:** TASK2 (different files, `utils/` vs `services/`), TASK6 (different files, no imports)
- **Risks:**
  - None identified - foundation task with no dependencies
  - State manager API must be stable before TASK3/TASK4 begin
- **Files Created:** `src/services/parallel-state-manager.js`, `src/services/__tests__/parallel-state-manager.test.js`
- **Files Modified:** None
- **File Conflicts:** None
- **Parallelization Opportunity:** Can run simultaneously with TASK2 and TASK6 (Wave 1)

# Task: Create Parallel Task State Manager

## Objective
Build a centralized state manager that tracks the real-time status, current step, and latest Claude message for all parallel tasks. This enables the UI to display live updates showing what each task is doing simultaneously.

## Assumptions
- Tasks can be in states: 'pending', 'running', 'completed', 'failed'
- Steps are numbered (e.g., "Step 2", "Step 3", "Step 3.1", "Step 4")
- Claude messages should be truncated if too long (max ~100 chars for UI display)
- State updates will come from multiple async sources (need thread-safe operations)
- The state manager should be a singleton to ensure single source of truth
- Initial state can be built from DAG executor's task list

## Dependencies
- **Depends on:** NONE
- **Blocks:** TASK3, TASK4, TASK6
- **Parallel with:** TASK2

## Files Affected
**CREATE:**
- src/services/parallel-state-manager.js
- src/services/__tests__/parallel-state-manager.test.js

**MODIFY:**
- None (foundation module)

## Steps to Implement
1. Create `src/services/parallel-state-manager.js` with ParallelStateManager class
2. Implement initialization method that accepts tasks object from DAG executor
3. Add method to update task status (pending/running/completed/failed)
4. Add method to update current step for a task (e.g., "Step 3.1 - Code Review")
5. Add method to update Claude's latest message for a task
6. Implement getter to retrieve all task states for UI rendering
7. Add message truncation logic (keep last 100 chars with "..." prefix if needed)
8. Ensure thread-safety using proper Node.js patterns (avoid race conditions)
9. Create comprehensive unit tests covering all state transitions
10. Test edge cases: concurrent updates, long messages, invalid task names

## Research Summary
- **Pattern needed:** Singleton pattern for single state instance
- **Key consideration:** Node.js is single-threaded but async operations can interleave
- **Thread-safety approach:** Synchronous state updates (no await in setters) to avoid race conditions
- **Testing library:** Jest (already in project dependencies)
- **Edge cases to handle:**
  - Unknown task names (graceful ignore)
  - Null/undefined messages (default to empty)
  - Very long Claude messages (truncate with ellipsis)

## Acceptance Criteria (Rigorous)
- [ ] ParallelStateManager class exists and can be instantiated
- [ ] initialize(tasks) method correctly sets up state for all tasks
- [ ] updateTaskStatus(taskName, status) updates status correctly
- [ ] updateTaskStep(taskName, step) updates step information
- [ ] updateClaudeMessage(taskName, message) stores truncated message (max 100 chars)
- [ ] getAllTaskStates() returns object with all task data in correct format
- [ ] Messages longer than 100 chars are truncated with "..." prefix
- [ ] State updates are synchronous and don't cause race conditions
- [ ] Unit tests achieve >90% code coverage
- [ ] All tests pass with `npm test -- parallel-state-manager.test.js`
- [ ] Handles edge cases gracefully (no crashes on invalid input)

## Self-Verification Logic
Before marking this task as completed:
1. Run `npm test -- parallel-state-manager.test.js` → all tests pass
2. Check test coverage report → >90% coverage achieved
3. Verify all acceptance criteria are met by reviewing code and test output
4. If any criterion fails → mark as "RETRY REQUIRED" and fix issues
5. If all pass → mark as "SUCCESS"

## Reasoning Trace
**Why this approach?**
- Singleton pattern ensures single source of truth for all parallel task states
- Synchronous updates prevent race conditions in async environment
- Truncation keeps UI clean and prevents visual overflow
- Centralized state makes it easy for UI renderer to get complete picture

**What alternatives were rejected?**
- Event emitters: More complex, harder to test, adds unnecessary indirection
- Direct state in DAG executor: Couples business logic with state management
- Database/Redis: Overkill for in-memory runtime state

**What risks exist?**
- Memory growth if Claude messages aren't truncated (mitigated by 100 char limit)
- State becoming stale if updates fail silently (mitigated by graceful error handling)
- Coupling if other modules directly access internal state (mitigated by getter methods)

## Escalation Protocol
If blocked or encountering undefined behavior:
1. Stop execution
2. Save state in /Users/samuelfajreldines/Desenvolvimento/claudiomiro copy/.claudiomiro/BLOCKED.md
3. Add entry: reason, attempted fix, next suggestion

## Verify
```bash
npm test -- parallel-state-manager.test.js
```
→ Expected output: All tests pass, coverage >90%
