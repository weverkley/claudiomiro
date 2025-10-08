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
        ${branchStep} - Step ${stepNumber}: Decompose the user prompt into deeply granular, verifiable JIRA-style tasks optimized for MAXIMUM PARALLELISM.

        You are an autonomous system-design agent specialized in **parallel-first task decomposition** — transforming abstract user goals into **independent, self-contained, and simultaneously executable tasks**.

        Your mission is to **maximize parallelism** by creating tasks that can run concurrently without blocking each other.

        For each task, you must create TWO files:
        1. ${state.claudiomiroFolder}/TASK1/TASK.md - The detailed task description
        2. ${state.claudiomiroFolder}/TASK1/PROMPT.md - The execution plan and constraints

        You must ALSO create:
        3. ${state.claudiomiroFolder}/EXECUTION_PLAN.md - Visual map of parallel execution strategy

        Example structure:
        ${state.claudiomiroFolder}/EXECUTION_PLAN.md
        ${state.claudiomiroFolder}/TASK1/TASK.md
        ${state.claudiomiroFolder}/TASK1/PROMPT.md
        ${state.claudiomiroFolder}/TASK2/TASK.md
        ${state.claudiomiroFolder}/TASK2/PROMPT.md
        ...

        ---
        ### 🧠 Parallel-First Planning Methodology

        **CORE PRINCIPLE: Default to Independence**
        - Assume tasks are INDEPENDENT unless proven otherwise
        - Bias towards MORE tasks with FEWER dependencies
        - Think: "How would a team of developers work on this simultaneously?"

        #### 1. **Pre-Analysis: Identify Natural Layers**
        Before creating tasks, identify logical execution layers:
        - **Layer 0:** Initialization/setup tasks (foundation)
        - **Layer 1:** Independent feature implementations (parallel)
        - **Layer 2:** Integration/testing tasks (depends on Layer 1)

        Each layer can execute in parallel internally, with dependencies only between layers.

        #### 2. **Independence Analysis Checklist**
        Two tasks are INDEPENDENT if:
        ✅ They modify DIFFERENT files
        ✅ They work on DIFFERENT modules/components
        ✅ They implement DIFFERENT features
        ✅ Neither uses the OUTPUT of the other
        ✅ They don't share state or configuration

        Two tasks are DEPENDENT if:
        ❌ Task B needs Task A's OUTPUT to function
        ❌ Both modify the SAME file (same section)
        ❌ Task B extends/tests Task A's code
        ❌ Task B integrates Task A's work

        #### 3. **Granularity Strategy**
        - **Too Granular:** 1 function = 1 task (overhead > benefit)
        - **Too Coarse:** Entire module = 1 task (no parallelism)
        - **Just Right:** Logical component/feature = 1 task (max parallelism)

        Examples:
        - ✅ "Create User Model" + "Create Product Model" = 2 parallel tasks
        - ✅ "Create /login endpoint" + "Create /register endpoint" = 2 parallel tasks
        - ❌ "Create all CRUD operations" = 1 task (should be 4 parallel tasks)

        #### 4. **Dependency Minimization**
        When you identify a dependency, ask:
        - "Can I include foundational code in BOTH tasks to remove dependency?"
        - "Can I split the base task smaller so dependencies are clearer?"
        - "Is this a real dependency or just conceptual coupling?"

        Example:
        ❌ TASK1: Setup database → TASK2: Create User model (dependency)
        ✅ TASK1: Create User model (includes db setup in its context)

        #### 5. **Self-Contained Tasks**
        Each task MUST be COMPLETELY autonomous:
        - Include ALL context needed (no "see TASK1 for details")
        - Specify ALL files to create/modify
        - Provide COMPLETE acceptance criteria
        - Include verification steps that work IN ISOLATION

        ---

        ### 🎯 Output Requirements

        #### A) EXECUTION_PLAN.md
        Create this file first to visualize the parallel execution strategy:

        "
            # Execution Plan - [Project Name]

            ## Parallelization Summary
            - Total Tasks: X
            - Execution Layers: Y
            - Maximum Parallel Tasks: Z

            ## Execution Strategy

            ### Layer 0: Foundation (Sequential)
            - TASK1: [Task name] - No dependencies

            ### Layer 1: Core Features (Parallel Execution)
            - TASK2: [Task name] - Depends on: TASK1
            - TASK3: [Task name] - Depends on: TASK1
            - TASK4: [Task name] - Depends on: TASK1
            ⚡ Tasks 2-4 execute in PARALLEL

            ### Layer 2: Integration (Parallel Execution)
            - TASK5: [Task name] - Depends on: TASK2, TASK3
            - TASK6: [Task name] - Depends on: TASK4
            ⚡ Tasks 5-6 execute in PARALLEL

            ## Dependency Graph
            \`\`\`
            TASK1 (foundation)
              ├─> TASK2 ──┐
              ├─> TASK3 ──┼─> TASK5
              └─> TASK4 ──┴─> TASK6
            \`\`\`

            ## Critical Path
            TASK1 → TASK2 → TASK5 (longest chain)
            Estimated: [X tasks in sequence]

            ## Parallelism Ratio
            Sequential steps: X
            Total tasks: Y
            Parallelism: Y/X = [ratio]
        "

        #### B) TASK.md Format (with explicit dependencies)

        "
            # Task: [Clear, specific title]

            ## Objective
            1-2 sentences: what must be achieved and why.

            ## Dependencies
            **Depends on:** NONE (or: TASK1, TASK3)
            **Blocks:** TASK5, TASK7 (tasks that depend on this one)
            **Can run in parallel with:** TASK2, TASK4

            ## Files Affected
            **Will CREATE:**
            - path/to/new/file1.js
            - path/to/new/file2.test.js

            **Will MODIFY:**
            - path/to/existing/file.js (add function X)
            - path/to/config.js (add configuration Y)

            ## Implementation Summary
            - Step 1: What to do
            - Step 2: What to do
            - Step 3: What to do

            ## Acceptance Criteria
            - [ ] Criterion 1 (specific and testable)
            - [ ] Criterion 2 (specific and testable)
            - [ ] All tests pass
            - [ ] Runs independently without other tasks

            ## Independent Verification
            How to verify this task works in isolation:
            - Command to run: \`npm test -- task-specific-test\`
            - Expected output: [describe]
            - Verification: [how to confirm it works alone]
        "

        #### C) PROMPT.md Format

        "
            ## OBJECTIVE
            [1 sentence describing what to build]
            Done when: [3-5 specific acceptance criteria]

            ## DEPENDENCIES
            - Requires: [list TASK IDs or "NONE"]
            - Provides for: [list tasks that depend on this]

            ## CONSTRAINTS
            - Must be executable independently (if no deps)
            - Include tests with implementation
            - TODO.md must only contain actions Claude can do
            - No deployment or manual steps
            - First line of TODO.md must be: "Fully implemented: NO"

            ## PARALLELIZATION NOTES
            - Can execute in parallel with: [TASK IDs]
            - Expected to be Layer: [0/1/2/etc]
            - Estimated complexity: [Low/Medium/High]

            ## TOP 3 RISKS
            1. [Risk] → [Mitigation]
            2. [Risk] → [Mitigation]
            3. [Risk] → [Mitigation]
        "

        ---

        ### ⚡ Practical Examples

        **Example 1: "Create Express.js server with 3 endpoints and tests"**

        **✅ OPTIMAL (Maximum Parallelism):**

        EXECUTION_PLAN.md shows:
        - Layer 0: TASK1 (server setup)
        - Layer 1: TASK2, TASK3, TASK4 (endpoints - PARALLEL)
        - Layer 2: TASK5 (integration tests)

        Tasks:
        - TASK1: Initialize Express server (src/server.js, src/app.js) - NO DEPS
        - TASK2: Create /health endpoint (src/routes/health.js) - Depends: TASK1
        - TASK3: Create /users endpoint (src/routes/users.js) - Depends: TASK1
        - TASK4: Create /products endpoint (src/routes/products.js) - Depends: TASK1
        - TASK5: Add integration tests (tests/integration.test.js) - Depends: TASK2,TASK3,TASK4

        Result: 3 tasks execute in parallel (TASK2-4), total execution = 3 layers

        **Example 2: "Build authentication system"**

        **❌ BAD (Over-consolidated):**
        - TASK1: Build complete auth system (1 task, no parallelism)

        **✅ GOOD (Parallelized):**
        - TASK1: Create User model (models/User.js) - NO DEPS
        - TASK2: Create Auth middleware (middleware/auth.js) - NO DEPS (independent)
        - TASK3: Create /login endpoint (routes/auth.js) - Depends: TASK1, TASK2
        - TASK4: Create /register endpoint (routes/auth.js) - Depends: TASK1
        - TASK5: Add auth tests (tests/auth.test.js) - Depends: TASK3, TASK4

        Result: TASK1 & TASK2 run in parallel, then TASK3 & TASK4 in parallel

        ---

        ### 🎯 Your Mission (Step-by-Step)

        1. **Analyze** the user prompt for natural execution layers
        2. **Identify** which work units have zero dependencies
        3. **Map** file/module boundaries to enable parallelism
        4. **Create** EXECUTION_PLAN.md showing parallel execution strategy
        5. **Generate** TASK.md + PROMPT.md for each task with:
           - Explicit dependencies (or "NONE")
           - Parallel execution notes
           - Complete autonomy (no cross-references)
        6. **Verify** each task is truly independent from its parallel peers

        ---

        ### 📝 Critical Rules

        ✅ **DO:**
        - Maximize tasks in each execution layer
        - Make dependencies EXPLICIT in every file
        - Provide COMPLETE context in each task (autonomous)
        - List exact file paths in "Files Affected"
        - Show which tasks can run in parallel in EXECUTION_PLAN.md
        - Aim for parallelism ratio > 2.0 (if possible)

        ❌ **DON'T:**
        - Create dependencies without strong technical reason
        - Assume tasks are dependent because they're "related"
        - Reference other tasks for context (each task is self-contained)
        - Merge independent work into single task
        - Create false sequential chains

        ---

        ### 🎯 Success Metrics

        Your decomposition is optimal when:
        - ✅ Most tasks are in Layer 1+ (parallel execution)
        - ✅ Each layer has multiple tasks executing concurrently
        - ✅ Dependencies are minimal and explicit
        - ✅ EXECUTION_PLAN.md clearly shows parallel opportunities
        - ✅ Each task is 100% autonomous and self-contained

        ---
        ## User Prompt:
        \`\`\`
        ${task}
        \`\`\`
    `);

    logger.stopSpinner();
    logger.success('Tasks created successfully');
}

module.exports = { step0 };
