'use strict';

var Console = require('./console');

var REST_ARG_TYPE = '...';
var STRING_TYPE = 'string';
var OBJECT_TYPE = 'object';
var QUOTE_KEY = "'";
var QUOTE_NAME = 'quote';

function _isPresent(thing) {
    return thing !== undefined && thing !== null;
}

function runtimeCheck(inst, name, library, args, scope) {
    var inputs = library.lookupInputs(name, scope);
    var message;
    if (_isPresent(inputs) && inputs !== true) {
        if (inputs === false) {
            if (args.length > 0) {
                message = '`' + name + '` doesn\'t permit any arguments!';
                return new Error(message);
            }
            return;
        }
        if (inputs[inputs.length - 1] !== REST_ARG_TYPE) {
            if (inputs.length !== args.length) {
                message = 'Function `' + name + '` was given ' +
                          args.length + ' arguments ' +
                          'but expected ' + inputs.length
                return new Error(message);
            }
        }
    }
}

function preflightCheck(inst, entity, library, data) {
    if (Array.isArray(entity)) {
        var first = entity[0];
        if (typeof first === STRING_TYPE) {
            if (first !== QUOTE_NAME) {
                var lookup;
                lookup = library.lookupFunction(first, true);
                if (!lookup) lookup = library.lookupTypeCaster(first, true);
                if (!lookup) lookup = library.lookupConstant(first, true);
                if (!lookup) {
                    var alreadyWarnedKey = 'printed-warning-for-' + first;
                    if (!data[alreadyWarnedKey]) {
                        data[alreadyWarnedKey] = true;
                        Console.printWarning(inst,
                            'Function `' + first +
                            '` is not defined in the runtime library'
                        );
                    }
                }
            }
        }
        for (var i = 0; i < entity.length; i++) {
            var token = entity[i];
            var result = preflightCheck(inst, token, library, data);
            if (result) return result;
        }
    }
    if (entity && typeof entity === OBJECT_TYPE) {
        if (entity[QUOTE_KEY]) {
            return preflightCheck(inst, entity[QUOTE_KEY], library, data);
        }
    }
}

module.exports = {
    runtimeCheck: runtimeCheck,
    preflightCheck: preflightCheck
};
