# Claudiomiro

An AI-powered development agent that automates the complete software development workflow using Claude AI.

## What It Does

Claudiomiro is a CLI tool that wraps the Claude AI assistant to provide a structured, step-by-step development workflow. It automates everything from task planning to pull request creation, making it easier to implement features, fix bugs, and maintain code quality.

### Workflow

1. **Initialization**: Prompts for task description and creates a git branch (can be skipped with `--same-branch`)
2. **Planning**: Generates an improved prompt (PROMPT.md) and a detailed task breakdown (TODO.md)
3. **Research**: Performs extensive research using context7 for library documentation
4. **Implementation**: Executes all tasks from TODO.md while maintaining a live log (LOG.md)
5. **Testing**: Runs all tests and ensures they pass before proceeding
6. **PR Creation**: Generates a GitHub pull request description (GITHUB_PR.md)
7. **Commit & Push**: Commits the code and optionally pushes to the repository (can be skipped with `--push=false`)

### Key Features

- 🤖 **Automated Workflow**: Complete development cycle from prompt to PR
- 📝 **Structured Planning**: Generates detailed TODO lists for complex tasks
- 🧪 **Test-Driven**: Ensures all tests pass before creating PRs
- 📊 **Live Logging**: Maintains real-time logs of all actions taken (LOG.md) and complete execution logs (claudiomiro_log.txt)
- 🎨 **Beautiful CLI**: Rich terminal UI with colors, spinners, and progress indicators
- 🔄 **Iterative Process**: Automatically progresses through workflow stages

### Rules & Best Practices

- Tests must use mocked data (no real database connections)
- Database changes must be done via migrations
- Backend requires tests for every layer plus integration tests
- Frontend requires tests for every component with mocked API responses
- Only code-related tasks in TODO.md (no deployment steps)

## Installation

```bash
npm install -g claudiomiro
```

## Usage

```bash
# Run in current directory
claudiomiro

# Run in specific directory
claudiomiro /path/to/project

# Start fresh (removes PROMPT.md, TODO.md, LOG.md, GITHUB_PR.md, claudiomiro_log.txt)
claudiomiro --fresh

# Start fresh in specific directory
claudiomiro /path/to/project --fresh

# Pass prompt directly (automatically starts fresh)
claudiomiro --prompt="Add a login page with email and password"

# Pass prompt with path
claudiomiro /path/to/project --prompt="Implement user authentication"

# Skip git push at the end
claudiomiro --push=false

# Skip creating a new git branch (work on current branch)
claudiomiro --same-branch

# Combine options
claudiomiro /path/to/project --fresh --push=false --same-branch
claudiomiro --prompt="Fix the navigation bug" --push=false --same-branch
```

The tool will guide you through the process with interactive prompts (unless you use `--prompt` to provide the task description directly).

## Generated Files

During execution, Claudiomiro creates the following files in your project directory:

- **PROMPT.md**: Enhanced and improved version of the original task description
- **TODO.md**: Detailed breakdown of all tasks required to complete the feature
- **LOG.md**: Real-time log of actions taken by Claude during implementation
- **GITHUB_PR.md**: Generated pull request description based on all the work done
- **claudiomiro_log.txt**: Complete execution log of all Claude interactions with timestamps

Use `--fresh` flag to remove all these files and start from scratch.

## Requirements

- Node.js
- Claude CLI installed and configured
- Git repository

## Dependencies

- `chalk` - Terminal styling
- `ora` - Elegant terminal spinners
- `prompts` - Interactive CLI prompts
- `boxen` - Terminal boxes
- `gradient-string` - Gradient text styling
- `log-symbols` - Colored symbols for logging

## License

ISC
