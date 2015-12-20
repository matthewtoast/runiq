'use strict';

function Library(library) {
    this.types = library.types || {};
    this.casters = library.casters || {};
    this.constants = library.constants || {};
    this.functions = library.functions || {};
    this.prices = library.prices || {};
    this.inputs = library.inputs || {};
    this.outputs = library.outputs || {};
    this.scopes = _initializeLibraries(library.scopes || {});
}

function _initialize(library) {
    return new Library(library);
}

function _initializeLibraries(dictionary) {
    var initialized = {};
    for (var name in dictionary) {
        initialized[name] = _initialize(dictionary[name]);
    }
    return initialized;
}

function _scopeSpec(name) {
    return { name: name };
}

Library.prototype.scopedLookup = function(method, name, scope) {
    if (scope) {
        var scopeNames = [];
        // Lookup all scopes if the passed scope is `true`
        if (scope === true) scopeNames = Object.keys(this.scopes);
        else scopeNames.push(scope.name);
        for (var i = 0; i < scopeNames.length; i++) {
            var scopeName = scopeNames[i];
            if (!scopeName) continue;
            var scopeInstance = this.scopes[scopeName];
            if (scopeInstance) {
                var scopeValue = scopeInstance[method](name, scope);
                if (scopeValue !== undefined) return scopeValue;
            }
        }
    }
}

Library.prototype.lookupScope = function(name, scope) {
    var foundScope = this.scopedLookup('lookupScope', name, scope) || this.scopes[name];
    if (foundScope) return _scopeSpec(name);
};

Library.prototype.lookupFunction = function(name, scope) {
    return this.scopedLookup('lookupFunction', name, scope) || this.functions[name];
};

Library.prototype.lookupPrice = function(name, scope) {
    return this.scopedLookup('lookupPrice', name, scope) || this.prices[name];
};

Library.prototype.lookupTypeCaster = function(name, scope) {
    return this.scopedLookup('lookupTypeCaster', name, scope) || this.casters[name];
};

Library.prototype.lookupConstant = function(name, scope) {
    return this.scopedLookup('lookupConstant', name, scope) || this.constants[name];
};

Library.prototype.lookupInputs = function(name, scope) {
    return this.scopedLookup('lookupInputs', name, scope) || this.inputs[name];
};

Library.prototype.isImpureFunction = function(name, scope) {
    return this.scopedLookup('isImpureFunction', name, scope) || (
        this.functions[name] && this.functions[name].impure === true
    );
};

module.exports = Library;
