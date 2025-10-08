const path = require('path');
const state = require('../../config/state');

describe('State', () => {
    // Store original values to restore after tests
    let originalFolder;
    let originalClaudiomiroFolder;

    beforeEach(() => {
        // Save current state
        originalFolder = state.folder;
        originalClaudiomiroFolder = state.claudiomiroFolder;
    });

    afterEach(() => {
        // Reset state to original values
        if (originalFolder) {
            state.setFolder(originalFolder);
        }
    });

    describe('Constructor and initialization', () => {
        test('should be a singleton instance', () => {
            const state2 = require('../../config/state');
            expect(state).toBe(state2);
        });

        test('should have folder property', () => {
            expect(state).toHaveProperty('folder');
        });

        test('should have claudiomiroFolder property', () => {
            expect(state).toHaveProperty('claudiomiroFolder');
        });
    });

    describe('setFolder() method', () => {
        test('should resolve absolute paths correctly', () => {
            const absolutePath = '/absolute/test/path';
            state.setFolder(absolutePath);
            expect(state.folder).toBe(path.resolve(absolutePath));
        });

        test('should resolve relative paths to absolute paths', () => {
            const relativePath = './relative/path';
            state.setFolder(relativePath);
            expect(state.folder).toBe(path.resolve(relativePath));
        });

        test('should construct claudiomiro folder path correctly', () => {
            const testPath = '/test/project';
            state.setFolder(testPath);
            expect(state.claudiomiroFolder).toBe(path.join(path.resolve(testPath), '.claudiomiro'));
        });

        test('should use path.resolve for folder path', () => {
            const testPath = '/test/path/../final';
            state.setFolder(testPath);
            expect(state.folder).toBe(path.resolve(testPath));
        });

        test('should use path.join for claudiomiro folder', () => {
            const testPath = '/test/project';
            state.setFolder(testPath);
            expect(state.claudiomiroFolder).toBe(path.join(path.resolve(testPath), '.claudiomiro'));
        });
    });

    describe('folder getter', () => {
        test('should return folder path after setFolder is called', () => {
            const testPath = '/test/folder';
            state.setFolder(testPath);
            expect(state.folder).toBe(path.resolve(testPath));
        });

        test('should maintain folder value consistency', () => {
            const testPath = '/test/immutable';
            state.setFolder(testPath);
            const retrievedFolder = state.folder;
            expect(retrievedFolder).toBe(path.resolve(testPath));
            // Verify getter returns the same value on subsequent calls
            expect(state.folder).toBe(retrievedFolder);
        });

        test('should return current folder value', () => {
            const testPath = '/current/folder';
            state.setFolder(testPath);
            expect(state.folder).toBeTruthy();
            expect(typeof state.folder).toBe('string');
        });
    });

    describe('claudiomiroFolder getter', () => {
        test('should return claudiomiroFolder path after setFolder is called', () => {
            const testPath = '/test/project';
            state.setFolder(testPath);
            expect(state.claudiomiroFolder).toBe(path.join(path.resolve(testPath), '.claudiomiro'));
        });

        test('should correctly join folder path with .claudiomiro', () => {
            const testPath = '/my/project';
            state.setFolder(testPath);
            const expected = path.join(path.resolve(testPath), '.claudiomiro');
            expect(state.claudiomiroFolder).toBe(expected);
        });

        test('should update when folder changes', () => {
            const firstPath = '/first/project';
            state.setFolder(firstPath);
            const firstClaudiomiroFolder = state.claudiomiroFolder;

            const secondPath = '/second/project';
            state.setFolder(secondPath);
            expect(state.claudiomiroFolder).not.toBe(firstClaudiomiroFolder);
            expect(state.claudiomiroFolder).toBe(path.join(path.resolve(secondPath), '.claudiomiro'));
        });
    });

    describe('Edge cases and error scenarios', () => {
        test('should handle relative paths correctly', () => {
            const relativePath = './test/relative';
            state.setFolder(relativePath);
            expect(state.folder).toBe(path.resolve(relativePath));
            expect(state.claudiomiroFolder).toBe(path.join(path.resolve(relativePath), '.claudiomiro'));
        });

        test('should handle paths with special characters', () => {
            const specialPath = '/test/path-with_special.chars/folder';
            state.setFolder(specialPath);
            expect(state.folder).toBe(path.resolve(specialPath));
            expect(state.claudiomiroFolder).toBe(path.join(path.resolve(specialPath), '.claudiomiro'));
        });

        test('should handle multiple setFolder calls', () => {
            const firstPath = '/first/path';
            const secondPath = '/second/path';

            state.setFolder(firstPath);
            expect(state.folder).toBe(path.resolve(firstPath));

            state.setFolder(secondPath);
            expect(state.folder).toBe(path.resolve(secondPath));
            expect(state.claudiomiroFolder).toBe(path.join(path.resolve(secondPath), '.claudiomiro'));
        });

        test('should handle cross-platform path separators', () => {
            // Test with both forward and backward slashes (path.resolve normalizes these)
            const mixedPath = process.platform === 'win32' ? 'C:\\test\\path' : '/test/path';
            state.setFolder(mixedPath);
            expect(state.folder).toBe(path.resolve(mixedPath));
            expect(state.claudiomiroFolder).toBe(path.join(path.resolve(mixedPath), '.claudiomiro'));
        });

        test('should handle paths with dot segments', () => {
            const dotPath = '/test/./path/../final';
            state.setFolder(dotPath);
            expect(state.folder).toBe(path.resolve(dotPath));
            expect(state.claudiomiroFolder).toBe(path.join(path.resolve(dotPath), '.claudiomiro'));
        });

        test('should handle empty string path', () => {
            const emptyPath = '';
            state.setFolder(emptyPath);
            expect(state.folder).toBe(path.resolve(emptyPath));
            expect(state.claudiomiroFolder).toBe(path.join(path.resolve(emptyPath), '.claudiomiro'));
        });
    });
});
