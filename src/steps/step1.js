const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const logger = require('../../logger');
const { executeClaude } = require('../services/claude-executor');

/**
 * Step 1: Analisa todas as tasks criadas pelo step0 e define quais podem rodar em paralelo
 * baseado em conflitos de arquivo e dependências lógicas
 */
const step1 = async (mode = 'auto') => {
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

    // Escolhe o prompt baseado no mode
    const prompt = mode === 'hard'
        ? getHardModePrompt(tasksDescription, tasks)
        : getAutoModePrompt(tasksDescription, tasks);

    try{
        await executeClaude(prompt);

        logger.stopSpinner();
        logger.success('Task dependencies analyzed and configured');
    }catch(e){
        console.error(e);
    }

   for (let i = 0; i < tasks.length; i++) {
        const taskName = tasks[i];
        const taskMd = path.join(state.claudiomiroFolder, taskName, 'TASK.md');

        if (!fs.existsSync(taskMd)) {
            console.warn(`⚠️ Arquivo não encontrado: ${taskMd}`);
            continue;
        }

        const content = fs.readFileSync(taskMd, 'utf-8');
        const lines = content.split('\n');
        const firstLine = lines[0].trim();

        // Se já tem @dependencies, pula
        if (firstLine.startsWith('@dependencies')) {
            console.log(`✅ ${taskName} já possui dependências. Ignorado.`);
            continue;
        }

        // Todas as tasks anteriores no array são dependências
        const dependencies = tasks.slice(0, i);
        const dependencyLine =
            dependencies.length > 0
                ? `@dependencies [${dependencies.join(', ')}]`
                : '@dependencies []';

        // Reescreve o arquivo com a nova linha no topo
        const updated = `${dependencyLine}\n${content}`;
        fs.writeFileSync(taskMd, updated, 'utf-8');

        console.log(
            `🧩 Adicionado a ${taskName}: ${dependencies.length > 0 ? dependencies.join(', ') : '(nenhuma)'}`
        );
    }
}

const getAutoModePrompt = (tasksDescription, tasks) => `
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
`;

