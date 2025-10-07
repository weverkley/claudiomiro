const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');

const step2 = (task) => {
    const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    return executeClaude(`
        PHASE: CONTEXT SELECTION & PLANNING

Read ${folder('PROMPT.md')} and generate ${folder('TODO.md')} with the first line "Fully implemented: NO".

- ULTRA IMPORTANT: ${folder('TODO.md')} CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO.
- ULTRA IMPORTANT: ${folder('TODO.md')} CAN'T MANUAL ACTIONS THAT CLAUDE CANNOT DO.

### CONTEXT SELECTION
- Limit to 30 artifacts (files/dirs/URLs) with "why relevant".
- Explicitly list out-of-scope items.

### PLAN (DAG)
Each node must have:
- description
- prereq: [other nodes]
- output: expected files/changes
- proof: commands (lint|build|test)
- change_fence.allowlist: list of permitted paths/patterns
- risk_budget: low|medium|high

### CONTRACT SURFACE MAP
List contracts that cannot change without a dedicated BREAKING node:
- endpoints
- exported types/functions
- events/schemas
- env/config

### POLICY
- Do not include deployment tasks.
- No node without proof.
- At least one root node (no prereqs).

Output a full ${folder('TODO.md')} including the PLAN and CONTRACT MAP.
Use context7.
`);
}

module.exports = { step2 };
