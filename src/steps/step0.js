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
        ${branchStep} - Step ${stepNumber}: You are a DISTRIBUTED SYSTEMS PLANNER. Decompose the user prompt into MAXIMUM PARALLELIZABLE tasks.

        ## 🎯 Core Mission
        Transform the user goal into independent, self-contained work units optimized for concurrent execution.
        Think like a team lead distributing work to multiple developers who work simultaneously.

        ---

        ## 📐 Planning Process

        ### 1. Layer Analysis (Think First)
        Identify natural execution layers:
        - **Layer 0:** Foundation (minimal setup/init)
        - **Layer 1+:** Features (maximize parallel tasks per layer)
        - **Layer N:** Integration (tests/validation)

        ### 2. Independence Test
        Tasks are INDEPENDENT if:
        ✅ Different files OR different file sections
        ✅ Different modules/components
        ✅ Neither needs the other's OUTPUT

        Tasks are DEPENDENT only if:
        ❌ Task B requires Task A's code/output to function
        ❌ Task B tests/extends Task A's implementation

        ### 3. Granularity Rule
        - **1 feature/component = 1 task**
        - Example: 3 API routes = 3 tasks (NOT 1)
        - Avoid: 1 function = 1 task (too granular)

        ### 4. Dependency Minimization
        Before adding dependency, ask:
        - "Can both tasks include shared foundation code?"
        - "Is this real coupling or just conceptual?"

        Default: INDEPENDENT unless proven otherwise.

        ---

        ## 📦 Required Outputs

        ### A) ${state.claudiomiroFolder}/EXECUTION_PLAN.md
        \`\`\`markdown
        # Execution Plan

        ## Summary
        - Total Tasks: X
        - Layers: Y
        - Max Parallel: Z
        - Parallelism Ratio: X/Y

        ## Layers
        ### Layer 0: Foundation
        - TASK1: [name] - NO DEPS

        ### Layer 1: Features (PARALLEL)
        - TASK2: [name] - Depends: TASK1
        - TASK3: [name] - Depends: TASK1
        ⚡ TASK2-3 run in PARALLEL

        ## Dependency Graph
        TASK1 → TASK2 ──┐
             └─ TASK3 ──┴─> TASK4

        ## Critical Path
        TASK1 → TASK2 → TASK4 (longest sequence)
        \`\`\`

        ### B) ${state.claudiomiroFolder}/TASKX/TASK.md
        \`\`\`markdown
        # Task: [Specific Title]

        ## Objective
        [1-2 sentences: what & why]

        ## Dependencies
        - **Depends on:** NONE (or: TASK1, TASK2)
        - **Blocks:** [tasks waiting for this]
        - **Parallel with:** [sibling tasks]

        ## Files Affected
        **CREATE:**
        - path/to/module.ext
        - path/to/module_test.ext

        **MODIFY:**
        - path/to/existing.ext (add function X)

        ## Steps
        1. [Action]
        2. [Action]
        3. [Action]

        ## Done When
        - [ ] [Testable criterion]
        - [ ] [Testable criterion]
        - [ ] Runs independently (if no deps)

        ## Verify
        [test command] → [expected output]
        \`\`\`

        ### C) ${state.claudiomiroFolder}/TASKX/PROMPT.md
        \`\`\`markdown
        ## OBJECTIVE
        [1 sentence]
        Done when: [3-5 criteria]

        ## DEPENDENCIES
        - Requires: NONE (or: TASK1, TASK2)
        - Provides for: [dependent tasks]

        ## PARALLELIZATION
        - Layer: [0/1/2/N]
        - Parallel with: [TASKX, TASKY]
        - Complexity: [Low/Medium/High]

        ## CONSTRAINTS
        - Include tests with implementation
        - TODO.md first line: "Fully implemented: NO"
        - No manual/deployment steps

        ## RISKS
        1. [Risk] → [Mitigation]
        2. [Risk] → [Mitigation]
        \`\`\`

        ---

        ## 🎯 Execution Checklist

        1. **Analyze** → Identify layers & file boundaries
        2. **Decompose** → Max tasks per layer (bias: independent)
        3. **Document** → Create EXECUTION_PLAN.md first
        4. **Generate** → TASK.md + PROMPT.md for each (fully autonomous)
        5. **Verify** → Each task = complete context (no cross-refs)

        ---

        ## ⚡ Example: "Web API with 3 endpoints + tests"

        **Optimal Plan (3 layers, 5 tasks):**

        Layer 0: TASK1 (HTTP server initialization)
        Layer 1: TASK2 (endpoint A), TASK3 (endpoint B), TASK4 (endpoint C) ← PARALLEL
        Layer 2: TASK5 (integration tests)

        Result: 3 tasks run simultaneously (Layer 1)

        ---

        ## ✅ Success Criteria

        - Most tasks in parallel layers (not Layer 0)
        - Dependencies = minimal & explicit
        - Each task = 100% autonomous (includes all context)
        - EXECUTION_PLAN.md shows clear parallel opportunities
        - Parallelism ratio > 2.0

        ---

        ## 🚨 Anti-Patterns

        ❌ "Build entire auth system" (1 task)
        ❌ Tasks depend on each other "because related"
        ❌ "See TASK1 for context" (breaks autonomy)
        ❌ Same file modified by parallel tasks

        ✅ **CORE RULE:** Independent work units = separate tasks (different files/modules/features)
        ✅ Multiple models/entities/schemas = multiple tasks
        ✅ Multiple endpoints/routes/handlers = multiple tasks
        ✅ Multiple services/use cases/commands = multiple tasks
        ✅ Multiple UI components/views/screens = multiple tasks
        ✅ Multiple utilities/helpers/validators = multiple tasks
        ✅ Multiple middleware/interceptors/guards = multiple tasks
        ✅ Multiple event handlers/listeners = multiple tasks
        ✅ Multiple CLI commands/subcommands = multiple tasks
        ✅ Multiple database migrations/seeders = multiple tasks
        ✅ Multiple independent modules/packages = multiple tasks
        ✅ Dependencies only for real technical coupling
        ✅ Each task includes ALL needed context

        ---

        ## User Request:
        \`\`\`
        ${task}
        \`\`\`

        Think: What's Layer 0? What can run in parallel? What's the critical path?
    `);

    logger.stopSpinner();
    logger.success('Tasks created successfully');
}

module.exports = { step0 };
