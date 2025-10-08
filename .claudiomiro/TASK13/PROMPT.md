## OBJECTIVE
Create comprehensive unit tests for src/steps/step0.js (task generation and planning).
Done when: step0 tested, PROMPT.md creation verified, Claude execution mocked, dependencies analyzed, git branch created, >90% coverage, runs independently.

## DEPENDENCIES
- Requires: TASK1 (Jest setup)
- Provides for: TASK20 (Integration tests)

## PARALLELIZATION
- Layer: 1 (Unit Tests)
- Parallel with: TASK2-12, TASK14-19 (17 other unit test tasks)
- Complexity: High

## CONSTRAINTS
- Mock all external dependencies (fs, executeClaude, logger, state, prompt-reader)
- TODO.md first line: "Fully implemented: NO"
- Test complex workflow orchestration
- Verify task parsing and DAG construction
- Test git operations
- No manual/deployment steps

## IMPLEMENTATION REQUIREMENTS
1. Create __tests__/steps/step0.test.js
2. Mock fs (writeFileSync, readFileSync, mkdirSync)
3. Mock executeClaude (returns Promise with task structure)
4. Mock logger (info, error, warn, spinner methods)
5. Mock state (setTaskCount, registerTask)
6. Mock prompt-reader (getMultilineInput returns user input)
7. Mock child_process for git commands
8. Test cases:
   - step0: collects user input via getMultilineInput
   - PROMPT.md creation: writes user requirements to file
   - Claude execution: calls executeClaude with planning prompt
   - Task parsing: parses TASK1/TASK.md files for dependencies
   - Git branch: creates feature branch
   - State updates: registers all tasks with dependencies
   - Error handling: Claude failure, file write errors
   - Edge case: no dependencies, circular dependencies
9. Verify executeClaude called with correct prompt structure
10. Verify fs.writeFileSync call order and content

## RISKS
1. Complex orchestration → Break into smaller test scenarios
2. Git mocking → Use simple spawn mock for git commands
3. File system operations → Track mock call sequence carefully
