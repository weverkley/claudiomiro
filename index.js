#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const prompts = require('prompts');
const logger = require('./logger');

let folder;

const startFresh = () => {
    const files = ['GITHUB_PR.md', 'LOG.md', 'PROMPT.md', 'TODO.md', '.claudiomiro_log.txt'];

    logger.task('Cleaning up previous files...');
    logger.indent();
    for(const file of files){
        const f = path.join(folder, file);
        if(fs.existsSync(f)){
            fs.rmSync(f);
            logger.success(`${file} removed`);
        }
    }
    logger.outdent();
}

const executeClaude = (text) => {
    return new Promise((resolve, reject) => {
        // Create temporary file for the prompt
        const tmpFile = path.join(os.tmpdir(), `claudiomiro-prompt-${Date.now()}.txt`);
        fs.writeFileSync(tmpFile, text, 'utf-8');

        // Use sh to execute command with cat substitution
        const command = `claude --dangerously-skip-permissions -p "$(cat '${tmpFile}')" --output-format stream-json --verbose`;

        logger.stopSpinner();
        logger.command(`claude --dangerously-skip-permissions -p --output-format stream-json (in ${folder})`);
        logger.separator();
        logger.newline();

        const claude = spawn('sh', ['-c', command], {
            cwd: folder,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        const logFilePath = path.join(folder, '.claudiomiro_log.txt');
        const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

        // Log separator with timestamp
        const timestamp = new Date().toISOString();
        logStream.write(`\n\n${'='.repeat(80)}\n`);
        logStream.write(`[${timestamp}] Claude execution started\n`);
        logStream.write(`${'='.repeat(80)}\n\n`);

        let buffer = '';

        // Captura stdout e processa JSON streaming
        claude.stdout.on('data', (data) => {
            const output = data.toString();
            // Adiciona ao buffer
            buffer += output;

            // Processa linhas completas
            const lines = buffer.split('\n');

            // A última linha pode estar incompleta, então mantém no buffer
            buffer = lines.pop() || '';


            for (const line of lines) {
                try {
                    const json = JSON.parse(line);

                    for(const msg of json.message.content){
                        if(msg.text){
                            logger.info('💬 Claude:');
                            console.log(msg.text);
                        }
                        else if(msg.content){
                            logger.info('💬 Claude:');
                            console.log(msg.content);
                        }
                        else if (msg.type === 'error') {
                            // Error
                            logger.error(`❌ Claude: ${msg.error?.message || 'Unknown error'}`);
                        } else {
                            logger.info('💬 Claude: '  + msg.type + '...');
                        }
                    }
                } catch (e) {
                    logger.error(line);
                }
            }

            // Sempre mostra no terminal em tempo real
            // process.stdout.write(output);

            // Log to file
            logStream.write(output);
        });

        // Captura stderr
        claude.stderr.on('data', (data) => {
            const output = data.toString();
            process.stderr.write(output);
            logStream.write('[STDERR] ' + output);
        });

        // Quando o processo terminar
        claude.on('close', (code) => {
            // Clean up temporary file
            try {
                if (fs.existsSync(tmpFile)) {
                    fs.unlinkSync(tmpFile);
                }
            } catch (err) {
                logger.error(`Failed to cleanup temp file: ${err.message}`);
            }

            logStream.write(`\n\n[${new Date().toISOString()}] Claude execution completed with code ${code}\n`);
            logStream.end();

            logger.newline();
            logger.separator();

            if (code !== 0) {
                logger.error(`Claude exited with code ${code}`);
                reject(new Error(`Claude exited with code ${code}`));
            } else {
                logger.success('Claude execution completed');
                resolve();
            }
        });

        // Tratamento de erro
        claude.on('error', (error) => {
            // Clean up temporary file on error
            try {
                if (fs.existsSync(tmpFile)) {
                    fs.unlinkSync(tmpFile);
                }
            } catch (err) {
                logger.error(`Failed to cleanup temp file: ${err.message}`);
            }

            logStream.write(`\n\nERROR: ${error.message}\n`);
            logStream.end();
            logger.error(`Failed to execute Claude: ${error.message}`);
            reject(error);
        });
    });
}

const getMultilineInput = () => {
    const readline = require('readline');
    const chalk = require('chalk');

    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        let lines = [];
        let isFirstLine = true;

        console.log();
        console.log(chalk.bold.cyan('─────────────────────────────────────────────'));
        console.log(chalk.white('Describe what you need help with:'));
        console.log(chalk.bold.cyan('─────────────────────────────────────────────'));
        console.log(chalk.gray('✓ Write or paste your task description'));
        console.log(chalk.gray('✓ Paste code, URLs, or drag & drop file paths') );
        console.log(chalk.gray('✓ Press ENTER twice to submit') );
        console.log(chalk.gray('✓ Press Ctrl+C to cancel'));
        console.log(chalk.bold.cyan('─────────────────────────────────────────────'));
        console.log();
        process.stdout.write(chalk.cyan('🤖 > '));

        rl.on('line', (line) => {
            if (line.trim() === '' && lines.length > 0 && lines[lines.length - 1].trim() === '') {
                // Segunda linha vazia consecutiva - finaliza
                rl.close();
                const result = lines.slice(0, -1).join('\n').trim();
                resolve(result);
            } else {
                lines.push(line);
                if (!isFirstLine) {
                    process.stdout.write(chalk.cyan('    '));
                }
                isFirstLine = false;
            }
        });

        rl.on('SIGINT', () => {
            rl.close();
            console.log();
            logger.error('Operation cancelled');
            process.exit(0);
        });
    });
};

