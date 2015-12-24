'use strict';

var CloneDeep = require('lodash.clonedeep');
var StateWrapper = require('runegrid.state-wrapper');

var INNER_METHOD_PREFIX = 'component';
var DOT = '.';

function expandToken(token, id, type, meth) {
    token[0] = INNER_METHOD_PREFIX + DOT + meth;
    token.splice(1, 0, id);
    token.splice(1, 0, type);
}

function expand(token, type, id) {
    if (Array.isArray(token)) {
        for (var i = 0; i < token.length; i++) {
            var step = token[i];
            expand(step, type, id);
        }
        switch (token[0]) {
            case 'get':
            case 'set':
            case 'on':
            case 'do':
                expandToken(token, id, type, token[0]);
                break;
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
    var initialState = initial || {};
    var stateWrapper;

    if (!store[id]) {
        stateWrapper = StateWrapper.wrap(initialState);
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
        if (typeof value === 'object' && value["'"]) {
            value = value["'"];
        }
        hash[key] = value;
    }
}

function eventString(componentType, componentId, eventName) {
    return componentType + ':' + componentId + ':' + eventName;
}

module.exports = function(dsl) {
    dsl.omitUndefinedWarning('get');
    dsl.omitUndefinedWarning('set');
    dsl.omitUndefinedWarning('do');
    dsl.omitUndefinedWarning('on');

    /**
     * Define a stateful component.
     * This function is a @@preprocessor.
     * String, [...*], Body, [...*] -> Program
     * @function component
     * @example (component foo a b '(+ a b) my-state 1)
     * @returns {Program}
     */
    dsl.definePreprocessor('component', {
        impure: true,
        implementation: function(list, program, cb) {
            if (!this.store.has('instances')) {
                this.store.set('instances', {});
            }

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

            var instanceTypeKey = 'instances.' + type;

            if (!this.store.has(instanceTypeKey)) {
                this.store.set(instanceTypeKey, {});
            }

            componentize(program, type, params, body, initial, this.store.get(instanceTypeKey));

            return cb(null, program);
        }
    });

    /**
     * Get a value from the component's state
     * String, String, String -> *
     * @function component.get
     * @example (component.get foo "1" bar.baz)
     * @returns {Anything}
     */
    dsl.defineFunction('component.get', {
        impure: true,
        signature: [['string','string','string'],'*'],
        implementation: function() {
            var args = this.args;
            var type = args.shift();
            var id = args.shift();
            var key = args.shift();

            var instanceTypeKey = 'instances.' + type;
            var instanceIdKey = instanceTypeKey + '.' + id;

            if (!this.store.has(instanceIdKey)) {
                return this.cb(new Error('Instance storage failed to initialize'));
            }

            var cb = this.cb;
            var state = this.store.get(instanceIdKey);
            
            return state.get(key, function(err, value, meta) {
                if (Array.isArray(value)) {
                    if (value.length > 1) value = ['list'].concat(value);
                    else value = {"'": value }; // HACK: Avoid irreducible list
                }
                return cb(err, value);
            });
        }
    });

    /**
     * Set a value in the component's state
     * String, String, String, * -> Null
     * @function component.set
     * @example (component.set foo "1" bar.baz 3)
     * @returns {Null}
     */
    dsl.defineFunction('component.set', {
        impure: true,
        signature: [['string','string','string','*'],'null'],
        implementation: function() {
            var args = this.args;
            var type = args.shift();
            var id = args.shift();
            var key = args.shift();
            var value = args.shift();

            var instanceTypeKey = 'instances.' + type;
            var instanceIdKey = instanceTypeKey + '.' + id;
            
            if (!this.store.has(instanceIdKey)) {
                return this.cb(new Error('Instance storage failed to initialize'));
            }

            var cb = this.cb;
            var state = this.store.get(instanceIdKey);
            var meta = null;

            return state.set(key, value, meta, function(err) {
                return cb(err);
            });
        }
    });

    /**
     * Listen for an event targeted to this component
     * String, String, String, String, List -> List
     * @function component.on
     * @example (component.on foo "1" my-event payload '(+ 1 2))
     * @returns {List}
     */
    dsl.defineFunction('component.on', {
        signature: [['string','string','string','string','list'],'list'],
        implementation: function() {
            var args = this.args;
            var type = args.shift();
            var id = args.shift();
            var name = args.shift();
            var payload = args.shift();
            var action = args.shift();
            var eventName = eventString(type, id, name);
            var out = ['event', eventName, payload, {"'": action}];
            return this.cb(null, out);
        }
    });

    /**
     * Convert an event string to a component-specific event string
     * String, String, String -> String
     * @function component.do
     * @example (component.do foo "1" my-event)
     * @returns {String}
     */
    dsl.defineFunction('component.do', {
        signature: [['string','string','string'],'string'],
        implementation: function() {
            var args = this.args;
            var type = args.shift();
            var id = args.shift();
            var name = args.shift();
            var eventName = eventString(type, id, name);
            return this.cb(null, eventName);
        }
    });

    return dsl;
};
