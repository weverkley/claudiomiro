# Task: Add Progress Calculation and Total Completion Logic

## Objective
Implement pure logic for calculating total progress percentage across all parallel tasks, providing the data needed for the UI progress display.

## Assumptions
- ParallelStateManager provides task states (TASK1 completed)
- Progress = (completed tasks / total tasks) × 100
- Failed tasks count as completed for progress calculation (they're done, even if failed)
- Running and pending tasks don't count toward progress
- Progress should be rounded to nearest integer (no decimals)
- This is pure calculation logic, no UI rendering
- Can be a simple utility function, doesn't need full class

## Dependencies
- **Depends on:** TASK1 (ParallelStateManager must exist)
- **Blocks:** TASK7
- **Parallel with:** TASK3, TASK4, TASK5

## Files Affected
**CREATE:**
- src/utils/progress-calculator.js
- src/utils/__tests__/progress-calculator.test.js

**MODIFY:**
- None (standalone utility)

## Steps to Implement
1. Create `src/utils/progress-calculator.js` with calculateProgress() function
2. Accept task states object from ParallelStateManager
3. Count total number of tasks
4. Count tasks with status 'completed' or 'failed'
5. Calculate percentage: (completed+failed) / total × 100
6. Round to nearest integer using Math.round()
7. Handle edge case: 0 tasks (return 0%)
8. Export function for use by UI renderer
9. Create comprehensive unit tests with various scenarios
10. Test edge cases: all pending, all completed, mixed states, zero tasks

## Research Summary
- **Calculation formula:** `Math.round((completedCount / totalCount) * 100)`
- **Status mapping:**
  - 'completed' → counts as done
  - 'failed' → counts as done (finished, even if failed)
  - 'running' → not done yet
  - 'pending' → not done yet
- **Edge cases:**
  - Zero tasks: return 0
  - All tasks completed: return 100
  - No tasks completed: return 0
- **Testing approach:** Unit tests with predefined task states, verify correct percentage

## Acceptance Criteria (Rigorous)
- [ ] File `src/utils/progress-calculator.js` exists
- [ ] `calculateProgress(taskStates)` function exported
- [ ] Function accepts object mapping task names to state objects {status, step, message}
- [ ] Counts completed tasks correctly (status === 'completed')
- [ ] Counts failed tasks as done (status === 'failed')
- [ ] Ignores running and pending tasks
- [ ] Returns Math.round((doneCount / totalCount) * 100)
- [ ] Handles zero tasks edge case (returns 0)
- [ ] Returns integer percentage (no decimals)
- [ ] Unit tests cover all scenarios: 0%, 50%, 100%, mixed states
- [ ] All tests pass: `npm test -- progress-calculator.test.js`
- [ ] Pure function (no side effects, no state mutations)

## Self-Verification Logic
Before marking this task as completed:
1. Run `npm test -- progress-calculator.test.js` → all tests pass
2. Verify calculation logic is correct via test assertions
3. Check all edge cases covered in tests
4. If any criterion fails → mark as "RETRY REQUIRED" and fix
5. If all pass → mark as "SUCCESS"

## Reasoning Trace
**Why this approach?**
- Simple pure function is easiest to test and reason about
- Counting failed as done makes sense (task finished, even if unsuccessfully)
- Rounding to integer avoids ugly decimals in UI (60% better than 60.5%)
- Zero tasks edge case handled explicitly prevents division by zero

**What alternatives were rejected?**
- Class-based approach: Overkill for single calculation function
- Excluding failed tasks: Would show incorrect progress (tasks are done)
- Showing decimals: Clutters UI, integer percentage is sufficient
- Weighted progress by task complexity: Over-engineering, all tasks equal weight

**What risks exist?**
- Task states format changes (mitigated by clear interface contract)
- Division by zero if no tasks (mitigated by explicit edge case handling)
- Rounding errors at edges (acceptable, difference of ±1% is negligible)

## Escalation Protocol
If blocked or encountering undefined behavior:
1. Stop execution
2. Save state in /Users/samuelfajreldines/Desenvolvimento/claudiomiro copy/.claudiomiro/BLOCKED.md
3. Add entry: reason, attempted fix, next suggestion

## Verify
```bash
npm test -- progress-calculator.test.js
```
→ Expected output: All tests pass, percentages calculated correctly
