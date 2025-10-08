/**
 * Tests for the filesystem mock utilities
 */

const mockFs = require('../__mocks__/fs-utils');

describe('Mock Filesystem', () => {
  beforeEach(() => {
    mockFs.reset();
  });

  describe('File operations', () => {
    describe('writeFile and readFile', () => {
      test('should write and read a file', async () => {
        await mockFs.writeFile('/test/file.txt', 'Hello World');
        const content = await mockFs.readFile('/test/file.txt');
        expect(content).toBe('Hello World');
      });

      test('should throw error when reading non-existent file', async () => {
        await expect(mockFs.readFile('/nonexistent.txt')).rejects.toThrow('ENOENT');
      });

      test('should overwrite existing file', async () => {
        await mockFs.writeFile('/test.txt', 'First');
        await mockFs.writeFile('/test.txt', 'Second');
        const content = await mockFs.readFile('/test.txt');
        expect(content).toBe('Second');
      });
    });

    describe('writeFileSync and readFileSync', () => {
      test('should write and read a file synchronously', () => {
        mockFs.writeFileSync('/test/file.txt', 'Hello Sync');
        const content = mockFs.readFileSync('/test/file.txt');
        expect(content).toBe('Hello Sync');
      });

      test('should throw error when reading non-existent file synchronously', () => {
        expect(() => mockFs.readFileSync('/nonexistent.txt')).toThrow('ENOENT');
      });
    });

    describe('exists and existsSync', () => {
      test('should return true for existing file', async () => {
        await mockFs.writeFile('/test.txt', 'content');
        const exists = await mockFs.exists('/test.txt');
        expect(exists).toBe(true);
      });

      test('should return false for non-existent file', async () => {
        const exists = await mockFs.exists('/nonexistent.txt');
        expect(exists).toBe(false);
      });

      test('should work synchronously', () => {
        mockFs.writeFileSync('/test.txt', 'content');
        expect(mockFs.existsSync('/test.txt')).toBe(true);
        expect(mockFs.existsSync('/nonexistent.txt')).toBe(false);
      });
    });

    describe('rm and rmSync', () => {
      test('should remove a file', async () => {
        await mockFs.writeFile('/test.txt', 'content');
        await mockFs.rm('/test.txt');
        const exists = await mockFs.exists('/test.txt');
        expect(exists).toBe(false);
      });

      test('should remove a file synchronously', () => {
        mockFs.writeFileSync('/test.txt', 'content');
        mockFs.rmSync('/test.txt');
        expect(mockFs.existsSync('/test.txt')).toBe(false);
      });

      test('should not throw when removing non-existent file', async () => {
        await expect(mockFs.rm('/nonexistent.txt')).resolves.not.toThrow();
      });
    });

    describe('stat', () => {
      test('should return file stats', async () => {
        await mockFs.writeFile('/test.txt', 'Hello');
        const stats = await mockFs.stat('/test.txt');
        expect(stats.isFile()).toBe(true);
        expect(stats.isDirectory()).toBe(false);
        expect(stats.size).toBe(5);
      });

      test('should throw error for non-existent file', async () => {
        await expect(mockFs.stat('/nonexistent.txt')).rejects.toThrow('ENOENT');
      });
    });
  });

  describe('Directory operations', () => {
    describe('mkdir and mkdirSync', () => {
      test('should create a directory', async () => {
        await mockFs.mkdir('/test/dir');
        const exists = await mockFs.exists('/test/dir');
        expect(exists).toBe(true);
      });

      test('should create directory with recursive option', async () => {
        await mockFs.mkdir('/a/b/c/d', { recursive: true });
        expect(await mockFs.exists('/a')).toBe(true);
        expect(await mockFs.exists('/a/b')).toBe(true);
        expect(await mockFs.exists('/a/b/c')).toBe(true);
        expect(await mockFs.exists('/a/b/c/d')).toBe(true);
      });

      test('should create directory synchronously', () => {
        mockFs.mkdirSync('/test/dir');
        expect(mockFs.existsSync('/test/dir')).toBe(true);
      });

      test('should create directory synchronously with recursive option', () => {
        mockFs.mkdirSync('/x/y/z', { recursive: true });
        expect(mockFs.existsSync('/x')).toBe(true);
        expect(mockFs.existsSync('/x/y')).toBe(true);
        expect(mockFs.existsSync('/x/y/z')).toBe(true);
      });
    });

    describe('readdir', () => {
      test('should list directory contents', async () => {
        await mockFs.writeFile('/dir/file1.txt', 'content1');
        await mockFs.writeFile('/dir/file2.txt', 'content2');
        await mockFs.mkdir('/dir/subdir');

        const entries = await mockFs.readdir('/dir');
        expect(entries).toContain('file1.txt');
        expect(entries).toContain('file2.txt');
        expect(entries).toContain('subdir');
      });

      test('should return empty array for empty directory', async () => {
        await mockFs.mkdir('/empty');
        const entries = await mockFs.readdir('/empty');
        expect(entries).toEqual([]);
      });

      test('should only list immediate children', async () => {
        await mockFs.writeFile('/dir/file.txt', 'content');
        await mockFs.writeFile('/dir/subdir/nested.txt', 'nested');

        const entries = await mockFs.readdir('/dir');
        expect(entries).toContain('file.txt');
        expect(entries).toContain('subdir');
        expect(entries).not.toContain('nested.txt');
      });
    });

    describe('rm with recursive', () => {
      test('should remove directory recursively', async () => {
        await mockFs.writeFile('/dir/file1.txt', 'content');
        await mockFs.writeFile('/dir/subdir/file2.txt', 'content');
        await mockFs.mkdir('/dir/subdir');

        await mockFs.rm('/dir', { recursive: true });

        expect(await mockFs.exists('/dir')).toBe(false);
        expect(await mockFs.exists('/dir/file1.txt')).toBe(false);
        expect(await mockFs.exists('/dir/subdir')).toBe(false);
        expect(await mockFs.exists('/dir/subdir/file2.txt')).toBe(false);
      });

      test('should remove directory recursively synchronously', () => {
        mockFs.writeFileSync('/dir/file1.txt', 'content');
        mockFs.writeFileSync('/dir/subdir/file2.txt', 'content');
        mockFs.mkdirSync('/dir/subdir');

        mockFs.rmSync('/dir', { recursive: true });

        expect(mockFs.existsSync('/dir')).toBe(false);
        expect(mockFs.existsSync('/dir/file1.txt')).toBe(false);
        expect(mockFs.existsSync('/dir/subdir')).toBe(false);
      });
    });

    describe('stat for directory', () => {
      test('should return directory stats', async () => {
        await mockFs.mkdir('/testdir');
        const stats = await mockFs.stat('/testdir');
        expect(stats.isFile()).toBe(false);
        expect(stats.isDirectory()).toBe(true);
      });
    });
  });

  describe('reset', () => {
    test('should clear all files and directories', async () => {
      await mockFs.writeFile('/file1.txt', 'content1');
      await mockFs.writeFile('/file2.txt', 'content2');
      await mockFs.mkdir('/dir1');

      mockFs.reset();

      expect(await mockFs.exists('/file1.txt')).toBe(false);
      expect(await mockFs.exists('/file2.txt')).toBe(false);
      expect(await mockFs.exists('/dir1')).toBe(false);
    });
  });

  describe('Auto-create parent directories', () => {
    test('should auto-create parent directory when writing file', async () => {
      await mockFs.writeFile('/auto/created/file.txt', 'content');
      expect(await mockFs.exists('/auto/created')).toBe(true);
      expect(await mockFs.exists('/auto/created/file.txt')).toBe(true);
    });

    test('should auto-create parent directory when writing file sync', () => {
      mockFs.writeFileSync('/auto/sync/file.txt', 'content');
      expect(mockFs.existsSync('/auto/sync')).toBe(true);
      expect(mockFs.existsSync('/auto/sync/file.txt')).toBe(true);
    });
  });
});
