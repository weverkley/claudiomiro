## OBJECTIVE
Read the provided `{{claudiomiroFolder}}/AI_PROMPT.md` and **decompose it into a complete, lossless set of self-contained tasks** located under:

`{{claudiomiroFolder}}/TASK{number}/`

Each task must:
- Represent exactly one verifiable unit of work.
- Preserve the user’s intent **without merging, skipping, or paraphrasing away detail**.
- Be fully executable by an autonomous coding agent with no external clarification.

---

## CORE PRINCIPLES

### 🚨 1. NO INFORMATION LOSS
Every requirement, bullet, or implied behavior from `AI_PROMPT.md` must appear explicitly in **at least one TASK.md**.

- Each user requirement = at least one corresponding task or subtask.
- If a requirement touches multiple areas, split it carefully into parallel or sequential units.
- Missing or merged requirements = **automatic failure**.

You are not summarizing — you are **preserving structure through decomposition**.

---

## 🧠 DEEP REASONING & METHODOLOGY

### 1. Recursive Breakdown
- Identify all top-level goals from `AI_PROMPT.md`.
- For each goal, ask:
  > “Does this require reasoning, sequencing, or verification steps?”
   - If *yes*, expand into clear subtasks with their own reasoning context.
   - If *no*, keep it atomic — one task, one verification.

Tasks should reflect **logical cohesion**, not arbitrary granularity.

---

### 2. Layer Analysis (Parallelization)
Identify execution layers to allow maximum parallelism without breaking dependency order.

- **Layer 0:** Foundation — scaffolding, environment, initial config.
- **Layer 1+:** Parallelizable independent features or flows.
- **Layer N:** Integration, testing, or post-processing.
- **Final Ω:** Cohesion Validation — ensure the system is complete and correct as a whole.

Each task must clearly declare its layer and dependencies.

---

### 3. Automation-First Principle
Prefer **automated CLI or script-based actions** over manual edits.

✅ Automated actions  
 e.g. `bunx prisma migrate dev`, `npm run build`, `bunx tsc --noEmit`

❌ Manual edits  
 e.g. editing generated code, copy-pasting build files

If manual edits are unavoidable:
- Document **why** automation is unsafe or impossible.
- Make them the exception, not the rule.

This ensures reproducibility and consistent automation pipelines.

---

### 4. Independence Logic
Tasks are **independent** if:
- They modify distinct files, modules, or flows.  
- Their outputs do not serve as inputs for one another.

Tasks are **dependent** if:
- One’s output is required for another’s input.
- One validates or extends another’s behavior.

Always express dependencies explicitly.

---

### 5. Complexity Evaluation
Before splitting a goal, assess its intrinsic complexity:

- **Low:** Simple config, setup, or trivial feature → one task.
- **Medium:** One cohesive feature or API flow.
- **High:** Multi-flow system → decompose into coherent parallel tasks plus a final integration.

Granularity should scale with complexity — never too fragmented, never too broad.

---

### 6. Documentation Rules
Every `TASK.md` must be self-contained and readable in isolation:
- Explain what, why, and how.
- Document assumptions, dependencies, acceptance criteria, and reasoning.
- Include review and validation checklists.

Each task must make sense even if executed in parallel.

---

### 7. Final Assembly Validation
Always create a **Final Ω Task** that:
- Depends on all others.
- Verifies all modules interact correctly.
- Ensures no requirement was forgotten.
- Confirms contracts, logs, tests, and flows align with system intent.

This is the **mandatory system-level validation** step.

---

## ⚙️ OUTPUT REQUIREMENTS

### A) `{{claudiomiroFolder}}/TASKX/TASK.md`
```markdown
@dependencies [Tasks]  // Task name MUST BE COMPLETE AND FOLLOW THE PATTERN "TASK{number}"
# Task: [Concise title]

## Summary
Explain clearly what must be done and why. Focus on reasoning and context.

## Complexity
Low / Medium / High

## Dependencies
Depends on: [Tasks]  // Task name MUST BE COMPLETE AND FOLLOW THE PATTERN "TASK{number}"
Blocks: [Tasks] // Task name MUST BE COMPLETE AND FOLLOW THE PATTERN "TASK{number}"
Parallel with: [Tasks] // Task name MUST BE COMPLETE AND FOLLOW THE PATTERN "TASK{number}"

## Detailed Steps
1. [Detailed steps if needed]

## Acceptance Criteria
- [ ] Clear, testable result #1
- [ ] ...

## Code Review Checklist
- [ ] Clear naming, no dead code.
- [ ] Errors handled consistently.
- [ ] ...

## Reasoning Trace
Explain design logic and trade-offs.
```

🚨 CRITICAL: First line of must be @dependencies [...]

### B) `{{claudiomiroFolder}}/TASKX/PROMPT.md`
```markdown
## PROMPT
Refined AI prompt for execution.

## COMPLEXITY
Low / Medium / High

## RELATED FILES / SOURCES
[...]

## CONTEXT FILES / SOURCES
[...]

## EXTRA DOCUMENTATION
[...]

## LAYER
0 / 1 / 2 / N

## PARALLELIZATION
Parallel with: [Tasks]

## CONSTRAINTS
- IMPORTANT: Do not perform any git commit or git push.
- Prefer CLI or script-based actions over manual edits
- Automate everything possible (installation, configuration, generation)
- Manual edits only when automation is impossible — must be justified
- Must include automated validation ONLY FOR CHANGED FILES (unit, smoke, or functional tests)
- Never include global tests or checks.
- No manual steps or external deployment needed
- Multi-repo / multi-directory support is fully supported (not a blocker)
```

-----

🧩 EXAMPLES (Simplified)

CRUD Flow:
	•	TASK1 – Setup DB + routes (Layer 0)
	•	TASK2–5 – CRUD endpoints (parallel, Layer 1)
	•	TASK6 – Integration validation (Layer 2)
	•	TASK7 – Final Ω assembly verification

Multi-step Form:
	•	TASK1 – Base layout & form setup (Layer 0)
	•	TASK2–4 – Steps 1–3 logic (parallel, Layer 1)
	•	TASK5 – Autosave + navigation integration (Layer 2)
	•	TASK6 – System wiring validation (Layer N)
	•	TASK7 – Final Ω (end-to-end validation)

----

🚫 ANTI-PATTERNS

❌ Splitting trivial atomic operations.
❌ Forgetting the final validation layer.
❌ Treating parallel tasks as sequential without cause.
❌ Merging distinct requirements into a single task.

✅ Decompose only when it increases clarity, autonomy, or testability.
✅ Each task should represent a single verifiable truth from the user’s request.

⸻

## FINAL REQUIREMENT

Before finishing:
	•	Validate that every requirement from AI_PROMPT.md is covered by at least one task.
	•	Output all tasks as Markdown files inside {{claudiomiroFolder}}/TASK{number}/.
	•	Never summarize, merge, or skip any user-defined requirement.

## INPUT
{{claudiomiroFolder}}/AI_PROMPT.md

## OUTPUT
Multiple directories:
```
   {{claudiomiroFolder}}/TASK1/
   {{claudiomiroFolder}}/TASK2/
   ...
   {{claudiomiroFolder}}/TASKΩ/
```
Each containing:
	- TASK.md
	- PROMPT.md

## PURPOSE
This process ensures 100% coverage of user intent, full reasoning traceability, and consistent modular execution by autonomous agents.