const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');

const step2 = (task) => {
    const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    return executeClaude(`
PHASE: IMPLEMENTATION PLANNING

Read ${folder('PROMPT.md')} and create ${folder('TODO.md')}.

**CRITICAL RULES:**
- First line MUST be: "Fully implemented: NO"
- Create 5-10 actionable items MAX (not 50+)
- Group related changes together
- Only include what Claude can do (no manual steps, no deployment)
- Each item = create/modify code + write tests

---

## TODO.md Structure

\`\`\`
Fully implemented: NO

## Implementation Plan

- [ ] **Item 1**: [Consolidated action - what to build + tests]
  - Files: [list 2-3 main files]
  - Tests: [what to test]

- [ ] **Item 2**: [Another consolidated action]
  - Files: [list 2-3 main files]
  - Tests: [what to test]

[... 3-8 more items total ...]

## Verification
- [ ] All tests pass
- [ ] Code builds without errors
- [ ] Feature works as expected
\`\`\`

---

## Your Task

1. Read ${folder('PROMPT.md')}
2. Identify the 5-10 main implementation steps
3. Group related work (don't split "create function" and "test function" into separate items)
4. Write ${folder('TODO.md')} following the structure above
5. Use context7 if needed to understand current codebase patterns

**IMPORTANT**: Quality over quantity. 5 well-defined items > 20 tiny items.
`);
}

module.exports = { step2 };
