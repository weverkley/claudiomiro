@dependencies [TASK2]

<!-- DEPENDENCY REASONING -->
## Dependency Analysis
- **Dependencies:** TASK2 (TerminalRenderer)
- **Reasoning:**
  - **Import Dependency:** Imports and uses `TerminalRenderer` class from `src/utils/terminal-renderer.js` (created by TASK2)
  - **Cannot parallelize with TASK2:** Needs TerminalRenderer class methods (`renderBlock()`, `hideCursor()`, `showCursor()`) to exist
  - **Logical dependency:** Relies on TerminalRenderer API for all terminal control operations
- **Assumptions:**
  - TerminalRenderer API from TASK2 is stable (renderBlock, hideCursor, showCursor methods exist)
  - chalk and ora libraries are available in dependencies
  - ParallelStateManager data format is known (but doesn't import the file - receives data at runtime)
  - 200ms interval won't cause performance issues
  - Terminal supports color codes (chalk)
- **Blocks:** TASK7 (which imports ParallelUIRenderer)
- **Parallel with:** TASK3 (different files), TASK4 (different files), TASK6 (different files)
- **Risks:**
  - TerminalRenderer API mismatch could break rendering
  - Color codes might not work on all terminals (acceptable limitation)
  - Spinner animations could cause flicker (mitigated by cursor hiding)
  - Layout might break on very narrow terminals (acceptable, most are >80 cols)
- **Files Created:** `src/services/parallel-ui-renderer.js`, `src/services/__tests__/parallel-ui-renderer.test.js`
- **Files Modified:** None
- **File Conflicts:** None (unique files)
- **Parallelization Opportunity:** Can run simultaneously with TASK3, TASK4, TASK6 (Wave 2, after TASK2)

# Task: Build Live UI Rendering Engine with Progress

## Objective
Create a live UI rendering engine that displays all parallel tasks with spinners, current step, Claude messages, and total progress. The UI should update in real-time, replacing itself instead of scrolling.

## Assumptions
- TerminalRenderer utility is already implemented (TASK2 completed)
- ParallelStateManager provides all task states (TASK1 completed)
- UI should update every 200ms while tasks are running
- Each task gets a unique spinner type for visual distinction
- Layout format: "Total Complete: X%" header, then one line per task
- Task line format: `<SPINNER> TASK_NAME: Step X - Description - Claude: message`
- Color coding: green (completed), yellow (running), gray (pending), red (failed)
- Maximum message length already truncated by state manager (100 chars)
- Use ora spinners for animation (already in dependencies)

## Dependencies
- **Depends on:** TASK2 (TerminalRenderer must exist)
- **Blocks:** TASK7
- **Parallel with:** TASK3, TASK4, TASK6

## Files Affected
**CREATE:**
- src/services/parallel-ui-renderer.js
- src/services/__tests__/parallel-ui-renderer.test.js

**MODIFY:**
- None (standalone rendering engine)

## Steps to Implement
1. Create `src/services/parallel-ui-renderer.js` with ParallelUIRenderer class
2. Import TerminalRenderer and required libraries (chalk, ora)
3. Define spinner types array for different tasks (dots, line, arrow, etc.)
4. Implement `renderFrame(taskStates, totalProgress)` method that builds UI lines
5. Format header line with total progress percentage
6. Format each task line with spinner, name, step, and Claude message
7. Apply color coding based on task status (chalk colors)
8. Implement `start(stateManager, progressCalculator)` to begin render loop
9. Create interval that fetches state and re-renders every 200ms
10. Implement `stop()` to clear interval and show final state
11. Use TerminalRenderer to clear and redraw UI each frame
12. Add unit tests mocking TerminalRenderer and verifying output format
13. Test different task states and ensure correct formatting

## Research Summary
- **Spinner types in ora:** dots, line, arrow, bouncingBar, bouncingBall, clock, etc.
- **Color coding with chalk:**
  - Completed: chalk.green
  - Running: chalk.yellow
  - Pending: chalk.gray
  - Failed: chalk.red
- **Update frequency:** 200ms provides smooth animation without excessive CPU
- **Layout pattern:** Clear previous frame → render new frame → repeat
- **Testing approach:** Mock TerminalRenderer.renderBlock, verify line content and format
- **Edge cases:**
  - No tasks running (show static state)
  - Very long task names (truncate)
  - Terminal too narrow (graceful degradation)

## Acceptance Criteria (Rigorous)
- [ ] ParallelUIRenderer class exists and can be instantiated
- [ ] `renderFrame(taskStates, totalProgress)` returns array of formatted lines
- [ ] Header line format: `Total Complete: <percentage>%`
- [ ] Task line format: `<spinner> <TASK>: <step> - Claude: <message>`
- [ ] Color coding applied: green=completed, yellow=running, gray=pending, red=failed
- [ ] Different spinner types assigned to different tasks (cycling through types)
- [ ] `start(stateManager, progressCalculator)` begins 200ms interval render loop
- [ ] `stop()` clears interval and renders final state
- [ ] Uses TerminalRenderer.renderBlock() for clearing and redrawing
- [ ] Unit tests verify output format and color coding
- [ ] All tests pass: `npm test -- parallel-ui-renderer.test.js`
- [ ] Edge cases handled: empty tasks, very long names, narrow terminals

## Self-Verification Logic
Before marking this task as completed:
1. Run `npm test -- parallel-ui-renderer.test.js` → all tests pass
2. Verify output format matches specification via test assertions
3. Check color coding logic is correct for all statuses
4. If any criterion fails → mark as "RETRY REQUIRED" and fix
5. If all pass → mark as "SUCCESS"

## Reasoning Trace
**Why this approach?**
- 200ms update interval provides smooth animation without performance impact
- Different spinners per task improve visual distinction
- Color coding makes status immediately obvious
- TerminalRenderer handles low-level ANSI complexity
- Separating rendering from state management keeps concerns isolated

**What alternatives were rejected?**
- Full TUI framework (blessed/ink): Too heavy, unnecessary complexity
- Static progress bars: Less engaging, no real-time feeling
- Single spinner for all tasks: Harder to track individual task progress
- Faster update rate (<100ms): Unnecessary CPU usage, no visual benefit

**What risks exist?**
- Terminal flicker if updates too fast (mitigated by 200ms interval and cursor hiding)
- Layout breaks on very narrow terminals (acceptable, most terminals are >80 cols)
- CPU usage from frequent renders (mitigated by efficient rendering, only updates when needed)

## Escalation Protocol
If blocked or encountering undefined behavior:
1. Stop execution
2. Save state in /Users/samuelfajreldines/Desenvolvimento/claudiomiro copy/.claudiomiro/BLOCKED.md
3. Add entry: reason, attempted fix, next suggestion

## Verify
```bash
npm test -- parallel-ui-renderer.test.js
```
→ Expected output: All tests pass, UI format verified in assertions
