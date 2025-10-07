const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');

const step4 = (task) => {

  const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    return executeClaude(`
PHASE: QUALITY GATE & PR PACKAGING

### GATES
- Run smoke tests (typecheck, lint, build, short tests).
- Run full regression tests.

If all pass:
- Create ${folder('GITHUB_PR.md')} explaining in one paragraph what was done.

If any fails:
    1. Do not create ${folder('GITHUB_PR.md')}.
    2. **Delete \`${folder('CODE_REVIEW.md')}\`** 
    2. **Refactor \`${folder('TODO.md')}\`** to reflect all corrections, improvements, or missing details.
    3. IMPORTANT: Update the **first line** of \`${folder('TODO.md')}\` to: \`Fully implemented: NO\`
`);
}

module.exports = { step4 };
