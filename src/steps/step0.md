1 - Read the user prompt and **deeply understand the intent**.
   - Ask yourself:
      - What's the user's *real* goal?
      - Which parts are trivial vs complex?
      - What belongs to Layer 0 (foundation)?
      - What’s the critical path to success?
      - What can safely run in parallel?
      - What needs careful, sequential reasoning?
      - How will the final system prove internal consistency?

2 - **Context Expansion:**
   - Find and read all related files or modules.
   - Learn the system’s current architecture before decomposing anything.

3 - **Critical Refinement:**
   - Rewrite the user request with MAXIMUM CLARITY and detailed acceptance criteria.
   - Preserve intent, remove ambiguity, expose implicit requirements.

4 - **Selective Decomposition:**
   - Divide ONLY when it increases reasoning quality or parallelism.
   - Skip trivial, atomic tasks that any agent could complete in one shot.
   - Decompose *only complex or interdependent flows* (e.g., CRUDs, multi-layer features, cross-module integrations).

---

## 🧠 Deep Reasoning & Methodology

### 1. Recursive Breakdown (Selective)
- Start by listing all top-level goals.
- For each, ask: **“Does this task require sustained reasoning or multiple steps to verify correctness?”**
   - If *yes* → expand it into self-contained subtasks.
   - If *no* → keep it as a single execution unit.

### 2. Layer Analysis (Parallelization)
Identify natural execution layers:
- **Layer 0:** Environment, configuration, or scaffolding.
- **Layer 1+:** Independent features or flows that can run concurrently.
- **Layer N:** Integration, testing, documentation.
- **Final Ω:** System Cohesion & Assembly Validation (mandatory).

### 3. Granularity Rules (Proportional)
  - Setup / structure
  - Core operations (Create, Read, Update, Delete) → parallelizable
  - Integration test or final assembly

### 3.1. Automation-First Principle
- Always prefer **automated or command-based actions** instead of manual edits.
- Whenever possible, use commands, scripts, or CLIs to perform setup, installation, or configuration.
- Example:
   - ✅ `npm i bootstrap` (automated)
   - ❌ manually editing HTML to add a Bootstrap CDN link
- Example:
   - ✅ `npx prisma generate` or `bunx tsc --noEmit`
   - ❌ manually copying generated files
- Only perform manual edits when automation is **impossible** or **unsafe** to run automatically (e.g., private credentials, destructive DB operations).
- If manual edits are required, **document clearly why automation was not possible**.

This ensures consistency, reproducibility, and full automation across environments.

### 4. Independence Logic
Tasks are **independent** if:
✅ Different files, modules, or layers  
✅ Neither task depends on the other’s output

Tasks are **dependent** if:
❌ Output of one is explicitly needed as input for the next  
❌ One task verifies or extends the other

### 5. Complexity Evaluation
Before decomposing, classify each goal by complexity:
- **Low:** Setup, install, trivial refactor → single task
- **Medium:** One cohesive feature (single flow)
- **High:** Multi-flow logic or interdependent systems → split into sub-flows

### 6. Reasoned Documentation
Every `TASK.md` must be self-contained:
- What, why, how, assumptions, dependencies, acceptance criteria, and reasoning trace.

### 7. Final Assembly Validation
Always include a **final numeric task** to verify:
- All subtasks produce interoperable code
- No orphaned functionality
- The overall flow matches the intended architecture and logic

---

 🚨 CRITICAL: All task files MUST be created inside the {{claudiomiroFolder}} directory, NEVER in the project root.
   - Create folders like: {{claudiomiroFolder}}/TASK1/, {{claudiomiroFolder}}/TASK2/, etc.
   - NEVER create TASK folders directly in the project root
   - ALL files must be inside the .claudiomiro subdirectory
   - TASK FOLDER NAMES MUST FOLLOW THE PATTERN: `TASK{number}`. E.g TASK1, TASK2, TASK3, ...

IMPORTANT: YOU MUST CREATE THE TASKS FILES:

## ⚙️ Output Requirements

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
- Prefer CLI or script-based actions over manual edits
- Automate everything possible (installation, configuration, generation)
- Manual edits only when automation is impossible — must be justified
- Must include automated validation ONLY FOR CHANGED FILES (unit, smoke, or functional tests)
- Never include global tests or checks.
- No manual steps or external deployment needed
- Multi-repo / multi-directory support is fully supported (not a blocker)
```

-----

## ✅ Example: CRUD Flow (Selective Decomposition)

User request: `Implement CRUD for “Students”`

Decomposition:

Layer 0
	•	TASK1 — Setup database model + route structure (foundation)

Layer 1 (Parallel)
	•	TASK2 — Create endpoint + validation + tests
	•	TASK3 — Read/list endpoint + filters + tests
	•	TASK4 — Update endpoint + tests
	•	TASK5 — Delete endpoint + tests

Final Ω
	•	TASK6 — System Wiring & Contract Validation (depends on all)
      - Confirm that all components communicate correctly end-to-end — routes are exposed, payload contracts are respected, validation works, persistence behaves consistently, and (if applicable) the UI interacts with the correct APIs.
      - Validate request/response contracts for each endpoint: payload shape, status codes, and error structure.
      - Check that shared resources (env vars, migrations, seeds, middlewares, permissions) are properly wired.
      - Verify log and telemetry health: no silent errors, expected messages appear in the flow.
      - if repository allows it can make integration tests otherwise perform smoke checks or scripted validations to confirm system wiring.

→ Bootstrap install, linter config, etc. = atomic, no decomposition.

## ✅ Example: Multi-step Form Flow (Selective Decomposition)

User request: `Implement a 3-step signup form with validation, autosave, and final submission`

Decomposition:

Layer 0
• TASK1 — Setup form framework + base layout (foundation)

Layer 1 (Parallel)
• TASK2 — Step 1 (User Info) form logic + validation
• TASK3 — Step 2 (Address Info) form logic + validation
• TASK4 — Step 3 (Review & Confirm) summary page + submission logic

Layer 2
• TASK5 — Autosave system + localStorage sync (depends on all form steps)
• TASK6 — System Wiring & Contract Validation (ensure navigation, autosave, and final submission interact correctly)

Final Ω
• TASK7 — System Cohesion & Assembly Validation (depends on all)
	•	Review UI consistency, accessibility, and overall user flow
	•	Verify the final submission persists data correctly and clears cache

→ CSS tweaks, icon imports, and component styling = atomic (no decomposition).

----

🚨 Anti-patterns

❌ Splitting trivial tasks (installing libs, editing configs)
❌ Creating tasks smaller than the reasoning they require
❌ Omitting the final assembly check
❌ Treating parallel tasks as sequential when unnecessary

✅ Decompose only when it increases clarity, autonomy, or verifiability.
✅ Keep simple things simple, and hard things distributed but coherent.

🚨 CRITICAL: TASK FOLDER NAMES MUST FOLLOW THE PATTERN: `TASK{number}`. E.g TASK0, TASK2, TASK3, ...

 ---

## User Request:
{{TASK}}
