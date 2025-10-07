const { executeClaude } = require('../services/claude-executor');

const step3 = (task) => {
    const fs = require('fs');
    const path = require('path');

    if(fs.existsSync(path.join(task, 'CODE_REVIEW.md'))){
      fs.rmSync(path.join(task, 'CODE_REVIEW.md'));
    }

    return executeClaude(`
PHASE: EXECUTION LOOP (DEPENDENCY + SAFETY)

OBJECTIVE
- Implement ${task}/TODO.md items one at a time following DAG order.
- ULTRA IMPORTANT: ${task}/TODO.md REMOVE ALL BLOCKERS AND THINGS THAT CLAUDE CANNOT DO OR IS WAITING FOR THE USER.

### TEST STRATEGY (rings)
- R0 — smoke: typecheck/lint/build + short tests.
- R1 — affected modules only.
- R2 — full regression.
Pass required on all rings before check.

### CHANGE FENCE
- After implementation, run "git diff --name-only".
- Must be subset of change_fence.allowlist.
- If not, mark "FAILED: change fence violated (<file>)" and do not check.

### CONTRACT GATE
- Run contract tests for any touched contract.
- Failures → do not check.

### HIGH-RISK POLICY
- If risk_budget=high → enable SHADOW MODE:
  - Keep old vs new impl under feature flag.
  - Run A/B comparators on same fixtures.
  - Differences block checkbox.

### DIFF GUARD
- Denylist or unintended contract change → "FAILED: unintended diff".

### OPERATING LOOP
1. Read ${task}/TODO.md and update first line to YES/NO.
2. Pick next node whose prereqs are all checked.
3. Apply BLOCKED POLICY if it has "BLOCKED:".
4. Implement.
5. Run proofs (R0→R1→R2, contracts, fences).
6. If all pass:
   - Flip "- [ ]"→"- [X]" for the node.
   - Append to Progress Log:
     - timestamp
     - files, cmds
     - ring results
     - fence result
     - result: pass|blocked-skip
7. If any fail:
   - Add sub-bullet "FAILED: <cause>".

### STOP-DIFF
- Do not alter TODO item names or unrelated files.
- No contract file edits without BREAKING node.

### BLOCKED POLICY
- Node with "BLOCKED:" → skip + mark checked + result "blocked-skip".

- ULTRA IMPORTANT: ${task}/TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO - remove them.
- ULTRA IMPORTANT: ${task}/TODO.md CAN'T MANUAL ACTIONS THAT CLAUDE CANNOT DO - remove them.

### OUTPUT
- Updated ${task}/TODO.md + Progress Log summary.
Use context7.
    `);
}

module.exports = { step3 };
