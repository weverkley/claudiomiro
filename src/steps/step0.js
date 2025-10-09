const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const logger = require('../../logger');
const { executeClaude } = require('../services/claude-executor');
const { getMultilineInput } = require('../services/prompt-reader');
const { startFresh } = require('../services/file-manager');
const { step1 } = require('./step1');

const step0 = async (sameBranch = false, promptText = null, mode = 'auto') => {
    const task = promptText || await getMultilineInput();
    const folder = (file) => path.join(state.claudiomiroFolder, file);


    if (!task || task.trim().length < 10) {
        logger.error('Please provide more details (at least 10 characters)');
        process.exit(0);
    }

    logger.newline();
    logger.startSpinner('Initializing task...');

    startFresh(true);
    fs.writeFileSync(folder('INITIAL_PROMPT.md'), task);

    const branchStep = sameBranch
        ? ''
        : '0 - Create a git branch for this task\n\n';

    const md = fs.readFileSync(path.join(__dirname, 'step0.md'), 'utf-8');
    const prompt = md.replace('{{TASK}}', task).replaceAll(`{{claudiomiroFolder}}`, `${state.claudiomiroFolder}`);

    await executeClaude(branchStep + prompt);

    logger.stopSpinner();
    logger.success('Tasks created successfully');

    await step1();
}

module.exports = { step0 };
