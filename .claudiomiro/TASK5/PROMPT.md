## OBJECTIVE
Create live UI rendering engine that displays all parallel tasks with animated spinners, steps, Claude messages, and total progress.
Done when:
- ParallelUIRenderer class with renderFrame() and start/stop methods
- Header shows total progress percentage
- Each task line shows spinner, name, step, and Claude message
- Color coding: green=completed, yellow=running, gray=pending, red=failed
- Different spinner types for visual distinction between tasks
- Render loop updates every 200ms using TerminalRenderer
- Unit tests verify output format and color coding
- Tests pass: `npm test -- parallel-ui-renderer.test.js`
- Handles edge cases gracefully

## DEPENDENCIES
- Requires: TASK2 (TerminalRenderer implementation)
- Provides for: TASK7 (final integration)

## PARALLELIZATION
- Layer: 1 (Core Features)
- Parallel with: TASK3, TASK4, TASK6
- Complexity: High
- Estimated effort: Large

## CONSTRAINTS
- Include tests with implementation
- TODO.md first line: "Fully implemented: NO"
- No manual/deployment steps
- TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO
- Must use existing dependencies (chalk, ora) for styling
- Update frequency must be 200ms (not faster/slower)
- Must use TerminalRenderer for all terminal operations

## RISKS & MITIGATIONS
1. **Terminal flicker during updates** → Use TerminalRenderer.hideCursor() before render, showCursor() after
2. **Layout breaks on narrow terminals** → Truncate lines that exceed terminal width
3. **CPU usage from frequent renders** → 200ms interval is reasonable, only render when tasks active
4. **Spinner animation conflicts** → Use ora spinner frames, rotate through different types
5. **Color codes not showing** → Test chalk output, verify terminal supports colors

## ACCEPTANCE CRITERIA (Detailed)
- [ ] File `src/services/parallel-ui-renderer.js` exists and exports ParallelUIRenderer class
- [ ] Constructor initializes with TerminalRenderer instance
- [ ] `renderFrame(taskStates, totalProgress)` method returns array of formatted line strings
- [ ] Header line: `chalk.bold.white('Total Complete: ') + chalk.cyan(totalProgress + '%')`
- [ ] Task line format: `${spinner} ${taskName}: ${step} - Claude: ${message}`
- [ ] Spinner types cycle through: ['dots', 'line', 'arrow', 'bouncingBar'] based on task index
- [ ] Color coding implemented with chalk: completed=green, running=yellow, pending=gray, failed=red
- [ ] `start(stateManager, progressCalculator)` creates setInterval(200ms) that calls renderFrame + terminalRenderer.renderBlock
- [ ] `stop()` calls clearInterval and renders final static frame
- [ ] Unit tests mock TerminalRenderer and verify renderBlock called with correct formatted lines
- [ ] Tests verify color coding for all task states
- [ ] Tests pass: `npm test -- parallel-ui-renderer.test.js`
