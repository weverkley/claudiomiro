#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const prompts = require('prompts');
const logger = require('./logger');

let folder;

const startFresh = () => {
    const files = ['GITHUB_PR.md', 'LOG.md', 'PROMPT.md', 'TODO.md', 'claudiomiro_log.txt'];

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
        const args = ['--dangerously-skip-permissions', '-p', text];

        logger.stopSpinner();
        logger.command(`claude --dangerously-skip-permissions -p (in ${folder})`);
        logger.separator();
        logger.newline();

        const claude = spawn('claude', args, {
            cwd: folder,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        const logFilePath = path.join(folder, 'claudiomiro_log.txt');
        const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

        // Log separator with timestamp
        const timestamp = new Date().toISOString();
        logStream.write(`\n\n${'='.repeat(80)}\n`);
        logStream.write(`[${timestamp}] Claude execution started\n`);
        logStream.write(`${'='.repeat(80)}\n\n`);

        // Captura stdout
        claude.stdout.on('data', (data) => {
            const output = data.toString();
            process.stdout.write(output);
            logStream.write(output);
        });

        // Captura stderr
        claude.stderr.on('data', (data) => {
            const output = data.toString();
            process.stderr.write(output);
            logStream.write(output);
        });

        // Quando o processo terminar
        claude.on('close', (code) => {
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
            logStream.write(`\n\nERROR: ${error.message}\n`);
            logStream.end();
            logger.error(`Failed to execute Claude: ${error.message}`);
            reject(error);
        });
    });
}

const step1 = async () => {
    logger.newline();
    const response = await prompts({
        type: 'text',
        name: 'task',
        message: '🤖 What would you like me to help you with?',
        validate: value => value.length < 10 ? 'Please provide more details (at least 10 characters)' : true
    });

    if (!response.task) {
        logger.error('Operation cancelled');
        process.exit(0);
    }

    logger.newline();
    logger.startSpinner('Initializing task...');

    await executeClaude(`  
        - Step 1: Create a git branch for this task
        - Step 2: Improve this prompt and create PROMPT.md
        Task:
        \`\`\`
            ${response.task}
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
        - Keep working till Implement everything from the TODO.md.  
        - ULTRA IMPORTANT: Tests must use mocked data and never have a real connection to the database.  
        - ULTRA IMPORTANT: The frontend must test by mocking the backend API responses to ensure that if the backend responds correctly, the frontend will work properly.  
        - Update the TODO.md with the progress made.  
        - The first line of TODO.md must be 'Fully implemented: <YES/NO>' (only "YES" or "NO" values are accepted on the first line).  
        - Use context7  
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

const chooseAction = async () => {
    // Verifica se --fresh foi passado
    const shouldStartFresh = process.argv.includes('--fresh');

    // Verifica se --push=false foi passado
    const shouldPush = !process.argv.some(arg => arg === '--push=false');

    // Filtra os argumentos para pegar apenas o diretório (remove --fresh e --push=false)
    const args = process.argv.slice(2).filter(arg => arg !== '--fresh' && !arg.startsWith('--push'));
    const folderArg = args[0] || process.cwd();

    // Resolve o caminho absoluto e define a variável global
    folder = path.resolve(folderArg);

    if (!fs.existsSync(folder)) {
        logger.error(`Folder does not exist: ${folder}`);
        process.exit(1);
    }

    logger.path(`Working directory: ${folder}`);
    logger.newline();

    if(shouldStartFresh){
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
    return step1();
}

const init = async () => {
    logger.banner();

    let i = 0;
    while(i < 15){
        await chooseAction();
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