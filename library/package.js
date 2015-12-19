'use strict';

var Fs = require('fs');
var Path = require('path');

var STRING_TYPE = 'string';
var LIST_TYPE = 'list';
var JS_UNDEF = 'undefined';
var IS_BROWSER = typeof window !== JS_UNDEF;

var FS_NAMESPACE = '.runiq';
var FS_PACKAGES_FOLDER = 'packages';
var FS_PACKAGE_EXTNAME = '.json';
var LOCAL_STORAGE_NAMESPACE = 'runiq';
var LOCAL_STORAGE_DELIM = ':';

function _localStorageKey(author, pk, vers) {
    return [LOCAL_STORAGE_NAMESPACE, author, pk, vers].join(LOCAL_STORAGE_DELIM);
}

function _localStorageGet(key) {
    try {
        return window.localStorage[key];
    }
    catch (e) {
        return null;
    }
}

function _localStorageSet(key, value) {
    try {
        return window.localStorage[key] = value;
    }
    catch (e) {
        return null;
    }
}

function _tryJSON(data) {
    if (typeof data !== 'string') return data;
    try {
        return JSON.parse(data);
    }
    catch (e) {
        return null;
    }
}

function _fsLoad(path, cb) {
    var pkName = path + FS_PACKAGE_EXTNAME;
    var fileOpts = { encoding: 'utf-8' };
    return Fs.readFile(pkName, fileOpts, function(err, data) {
        if (err) return cb(null);
        return cb(_tryJSON(data));
    });
}

function _pkPathFrom(base, author, pk, vers) {
    return Path.join(base, FS_NAMESPACE, FS_PACKAGES_FOLDER, author, pk, vers);
}

function _pkNotFound(author, pk, vers) {
    var msg = 'Package `' + author + ':' + pk + ':' + vers + '` not found';
    return new Error(msg);
}

function _isPresent(thing) {
    return thing && thing.length > 0;
}

function _tryLoad(cache, author, pk, vers, cb) {
    function step(loader) {
        return loader(author, pk, vers, function(found) {
            if (_isPresent(found)) {
                _setPackageMemoryCache(cache, author, pk, vers, found);
                if (IS_BROWSER) {
                    _localStorageSet(_localStorageKey(author, pk, vers), found);
                }
                return cb(null, found);
            }
            var nextOne = loaders.shift();
            if (nextOne) return step(nextOne);
            return cb(_pkNotFound());
        });
    }
    return step(loaders.shift());
}

function _setPackageMemoryCache(cache, author, pk, vers, data) {
    cache[author] || (cache[author] = {});
    cache[author][pk] || (cache[author][pk] = {});
    cache[author][pk][vers] || (cache[author][pk][vers] = data);
}

module.exports = function(dsl) {
    var cache = {};
    var loaders = [];

    loaders.push(function(author, pk, vers, cb)  {
        var found = cache[author] && cache[author][pk] && cache[author][pk][vers];
        return cb(found);
    });

    if (IS_BROWSER) {
        loaders.push(function(author, pk, vers, cb) {
            var data = _localStorageGet(_localStorageKey(author, pk, vers));
            var parsed = _tryJSON(data);
            return cb(parsed);
        });
    }

    if (!IS_BROWSER) {
        loaders.push(function(author, pk, vers, cb) {
            var path = _pkPathFrom(process.cwd(), author, pk, vers);
            return _fsLoad(path, cb);
        });

        loaders.push(function(author, pk, vers, cb) {
            var path = _pkPathFrom(__dirname, author, pk, vers);
            return _fsLoad(path, cb);
        });
    }

    dsl.defineFunction('package.load', {
        signature: [[STRING_TYPE,STRING_TYPE,STRING_TYPE],LIST_TYPE],
        implementation: _tryLoad.bind(null, cache)
    });

    return dsl;
};
