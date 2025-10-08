# Task: Create Terminal UI Renderer Utility

## Objective
Build a low-level terminal control utility that handles clearing the screen, positioning the cursor, and redrawing multi-line content. This provides the foundation for creating a live-updating, animated parallel task display.

## Assumptions
- Terminal supports ANSI escape codes (most modern terminals do)
- Screen width can be determined via `process.stdout.columns` (default to 80 if unavailable)
- UI will be redrawn frequently (every 100-500ms when tasks are running)
- Need to track number of lines drawn to clear them on next render
- Windows CMD may have limited ANSI support (acceptable limitation)
- Cursor should be hidden during updates to prevent flicker

## Dependencies
- **Depends on:** NONE
- **Blocks:** TASK5
- **Parallel with:** TASK1

## Files Affected
**CREATE:**
- src/utils/terminal-renderer.js
- src/utils/__tests__/terminal-renderer.test.js

**MODIFY:**
- None (foundation utility)

## Steps to Implement
1. Create `src/utils/terminal-renderer.js` with TerminalRenderer class
2. Implement `clearLines(count)` method using ANSI escape codes to clear N lines
3. Implement `moveCursorUp(count)` to move cursor up N lines
4. Implement `moveCursorToColumn(col)` to position cursor at column
5. Implement `hideCursor()` and `showCursor()` for flicker-free updates
6. Implement `getTerminalWidth()` to get current terminal width (default 80)
7. Implement `clearScreen()` for full screen clear
8. Create `renderBlock(lines)` that clears previous content and renders new lines
9. Track internal state for last rendered line count
10. Add unit tests mocking process.stdout
11. Test edge cases: very wide terminals, very narrow terminals, missing stdout.columns

## Research Summary
- **ANSI codes needed:**
  - `\x1b[<N>A` - Move cursor up N lines
  - `\x1b[2K` - Clear current line
  - `\x1b[?25l` - Hide cursor
  - `\x1b[?25h` - Show cursor
  - `\x1b[<N>G` - Move to column N
- **Key library:** Node.js built-in `process.stdout.write()`
- **Testing approach:** Mock process.stdout and verify ANSI codes written
- **Edge cases:**
  - Terminal width unavailable → default to 80
  - Clearing more lines than exist → gracefully handle
  - Rapid successive renders → track state correctly

## Acceptance Criteria (Rigorous)
- [ ] TerminalRenderer class exists and can be instantiated
- [ ] clearLines(count) writes correct ANSI codes to clear N lines
- [ ] moveCursorUp(count) writes correct ANSI code `\x1b[<N>A`
- [ ] hideCursor() and showCursor() write correct ANSI codes
- [ ] getTerminalWidth() returns process.stdout.columns or 80 default
- [ ] clearScreen() clears entire terminal screen
- [ ] renderBlock(lines) clears previous render and outputs new lines
- [ ] Internal state tracks last line count for proper clearing
- [ ] Unit tests mock process.stdout and verify ANSI code output
- [ ] All tests pass with `npm test -- terminal-renderer.test.js`
- [ ] Edge cases handled: no columns value, very large/small widths
- [ ] No actual terminal output during tests (all mocked)

## Self-Verification Logic
Before marking this task as completed:
1. Run `npm test -- terminal-renderer.test.js` → all tests pass
2. Verify ANSI codes are correct by checking test assertions
3. Check all acceptance criteria met via code review
4. If any criterion fails → mark as "RETRY REQUIRED" and fix
5. If all pass → mark as "SUCCESS"

## Reasoning Trace
**Why this approach?**
- ANSI escape codes are universal standard for terminal control
- Separating terminal control from business logic keeps code modular
- Tracking line count enables efficient clearing (only clear what was drawn)
- Hiding cursor during updates prevents visual flicker

**What alternatives were rejected?**
- Third-party libraries (blessed, ink): Too heavy, unnecessary for simple rendering
- Full-screen TUI framework: Overkill, need simple line-based updates
- Direct console.log: Can't clear previous content, would cause scrolling

**What risks exist?**
- ANSI codes might not work on old Windows terminals (acceptable, most users have modern terminals)
- Very fast updates could cause flicker (mitigated by hiding cursor)
- Terminal resize during operation (acceptable limitation, would fix on next render)

## Escalation Protocol
If blocked or encountering undefined behavior:
1. Stop execution
2. Save state in /Users/samuelfajreldines/Desenvolvimento/claudiomiro copy/.claudiomiro/BLOCKED.md
3. Add entry: reason, attempted fix, next suggestion

## Verify
```bash
npm test -- terminal-renderer.test.js
```
→ Expected output: All tests pass, ANSI codes verified in assertions
