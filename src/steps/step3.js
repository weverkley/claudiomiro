const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');

const step3 = (task) => {
    const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    if(fs.existsSync(folder('CODE_REVIEW.md'))){
      fs.rmSync(folder('CODE_REVIEW.md'));
    }

    return executeClaude(`
PHASE: EXECUTION LOOP (DEPENDENCY + SAFETY)

CRITICAL RULES:
- DO NOT create any git commits (commits happen only in the final step)
- DO NOT run git add, git commit, or git push commands
- First line of ${folder('TODO.md')} MUST BE "Fully implemented: YES" or "Fully implemented: NO"
- **MULTI-REPOSITORY SUPPORT:** You can work across multiple repositories and directories simultaneously. Files being in different repositories is NOT a valid reason to block a task.

OBJECTIVE
- Implement all actionable items in ${folder('TODO.md')}
- Remove all blockers or manual tasks that Claude cannot perform
- Do NOT mark items as BLOCKED just because files are in different repositories

---

### OPERATING LOOP
1. Read ${folder('TODO.md')} and update "Fully implemented:" to YES/NO.
2. Pick one uncompleted item.
3. Apply BLOCKED POLICY if it has "BLOCKED:".
4. Perform the work required by the item.
   - If successful → mark as [X].
   - If failed → add sub-bullet "FAILED: <cause>".
5. If all items completed → run TEST STRATEGY.

---

### TEST STRATEGY
- Run smoke tests (typecheck, lint, build, short tests).
- Test affected modules and directly related modules only.
- Do not run full regression (done later).
- Follow TEST FAILURE POLICY.

---

### TEST FAILURE POLICY
- If any test fails:
  - Identify module and cause.
  - Reopen the related TODO item.
  - Add "FAILED: test failure in <module>".
  - Return to step 2.

---

### EXIT CONDITION
- Stop only when:
  - All items are marked as [X] or BLOCKED/FAILED, **and**
  - "Fully implemented: YES" confirmed after test re-run.

---

### BLOCKED POLICY
- Item with "BLOCKED:" → skip, mark checked, note "blocked-skip" result.
- **IMPORTANT:** Files being in different repositories/directories is NOT a valid blocker. Only mark items as BLOCKED if they require manual intervention or are truly impossible for Claude to perform.

---

### STOP-DIFF
- Never rename TODO items or modify unrelated files.
- Never change contract files unless explicitly allowed by BREAKING node.

---

### CHANGE ATOMICITY
- Each item = one atomic change.
- Merge only logically dependent consecutive items.

---

### MCP USAGE
- You may use external tools (MCPs) for static analysis, testing, or diffing.
- Never modify TODO.md or unrelated files using MCPs.

---

### OUTPUT
- Updated ${folder('TODO.md')} with accurate state and failure notes.
    `, task);
}

module.exports = { step3 };
