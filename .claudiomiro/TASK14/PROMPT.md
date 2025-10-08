## OBJECTIVE
Create comprehensive unit tests for src/steps/step1.js (dependency analysis and validation).
Done when: step1 tested, @dependencies tag added, validation covered, Claude execution mocked, >90% coverage, runs independently.

## DEPENDENCIES
- Requires: TASK1 (Jest setup)
- Provides for: TASK20 (Integration tests)

## PARALLELIZATION
- Layer: 1 (Unit Tests)
- Parallel with: TASK2-13, TASK15-19 (17 other unit test tasks)
- Complexity: Medium

## CONSTRAINTS
- Mock all external dependencies (fs, executeClaude, logger, state)
- TODO.md first line: "Fully implemented: NO"
- Test dependency graph analysis
- Verify file modifications
- Test validation logic
- No manual/deployment steps

## IMPLEMENTATION REQUIREMENTS
1. Create __tests__/steps/step1.test.js
2. Mock fs (readFileSync, writeFileSync, existsSync)
3. Mock executeClaude (returns dependency analysis results)
4. Mock logger (info, error, warn)
5. Mock state (getTaskDependencies, updateTaskDependencies)
6. Test cases:
   - step1: reads TASK.md files for all tasks
   - Dependency analysis: calls executeClaude with task context
   - @dependencies tag: appends to PROMPT.md files
   - Dependency validation: detects circular dependencies
   - Dependency validation: detects missing tasks
   - State updates: updates task dependency graph
   - Error handling: file read errors, validation failures
   - Edge case: task with no dependencies
   - Edge case: complex dependency chain
7. Verify PROMPT.md updated with @dependencies section
8. Verify executeClaude called with correct analysis prompt

## RISKS
1. Dependency graph complexity → Use simple test cases first
2. File modification → Verify exact content appended
3. Validation logic → Test both valid and invalid scenarios
