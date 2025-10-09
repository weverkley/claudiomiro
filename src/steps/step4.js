const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');

const step4 = (task) => {
    const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    if(fs.existsSync(folder('CODE_REVIEW.md'))){
      fs.rmSync(folder('CODE_REVIEW.md'));
    }

    if (fs.existsSync(folder('GITHUB_PR.md'))) {
      fs.rmSync(folder('GITHUB_PR.md'));
    }

    return executeClaude(`
      You are a **functional code reviewer** — your job is to think like a developer verifying whether the code truly works as intended.

      Review:
      - ${folder('PROMPT.md')} → what was requested
      - ${folder('TODO.md')} → what was implemented

      ---

      ## 🧠 Review Mindset

      You are not a style critic. You are an **engineer checking logic, behavior, and completeness**.  
      Ask yourself:  
      > “If I ran this code, would it actually produce the expected results without errors or missing pieces?”

      Your mission is to **catch anything that breaks, misbehaves, or doesn’t fulfill the goal** — and **ignore** visual polish, naming preferences, or theoretical redesigns.

      ---

      ## 🔍 Deep Functional Analysis

      Critically inspect the implementation:
      - **Feature completeness:** Does it cover *every required behavior* in \`${folder('PROMPT.md')} \`? Are any important branches, cases, or integrations missing?
      - **Logical consistency:** Does the flow make sense? Are variables, conditions, and data paths coherent and reachable?
      - **Error & edge handling:** Will it fail gracefully for invalid inputs or empty states? Any unhandled promise, null, or exception risk?
      - **Side effects:** Could this break other parts of the system (e.g. shared state, wrong imports, bad mutations)?
      - **Testing adequacy:** Do the tests or validations actually prove the code works (not just exist)?

      For each issue, describe *why* it matters in practice.  
      Ignore cosmetic differences or alternate ways to achieve the same result.

      ---

      ## 🧪 Targeted Testing Policy

      Run **only tests and checks related to the files that were modified by this task.**
      
      - Example:  
        \`npm test ./<changed-folder>\`  
        \`eslint ./<changed-folder>\`  
        \`tsc --noEmit ./<changed-folder>/index.ts\`
      
      - Do **not** run full-project commands like \`npm test\`, \`npm run lint\`, or \`tsc --noEmit\`.  
        Those will execute in a separate global verification stage.
      
      - If no local test command exists for the modified files, note it as a **QA gap**, but do not block approval unless functionality cannot be verified.
        
      ---

      ## Decision

      If everything looks **functionally correct**:
      - Confirm first line of \`${folder('TODO.md')}\` is: \`Fully implemented: YES\`
      - Add in the second line of \`${folder('TODO.md')}\`: "Code review passed"
      - Create a small \`${folder('CODE_REVIEW.md')}\` file:
        \`\`\`markdown
        ## Status
        ✅ APPROVED

        ## Checks
        - ✅ Requirements match scope
        - ✅ No critical bugs detected
        - ✅ Tests cover acceptance criteria
        \`\`\`

      If **problems found**:
      - Update \`${folder('TODO.md')}\` ADDING a complete implementation plan the specific fixes needed
      - Set first line of \`${folder('TODO.md')}\` to: \`Fully implemented: NO\`
      - Add in the second line of \`${folder('TODO.md')}\`: "Why code review failed: " and explain shortly.

      **Be pragmatic**: If it works and meets requirements, approve it quickly.

      Focus only on blockers and bugs, not style preferences.
    `, task);
}

module.exports = { step4 };
