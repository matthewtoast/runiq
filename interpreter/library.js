'use strict';

var CloneDeep = require('lodash.clonedeep');

function Library(data) {
    this.data = CloneDeep(data);
}

Library.prototype.lookupFunction = function(name) {
    return this.data.functions[name];
};

Library.prototype.lookupPrice = function(name) {
    return this.data.prices[name];
};

Library.prototype.lookupTypeCaster = function(name) {
    return this.data.casters[name];
};

Library.prototype.lookupConstant = function(name) {
    return this.data.constants[name];
};

Library.prototype.lookupInputs = function(name) {
    return this.data.inputs[name];
};

Library.prototype.lookupPreprocessor = function(name) {
    return this.data.preprocessors[name];
};

Library.prototype.isImpureFunction = function(name) {
    var fn = this.data.functions[name];
    return fn && fn.impure === true;
};

Library.prototype.doOmitUndefinedWarningFor = function(name) {
    return !!(name in this.data.omissions);
};

module.exports = Library;
