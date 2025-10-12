const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const logger = require('../../logger');
const { executeClaude } = require('../services/claude-executor');
const { log } = require('console');

const step1 = async (mode = 'auto') => {
    logger.newline();
    logger.startSpinner('Analyzing task dependencies...');

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
    const prompt = getHardModePrompt(tasksDescription, tasks);

    try{
        await executeClaude(prompt);

        logger.stopSpinner();
        logger.success('Task dependencies analyzed and configured');
    }catch(e){
        logger.stopSpinner();
        throw e;
    }

   for (let i = 0; i < tasks.length; i++) {
        const taskName = tasks[i];
        const taskMd = path.join(state.claudiomiroFolder, taskName, 'TASK.md');

        if (!fs.existsSync(taskMd)) {
            continue;
        }

        const content = fs.readFileSync(taskMd, 'utf-8');
        const lines = content.split('\n');
        const firstLine = lines[0].trim();

        // Se já tem @dependencies, pula
        if (firstLine.startsWith('@dependencies')) {
            continue;
        }

        logger.info(`Not able to think about dependencies for ${taskName}...`);

        // Todas as tasks anteriores no array são dependências
        const dependencies = tasks.slice(0, i);
        const dependencyLine =
            dependencies.length > 0
                ? `@dependencies [${dependencies.join(', ')}]`
                : '@dependencies []';

        // Reescreve o arquivo com a nova linha no topo
        const updated = `${dependencyLine}\n${content}`;
        fs.writeFileSync(taskMd, updated, 'utf-8');
    }
}

const getHardModePrompt = (tasksDescription, tasks) => `
## Context to Analyze

${tasksDescription}

---

Your mission: **Maximize parallel execution by identifying ONLY true dependencies WHILE providing rigorous analysis and justification**.

Goal: For all tasks (${tasks.join(', ')}), read their TASK.md and PREPEND a single first line:
@dependencies [LIST]

Rules:
- Default: @dependencies []
- Add a dep ONLY if:
    1) Another prior task is going to edit a file that this task reads/edits (file conflict), OR
    2) This task needs another task’s output/API/file to run, OR
    3) Both tasks create/modify the SAME file (creation/modify conflict)
- Use ONLY direct deps (no transitive: if C→B→A, write C:[B], B:[A])
- Prefer parallelism; if unsure, leave it empty

Examples:
TASK1 → @dependencies []
TASK2 → @dependencies []
TASK3 → @dependencies [TASK1]
TASK4 → @dependencies [TASK1, TASK2, TASK3]

Procedure:
1) From the task descriptions and file impacts, infer minimal TRUE deps among the listed tasks.
2) Update each TASK.md so that "@dependencies [..]" is the FIRST LINE.

---

**CRITICAL REQUIREMENTS:**
- Update ALL ${tasks.length} task files
- @dependencies MUST be line 1
- @dependencies MUST be the first thing in the file
- Add "Dependency Analysis" section after @dependencies line
- Document reasoning, assumptions, and risks for each task
- Prefer parallelism over sequential (justify any dependency)
- Justify each dependency with specific file conflicts or logical needs
- If in doubt about independence → tasks are INDEPENDENT (but document why)
- Consider edge cases and potential risks in your analysis

**Think deeply:**
- What assumptions am I making about the codebase?
- What could go wrong with this dependency analysis?
- Could a change in file order, naming, or module structure invalidate my reasoning?
- Am I optimizing for true independence or just for convenience?


 🚨 CRITICAL: All task files MUST be created inside the {{claudiomiroFolder}} directory, NEVER in the project root.
`;

module.exports = { step1 };
