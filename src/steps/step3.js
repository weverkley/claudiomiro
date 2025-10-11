const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');

const listFolders = (dir) => {
  return fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
}

const step3 = (task) => {
    const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    if(fs.existsSync(folder('CODE_REVIEW.md'))){
      fs.rmSync(folder('CODE_REVIEW.md'));
    }

    const contextFiles = [];

    const folders = listFolders(state.claudiomiroFolder).filter(f => f.includes('TASK'));

    for(const f of folders){
      const taskPath = path.join(state.claudiomiroFolder, f);
      const taskFiles = fs.readdirSync(taskPath).filter(file => !['CODE_REVIEW.md', 'PROMPT.md', 'TASK.md', 'TODO.md'].includes(file) && file.endsWith('.md'));

      for(const file of taskFiles){
         const add = path.join(taskPath, file);
         if(!contextFiles.includes(add)){
             contextFiles.push(add);
         }
      }
    }

    if(contextFiles.length > 0 && fs.existsSync(folder('TODO.md'))){
      let todo = fs.readFileSync(folder('TODO.md'), 'utf8');

      if(!todo.includes('## PREVIOUS TASKS CONTEXT FILES AND RESEARCH:')){
         todo += `\n\n## PREVIOUS TASKS CONTEXT FILES AND RESEARCH: ${contextFiles.map(f => `\n- ${f}`).join('')}\n\n`;
      }

      fs.writeFileSync(folder('TODO.md'), todo, 'utf8');
    }


    // Insert into prompt.md or task.md the generated md files from other tasks.

    return executeClaude(`PHASE: EXECUTION LOOP (DEPENDENCY + SAFETY)

      RULES:
      - Never run git add/commit/push.
      - ${folder('TODO.md')} must exist and start with "Fully implemented: YES" or "NO".
      - Multi-repo tasks are allowed.
      - Only mark BLOCKED if external/manual dependency.
      
---

OBJECTIVE:
Execute all actionable items in ${folder('TODO.md')} in parallel when possible.  
Stop only when all items are [X] or BLOCKED/FAILED and the first line is "Fully implemented: YES".

---

LOOP:
1. Read ${folder('TODO.md')}.
2. If malformed or unreadable → ERROR.
3. For each unchecked item:
   a. Skip if "BLOCKED:" → log reason.
   b. Try execution.
   c. If success → mark [X].
   d. If fail → add "FAILED: <reason>".
4. After all processed:
   - Run targeted tests ONLY on modified paths (unit, lint, type) 
      - NEVER run full-project.
   - If all pass → set "Fully implemented: YES".
   - Else → revert to "NO" and reopen failed items.

TESTS:
- Run only affected tests/linters/typechecks.
- If no tests exist → run static analysis only.
- Never run full-project checks.

FAILURES:
- On test failure → add "FAILED: test <module>" and retry loop.
- On logic/build failure → revert file and log "ROLLBACK: <reason>".

STOP-DIFF:
- Do not rename TODO items or unrelated files.
- Keep diffs minimal and atomic.

STATE:
- Persist updates to ${folder('TODO.md')} and logs after each loop.

MCP:
- Use MCPs only for analysis/testing, never for file modification.
    `, task);
}

module.exports = { step3 };
