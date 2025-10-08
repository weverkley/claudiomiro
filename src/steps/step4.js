const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');

const step4 = (task) => {

  const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    return executeClaude(`
PHASE: QUALITY GATE & PR PACKAGING (Task-Specific)

CRITICAL RULES:
- DO NOT create any git commits (commits happen only in the final step)
- DO NOT run git add, git commit, or git push commands
- DO NOT run full regression or integration tests (those run in the final step)

### GATES (Task-Specific Only)

Run ONLY the tests related to THIS task:
- Typecheck/lint the modified files
- Unit tests for the modules created/modified in THIS task
- DO NOT run full test suite
- DO NOT run integration tests
- DO NOT run e2e tests

**Why?** Multiple tasks are running in parallel. Full/integration tests run only once at the end (step5).

---

If all task-specific tests pass:
- Create ${folder('GITHUB_PR.md')} explaining in one paragraph what was done.

If any fails:
    1. Do not create ${folder('GITHUB_PR.md')}.
    2. **Delete \`${folder('CODE_REVIEW.md')}\`**
    3. **Refactor \`${folder('TODO.md')}\`** to reflect all corrections, improvements, or missing details.
    4. IMPORTANT: Update the **first line** of \`${folder('TODO.md')}\` to: \`Fully implemented: NO\`

---

## How to Run Task-Specific Tests

Examples:
- \`npm test -- path/to/modified/file.test.js\` (Jest)
- \`pytest tests/specific_module_test.py\` (Python)
- \`go test ./pkg/modified-package\` (Go)
- \`cargo test module_name\` (Rust)

Focus on the FILES created/modified in THIS task's TODO.md.
`);
}

module.exports = { step4 };
