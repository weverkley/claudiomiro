## OBJECTIVE
Create comprehensive unit tests for src/steps/step4.js (test execution and PR creation).
Done when: step4 tested, test execution covered, PR generation verified, GITHUB_PR.md created, >90% coverage, runs independently.

## DEPENDENCIES
- Requires: TASK1 (Jest setup)
- Provides for: TASK20 (Integration tests)

## PARALLELIZATION
- Layer: 1 (Unit Tests)
- Parallel with: TASK2-16, TASK18-19 (17 other unit test tasks)
- Complexity: Medium

## CONSTRAINTS
- Mock all external dependencies (fs, executeClaude, logger, state)
- TODO.md first line: "Fully implemented: NO"
- Test git operations
- Verify PR file creation
- Test error scenarios
- No manual/deployment steps

## IMPLEMENTATION REQUIREMENTS
1. Create __tests__/steps/step4.test.js
2. Mock fs (readFileSync, writeFileSync)
3. Mock executeClaude (runs tests, generates PR)
4. Mock logger (info, error, spinner methods)
5. Mock state (setTaskState, getTaskState)
6. Mock child_process for git commands
7. Test cases:
   - step4: executes test suite via Claude
   - Test results: processes test output
   - PR generation: calls executeClaude for PR description
   - GITHUB_PR.md creation: writes PR content to file
   - Git commit: commits changes for task
   - State updates: marks PR as ready
   - Error handling: test failures, git errors
   - Edge case: tests fail → appropriate error handling
   - Edge case: empty PR description
8. Verify GITHUB_PR.md content structure
9. Verify git commit message format

## RISKS
1. Test execution → Mock test results appropriately
2. Git operations → Use spawn mock for git commands
3. PR format → Validate PR description structure
