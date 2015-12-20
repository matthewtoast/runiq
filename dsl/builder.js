'use strict';

var Assign = require('lodash.assign');

function Builder(library) {
    this.library = Assign({}, {
        types: {},
        casters: {},
        constants: {},
        functions: {},
        prices: {},
        inputs: {},
        outputs: {}
    }, library || {});
}

Builder.prototype.defineType = function(name, spec) {
    if (this.library.types[name]) {
        console.warn('Runiq: DSL is redefining type `' + name + '`');
    }
    this.library.types[name] = name;
    this.library.casters[name] = spec.cast;
    this.library.prices[name] = spec.price;
    return this;
};

Builder.prototype.defineConstant = function(name, value) {
    if (this.library.constants[name] !== undefined) {
        console.warn('Runiq: DSL is redefining constant `' + name + '`');
    }
    this.library.constants[name] = value;
    return this;
};

Builder.prototype.defineFunction = function(name, spec) {
    if (this.library.functions[name]) {
        console.warn('Runiq: DSL is redefining function `' + name + '`');
    }

    this.library.functions[name] = spec.implementation;
    this.library.inputs[name] = spec.signature[0];
    this.library.outputs[name] = spec.signature[1];
    if (spec.impure === true) spec.implementation.impure = true;
    return this;
};

Builder.prototype.aliasFunction = function(alias, original) {
    this.library.functions[alias] = this.library.functions[original];
    this.library.inputs[alias] = this.library.inputs[original];
    this.library.outputs[alias] = this.library.outputs[original];
    return this;
};

Builder.prototype.aliasType = function(alias, original) {
    this.library.types[alias] = this.library.types[original];
    this.library.casters[alias] = this.library.casters[original];
    this.library.prices[alias] = this.library.prices[original];
    return this;
};

Builder.prototype.exportLibrary = function() {
    return this.library;
};

module.exports = Builder;
