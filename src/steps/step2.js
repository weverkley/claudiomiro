const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { execute } = require('../services/main-executor');

const findTaskFiles = (dir) => {
  const results = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...findTaskFiles(fullPath));
    } else if (item === 'TASK.md') {
      results.push(fullPath);
    }
  }

  return results;
};

const step2_1 = (task) => {
  const folder = (file) => path.join(state.claudiomiroFolder, task, file);

  const TODOtemplate = fs.readFileSync(path.join(__dirname, 'templates', 'TODO.md'), 'utf-8');

  return execute(`## Your Task (Strict Execution Plan)

1. Read \`${folder('PROMPT.md')}\` and \`${folder('TASK.md')}\` completely.  
2. Read only the **directly related** TODO.md files inside \`${state.claudiomiroFolder}\` to ensure consistency.  
   - Do **not** duplicate, extend, or alter their scope or acceptance criteria.  
3. Map integration points:
   - Previous and next tasks → define input/output, contract, and sequencing.  
4. Identify all files, functions, types, schemas, and dependencies required.  
   - Capture all side effects and references for full implementation.  
5. Group work by **feature unit**: implementation + tests together (never split them).  
6. Write \`${folder('TODO.md')}\` following the strict structure below.  
7. If any ambiguity remains, list it under **Follow-ups** (do not change scope silently).  

**IMPORTANT: quality over quantity.** Prefer 3–6 well-defined items over many tiny steps. Each item must represent a self-contained deliverable (feature + test). 

---

### Rules
- First line of \`${folder('TODO.md')}\` = \`Fully implemented: NO\`
- All actions deterministic, idempotent, and local.
- Never run \`git add/commit/push\`.
- Fix seeds/timezones → no flaky tests.

## Testing Guideline (Diff-Driven and Minimal)

**Purpose:** Confirm your code works — using the fewest tests that fully prove correctness.  
**Never:** chase global coverage or test untouched code.

### Scope
- Test only modified code and directly affected interfaces.
- Build a **Diff Test Plan**:
  - List changed files/symbols.
  - For each: 1 happy path + 1–2 edge cases + 1 predictable failure (if relevant).
- Skip untouched code unless a contract changed or a reproducible bug exists.
- Testing speed or benchmarks: only if explicitly required.
- Mock all external boundaries (network, DB, FS, UUID, clock, env).

### Types
- **Unit tests:** default.
- **Integration tests:** only if modules must interact for correctness.
- **E2E tests:** only if explicitly required.
- **Any other type of test:** only if explicitly required.
- **No framework:** describe hypothetical test cases (title + arrange/act/assert + expected result).

### Coverage
- Target 100% coverage for changed lines only.
- If impossible (e.g., defensive I/O branch), explain in \`${folder('TODO.md')}\`.

### Execution
- Run tests only for affected paths or tags.
- Use clear **arrange / act / assert** pattern.
- Respect project test runner:
  - JS/TS example: \`vitest run --changed\` or \`npm test -- -t "<name>"\`

### Stop Rules
- Stop testing when:
  - All Diff Test Plan items pass twice consistently.
  - Per-diff coverage = 100%.
  - No unrelated failures remain.
- Log unrelated failures as *Known Out-of-Scope* in \`${folder('TODO.md')}\`.

### Definition of Done
- [ ] Diff Test Plan exists in \`${folder('TODO.md')}\`  
- [ ] All new/affected tests pass twice locally  
- [ ] Per-diff coverage = 100% (or justified gap noted)  
- [ ] Only boundary mocks used, no I/O or sleeps  
- [ ] Within runtime budget  
- [ ] Short summary (3–5 lines) of what was tested and why  

Then set first line to \`Fully implemented: YES\`.

**Mantra:** *Prove changed behavior with the minimum sufficient evidence — nothing more.*

---

## TODO.md Structure

\`\`\`
${TODOtemplate}
\`\`\`

    `, task);
}

const step2_2 = async (task) => {
  const folder = (file) => path.join(state.claudiomiroFolder, task, file);

  if (typeof task === 'string' && task.includes('.')) {
    return;
  }

  if(fs.existsSync(folder('split.txt'))){
    return;
  }


   const execution = await execute(`Carefully analyze the task located at: ${path.join(state.claudiomiroFolder, task)}
1. Evaluate complexity and parallelism
	•	If this task can be divided into independent and asynchronous subtasks, perform this division in a logical and cohesive manner.
	•	Each subtask should represent a clear functional unit, with a well-defined beginning and end.

## Split Decision (only if it truly helps)
- If this task is **small, straightforward, or fast to implement**, **do NOT split**. Keep it as a single unit.
- Split **only** when it enables **meaningful parallelism** or clarifies complex, interdependent work.

If you choose **NOT** to split:
- Make **no** changes to the folder structure.

## 2) When splitting is justified
  If you determine splitting is beneficial:
  - Delete the original folder:
    ${path.join(state.claudiomiroFolder, task)}

  - Create numbered subtask folders (contiguous numbering):
    - ${path.join(state.claudiomiroFolder, task)}.1
    - ${path.join(state.claudiomiroFolder, task)}.2
    - ${path.join(state.claudiomiroFolder, task)}.3
    (Create only as many as are logically necessary. Do not create empty subtasks.)

  - You MUST update all TASK.md files inside ${path.join(state.claudiomiroFolder)} with the new dependencies and numbering.

### Required structure for EACH subtask
  You MUST create for each subtask:
  - TASK.md   → objective, scope, and acceptance criteria
  - PROMPT.md → the precise execution prompt for this subtask
  - TODO.md   → concrete, verifiable steps to complete the subtask

Example:
  ${path.join(state.claudiomiroFolder, task + '.1')}
    ├─ TASK.md
    ├─ PROMPT.md
    └─ TODO.md

CRITICAL: First line of EACH TASK.md MUST be the updated dependencies list:
\`@dependencies [LIST]\`

CRITICAL: If you split a task: You MUST update all TASK.md files inside ${path.join(state.claudiomiroFolder)} with the new dependencies and numbering.

### Dependency & coherence rules
- Each subtask must be independently executable and testable.
- Avoid artificial fragmentation (don't split trivial steps).

## 4) Quality bar
- Split only if it **reduces cycle time** or **reduces cognitive load** without harming cohesion.
- Keep naming, numbering, and dependencies consistent and minimal.
    `, task);

    // Only write split.txt if the original folder still exists (task was not split)
    if(fs.existsSync(folder('TASK.md'))){
      fs.writeFileSync(folder('split.txt'), '1');
    }

    return execution;
}


const step2 = async (task) => {
  await step2_1(task);
  return step2_2(task);
};

module.exports = { step2 };
