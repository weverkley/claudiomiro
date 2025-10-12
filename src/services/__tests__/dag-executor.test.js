const fs = require('fs');
const path = require('path');
const os = require('os');
const { DAGExecutor } = require('../dag-executor');
const logger = require('../../../logger');
const state = require('../../config/state');
const { step2, step3, step4 } = require('../../steps');
const { isFullyImplemented, hasApprovedCodeReview } = require('../../utils/validation');
const ParallelStateManager = require('../parallel-state-manager');
const ParallelUIRenderer = require('../parallel-ui-renderer');
const TerminalRenderer = require('../../utils/terminal-renderer');
const { calculateProgress } = require('../../utils/progress-calculator');

// Mock all external dependencies
jest.mock('fs');
jest.mock('../../../logger');
jest.mock('../../config/state');
jest.mock('../../steps');
jest.mock('../../utils/validation');
jest.mock('../parallel-ui-renderer');
jest.mock('../../utils/terminal-renderer');
jest.mock('../../utils/progress-calculator');

describe('DAGExecutor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ParallelStateManager.reset();
    state.claudiomiroFolder = '/mock/claudiomiro';
  });

  describe('Constructor initialization', () => {
    it('should initialize with tasks, allowedSteps, and maxConcurrent', () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: ['TASK1'], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, [2, 3], 10);

      expect(executor.tasks).toBe(tasks);
      expect(executor.allowedSteps).toEqual([2, 3]);
      expect(executor.maxConcurrent).toBe(10);
      expect(executor.running).toBeInstanceOf(Set);
      expect(executor.running.size).toBe(0);
    });

    it('should set allowedSteps to null when not provided', () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);

      expect(executor.allowedSteps).toBeNull();
    });

    it('should calculate default maxConcurrent based on CPU count', () => {
      const cpuCount = os.cpus().length;
      const expected = Math.max(1, Math.min(5, (cpuCount || 1) * 2));
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);

      expect(executor.maxConcurrent).toBe(expected);
    });

    it('should cap maxConcurrent at 5 even with many CPUs', () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);

      expect(executor.maxConcurrent).toBeLessThanOrEqual(5);
    });

    it('should use custom maxConcurrent when provided', () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks, null, 20);

      expect(executor.maxConcurrent).toBe(20);
    });
  });

  describe('shouldRunStep', () => {
    it('should return true when allowedSteps is null', () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks, null);

      expect(executor.shouldRunStep(2)).toBe(true);
      expect(executor.shouldRunStep(3)).toBe(true);
      expect(executor.shouldRunStep(4)).toBe(true);
    });

    it('should return true when step is in allowedSteps array', () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks, [2, 4]);

      expect(executor.shouldRunStep(2)).toBe(true);
      expect(executor.shouldRunStep(4)).toBe(true);
    });

    it('should return false when step is not in allowedSteps array', () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks, [2, 4]);

      expect(executor.shouldRunStep(3)).toBe(false);
      expect(executor.shouldRunStep(5)).toBe(false);
    });

    it('should handle empty allowedSteps array', () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks, []);

      expect(executor.shouldRunStep(2)).toBe(false);
      expect(executor.shouldRunStep(3)).toBe(false);
    });
  });

  describe('getReadyTasks', () => {
    it('should return tasks with pending status and no dependencies', () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      const ready = executor.getReadyTasks();
      expect(ready).toEqual(expect.arrayContaining(['TASK1', 'TASK2']));
      expect(ready.length).toBe(2);
    });

    it('should return tasks whose dependencies are completed', () => {
      const tasks = {
        TASK1: { deps: [], status: 'completed' },
        TASK2: { deps: ['TASK1'], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      const ready = executor.getReadyTasks();
      expect(ready).toEqual(['TASK2']);
    });

    it('should not return tasks with incomplete dependencies', () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: ['TASK1'], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      const ready = executor.getReadyTasks();
      expect(ready).toEqual(['TASK1']);
      expect(ready).not.toContain('TASK2');
    });

    it('should handle complex dependency graph', () => {
      const tasks = {
        TASK1: { deps: [], status: 'completed' },
        TASK2: { deps: [], status: 'completed' },
        TASK3: { deps: ['TASK1', 'TASK2'], status: 'pending' },
        TASK4: { deps: ['TASK1'], status: 'pending' },
        TASK5: { deps: ['TASK3'], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      const ready = executor.getReadyTasks();
      expect(ready).toEqual(expect.arrayContaining(['TASK3', 'TASK4']));
      expect(ready.length).toBe(2);
      expect(ready).not.toContain('TASK5');
    });

    it('should not return completed tasks', () => {
      const tasks = {
        TASK1: { deps: [], status: 'completed' },
        TASK2: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      const ready = executor.getReadyTasks();
      expect(ready).toEqual(['TASK2']);
      expect(ready).not.toContain('TASK1');
    });

    it('should not return running tasks', () => {
      const tasks = {
        TASK1: { deps: [], status: 'running' },
        TASK2: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      const ready = executor.getReadyTasks();
      expect(ready).toEqual(['TASK2']);
      expect(ready).not.toContain('TASK1');
    });

    it('should not return failed tasks', () => {
      const tasks = {
        TASK1: { deps: [], status: 'failed' },
        TASK2: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      const ready = executor.getReadyTasks();
      expect(ready).toEqual(['TASK2']);
      expect(ready).not.toContain('TASK1');
    });

    it('should return empty array when no tasks are ready', () => {
      const tasks = {
        TASK1: { deps: [], status: 'running' },
        TASK2: { deps: ['TASK1'], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      const ready = executor.getReadyTasks();
      expect(ready).toEqual([]);
    });

    it('should handle tasks with missing dependencies gracefully', () => {
      const tasks = {
        TASK1: { deps: ['NONEXISTENT'], status: 'pending' },
        TASK2: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      const ready = executor.getReadyTasks();
      expect(ready).toEqual(['TASK2']);
      expect(ready).not.toContain('TASK1');
    });
  });

  describe('executeWave', () => {
    it('should execute ready tasks up to maxConcurrent limit', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: [], status: 'pending' },
        TASK3: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, null, 2);
      executor.executeTask = jest.fn().mockResolvedValue();

      const result = await executor.executeWave();

      expect(result).toBe(true);
      expect(executor.executeTask).toHaveBeenCalledTimes(2);
    });

    it('should mark tasks as running and add to running set', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, null, 5);
      executor.executeTask = jest.fn().mockResolvedValue();

      await executor.executeWave();

      expect(tasks.TASK1.status).toBe('running');
      expect(executor.running.has('TASK1')).toBe(true);
    });

    it('should return false when no tasks are ready', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'running' }
      };
      const executor = new DAGExecutor(tasks);
      executor.executeTask = jest.fn();

      const result = await executor.executeWave();

      expect(result).toBe(false);
      expect(executor.executeTask).not.toHaveBeenCalled();
    });

    it('should respect available slots based on running tasks', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: [], status: 'pending' },
        TASK3: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, null, 2);
      executor.running.add('EXISTING_TASK');
      executor.executeTask = jest.fn().mockResolvedValue();

      await executor.executeWave();

      expect(executor.executeTask).toHaveBeenCalledTimes(1);
    });

    it('should use Promise.allSettled to handle task execution', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, null, 5);
      executor.executeTask = jest.fn()
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('Task failed'));

      const result = await executor.executeWave();

      expect(result).toBe(true);
      expect(executor.executeTask).toHaveBeenCalledTimes(2);
    });

    it('should execute tasks without logging task progress', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, null, 5);
      executor.executeTask = jest.fn().mockResolvedValue();

      await executor.executeWave();

      // Should not log task progress (handled by UI renderer)
      expect(logger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Running 2 task(s) in parallel')
      );
    });

    it('should return false when maxConcurrent is reached', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, null, 1);
      executor.running.add('RUNNING_TASK');
      executor.executeTask = jest.fn();

      const result = await executor.executeWave();

      expect(result).toBe(false);
      expect(executor.executeTask).not.toHaveBeenCalled();
    });
  });

  describe('executeTask', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(false);
      isFullyImplemented.mockReturnValue(true);
      hasApprovedCodeReview.mockReturnValue(true);
      step2.mockResolvedValue();
      step3.mockResolvedValue();
      step4.mockResolvedValue();
    });

    it('should skip task if TODO is implemented and code review approved', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');
      fs.existsSync.mockImplementation((filepath) => filepath.includes('TODO.md'));
      hasApprovedCodeReview.mockReturnValue(true);

      await executor.executeTask('TASK1');

      expect(tasks.TASK1.status).toBe('completed');
      expect(executor.running.has('TASK1')).toBe(false);
      expect(step2).not.toHaveBeenCalled();
    });

    it('should execute step2 if TODO.md does not exist', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      let step2Called = false;
      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) {
          return step2Called;
        }
        return false;
      });

      step2.mockImplementation(async () => {
        step2Called = true;
      });

      await executor.executeTask('TASK1');

      expect(step2).toHaveBeenCalledWith('TASK1');
    });

    it('should skip step2 if not in allowedSteps', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks, [3, 4]);
      executor.running.add('TASK1');

      await executor.executeTask('TASK1');

      expect(step2).not.toHaveBeenCalled();
      expect(tasks.TASK1.status).toBe('completed');
    });

    it('should skip step3 if not in allowedSteps', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks, [2, 4]);
      executor.running.add('TASK1');

      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      await executor.executeTask('TASK1');

      expect(step3).not.toHaveBeenCalled();
      expect(tasks.TASK1.status).toBe('completed');
    });

    it('should execute step3 if TODO.md is not fully implemented', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      let implementationReady = false;
      let reviewApproved = false;
      isFullyImplemented.mockImplementation(() => implementationReady);
      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      hasApprovedCodeReview.mockImplementation(() => reviewApproved);
      step3.mockImplementation(async () => {
        implementationReady = true;
      });
      step4.mockImplementation(async () => {
        reviewApproved = true;
      });

      await executor.executeTask('TASK1');

      expect(step3).toHaveBeenCalledWith('TASK1');
      expect(step3).toHaveBeenCalledTimes(1);
    });

    it('should execute step4 if CODE_REVIEW.md does not exist', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      let reviewApproved = false;
      hasApprovedCodeReview.mockImplementation(() => reviewApproved);
      step4.mockImplementation(async () => {
        reviewApproved = true;
      });

      await executor.executeTask('TASK1');

      expect(step4).toHaveBeenCalledWith('TASK1');
    });

    it('should execute step4 when code review is pending approval', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      let step4Called = false;
      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      hasApprovedCodeReview.mockImplementation(() => step4Called);
      step4.mockImplementation(async () => {
        step4Called = true;
      });

      await executor.executeTask('TASK1');

      expect(step4).toHaveBeenCalledWith('TASK1');
    });

    it('should skip step4 if not in allowedSteps', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks, [2, 3]);
      executor.running.add('TASK1');

      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        if (filepath.includes('CODE_REVIEW.md')) return true;
        return false;
      });

      await executor.executeTask('TASK1');

      expect(step4).not.toHaveBeenCalled();
      expect(tasks.TASK1.status).toBe('completed');
    });

    it('should retry step3 if not fully implemented (loop behavior)', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      let implementationReady = false;
      let step3Runs = 0;
      isFullyImplemented.mockImplementation(() => implementationReady);

      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      step3.mockImplementation(async () => {
        step3Runs++;
        implementationReady = step3Runs > 1;
      });

      await executor.executeTask('TASK1');

      expect(step3).toHaveBeenCalledTimes(2);
    });

    it('should throw error if max attempts reached', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      isFullyImplemented.mockReturnValue(false); // Never implemented
      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      await expect(executor.executeTask('TASK1')).rejects.toThrow(
        'Maximum attempts (20) reached for TASK1'
      );

      expect(tasks.TASK1.status).toBe('failed');
      expect(executor.running.has('TASK1')).toBe(false);
    });

    it('should mark task as completed on success', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      let step4Called = false;
      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      hasApprovedCodeReview.mockImplementation(() => step4Called);
      step4.mockImplementation(async () => {
        step4Called = true;
      });

      await executor.executeTask('TASK1');

      expect(tasks.TASK1.status).toBe('completed');
      expect(executor.running.has('TASK1')).toBe(false);
      expect(logger.success).toHaveBeenCalledWith(
        expect.stringContaining('completed successfully')
      );
    });

    it('should mark task as failed and remove from running on error', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks, null, null, false, 2); // Use maxAttempts=2 for faster test
      executor.running.add('TASK1');

      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      const error = new Error('Step 3 failed');
      step3.mockRejectedValue(error);
      isFullyImplemented.mockReturnValue(false);

      await expect(executor.executeTask('TASK1')).rejects.toThrow('Step 3 failed');

      expect(tasks.TASK1.status).toBe('failed');
      expect(executor.running.has('TASK1')).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('failed')
      );
    });

    it('should continue loop if code review remains disapproved', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      let step4Calls = 0;
      let implementedCount = 0;
      let reviewApproved = false;

      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      // First time not implemented, then implemented after first step3
      isFullyImplemented.mockImplementation(() => {
        return implementedCount > 0;
      });

      step3.mockImplementation(async () => {
        implementedCount++;
      });

      hasApprovedCodeReview.mockImplementation(() => reviewApproved);

      step4.mockImplementation(async () => {
        step4Calls++;
        if (step4Calls === 1) {
          implementedCount = 0; // Simulate TODO.md being reset
          reviewApproved = false;
        } else {
          reviewApproved = true;
        }
      });

      await executor.executeTask('TASK1');

      expect(step4).toHaveBeenCalledTimes(2);
      expect(step3).toHaveBeenCalledTimes(2);
    });
  });

  describe('run', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(true); // All tasks already completed
    });

    it('should execute simple task graph', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      await executor.run();

      expect(tasks.TASK1.status).toBe('completed');
      expect(tasks.TASK2.status).toBe('completed');
    });

    it('should execute tasks respecting dependencies', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: ['TASK1'], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);
      const executionOrder = [];

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executionOrder.push(taskName);
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(executionOrder.indexOf('TASK1')).toBeLessThan(executionOrder.indexOf('TASK2'));
    });

    it('should execute independent tasks concurrently', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: [], status: 'pending' },
        TASK3: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, null, 3);
      const concurrent = [];

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        concurrent.push(taskName);
        await new Promise(resolve => setTimeout(resolve, 10));
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      // All 3 should be executed (order doesn't matter for independent tasks)
      expect(executor.executeTask).toHaveBeenCalledTimes(3);
    });

    it('should handle complex dependency graph', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: [], status: 'pending' },
        TASK3: { deps: ['TASK1', 'TASK2'], status: 'pending' },
        TASK4: { deps: ['TASK3'], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(tasks.TASK1.status).toBe('completed');
      expect(tasks.TASK2.status).toBe('completed');
      expect(tasks.TASK3.status).toBe('completed');
      expect(tasks.TASK4.status).toBe('completed');
    });

    it('should report failed tasks', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        if (taskName === 'TASK1') {
          executor.tasks[taskName].status = 'failed';
        } else {
          executor.tasks[taskName].status = 'completed';
        }
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed tasks: TASK1')
      );
    });

    it('should report pending tasks', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: ['TASK1'], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        if (taskName === 'TASK1') {
          executor.tasks[taskName].status = 'failed';
        }
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Tasks still pending (check dependencies): TASK2')
      );
    });

    it('should report completed task count', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: [], status: 'pending' },
        TASK3: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(logger.success).toHaveBeenCalledWith(
        expect.stringContaining('Completed 3/3 tasks')
      );
    });

    it('should log executor configuration on start', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks, null, 3);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Starting DAG executor with max 3 concurrent tasks')
      );
    });

    it('should wait for running tasks to complete', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: ['TASK1'], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, null, 1);

      let task1Completed = false;
      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        if (taskName === 'TASK1') {
          await new Promise(resolve => setTimeout(resolve, 50));
          task1Completed = true;
          executor.tasks[taskName].status = 'completed';
        } else if (taskName === 'TASK2') {
          expect(task1Completed).toBe(true);
          executor.tasks[taskName].status = 'completed';
        }
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(executor.executeTask).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge cases and integration scenarios', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
    });

    it('should handle empty task list', async () => {
      const tasks = {};
      const executor = new DAGExecutor(tasks);

      await executor.run();

      expect(logger.success).toHaveBeenCalledWith(
        expect.stringContaining('Completed 0/0 tasks')
      );
    });

    it('should handle single task execution', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(tasks.TASK1.status).toBe('completed');
      expect(executor.executeTask).toHaveBeenCalledTimes(1);
    });

    it('should handle all independent tasks', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: [], status: 'pending' },
        TASK3: { deps: [], status: 'pending' },
        TASK4: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, null, 2);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(Object.values(tasks).every(t => t.status === 'completed')).toBe(true);
      expect(executor.executeTask).toHaveBeenCalledTimes(4);
    });

    it('should handle long dependency chain', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: ['TASK1'], status: 'pending' },
        TASK3: { deps: ['TASK2'], status: 'pending' },
        TASK4: { deps: ['TASK3'], status: 'pending' },
        TASK5: { deps: ['TASK4'], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(Object.values(tasks).every(t => t.status === 'completed')).toBe(true);
    });

    it('should handle mixed step filtering across tasks', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, [2, 4]); // Skip step 3
      executor.running.add('TASK1');

      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      await executor.executeTask('TASK1');

      expect(step3).not.toHaveBeenCalled();
      expect(tasks.TASK1.status).toBe('completed');
    });

    it('should handle task with all steps filtered out', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, [5, 6]); // No valid steps
      executor.running.add('TASK1');

      await executor.executeTask('TASK1');

      expect(step2).not.toHaveBeenCalled();
      expect(step3).not.toHaveBeenCalled();
      expect(step4).not.toHaveBeenCalled();
      expect(tasks.TASK1.status).toBe('completed');
    });

    it('should handle diamond dependency pattern', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: ['TASK1'], status: 'pending' },
        TASK3: { deps: ['TASK1'], status: 'pending' },
        TASK4: { deps: ['TASK2', 'TASK3'], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, null, 2);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(Object.values(tasks).every(t => t.status === 'completed')).toBe(true);
    });

    it('should handle partial task completion', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'completed' },
        TASK2: { deps: ['TASK1'], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(executor.executeTask).toHaveBeenCalledTimes(1);
      expect(executor.executeTask).toHaveBeenCalledWith('TASK2');
    });
  });

  describe('ParallelStateManager Integration', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(false);
      isFullyImplemented.mockReturnValue(true);
      hasApprovedCodeReview.mockReturnValue(true);
      step2.mockResolvedValue();
      step3.mockResolvedValue();
      step4.mockResolvedValue();
    });

    it('should initialize state manager with task names in constructor', () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: ['TASK1'], status: 'pending' },
        TASK3: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks);

      expect(executor.stateManager).toBeInstanceOf(ParallelStateManager);
      const allStates = executor.stateManager.getAllTaskStates();
      expect(Object.keys(allStates)).toEqual(['TASK1', 'TASK2', 'TASK3']);
      expect(allStates.TASK1.status).toBe('pending');
      expect(allStates.TASK2.status).toBe('pending');
      expect(allStates.TASK3.status).toBe('pending');
    });

    it('should return state manager instance via getStateManager', () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);

      const stateManager = executor.getStateManager();
      expect(stateManager).toBe(executor.stateManager);
      expect(stateManager).toBeInstanceOf(ParallelStateManager);
    });

    it('should update state to running when task starts', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      fs.existsSync.mockReturnValue(true); // Already completed

      await executor.executeTask('TASK1');

      const states = executor.stateManager.getAllTaskStates();
      // Should be updated to running at start, then to completed
      expect(states.TASK1.status).toBe('completed');
    });

    it('should update state to completed when task completes successfully', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      let step4Called = false;
      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      hasApprovedCodeReview.mockImplementation(() => step4Called);
      step4.mockImplementation(async () => {
        step4Called = true;
      });

      await executor.executeTask('TASK1');

      const states = executor.stateManager.getAllTaskStates();
      expect(states.TASK1.status).toBe('completed');
    });

    it('should update state to failed when task fails', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks, null, null, false, 2); // Use maxAttempts=2 for faster test
      executor.running.add('TASK1');

      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      const error = new Error('Task failed');
      step3.mockRejectedValue(error);
      isFullyImplemented.mockReturnValue(false);

      await expect(executor.executeTask('TASK1')).rejects.toThrow('Task failed');

      const states = executor.stateManager.getAllTaskStates();
      expect(states.TASK1.status).toBe('failed');
    });

    it('should update state to failed when max attempts reached', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      isFullyImplemented.mockReturnValue(false);
      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      await expect(executor.executeTask('TASK1')).rejects.toThrow('Maximum attempts');

      const states = executor.stateManager.getAllTaskStates();
      expect(states.TASK1.status).toBe('failed');
    });

    it('should update step info when executing step 2', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      let step2Called = false;
      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return step2Called;
        return false;
      });

      step2.mockImplementation(async () => {
        step2Called = true;
        const states = executor.stateManager.getAllTaskStates();
        expect(states.TASK1.step).toBe('Step 2 - Research and planning');
      });

      await executor.executeTask('TASK1');
    });

    it('should update step info when executing step 3', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      let step3Calls = 0;
      isFullyImplemented.mockImplementation(() => {
        step3Calls++;
        return step3Calls > 1;
      });

      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      step3.mockImplementation(async () => {
        const states = executor.stateManager.getAllTaskStates();
        expect(states.TASK1.step).toContain('Step 3 - Implementing tasks');
      });

      await executor.executeTask('TASK1');
    });

    it('should update step info when executing step 4', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      let step4Called = false;
      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });

      hasApprovedCodeReview.mockImplementation(() => step4Called);
      step4.mockImplementation(async () => {
        step4Called = true;
        const states = executor.stateManager.getAllTaskStates();
        expect(states.TASK1.step).toBe('Step 4 - Code review');
      });

      await executor.executeTask('TASK1');
    });

    it('should track multiple parallel tasks correctly', async () => {
      const tasks = {
        TASK1: { deps: [], status: 'pending' },
        TASK2: { deps: [], status: 'pending' },
        TASK3: { deps: [], status: 'pending' }
      };
      const executor = new DAGExecutor(tasks, null, 3);

      // Mock executeTask to simulate parallel execution
      const originalExecuteTask = DAGExecutor.prototype.executeTask;
      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.stateManager.updateTaskStatus(taskName, 'running');
        await new Promise(resolve => setTimeout(resolve, 10));
        executor.stateManager.updateTaskStatus(taskName, 'completed');
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      const states = executor.stateManager.getAllTaskStates();
      expect(states.TASK1.status).toBe('completed');
      expect(states.TASK2.status).toBe('completed');
      expect(states.TASK3.status).toBe('completed');
    });

    it('should update status when step is skipped', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks, [3, 4]); // Skip step 2
      executor.running.add('TASK1');

      await executor.executeTask('TASK1');

      const states = executor.stateManager.getAllTaskStates();
      expect(states.TASK1.status).toBe('completed');
    });

    it('should update status for already completed tasks', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      executor.running.add('TASK1');

      fs.existsSync.mockImplementation((filepath) => {
        if (filepath.includes('TODO.md')) return true;
        return false;
      });
      hasApprovedCodeReview.mockReturnValue(true);

      await executor.executeTask('TASK1');

      const states = executor.stateManager.getAllTaskStates();
      expect(states.TASK1.status).toBe('completed');
    });
  });

  describe('UI Renderer Integration', () => {
    let mockUIRenderer;
    let mockTerminalRenderer;

    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);

      // Create mock instances
      mockUIRenderer = {
        start: jest.fn(),
        stop: jest.fn()
      };
      mockTerminalRenderer = {};

      // Mock constructor returns
      ParallelUIRenderer.mockImplementation(() => mockUIRenderer);
      TerminalRenderer.mockImplementation(() => mockTerminalRenderer);
      calculateProgress.calculateProgress = jest.fn().mockReturnValue(50);
    });

    it('should instantiate TerminalRenderer and ParallelUIRenderer', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(TerminalRenderer).toHaveBeenCalledTimes(1);
      expect(ParallelUIRenderer).toHaveBeenCalledTimes(1);
      expect(ParallelUIRenderer).toHaveBeenCalledWith(mockTerminalRenderer);
    });

    it('should call uiRenderer.start() before execution with correct parameters', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(mockUIRenderer.start).toHaveBeenCalledTimes(1);
      expect(mockUIRenderer.start).toHaveBeenCalledWith(
        executor.getStateManager(),
        { calculateProgress }
      );
    });

    it('should call uiRenderer.stop() after execution completes', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(mockUIRenderer.stop).toHaveBeenCalledTimes(1);
    });

    it('should call start before execution and stop after execution', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);
      const callOrder = [];

      mockUIRenderer.start.mockImplementation(() => {
        callOrder.push('start');
      });

      mockUIRenderer.stop.mockImplementation(() => {
        callOrder.push('stop');
      });

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        callOrder.push('executeTask');
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(callOrder).toEqual(['start', 'executeTask', 'stop']);
    });

    it('should stop UI renderer even when tasks are empty', async () => {
      const tasks = {};
      const executor = new DAGExecutor(tasks);

      await executor.run();

      expect(mockUIRenderer.start).toHaveBeenCalledTimes(1);
      expect(mockUIRenderer.stop).toHaveBeenCalledTimes(1);
    });

    it('should stop UI renderer even when tasks fail', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'failed';
        executor.running.delete(taskName);
      });

      await executor.run();

      expect(mockUIRenderer.start).toHaveBeenCalledTimes(1);
      expect(mockUIRenderer.stop).toHaveBeenCalledTimes(1);
    });

    it('should pass state manager instance to UI renderer start', async () => {
      const tasks = { TASK1: { deps: [], status: 'pending' } };
      const executor = new DAGExecutor(tasks);

      executor.executeTask = jest.fn().mockImplementation(async (taskName) => {
        executor.tasks[taskName].status = 'completed';
        executor.running.delete(taskName);
      });

      await executor.run();

      const passedStateManager = mockUIRenderer.start.mock.calls[0][0];
      expect(passedStateManager).toBe(executor.getStateManager());
      expect(passedStateManager).toBeInstanceOf(ParallelStateManager);
    });
  });
});
