const { calculateProgress } = require('../src/utils/progress-calculator');

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

  describe('Typical Cases', () => {
    test('returns 0% when no tasks completed', () => {
      const taskStates = {
        task1: { status: 'pending', step: '0/5', message: 'Waiting...' },
        task2: { status: 'running', step: '2/5', message: 'Processing...' },
        task3: { status: 'pending', step: '0/5', message: 'Waiting...' },
        task4: { status: 'running', step: '1/3', message: 'Running...' }
      };
      expect(calculateProgress(taskStates)).toBe(0);
    });

    test('returns 25% when 1 of 4 tasks completed', () => {
      const taskStates = {
        task1: { status: 'completed', step: '5/5', message: 'Done!' },
        task2: { status: 'running', step: '2/5', message: 'Processing...' },
        task3: { status: 'pending', step: '0/5', message: 'Waiting...' },
        task4: { status: 'pending', step: '0/3', message: 'Waiting...' }
      };
      expect(calculateProgress(taskStates)).toBe(25);
    });

    test('returns 50% when 2 of 4 tasks completed', () => {
      const taskStates = {
        task1: { status: 'completed', step: '5/5', message: 'Done!' },
        task2: { status: 'completed', step: '3/3', message: 'Done!' },
        task3: { status: 'running', step: '2/5', message: 'Processing...' },
        task4: { status: 'pending', step: '0/3', message: 'Waiting...' }
      };
      expect(calculateProgress(taskStates)).toBe(50);
    });

    test('returns 75% when 3 of 4 tasks completed', () => {
      const taskStates = {
        task1: { status: 'completed', step: '5/5', message: 'Done!' },
        task2: { status: 'completed', step: '3/3', message: 'Done!' },
        task3: { status: 'completed', step: '5/5', message: 'Done!' },
        task4: { status: 'running', step: '1/3', message: 'Running...' }
      };
      expect(calculateProgress(taskStates)).toBe(75);
    });

    test('returns 100% when all tasks completed', () => {
      const taskStates = {
        task1: { status: 'completed', step: '5/5', message: 'Done!' },
        task2: { status: 'completed', step: '3/3', message: 'Done!' },
        task3: { status: 'completed', step: '5/5', message: 'Done!' },
        task4: { status: 'completed', step: '3/3', message: 'Done!' }
      };
      expect(calculateProgress(taskStates)).toBe(100);
    });
  });

  describe('Mixed States with Failed Tasks', () => {
    test('counts failed tasks as done (completed)', () => {
      const taskStates = {
        task1: { status: 'completed', step: '5/5', message: 'Success!' },
        task2: { status: 'failed', step: 'error', message: 'Failed' },
        task3: { status: 'pending', step: '0/5', message: 'Waiting...' },
        task4: { status: 'running', step: '1/3', message: 'Running...' }
      };
      // 2 done (1 completed + 1 failed) out of 4 tasks = 50%
      expect(calculateProgress(taskStates)).toBe(50);
    });

    test('returns 100% when all tasks are completed or failed', () => {
      const taskStates = {
        task1: { status: 'completed', step: '5/5', message: 'Success!' },
        task2: { status: 'failed', step: 'error', message: 'Error occurred' },
        task3: { status: 'completed', step: '5/5', message: 'Done!' },
        task4: { status: 'failed', step: 'error', message: 'Failed' }
      };
      expect(calculateProgress(taskStates)).toBe(100);
    });

    test('handles mix of all statuses correctly', () => {
      const taskStates = {
        task1: { status: 'completed', step: '5/5', message: 'Success!' },
        task2: { status: 'failed', step: 'error', message: 'Failed' },
        task3: { status: 'running', step: '2/5', message: 'Processing...' },
        task4: { status: 'pending', step: '0/3', message: 'Waiting...' },
        task5: { status: 'completed', step: '3/3', message: 'Done!' },
        task6: { status: 'pending', step: '0/2', message: 'Waiting...' }
      };
      // 3 done (2 completed + 1 failed) out of 6 tasks = 50%
      expect(calculateProgress(taskStates)).toBe(50);
    });
  });

  describe('Rounding Behavior', () => {
    test('rounds to nearest integer (rounds down)', () => {
      const taskStates = {
        task1: { status: 'completed', step: '5/5', message: 'Done!' },
        task2: { status: 'pending', step: '0/5', message: 'Waiting...' },
        task3: { status: 'pending', step: '0/5', message: 'Waiting...' }
      };
      // 1 of 3 = 33.333...% → rounds to 33%
      expect(calculateProgress(taskStates)).toBe(33);
    });

    test('rounds to nearest integer (rounds up)', () => {
      const taskStates = {
        task1: { status: 'completed', step: '5/5', message: 'Done!' },
        task2: { status: 'completed', step: '3/3', message: 'Done!' },
        task3: { status: 'pending', step: '0/5', message: 'Waiting...' }
      };
      // 2 of 3 = 66.666...% → rounds to 67%
      expect(calculateProgress(taskStates)).toBe(67);
    });
  });

  describe('Pure Function Behavior', () => {
    test('does not modify input object', () => {
      const taskStates = {
        task1: { status: 'completed', step: '5/5', message: 'Done!' },
        task2: { status: 'running', step: '2/5', message: 'Processing...' }
      };
      const originalCopy = JSON.parse(JSON.stringify(taskStates));

      calculateProgress(taskStates);

      expect(taskStates).toEqual(originalCopy);
    });

    test('returns same result for same input (idempotent)', () => {
      const taskStates = {
        task1: { status: 'completed', step: '5/5', message: 'Done!' },
        task2: { status: 'failed', step: 'error', message: 'Failed' },
        task3: { status: 'running', step: '2/5', message: 'Processing...' }
      };

      const result1 = calculateProgress(taskStates);
      const result2 = calculateProgress(taskStates);
      const result3 = calculateProgress(taskStates);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  describe('Single Task', () => {
    test('returns 100% for single completed task', () => {
      const taskStates = {
        task1: { status: 'completed', step: '5/5', message: 'Done!' }
      };
      expect(calculateProgress(taskStates)).toBe(100);
    });

    test('returns 100% for single failed task', () => {
      const taskStates = {
        task1: { status: 'failed', step: 'error', message: 'Failed' }
      };
      expect(calculateProgress(taskStates)).toBe(100);
    });

    test('returns 0% for single running task', () => {
      const taskStates = {
        task1: { status: 'running', step: '2/5', message: 'Processing...' }
      };
      expect(calculateProgress(taskStates)).toBe(0);
    });

    test('returns 0% for single pending task', () => {
      const taskStates = {
        task1: { status: 'pending', step: '0/5', message: 'Waiting...' }
      };
      expect(calculateProgress(taskStates)).toBe(0);
    });
  });
});
