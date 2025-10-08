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
        ${branchStep} - Step ${stepNumber}: Decompose the user prompt into deeply granular, verifiable JIRA-style tasks with complete planning.

        You are an autonomous system-design agent specialized in **smart task decomposition** — transforming abstract user goals into **consolidated, efficient, and independently executable tasks**.

        Your mission is to **create the MINIMUM number of tasks necessary** to deliver the requirement, grouping related work together while maintaining clear boundaries.

        For each task, you must create TWO files:
        1. ${state.claudiomiroFolder}/TASK1/TASK.md - The detailed task description
        2. ${state.claudiomiroFolder}/TASK1/PROMPT.md - The execution plan and constraints

        Example structure:
        ${state.claudiomiroFolder}/TASK1/TASK.md
        ${state.claudiomiroFolder}/TASK1/PROMPT.md
        ${state.claudiomiroFolder}/TASK2/TASK.md
        ${state.claudiomiroFolder}/TASK2/PROMPT.md
        ...

        ---
        ### 🧠 Parallelization-First Methodology

            1. **Independent Work Units**
            - Break down requirements into the MAXIMUM number of independent tasks possible
            - Each task should modify DIFFERENT files or INDEPENDENT code sections
            - Default to parallelism: only create dependencies when absolutely necessary
            - Think: "What can multiple developers work on simultaneously?"

            2. **File-Based Independence Analysis**
            - If two features touch different files → create separate tasks
            - If two features touch different modules → create separate tasks
            - If two features are logically unrelated → create separate tasks
            - Example: 3 independent API routes = 3 tasks (NOT 1 task)

            3. **Dependency Detection (Conservative)**
            Create dependencies ONLY when:
            - Task B needs the OUTPUT of Task A (e.g., "Test login" needs "Create login")
            - Task B modifies the SAME FILE as Task A
            - Task B extends/builds upon Task A's functionality

            AVOID false dependencies:
            - Tasks in the same domain but different files = INDEPENDENT
            - Tasks that "feel related" but don't share code = INDEPENDENT

            4. **Autonomy & Context**
            Each task MUST include:
            - Complete description of what to build
            - Which files will be created/modified
            - All necessary context (no references to other tasks)
            - Clear acceptance criteria

            5. **Examples of Good Decomposition**

            ❌ BAD (over-consolidated):
            - "Create user management system" (1 task)

            ✅ GOOD (parallelizable):
            - "Create user model and validation" (Task 1)
            - "Create authentication endpoints" (Task 2)
            - "Create user profile endpoints" (Task 3)
            - "Add user-related tests" (Task 4, depends on 1,2,3)

            ❌ BAD (false dependency):
            - Task 2 depends on Task 1 just because they're "related"

            ✅ GOOD (true independence):
            - Task 1: "Create /health endpoint"
            - Task 2: "Create /users endpoint"
            - Both can run in parallel (different files, different routes)

        ---

        ### 🎯 Output Expectation

        Generate the **MAXIMUM number of independent, parallelizable tasks**.
        Each task should be a self-contained work unit that can execute simultaneously with others.
        Use filenames (\`TASK1\`, \`TASK2\`, ...) in logical order.

        **Quantity Guidelines:**
        - Simple feature: 2-4 tasks
        - Medium feature: 4-8 tasks
        - Complex feature: 8-15 tasks
        - Focus on INDEPENDENCE over QUANTITY

        **Key principle:** If tasks don't share files or logical dependencies, they MUST be separate.
        
        ---

        ### 🧩 Output Format for Each TASK.md

        Keep it CONCISE and EXPLICIT about file impacts. Structure:
        "
            # Task: [Clear, specific title]

            ## Objective
            1-2 sentences: what must be achieved and why.

            ## Files Affected
            **Will CREATE:**
            - path/to/new/file1.js
            - path/to/new/file2.test.js

            **Will MODIFY:**
            - path/to/existing/file.js (specific changes)

            ## Implementation Summary
            - Step 1: What to do
            - Step 2: What to do
            - Step 3: What to do

            ## Acceptance Criteria
            - [ ] Criterion 1 (specific and testable)
            - [ ] Criterion 2 (specific and testable)
            - [ ] All tests pass

            ## Independent Verification
            How to verify this task works in isolation (without other tasks).
        "

        ---

        ### 📋 PROMPT.md Format for Each Task

        Keep it SHORT and ACTIONABLE:

        "
            ## OBJECTIVE
            [1 sentence describing what to build]
            Done when: [3-5 specific acceptance criteria]

            ## CONSTRAINTS
            - Include tests with implementation (not separate tasks)
            - TODO.md must only contain actions Claude can do
            - No deployment or manual steps
            - First line of TODO.md must be: "Fully implemented: NO"

            ## TOP 3 RISKS
            1. [Risk] → [Mitigation]
            2. [Risk] → [Mitigation]
            3. [Risk] → [Mitigation]
        "

        ---

        ### 🎯 Your Mission

        1. **Analyze** the user prompt for independent work units
        2. **Decompose** into MAXIMUM parallelizable tasks
        3. **Specify** exact files each task will create/modify
        4. **Create** TASK.md + PROMPT.md for each task
        5. **Verify** each task can execute independently

        ---

        ### ⚡ Practical Example

        **User Request:** "Create Express.js server with health and users endpoints"

        **❌ BAD Decomposition (1 task):**
        - TASK1: Create Express server with all endpoints

        **✅ GOOD Decomposition (4 tasks, 3 parallel):**
        - TASK1: Initialize Express server (src/server.js, src/app.js)
        - TASK2: Create health endpoint (src/routes/health.js) - depends on TASK1
        - TASK3: Create users endpoint (src/routes/users.js) - depends on TASK1
        - TASK4: Add endpoint tests (tests/) - depends on TASK2, TASK3

        Result: TASK2 and TASK3 run in parallel after TASK1 completes.

        ---

        ### 📝 Critical Reminders

        - Each TASK.md MUST list exact file paths in "Files Affected"
        - Different files = different tasks (when logically possible)
        - Tests can often be a separate task (parallel or sequential)
        - Foundation/setup tasks naturally come first, features can be parallel

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
