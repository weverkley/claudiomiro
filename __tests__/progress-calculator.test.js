const { calculateProgress } = require('../src/utils/progress-calculator');

const makeState = (status, step = null, message = null) => ({ status, step, message });

describe('calculateProgress', () => {
  describe('Edge Cases', () => {
    test('returns 0 for zero tasks (empty object)', () => {
      expect(calculateProgress({})).toBe(0);
    });

    test('returns 0 for null input', () => {
      expect(calculateProgress(null)).toBe(0);
    });

    test('returns 0 for undefined input', () => {
      expect(calculateProgress(undefined)).toBe(0);
    });

    test('returns 0 for non-object input', () => {
      expect(calculateProgress('invalid')).toBe(0);
      expect(calculateProgress(123)).toBe(0);
      expect(calculateProgress([])).toBe(0);
    });
  });

  describe('Step-based progress', () => {
    test('returns 0% when no steps completed', () => {
      const taskStates = {
        task1: makeState('pending'),
        task2: makeState('running', 'Step 2 - Research and planning')
      };

      expect(calculateProgress(taskStates)).toBe(0);
    });

    test('counts steps completed for running tasks', () => {
      const taskStates = {
        task1: makeState('running', 'Step 3 - Implementing tasks'),
        task2: makeState('running', 'Step 3.1 - Code review')
      };

      // (1 + 2) completed steps out of (2 tasks × 4 steps) = 37.5% → 38%
      expect(calculateProgress(taskStates)).toBe(38);
    });

    test('counts completed tasks as all steps finished', () => {
      const taskStates = {
        task1: makeState('completed'),
        task2: makeState('running', 'Step 4 - Running tests and creating PR'),
        task3: makeState('pending')
      };

      // (4 + 3 + 0) / 12 = 58.33% → 58%
      expect(calculateProgress(taskStates)).toBe(58);
    });

    test('counts failed tasks based on the last recorded step', () => {
      const taskStates = {
        task1: makeState('failed', 'Step 4 - Running tests and creating PR'),
        task2: makeState('completed'),
        task3: makeState('pending')
      };

      // (3 + 4 + 0) / 12 = 58.33% → 58%
      expect(calculateProgress(taskStates)).toBe(58);
    });

    test('returns 100% when every task is completed', () => {
      const taskStates = {
        task1: makeState('completed'),
        task2: makeState('completed'),
        task3: makeState('completed')
      };

      expect(calculateProgress(taskStates)).toBe(100);
    });

    test('ignores steps that are not recognised', () => {
      const taskStates = {
        task1: makeState('running', 'Custom phase'),
        task2: makeState('pending')
      };

      expect(calculateProgress(taskStates)).toBe(0);
    });
  });

  describe('Rounding behavior', () => {
    test('rounds down when fractional part is under .5', () => {
      const taskStates = {
        task1: makeState('running', 'Step 3 - Implementing tasks'),
        task2: makeState('pending'),
        task3: makeState('pending')
      };

      // 1 / 12 = 8.33% → 8%
      expect(calculateProgress(taskStates)).toBe(8);
    });

    test('rounds up when fractional part is .5 or higher', () => {
      const taskStates = {
        task1: makeState('completed'),
        task2: makeState('running', 'Step 4 - Running tests and creating PR')
      };

      // (4 + 3) / 8 = 87.5% → 88%
      expect(calculateProgress(taskStates)).toBe(88);
    });
  });

  describe('Pure function behaviour', () => {
    test('does not modify input object', () => {
      const taskStates = {
        task1: makeState('completed'),
        task2: makeState('running', 'Step 3 - Implementing tasks')
      };
      const originalCopy = JSON.parse(JSON.stringify(taskStates));

      calculateProgress(taskStates);

      expect(taskStates).toEqual(originalCopy);
    });

    test('returns same result for repeated calls with same input', () => {
      const taskStates = {
        task1: makeState('completed'),
        task2: makeState('failed', 'Step 3.1 - Code review'),
        task3: makeState('running', 'Step 3 - Implementing tasks')
      };

      const result1 = calculateProgress(taskStates);
      const result2 = calculateProgress(taskStates);
      const result3 = calculateProgress(taskStates);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  describe('Single task scenarios', () => {
    test('returns 100% for a completed task', () => {
      const taskStates = { task1: makeState('completed') };
      expect(calculateProgress(taskStates)).toBe(100);
    });

    test('returns 75% for a task running Step 4', () => {
      const taskStates = {
        task1: makeState('running', 'Step 4 - Running tests and creating PR')
      };
      expect(calculateProgress(taskStates)).toBe(75);
    });

    test('returns 50% for a task at Step 3.1', () => {
      const taskStates = {
        task1: makeState('running', 'Step 3.1 - Code review')
      };
      expect(calculateProgress(taskStates)).toBe(50);
    });

    test('returns 0% for a task at Step 2', () => {
      const taskStates = {
        task1: makeState('running', 'Step 2 - Research and planning')
      };
      expect(calculateProgress(taskStates)).toBe(0);
    });

    test('returns 0% for a pending task', () => {
      const taskStates = { task1: makeState('pending') };
      expect(calculateProgress(taskStates)).toBe(0);
    });
  });
});
