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
            // Casos onde não há nada para commit - deve resolver (não é erro)
            if(
                stderr.includes('nothing to commit') ||
                stderr.includes('no changes added to commit') ||
                stdout.includes('nothing to commit') ||
                stdout.includes('no changes added to commit') ||
                stderr.includes('working tree clean') ||
                stdout.includes('working tree clean')
            ) {
                return resolve();
            }

            // Erros de hooks do git - deve rejeitar
            if(
                stderr.includes('pre-commit hook') ||
                stderr.includes('commit-msg hook') ||
                stderr.includes('pre-push hook') ||
                stderr.includes('hook declined') ||
                stderr.includes('hook rejected') ||
                stdout.includes('pre-commit hook') ||
                stdout.includes('commit-msg hook') ||
                stdout.includes('pre-push hook') ||
                stdout.includes('hook declined') ||
                stdout.includes('hook rejected')
            ) {
                const errorMessage = `Git hook failed\nStdout: ${stdout}\nStderr: ${stderr}`;
                return reject(new Error(errorMessage));
            }

            // Outros erros - deve rejeitar
            if (code !== 0) {
                const errorMessage = `Git command failed with code ${code}\nStdout: ${stdout}\nStderr: ${stderr}`;
                reject(new Error(errorMessage));
            } else {
                resolve();
            }
        });
    });
}

const validateGitEnvironment = async () => {
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
        // Check if we're in a git repository
        const gitCheck = spawn('git', ['rev-parse', '--git-dir'], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        gitCheck.on('close', (code) => {
            if (code !== 0) {
                reject(new Error('Not a git repository'));
                return;
            }
            resolve();
        });
    });
};

const validateGitStatus = async () => {
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
        // Check if there are files to commit
        const gitStatus = spawn('git', ['status', '--porcelain'], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        let stdout = '';
        gitStatus.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        gitStatus.on('close', (code) => {
            if (code !== 0) {
                reject(new Error('Failed to check git status'));
                return;
            }

            if (!stdout.trim()) {
                reject(new Error('No changes to commit'));
                return;
            }
            resolve(stdout);
        });
    });
};

const validateCurrentBranch = async () => {
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
        // Get current branch
        const gitBranch = spawn('git', ['branch', '--show-current'], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        let stdout = '';
        gitBranch.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        gitBranch.on('close', (code) => {
            if (code !== 0) {
                reject(new Error('Failed to get current branch'));
                return;
            }

            const branch = stdout.trim();
            if (!branch) {
                reject(new Error('No current branch found'));
                return;
            }
            resolve(branch);
        });
    });
};

const validateRemoteConnection = async () => {
    const { spawn } = require('child_process');

    return new Promise((resolve) => {
        // Check if remote exists and connection works
        const gitRemote = spawn('git', ['ls-remote', 'origin', 'HEAD'], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        gitRemote.on('close', (code) => {
            // Don't reject if remote check fails - just warn
            resolve(code === 0);
        });
    });
};

const commitOrFix = async (text, shouldPush, retry = null, taskName = null) => {
    logger.stopSpinner();
    logger.command('git add . && git commit -m "..."' + (shouldPush ? ' && git push' : ''));
    logger.separator();
    logger.newline();
    logger.info('Git committing...');

    // Pre-validation (non-blocking)
    try {
        logger.info('Validating git environment...');

        // 1. Check if we're in a git repository
        try {
            await validateGitEnvironment();
            logger.info('✓ Git repository validated');
        } catch (e) {
            logger.warning(`⚠️  ${e.message} - skipping commit`);
            return true;
        }

        // 2. Check if there are files to commit
        try {
            const statusOutput = await validateGitStatus();
            const changedFiles = statusOutput.trim().split('\n').length;
            logger.info(`✓ Found ${changedFiles} file(s) to commit`);
        } catch (e) {
            logger.warning(`⚠️  ${e.message} - skipping commit`);
            return true;
        }

        // 3. Check current branch
        try {
            const currentBranch = await validateCurrentBranch();
            logger.info(`✓ Current branch: ${currentBranch}`);
        } catch (e) {
            logger.warning(`⚠️  ${e.message} - will try to commit anyway`);
        }

        // 4. Check remote connection if push is requested (non-critical)
        if (shouldPush) {
            const remoteConnected = await validateRemoteConnection();
            if (!remoteConnected) {
                logger.warning('⚠️  Remote connection failed - will attempt commit without push guarantee');
            } else {
                logger.info('✓ Remote connection validated');
            }
        }

        // 5. Validate commit message
        if (!text || text.trim().length === 0) {
            logger.warning('⚠️  Commit message is empty - skipping commit');
            return true;
        }

        // 6. Check if commit message has valid format (warning only)
        const commitMessage = text.trim();
        if (commitMessage.length > 72) {
            logger.warning('⚠️  Commit message exceeds 72 characters');
        }

        logger.info('Pre-validations completed, attempting commit...');
    } catch (e) {
        logger.warning(`⚠️  Validation error: ${e.message} - will attempt commit anyway`);
    }

    const limit = Math.max(1, retry || 1);
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
            logger.warning(`⚠️  Git commit attempt ${i + 1}/${limit} failed: ${e.message}`);

            // Don't retry for certain errors - just skip
            if (e.message.includes('Not a git repository') ||
                e.message.includes('No changes to commit') ||
                e.message.includes('nothing to commit') ||
                e.message.includes('working tree clean')) {
                logger.info('ℹ️  No commit needed - continuing...');
                return true;
            }

            // On last attempt, don't try to fix, just log and continue
            if (i >= limit - 1) {
                logger.warning('⚠️  All commit attempts failed - continuing without commit');
                return true;
            }

            // Try to fix with Claude only if we have retries left
            try {
                await executeClaude(
                    `FIX THE ERROR:\n\n` + 
                    `${e.message}\n\n` + 
                    `HARD RULES:\n` + 
                    ` - NEVER mention that you are an AI model\n` +
                    ` - NEVER mention Authored or Co-Authored\n` + 
                    ` - NEVER mention any AI model (example: Claude, ChatGPT, GLM, Deepseek)\n` + 
                    ` - The Authorship must be the user and only the user\n` +
                    ` - NOBODY can know that AI was used\n`, 
                    taskName
                );
            } catch (fixError) {
                logger.warning(`⚠️  Could not fix error automatically: ${fixError.message}`);
            }
        }

        i++;
    }

    // Always return true to not block the flow
    logger.info('ℹ️  Commit process completed (with or without success)');
    return true;
}


module.exports = { gitCommit, commitOrFix };