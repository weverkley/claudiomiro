const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');
const { exec } = require('child_process');
const { commitOrFix } = require('../services/git-commit');
const { isFullyImplemented } = require('../utils/validation');

const step4_1 = async (task) => {
    const folder = (file) => path.join(state.claudiomiroFolder, task, file);

  // When we have been into a block state, too much failed code reviews

  if (fs.existsSync(folder('TODO.old.md'))) {
    return;
  }

  fs.cpSync(folder('TODO.md'), folder('TODO.old.md'));
  fs.cpSync(folder('TODO.md'), folder(`TODO.old.${(new Date()).getTime()}.md`));
  fs.rmSync(folder('TODO.md'), { force: true });
  
  const execution = await executeClaude(`You are reviewing the task defined in ${folder('PROMPT.md')} and ${folder('TASK.md')}. 
Our current plan lives in ${folder('TODO.old.md')}, which may or may not be complete. 
Your job is to **inspect reality first**, decide the true state, and produce the **single best plan to unlock code review**.

# Operating Principles
- **Truth over optimism**: do not assume completion. Verify.
- **Minimal path to green**: prefer the smallest change set that achieves approval.
- **No infinite rework**: if an item is blocked by architecture or environment, do not keep “trying harder”; classify and bypass.
- **Deterministic output**: return exactly one updated ${folder('TODO.old.md')} (see “Required Output”).
- **Do not invent features**: only include work that exists or is required by ${folder('PROMPT.md')} and ${folder('TASK.md')}.

# Evidence Collection (read, don’t guess)
1) Read ${folder('TODO.old.md')} thoroughly.
2) If present, read any recent review artifacts (e.g., CODE_REVIEW.md, test logs) under the same task folder.
3) Derive a **Current State Summary**:
   - Implementation coverage vs. ${folder('PROMPT.md')} and ${folder('TASK.md')}
   - Test status by suite (pass/fail/blocked)
   - Known architectural or environment blockers (e.g., HttpTestingController vs ApiService, JWT secret mismatch, Bun AWS mock limits)
   - Mismatches in routes, payloads, or contracts

# Decide the Path (choose exactly one)
Choose the **single best** path that gets us approved fastest:

**Path A — Finish Implementation (if materially incomplete)**
- Use when essential behaviors from ${folder('PROMPT.md')} or ${folder('TASK.md')} are missing or broken.
- Produce a **short, executable** plan that adds only the minimum code to meet acceptance.
- Include tests that prove those behaviors (no broad rewrites).

**Path B — Stabilize & Unblock (if implementation is complete but review fails due to test/infra/arch)**
- Use when remaining failures come from architecture or environment (not feature logic).
- Convert failing/untestable checks into **documented, accepted limitations** for this review.
- Add **tactical bypasses** only (e.g., targeted mocks, env flags, JWT test keys, URL matchers), no refactors.
- Clearly separate what is safe to defer.

# Guardrails
- Do not propose architectural rewrites in this review.
- If a test cannot be made to pass without refactor, mark it as “Accepted Limitation” and justify.
- Ensure routes, payloads, and types are aligned; fix trivial mistakes (URL matchers, imports, throw vs return).
- Keep command examples exact and runnable.

${"```"}
## REVIEW UNBLOCK PLAN

### 0) Current State Summary
- Implementation coverage: [...]
- Failing suites (with reason): [...]
- Confirmed blockers (architecture/env): [...]
- Quick wins (tactical, no refactor): [...]

### 1) Chosen Path
- Path: A | B
- Rationale: one paragraph explaining why this is the fastest safe route to approval.

### 2) Actions (Minimal, Deterministic)
- [ ] Step 1 — (file/line/command) → expected effect
- [ ] Step 2 — (file/line/command) → expected effect
- [ ] Step 3 — (file/line/command) → expected effect
(Only include steps that are strictly necessary to pass review now.)

### 3) Accepted Limitations (Document, Don’t Fix Here)
- Limitation: <name> — justification, mitigation (e.g., mock/service-level tests, feature flag), owner/follow-up ticket.

### 4) Verification Checklist (Must be objectively checkable)
- [ ] All commands run cleanly:
      npm test -- --testPathPattern="<suite>"
      bun run test:isolated "<file>"
      tsc --noEmit
- [ ] Routes & payloads match backend schema (list endpoints)
- [ ] Errors are thrown where tests expect rejects
- [ ] No broad architectural changes introduced
- [ ] Reviewer can approve with limitations documented

### 5) Review Artifacts
- Commands to reproduce results (exact)
- Notes for reviewer: what to look at, where to verify

### 6) Ready for Review
- READY: YES | NO
- If NO: list the **one** blocker remaining and the decision needed.

${"```"}

# Success Criteria
A correct answer:
- Picks Path A or B based on actual evidence, not assumptions.
- Produces a crisp, minimal plan that either finishes what’s missing or formalizes acceptable limitations.
- Eliminates flakiness and non-determinism (matchers, imports, env keys) without architectural rewrites.
- Returns only the rewritten ${folder('TODO.md')} in the required structure, immediately actionable and review-pass oriented.test-passing implementation.

---

# Required Output: 

Based on the old ${folder('TODO.old.md')} and your analysis,
WRITE THE NEW ${folder('TODO.md')} from scratch
Return ONLY the new TODO.md contents using this structure:

\`\`\`
${TODOtemplate}
\`\`\`

---
  `, task);

  if(!fs.existsSync(folder('TODO.md'))){
  fs.cpSync(folder('TODO.old.md'), folder('TODO.md'));
    throw new Error('Error creating TODO.md file in step4_1');
  }

  fs.rmSync(folder('TODO.old.md'), { force: true });

  return execution;
}

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

    if(isFullyImplemented(folder('TODO.md'))){
      try {
        await commitOrFix(
          fs.readFileSync(folder('TODO.md'), 'utf-8'),
          shouldPush,
          3,
          task
        );
      } catch (error) {
        // Log but don't block execution
        console.warn('⚠️  Commit failed in step4, continuing anyway:', error.message);
      }
    }else{
      const json = JSON.parse(fs.readFileSync(folder('info.json'), 'utf8'));
      if(json.attempts % 9 === 0){
        // each 9 times we go to step4_1 to rewrite the todo from scratch
        await step4_1(task);
      }
    }

    return execution;
}

module.exports = { step4 };
