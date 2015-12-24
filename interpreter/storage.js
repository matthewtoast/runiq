'use strict';

var Lodash = require('lodash');

function Storage() {
    this._state = {};
}

Storage.prototype.set = function(key, value) {
    Lodash.set(this._state, key, value);
    return this;
};

Storage.prototype.get = function(key) {
    return Lodash.get(this._state, key);
};

Storage.prototype.has = function(key) {
    return Lodash.has(this._state, key);
};

Storage.prototype.export = function() {
    return this._state;
};

module.exports = Storage;
