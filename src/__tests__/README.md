# Test Utilities and Mocks

This directory contains test utilities and mock modules for Claudiomiro testing.

## Structure

```
src/__tests__/
├── __mocks__/           # Jest mock modules
│   ├── logger.js        # Mock logger module
│   ├── state.js         # Mock state module
│   └── fs-utils.js      # Mock filesystem utilities
├── mocks/               # Mock module tests
│   ├── logger.test.js   # Tests for logger mock
│   ├── state.test.js    # Tests for state mock
│   └── fs.test.js       # Tests for fs mock
├── test-utils.js        # Core test utilities
├── test-utils.test.js   # Tests for test utilities
└── README.md            # This file
```

## Test Utilities

### `test-utils.js`

Core testing utilities for common test setup and teardown.

#### `setupTestEnvironment()`

Sets up a clean test environment by mocking console methods.

```javascript
const { setupTestEnvironment, cleanupTestEnvironment } = require('./test-utils');

describe('My Test Suite', () => {
  let mocks;

  beforeEach(() => {
    mocks = setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment(mocks);
  });

  test('my test', () => {
    console.log('This will be mocked');
    expect(mocks.consoleLog).toHaveBeenCalled();
  });
});
```

#### `cleanupTestEnvironment(mocks)`

Restores all mocked functions and clears mock state.

```javascript
afterEach(() => {
  cleanupTestEnvironment(mocks);
});
```

#### `mockConsole()`

Mocks all console methods (log, error, warn, info).

```javascript
const { mockConsole, restoreConsole } = require('./test-utils');

test('console mocking', () => {
  const consoleMocks = mockConsole();

  console.log('test');
  expect(consoleMocks.log).toHaveBeenCalledWith('test');

  restoreConsole(consoleMocks);
});
```

#### `restoreConsole(consoleMocks)`

Restores mocked console methods.

```javascript
restoreConsole(consoleMocks);
```

#### `createMockLogger()`

Creates a fully mocked logger instance with all logger methods.

```javascript
const { createMockLogger } = require('./test-utils');

test('logger mocking', () => {
  const mockLogger = createMockLogger();

  mockLogger.info('test message');
  mockLogger.success('success');

  expect(mockLogger.info).toHaveBeenCalledWith('test message');
  expect(mockLogger.success).toHaveBeenCalledWith('success');
});
```

#### `assertThrows(fn, expectedError)`

Asserts that a function throws an error.

```javascript
const { assertThrows } = require('./test-utils');

test('error throwing', () => {
  const throwingFn = () => { throw new Error('Test error'); };
  assertThrows(throwingFn, 'Test error');
});
```

#### `assertDoesNotThrow(fn)`

Asserts that a function does not throw an error.

```javascript
const { assertDoesNotThrow } = require('./test-utils');

test('no error', () => {
  const safeFn = () => { return 'success'; };
  assertDoesNotThrow(safeFn);
});
```

## Mock Modules

### Logger Mock (`__mocks__/logger.js`)

A complete mock of the logger module for testing components that use logging.

**Usage:**

```javascript
// Automatically use the mock
jest.mock('../../../logger');
const logger = require('../../../logger');

test('logger usage', () => {
  logger.info('test message');
  expect(logger.info).toHaveBeenCalledWith('test message');
});
```

**Available Methods:**
- `info(message)` - Log info message
- `success(message)` - Log success message
- `error(message)` - Log error message
- `warning(message)` - Log warning message
- `step(task, tasks, number, message)` - Log step
- `task(message)` - Log task
- `subtask(message)` - Log subtask
- `path(message)` - Log path
- `command(cmd)` - Log command
- `indent()` - Increase indentation
- `outdent()` - Decrease indentation
- `resetIndent()` - Reset indentation
- `getIndent()` - Get current indentation
- `startSpinner(text)` - Start spinner
- `updateSpinner(text)` - Update spinner text
- `succeedSpinner(text)` - Stop spinner with success
- `failSpinner(text)` - Stop spinner with failure
- `stopSpinner()` - Stop spinner
- `progress(current, total, message)` - Show progress
- `separator()` - Print separator
- `newline()` - Print newline
- `banner()` - Print banner
- `box(message, options)` - Print box
- `clear()` - Clear console

