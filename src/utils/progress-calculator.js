/**
 * Calculate the total progress percentage across all parallel tasks.
 *
 * @param {Object} taskStates - Object mapping task names to state objects {status, step, message}
 * @returns {number} Integer percentage (0-100) of completed tasks
 *
 * @example
 * const states = {
 *   task1: { status: 'completed', step: 'done', message: 'Success' },
 *   task2: { status: 'running', step: '2/5', message: 'Processing...' },
 *   task3: { status: 'failed', step: 'error', message: 'Failed' }
 * };
 * calculateProgress(states); // Returns 67 (2 done out of 3 tasks)
 */
function calculateProgress(taskStates) {
  // Handle edge case: no tasks or empty object
  if (!taskStates || typeof taskStates !== 'object') {
    return 0;
  }

  const taskNames = Object.keys(taskStates);
  const totalTasks = taskNames.length;

  // Handle edge case: zero tasks
  if (totalTasks === 0) {
    return 0;
  }

  // Count tasks that are done (completed or failed)
  const doneCount = taskNames.filter(taskName => {
    const state = taskStates[taskName];
    return state && (state.status === 'completed' || state.status === 'failed');
  }).length;

  // Calculate percentage and round to nearest integer
  return Math.round((doneCount / totalTasks) * 100);
}

module.exports = { calculateProgress };
