const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');
const logger = require('../../logger');

const gitCommit = (text, shouldPush) => {
    return new Promise((resolve, reject) => {
        const escapedText = text.replace(/"/g, '\\"');
        const gitProcess = spawn('sh', ['-c', `git add . && git commit -m "${escapedText}" ${shouldPush ? ` && git push` : ''}`], {
            cwd: process.cwd()
        });

        let stdout = '';
        let stderr = '';

        gitProcess.stdout.on('data', (data) => {
            const text = data.toString();
            stdout += text;
            logger.info(text);
        });

        gitProcess.stderr.on('data', (data) => {
            const text = data.toString();
            stderr += text;
            logger.info(text);
        });

        gitProcess.on('close', (code) => {
            if (code !== 0) {
                const errorMessage = `Git command failed with code ${code}\nStdout: ${stdout}\nStderr: ${stderr}`;
                reject(new Error(errorMessage));
            } else {
                resolve();
            }
        });
    });
}

const step5 = async (tasks, shouldPush = true) => {
    let PRS = [];

    for(const task of tasks){
        const folder = (file) => path.join(state.claudiomiroFolder, task, file);
        PRS.push(folder('CODE_REVIEW.md'));
    }
    
    await executeClaude(`Read "${PRS.join('" , "')}" and generate a 3 phrase resume of what was done and save in ${path.join(state.claudiomiroFolder, 'resume.txt')}`);

    const resume = fs.readFileSync(path.join(state.claudiomiroFolder, 'resume.txt'), 'utf-8');

    const noLimit = process.argv.includes('--no-limit');
    const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
    const maxAttemptsPerTask = limitArg ? parseInt(limitArg.split('=')[1], 10) : 20;
    const limit = noLimit ? Infinity : maxAttemptsPerTask;

    let i = 0;
    while(i < limit){
        try{
            await gitCommit(resume, shouldPush)
            logger.info(`✅ Claudiomiro has been successfully executed. Check out: ${state.folder}`);
            process.exit(0);
        }catch(e){
            await executeClaude(`fix error ${e.message}`);
        }

        i++;
    }

    throw new Error(`Maximum attempts (${maxAttempts}) reached for ${taskName}`);
}

module.exports = { step5 };