### State Mock (`__mocks__/state.js`)

A mock of the state configuration module.

**Usage:**

```javascript
const mockState = require('../__mocks__/state');

test('state usage', () => {
  mockState.setFolder('/test/project');
  expect(mockState.folder).toBe('/test/project');
  expect(mockState.claudiomiroFolder).toBe('/test/project/.claudiomiro');
});
```

**Available Methods:**
- `setFolder(folderPath)` - Set project folder
- `folder` - Get project folder
- `claudiomiroFolder` - Get .claudiomiro folder
- `reset()` - Reset state

### Filesystem Mock (`__mocks__/fs-utils.js`)

In-memory filesystem mock for testing file operations without touching the real filesystem.

**Usage:**

```javascript
const mockFs = require('../__mocks__/fs-utils');

test('filesystem operations', async () => {
  // Write a file
  await mockFs.writeFile('/test/file.txt', 'Hello World');

  // Read the file
  const content = await mockFs.readFile('/test/file.txt');
  expect(content).toBe('Hello World');

  // Check if file exists
  const exists = await mockFs.exists('/test/file.txt');
  expect(exists).toBe(true);

  // Clean up
  mockFs.reset();
});
```

**Available Methods:**

**Async methods:**
- `readFile(filePath, encoding)` - Read file content
- `writeFile(filePath, content)` - Write file content
- `exists(filePath)` - Check if file/directory exists
- `mkdir(dirPath, options)` - Create directory
- `rm(filePath, options)` - Remove file/directory
- `readdir(dirPath)` - List directory contents
- `stat(filePath)` - Get file/directory stats

**Sync methods:**
- `readFileSync(filePath, encoding)` - Read file synchronously
- `writeFileSync(filePath, content)` - Write file synchronously
- `existsSync(filePath)` - Check existence synchronously
- `mkdirSync(dirPath, options)` - Create directory synchronously
- `rmSync(filePath, options)` - Remove file/directory synchronously

**Utility methods:**
- `reset()` - Clear all files and directories

**Features:**
- In-memory storage (no real filesystem access)
- Automatic parent directory creation
- Recursive directory operations
- Error handling matching Node.js fs module
- Both async and sync API support

## Running Tests

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

Run tests in watch mode:
```bash
npm test -- --watch
```

Run specific test file:
```bash
npm test -- test-utils.test.js
```

## Best Practices

1. **Always clean up after tests**: Use `cleanupTestEnvironment()` or `reset()` in `afterEach` hooks
2. **Use mock modules for external dependencies**: This makes tests faster and more reliable
3. **Test in isolation**: Each test should be independent and not rely on other tests
4. **Use descriptive test names**: Test names should clearly describe what is being tested
5. **Group related tests**: Use `describe` blocks to organize related tests

## Example Integration Test

```javascript
const { setupTestEnvironment, cleanupTestEnvironment } = require('./test-utils');
const mockState = require('./__mocks__/state');
const mockFs = require('./__mocks__/fs-utils');

describe('Integration Example', () => {
  let envMocks;

  beforeEach(() => {
    envMocks = setupTestEnvironment();
    mockState.reset();
    mockFs.reset();
  });

  afterEach(() => {
    cleanupTestEnvironment(envMocks);
  });

  test('should work with all utilities together', async () => {
    // Setup state
    mockState.setFolder('/project');

    // Create files
    await mockFs.writeFile('/project/.claudiomiro/config.json', '{}');

    // Verify
    expect(mockState.claudiomiroFolder).toBe('/project/.claudiomiro');
    expect(await mockFs.exists('/project/.claudiomiro/config.json')).toBe(true);
  });
});
```
