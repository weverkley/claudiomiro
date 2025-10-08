const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');

const step3 = (task) => {
    const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    if(fs.existsSync(folder('CODE_REVIEW.md'))){
      fs.rmSync(folder('CODE_REVIEW.md'));
    }

    return executeClaude(`PHASE: EXECUTION LOOP (DEPENDENCY + SAFETY)

CRITICAL RULES:
- DO NOT create git commits (commits happen only in the final step)
- DO NOT run git add, git commit, or git push commands
- First line of ${folder('TODO.md')} MUST BE "Fully implemented: YES" or "Fully implemented: NO"
- **MULTI-REPOSITORY SUPPORT:** You can work across multiple repositories and directories simultaneously. Files being in different repositories is NOT a valid reason to block a task.
- Do NOT mark items as BLOCKED just because files are in different repositories.

---

### INIT PHASE
1. Verify that ${folder('TODO.md')} exists and is readable.
2. Validate first line syntax ("Fully implemented: YES" or "Fully implemented: NO").
3. If malformed or missing → halt execution and log ERROR.

---

### OBJECTIVE
- Remove all blockers or manual tasks that Claude cannot perform.
- Implement all actionable items in ${folder('TODO.md')} (in parallel if possible).

---

### OPERATING LOOP
1. Read ${folder('TODO.md')}.
   - Evaluate completion of all items.
   - Update "Fully implemented:" to **YES** if all items completed and passed tests, otherwise **NO**.

2. Identify all uncompleted items.
   - Handle sequentially until reaching time/resource limits, prioritizing accuracy.

3. Apply **BLOCKED POLICY**:
   - If "BLOCKED:" found → log reason, skip execution.

4. For each executable item:
   - Perform required work.
   - If successful → mark as \`[X]\`.
   - If failed → add \`FAILED: <cause>\`.

5. Once all items are marked \`[X]\`:
   - Run **TEST STRATEGY**.
   - If all tests pass → confirm \`"Fully implemented: YES"\`.  
     Else revert to \`"NO"\` and document failures.

---

### TEST STRATEGY
- Test affected modules and their direct dependents.
- If no tests found → perform static type/syntax checks.
- Run only relevant tests/linters/typechecks for modified paths:
  - e.g. \`npm test ./folder-example\`, \`eslint ./folder-example\`, \`tsc --noEmit ./folder-example/index.ts\`
- DO NOT run full-project checks (done in final phase).
- Follow **TEST FAILURE POLICY**.

---

### TEST FAILURE POLICY
- If any test fails:
  - Identify module and cause.
  - Reopen related TODO item.
  - Add "FAILED: test failure in <module>".
  - Return to step 2.

---

### BLOCKED POLICY
- Items with "BLOCKED:" → skip execution, keep unchecked, log reason.
- Only mark BLOCKED if human/manual or external dependency required.

---

### STOP-DIFF
- Never rename TODO items or modify unrelated files.
- Never reformat or rewrite entire files; restrict diffs to minimal scope.
- Never change contract files unless explicitly allowed by BREAKING node.

---

### CHANGE ATOMICITY
- Each item represents one atomic change.
- Merge only logically dependent consecutive items.

---

### FAILURE RECOVERY
- If any operation causes unresolvable build or logic failure:
   - Revert file to last known good state.
   - Add "ROLLBACK: <reason>" under the failed item.

---

### STATE PERSISTENCE
- Persist updated ${folder('TODO.md')} and logs before restarting loop.

---

### MCP USAGE
- You MAY use external tools (MCPs) for static analysis, testing, or diffing.
- Never use MCPs to modify TODO.md or unrelated files.

---

### EXIT CONDITION
- Exit when all items are \`[X]\` or BLOCKED/FAILED, and "Fully implemented: YES" is confirmed.
    `, task);
}

module.exports = { step3 };
