const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const logger = require('../../logger');
const { executeClaude } = require('../services/claude-executor');

/**
 * Step 1: Analisa todas as tasks criadas pelo step0 e define quais podem rodar em paralelo
 * baseado em conflitos de arquivo e dependências lógicas
 */
const step1 = async () => {
    logger.newline();
    logger.startSpinner('Analyzing task dependencies...');

    // Lê todas as tasks criadas
    const tasks = fs
        .readdirSync(state.claudiomiroFolder)
        .filter(name => {
            const fullPath = path.join(state.claudiomiroFolder, name);
            return fs.statSync(fullPath).isDirectory();
        })
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (tasks.length === 0) {
        logger.stopSpinner();
        logger.info('No tasks found for dependency analysis');
        return;
    }

    if (tasks.length === 1) {
        logger.stopSpinner();
        logger.info('Single task detected, adding empty dependencies');

        // Adiciona @dependencies [] na única task
        const taskName = tasks[0];
        const taskMdPath = path.join(state.claudiomiroFolder, taskName, 'TASK.md');

        if (fs.existsSync(taskMdPath)) {
            const content = fs.readFileSync(taskMdPath, 'utf-8');

            // Só adiciona se ainda não tiver @dependencies
            if (!content.match(/@dependencies/)) {
                const updatedContent = '@dependencies []\n' + content;
                fs.writeFileSync(taskMdPath, updatedContent, 'utf-8');
                logger.success('Empty dependencies added to single task');
            }
        }

        return;
    }

    // Lê o conteúdo de cada task
    const taskContents = {};
    for (const taskName of tasks) {
        const taskMd = path.join(state.claudiomiroFolder, taskName, 'TASK.md');
        const promptMd = path.join(state.claudiomiroFolder, taskName, 'PROMPT.md');

        taskContents[taskName] = {
            task: fs.existsSync(taskMd) ? fs.readFileSync(taskMd, 'utf-8') : '',
            prompt: fs.existsSync(promptMd) ? fs.readFileSync(promptMd, 'utf-8') : ''
        };
    }

    // Monta o prompt para análise
    const tasksDescription = tasks
        .map(taskName => {
            return `### ${taskName}
**TASK.md:**
\`\`\`
${taskContents[taskName].task}
\`\`\`

**PROMPT.md:**
\`\`\`
${taskContents[taskName].prompt}
\`\`\`
`;
        })
        .join('\n\n');

    await executeClaude(`
You are an expert dependency analyzer for a highly parallel task execution system.

Your mission: **Maximize parallel execution by identifying ONLY true dependencies**.

---

## Tasks to Analyze

${tasksDescription}

---

## Analysis Protocol

### Phase 1: Extract File Information
For each task, identify:
1. Files it will CREATE
2. Files it will MODIFY
3. Files/modules it depends on (logically)

### Phase 2: Detect Conflicts (PRECISE)

**File Write Conflicts (Sequential Required):**
- If Task A and Task B both MODIFY the same file → B depends on A
- If Task A CREATES file X and Task B MODIFIES file X → B depends on A

**NO Conflict (Parallel Allowed):**
- Task A creates file1.js, Task B creates file2.js → INDEPENDENT
- Task A modifies moduleA, Task B modifies moduleB → INDEPENDENT
- Task A and Task B both READ the same file → INDEPENDENT

### Phase 3: Detect Logical Dependencies

**True Logical Dependency:**
- Task B explicitly tests/uses Task A's output
- Task B extends/builds upon Task A's functionality
- Task B needs Task A's file to exist before it can work

**NOT a Dependency:**
- Tasks in the same domain (e.g., both about "users") → INDEPENDENT
- Tasks that sequentially make sense but don't share code → INDEPENDENT
- Task execution order preference (if not required) → INDEPENDENT

### Phase 4: Dependency Rules

1. **Default to Independence:** @dependencies []
2. **Add dependency ONLY if:**
   - Same file modified by both
   - Task B needs Task A's output to function
   - Clear build-upon relationship

3. **Chain Simplification:**
   - Only direct dependencies
   - If C→B→A, write: C: @dependencies [B], B: @dependencies [A]
   - NOT: C: @dependencies [A, B]

### Phase 5: Parallelization Strategy

**Prefer this pattern:**

    TASK1: @dependencies []  ← Foundation
    TASK2: @dependencies []  ← Independent feature 1
    TASK3: @dependencies []  ← Independent feature 2
    TASK4: @dependencies [TASK1, TASK2, TASK3]  ← Integration/tests

**Avoid this (over-coupling):**

    TASK1: @dependencies []
    TASK2: @dependencies [TASK1]  ← Why? If files are different, remove dependency
    TASK3: @dependencies [TASK2]  ← Chains should be justified

---

## Decision Process (Step by Step)

For each task:

1. **List files affected** (from "Files Affected" section)
2. **Compare with other tasks:**
   - Same file modified? → Add dependency
   - Different files? → Independent
3. **Check logical needs:**
   - Does it import/use another task's code? → Add dependency
   - Just related domain? → Independent
4. **Write @dependencies line**

---

## Output Format

For EACH task, **prepend** \`@dependencies [list]\` as the **FIRST LINE** of TASK.md:

**Example Decision Log:**

    TASK1: Creates src/server.js
    TASK2: Creates src/routes/health.js (imports from server.js)
    TASK3: Creates src/routes/users.js (imports from server.js)
    TASK4: Creates tests/health.test.js (tests TASK2's route)

    Analysis:
    - TASK1: Foundation, no deps → @dependencies []
    - TASK2: Needs server.js from TASK1 → @dependencies [TASK1]
    - TASK3: Needs server.js from TASK1 → @dependencies [TASK1]
    - TASK4: Tests TASK2's code → @dependencies [TASK2]

    Result: TASK2 and TASK3 run in parallel (both after TASK1)

**Applied to files:**

File: TASK1/TASK.md
    @dependencies []
    # Task: Initialize Express server
    ...

File: TASK2/TASK.md
    @dependencies [TASK1]
    # Task: Create health check endpoint
    ...

File: TASK3/TASK.md
    @dependencies [TASK1]
    # Task: Create users endpoint
    ...

File: TASK4/TASK.md
    @dependencies [TASK2]
    # Task: Add health endpoint tests
    ...

---

## Your Task

1. **Analyze** all ${tasks.length} tasks
2. **Extract** files affected from each task description
3. **Detect** file conflicts (same file = dependency)
4. **Identify** logical dependencies (uses output = dependency)
5. **Maximize** parallelism (default to @dependencies [])
6. **Update** ALL TASK.md files with @dependencies line

**Task names:** ${tasks.join(', ')}

**CRITICAL:**
- Update ALL ${tasks.length} task files
- @dependencies MUST be line 1
- Prefer parallelism over sequential
- Justify each dependency in your reasoning
- If in doubt about independence → tasks are INDEPENDENT

**Think:** What would allow multiple developers to work simultaneously?

Start now!
`);

    logger.stopSpinner();
    logger.success('Task dependencies analyzed and configured');
}

module.exports = { step1 };
