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

        ### 5. Mandatory Final Assembly Check (NEW)
        Always add a **final task** after all others:
        **Final Task (label it with the next sequential numeric id, e.g., TASK5) — System Cohesion & Assembly Validation**
        - Depends on **ALL** previous tasks.
        - Validates cross-task coherence (contracts, interfaces, naming, folder structure).
        - Confirms tests/doc build and that the system is assembled as planned.
        - Produces a clear pass/fail report and lists any gaps.

        ---

        ## 📦 Required Outputs

        ### A) ${state.claudiomiroFolder}/EXECUTION_PLAN.md
        \`\`\`markdown
        # Execution Plan

        ## Summary
        - Total Tasks: X (+1 final validation)
        - Layers: Y (+ Final Ω layer)
        - Max Parallel: Z
        - Parallelism Ratio: X/Y

        ## Layers
        ### Layer 0: Foundation
        - TASK1: [name] - NO DEPS

        ### Layer 1: Features (PARALLEL)
        - TASK2: [name] - Depends: TASK1
        - TASK3: [name] - Depends: TASK1
        ⚡ TASK2-3 run in PARALLEL

        ### Layer N: Integration/Tests
        - TASK4: [name] - Depends: TASK2, TASK3

        ### Final Layer Ω: System Cohesion & Assembly Validation (MANDATORY)
        - Final Task (e.g., TASK5): System Cohesion & Assembly Validation - Depends: ALL PRIOR TASKS (use the next sequential numeric id)

        ## Dependency Graph
        TASK1 → TASK2 ──┐
             └─ TASK3 ──┴─> TASK4 → Final Task (e.g., TASK5)

        ## Critical Path
        TASK1 → TASK2 → TASK4 → Final Task (e.g., TASK5) (longest sequence)
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

        **NOTE:** Files can be in different repositories or directories - this is supported and NOT a blocker.

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
        - Multi-repository/directory work is fully supported - NOT a blocker

        ## RISKS
        1. [Risk] → [Mitigation]
        2. [Risk] → [Mitigation]
        \`\`\`

        ### D) SPECIAL (MANDATORY) — ${state.claudiomiroFolder}/TASK{finalNumber}/* (use the highest sequential task id)
        \`\`\`markdown
        # Task: System Cohesion & Assembly Validation (label this directory with the next sequential numeric id)

        ## Objective
        Validate that all tasks fit together coherently and the final system matches the Execution Plan with no mismatches, missing links, or contract drift.

        ## Dependencies
        - **Depends on:** ALL previous tasks

        ## Inputs
        - EXECUTION_PLAN.md
        - All TASKX/TASK.md and TASKX/PROMPT.md
        - Codebase, tests, docs, build artifacts

        ## Steps
        1. Cross-check produced tasks vs EXECUTION_PLAN.md (presence, numbering, deps).
        2. Verify interface/contract alignment across modules (types, payloads, routes, events).
        3. Check naming, folder layout, and ownership boundaries.
        4. Run lints, build, and full test suite (unit + integration/smoke).
        5. Ensure each task's acceptance criteria are objectively met.
        6. If gaps exist, list them and propose minimal fixes.

        ## Done When
        - [ ] Lint/build/tests all pass
        - [ ] No conflicting interfaces or file overlaps
        - [ ] EXECUTION_PLAN.md reflects reality (or is updated)
        - [ ] Report artifacts created:
              - ${state.claudiomiroFolder}/COHESION_REPORT.md
              - ${state.claudiomiroFolder}/GAPS.md (empty if none)

        ## Verify
        \`\`\`bash
        npm run lint && npm test && npm run build
        \`\`\`
        → Expected: all succeed; report files exist
        \`\`\`

        ---

        ## 🎯 Execution Checklist

        1. **Analyze** → Identify layers & file boundaries
        2. **Decompose** → Max tasks per layer (bias: independent)
        3. **Document** → Create EXECUTION_PLAN.md first
        4. **Generate** → TASK.md + PROMPT.md for each (fully autonomous)
        5. **Verify** → Each task = complete context (no cross-refs)
        6. **Add Final Task** → Always include a final numeric task for cohesion & assembly validation

        ---

        ## ⚡ Example: "Web API with 3 endpoints + tests"

        **Optimal Plan (3 layers + final, 6 tasks):**

        Layer 0: TASK1 (HTTP server initialization)
        Layer 1: TASK2 (endpoint A), TASK3 (endpoint B), TASK4 (endpoint C) ← PARALLEL
        Layer 2: TASK5 (integration tests)
        Final Ω: TASK6 (system cohesion & assembly validation)

        Result: 3 tasks run simultaneously (Layer 1)

        ---

        ## ✅ Success Criteria

        - Most tasks in parallel layers (not Layer 0)
        - Dependencies = minimal & explicit
        - Each task = 100% autonomous (includes all context)
        - EXECUTION_PLAN.md shows clear parallel opportunities
        - Final task (next numeric id) present and passes
        - Parallelism ratio > 2.0

        ---

        ## 🚨 Anti-Patterns

        ❌ "Build entire auth system" (1 task)
        ❌ Tasks depend on each other "because related"
        ❌ "See TASK1 for context" (breaks autonomy)
        ❌ Same file modified by parallel tasks
        ❌ **Missing final cohesion task (final numeric task)**
        ❌ Blocking tasks because files are in different repositories/directories
        
        ✅ **CORE RULE:** Independent work units = separate tasks (different files/modules/features)
        ✅ Multiple endpoints/routes/handlers = multiple tasks
        ✅ Dependencies only for real technical coupling
        ✅ Each task includes ALL needed context
        ✅ **Final assembly validation is mandatory**

        ---

        ## User Request:
        \`\`\`
        ${task}
        \`\`\`

        Think: What's Layer 0? What can run in parallel? What's the critical path? Ensure the final numeric task closes the loop.
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
        - **Final Ω:** System Cohesion & Assembly Validation (MANDATORY)

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

        ### 9. Mandatory Final Assembly Check (NEW)
        Add a final task (label it with the next sequential numeric id, e.g., TASK8 — System Cohesion & Assembly Validation), depending on **ALL** prior tasks, to verify cross-task coherence and correct final assembly.

        ---

        ## 📦 Required Outputs

        ### A) ${state.claudiomiroFolder}/EXECUTION_PLAN.md
        \`\`\`markdown
        # Execution Plan

        ## Summary
        - Total Tasks: X (+1 final validation)
        - Layers: Y (+ Final Ω layer)
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

        ### Layer 2: Integration/Docs
        - TASK6: [name] - Depends: TASK3, TASK4, TASK5
        - TASK7: [name] - Depends: TASK3, TASK4, TASK5
        ⚡ TASK6-7 run in PARALLEL

        ### Final Layer Ω: System Cohesion & Assembly Validation (MANDATORY)
        - Final Task (e.g., TASK8): System Cohesion & Assembly Validation - Depends: ALL PRIOR TASKS (use the next sequential numeric id)

        ## Dependency Graph
        TASK1 → TASK3 ──┐
             └─ TASK4 ──┴─> TASK6 → Final Task (e.g., TASK8)
        TASK2 → TASK5 ──┘           ▲
                                    └── TASK7

        ## Critical Path
        TASK1 → TASK3 → TASK6 → Final Task (e.g., TASK8) (longest sequence)

        ## Reasoning Summary
        Brief explanation of why tasks were split this way and what parallelization opportunities exist
        \`\`\`

        ### B) ${state.claudiomiroFolder}/TASKX/TASK.md
        \`\`\`markdown
        # Task: [Clear and Concise Title]

        ## Objective
        Explain what must be achieved and why it matters (1-3 sentences: what & why)

        ## Assumptions
        - Assumption 1
        - Assumption 2

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

        **NOTE:** Files can be in different repositories or directories - this is supported and NOT a blocker.

        ## Steps to Implement
        1. [Step-by-step breakdown]
        2. [...]
        3. [...]

        ## Research Summary
        - Key library/tool: [name]
        - Pattern: [pattern]
        - Edge cases: [case]

        ## Acceptance Criteria (Rigorous)
        - [ ] [Objective and testable criterion 1]
        - [ ] [Objective and testable criterion 2]
        - [ ] [Objective and testable criterion 3]
        - [ ] Code compiles without errors
        - [ ] All tests pass
        - [ ] Runs independently (if no deps)

        ## Self-Verification Logic
        1. Compare outputs to acceptance criteria
        2. If any fail → "RETRY REQUIRED"
        3. If all pass → "SUCCESS"

        ## Reasoning Trace
        Why this approach, alternatives rejected, risks

        ## Escalation Protocol
        If blocked:
        1. Stop
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
        [1-2 sentences]
        Done when: [5-8 measurable criteria]

        ## DEPENDENCIES
        - Requires: NONE (or: TASK1, TASK2)
        - Provides for: [dependent tasks]

        ## PARALLELIZATION
        - Layer: [0/1/2/N]
        - Parallel with: [TASKX, TASKY]
        - Complexity: [Low/Medium/High]
        - Effort: [Small/Medium/Large]

        ## CONSTRAINTS
        - Include tests with implementation
        - TODO.md first line: "Fully implemented: NO"
        - No manual/deployment steps
        - Multi-repository/directory work is fully supported - NOT a blocker
        - ${state.claudiomiroFolder}/TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO
        - Backend: tests for each layer + integration tests
        - Frontend: tests for all components (mock API)

        ## RISKS & MITIGATIONS
        1. [Risk] → [Mitigation]
        2. [Risk] → [Mitigation]
        3. [Risk] → [Mitigation]

        ## ACCEPTANCE CRITERIA (Detailed)
        - [ ] [Binary pass/fail 1]
        - [ ] [Binary pass/fail 2]
        - [ ] [Binary pass/fail 3]
        - [ ] [Binary pass/fail 4]
        - [ ] [Binary pass/fail 5]
        \`\`\`

        ### D) SPECIAL (MANDATORY) — ${state.claudiomiroFolder}/TASK{finalNumber}/* (use the highest sequential task id)
        \`\`\`markdown
        # Task: System Cohesion & Assembly Validation (label this directory with the next sequential numeric id)

        ## Objective
        Ensure the entire system is coherent, complete, and faithful to the plan; detect and document any cross-task inconsistencies; certify final assembly quality.

        ## Assumptions
        - All prior tasks have produced code, tests, and docs as specified.
        - Acceptance criteria are objective and executable via scripts.

        ## Dependencies
        - **Depends on:** ALL previous tasks

        ## Files Affected / Artifacts Produced
        **CREATE:**
        - ${state.claudiomiroFolder}/COHESION_REPORT.md
        - ${state.claudiomiroFolder}/GAPS.md
        - ${state.claudiomiroFolder}/ASSEMBLY_STATUS.md (summary: PASS/FAIL, with rationale)
        **MODIFY (if needed):**
        - EXECUTION_PLAN.md (sync actual vs planned)

        ## Steps to Implement
        1. Inventory tasks produced vs EXECUTION_PLAN (IDs, names, deps).
        2. Validate interface/contract alignment (types, schemas, routes, events, envs).
        3. Check cross-module naming and folder boundaries; detect overlaps.
        4. Run: lint, build, unit + integration + smoke tests; collect artifacts.
        5. Verify each task's acceptance criteria explicitly; mark unmet items in GAPS.md.
        6. If EXECUTION_PLAN differs from reality, update with clear diff notes.
        7. For each ${task}/TODO.md found:
           - If all criteria pass → update first line to "Fully implemented: YES".
           - If not → keep "NO" and reference the gap item ID in GAPS.md.

        ## Acceptance Criteria (Rigorous)
        - [ ] Lint/build/tests: all pass without flakiness
        - [ ] No API/contract mismatch between modules
        - [ ] No conflicting writes to same files by parallel tasks
        - [ ] EXECUTION_PLAN.md reflects final system state
        - [ ] COHESION_REPORT.md and ASSEMBLY_STATUS.md exist and are complete
        - [ ] GAPS.md empty OR all gaps clearly listed with owners/next steps

        ## Self-Verification Logic
        - If any acceptance criterion fails → ASSEMBLY_STATUS.md = FAIL and list exact causes.
        - If all pass → ASSEMBLY_STATUS.md = PASS.

        ## Verify
        \`\`\`bash
        npm run lint && npm test && npm run build
        \`\`\`
        → Expected: all succeed; PASS in ASSEMBLY_STATUS.md; COHESION_REPORT.md present; GAPS.md empty or actionable.
        \`\`\`

        ---

        ## 🎯 Execution Checklist

        1. **Deep Think** → Understand user's WHY, not just WHAT
        2. **Layer Analysis** → Foundation, features, integration
        3. **Recursive Decompose** → Atomic, parallelizable tasks
        4. **Document Plan** → EXECUTION_PLAN.md + reasoning
        5. **Generate Tasks** → TASK.md + PROMPT.md (complete context)
        6. **Verify Parallelism** → Max tasks per layer, minimal deps
        7. **Add Final Task** → Always include a final numeric task for cohesion & assembly validation

        ---

        ## ⚡ Example: "Web API with 3 endpoints + tests"

        **Optimal Hard Mode Plan (3 layers + final, 8 tasks):**

        Layer 0:
        - TASK1 (HTTP server base setup)
        - TASK2 (Database connection config) ← PARALLEL

        Layer 1:
        - TASK3 (endpoint A + unit tests) - Depends: TASK1, TASK2
        - TASK4 (endpoint B + unit tests) - Depends: TASK1, TASK2
        - TASK5 (endpoint C + unit tests) - Depends: TASK1, TASK2
        ← TASK3-5 run in PARALLEL

        Layer 2:
        - TASK6 (integration tests) - Depends: TASK3, TASK4, TASK5
        - TASK7 (API documentation) - Depends: TASK3, TASK4, TASK5
        ← TASK6-7 run in PARALLEL

        Final Ω:
        - TASK8 (system cohesion & assembly validation) - Depends: ALL

        Result: 5 tasks in parallel across layers; Final gate ensures coherence.

        ---

        ## ✅ Success Criteria

        - Most tasks in parallel layers
        - Minimal & explicit dependencies
        - Each task 100% autonomous, with deep reasoning
        - EXECUTION_PLAN.md shows parallel opportunities
        - Parallelism ratio > 2.0
        - Every task: reasoning trace, assumptions, research, criteria
        - Final task (next numeric id) present and passing with reports
        \n
        ## 🚨 Anti-Patterns

        ❌ Missing reasoning/assumptions/criteria
        ❌ Same file modified by parallel tasks
        ❌ Vague acceptance criteria
        ❌ **Omitting final numeric task**
        ❌ Blocking tasks because files are in different repositories/directories

        ✅ Independent units per feature
        ✅ Real coupling only
        ✅ Full-context tasks
        ✅ **Final assembly validation is mandatory**

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
        - **How will the final numeric task certify the whole system?**
    `;
    
module.exports = { step0 };
