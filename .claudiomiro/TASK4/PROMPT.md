## OBJECTIVE
Create comprehensive unit tests for CLI module (src/cli.js).
Done when: Argument parsing tested, workflow logic verified, buildTaskGraph covered, error handling tested, >90% coverage, runs independently.

## DEPENDENCIES
- Requires: TASK1 (Jest setup)
- Provides for: TASK20 (Integration tests)

## PARALLELIZATION
- Layer: 1 (Unit Tests)
- Parallel with: TASK2, TASK3, TASK5-TASK19 (17 other unit test tasks)
- Complexity: High

## CONSTRAINTS
- Mock fs, state, file-manager, steps modules, DAGExecutor
- TODO.md first line: "Fully implemented: NO"
- Test all command-line argument combinations
- Verify workflow state transitions
- No manual/deployment steps

## IMPLEMENTATION REQUIREMENTS
1. Create __tests__/cli.test.js
2. Mock process.argv with different flag combinations
3. Mock fs methods (existsSync, readdirSync, readFileSync, statSync)
4. Mock state.setFolder, state.folder, state.claudiomiroFolder
5. Test cases:
   - Argument parsing: --prompt="test" → extracts correctly
   - buildTaskGraph: valid dependencies → returns graph
   - buildTaskGraph: missing @dependencies → returns null
   - chooseAction: no .claudiomiro → calls step0
   - chooseAction: has PROMPT.md, no @dependencies → calls step1
   - chooseAction: has @dependencies → activates DAGExecutor
   - init: max cycles reached → logs error and exits
   - Folder validation: non-existent folder → process.exit(1)

## RISKS
1. Complex workflow logic → Break into smaller test cases for each branch
2. process.argv mocking → Reset before each test with beforeEach
3. State mutations → Mock state as fresh object for each test
