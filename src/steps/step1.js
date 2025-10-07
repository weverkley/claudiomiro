const fs = require('fs');
const logger = require('../../logger');
const { executeClaude } = require('../services/claude-executor');

const step1 = async (task) => {
    const prompt = fs.readFileSync(path.join(task, 'TASK.md'));

    if (!prompt || prompt.trim().length < 10) {
        logger.error('Please provide more details (at least 10 characters)');
        process.exit(0);
    }

    logger.newline();
    logger.startSpinner('Initializing task...');


    await executeClaude(`
- Step 1: Establish PROCESS FOUNDATIONS and create ${task}/PROMPT.md

Return a ${task}/PROMPT.md with these sections:

## OBJECTIVE
- Rewrite the user's ask clearly.
- Done when: list measurable acceptance criteria.

## CONSTRAINTS
- Backend: tests for each layer + integration tests on routes (mock DB).
- Frontend: tests for all components (mock API).
- Database: migrations only.
- ULTRA IMPORTANT: ${task}/TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO.
- ULTRA IMPORTANT: ${task}/TODO.md CAN'T MANUAL ACTIONS THAT CLAUDE CANNOT DO.
- ${task}/TODO.md first line: "Fully implemented: NO".
- Never include deployment steps.

## CRITIQUE PASS (Top 5 Risks)
- List 5 risks + mitigations.

## OPERATING PRINCIPLES
- Atomic DAG nodes.
- Proofs required for each.
- No guessing; mark BLOCKED if unclear.

Task:
\`\`\`
${prompt}
\`\`\`
`);

    logger.stopSpinner();
    logger.success(`${task} - Task initialized successfully`);
}

module.exports = { step1 };
