const fs = require('fs');
const path = require('path');
const state = require('../config/state');
const { executeClaude } = require('../services/claude-executor');
const { first } = require('lodash');

const listFolders = (dir) => {
  return fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
}

const step3 = async (task) => {
    const folder = (file) => path.join(state.claudiomiroFolder, task, file);

    if(fs.existsSync(folder('CODE_REVIEW.md'))){
      fs.rmSync(folder('CODE_REVIEW.md'));
    }

    const contextFiles = [
      path.join(state.claudiomiroFolder, 'AI_PROMPT.md')
    ];

    const folders = listFolders(state.claudiomiroFolder).filter(f => f.includes('TASK'));

    for(const f of folders){
      const taskPath = path.join(state.claudiomiroFolder, f);
      const taskFiles = fs.readdirSync(taskPath).filter(file => !['CODE_REVIEW.md', 'PROMPT.md', 'TASK.md', 'TODO.md'].includes(file) && !file.includes('TODO.old.') && file.endsWith('.md'));

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


    if(fs.existsSync(folder('info.json'))){
      let info = JSON.parse(fs.readFileSync(folder('info.json'), 'utf8'));
      info.attempts += 1;
      info.lastError = null;
      info.lastRun = new Date().toISOString();

      fs.writeFileSync(folder('info.json'), JSON.stringify(info), 'utf8');
    }else{
      let info = {
        firstRun: new Date().toISOString(),
        lastRun: new Date().toISOString(),
        attempts: 1,
        lastError: null
      };
      fs.writeFileSync(folder('info.json'), JSON.stringify(info), 'utf8');
    }


    // Insert into prompt.md or task.md the generated md files from other tasks.

    try {
      return await executeClaude(`
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

RULES:
- Don't run git add/commit/push.
- First line of ${folder('TODO.md')} MUST be "Fully implemented: YES" or "NO".
- CRITICAL: Update ${folder('TODO.md')} in real time as you're doing things.
- Multi-repo tasks are allowed.
- Only mark BLOCKED if you cannot do the item no matter how.
- Always prefer auto fixes (e.g., eslint --fix).

TESTS:
- Run only affected tests/linters/typechecks.
- If no tests exist → run static analysis only.
- Never run full-project checks.

FAILURES:
- On test failure → add "FAILED: test <module>" and retry loop.
- On logic/build failure → revert file and log "ROLLBACK: <reason>".
- On Claude execution timeout or failure → ensure TODO.md remains with "Fully implemented: NO"

STOP-DIFF:
- Do not rename TODO items or unrelated files.
- Keep diffs minimal and atomic.

STATE:
- Persist updates to ${folder('TODO.md')} and logs after each loop.

MCP:
- Use MCPs only for analysis/testing, never for file modification.
    `, task);
    } catch (error) {
      
      let info = JSON.parse(fs.readFileSync(folder('info.json'), 'utf8'));
      info.lastError = JSON.stringify(error);
      fs.writeFileSync(folder('info.json'), JSON.stringify(info), 'utf8');

      // If executeClaude fails, ensure TODO.md is marked as not fully implemented
      if (fs.existsSync(folder('TODO.md'))) {
        let todo = fs.readFileSync(folder('TODO.md'), 'utf8');
        const lines = todo.split('\n');

        // Update the first line to be "Fully implemented: NO" if it exists
        if (lines.length > 0) {
          lines[0] = 'Fully implemented: NO';
          todo = lines.join('\n');
          fs.writeFileSync(folder('TODO.md'), todo, 'utf8');
        }
      }

      // Re-throw the error so the dag-executor can handle it
      throw error;
    }
}

module.exports = { step3 };
