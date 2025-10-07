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
${branchStep}- Step ${stepNumber}: Establish PROCESS FOUNDATIONS and create PROMPT.md

Return a PROMPT.md with these sections:

## OBJECTIVE
- Rewrite the user’s ask clearly.
- Done when: list measurable acceptance criteria.

## CONSTRAINTS
- Backend: tests for each layer + integration tests on routes (mock DB).
- Frontend: tests for all components (mock API).
- Database: migrations only.
- ULTRA IMPORTANT: TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO.
- ULTRA IMPORTANT: TODO.md CAN'T MANUAL ACTIONS THAT CLAUDE CANNOT DO.
- TODO.md first line: "Fully implemented: NO".
- Never include deployment steps.

## CRITIQUE PASS (Top 5 Risks)
- List 5 risks + mitigations.

## OPERATING PRINCIPLES
- Atomic DAG nodes.
- Proofs required for each.
- No guessing; mark BLOCKED if unclear.

Task:
\`\`\`
${task}
\`\`\`
`);

    logger.stopSpinner();
    logger.success('Task initialized successfully');
}

const step2 = () => {
    return executeClaude(`
        PHASE: CONTEXT SELECTION & PLANNING

Read PROMPT.md and generate TODO.md with the first line "Fully implemented: NO".

- ULTRA IMPORTANT: TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO.
- ULTRA IMPORTANT: TODO.md CAN'T MANUAL ACTIONS THAT CLAUDE CANNOT DO.

### CONTEXT SELECTION
- Limit to 30 artifacts (files/dirs/URLs) with "why relevant".
- Explicitly list out-of-scope items.

### PLAN (DAG)
Each node must have:
- description
- prereq: [other nodes]
- output: expected files/changes
- proof: commands (lint|build|test)
- change_fence.allowlist: list of permitted paths/patterns
- risk_budget: low|medium|high

### CONTRACT SURFACE MAP
List contracts that cannot change without a dedicated BREAKING node:
- endpoints
- exported types/functions
- events/schemas
- env/config

### POLICY
- Do not include deployment tasks.
- No node without proof.
- At least one root node (no prereqs).

Output a full TODO.md including the PLAN and CONTRACT MAP.
Use context7.
`);
}

const step3 = () => {
    return executeClaude(`  
PHASE: EXECUTION LOOP (DEPENDENCY + SAFETY)

OBJECTIVE
- Implement TODO.md items one at a time following DAG order.
- ULTRA IMPORTANT: TODO.md REMOVE ALL BLOCKERS AND THINGS THAT CLAUDE CANNOT DO OR IS WAITING FOR THE USER.

### TEST STRATEGY (rings)
- R0 — smoke: typecheck/lint/build + short tests.
- R1 — affected modules only.
- R2 — full regression.
Pass required on all rings before check.

### CHANGE FENCE
- After implementation, run "git diff --name-only".
- Must be subset of change_fence.allowlist.
- If not, mark "FAILED: change fence violated (<file>)" and do not check.

### CONTRACT GATE
- Run contract tests for any touched contract.
- Failures → do not check.

### HIGH-RISK POLICY
- If risk_budget=high → enable SHADOW MODE:
  - Keep old vs new impl under feature flag.
  - Run A/B comparators on same fixtures.
  - Differences block checkbox.

### DIFF GUARD
- Denylist or unintended contract change → "FAILED: unintended diff".

### OPERATING LOOP
1. Read TODO.md and update first line to YES/NO.
2. Pick next node whose prereqs are all checked.
3. Apply BLOCKED POLICY if it has "BLOCKED:".
4. Implement.
5. Run proofs (R0→R1→R2, contracts, fences).
6. If all pass:
   - Flip "- [ ]"→"- [X]" for the node.
   - Append to Progress Log:
     - timestamp
     - files, cmds
     - ring results
     - fence result
     - result: pass|blocked-skip
7. If any fail:
   - Add sub-bullet "FAILED: <cause>".

### STOP-DIFF
- Do not alter TODO item names or unrelated files.
- No contract file edits without BREAKING node.

### BLOCKED POLICY
- Node with "BLOCKED:" → skip + mark checked + result "blocked-skip".

- ULTRA IMPORTANT: TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO - remove them.
- ULTRA IMPORTANT: TODO.md CAN'T MANUAL ACTIONS THAT CLAUDE CANNOT DO - remove them.

### OUTPUT
- Updated TODO.md + Progress Log summary.
Use context7.
    `);    
}

