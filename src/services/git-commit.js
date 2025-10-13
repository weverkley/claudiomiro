const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../../logger');
const state = require('../config/state');
const { executeClaude } = require('./claude-executor');

const gitCommit = (text, shouldPush) => {
    return new Promise((resolve, reject) => {
        const escapedText = text.replace(/"/g, '\\"');
        const commitText = escapedText.length > 150 ? escapedText.substring(0, 147) + '...' : escapedText;
        
        const gitProcess = spawn('sh', ['-c', `git add . && git commit -m "${commitText}" ${shouldPush ? ` && git push` : ''}`], {
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

const commitOrFix = async (text, shouldPush) => {
    const noLimit = process.argv.includes('--no-limit');
    const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
    const maxAttemptsPerTask = limitArg ? parseInt(limitArg.split('=')[1], 10) : 20;
    const limit = noLimit ? Infinity : maxAttemptsPerTask;

    let i = 0;
    while(i < limit){
        try{
            await gitCommit(text, shouldPush)
            fs.writeFileSync(path.join(state.claudiomiroFolder, 'done.txt'), '1');
            return true;
        }catch(e){
            await executeClaude(`fix error ${e.message}`);
        }

        i++;
    }

    throw new Error(`Maximum attempts (${maxAttempts}) reached for git`);
}


module.exports = { gitCommit, commitOrFix };