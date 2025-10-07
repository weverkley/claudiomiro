const { executeClaude } = require('../services/claude-executor');

const step5 = async (tasks, shouldPush = true) => {
    const pushStep = shouldPush
        ? '- Step 2: git push (If it fails, fix whatever is necessary to make the commit work)'
        : '';

    await executeClaude(`
        HARD RULES:
            - NEVER MENTION "Claude" or "Claude Code" or anything related to Claude or AI in the commit.
            - NEVER use Co-Authored or any link to Claude or anything related.
            - ULTRA IMPORTANT: Commit using the user's default Git user.
            - ULTRA IMPORTANT: All credit and authorship must be given to the user, not to Claude or any AI.

        READ: "${tasks.join('/GITHUB_PR.md" , "')}"

        And learn what was done in this branch.

        TODO:
            - Step 1: git commit (If it fails, fix whatever is necessary to make the commit work)
            ${pushStep}
    `);
    
    process.exit(0);
}

module.exports = { step5 };
