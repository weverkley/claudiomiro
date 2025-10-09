const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');

const step2 = (task) => {
    const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    return executeClaude(`
## Your Task

1. Read ${folder('PROMPT.md')} and ${folder('TASK.md')}
2. Read previous TODO.md files (${state.claudiomiroFolder}) **only for related modules** to ensure consistency and avoid duplication.  
   Do **not** reimplement previous work or modify their scope.
3. Think about the integration of this task with the other tasks (previous and next).
4. Identify all implementation steps, and analyze the codebase to locate related files, functions, and data structures.  
   Capture dependencies, references, and side effects required for a complete implementation.
5. Group related work (don't split "create function" and "test function" into separate items)
6. Write ${folder('TODO.md')} following the structure above
7. Use context7 if needed to understand current codebase patterns

**IMPORTANT**: Quality over quantity. 5 well-defined items > 20 tiny items.

## Testing Guideline:
**Focus:** Complete functional delivery over verbose testing.  
Tests must exist only to confirm the correctness of the implemented behavior — not to dominate the plan (unless the task is to build tests)

RULES:
- First line MUST be: "Fully implemented: NO"
- Only add actions that an ai agent can do
- DO NOT run git commands
- You can work across multiple repositories and directories simultaneously. Files in different repositories are NOT a blocker.
- If repositories support tests you MUST CREATE THEM if not they should be hypothetical.

---

## TODO.md Structure

\`\`\`
Fully implemented: NO

## Implementation Plan

- [ ] **Item 1**: [Consolidated action - what to build + tests]
  - Files: [list files to have in context]
  - Tests: [describe what to test and why, only if applicable]

- [ ] **Item 2**: [Next consolidated action]
  - Files: [list files to have in context]
  - Tests: [test objective, concise]

[...]

## Verification
- [ ] All tests pass
- [ ] Code builds without errors
- [ ] Feature works as expected
\`\`\`

`, task);
}

module.exports = { step2 };