const getHardModePrompt = (tasksDescription, tasks) => `
You are an expert dependency analyzer with DEEP REASONING capabilities for a highly parallel task execution system.

Your mission: **Maximize parallel execution by identifying ONLY true dependencies WHILE providing rigorous analysis and justification**.

---

## Tasks to Analyze

${tasksDescription}

---

## Analysis Protocol (HARD MODE)

### Phase 1: Extract File Information with Deep Analysis
For each task, identify and document:
1. Files it will CREATE (with justification for each)
2. Files it will MODIFY (specific sections/functions)
3. Files/modules it depends on (with analysis of why)
4. Assumptions made about the codebase structure

**Document your reasoning:** Why does this task affect these files? What assumptions are you making?

### Phase 2: Detect Conflicts (PRECISE & JUSTIFIED)

**File Write Conflicts (Sequential Required):**
- If Task A and Task B both MODIFY the same file → B depends on A
  - **Justification required:** Document WHY they can't both modify simultaneously
- If Task A CREATES file X and Task B MODIFIES file X → B depends on A
  - **Justification required:** Explain the dependency relationship

**NO Conflict (Parallel Allowed):**
- Task A creates file1.js, Task B creates file2.js → INDEPENDENT
- Task A modifies moduleA, Task B modifies moduleB → INDEPENDENT
- Task A and Task B both READ the same file → INDEPENDENT

**For each dependency decision, document:**
- What specific conflict exists?
- Why can't this be parallelized?
- What assumptions are being made?

### Phase 3: Detect Logical Dependencies with Reasoning

**True Logical Dependency:**
- Task B explicitly tests/uses Task A's output
  - **Document:** What specific output? How is it used?
- Task B extends/builds upon Task A's functionality
  - **Document:** What functionality? Why can't it be independent?
- Task B needs Task A's file to exist before it can work
  - **Document:** Why can't Task B create its own version?

**NOT a Dependency:**
- Tasks in the same domain (e.g., both about "users") → INDEPENDENT
- Tasks that sequentially make sense but don't share code → INDEPENDENT
- Task execution order preference (if not required) → INDEPENDENT

**For each non-dependency, document:**
- Why these tasks ARE independent
- What makes them parallelizable
- What assumptions support this conclusion

### Phase 4: Dependency Rules with Verification

1. **Default to Independence:** @dependencies []
   - Assumption: Tasks are independent unless proven otherwise

2. **Add dependency ONLY if:**
   - Same file modified by both (file conflict)
   - Task B needs Task A's output to function (logical dependency)
   - Clear build-upon relationship (documented)

3. **Chain Simplification:**
   - Only direct dependencies
   - If C→B→A, write: C: @dependencies [B], B: @dependencies [A]
   - NOT: C: @dependencies [A, B]

4. **Verification Checklist for each dependency:**
   - [ ] Specific file conflict identified?
   - [ ] Logical dependency clearly documented?
   - [ ] Assumption stated explicitly?
   - [ ] Alternative parallel approach considered and rejected?

### Phase 5: Parallelization Strategy with Reasoning

**Prefer this pattern (with justification):**

    TASK1: @dependencies []  ← Foundation (creates base infrastructure)
    TASK2: @dependencies []  ← Independent feature 1 (different files from TASK1)
    TASK3: @dependencies []  ← Independent feature 2 (different files from TASK1, TASK2)
    TASK4: @dependencies [TASK1, TASK2, TASK3]  ← Integration (tests all features together)

**Reasoning:** Why are TASK2 and TASK3 independent? What files do they each affect?

**Avoid this (over-coupling - justify if used):**

    TASK1: @dependencies []
    TASK2: @dependencies [TASK1]  ← Justify: Why does TASK2 depend on TASK1?
    TASK3: @dependencies [TASK2]  ← Justify: Why does TASK3 depend on TASK2?

### Phase 6: Deep Reasoning Documentation

For EACH task, you must add reasoning comments in TASK.md explaining:
1. **Why this dependency list?**
   - What specific conflicts or logical dependencies exist?
   - What assumptions support this analysis?

2. **What parallelization opportunities?**
   - Which tasks can run in parallel with this one?
   - Why are they independent?

3. **What risks exist?**
   - What could go wrong with this dependency analysis?
   - What edge cases were considered?

---

## Decision Process (Step by Step with Documentation)

For each task:

1. **List files affected** (from "Files Affected" section)
   - Document assumptions about file structure

2. **Compare with other tasks:**
   - Same file modified? → Add dependency + justify
   - Different files? → Independent + document why

3. **Check logical needs:**
   - Does it import/use another task's code? → Add dependency + explain what & why
   - Just related domain? → Independent + document reasoning

4. **Document assumptions:**
   - What are you assuming about the codebase?
   - What unknowns exist?

5. **Write @dependencies line + reasoning**

---

## Output Format

For EACH task, **prepend** \`@dependencies [list]\` as the **FIRST LINE** of TASK.md, followed by dependency reasoning:

**Example Decision Log with Deep Reasoning:**

    TASK1: Creates src/server.js (HTTP server base setup)
    TASK2: Creates src/routes/health.js (imports from server.js)
    TASK3: Creates src/routes/users.js (imports from server.js)
    TASK4: Creates tests/health.test.js (tests TASK2's route)

    Deep Analysis:
    - TASK1: Foundation, no deps → @dependencies []
      Reasoning: Creates base infrastructure that others will use
      Assumptions: Standard Express.js setup
      Risks: None, foundational task

    - TASK2: Needs server.js from TASK1 → @dependencies [TASK1]
      Reasoning: Imports app object from server.js to register route
      Assumptions: TASK1 exports configured Express app
      Risks: If TASK1 doesn't export app correctly, TASK2 will fail
      Parallel with: TASK3 (both register different routes)

    - TASK3: Needs server.js from TASK1 → @dependencies [TASK1]
      Reasoning: Imports app object from server.js to register route
      Assumptions: TASK1 exports configured Express app
      Risks: If TASK1 doesn't export app correctly, TASK3 will fail
      Parallel with: TASK2 (both register different routes)

    - TASK4: Tests TASK2's code → @dependencies [TASK2]
      Reasoning: Tests the health endpoint created by TASK2
      Assumptions: TASK2 implements /health endpoint correctly
      Risks: Test will fail if TASK2's endpoint doesn't exist
      Parallel with: TASK5 (if exists, testing different endpoint)

    Result: TASK2 and TASK3 run in parallel (both after TASK1)
    Parallelism Ratio: 4 tasks / 3 layers = 1.33
    Optimization opportunity: If TASK4 and TASK5 exist, they can run in parallel

**Applied to files with reasoning:**

File: TASK1/TASK.md
    @dependencies []

    <!-- DEPENDENCY REASONING -->
    ## Dependency Analysis
    - **Dependencies:** None
    - **Reasoning:** Foundation task that creates base server infrastructure
    - **Assumptions:** Standard Express.js project structure
    - **Blocks:** TASK2, TASK3 (both need server.js)
    - **Parallel with:** None (must run first)
    - **Risks:** None identified

    # Task: Initialize Express server
    ...

File: TASK2/TASK.md
    @dependencies [TASK1]

    <!-- DEPENDENCY REASONING -->
    ## Dependency Analysis
    - **Dependencies:** TASK1
    - **Reasoning:** Requires server.js (Express app) from TASK1 to register route
    - **Assumptions:** TASK1 exports configured app object
    - **Blocks:** TASK4 (health endpoint tests)
    - **Parallel with:** TASK3 (different route, no file conflicts)
    - **Risks:** Failure if TASK1 doesn't export app

    # Task: Create health check endpoint
    ...

File: TASK3/TASK.md
    @dependencies [TASK1]

    <!-- DEPENDENCY REASONING -->
    ## Dependency Analysis
    - **Dependencies:** TASK1
    - **Reasoning:** Requires server.js (Express app) from TASK1 to register route
    - **Assumptions:** TASK1 exports configured app object
    - **Blocks:** TASK5 (users endpoint tests, if exists)
    - **Parallel with:** TASK2 (different route, no file conflicts)
    - **Risks:** Failure if TASK1 doesn't export app

    # Task: Create users endpoint
    ...

File: TASK4/TASK.md
    @dependencies [TASK2]

    <!-- DEPENDENCY REASONING -->
    ## Dependency Analysis
    - **Dependencies:** TASK2
    - **Reasoning:** Tests the /health endpoint created by TASK2
    - **Assumptions:** TASK2 implements /health with correct status codes
    - **Blocks:** None (final layer)
    - **Parallel with:** TASK5 (if exists, tests different endpoint)
    - **Risks:** Test fails if TASK2's endpoint doesn't exist or behaves differently

    # Task: Add health endpoint tests
    ...

---

## Your Task (HARD MODE)

1. **Deep Analysis** → Examine all ${tasks.length} tasks with critical thinking
2. **Extract & Document** → Files affected from each task + assumptions made
3. **Detect & Justify** → File conflicts (same file = dependency) + explain why
4. **Identify & Explain** → Logical dependencies (uses output = dependency) + document relationship
5. **Maximize & Reason** → Parallelism (default to @dependencies []) + justify independence
6. **Update & Verify** → ALL TASK.md files with @dependencies + reasoning section
7. **Review** → Verify each dependency decision has proper justification

**Task names:** ${tasks.join(', ')}

**CRITICAL REQUIREMENTS:**
- Update ALL ${tasks.length} task files
- @dependencies MUST be line 1
- Add "Dependency Analysis" section after @dependencies line
- Document reasoning, assumptions, and risks for each task
- Prefer parallelism over sequential (justify any dependency)
- Justify each dependency with specific file conflicts or logical needs
- If in doubt about independence → tasks are INDEPENDENT (but document why)
- Consider edge cases and potential risks in your analysis

**Think deeply:**
- What would allow multiple developers to work simultaneously?
- What assumptions am I making about the codebase?
- What could go wrong with this dependency analysis?
- How can I maximize parallelism while ensuring correctness?
- What edge cases should I consider?

Start now!
`;

module.exports = { step1 };