const step1 = async (sameBranch = false, promptText = null) => {
    const task = promptText || await getMultilineInput();

    if (!task || task.trim().length < 10) {
        logger.error('Please provide more details (at least 10 characters)');
        process.exit(0);
    }

    logger.newline();
    logger.startSpinner('Initializing task...');

    const branchStep = sameBranch
        ? ''
        : '- Step 1: Create a git branch for this task\n        ';

    const stepNumber = sameBranch ? 1 : 2;

    await executeClaude(`
        ${branchStep}- Step ${stepNumber}: Improve this prompt and create PROMPT.md
        Task:
        \`\`\`
            ${task}
        \`\`\`

        Rules:

        Super think about it and follow the steps:
            1.	Read relevant files, images, or URLs.
            2.	Make a plan for how to approach a specific problem and create TODO.md.

        Inside TODO.md, you must specify every step required to solve the problem.

        IMPORTANT — Remember the rules:
            •	In TODO.md, only include code-related tasks. Leave out anything that must be done manually.
            •	Do not write anything about deployment in TODO.md.
            •	In the backend, we must have tests for every layer, and integration tests for the routes.
            •	In the frontend, we must have tests for every component.
            •	Do not alter the database manually — everything must be done with migrations.
            •	The first line of TODO.md must be exactly: "Fully implemented: NO"
            •	ULTRA IMPORTANT: Tests must use mocked data only and must never connect to the real database.
    `);

    logger.stopSpinner();
    logger.success('Task initialized successfully');
}

const step2 = () => {
    return executeClaude(`Now read the PROMPT.md, perform a complete and extensive research, and then update the TODO.md based on your findings. Use context7`);
}

const step3 = () => {
    return executeClaude(`  
        OBJECTIVE
        - Implement everything in TODO.md step by step.
        - After each successful step, update TODO.md by changing "- [ ]" to "- [X]" for the exact item implemented. Never reword items.

        HARD RULES
        - Tests must use mocked data and never connect to a real database.
        - Frontend tests must mock backend API responses.
        - The first line of TODO.md must be exactly: "Fully implemented: <YES/NO>" (only YES or NO).
        - Preserve headings, numbering, indentation, and bullet order. Only change the checkbox from [ ] to [X].
        - Do NOT mark an item as done until:
            1) Implementation is complete,
            2) Lint/build pass,
            3) All related tests pass.
        - If an item is blocked or ambiguous, DO NOT guess. Add a sub-bullet under the item:
            - "BLOCKED: <short reason>"
        - Never mark partially done items. If you must split work, add temporary sub-bullets under the same item without altering the original text.
        - Idempotent runs: keep all existing [X] checks intact.

        BLOCKED POLICY (UPDATED)
        - If an item has a sub-bullet exactly starting with "BLOCKED:" under it, treat it as non-actionable for this run:
        - Immediately flip that item's checkbox from "- [ ]" to "- [X]" without changing its text.
        - Do NOT attempt implementation, lint/build, or tests for that item.
        - In the Progress Log, set result to "blocked-skip" and record a brief reason copied verbatim from the BLOCKED line.
        - Never reword the original item or its BLOCKED sub-bullet.
        - This exception applies ONLY to items explicitly marked with a "BLOCKED:" sub-bullet.

        OPERATING LOOP
        1) Read TODO.md.
        2) Set "Fully implemented: <YES/NO>" based on whether any "- [ ]" remain (YES only when none remain).
        3) Pick the first unchecked item whose prerequisites are satisfied.
        3a) If that item contains a "BLOCKED:" sub-bullet, apply the BLOCKED POLICY and skip directly to step 6.
        4) Implement the change.
        5) Run verification:
        - Lint/build
        - Unit/integration tests (with mocks)
        6) If verification passes (or BLOCKED POLICY was applied):
        - Update TODO.md: flip "- [ ]" to "- [X]" for that exact line.
        - Append to the bottom of TODO.md (append-only):

            ## Progress Log
            - <timestamp ISO8601>  CHECKED: "<exact item text>"
            files: <comma-separated paths>
            cmds: <commands run>
            result: <pass | blocked-skip>

        If verification fails:
        - DO NOT check the item.
        - Under the item, add a sub-bullet:
            - "FAILED: <why/which step failed>"

        FORMATTING CONSTRAINTS
        - Only modify the one checkbox per completed item and append to "Progress Log".
        - Do not rename sections or items.
        - Do not alter code blocks or quoted text.
        - Keep markdown checkboxes exactly as "- [ ]" and "- [X]" (uppercase X).

        STOPPING CONDITIONS
        - Continue until all items are "- [X]" or the process is blocked on items without a "BLOCKED:" sub-bullet.
        - When all items are checked, set first line to "Fully implemented: YES".

        CONTEXT
        - Use context7.

        OUTPUT POLICY
        - After each loop iteration, return:
        1) The updated TODO.md (full file content),
        2) A short summary of the step taken (one paragraph).
    `);    
}

