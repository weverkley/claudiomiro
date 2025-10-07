const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const logger = require('../../logger');
const { executeClaude } = require('../services/claude-executor');
const { getMultilineInput } = require('../services/prompt-reader');
const { startFresh } = require('../services/file-manager');

const step0 = async (sameBranch = false, promptText = null) => {
    const task = promptText || await getMultilineInput();
    const folder = (file) => path.join(state.claudiomiroFolder, file);


    if (!task || task.trim().length < 10) {
        logger.error('Please provide more details (at least 10 characters)');
        process.exit(0);
    }

    logger.newline();
    logger.startSpinner('Initializing task...');

    startFresh(true);
    fs.writeFileSync(folder('INITIAL_PROMPT.md'), task);

    const branchStep = sameBranch
        ? ''
        : '- Step 1: Create a git branch for this task\n        ';

    const stepNumber = sameBranch ? 1 : 2;

    await executeClaude(`
        ${branchStep} - Step ${stepNumber}: Decompose the user prompt into a balanced set of **autonomous, verifiable JIRA-style tasks**, optimized for speed and clarity.
        
        You are a **recursive system-design agent** specialized in **hierarchical task decomposition**.  
        Your goal is to produce the *minimum number of atomic, testable, and context-independent tasks* required to achieve the user's goal — no more, no less.
        
        ---
        
        ### ⚙️ SPEED / QUALITY MODE
        - Mode: **Balanced**
        - Timebox: **Planning ≤ 10–15 minutes** or **≤ 25 %** of total execution time.
        - Target task size: **15–90 minutes** each.
        - Hard caps:
          - **Max tasks:** 20 (hard limit 24 → merge similar ones)
          - **Max depth:** 3 levels (root → epic → atomic) — never deeper.
        
        ---
        
        ### 🎯 GRANULARITY CONTROL
        1. **Complexity Score (1–5)**
           - 1: trivial (single commit)  
           - 2: simple (single file/function)  
           - 3: medium (two + files or interactions)  
           - 4: complex (cross-module logic)  
           - 5: systemic (architecture / contracts)  
        → Only decompose levels ≥ 3.
        
        2. **Top-K Expansion**
           - Rank requirements by **impact + risk**.
           - Expand only the **Top K** until reaching max tasks (typically K = 5–8).
           - Lower-priority items → \`BACKLOG.md\`.
        
        3. **Dynamic Grouping**
           - If micro-tasks share the same file/module/test type, **merge** them into one \`TASK.md\` with subsections.
        
        ---
        
        ### 📦 OUTPUTS
        - Create a \`TASK_INDEX.md\` listing:
          - Task #, estimated time, complexity score, dependencies.
          - Counters by module and overall total.
        - Generate \`${state.claudiomiroFolder}/TASK{n}/TASK.md\` for each accepted task.
        - If limits are exceeded → collapse and re-group before writing files.
        
        ---
        
        ### 🧠 TASK.md STRUCTURE (Compact)
        - **Objective:** ≤ 3 sentences.  
        - **Assumptions:** only what is needed.  
        - **Steps:** 3–8 imperative bullets.  
        - **Acceptance Criteria:** 2–5 binary checks (✅/❌).  
        - **Test Plan:** short (unit / integration / manual).  
        - **Proof Commands:** ≤ 3.  
        - **Risks / Rollback Hint:** 1 line each.
        
        ---
        
        ### 🛡️ SAFETY & SCOPE
        - No manual or unexecutable tasks.  
        - No deployment.  
        - Contract / breaking files → mark **[BREAKING]** and isolate.  
        - If info is missing → add to \`BACKLOG.md\` as “BLOCKED: <question>”.
        
        ---
        
        ### 📏 FILE BUDGET
        - Max TASK dirs: 20 (hard 24).  
        - Max lines per TASK.md: ~ 120 (prefer 40–80).  
        - Max proofs per task: 3.
        
        ---
        
        ### 📚 SORTING & OUTPUT
        - Sort \`TASK1…TASKN\` by logical dependency (critical path).  
        - Return:
          - \`TASK_INDEX.md\` + N folders \`TASK*/TASK.md\` (N ≤ 20)  
          - \`BACKLOG.md\` with ambiguities and low-priority ideas.
        `);

    logger.stopSpinner();
    logger.success('Task initialized successfully');
}

module.exports = { step0 };
