const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');

const step4 = (task) => {

  const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    return executeClaude(`
PHASE: QUALITY GATE & PR PACKAGING

### GATES
- All test rings passed on last iteration.
- Invariants checklist:
  [ ] coverage of affected modules not decreased
  [ ] build time within 10% of baseline
  [ ] no new error logs in tests
  [ ] no contract violations
  [ ] migrations consistent with schema

If all pass:
- Create ${folder('GITHUB_PR.md')} combining ${folder('PROMPT.md')} + ${folder('TODO.md')} + ${folder('LOG.md')}.

### PR CONTENT
- Diff summary by risk.
- Contracts changed (if any) + migration notes.
- Evidence: ring results + invariants.

If any gate fails:
- Do not create ${folder('GITHUB_PR.md')}.
- Add "FAILED: <cause>" under affected node.
    `);
}

module.exports = { step4 };
