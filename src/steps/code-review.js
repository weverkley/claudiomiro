const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');

const codeReview = (task) => {
    const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    if(fs.existsSync(folder('CODE_REVIEW.md'))){
      fs.rmSync(folder('CODE_REVIEW.md'));
    }

    return executeClaude(`
      You are a **fast code reviewer** focused on catching critical issues.

      CRITICAL RULES:
      - DO NOT create any git commits (commits happen only in the final step)
      - DO NOT run git add, git commit, or git push commands

      Review these files:
      - ${folder('PROMPT.md')} — what was requested
      - ${folder('TODO.md')} — what was done

      ## Quick Checklist (90 seconds max)

      ✅ **Requirements**: Does TODO.md match PROMPT.md scope? Any missing features?
      ✅ **Critical bugs**: Any obvious errors, regressions, or missing error handling?
      ✅ **Tests**: Are acceptance criteria actually tested?

      **Skip** deep architecture analysis, performance optimization, and philosophy.

      ## Decision

      If everything looks **functionally correct**:
      - Confirm first line of \`${folder('TODO.md')}\` is: \`Fully implemented: YES\`
      - Create \`${folder('CODE_REVIEW.md')}\`:
        \`\`\`markdown
        # Code Review

        ## Status
        ✅ APPROVED

        ## Summary
        Requirements met, no critical issues found.

        ## Checks
        - ✅ Requirements match scope
        - ✅ No critical bugs detected
        - ✅ Tests cover acceptance criteria
        \`\`\`

      If **problems found**:
      - Update \`${folder('TODO.md')}\` with specific fixes needed
      - Set first line of \`${folder('TODO.md')}\` to: \`Fully implemented: NO\`
      - Create \`${folder('CODE_REVIEW.md')}\`:
        \`\`\`markdown
        # Code Review

        ## Status
        ❌ NEEDS WORK

        ## Issues Found
        - [Specific problem with fix suggestion]
        - [Specific problem with fix suggestion]

        ## Action Required
        Review updated TODO.md for corrections.
        \`\`\`

      **Be pragmatic**: If it works and meets requirements, approve it quickly.
      Focus only on blockers, not style preferences.
    `);
}

module.exports = { codeReview };
