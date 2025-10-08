/**
 * Tests for the state mock module
 */

const mockState = require('../__mocks__/state');
const path = require('path');

describe('State Mock', () => {
  beforeEach(() => {
    mockState.reset();
    jest.clearAllMocks();
  });

  describe('setFolder', () => {
    test('should set folder path', () => {
      mockState.setFolder('/test/project');
      expect(mockState.folder).toBe(path.resolve('/test/project'));
    });

    test('should set claudiomiroFolder path', () => {
      mockState.setFolder('/test/project');
      expect(mockState.claudiomiroFolder).toBe(path.resolve('/test/project/.claudiomiro'));
    });

    test('should resolve relative paths', () => {
      mockState.setFolder('./project');
      expect(mockState.folder).toBe(path.resolve('./project'));
      expect(mockState.claudiomiroFolder).toBe(path.resolve('./project/.claudiomiro'));
    });

    test('should be mockable', () => {
      mockState.setFolder('/test/path');
      expect(mockState.setFolder).toHaveBeenCalledWith('/test/path');
      expect(mockState.setFolder).toHaveBeenCalledTimes(1);
    });

    test('should update folder when called multiple times', () => {
      mockState.setFolder('/first/path');
      expect(mockState.folder).toBe(path.resolve('/first/path'));

      mockState.setFolder('/second/path');
      expect(mockState.folder).toBe(path.resolve('/second/path'));
      expect(mockState.claudiomiroFolder).toBe(path.resolve('/second/path/.claudiomiro'));
    });
  });

  describe('folder getter', () => {
    test('should return null initially', () => {
      expect(mockState.folder).toBeNull();
    });

    test('should return folder after setFolder', () => {
      mockState.setFolder('/my/project');
      expect(mockState.folder).toBe(path.resolve('/my/project'));
    });

    test('should return correct path with special characters', () => {
      mockState.setFolder('/path with spaces/project');
      expect(mockState.folder).toBe(path.resolve('/path with spaces/project'));
    });
  });

  describe('claudiomiroFolder getter', () => {
    test('should return null initially', () => {
      expect(mockState.claudiomiroFolder).toBeNull();
    });

    test('should return claudiomiro folder after setFolder', () => {
      mockState.setFolder('/my/project');
      expect(mockState.claudiomiroFolder).toBe(path.resolve('/my/project/.claudiomiro'));
    });

    test('should always append .claudiomiro to folder', () => {
      mockState.setFolder('/root/workspace/myapp');
      expect(mockState.claudiomiroFolder).toBe(path.resolve('/root/workspace/myapp/.claudiomiro'));
    });
  });

  describe('reset', () => {
    test('should reset folder to null', () => {
      mockState.setFolder('/test/project');
      mockState.reset();
      expect(mockState.folder).toBeNull();
    });

    test('should reset claudiomiroFolder to null', () => {
      mockState.setFolder('/test/project');
      mockState.reset();
      expect(mockState.claudiomiroFolder).toBeNull();
    });

    test('should allow setting folder after reset', () => {
      mockState.setFolder('/first');
      mockState.reset();
      mockState.setFolder('/second');
      expect(mockState.folder).toBe(path.resolve('/second'));
      expect(mockState.claudiomiroFolder).toBe(path.resolve('/second/.claudiomiro'));
    });
  });

  describe('State behavior matching', () => {
    test('should match original State interface', () => {
      expect(mockState).toHaveProperty('setFolder');
      expect(mockState).toHaveProperty('folder');
      expect(mockState).toHaveProperty('claudiomiroFolder');
      expect(typeof mockState.setFolder).toBe('function');
    });

    test('should maintain state between calls', () => {
      mockState.setFolder('/project/root');

      const folder1 = mockState.folder;
      const folder2 = mockState.folder;
      const claudiomiro1 = mockState.claudiomiroFolder;
      const claudiomiro2 = mockState.claudiomiroFolder;

      expect(folder1).toBe(folder2);
      expect(claudiomiro1).toBe(claudiomiro2);
    });
  });

  describe('Mock verification', () => {
    test('should track setFolder calls', () => {
      mockState.setFolder('/path1');
      mockState.setFolder('/path2');
      mockState.setFolder('/path3');

      expect(mockState.setFolder).toHaveBeenCalledTimes(3);
      expect(mockState.setFolder).toHaveBeenNthCalledWith(1, '/path1');
      expect(mockState.setFolder).toHaveBeenNthCalledWith(2, '/path2');
      expect(mockState.setFolder).toHaveBeenNthCalledWith(3, '/path3');
    });

    test('should clear mock calls after reset', () => {
      mockState.setFolder('/test');
      jest.clearAllMocks();
      expect(mockState.setFolder).toHaveBeenCalledTimes(0);
    });
  });
});
