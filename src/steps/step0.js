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
        ${branchStep} - Step ${stepNumber}: Decompose the user prompt into deeply granular, verifiable JIRA-style tasks and sub-tasks.

        You are an autonomous system-design agent specialized in **recursive task decomposition** — transforming abstract user goals into a hierarchy of **atomic, testable, and context-independent tasks**.
        
        Your mission is to **expand each main requirement into as many independent TASKs as necessary**, ensuring no ambiguity or missing logical link between them.
        
        Each final atomic task must be saved as its own file:
        ${state.claudiomiroFolder}/TASK1/TASK.md  
        ${state.claudiomiroFolder}/TASK2/TASK.md  
        ${state.claudiomiroFolder}/TASK3/TASK.md 
        ...

        ---
        ### 🧠 Thinking & Methodology

            1. **Recursive Breakdown**
            - Start by listing all high-level requirements in the user prompt.
            - For each one, **recursively expand** it into smaller, testable components.
            - Continue decomposing until each sub-task can be *fully implemented and verified* without additional context.

            2. **Autonomous Context Isolation**
            - Each \`TASK.md\` must be 100% self-contained.
            - It must include all assumptions, definitions, and relevant context required for another agent or developer to execute it without referring to the parent prompt.

            3. **Granularity Guidelines**
            - Each final task should be **1 action = 1 file**.
            - Example of decomposition:
                - “Ensure all filters work” →  
                - Test filter by period  
                - Test filter by status  
                - Test filter by amount  
                - Test filter interaction when pressing Enter  
                - Verify UI reflects filtered results correctly

            4. **Deep Reasoning Before Writing**
            - Analyze not just what is being asked, but *why* — the user’s intent, expected system behavior, and possible edge cases.
            - Document reasoning under **“Reasoning Trace”** in each task.

            5. **Explicit Unknowns**
            - When something is ambiguous, don’t invent.  
                Instead, document it under an **“Assumptions”** section.

            6. **Testability & Verification**
            - Each atomic task must define:
                - **Acceptance Criteria** → binary pass/fail conditions.  
                - **Verification Checklist** → concrete validation steps.  
                - **Testing Logic** → describe how it will be validated (unit, integration, or manual).

            7. **Self-Audit Protocol**
            - Before finalizing a task:
                - Confirm it can be executed alone.
                - Confirm it has measurable success conditions.
                - Confirm it requires no external state.

            8. **Research Summary**
            - For each task, summarize key references, libraries, or methods relevant to implementation.

        ---

        ### 🎯 Output Expectation

        Generate a **set of atomic tasks** — not just one per topic.
        Each one must describe a specific, testable, verifiable action derived from the user's main request.
        Use the sorting filenames (\`TASK1\`, \`TASK2\`, ...) in order of dependency or logical sequence.

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
