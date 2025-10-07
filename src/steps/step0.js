const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const logger = require('../../logger');
const { executeClaude } = require('../services/claude-executor');
const { getMultilineInput } = require('../services/prompt-reader');
const { startFresh } = require('../services/file-manager');

const step0 = async (sameBranch = false, promptText = null) => {
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
        : '- Step 1: Create a git branch for this task\n        ';

    const stepNumber = sameBranch ? 1 : 2;

    await executeClaude(`
        ${branchStep} - Step ${stepNumber}: Decompose the user prompt into granular, verifiable JIRA-style tasks.

        You are an autonomous agent specialized in **breaking down complex objectives into minimal, self-contained sub-tasks**.  
        Your goal is to **translate the user prompt into clear, actionable, and testable tasks** — each one with a complete scope, its own reasoning, and a defined deliverable.
        
        Each generated task must be saved as a separate file:
        ${state.claudiomiroFolder}/TASK1/TASK.md
        ${state.claudiomiroFolder}/TASK2/TASK.md
        ${state.claudiomiroFolder}/TASK3/TASK.md
        ...
        
        ---
        
        ### 🔧 Rules & Methodology
        
        1. **Independent Context**
           - Each \`TASK.md\` must be fully self-contained.
           - The task must include every piece of information needed to execute it correctly, without relying on previous memory, context, or external prompts.
        
        2. **Deep Reasoning Before Writing**
           - "Super think" about the user’s goal — understand the *why*, not only the *what*.
           - If the task implies unknowns or ambiguities, document them explicitly in the task file under a section named **“Assumptions”**.
        
        3. **Task Scope & Clarity**
           - Each task must have a **well-defined start and end**.
           - Avoid vague or open-ended goals like “improve performance”; instead, specify measurable deliverables (e.g., “reduce response time by profiling and optimizing SQL queries”).
        
        4. **Acceptance Criteria**
           - Define clear, objective **acceptance criteria** for each task.
           - Use language that makes verification binary (✅ Pass / ❌ Fail).
           - Example:  
             - ✅ All tests under \`test/integration/user\` pass.  
             - ✅ Endpoint \`/api/users\` returns 200 with a valid JSON payload.
        
        5. **Testability**
           - Every task must describe **how its success will be tested** (unit, integration, or manual validation).
           - Testing steps must not require context outside the \`TASK.md\`.
        
        6. **Verifiability**
           - Include a **Verification Checklist** section for post-implementation validation.
           - The checklist should allow a reviewer to confirm 100% completion without external inference.
        
        7. **Conciseness & Atomicity**
           - Smaller tasks are better — they increase parallelism and reduce cognitive load.
           - Split large scopes into several atomic ones when possible.
        
        8. **Complementary Research**
           - Each task must include a brief **Research Summary** describing:
             - What external information is needed.
             - What tools, libraries, or concepts are relevant.
             - Key insights or references found (summarized, not pasted).
        
        ---

        ### 🎯 Goal
        Deliver a full set of **autonomous, context-independent, testable tasks**, each capable of being executed and verified by another agent or human **without prior context**.
        
        ---
        
        ### 🧩 Output Format for Each TASK.md
        
        Each file must strictly follow this structure:
        "
            # Task: [Clear and concise title]

            ## Objective
            Explain what must be achieved and why it matters.

            ## Assumptions
            List any inferred or assumed conditions that support the execution.

            ## Steps to Implement
                1.	Step-by-step breakdown of the implementation.
                2.	Use imperative verbs (e.g., “Create”, “Configure”, “Refactor”).

            ## Research Summary
            Summarize findings or references that support implementation.

            ## Acceptance Criteria
                •	Criterion 1 (objective and testable)
                •	Criterion 2 (objective and testable)

            ## Self-Verification Logic
                Before marking this task as completed:
                1. Compare actual outputs with acceptance criteria.
                2. If any criterion fails → mark as "RETRY REQUIRED".
                3. If all pass → mark as "SUCCESS".

            ## Reasoning Trace
                Summarize how the task was interpreted, why each step was chosen, and what trade-offs were considered.

            ## Escalation Protocol
                If blocked or encountering undefined behavior:
                1. Stop execution.
                2. Save state in ${state.claudiomiroFolder}/BLOCKED.md
                3. Add entry: reason, attempted fix, next suggestion.
                
            ## Verification Checklist
                •	Code compiles without errors
                •	All tests pass
                •	Output matches expected result
                •	Meets performance or UX expectations
        "

        ---
        ## User Prompt:
        \`\`\`
        ${task}
        \`\`\`
    `);

    logger.stopSpinner();
    logger.success('Task initialized successfully');
}

module.exports = { step0 };
