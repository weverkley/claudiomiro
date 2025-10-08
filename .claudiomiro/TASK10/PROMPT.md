## OBJECTIVE
Create comprehensive unit tests for src/services/file-manager.js module.
Done when: file-manager.test.js created, startFresh tested, cleanup verified, tests pass, coverage > 80%.

## DEPENDENCIES
- Requires: TASK1, TASK2
- Provides for: NONE

## PARALLELIZATION
- Layer: 2 (Core Module Tests)
- Parallel with: TASK3, TASK4, TASK5, TASK6, TASK7, TASK8, TASK9, TASK11-17
- Complexity: Medium

## CONSTRAINTS
- Include tests with implementation
- TODO.md first line: "Fully implemented: NO"
- No manual/deployment steps
- Mock all file system operations
- Test cleanup thoroughly

## RISKS
1. File deletion safety → Verify mocks prevent actual file deletion
2. Directory traversal → Mock fs.readdirSync and related methods
