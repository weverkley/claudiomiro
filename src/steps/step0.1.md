## OBJECTIVE
Transform the user’s request into a **complete, precise, and execution-ready prompt file** named:
{{claudiomiroFolder}}/AI_PROMPT.md

This file becomes the canonical instruction for downstream AI agents (planning, coding, reviewing, testing, deploying).

---

## STAGE 1 — INTENT EXTRACTION
1. Read and understand the user’s request **deeply**.
   - Identify the *true purpose* behind the request — not just the words.
   - If the user includes a checklist or bullet points, treat **each item as an independent and mandatory verification unit**.
   - Dissect the problem space:
     • What’s the ultimate goal or system outcome?  
     • What’s trivial vs complex?  
     • What defines success and completeness?  
     • Which parts belong to the foundational layer (Layer 0)?  
     • What can safely run in parallel, and what must run sequentially?  
     • How will the final system verify its own internal consistency?

---

## STAGE 2 — CONTEXT RECONSTRUCTION
2. Expand the context intelligently:
   - Identify and reference **all related modules, files, or prior tasks** that influence this request.
   - Infer architecture, data flow, dependencies, and system interactions.
   - Connect this request to previous or adjacent work — define inputs, outputs, contracts, and sequence boundaries.

---

## STAGE 3 — PROMPT SYNTHESIS
3. Write the resulting AI prompt (`AI_PROMPT.md`) as a **refined, system-aware command** containing:
   - A rewritten version of the user request with **zero ambiguity** and **explicit acceptance criteria**.
   - All implicit requirements made explicit.
   - Contextual details about related components, architecture, or constraints.
   - Guidance on what to implement, verify, or validate.

The text should read naturally as the **direct next-step instruction for an advanced autonomous AI agent**.

---

## STAGE 4 — STRUCTURE OF AI_PROMPT.md
The output file must follow this exact layout:

### 1. 🎯 Purpose
A clear, concise explanation of what the downstream agent must achieve.

### 2. 🧩 Context
Summarize relevant architecture, modules, and dependencies.
List connected systems, previous tasks, or constraints influencing this request.

### 3. ✅ Acceptance Criteria
Convert **every bullet or implicit expectation** from the original user request into **explicit verifiable requirements**.
Each criterion must be independently testable.

### 4. ⚙️ Implementation Guidance
Detail how the agent should think, plan, and execute:
- What belongs to Layer 0 (foundation)
- What can run in parallel vs sequentially
- Expected artifacts (code, tests, configs, migrations, docs, etc.)

### 4.1 Testing Guidance
- **Unit tests:** are the default, but should **only** be created for functions or methods with **non-trivial logic** (conditions, loops, calculations, or data transformations).  
  - If the code is simple glue code (re-exports, configuration, or mappings), **do not test it**.  
  - If the user **explicitly states not to create them**, the agent **must not create them**, even unit tests.
- **Integration tests:** create **only** when the task **explicitly requires validating interactions** between modules or components (e.g., controller → service → database).  
  - Otherwise, **do not simulate integration**.  
  - Use mocked data, never real data or real databases.  
  - If the user **explicitly states not to create them**, the agent **must not create them**.
- **E2E tests:** **only** if the user clearly requests them. Never assume they are needed.
- **Any other test type (mocking, snapshot, UI, performance, etc.):** **only** if explicitly required by the user.
- **Summary rule:**  
  > The agent must **minimize unnecessary testing**. When in doubt, **create a test**, better to have than doesn't.  
  > Prioritize *efficiency and relevance* over total coverage.
  > Avoid junk testing, they make us slower.

### 5. 🔍 Verification and Traceability
Define how the result will be validated:
- Each user requirement must appear (verbatim or paraphrased) in reasoning or output.
- No merging, skipping, or assumed coverage.
- Missing or generalized requirements = **failure**.

### 6. 🧠 Reasoning Boundaries
Specify how deep the agent must reason:
- Always prefer **system coherence** over over-engineering.
- Preserve logic from adjacent modules.
- Never hallucinate new abstractions unless strictly justified.

---

## STAGE 5 — COMPLETENESS ENFORCEMENT
Before outputting `AI_PROMPT.md`, confirm:
- Every requirement from the user request is represented.
- No item was skipped, merged, or generalized.
- Context and validation methods are explicit.
- The file could be handed to a coding agent and produce correct results without further clarification.

---

## FINAL OUTPUT
Return only the **complete content of `{{claudiomiroFolder}}/AI_PROMPT.md`**, fully written and ready to execute.
Do not include meta-explanations or reasoning outside the file.

 ---

## User Request:
{{TASK}}