const state = require('../config/state');

const execute = (text, taskName = null) => {
    if (state.executorType === 'codex') {
        const { executeCodex } = require('./codex-executor');
        return executeCodex(text, taskName);
    }

    if (state.executorType === 'deep-seek') {
        const { executeDeepSeek } = require('./deep-seek-executor');
        return executeDeepSeek(text, taskName);
    }

    if (state.executorType === 'gemini') {
        const { executeGemini } = require('./gemini-executor');
        return executeGemini(text, taskName);
    }

    if (state.executorType === 'glm') {
        const { executeGlm } = require('./glm-executor');
        return executeGlm(text, taskName);
    }

    const { executeClaude } = require('./claude-executor');
    return executeClaude(text, taskName);
};

module.exports = { execute };
