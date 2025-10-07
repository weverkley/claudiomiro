const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const logger = require('../../logger');
const { executeClaude } = require('../services/claude-executor');

const step1 = async (task) => {
    const folder = (file) => path.join(state.claudiomiroFolder, task, file);
   
    const prompt = fs.readFileSync(path.join(state.claudiomiroFolder, task, 'TASK.md'), 'utf-8');

    if (!prompt || prompt.trim().length < 10) {
        logger.error('Please provide more details (at least 10 characters)');
        process.exit(0);
    }

    logger.newline();
    logger.startSpinner('Initializing task...');


    await executeClaude(`
        - Step 1: Establish PROCESS FOUNDATIONS and create ${folder('PROMPT.md')} (lean mode)
        
        Return a concise ${folder('PROMPT.md')} with only these sections:
        
        ---
        
        ## OBJECTIVE (≤ 5 lines)
        - Restate the user request clearly in plain language.  
        - Complete when 3–6 **binary acceptance criteria** are listed.
        
        ---
        
        ## CONSTRAINTS (short bullets)
        - Backend: tests per layer + integration (mocks DB).  
        - Frontend: component tests (mock API).  
        - Database: migrations only.  
        - **NO deployment.**  
        - ${folder('TODO.md')}: first line must be "Fully implemented: NO".  
        - No manual or non-executable tasks.
        
        ---
        
        ## TOP RISKS (max 3) + MITIGATIONS (1 line each)
        
        ---
        
        ## OPERATING PRINCIPLES (5 bullets)
        - Atomic DAG nodes (critical path first).  
        - Each task requires proof commands (≤ 3).  
        - No guessing → mark BLOCKED in BACKLOG.  
        - Respect file budgets (tasks ≤ 20, depth ≤ 3).  
        - Stop planning after 15 min → begin execution.
        
        ---
        
        ## PLAN SUMMARY (≤ 10 bullets)
        - List the macro execution sequence (critical path only).  
        - Reference the \`TASK_INDEX.md\` that will be generated next.
        
        ---
        
        Task:
        \`\`\`
        ${prompt}
        \`\`\`
    `);

    logger.stopSpinner();
    logger.success(`${task} - Task initialized successfully`);
}

module.exports = { step1 };
