/**
 * Mock Filesystem Utilities
 * In-memory filesystem mock for testing
 */

class MockFileSystem {
  constructor() {
    this.files = new Map();
    this.directories = new Set();
  }

  reset() {
    this.files.clear();
    this.directories.clear();
  }

  async readFile(filePath, encoding = 'utf8') {
    if (!this.files.has(filePath)) {
      const error = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
      error.code = 'ENOENT';
      throw error;
    }
    return this.files.get(filePath);
  }

  async writeFile(filePath, content) {
    this.files.set(filePath, content);
    // Automatically create parent directory
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (dir) {
      this.directories.add(dir);
    }
  }

  async exists(filePath) {
    return this.files.has(filePath) || this.directories.has(filePath);
  }

  async mkdir(dirPath, options = {}) {
    this.directories.add(dirPath);

    // Handle recursive option
    if (options.recursive) {
      const parts = dirPath.split('/').filter(Boolean);
      let currentPath = '';
      for (const part of parts) {
        currentPath += '/' + part;
        this.directories.add(currentPath);
      }
    }
  }

  async rm(filePath, options = {}) {
    if (options.recursive && this.directories.has(filePath)) {
      // Remove all files and subdirectories
      const pathPrefix = filePath + '/';
      for (const file of this.files.keys()) {
        if (file.startsWith(pathPrefix)) {
          this.files.delete(file);
        }
      }
      for (const dir of this.directories) {
        if (dir.startsWith(pathPrefix) || dir === filePath) {
          this.directories.delete(dir);
        }
      }
      this.directories.delete(filePath);
    } else if (this.files.has(filePath)) {
      this.files.delete(filePath);
    } else if (this.directories.has(filePath)) {
      this.directories.delete(filePath);
    }
  }

  async readdir(dirPath) {
    const entries = [];
    const pathPrefix = dirPath + '/';

    // Find all immediate children
    for (const file of this.files.keys()) {
      if (file.startsWith(pathPrefix)) {
        const relativePath = file.substring(pathPrefix.length);
        const firstSegment = relativePath.split('/')[0];
        if (!entries.includes(firstSegment)) {
          entries.push(firstSegment);
        }
      }
    }

    for (const dir of this.directories) {
      if (dir.startsWith(pathPrefix)) {
        const relativePath = dir.substring(pathPrefix.length);
        const firstSegment = relativePath.split('/')[0];
        if (firstSegment && !entries.includes(firstSegment)) {
          entries.push(firstSegment);
        }
      }
    }

    return entries;
  }

  async stat(filePath) {
    if (this.files.has(filePath)) {
      return {
        isFile: () => true,
        isDirectory: () => false,
        size: this.files.get(filePath).length,
      };
    } else if (this.directories.has(filePath)) {
      return {
        isFile: () => false,
        isDirectory: () => true,
        size: 0,
      };
    } else {
      const error = new Error(`ENOENT: no such file or directory, stat '${filePath}'`);
      error.code = 'ENOENT';
      throw error;
    }
  }

  // Synchronous versions
  readFileSync(filePath, encoding = 'utf8') {
    if (!this.files.has(filePath)) {
      const error = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
      error.code = 'ENOENT';
      throw error;
    }
    return this.files.get(filePath);
  }

  writeFileSync(filePath, content) {
    this.files.set(filePath, content);
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (dir) {
      this.directories.add(dir);
    }
  }

  existsSync(filePath) {
    return this.files.has(filePath) || this.directories.has(filePath);
  }

  mkdirSync(dirPath, options = {}) {
    this.directories.add(dirPath);

    if (options.recursive) {
      const parts = dirPath.split('/').filter(Boolean);
      let currentPath = '';
      for (const part of parts) {
        currentPath += '/' + part;
        this.directories.add(currentPath);
      }
    }
  }

  rmSync(filePath, options = {}) {
    if (options.recursive && this.directories.has(filePath)) {
      const pathPrefix = filePath + '/';
      for (const file of this.files.keys()) {
        if (file.startsWith(pathPrefix)) {
          this.files.delete(file);
        }
      }
      for (const dir of this.directories) {
        if (dir.startsWith(pathPrefix) || dir === filePath) {
          this.directories.delete(dir);
        }
      }
      this.directories.delete(filePath);
    } else if (this.files.has(filePath)) {
      this.files.delete(filePath);
    } else if (this.directories.has(filePath)) {
      this.directories.delete(filePath);
    }
  }
}

// Create a singleton instance
const mockFs = new MockFileSystem();

module.exports = mockFs;
