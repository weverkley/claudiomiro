const fs = require('fs');
const path = require('path');
const { executeClaude } = require('../services/claude-executor');

const codeReview = (task) => {
    if(fs.existsSync(path.join(task, 'CODE_REVIEW.md'))){
      fs.rmSync(path.join(task, 'CODE_REVIEW.md'));
    }

    return executeClaude(`
      You are acting as a **senior autonomous code reviewer**.

      Your objective is to read and deeply analyze the following files:
      - ${task}/PROMPT.md — describes the original requirements and intent.
      - ${task}/TODO.md — describes what was implemented.

      Your mission is to conduct a **complete, context-aware review** of the task implementation.

      ---

      ### 🧩 Review Objectives

      1. **Requirement Alignment**
        - Verify that every item in \`${task}/TODO.md\` fully satisfies the scope and intent defined in \`${task}/PROMPT.md\`.
        - Identify any missing requirements, partial implementations, or over-extended scopes.

      2. **Code Quality & Correctness**
        - Evaluate if the implementation introduces bugs, regressions, or logical inconsistencies.
        - Ensure that edge cases are handled and that error handling is robust.
        - Confirm that tests (if mentioned) actually validate the acceptance criteria.

      3. **Architecture & Standards Compliance**
        - Ensure the implementation follows the system’s established architecture and conventions.
        - Verify naming, folder structure, dependency boundaries, and modular design.
        - Check for violations of SOLID principles, duplication, or anti-patterns.

      4. **Performance & Maintainability**
        - Identify any unnecessary complexity, inefficiency, or non-scalable patterns.
        - Ensure the code is readable, maintainable, and consistent with existing style guides.

      ---

      ### 🧠 Reasoning & Validation

      - Conduct a **comprehensive analysis** of all changes implied by \`${task}/TODO.md\`.
      - Cross-reference each change with its original goal in \`${task}/PROMPT.md\`.
      - When in doubt, prefer precision over assumption: highlight potential ambiguities in the review file rather than guessing.

      ---

      ### 🛠️ Review Actions

      If the review determines that changes are required:

      1. **Refactor \`${task}/TODO.md\`** to reflect all corrections, improvements, or missing details.
      2. Update the **first line** of \`${task}/TODO.md\` to: \`Fully implemented: NO\`
      This signals that the implementation still requires attention before it can be approved.

      If everything is correct and complete:
        - Confirm that the first line of \`${task}/TODO.md\` is: \`Fully implemented: YES\`

      ---

      ### 📄 Deliverable

      Create a new file named \`${task}/CODE_REVIEW.md\` that contains:

      Code Review Report

      Summary

      High-level overview of what was reviewed and the general status.

      Findings
        •	✅ Passed checks:
        •	[List all aspects correctly implemented]
        •	❌ Issues found:
        •	[List all problems, with reasoning and suggested fixes]

      Recommendations

      Summarize suggested refactors, optimizations, or architectural improvements.

      Decision
        •	Fully implemented: YES
        •	Fully implemented: NO

      (Choose only one)

      ---

      ### 🧩 Review Mindset

      You are not just checking syntax — you are performing **architectural reasoning**.  
      Ask yourself:
      - “Does this solution elegantly and safely meet the intent?”
      - “Would another senior engineer immediately understand and trust this code?”
      - “Is this implementation sustainable for long-term development?”

      Only mark as fully implemented if the answer to all three is **yes**.
    `);
}

module.exports = { codeReview };
