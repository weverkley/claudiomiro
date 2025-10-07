const path = require('path');

class State {
    constructor() {
        this._folder = null;
        this._claudiomiroFolder = null;
    }

    setFolder(folderPath) {
        this._folder = path.resolve(folderPath);
        this._claudiomiroFolder = path.join(this._folder, '.claudiomiro');
    }

    get folder() {
        return this._folder;
    }

    get claudiomiroFolder() {
        return this._claudiomiroFolder;
    }
}

module.exports = new State();
