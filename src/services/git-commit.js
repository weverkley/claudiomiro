const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../../logger');
const state = require('../config/state');
const { executeClaude } = require('./claude-executor');
const { ParallelStateManager } = require('./parallel-state-manager');

const gitCommit = (text, shouldPush, taskName = null) => {
    return new Promise((resolve, reject) => {
        const stateManager = taskName ? ParallelStateManager.getInstance() : null;
        const suppressStreamingLogs = Boolean(taskName) && stateManager && typeof stateManager.isUIRendererActive === 'function' && stateManager.isUIRendererActive();

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

            if (!suppressStreamingLogs) {
                logger.info(text);
            }

            if (stateManager && taskName) {
                stateManager.updateClaudeMessage(taskName, `🔧 Git: ${text.trim()}`);
            }
        });

        gitProcess.stderr.on('data', (data) => {
            const text = data.toString();
            stderr += text;

            if (!suppressStreamingLogs) {
                logger.info(text);
            }

            if (stateManager && taskName) {
                stateManager.updateClaudeMessage(taskName, `🔧 Git: ${text.trim()}`);
            }
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

const commitOrFix = async (text, shouldPush, retry = null, taskName = null) => {
    logger.stopSpinner();
    logger.command('git add . && git commit -m "..."' + (shouldPush ? ' && git push' : ''));
    logger.separator();
    logger.newline();
    logger.info('Git commiting...');

    const noLimit = process.argv.includes('--no-limit');
    const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
    const maxAttemptsPerTask = limitArg ? parseInt(limitArg.split('=')[1], 10) : 20;
    const limit = retry ? retry : noLimit ? Infinity : maxAttemptsPerTask;

    let i = 0;
    while(i < limit){
        try{
            await gitCommit(text, shouldPush, taskName);
            fs.writeFileSync(path.join(state.claudiomiroFolder, 'done.txt'), '1');
            logger.newline();
            logger.newline();
            logger.separator();
            logger.success('Git commit completed');
            return true;
        }catch(e){
            logger.error(`Git commit attempt ${i + 1} failed: ${e.message}`);
            await executeClaude(`fix error ${e.message}`, taskName);
        }

        i++;
    }

    throw new Error(`Maximum attempts (${maxAttemptsPerTask}) reached for git`);
}


module.exports = { gitCommit, commitOrFix };