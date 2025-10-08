## OBJECTIVE
Create comprehensive unit tests for src/steps/code-review.js (automated code review and quality checks).
Done when: codeReview tested, CODE_REVIEW.md generated, quality checks verified, feedback processed, >90% coverage, runs independently.

## DEPENDENCIES
- Requires: TASK1 (Jest setup)
- Provides for: TASK20 (Integration tests)

## PARALLELIZATION
- Layer: 1 (Unit Tests)
- Parallel with: TASK2-18 (17 other unit test tasks)
- Complexity: Medium

## CONSTRAINTS
- Mock all external dependencies (fs, executeClaude, logger, state)
- TODO.md first line: "Fully implemented: NO"
- Test review quality criteria
- Verify feedback structure
- Test error scenarios
- No manual/deployment steps

## IMPLEMENTATION REQUIREMENTS
1. Create __tests__/steps/code-review.test.js
2. Mock fs (readFileSync for code files, writeFileSync for review)
3. Mock executeClaude (performs code review)
4. Mock logger (info, error, warn, spinner methods)
5. Mock state (setReviewState, getTaskFiles)
6. Test cases:
   - codeReview: analyzes implemented code
   - Claude execution: calls executeClaude with review prompt
   - CODE_REVIEW.md creation: writes review findings
   - Quality checks: validates code standards
   - Review feedback: categorizes issues (critical, warnings, suggestions)
   - State updates: marks review as complete
   - Error handling: review failures, file errors
   - Edge case: no issues found (clean code)
   - Edge case: critical issues require fixes
8. Verify CODE_REVIEW.md structure (sections, severity levels)
9. Verify executeClaude called with code context

## RISKS
1. Review criteria → Define clear quality standards in tests
2. Feedback categorization → Test all severity levels
3. File analysis → Mock various code file scenarios
