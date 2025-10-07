# Claudiomiro

![Claudiomiro](http://www.samuelfaj.com/files/posts/claudiomiro.png)

**Send your prompt — get a fully planned, executed, reviewed, and committed task.**

Turn days of complex development into a fully automated process — without sacrificing production-grade code quality.

## The Problem with Claude Code

When using Claude Code for complex tasks, you've probably noticed it **stops before completing the job**. The result? You find yourself typing "continue", testing, reviewing, over and over again, managing all the workflow manually.

## What is Claudiomiro?

**Claudiomiro** is a Node.js CLI that wraps Claude AI in a structured, **autonomous workflow**. Unlike simple code generators, Claudiomiro:

- ✅ Thinks through complex problems
- ✅ Analyzes your entire codebase
- ✅ Identifies patterns and best practices
- ✅ Implements comprehensive solutions
- ✅ **Runs autonomously until completion** (up to 100 cycles)

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

### Safety Mechanisms

- **Maximum 100 cycles** - Prevents runaway execution (change with `--maxCycles`)
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

## Contributing

Issues and PRs welcome! Please check the [issues page](https://github.com/yourusername/claudiomiro/issues).

## License

ISC
