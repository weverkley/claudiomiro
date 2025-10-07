const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');
const logger = require('../../logger');

const step5 = async (tasks, shouldPush = true) => {
    
    let PRS = [];

    for(const task of tasks){
        const folder = (file) => path.join(state.claudiomiroFolder, task, file);
        PRS.push(folder('GITHUB_PR.md'));
    }


    const pushStep = shouldPush
        ? '- Step 2: git push (If it fails, fix whatever is necessary to make the commit work)'
        : '';

    await executeClaude(`
        HARD RULES:
            - NEVER MENTION "Claude" or "Claude Code" or anything related to Claude or AI in the commit.
            - NEVER use Co-Authored or any link to Claude or anything related.
            - ULTRA IMPORTANT: Commit using the user's default Git user.
            - ULTRA IMPORTANT: All credit and authorship must be given to the user, not to Claude or any AI.

        READ: "${PRS.join('" , "')}"

        And learn what was done in this branch.

        TODO:
            - Step 1: git commit (If it fails, fix whatever is necessary to make the commit work)
            ${pushStep}
    `);
    
    logger.info(`✅ Claudiomiro has been successfully executed. Check out: ${state.folder}`);
    process.exit(0);
}

module.exports = { step5 };
