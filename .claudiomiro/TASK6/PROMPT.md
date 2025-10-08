## OBJECTIVE
Implement pure calculation logic for computing total progress percentage across all parallel tasks.
Done when:
- calculateProgress(taskStates) function created and exported
- Counts completed and failed tasks as done
- Ignores running and pending tasks
- Returns rounded integer percentage: Math.round((done / total) * 100)
- Handles zero tasks edge case (returns 0)
- Pure function with no side effects
- Unit tests cover all scenarios (0%, 50%, 100%, mixed)
- Tests pass: `npm test -- progress-calculator.test.js`

## DEPENDENCIES
- Requires: TASK1 (ParallelStateManager for state format)
- Provides for: TASK7 (final integration)

## PARALLELIZATION
- Layer: 1 (Core Features)
- Parallel with: TASK3, TASK4, TASK5
- Complexity: Low
- Estimated effort: Small

## CONSTRAINTS
- Include tests with implementation
- TODO.md first line: "Fully implemented: NO"
- No manual/deployment steps
- TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO
- Must be pure function (no side effects)
- Must return integer (no decimals)
- Must handle edge cases gracefully

## RISKS & MITIGATIONS
1. **Division by zero with no tasks** → Explicitly check totalCount === 0, return 0
2. **Incorrect status counting** → Clear logic: completed + failed = done, running + pending = not done
3. **Floating point errors** → Use Math.round() for clean integers
4. **State format changes** → Document expected format clearly, validate in tests
5. **Performance with many tasks** → Simple counting is O(n), very fast even for hundreds of tasks

## ACCEPTANCE CRITERIA (Detailed)
- [ ] File `src/utils/progress-calculator.js` created
- [ ] Function signature: `function calculateProgress(taskStates) { ... }`
- [ ] Exported: `module.exports = { calculateProgress };`
- [ ] Logic: `const total = Object.keys(taskStates).length`
- [ ] Logic: `const done = Object.values(taskStates).filter(t => t.status === 'completed' || t.status === 'failed').length`
- [ ] Logic: `if (total === 0) return 0;`
- [ ] Logic: `return Math.round((done / total) * 100);`
- [ ] Unit test: all completed → returns 100
- [ ] Unit test: half completed → returns 50
- [ ] Unit test: none completed → returns 0
- [ ] Unit test: zero tasks → returns 0
- [ ] Unit test: mix of completed/failed/running → correct percentage
- [ ] All tests pass: `npm test -- progress-calculator.test.js`
