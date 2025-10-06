# Claudiomiro

**100% Autonomous AI Development Agent**

Transform days of complex development work into minutes while maintaining production-ready code quality.

## The Problem with Claude Code

When using Claude Code for complex tasks, you've probably noticed it **stops before completing the job**. The result? You find yourself typing "continue" over and over again, managing the workflow manually.

## What is Claudiomiro?

**Claudiomiro** is a Node.js CLI that wraps Claude AI in a structured, **autonomous workflow**. Unlike simple code generators, Claudiomiro:

- ✅ Thinks through complex problems
- ✅ Analyzes your entire codebase
- ✅ Identifies patterns and best practices
- ✅ Implements comprehensive solutions
- ✅ **Runs autonomously until completion** (up to 15 cycles)

### The Magic: Autonomous Looping

Claudiomiro doesn't just run once. It **loops autonomously** until the entire task is complete:

```
Cycle 1: [Step 1] Creating PROMPT.md and TODO.md
Cycle 2: [Step 2] Researching codebase and patterns
Cycle 3: [Step 3] Implementing tasks (TODO shows "Fully implemented: NO")
Cycle 4: [Step 3] Continue implementing (still "NO")
Cycle 5: [Step 3] Continue implementing (still "NO")
Cycle 6: [Step 3] Final implementation (changes to "Fully implemented: YES")
Cycle 7: [Step 4] Running tests... ❌ 3 tests failed
Cycle 8: [Step 3] Fixing failing tests
Cycle 9: [Step 4] Running tests... ✅ All tests passed!
Cycle 10: [Step 5] Creating commit and pushing

✓ Task completed in 10 autonomous cycles
```

No manual intervention. No "continue" prompts. Just complete, production-ready code.

## Real-World Impact

### Use Case 1: Eliminating Code Duplication
**Task**: Unify 4 near-identical modules (2,264 lines of duplicated code)
**Manual Estimate**: 2-3 days
**Claudiomiro Time**: 12 minutes
**Result**: 81.6% code reduction, comprehensive tests, zero bugs

### Use Case 2: Complete Feature Implementation
**Task**: Multi-step user onboarding system (5 steps, backend, emails, OAuth, tests)
**Manual Estimate**: 3-5 days
**Claudiomiro Time**: 25 minutes
**Result**: 105 tests, 97.3% coverage, mobile-responsive UI

### Use Case 3: Large-Scale Refactoring
**Task**: Migrate from session-based auth to JWT across entire stack (127 files)
**Manual Estimate**: 2 weeks
**Claudiomiro Time**: 35 minutes
**Result**: Zero downtime migration, 126 tests, all functionality preserved

### Use Case 4: Critical Bug Investigation
**Task**: Find and fix intermittent data corruption bug
**Manual Estimate**: Days of debugging
**Claudiomiro Time**: 8 minutes
**Result**: Root cause identified in 3 files, race conditions eliminated, tests added

## The 5-Step Autonomous Workflow

1. **Initialization** - Analyzes task, creates git branch, enhances the prompt
2. **Research** - Deeply researches codebase and relevant documentation
3. **Implementation** - *Runs multiple times autonomously* until fully complete
4. **Testing** - Runs all tests, fixes failures, loops until all pass
5. **Commit & Push** - Creates meaningful commits and pushes to repository

### Safety Mechanisms

- **Maximum 15 cycles** - Prevents runaway execution
- **Progress validation** - Ensures forward progress each cycle
- **Error detection** - Stops if same error repeats
- **Manual override** - Use `--push=false` to review before final commit

## Key Features

- 🔄 **Truly Autonomous**: Loops until task is 100% complete
- 🧠 **Deep Analysis**: Understands your codebase patterns and architecture
- 🧪 **Quality Enforced**: Never skips tests, always validates
- 📊 **Full Transparency**: Live logs show every decision and action
- 🎯 **Production Ready**: Code is tested, documented, and ready to merge
- ⚡ **Massive Time Savings**: 95-98% reduction in development time

## Prerequisites for Optimal Performance

For best results, your project should have:

**Minimum:**
- Basic linting (ESLint, Pylint, etc.)
- Some unit tests for core functionality

**Optimal:**
- Comprehensive linting with strict rules
- High test coverage (>80%)
- Integration tests for critical paths
- MCPs configured (gives Claude superpowers)

**Why?** Linting and tests create a **feedback loop** that enables Claudiomiro to validate its work and iterate autonomously until everything is perfect.

## Installation

