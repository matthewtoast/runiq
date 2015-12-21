'use strict';

var CloneDeep = require('lodash.clonedeep');
var StateWrapper = require('runegrid.state-wrapper');

function expand(token, type, id) {
    if (Array.isArray(token)) {
        for (var i = 0; i < token.length; i++) {
            var step = token[i];
            expand(step, type, id);
        }
        if (token[0] === 'get' || token[0] === 'set') {
            token[0] = 'component.' + token[0];
            token.splice(1, 0, id);
            token.splice(1, 0, type);
        }
    }
    if (typeof token === 'object') {
        if (token["'"]) expand(token["'"], type, id);
    }
    return token;
}

function hydrate(list, type, params, body, initial, store) {
    list.shift(); // Pop off the component type string
    var id = list.shift();
    // Set the initial state
    if (!store[id]) {
        var initialState = initial || {};
        var stateWrapper = StateWrapper.wrap(initialState);
        store[id] = stateWrapper;
    } 
    var args = [];
    while (list.length > 0) args.push(list.shift());
    // Create the lambda construct
    list.unshift('lambda');
    // Prefix with the expected params
    for (var i = 0; i < params.length; i++) list.push(params[i]);
    var expanded = expand(CloneDeep(body), type, id);
    list.push(expanded);
    // Suffix with the given arguments
    for (var j = 0; j < args.length; j++) list.push(args[j]);
    return list;
}

function componentize(program, type, params, body, initial, store) {
    if (Array.isArray(program)) {
        for (var i = 0; i < program.length; i++) {
            var step = program[i];
            componentize(step, type, params, body, initial, store);
        }
        if (program[0] === type) {
            hydrate(program, type, params, body, initial, store);
        }
    }
    if (typeof program === 'object') {
        if (program["'"]) {
            componentize(program["'"], type, params, body, initial, store);
        }
    }
}

function _hashize(args, hash) {
    for (var i = 0; i < args.length; i += 2) {
        var key = args[i];
        var value = args[i + 1];
        hash[key] = value;
    }
}

module.exports = function(dsl) {
    var instances = {};

    dsl.definePreprocessor('component', {
        implementation: function(list, program, cb) {
            list.shift();
            var type = list.shift();

            var params = [];
            var body;
            var initial = {};

            while (list.length > 0) {
                var token = list.shift();
                if (typeof token === 'string') params.push(token);
                if (typeof token === 'object') {
                    body = token;
                    break; // First object found must be the body
                }
            }

            _hashize(list, initial);

            if (instances[type]) {
                console.warn('Runiq: Component `' + type + '` being redefined');
            }

            var store = {};
            instances[type] = store;
            componentize(program, type, params, body, initial, store);

            return cb(null, program);
        }
    });

    dsl.defineFunction('component.get', {
        signature: [['string','string','string'],'*'],
        implementation: function() {
            var args = this.args;
            var type = args.shift();
            var id = args.shift();
            var key = args.shift();

            if (!instances[type] || !instances[type][id]) {
                return this.cb(new Error('Instance storage failed to initialize'));
            }

            var cb = this.cb;
            var state = instances[type][id];
            
            return state.get(key, function(err, value, meta) {
                if (Array.isArray(value)) {
                    if (value.length > 1) value = ['list'].concat(value);
                    else value = {"'": value }; // HACK: Avoid irreducible list
                }
                return cb(err, value);
            });
        }
    });

    dsl.defineFunction('component.set', {
        signature: [['string','string','string','*'],'null'],
        implementation: function() {
            var args = this.args;
            var type = args.shift();
            var id = args.shift();
            var key = args.shift();
            var value = args.shift();

            if (!instances[type] || !instances[type][id]) {
                return this.cb(new Error('Instance storage failed to initialize'));
            }

            var cb = this.cb;
            var state = instances[type][id];
            var meta = null;

            return state.set(key, value, meta, function(err) {
                return cb(err);
            });
        }
    });

    return dsl;
};
