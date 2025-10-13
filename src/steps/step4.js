const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');
const { exec } = require('child_process');
const { commitOrFix } = require('../services/git-commit');

const step4 = async (task, shouldPush = true) => {
    const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    if(fs.existsSync(folder('CODE_REVIEW.md'))){
      fs.rmSync(folder('CODE_REVIEW.md'));
    }

    if (fs.existsSync(folder('GITHUB_PR.md'))) {
      fs.rmSync(folder('GITHUB_PR.md'));
    }

    const execution = await executeClaude(`
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

      ## 🧭 Scope & File Integrity Validation

      The agent must not introduce scope drift or unnecessary modifications. Validate carefully:
      -	Touched files vs. defined scope: Every edited or created file must appear in the relevant sections of ${folder('TODO.md')} or be logically implied by the requested changes.
        → Flag any file whose modification is not explicitly or implicitly justified by the prompt.
      -	Function-level intent: Each modified function, method, or class must directly serve the requested goal. If a change adjusts unrelated logic, styles, or structure, it should be marked as unauthorized alteration.
      -	Comment and metadata noise: Verify no meaningless renamings, formatting-only changes, or injected comments that don’t support comprehension or functionality.
      -	Dependency correctness: Check that imports, exports, and cross-references were not altered in ways that break established contracts or modify unrelated modules.
      -	Regression audit: Ensure no previously stable functionality was accidentally removed, redefined, or left in an inconsistent state.
        
      ## 🧭 Frontend ↔ Backend Route Consistency
      If the system has both front-end and back-end implementations:
      - **Endpoint alignment:** Verify that every API route used in the front-end corresponds exactly to a defined backend route (no typos, casing mismatches, or outdated paths).
      - **Payload symmetry:** Ensure request and response structures match expectations — identical field names, data types, and status codes.
      - **Error propagation:** Confirm that backend error responses are properly handled and displayed on the front-end.
      - **Versioning and namespaces:** Check if both layers are referencing the same API version and consistent base paths.
      - **Cross-environment coherence:** Validate that dev/staging/prod configurations point to the same route schema.

      ---

      For each issue, describe *why* it matters in practice.  
      Ignore cosmetic differences or alternate ways to achieve the same result.

      ---

      ## 🧪 Targeted Testing Policy

      Run automated **tests and checks.**
      
      - Example:   
        - \`npm test\`
        - \`npm run lint\`
        - \`npx tsc --noEmit\`.  
      
      ---

      ## Decision

      If everything looks **functionally correct**:
        - Confirm first line of \`${folder('TODO.md')}\` is: \`Fully implemented: YES\`
        - Add in the second line of \`${folder('TODO.md')}\`: "Code review passed"
        - Create a small \`${folder('CODE_REVIEW.md')}\` file:
          \`\`\`markdown
          ## Status
          ✅ APPROVED

          Why: 
          - ✅ Requirements match scope
          - ✅ No critical bugs detected
          - ✅ Tests cover acceptance criteria
          - ...

          ## Deep Functional Analysis
          [...]

          ## Scope & File Integrity Validation
          [...]

          ## Frontend ↔ Backend Route Consistency
          [...]
          \`\`\`

      If **problems found**:
        - Set first line of \`${folder('TODO.md')}\` to: \`Fully implemented: NO\`
        - The second line of \`${folder('TODO.md')}\` should be: "Why code review failed: " and explain shortly.
        - Update \`${folder('TODO.md')}\` as follows:
            1. **Keep all existing checklist items as-is.**  
              - Do **not** uncheck or remove previously completed items.  
              - The goal is to preserve historical progress and continuity.

            2. **Add new actionable items** to the checklist under the **"Implementation Plan"** section.  
              - Each new item should describe exactly what must be corrected or improved.
              - Use concise and directive language (e.g. “Fix null-check on BillingService before database save”).

            3. **Append or create a new section** titled:
              \`\`\`markdown
              ## Code Review Attempts
              \`\`\`
              - Log the current review date and briefly summarize issues found.
              - Include clear, actionable guidance for each issue:
              \`\`\`
                - Issue: Missing validation for 'userId' in POST request
                  Fix: Add Joi schema check before model.create()
                - Issue: Race condition in cache refresh
                  Fix: Move redis.set() call inside transaction block
              \`\`\`
              - Keep a chronological list of past review attempts for full traceability.

            4. Ensure the resulting \`TODO.md\` remains **self-explanatory** — a new developer should be able to read it and immediately understand:
              - What failed
              - Why it failed
              - What must be done next
              - Who or what performed each review
    `, task);

    if(fs.existsSync(folder('CODE_REVIEW.md'))){
      await commitOrFix(
        fs.readFileSync(folder('CODE_REVIEW.md'), 'utf-8'),
        shouldPush,
        1,
        task
      );
    }

    return execution;
}

module.exports = { step4 };
