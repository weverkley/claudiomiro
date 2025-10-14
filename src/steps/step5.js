const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');
const logger = require('../../logger');
const { gitCommit, commitOrFix } = require('../services/git-commit');
const { gitStatus } = require('../services/git-status');

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

    const gitStatusResult = await gitStatus();

    if (gitStatusResult.includes('nothing to commit')) {
        await executeClaude(
            `if you have GitLab mcp or Github mcp or Bitbucket mcp or any other git mcp that is able to create a pull request, use it to create.\n\n` + 
            `HARD RULES:\n` + 
            ` - NEVER mention that you are an AI model\n` +
            ` - NEVER mention Authored or Co-Authored\n` + 
            ` - NEVER mention any AI model (example: Claude, ChatGPT, GLM, Deepseek)\n` + 
            ` - The Authorship must be the user and only the user\n` +
            ` - NOBODY can know that AI was used\n`
        );
    }


    logger.info(`✅ Claudiomiro has been successfully executed. Check out: ${state.folder}`);
    process.exit(0);
}

module.exports = { step5 };