const step4 = () => {
    return executeClaude(`  
PHASE: QUALITY GATE & PR PACKAGING

### GATES
- All test rings passed on last iteration.
- Invariants checklist:
  [ ] coverage of affected modules not decreased
  [ ] build time within 10% of baseline
  [ ] no new error logs in tests
  [ ] no contract violations
  [ ] migrations consistent with schema

If all pass:
- Create GITHUB_PR.md combining PROMPT.md + TODO.md + LOG.md.

### PR CONTENT
- Diff summary by risk.
- Contracts changed (if any) + migration notes.
- Evidence: ring results + invariants.

If any gate fails:
- Do not create GITHUB_PR.md.
- Add "FAILED: <cause>" under affected node.
    `);
}

const step5 = async (shouldPush = true) => {
    const pushStep = shouldPush
        ? '- Step 2: git push (If it fails, fix whatever is necessary to make the commit work)'
        : '';

    await executeClaude(`
        HARD RULES:
            - NEVER MENTION “Claude” or “Claude Code” or anything related to Claude or AI in the commit.
            - NEVER use Co-Authored or any link to Claude or anything related.
            - ULTRA IMPORTANT: Commit using the user’s default Git user.
            - ULTRA IMPORTANT: All credit and authorship must be given to the user, not to Claude or any AI.

        TODO: 
            - Step 1: git commit (If it fails, fix whatever is necessary to make the commit work)
            ${pushStep}
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

    // Verifica se --maxCycles foi passado e extrai o valor
    const maxCyclesArg = process.argv.find(arg => arg.startsWith('--maxCycles='));
    const maxCycles = maxCyclesArg ? parseInt(maxCyclesArg.split('=')[1], 10) : 15;

    // Verifica se --fresh foi passado (ou se --prompt foi usado, que automaticamente ativa --fresh)
    const shouldStartFresh = process.argv.includes('--fresh') || promptText !== null;

    // Verifica se --push=false foi passado
    const shouldPush = !process.argv.some(arg => arg === '--push=false');

    // Verifica se --same-branch foi passado
    const sameBranch = process.argv.includes('--same-branch');

    // Filtra os argumentos para pegar apenas o diretório (remove --fresh, --push=false, --same-branch, --prompt e --maxCycles)
    const args = process.argv.slice(2).filter(arg => arg !== '--fresh' && !arg.startsWith('--push') && arg !== '--same-branch' && !arg.startsWith('--prompt') && !arg.startsWith('--maxCycles'));
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
        return { step: step5(shouldPush), maxCycles };
    }


    if(fs.existsSync(path.join(folder, 'TODO.md'))){
        if(isFullyImplemented()){
            logger.step(4, 'Running tests and creating PR');
            return { step: step4(), maxCycles };
        }else{
            logger.step(3, 'Implementing tasks');
            return { step: step3(), maxCycles };
        }
    }


    if(fs.existsSync(path.join(folder, 'PROMPT.md'))){
        logger.step(2, 'Research and planning');
        return { step: step2(), maxCycles };
    }

    logger.step(1, 'Initialization');
    return { step: step1(sameBranch, promptText), maxCycles };
}

const init = async () => {
    logger.banner();

    let i = 0;
    let maxCycles = 15;

    while(i < maxCycles){
        const result = await chooseAction(i);
        if (result && result.maxCycles) {
            maxCycles = result.maxCycles;
        }
        if (result && result.step) {
            await result.step;
        }
        i++;
    }

    logger.error(`Maximum iteration limit reached (${maxCycles} cycles)`);
    logger.box(`The agent has completed ${maxCycles} cycles. Please review the progress and restart if needed.`, {
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