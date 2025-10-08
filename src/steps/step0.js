const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const logger = require('../../logger');
const { executeClaude } = require('../services/claude-executor');
const { getMultilineInput } = require('../services/prompt-reader');
const { startFresh } = require('../services/file-manager');

const step0 = async (sameBranch = false, promptText = null, mode = 'auto') => {
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

    // Escolhe o prompt baseado no mode
    const prompt = mode === 'hard' ? getHardModePrompt(branchStep, stepNumber, task) : getAutoModePrompt(branchStep, stepNumber, task);

    await executeClaude(prompt);

    logger.stopSpinner();
    logger.success('Tasks created successfully');
}

const getAutoModePrompt = (branchStep, stepNumber, task) => `
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
    `;

const getHardModePrompt = (branchStep, stepNumber, task) => `
        ${branchStep} - Step ${stepNumber}: You are a DISTRIBUTED SYSTEMS PLANNER with DEEP REASONING capabilities.

        Decompose the user prompt into MAXIMUM PARALLELIZABLE tasks with MAXIMUM CRITICALITY and detailed acceptance criteria.

        ## 🎯 Dual Mission
        1. **Parallelization:** Transform the user goal into independent, self-contained work units optimized for concurrent execution
        2. **Criticality:** Each task must be deeply analyzed with reasoning traces, assumptions, research summaries, and rigorous acceptance criteria

        Think like a team lead distributing work to multiple developers who work simultaneously, while also being a meticulous architect who leaves nothing to chance.

        ---

        ## 🧠 Deep Reasoning & Methodology

        ### 1. Recursive Breakdown
        - Start by listing all high-level requirements in the user prompt
        - For each one, **recursively expand** it into smaller, testable components
        - Continue decomposing until each sub-task can be *fully implemented and verified* without additional context
        - Each sub-task MUST be independently executable (different files/modules/features)

        ### 2. Layer Analysis (Parallelization)
        Identify natural execution layers:
        - **Layer 0:** Foundation (minimal setup/init) - may have multiple independent tasks
        - **Layer 1+:** Features (MAXIMIZE parallel tasks per layer)
        - **Layer N:** Integration (tests/validation)

        ### 3. Independence Test
        Tasks are INDEPENDENT if:
        ✅ Different files OR different file sections
        ✅ Different modules/components
        ✅ Neither needs the other's OUTPUT

        Tasks are DEPENDENT only if:
        ❌ Task B requires Task A's code/output to function
        ❌ Task B tests/extends Task A's implementation

        ### 4. Granularity Rule
        - **1 feature/component = 1 task**
        - Example: 3 API routes = 3 tasks (NOT 1)
        - Example: "Ensure all filters work" → Test filter by period + Test filter by status + Test filter by amount (3 tasks)
        - Avoid: 1 function = 1 task (too granular)

        ### 5. Autonomous Context Isolation
        - Each \`TASK.md\` must be 100% self-contained
        - It must include all assumptions, definitions, and relevant context
        - Another agent or developer must be able to execute it without referring to the parent prompt

        ### 6. Deep Reasoning Before Writing
        - Analyze not just what is being asked, but *why* — the user's intent, expected system behavior, and possible edge cases
        - Document reasoning under **"Reasoning Trace"** in each task

        ### 7. Explicit Unknowns
        - When something is ambiguous, don't invent
        - Document it under an **"Assumptions"** section

        ### 8. Dependency Minimization
        Before adding dependency, ask:
        - "Can both tasks include shared foundation code?"
        - "Is this real coupling or just conceptual?"
        Default: INDEPENDENT unless proven otherwise

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
        - Criticality Level: HARD MODE

        ## Layers
        ### Layer 0: Foundation
        - TASK1: [name] - NO DEPS
        - TASK2: [name] - NO DEPS (if independent)

        ### Layer 1: Features (PARALLEL)
        - TASK3: [name] - Depends: TASK1
        - TASK4: [name] - Depends: TASK1
        - TASK5: [name] - Depends: TASK2
        ⚡ TASK3-5 run in PARALLEL

        ## Dependency Graph
        TASK1 → TASK3 ──┐
             └─ TASK4 ──┴─> TASK6
        TASK2 → TASK5 ──┘

        ## Critical Path
        TASK1 → TASK3 → TASK6 (longest sequence)

        ## Reasoning Summary
        Brief explanation of why tasks were split this way and what parallelization opportunities exist
        \`\`\`

        ### B) ${state.claudiomiroFolder}/TASKX/TASK.md
        \`\`\`markdown
        # Task: [Clear and Concise Title]

        ## Objective
        Explain what must be achieved and why it matters (1-3 sentences: what & why)

        ## Assumptions
        List any inferred or assumed conditions that support the execution:
        - Assumption 1
        - Assumption 2
        - ...

        ## Dependencies
        - **Depends on:** NONE (or: TASK1, TASK2)
        - **Blocks:** [tasks waiting for this]
        - **Parallel with:** [sibling tasks]

        ## Files Affected
        **CREATE:**
        - path/to/module.ext
        - path/to/module_test.ext

        **MODIFY:**
        - path/to/existing.ext (add function X, line ~Y)

        ## Steps to Implement
        1. [Step-by-step breakdown - use imperative verbs]
        2. [Create, Configure, Refactor, etc.]
        3. [Be specific and actionable]

        ## Research Summary
        Summarize findings or references that support implementation:
        - Key library/tool needed: [name]
        - Relevant patterns: [pattern]
        - Edge cases to consider: [case]

        ## Acceptance Criteria (Rigorous)
        - [ ] [Objective and testable criterion 1]
        - [ ] [Objective and testable criterion 2]
        - [ ] [Objective and testable criterion 3]
        - [ ] Code compiles without errors
        - [ ] All tests pass
        - [ ] Runs independently (if no deps)

        ## Self-Verification Logic
        Before marking this task as completed:
        1. Compare actual outputs with acceptance criteria
        2. If any criterion fails → mark as "RETRY REQUIRED"
        3. If all pass → mark as "SUCCESS"

        ## Reasoning Trace
        Summarize how the task was interpreted, why each step was chosen, and what trade-offs were considered.
        - Why this approach?
        - What alternatives were rejected?
        - What risks exist?

        ## Escalation Protocol
        If blocked or encountering undefined behavior:
        1. Stop execution
        2. Save state in ${state.claudiomiroFolder}/BLOCKED.md
        3. Add entry: reason, attempted fix, next suggestion

        ## Verify
        \`\`\`bash
        [test command]
        \`\`\`
        → Expected output: [describe expected result]
        \`\`\`

        ### C) ${state.claudiomiroFolder}/TASKX/PROMPT.md
        \`\`\`markdown
        ## OBJECTIVE
        [1-2 sentences describing the goal]
        Done when: [5-8 detailed measurable criteria]

        ## DEPENDENCIES
        - Requires: NONE (or: TASK1, TASK2)
        - Provides for: [dependent tasks]

        ## PARALLELIZATION
        - Layer: [0/1/2/N]
        - Parallel with: [TASKX, TASKY]
        - Complexity: [Low/Medium/High]
        - Estimated effort: [Small/Medium/Large]

        ## CONSTRAINTS
        - Include tests with implementation
        - TODO.md first line: "Fully implemented: NO"
        - No manual/deployment steps
        - ${state.claudiomiroFolder}/TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO
        - Backend: tests for each layer + integration tests
        - Frontend: tests for all components (mock API)

        ## RISKS & MITIGATIONS
        1. [Risk 1] → [Mitigation strategy]
        2. [Risk 2] → [Mitigation strategy]
        3. [Risk 3] → [Mitigation strategy]

        ## ACCEPTANCE CRITERIA (Detailed)
        - [ ] [Binary pass/fail condition 1]
        - [ ] [Binary pass/fail condition 2]
        - [ ] [Binary pass/fail condition 3]
        - [ ] [Binary pass/fail condition 4]
        - [ ] [Binary pass/fail condition 5]
        \`\`\`

        ---

        ## 🎯 Execution Checklist

        1. **Deep Think** → Understand user's WHY, not just WHAT
        2. **Layer Analysis** → Identify foundation, features, integration layers
        3. **Recursive Decompose** → Break down into atomic, parallelizable tasks
        4. **Document Plan** → Create EXECUTION_PLAN.md with reasoning
        5. **Generate Tasks** → TASK.md + PROMPT.md for each (fully autonomous, deeply reasoned)
        6. **Verify Autonomy** → Each task = complete context (no cross-refs)
        7. **Verify Parallelism** → Max tasks per layer, minimal dependencies

        ---

        ## ⚡ Example: "Web API with 3 endpoints + tests"

        **Optimal Hard Mode Plan (3 layers, 7 tasks):**

        Layer 0:
        - TASK1 (HTTP server base setup)
        - TASK2 (Database connection config) ← PARALLEL with TASK1

        Layer 1:
        - TASK3 (endpoint A + unit tests) - Depends: TASK1, TASK2
        - TASK4 (endpoint B + unit tests) - Depends: TASK1, TASK2
        - TASK5 (endpoint C + unit tests) - Depends: TASK1, TASK2
        ← TASK3-5 run in PARALLEL

        Layer 2:
        - TASK6 (integration tests for all endpoints) - Depends: TASK3, TASK4, TASK5
        - TASK7 (API documentation) - Depends: TASK3, TASK4, TASK5
        ← TASK6-7 run in PARALLEL

        Result: 5 tasks run in parallel (2 in Layer 0, 3 in Layer 1, 2 in Layer 2)
        Parallelism Ratio: 7/3 = 2.33

        Each task includes:
        - Reasoning trace (why this endpoint needs these fields)
        - Assumptions (what data structure is expected)
        - Research summary (which HTTP status codes to use)
        - Detailed acceptance criteria (8-10 items each)
        - Self-verification logic
        - Escalation protocol

        ---

        ## ✅ Success Criteria

        - Most tasks in parallel layers (not all sequential)
        - Dependencies = minimal & explicit
        - Each task = 100% autonomous (includes all context)
        - EXECUTION_PLAN.md shows clear parallel opportunities
        - Parallelism ratio > 2.0
        - Every task has detailed reasoning trace
        - Every task has explicit assumptions
        - Every task has rigorous acceptance criteria (5-10 items)
        - Every task has research summary
        - Every task has self-verification logic

        ---

        ## 🚨 Anti-Patterns

        ❌ "Build entire auth system" (1 task)
        ❌ Tasks depend on each other "because related"
        ❌ "See TASK1 for context" (breaks autonomy)
        ❌ Same file modified by parallel tasks
        ❌ Vague acceptance criteria ("works well", "is good")
        ❌ No reasoning trace
        ❌ No assumptions documented
        ❌ Generic steps without specifics

        ✅ **CORE RULES:**
        ✅ Independent work units = separate tasks (different files/modules/features)
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
        ✅ Multiple test scenarios/edge cases = multiple tasks (when substantial)
        ✅ Dependencies only for real technical coupling
        ✅ Each task includes ALL needed context + deep reasoning
        ✅ Each task has 5-10 detailed acceptance criteria
        ✅ Each task documents assumptions explicitly
        ✅ Each task includes research summary

        ---

        ## User Request:
        \`\`\`
        ${task}
        \`\`\`

        Think deeply:
        - What's the user's real goal?
        - What's Layer 0? What can run in parallel?
        - What's the critical path?
        - What assumptions am I making?
        - What could go wrong?
        - How will each task be verified?
    `;

module.exports = { step0 };
