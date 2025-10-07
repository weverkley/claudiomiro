const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const logger = require('../../logger');
const { executeClaude } = require('../services/claude-executor');

/**
 * Step 1.1: Analisa todas as tasks e define dependências baseado em conflitos de arquivo
 * Roda UMA VEZ após todos os step1 terem completado
 */
const step1_1 = async () => {
    logger.newline();
    logger.startSpinner('Analyzing task dependencies...');

    // Lê todas as tasks
    const tasks = fs
        .readdirSync(state.claudiomiroFolder)
        .filter(name => {
            const fullPath = path.join(state.claudiomiroFolder, name);
            return fs.statSync(fullPath).isDirectory();
        })
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (tasks.length === 0) {
        logger.stopSpinner();
        logger.warn('No tasks found for dependency analysis');
        return;
    }

    // Lê o conteúdo de cada task
    const taskContents = {};
    for (const task of tasks) {
        const taskMd = path.join(state.claudiomiroFolder, task, 'TASK.md');
        const promptMd = path.join(state.claudiomiroFolder, task, 'PROMPT.md');

        taskContents[task] = {
            task: fs.existsSync(taskMd) ? fs.readFileSync(taskMd, 'utf-8') : '',
            prompt: fs.existsSync(promptMd) ? fs.readFileSync(promptMd, 'utf-8') : ''
        };
    }

    // Monta o prompt para análise
    const tasksDescription = tasks
        .map(task => {
            return `### ${task}
**TASK.md:**
\`\`\`
${taskContents[task].task}
\`\`\`

**PROMPT.md:**
\`\`\`
${taskContents[task].prompt}
\`\`\`
`;
        })
        .join('\n\n');

    await executeClaude(`
You are a dependency analyzer for a task execution system.

Your mission is to **analyze all tasks** and determine which ones can run in **parallel** and which must run **sequentially** due to file conflicts.

---

## Tasks to Analyze

${tasksDescription}

---

## Analysis Rules

1. **File Conflict Detection**
   - If two or more tasks modify the **same file**, they CANNOT run in parallel
   - The task that should run first becomes a dependency of the others
   - Example: TASK1 and TASK2 both modify "src/user.js" → TASK2 depends on TASK1

2. **Logical Dependencies**
   - If a task explicitly depends on another task's output (e.g., "Test login" depends on "Create login endpoint")
   - Mark it as a dependency even if files are different

3. **Independent Tasks**
   - Tasks that modify different files and don't depend on each other can run in parallel
   - Mark them with empty dependencies: @dependencies []

4. **Dependency Chain**
   - If TASK3 depends on TASK2, and TASK2 depends on TASK1, only specify direct dependencies
   - Example: TASK3 → @dependencies [TASK2] (not [TASK1, TASK2])

5. **Conservative Analysis**
   - When in doubt, prefer sequential execution (add dependency) over parallel
   - Better safe than having merge conflicts

---

## Output Format

For EACH task, you must:

1. **Prepend** the line \`@dependencies [list]\` at the **very first line** of the TASK.md file
2. The list should contain only direct dependencies (other task names, comma-separated)
3. If no dependencies, use \`@dependencies []\`

**Example output:**

For ${state.claudiomiroFolder}/TASK1/TASK.md:
\`\`\`
@dependencies []
# Task: Create user database schema
...rest of the file...
\`\`\`

For ${state.claudiomiroFolder}/TASK2/TASK.md:
\`\`\`
@dependencies [TASK1]
# Task: Create user service
...rest of the file...
\`\`\`

For ${state.claudiomiroFolder}/TASK3/TASK.md:
\`\`\`
@dependencies [TASK1]
# Task: Create authentication service
...rest of the file...
\`\`\`

For ${state.claudiomiroFolder}/TASK4/TASK.md:
\`\`\`
@dependencies [TASK2, TASK3]
# Task: Create login endpoint
...rest of the file...
\`\`\`

---

## Your Task

1. Analyze all ${tasks.length} tasks
2. Identify which files each task will modify (infer from descriptions)
3. Detect conflicts and logical dependencies
4. Update EACH TASK.md file by prepending the @dependencies line

**IMPORTANT:**
- You MUST update ALL ${tasks.length} task files
- The @dependencies line MUST be the first line of each file
- Use exact task names (${tasks.join(', ')})
- Explain your reasoning for each dependency decision in your response

Start now!
`);

    logger.stopSpinner();
    logger.success('Task dependencies analyzed and updated');
}

module.exports = { step1_1 };
