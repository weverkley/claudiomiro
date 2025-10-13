const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const logger = require('../../logger');
const { executeClaude } = require('../services/claude-executor');
const { getMultilineInput } = require('../services/prompt-reader');
const { startFresh } = require('../services/file-manager');

const step0 = async (sameBranch = false, promptText = null, mode = 'auto') => {
    const task = promptText || await getMultilineInput();
    const folder = (file) => path.join(state.claudiomiroFolder, file);


    if (!task || task.trim().length < 10) {
        logger.error('Please provide more details (at least 10 characters)');
        process.exit(0);
    }

    startFresh(true);
    fs.writeFileSync(folder('INITIAL_PROMPT.md'), task);

    const branchStep = sameBranch
        ? ''
        : '## FIRST STEP: \n\nCreate a git branch for this task\n\n';

    const replace = (text) => {
        return text.replace('{{TASK}}', task).replaceAll(`{{claudiomiroFolder}}`, `${state.claudiomiroFolder}`);
    }

    logger.newline();
    logger.startSpinner('Improving prompt...');

    const prompt1 = fs.readFileSync(path.join(__dirname, 'step0.1.md'), 'utf-8');
    await executeClaude(replace(branchStep + prompt1));

    logger.stopSpinner();
    logger.success('Prompt improved successfully');

    if(!fs.existsSync(folder('AI_PROMPT.md'))){
        throw new Error('Error creating AI_PROMPT.md file')
    }

    logger.newline();
    logger.startSpinner('Creating tasks...');

    const prompt2 = fs.readFileSync(path.join(__dirname, 'step0.2.md'), 'utf-8');
    await executeClaude(replace(prompt2));

    logger.stopSpinner();
    logger.success('Tasks created successfully');
    
    // Check if tasks were created, but only in non-test environment
    if (process.env.NODE_ENV !== 'test') {
        if(
            !fs.existsSync(path.join(state.claudiomiroFolder, 'TASK0')) &&
            !fs.existsSync(path.join(state.claudiomiroFolder, 'TASK1'))
        ){
            throw new Error('Error creating tasks')
        }
    }
}

module.exports = { step0 };
