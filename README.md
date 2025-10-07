# Claudiomiro

![Claudiomiro](http://www.samuelfaj.com/files/posts/claudiomiro.png)

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
Cycle 1: [Step 0] Decomposing complex task into 3 sub-tasks
Cycle 2: [Step 1] Creating PROMPT.md for TASK1
Cycle 3: [Step 2] Researching codebase and patterns for TASK1
Cycle 4: [Step 3] Implementing TASK1 (TODO shows "Fully implemented: NO")
Cycle 5: [Step 3] Continue implementing TASK1 (still "NO")
Cycle 6: [Step 3] Final implementation (changes to "Fully implemented: YES")
Cycle 7: [Step 3.1] Code review... ✅ All checks passed!
Cycle 8: [Step 4] Running tests... ❌ 2 tests failed
Cycle 9: [Step 3] Fixing failing tests
Cycle 10: [Step 4] Running tests... ✅ All tests passed!
Cycle 11: [Step 1-4] Processing TASK2 and TASK3...
Cycle 12: [Step 5] Creating commit and pushing

✓ Task completed in 12 autonomous cycles
```

No manual intervention. No "continue" prompts. Just complete, production-ready code.

## What's New in v1.1 🎉

### Task Decomposition (New Step 0)
Claudiomiro now intelligently breaks down complex requests into granular, independent sub-tasks:
- **JIRA-style task breakdown** - Each sub-task is self-contained with clear objectives
- **Parallel execution** - Multiple related tasks organized in `.claudiomiro/TASK1/`, `.claudiomiro/TASK2/`, etc.
- **Independent context** - Each task file includes everything needed for autonomous execution
- **Clear acceptance criteria** - Binary pass/fail verification for each sub-task

### Automated Code Review (New Step 3.1)
After implementation, a senior-level code review automatically validates:
- ✅ **Requirement alignment** - Verifies all acceptance criteria are met
- ✅ **Code quality & correctness** - Checks for bugs, edge cases, and error handling
- ✅ **Architecture compliance** - Ensures adherence to system patterns and SOLID principles
- ✅ **Performance & maintainability** - Identifies complexity and optimization opportunities
- **Quality gate** - Can send implementation back for fixes if issues are found

### Refactored Architecture
Complete codebase reorganization for better maintainability:
- **Modular design** - Clean separation of concerns with services, steps, and utilities
- **Improved logging** - Smart output formatting with tool icons (🔧 Bash, 📖 Read, ✍️ Write)
- **Better state management** - Centralized configuration and folder management
- **Professional output** - Cleaner real-time display with overwriting blocks

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

## The 6-Step Autonomous Workflow

- **Step 0: Task Decomposition** - Breaks complex requests into granular, self-contained sub-tasks
- **Step 1: Initialization** - Analyzes each task, creates git branch, enhances prompts
- **Step 2: Research** - Deeply researches codebase and relevant documentation
- **Step 3: Implementation** - *Runs multiple times autonomously* until fully complete
- **Step 3.1: Code Review** - Senior-level automated review with requirement validation
- **Step 4: Testing & PR** - Runs all tests, fixes failures, creates PR and commits
- **Step 5: Commit & Push** - Pushes changes to repository

### Safety Mechanisms

- **Maximum 15 cycles** - Prevents runaway execution
- **Progress validation** - Ensures forward progress each cycle
- **Error detection** - Stops if same error repeats
- **Manual override** - Use `--push=false` to review before final commit

## Key Features

- 🔄 **Truly Autonomous**: Loops until task is 100% complete
- 🧩 **Intelligent Decomposition**: Breaks complex tasks into granular, independent sub-tasks
- 🧠 **Deep Analysis**: Understands your codebase patterns and architecture
- 👨‍💻 **Automated Code Review**: Senior-level review validates quality before testing
- 🧪 **Quality Enforced**: Never skips tests, always validates
- 📊 **Full Transparency**: Live logs show every decision and action
- 🎯 **Production Ready**: Code is tested, reviewed, documented, and ready to merge
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

Claudiomiro creates a `.claudiomiro/` folder to organize tasks and track progress:

```
.claudiomiro/
├── TASK1/
│   ├── TASK.md              # Self-contained task description with acceptance criteria
│   ├── PROMPT.md            # Enhanced task description with analysis
│   ├── TODO.md              # Detailed breakdown (`Fully implemented: YES/NO`)
│   ├── CODE_REVIEW.md       # Automated code review report
│   └── GITHUB_PR.md         # Generated pull request description
├── TASK2/
│   └── ...
└── log.txt                  # Complete execution log with timestamps
```

**Tip:** Each `TASK.md` is fully self-contained for independent execution. Review early to validate the plan. Use `--fresh` to start over.

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
- ❌ Handle one monolithic task
- ❌ No code quality validation
- ❌ You manually run tests
- ❌ You manually fix failures
- ❌ You create commits/PRs
- ❌ No structured approach

**Claudiomiro:**
- ✅ Runs autonomously until complete (up to 15 cycles)
- ✅ Decomposes complex tasks intelligently
- ✅ Built-in senior-level code review
- ✅ Automatically runs tests
- ✅ Automatically fixes test failures
- ✅ Creates commits and PRs
- ✅ Structured 6-step workflow with quality gates
- ✅ Production-ready output

## Technical Architecture (v1.1)

The codebase has been completely refactored for maintainability and extensibility:

### Modular Structure
```
index.js                    # Entry point (now just 7 lines!)
logger.js                   # Beautiful CLI output
src/
├── cli.js                 # Main CLI loop and orchestration
├── config/
│   └── state.js           # Centralized state management
├── services/
│   ├── claude-executor.js # Claude API execution
│   ├── claude-logger.js   # Smart output formatting with tool icons
│   ├── file-manager.js    # File operations and cleanup
│   └── prompt-reader.js   # User input handling
├── steps/
│   ├── step0.js           # Task decomposition
│   ├── step1.js           # Initialization
│   ├── step2.js           # Research & planning
│   ├── step3.js           # Implementation
│   ├── code-review.js     # Automated code review
│   ├── step4.js           # Testing & PR creation
│   ├── step5.js           # Commit & push
│   └── index.js           # Step exports
└── utils/
    └── validation.js      # Validation utilities
```

### Key Improvements
- **500+ lines eliminated** from the main file
- **Clean separation of concerns** - Each module has a single responsibility
- **Improved testability** - Modular design enables unit testing
- **Better error handling** - Centralized logging and error management
- **Enhanced user experience** - Smart output formatting with real-time updates
- **Extensibility** - Easy to add new steps or modify existing ones

## Contributing

Issues and PRs welcome! Please check the [issues page](https://github.com/yourusername/claudiomiro/issues).

## License

ISC
