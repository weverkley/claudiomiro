## OBJECTIVE
Create comprehensive unit tests for src/steps/step2.js (TODO.md generation from requirements).
Done when: step2 tested, PROMPT.md reading covered, TODO.md creation verified, Claude execution mocked, >90% coverage, runs independently.

## DEPENDENCIES
- Requires: TASK1 (Jest setup)
- Provides for: TASK20 (Integration tests)

## PARALLELIZATION
- Layer: 1 (Unit Tests)
- Parallel with: TASK2-14, TASK16-19 (17 other unit test tasks)
- Complexity: Medium

## CONSTRAINTS
- Mock all external dependencies (fs, executeClaude, logger, state, prompt-reader)
- TODO.md first line: "Fully implemented: NO"
- Test file reading and writing
- Verify TODO structure
- Test user interaction
- No manual/deployment steps

## IMPLEMENTATION REQUIREMENTS
1. Create __tests__/steps/step2.test.js
2. Mock fs (readFileSync, writeFileSync)
3. Mock executeClaude (returns TODO.md content)
4. Mock logger (info, error, spinner methods)
5. Mock state (setTaskState, getTaskState)
6. Mock prompt-reader (getMultilineInput for user feedback)
7. Test cases:
   - step2: reads PROMPT.md for task requirements
   - Claude execution: calls executeClaude with TODO generation prompt
   - TODO.md creation: writes structured TODO content
   - User feedback: allows optional user input
   - TODO validation: first line is "Fully implemented: NO"
   - State updates: marks TODO as generated
   - Error handling: file read errors, Claude failures
   - Edge case: empty PROMPT.md
   - Edge case: user provides additional context
8. Verify TODO.md structure (checkboxes, sections)
9. Verify executeClaude called with PROMPT.md content

## RISKS
1. TODO format validation → Test exact format requirements
2. User interaction → Mock both with and without feedback
3. File content → Verify complete TODO structure
