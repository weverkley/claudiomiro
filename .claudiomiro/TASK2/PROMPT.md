## OBJECTIVE
Build a terminal control utility for clearing, positioning, and redrawing multi-line content using ANSI escape codes.
Done when:
- TerminalRenderer class with methods for cursor control and line clearing
- clearLines(count), moveCursorUp(count), hideCursor(), showCursor() implemented
- renderBlock(lines) clears previous content and renders new lines
- getTerminalWidth() returns current width or sensible default
- Internal state tracks last render for efficient clearing
- Unit tests mock process.stdout and verify ANSI codes
- All tests pass with >85% coverage
- Edge cases handled gracefully

## DEPENDENCIES
- Requires: NONE (foundation layer)
- Provides for: TASK5 (UI rendering engine)

## PARALLELIZATION
- Layer: 0 (Foundation)
- Parallel with: TASK1
- Complexity: Low
- Estimated effort: Small

## CONSTRAINTS
- Include tests with implementation
- TODO.md first line: "Fully implemented: NO"
- No manual/deployment steps
- TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO
- Must mock process.stdout in tests (no actual terminal output)
- ANSI codes must be correct and well-tested

## RISKS & MITIGATIONS
1. **ANSI codes not working on some terminals** → Document limitation, works on modern terminals
2. **Flicker during rapid updates** → Hide cursor during rendering, show after
3. **Terminal resize causing issues** → Get width on each render, handle dynamically
4. **Tests failing due to stdout mocking** → Use proper Jest mocking patterns
5. **State getting out of sync** → Reset state on each renderBlock call

## ACCEPTANCE CRITERIA (Detailed)
- [ ] File `src/utils/terminal-renderer.js` exists and exports TerminalRenderer class
- [ ] `clearLines(count)` method writes `\x1b[2K\x1b[1B` N times then `\x1b[<N>A`
- [ ] `moveCursorUp(count)` writes `\x1b[<count>A` to stdout
- [ ] `hideCursor()` writes `\x1b[?25l` and `showCursor()` writes `\x1b[?25h`
- [ ] `getTerminalWidth()` returns `process.stdout.columns` or 80 default
- [ ] `clearScreen()` writes appropriate ANSI code for full clear
- [ ] `renderBlock(lines)` clears previous lines, then writes new lines
- [ ] Internal state variable tracks last line count
- [ ] Unit tests mock `process.stdout.write` and verify exact ANSI sequences
- [ ] Tests pass: `npm test -- terminal-renderer.test.js`
- [ ] Edge cases tested: undefined columns, zero lines to clear, empty line arrays
