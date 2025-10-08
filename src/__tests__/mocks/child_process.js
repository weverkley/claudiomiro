const { EventEmitter } = require('events');

class MockChildProcess extends EventEmitter {
  constructor() {
    super();
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
    this.stdin = {
      write: jest.fn(),
      end: jest.fn()
    };
  }

  kill(signal) {
    this.emit('close', 0);
  }
}

const spawn = jest.fn(() => new MockChildProcess());

module.exports = {
  spawn,
  MockChildProcess
};