const step4 = () => {
    return executeClaude(`  
        - Step 1: Run all tests (in every folder with package.json) - Example: "cd frontend && npm test" and "cd backend && bun test"  
        - Step 2: If any test fails – fix it.  
        - ULTRA IMPORTANT: Tests must use mocked data and never have a real connection to the database.  
        - ULTRA IMPORTANT: The frontend must test by mocking the backend API responses to ensure that if the backend responds correctly, the frontend will work properly.  
        - Step 3: Check all frontend calls to the backend and verify they are correct and actually exist.  
        - Step 4: IF AND ONLY IF ALL TESTS PASS: Create a file named GITHUB_PR.md based on PROMPT.md, TODO.md, and LOG.md.  
        - Do not create GITHUB_PR.md if any test is failing.  
    `);
}

const step5 = async (shouldPush = true) => {
    const pushStep = shouldPush
        ? '- Step 2: git push (If it fails, fix whatever is necessary to make the commit work)'
        : '';

    await executeClaude(`
        - Step 1: git commit (If it fails, fix whatever is necessary to make the commit work)
        ${pushStep}

        - IMPORTANT: NEVER MENTION “Claude” or “Claude Code” or anything related to Claude or AI in the commit.
        - IMPORTANT: NEVER use Co-Authored or any link to Claude or anything related.
        - ULTRA IMPORTANT: Commit using the user’s default Git user.
        - ULTRA IMPORTANT: All credit and authorship must be given to the user, not to Claude or any AI.
    `);
    process.exit(0);
}

const isFullyImplemented = () => {
    const todo = fs.readFileSync(path.join(folder, 'TODO.md'), 'utf-8');
    const lines = todo.split('\n').slice(0, 10); // Check first 10 lines

    for (const line of lines) {
        const trimmedLine = line.trim().toLowerCase();
        // Check if line is exactly "fully implemented: yes" (not inside a task)
        if (trimmedLine === 'fully implemented: yes' || trimmedLine.startsWith('fully implemented: yes')) {
            // Make sure it's not part of a task (doesn't start with - [ ])
            if (!line.trim().startsWith('-')) {
                return true;
            }
        }
    }

    return false;
}

const chooseAction = async (i) => {
    // Verifica se --prompt foi passado e extrai o valor
    const promptArg = process.argv.find(arg => arg.startsWith('--prompt='));
    const promptText = promptArg ? promptArg.split('=').slice(1).join('=').replace(/^["']|["']$/g, '') : null;

    // Verifica se --fresh foi passado (ou se --prompt foi usado, que automaticamente ativa --fresh)
    const shouldStartFresh = process.argv.includes('--fresh') || promptText !== null;

    // Verifica se --push=false foi passado
    const shouldPush = !process.argv.some(arg => arg === '--push=false');

    // Verifica se --same-branch foi passado
    const sameBranch = process.argv.includes('--same-branch');

    // Filtra os argumentos para pegar apenas o diretório (remove --fresh, --push=false, --same-branch e --prompt)
    const args = process.argv.slice(2).filter(arg => arg !== '--fresh' && !arg.startsWith('--push') && arg !== '--same-branch' && !arg.startsWith('--prompt'));
    const folderArg = args[0] || process.cwd();

    // Resolve o caminho absoluto e define a variável global
    folder = path.resolve(folderArg);

    if (!fs.existsSync(folder)) {
        logger.error(`Folder does not exist: ${folder}`);
        process.exit(1);
    }

    logger.path(`Working directory: ${folder}`);
    logger.newline();

    if(shouldStartFresh && i === 0){
        startFresh();
    }

    if(fs.existsSync(path.join(folder, 'GITHUB_PR.md'))){
        logger.step(5, 'Creating pull request and committing');
        return step5(shouldPush);
    }


    if(fs.existsSync(path.join(folder, 'TODO.md'))){
        if(isFullyImplemented()){
            logger.step(4, 'Running tests and creating PR');
            return step4();
        }else{
            logger.step(3, 'Implementing tasks');
            return step3();
        }
    }


    if(fs.existsSync(path.join(folder, 'PROMPT.md'))){
        logger.step(2, 'Research and planning');
        return step2();
    }

    logger.step(1, 'Initialization');
    return step1(sameBranch, promptText);
}

const init = async () => {
    logger.banner();

    let i = 0;
    while(i < 15){
        await chooseAction(i);
        i++;
    }

    logger.error('Maximum iteration limit reached (15 cycles)');
    logger.box('The agent has completed 15 cycles. Please review the progress and restart if needed.', {
        borderColor: 'yellow',
        title: 'Limit Reached'
    });
}

init().catch((error) => {
    logger.newline();
    logger.failSpinner('An error occurred');
    logger.error(error.message);
    logger.newline();
    process.exit(1);
});