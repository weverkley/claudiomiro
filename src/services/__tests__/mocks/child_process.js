const { EventEmitter } = require('events');

class MockChildProcess extends EventEmitter {
  constructor() {
    super();
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
    this.stdin = new EventEmitter();
    this.killed = false;
    this.pid = Math.floor(Math.random() * 10000);
  }

  kill(signal) {
    this.killed = true;
    this.emit('close', null, signal);
  }

  // Helper methods for testing
  emitData(data) {
    this.stdout.emit('data', Buffer.from(data));
  }

  emitError(error) {
    this.emit('error', error);
  }

  emitClose(code) {
    this.emit('close', code);
  }

  emitExit(code) {
    this.emit('exit', code);
  }
}

module.exports = { MockChildProcess };