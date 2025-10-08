## OBJECTIVE
Create comprehensive unit tests for State class (src/config/state.js).
Done when: Singleton tested, path resolution verified, getters covered, edge cases tested, >90% coverage, runs independently.

## DEPENDENCIES
- Requires: TASK1 (Jest setup)
- Provides for: TASK20 (Integration tests)

## PARALLELIZATION
- Layer: 1 (Unit Tests)
- Parallel with: TASK2, TASK3, TASK4, TASK6-TASK19 (17 other unit test tasks)
- Complexity: Low

## CONSTRAINTS
- Mock path.resolve and path.join if needed
- TODO.md first line: "Fully implemented: NO"
- Test singleton pattern behavior
- Verify absolute path resolution
- No manual/deployment steps

## IMPLEMENTATION REQUIREMENTS
1. Create __tests__/config/state.test.js
2. Import state module (singleton instance)
3. Test cases:
   - Initial state: folder and claudiomiroFolder are null
   - setFolder('/absolute/path') → folder returns '/absolute/path'
   - setFolder('relative/path') → folder returns resolved absolute path
   - claudiomiroFolder getter → returns folder + '/.claudiomiro'
   - Multiple setFolder calls → state updates correctly
   - Edge case: setFolder('') or setFolder('.') → handles correctly
4. Test singleton: require state twice → same instance

## RISKS
1. Singleton state pollution → Reset state in beforeEach or afterEach
2. Path resolution differences → Use path.resolve to normalize expected values
