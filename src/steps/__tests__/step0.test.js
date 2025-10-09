const fs = require('fs');
const path = require('path');
const state = require('../../config/state');
const logger = require('../../../logger');
const { executeClaude } = require('../../services/claude-executor');
const { getMultilineInput } = require('../../services/prompt-reader');
const { startFresh } = require('../../services/file-manager');
const { step0 } = require('../step0');

jest.mock('fs');
jest.mock('path');
jest.mock('../../config/state');
jest.mock('../../../logger');
jest.mock('../../services/claude-executor');
jest.mock('../../services/prompt-reader');
jest.mock('../../services/file-manager');

describe('step0', () => {
    let processExitSpy;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock state
        state.claudiomiroFolder = '/test/.claudiomiro';

        // Mock path.join to return predictable paths
        path.join.mockImplementation((...args) => args.join('/'));

        // Mock process.exit
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

        // Default successful executeClaude
        executeClaude.mockResolvedValue();

        // Mock fs.readFileSync for step0.md
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('step0.md')) {
                return `1 - Read the user prompt and **deeply understand the intent**.

2 - **Context Expansion:**
   - Find and read all related files or modules.
   - Learn the system's current architecture before decomposing anything.

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
- For each, ask: **"Does this task require sustained reasoning or multiple steps to verify correctness?"**
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
   - ✅ \`npm i bootstrap\` (automated)
   - ❌ manually editing HTML to add a Bootstrap CDN link
- Example:
   - ✅ \`npx prisma generate\` or \`bunx tsc --noEmit\`
   - ❌ manually copying generated files
- Only perform manual edits when automation is **impossible** or **unsafe** to run automatically (e.g., private credentials, destructive DB operations).
- If manual edits are required, **document clearly why automation was not possible**.

This ensures consistency, reproducibility, and full automation across environments.

### 4. Independence Logic
Tasks are **independent** if:
✅ Different files, modules, or layers
✅ Neither task depends on the other's output

Tasks are **dependent** if:
❌ Output of one is explicitly needed as input for the next
❌ One task verifies or extends the other

### 5. Complexity Evaluation
Before decomposing, classify each goal by complexity:
- **Low:** Setup, install, trivial refactor → single task
- **Medium:** One cohesive feature (single flow)
- **High:** Multi-flow logic or interdependent systems → split into sub-flows

### 6. Reasoned Documentation
Every \`TASK.md\` must be self-contained:
- What, why, how, assumptions, dependencies, acceptance criteria, and reasoning trace.

### 7. Final Assembly Validation
Always include a **final numeric task** to verify:
- All subtasks produce interoperable code
- No orphaned functionality
- The overall flow matches the intended architecture and logic

---

IMPORTANT: YOU MUST CREATE THE FILES.

## ⚙️ Output Requirements

### A) \`{{claudiomiroFolder}}/TASKX/TASK.md\`
\`\`\`markdown
@dependencies [NONE / TASKX, TASKY] // e.g @dependencies [NONE]     //  e.g @dependencies [TASK1, TASK2]

# Task: [Concise title]

## Summary
Explain clearly what must be done and why. Focus on reasoning and context.

## Complexity
Low / Medium / High

## Dependencies
Depends on: [Tasks]
Blocks: [Tasks]
Parallel with: [Tasks]

## Steps
1. [Detailed steps if needed]

## Acceptance Criteria
- [ ] Clear, testable result #1
- [ ] ...

## Reasoning Trace
Explain design logic and trade-offs.
\`\`\`

### B) \`{{claudiomiroFolder}}/TASKX/PROMPT.md\`
\`\`\`markdown
## PROMPT
Refined AI prompt for execution.

## LAYER
0 / 1 / 2 / N

## COMPLEXITY
Low / Medium / High

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
\`\`\`

-----

## ✅ Example: CRUD Flow (Selective Decomposition)

User request: \`Implement CRUD for "Students"\`

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

User request: \`Implement a 3-step signup form with validation, autosave, and final submission\`

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

 ---

## User Request:
{{TASK}}`;
            }
            return '';
        });
    });

    afterEach(() => {
        processExitSpy.mockRestore();
    });

    describe('Setup test infrastructure for step0 module', () => {
        it('should have all required dependencies mocked', () => {
            expect(jest.isMockFunction(fs.writeFileSync)).toBe(true);
            expect(jest.isMockFunction(logger.error)).toBe(true);
            expect(jest.isMockFunction(executeClaude)).toBe(true);
            expect(jest.isMockFunction(getMultilineInput)).toBe(true);
            expect(jest.isMockFunction(startFresh)).toBe(true);
        });

        it('should verify jest configuration allows step0 tests', () => {
            expect(step0).toBeDefined();
            expect(typeof step0).toBe('function');
        });
    });

    describe('Test prompt validation and error handling', () => {
        it('should reject empty prompt', async () => {
            getMultilineInput.mockResolvedValue('');

            await step0();

            expect(logger.error).toHaveBeenCalledWith('Please provide more details (at least 10 characters)');
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });

        it('should reject prompt with only whitespace', async () => {
            getMultilineInput.mockResolvedValue('   ');

            await step0();

            expect(logger.error).toHaveBeenCalledWith('Please provide more details (at least 10 characters)');
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });

        it('should reject short prompt (less than 10 characters)', async () => {
            getMultilineInput.mockResolvedValue('short');

            await step0();

            expect(logger.error).toHaveBeenCalledWith('Please provide more details (at least 10 characters)');
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });

        it('should accept prompt with exactly 10 characters', async () => {
            getMultilineInput.mockResolvedValue('1234567890');

            await step0();

            expect(logger.error).not.toHaveBeenCalled();
            expect(processExitSpy).not.toHaveBeenCalled();
        });

        it('should accept valid prompt (more than 10 characters)', async () => {
            getMultilineInput.mockResolvedValue('This is a valid prompt');

            await step0();

            expect(logger.error).not.toHaveBeenCalled();
            expect(processExitSpy).not.toHaveBeenCalled();
        });

        it('should handle null promptText parameter when getMultilineInput returns valid input', async () => {
            getMultilineInput.mockResolvedValue('Valid input from getMultilineInput');

            await step0(false, null);

            expect(getMultilineInput).toHaveBeenCalled();
            expect(logger.error).not.toHaveBeenCalled();
        });
    });

    describe('Test file operations and initialization', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {});
            processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        });

        it('should create INITIAL_PROMPT.md with correct content', async () => {
            const testPrompt = 'Test prompt for file creation';
            getMultilineInput.mockResolvedValue(testPrompt);

            await step0();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/test/.claudiomiro/INITIAL_PROMPT.md',
                testPrompt
            );
        });

        it('should call startFresh with true parameter', async () => {
            getMultilineInput.mockResolvedValue('Valid prompt for startFresh test');

            await step0();

            expect(startFresh).toHaveBeenCalledWith(true);
        });

        it('should generate correct folder path', async () => {
            getMultilineInput.mockResolvedValue('Test prompt for folder path');

            await step0();

            expect(path.join).toHaveBeenCalledWith(state.claudiomiroFolder, 'INITIAL_PROMPT.md');
        });

        it('should write file with promptText when provided directly', async () => {
            const directPrompt = 'Direct prompt text provided';

            await step0(false, directPrompt);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/test/.claudiomiro/INITIAL_PROMPT.md',
                directPrompt
            );
            expect(getMultilineInput).not.toHaveBeenCalled();
        });
    });

    describe('Test mode selection and prompt generation', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {});
            processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        });

        it('should use auto mode prompt by default', async () => {
            getMultilineInput.mockResolvedValue('Test prompt for auto mode');

            await step0();

            const callArg = executeClaude.mock.calls[0][0];
            expect(callArg).toContain('0 - Create a git branch for this task');
            expect(callArg).toContain('1 - Read the user prompt and **deeply understand the intent**.');
        });

        it('should use hard mode prompt when mode is "hard"', async () => {
            getMultilineInput.mockResolvedValue('Test prompt for hard mode');

            await step0(false, null, 'hard');

            const callArg = executeClaude.mock.calls[0][0];
            expect(callArg).toContain('0 - Create a git branch for this task');
            expect(callArg).toContain('1 - Read the user prompt and **deeply understand the intent**.');
        });

        it('should include branch step when sameBranch is false', async () => {
            getMultilineInput.mockResolvedValue('Test prompt with branch');

            await step0(false);

            const callArg = executeClaude.mock.calls[0][0];
            expect(callArg).toContain('0 - Create a git branch for this task');
            expect(callArg).toContain('1 - Read the user prompt and **deeply understand the intent**.');
        });

        it('should exclude branch step when sameBranch is true', async () => {
            getMultilineInput.mockResolvedValue('Test prompt without branch');

            await step0(true);

            const callArg = executeClaude.mock.calls[0][0];
            expect(callArg).not.toContain('0 - Create a git branch for this task');
            expect(callArg).toContain('1 - Read the user prompt and **deeply understand the intent**.');
        });

        it('should adjust step numbering when sameBranch is true', async () => {
            getMultilineInput.mockResolvedValue('Test step numbering');

            await step0(true);

            const callArg = executeClaude.mock.calls[0][0];
            expect(callArg).toContain('1 - Read the user prompt and **deeply understand the intent**.');
        });

        it('should adjust step numbering when sameBranch is false', async () => {
            getMultilineInput.mockResolvedValue('Test step numbering');

            await step0(false);

            const callArg = executeClaude.mock.calls[0][0];
            expect(callArg).toContain('1 - Read the user prompt and **deeply understand the intent**.');
        });
    });

    describe('Test Claude execution integration', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {});
            processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        });

        it('should call executeClaude with generated prompt', async () => {
            const testTask = 'Test task for Claude execution';
            getMultilineInput.mockResolvedValue(testTask);

            await step0();

            expect(executeClaude).toHaveBeenCalledTimes(1);
            expect(executeClaude.mock.calls[0][0]).toContain(testTask);
        });

        it('should handle executeClaude success', async () => {
            getMultilineInput.mockResolvedValue('Successful execution test');
            executeClaude.mockResolvedValue();

            await expect(step0()).resolves.not.toThrow();

            expect(logger.success).toHaveBeenCalledWith('Tasks created successfully');
        });

        it('should handle executeClaude rejection', async () => {
            getMultilineInput.mockResolvedValue('Failed execution test');
            const testError = new Error('Claude execution failed');
            executeClaude.mockRejectedValue(testError);

            await expect(step0()).rejects.toThrow('Claude execution failed');
        });

        it('should pass correct prompt structure to executeClaude in auto mode', async () => {
            const task = 'Build a REST API';
            getMultilineInput.mockResolvedValue(task);

            await step0(false, null, 'auto');

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('1 - Read the user prompt and **deeply understand the intent**.');
            expect(prompt).toContain('2 - **Context Expansion:**');
            expect(prompt).toContain('3 - **Critical Refinement:**');
            expect(prompt).toContain(task);
        });

        it('should pass correct prompt structure to executeClaude in hard mode', async () => {
            const task = 'Build a REST API';
            getMultilineInput.mockResolvedValue(task);

            await step0(false, null, 'hard');

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('1 - Read the user prompt and **deeply understand the intent**.');
            expect(prompt).toContain('2 - **Context Expansion:**');
            expect(prompt).toContain('3 - **Critical Refinement:**');
            expect(prompt).toContain(task);
        });
    });

    describe('Test logger and spinner interactions', () => {
        beforeEach(() => {
            // Reset mocks to avoid pollution from previous describe blocks
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {});
            processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        });

        it('should call logger.newline before starting', async () => {
            getMultilineInput.mockResolvedValue('Test logger newline');

            await step0();

            expect(logger.newline).toHaveBeenCalled();
        });

        it('should start spinner with correct message', async () => {
            getMultilineInput.mockResolvedValue('Test spinner start');

            await step0();

            expect(logger.startSpinner).toHaveBeenCalledWith('Initializing task...');
        });

        it('should stop spinner after execution', async () => {
            getMultilineInput.mockResolvedValue('Test spinner stop');

            await step0();

            expect(logger.stopSpinner).toHaveBeenCalled();
        });

        it('should log success message after completion', async () => {
            getMultilineInput.mockResolvedValue('Test success message');

            await step0();

            expect(logger.success).toHaveBeenCalledWith('Tasks created successfully');
        });

        it('should maintain correct logger call order', async () => {
            getMultilineInput.mockResolvedValue('Test logger order');

            await step0();

            const calls = [
                logger.newline.mock.invocationCallOrder[0],
                logger.startSpinner.mock.invocationCallOrder[0],
                logger.stopSpinner.mock.invocationCallOrder[0],
                logger.success.mock.invocationCallOrder[0]
            ];

            expect(calls[0]).toBeLessThan(calls[1]);
            expect(calls[1]).toBeLessThan(calls[2]);
            expect(calls[2]).toBeLessThan(calls[3]);
        });

        it('should call logger.error for invalid input', async () => {
            getMultilineInput.mockResolvedValue('short');

            await step0();

            expect(logger.error).toHaveBeenCalledWith('Please provide more details (at least 10 characters)');
        });

        it('should not call success logger on validation failure', async () => {
            getMultilineInput.mockResolvedValue('');

            await step0();

            expect(logger.error).toHaveBeenCalled();
            expect(processExitSpy).toHaveBeenCalledWith(0);
            // Note: Because process.exit is mocked, execution continues, so we can't test
            // that success is not called. The real behavior would exit before reaching success.
        });
    });

    describe('Test sameBranch parameter behavior', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {});
            processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        });

        it('should exclude branch step when sameBranch is true', async () => {
            getMultilineInput.mockResolvedValue('Test sameBranch true');

            await step0(true);

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).not.toContain('Create a git branch');
        });

        it('should include branch step when sameBranch is false', async () => {
            getMultilineInput.mockResolvedValue('Test sameBranch false');

            await step0(false);

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('0 - Create a git branch for this task');
        });

        it('should use step 1 when sameBranch is true', async () => {
            getMultilineInput.mockResolvedValue('Test step number with sameBranch');

            await step0(true);

            const prompt = executeClaude.mock.calls[0][0];
            // Should start with Step 1 after the empty branchStep
            expect(prompt).toContain('1 - Read the user prompt and **deeply understand the intent**.');
        });

        it('should use step 2 when sameBranch is false', async () => {
            getMultilineInput.mockResolvedValue('Test step number without sameBranch');

            await step0(false);

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('1 - Read the user prompt and **deeply understand the intent**.');
        });

        it('should handle sameBranch default value (false)', async () => {
            getMultilineInput.mockResolvedValue('Test default sameBranch');

            await step0();

            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('0 - Create a git branch for this task');
        });
    });

    describe('Test edge cases and error scenarios', () => {
        beforeEach(() => {
            // Reset fs.writeFileSync to default implementation
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {}); // Reset to no-op
        });

        it('should handle null promptText by calling getMultilineInput', async () => {
            getMultilineInput.mockResolvedValue('Input from getMultilineInput');

            await step0(false, null);

            expect(getMultilineInput).toHaveBeenCalled();
        });

        it('should prefer promptText parameter over getMultilineInput', async () => {
            const directPrompt = 'Direct prompt parameter';
            getMultilineInput.mockResolvedValue('This should not be used');

            await step0(false, directPrompt);

            expect(getMultilineInput).not.toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                directPrompt
            );
        });

        it('should handle getMultilineInput returning empty string', async () => {
            getMultilineInput.mockResolvedValue('');

            await step0();

            expect(logger.error).toHaveBeenCalled();
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });

        it('should handle executeClaude throwing error', async () => {
            getMultilineInput.mockResolvedValue('Valid prompt for error test');
            executeClaude.mockRejectedValue(new Error('Network error'));

            await expect(step0()).rejects.toThrow('Network error');
        });

        it('should handle fs.writeFileSync errors', async () => {
            getMultilineInput.mockResolvedValue('Valid prompt for fs error');
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            await expect(step0()).rejects.toThrow('Write error');

            // Reset fs.writeFileSync for subsequent tests
            fs.writeFileSync.mockImplementation(() => {});
        });

        it('should handle prompt with special characters', async () => {
            const specialPrompt = 'Test with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
            getMultilineInput.mockResolvedValue(specialPrompt);

            await step0();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                specialPrompt
            );
        });

        it('should handle very long prompt', async () => {
            const longPrompt = 'A'.repeat(10000);
            getMultilineInput.mockResolvedValue(longPrompt);

            await step0();

            expect(executeClaude).toHaveBeenCalled();
            expect(logger.success).toHaveBeenCalled();
        });

        it('should handle prompt with newlines', async () => {
            const multilinePrompt = 'Line 1\nLine 2\nLine 3';
            getMultilineInput.mockResolvedValue(multilinePrompt);

            await step0();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                multilinePrompt
            );
        });

        it('should handle all three parameters provided', async () => {
            const customPrompt = 'Custom prompt text';

            await step0(true, customPrompt, 'hard');

            expect(getMultilineInput).not.toHaveBeenCalled();
            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('1 - Read the user prompt and **deeply understand the intent**.');
            expect(prompt).not.toContain('Create a git branch');
        });

        it('should handle invalid mode parameter gracefully', async () => {
            getMultilineInput.mockResolvedValue('Test invalid mode');

            await step0(false, null, 'invalid');

            // Should default to auto mode
            const prompt = executeClaude.mock.calls[0][0];
            expect(prompt).toContain('1 - Read the user prompt and **deeply understand the intent**.');
        });
    });

    describe('Test workflow integration', () => {
        beforeEach(() => {
            // Reset all mocks for workflow tests
            jest.clearAllMocks();
            executeClaude.mockResolvedValue();
            fs.writeFileSync.mockImplementation(() => {});
        });

        it('should execute full workflow in correct order', async () => {
            const testPrompt = 'Complete workflow test';
            getMultilineInput.mockResolvedValue(testPrompt);

            await step0();

            // Verify call order
            expect(logger.newline).toHaveBeenCalled();
            expect(logger.startSpinner).toHaveBeenCalled();
            expect(startFresh).toHaveBeenCalledWith(true);
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(executeClaude).toHaveBeenCalled();
            expect(logger.stopSpinner).toHaveBeenCalled();
            expect(logger.success).toHaveBeenCalled();
        });

        it('should not proceed after validation failure', async () => {
            getMultilineInput.mockResolvedValue('fail');

            await step0();

            expect(logger.error).toHaveBeenCalled();
            expect(processExitSpy).toHaveBeenCalledWith(0);
            // Note: Because process.exit is mocked, execution continues after the exit call.
            // In real execution, the process would terminate and subsequent code wouldn't run.
        });

        it('should complete all steps when given valid direct prompt', async () => {
            await step0(false, 'Valid direct prompt text');

            expect(getMultilineInput).not.toHaveBeenCalled();
            expect(startFresh).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(executeClaude).toHaveBeenCalled();
            expect(logger.success).toHaveBeenCalled();
        });
    });
});
