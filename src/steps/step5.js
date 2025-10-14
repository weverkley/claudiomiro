const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');
const logger = require('../../logger');
const { gitCommit, commitOrFix } = require('../services/git-commit');

const step5 = async (tasks, shouldPush = true) => {
    let PRS = [];

    for(const task of tasks){
        const folder = (file) => path.join(state.claudiomiroFolder, task, file);
        PRS.push(folder('CODE_REVIEW.md'));
    }
    
    await executeClaude(`Read "${PRS.join('" , "')}" and generate a 3 phrase resume of what was done and save in ${path.join(state.claudiomiroFolder, 'resume.txt')}`);


    if(!fs.existsSync(path.join(state.claudiomiroFolder, 'resume.txt'))){
        throw new Error('resume.txt not found')
    }

    const resume = fs.readFileSync(path.join(state.claudiomiroFolder, 'resume.txt'), 'utf-8');

    try {
        await commitOrFix(resume, shouldPush, 5);
    } catch (error) {
        // Log but don't block execution
        logger.warn('⚠️  Commit failed in step5, continuing anyway:', error.message);
    }

    logger.info(`✅ Claudiomiro has been successfully executed. Check out: ${state.folder}`);
    process.exit(0);
}

module.exports = { step5 };
