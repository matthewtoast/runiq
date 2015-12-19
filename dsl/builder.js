'use strict';

function Builder() {
    this.library = {
        types: {},
        casters: {},
        constants: {},
        functions: {},
        prices: {},
        inputs: {},
        outputs: {},
        scopes: {}
    };
}

Builder.prototype.defineScope = function(name, entry) {
    var builder = new Builder();
    this.defineFunction(name, entry);
    if (this.library.scopes[name]) {
        console.warn('Runiq: DSL is redefining scope `' + name + '`');
    }
    this.library.scopes[name] = builder.exportLibrary();
    return builder;
};

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
