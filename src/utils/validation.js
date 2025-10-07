const fs = require('fs');
const path = require('path');
const state = require('../config/state');

const isFullyImplemented = (file) => {
    const todo = fs.readFileSync(file, 'utf-8');
    const lines = todo.split('\n').slice(0, 10); // Check first 10 lines

    for (const line of lines) {
        const trimmedLine = line.trim().toLowerCase();
        // Check if line is exactly "fully implemented: yes" (not inside a task)
        if (trimmedLine === 'fully implemented: yes' || trimmedLine.startsWith('fully implemented: yes')) {
            // Make sure it's not part of a task (doesn't start with - [ ])
            if (!line.trim().startsWith('-')) {
                return true;
            }
        }
    }

    return false;
}

module.exports = { isFullyImplemented };