```bash
npm install -g claudiomiro
```

## Quick Start

```bash
# Run with a complex task
claudiomiro --prompt="Your complex task description here"

# Or run interactively
claudiomiro
```

That's it! Claudiomiro will autonomously handle the rest.

## Usage Examples

### Basic Usage
```bash
# Run in current directory with a task
claudiomiro --prompt="Add user authentication with JWT"

# Run in specific directory
claudiomiro /path/to/project --prompt="Refactor payment processing"

# Interactive mode (prompts you for task description)
claudiomiro
```

### Advanced Options
```bash
# Review changes before pushing (recommended for first use)
claudiomiro --prompt="Implement dark mode" --push=false

# Work on current branch (no new branch created)
claudiomiro --prompt="Fix login bug" --same-branch

# Start fresh (removes all generated files)
claudiomiro --fresh

# Combine options
claudiomiro /path/to/project --prompt="Add GraphQL API" --push=false --same-branch
```

### Example Prompts

**Eliminating Duplication:**
```bash
claudiomiro --prompt="These files are nearly identical:
/src/modules/bills-to-pay-form
/src/modules/bills-to-receive-form
Unify them into shared components to eliminate duplication."
```

**Feature Implementation:**
```bash
claudiomiro --prompt="Create a user onboarding system with:
- Multi-step form (profile, company, preferences)
- Email verification
- Progress saving
- Mobile responsive
- Full test coverage"
```

**Large Refactoring:**
```bash
claudiomiro --prompt="Migrate from REST to GraphQL:
- Convert all API endpoints
- Update all frontend calls
- Maintain backward compatibility during transition
- Add comprehensive tests"
```

**Bug Investigation:**
```bash
claudiomiro --prompt="Users report intermittent data corruption.
Investigate root cause in /services/FinancialService.js
and fix with proper tests to prevent regression."
```

## When to Use Claudiomiro

### Perfect For ✅

- **Eliminating code duplication** - Refactor similar modules into shared components
- **Implementing complete features** - End-to-end feature development with tests
- **Large-scale refactorings** - Architectural changes across many files
- **Complex bug investigations** - Finding and fixing non-obvious issues
- **Technology migrations** - Switch libraries, frameworks, or patterns
- **Adding test coverage** - Comprehensive test suites for existing code

### Less Suitable For ❌

- Quick experiments or prototypes
- Learning exercises (you want to write code yourself)
- Highly creative/ambiguous tasks
- Tasks requiring frequent human judgment calls

## Generated Files

Claudiomiro creates these files to track progress and enable autonomous execution:

- **PROMPT.md** - Enhanced task description with analysis
- **TODO.md** - Detailed breakdown of all tasks (`Fully implemented: YES/NO`)
- **LOG.md** - Real-time log of actions taken during implementation
- **GITHUB_PR.md** - Generated pull request description
- **claudiomiro_log.txt** - Complete execution log with timestamps

**Tip:** Review `TODO.md` early to validate the implementation plan. Use `--fresh` to start over.

## Best Practices

### Write Better Prompts
- ✅ Include file paths when relevant
- ✅ Describe current state AND desired state
- ✅ Mention specific constraints or requirements
- ✅ Reference similar patterns in your codebase

### Trust the Process
- ✅ Let Claudiomiro complete all 5 steps autonomously
- ✅ Don't interrupt mid-execution
- ✅ Review the generated `TODO.md` early to validate approach
- ✅ Use `--push=false` first time to review changes before pushing

### Maximize Value
- ✅ Use for large, time-consuming tasks
- ✅ Apply to repetitive refactorings
- ✅ Leverage for test coverage improvements
- ✅ Use for architectural improvements

## Requirements

- **Node.js** (v14+)
- **Claude CLI** installed and configured ([Setup Guide](https://docs.anthropic.com/claude/docs))
- **Git repository** (initialized with at least one commit)

## What Makes This Different?

Traditional AI assistants:
- ❌ Stop after one response
- ❌ You manually run tests
- ❌ You manually fix failures
- ❌ You create commits/PRs
- ❌ No structured approach

**Claudiomiro:**
- ✅ Runs autonomously until complete (up to 15 cycles)
- ✅ Automatically runs tests
- ✅ Automatically fixes test failures
- ✅ Creates commits and PRs
- ✅ Structured 5-step workflow
- ✅ Production-ready output

## Contributing

Issues and PRs welcome! Please check the [issues page](https://github.com/yourusername/claudiomiro/issues).

## License

ISC
