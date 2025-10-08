## OBJECTIVE
Create a centralized state manager to track real-time status, step, and Claude messages for all parallel tasks.
Done when:
- ParallelStateManager class implemented with thread-safe state updates
- Methods for updating task status, step, and Claude messages exist
- Messages are auto-truncated to 100 chars for UI display
- getAllTaskStates() returns complete state object for rendering
- Comprehensive unit tests with >90% coverage pass
- Handles concurrent updates without race conditions
- Edge cases (long messages, invalid tasks) handled gracefully
- No crashes or errors on invalid input

## DEPENDENCIES
- Requires: NONE (foundation layer)
- Provides for: TASK3 (DAG integration), TASK4 (Claude message capture), TASK6 (progress calculation)

## PARALLELIZATION
- Layer: 0 (Foundation)
- Parallel with: TASK2
- Complexity: Medium
- Estimated effort: Medium

## CONSTRAINTS
- Include tests with implementation
- TODO.md first line: "Fully implemented: NO"
- No manual/deployment steps
- TODO.md CAN'T HAVE ACTIONS THAT CLAUDE CANNOT DO
- Backend: unit tests for all methods + edge case tests
- Message truncation must be exact (100 chars max)
- State updates must be synchronous (no await in setters)

## RISKS & MITIGATIONS
1. **Race conditions in async updates** → Use synchronous state updates, no async operations in setters
2. **Memory leak from long messages** → Implement strict 100-char truncation with ellipsis
3. **Invalid task names causing crashes** → Add graceful error handling, ignore unknown tasks
4. **State becoming inconsistent** → Validate all inputs, use immutable update patterns
5. **Difficult to test concurrency** → Create specific tests simulating rapid state changes

## ACCEPTANCE CRITERIA (Detailed)
- [ ] File `src/services/parallel-state-manager.js` exists and exports ParallelStateManager class
- [ ] `initialize(tasks)` method creates state entries for all provided tasks
- [ ] `updateTaskStatus(taskName, status)` correctly updates task status (pending/running/completed/failed)
- [ ] `updateTaskStep(taskName, step)` stores current step information (e.g., "Step 3 - Implementation")
- [ ] `updateClaudeMessage(taskName, message)` truncates messages to 100 chars with "..." if needed
- [ ] `getAllTaskStates()` returns object mapping task names to {status, step, message}
- [ ] All state update methods are synchronous (no async/await)
- [ ] Unit tests cover all methods and edge cases (>90% coverage)
- [ ] Tests pass: `npm test -- parallel-state-manager.test.js`
- [ ] Edge cases tested: long messages (>100 chars), null/undefined inputs, unknown task names
- [ ] No errors or crashes on invalid input (graceful degradation)
