## OBJECTIVE
Create comprehensive integration and end-to-end tests for the entire claudiomiro system.
Done when: Full workflow tested, CLI E2E covered, DAG orchestration verified, >90% overall coverage, CI-ready.

## DEPENDENCIES
- Requires: TASK2-19 (all unit tests must be complete)
- Provides for: NONE (final task - Layer 2)

## PARALLELIZATION
- Layer: 2 (Integration/E2E)
- Parallel with: NONE
- Complexity: High

## CONSTRAINTS
- Minimal mocking - use real file system in temp directories
- TODO.md first line: "Fully implemented: NO"
- Test complete workflows end-to-end
- Verify state persistence across steps
- Test error recovery scenarios
- Ensure CI compatibility
- No manual/deployment steps

## IMPLEMENTATION REQUIREMENTS
1. Create __tests__/integration/full-workflow.test.js
   - Test step0 → step1 → step2 → step3 → step4 → step5 flow
   - Use real temp directories (os.tmpdir())
   - Mock only external APIs (Claude API, GitHub API)
   - Test DAG execution with multiple parallel tasks
   - Verify file creation at each step
   - Test state transitions
   - Test error recovery and rollback

2. Create __tests__/e2e/cli.e2e.test.js
   - Test CLI initialization (cli.init())
   - Test command parsing and execution
   - Test user interaction flows
   - Test git operations in temp repos
   - Test error messages and exit codes
   - Mock stdin for user input simulation

3. Create __tests__/helpers/test-utils.js
   - createTempDir(): creates isolated test directory
   - cleanupTempDir(): removes test artifacts
   - mockClaudeAPI(): simulates Claude responses
   - mockGitHubAPI(): simulates GitHub operations
   - createTestFixtures(): generates test files
   - verifyFileStructure(): validates output

4. Test scenarios:
   - Happy path: complete workflow succeeds
   - Partial failure: step3 fails, recovery possible
   - Dependency blocking: task waits for dependencies
   - Parallel execution: multiple tasks run concurrently
   - State persistence: state survives process restart
   - Git operations: branch creation, commits, push
   - CLI errors: invalid commands, missing files

5. Coverage requirements:
   - Integration tests: focus on component interaction
   - E2E tests: focus on user scenarios
   - Overall coverage: >90% across all modules
   - CI compatibility: tests run in GitHub Actions

## RISKS
1. Temp directory cleanup → Use afterEach hooks consistently
2. Async orchestration → Use proper async/await patterns
3. External API mocking → Keep mocks realistic and comprehensive
4. Test isolation → Ensure no shared state between tests
5. Long test duration → Optimize with parallel execution where safe
