'use strict';

var CloneDeep = require('lodash.clonedeep');
var Lodash = require('lodash');
var RuniqParser = require('./../parser');

var LIST_TYPE = 'list';
var STRING_TYPE = 'string';
var NUMBER_TYPE = 'number';
var BOOL_TYPE = 'bool';
var ANY_TYPE = '*';
var REST_TYPE = '...';

var OBJECT_TYPE = 'object';
var QUOTE_KEY = "'";
var CATCH_ALL_EVENT_NAME = '*';
var COMPOSE_DELIMITER = '|>';

function makeMapping(signature, params) {
    var mapping = {};
    for (var i = 0; i < signature.length; i++) {
        mapping[signature[i]] = params[i];
    }
    return mapping;
}

function findLeftovers(signature, params) {
    var leftovers = [];
    for (var i = 0; i < signature.length; i++) {
        if (params[i] === undefined) {
            leftovers.push(signature[i]);
        }
    }
    return leftovers;
}

function makeExecutable(mapping, body, params) {
    return body.map(function(line) {
        if (Array.isArray(line)) {
            // Lambdas define their inner variables
            if (line[0] !== 'lambda') {
                return makeExecutable(mapping, line, params);
            }
        }
        // Need to handle quoted objects
        if (typeof line === OBJECT_TYPE) {
            if (line[QUOTE_KEY]) {
                line[QUOTE_KEY] = makeExecutable(mapping, line[QUOTE_KEY], params);
            }
            return line;
        }
        if (mapping[line] !== undefined) {
            var safe = mapping[line];
            if (Array.isArray(safe) || typeof safe === OBJECT_TYPE) {
                safe = CloneDeep(safe);
            }
            return safe;
        }
        return line;
    });
}

function populateReaction(reaction, payloadName, payload) {
    for (var i = 0; i < reaction.length; i++) {
        var el = reaction[i];
        if (Array.isArray(el)) {
            if (el[0] !== 'lambda') {
                populateReaction(el, payloadName, payload);
            }
        }
        if (el === payloadName) {
            reaction[i] = payload;
        }
    }
    return reaction;
}

function arrayMapper(name, impl, dsl) {
    var afterwardName = '_' + name + '-finalize'; // Yuck

    dsl.defineFunction(name, {
        signature: [[LIST_TYPE,LIST_TYPE],LIST_TYPE],
        implementation: function(a_collection, l_lambda, ret) {
            var iteratees = [];
            var originals = [];
            var i;
            for (i = 0; i < a_collection.length; i++) {
                iteratees.push(['call', {"'": l_lambda}, a_collection[i]]);
                originals.push(a_collection[i]);
            }
            var afterward = [];
            afterward.push(afterwardName);
            for (i = 0; i < iteratees.length; i++) {
                afterward.push(iteratees[i]);
            }
            afterward.push({"'": originals});
            return ret(null, afterward);
        }
    });

    dsl.defineFunction(afterwardName, {
        signature: [[LIST_TYPE,REST_TYPE],LIST_TYPE],
        implementation: function() {
            var args = this.args;
            var originals = args.pop();
            var results = args;
            var result = impl(originals, function(original, index) {
                return results[index];
            });
            return this.cb(null, {"'": result});
        }
    });
}

function lettifyList(name, what, list) {
    for (var i = 0; i < list.length; i++) {
        var token = list[i];
        if (Array.isArray(token)) {
            list[i] = lettifyList(name, what, token);
            continue;
        }
        if (typeof token === STRING_TYPE) {
            if (token === name) {
                list[i] = what;
                continue;
            }
        }
    }
    return list;
}

module.exports = function(dsl) {
    /**
     * Create a lambda and apply parameters
     * [...*], List, [...*] -> *
     * @function lambda
     * @example (lambda a b c '(body) 1 2 3)
     * @returns {Anything}
     */
    dsl.defineFunction('lambda', {
        signature: [true,ANY_TYPE],
        implementation: function() {
            var info = {
                signature: [],
                body: null,
                params: []
            };

            var args = this.args;
            var part = 'signature';
            var i;

            for (i = 0; i < args.length; i++) {
                var el = args[i];
                var isArray = Array.isArray(el);
                if (isArray) {
                    // Only consider the first array the body
                    if (!info.body) {
                        info.body = args[i];
                        part = 'params';
                        continue;
                    }
                }
                if (isArray) info[part].push({"'": args[i]});
                else info[part].push(args[i]);
            }

            var mapping = makeMapping(info.signature, info.params);
            var leftovers = findLeftovers(info.signature, info.params);
            var executable = makeExecutable(mapping, info.body, info.params);

            if (leftovers.length < 1) {
                return this.cb(null, executable);
            }
            var partial = ['lambda'];
            for (i = 0; i < leftovers.length; i++) {
                partial.push(leftovers[i]);
            }
            partial.push({"'": executable});
            return this.cb(null, {"'": partial});
        }
    });

    /**
     * Invoke a lambda with arguments
     * List, [...*] -> *
     * @function call
     * @example (call (lambda a b c '(body)) 1 2 3)
     * @returns {Anything}
     */
    dsl.defineFunction('call', {
        signature: [[LIST_TYPE,REST_TYPE],ANY_TYPE],
        implementation: function() {
            var args = this.args;
            var lambda = args.shift();
            var params = args.splice(0);
            return this.cb(null, lambda.concat(params));
        }
    });

    /**
     * Execute a block depending on a condition
     * Bool, *, String, * -> *
     * @function if
     * @example (if (true) '(do-true) else '(do-false))
     * @returns {Anything}
     */
    dsl.defineFunction('if', {
        signature: [[BOOL_TYPE,LIST_TYPE,STRING_TYPE,LIST_TYPE],ANY_TYPE],
        implementation: function(b_if_condition, l_if_block, s_else, l_else_block, ret) {
            var block = (b_if_condition) ? l_if_block : l_else_block;
            return ret(null, block);
        }
    });

    /**
     * Run a recursive lambda, passing it arguments
     * List, [...*] -> *
     * @function ycomb
     * @example (ycomb (lambda fn n '(- 1 (fn n))) 8)
     * @returns {Anything}
     */
    dsl.defineFunction('ycomb', {
        signature: [[LIST_TYPE,REST_TYPE],ANY_TYPE],
        implementation: function() {
            var args = this.args;
            var lambda = args.shift();
            var rest = args.splice(0);
            var safe = CloneDeep(lambda);
            lambda.push(safe);
            for (var i = 0; i < rest.length; i++) {
                lambda.push(rest[i]);
            }
            return this.cb(null, lambda);
        }
    });

    /**
     * Return the first argument from those given
     * [...*] -> *
     * @function identity
     * @example (identity 1 2 3 "a")
     * @returns {Anything}
     */
    dsl.defineFunction('identity', {
        signature: [true,ANY_TYPE],
        implementation: function() {
            return this.cb(null, this.args.shift());
        }
    });

    /**
     * Process through a stack of functions
     * List, [...*] -> *
     * @function stack
     * @example (stack (list '(+ 1 2) '(+ 3 4) '(+ 5 6)))
     * @returns {Anything}
     */
    dsl.defineFunction('stack', {
        signature: [[LIST_TYPE,REST_TYPE],ANY_TYPE],
        implementation: function() {
            var args = this.args;
            var stack = args.shift();
            var prevResult = args.shift();
            if (stack.length < 1) return this.cb(null, {"'": prevResult});
            var step = stack.shift();
            return this.cb(null, ['stack', {"'": stack}, step]);
        }
    });

    /**
     * Execute a sequence of functions in series
     * (Runiq's default execution is in parallel)
     * [...*] -> *
     * @function series
     * @example (series '(+ 1 2) '(+ 3 4) '(+ 5 6))
     * @returns {Anything}
     */
    dsl.defineFunction('series', {
        signature: [true,ANY_TYPE],
        implementation: function() {
            return this.cb(null, ['stack', {"'": this.args}]);
        }
    });

    /**
     * Alias for `series`
     * @function |>
     */
    dsl.aliasFunction('$', 'series');

    /**
     * Execute functions and return the last result
     * [...*] -> *
     * @function sequence
     * @example (sequence '(+ 1 2) '(+ 3 4) '(+ 5 6))
     * @returns {Anything}
     */
    dsl.defineFunction('sequence', {
        signature: [true,ANY_TYPE],
        implementation: function() {
            var args = this.args;
            var last = ['identity', args.pop()];
            var top = last;
            while (args.length > 0) {
                var next = ['identity', args.pop()];
                last.push(next);
                last = next;
            }
            return this.cb(null, top);
        }
    });

    /**
     * Pipeline syntax for composing functions
     * [...*] -> *
     * @function compose
     * @example (compose + 3 4 |> - 22 |> * 7)
     * @returns {Anything}
     */
    dsl.defineFunction('compose', {
        signature: [true,ANY_TYPE],
        implementation: function() {
            var args = this.args;
            var list = [];
            var top = list;
            for (var i = args.length - 1; i >= 0; i--) {
                var arg = args[i];
                if (arg !== COMPOSE_DELIMITER) {
                    list.unshift(arg);
                }
                else {
                    var inner = [];
                    list.push(inner);
                    list = inner;
                }
            }
            return this.cb(null, top);
        }
    });

    /**
     * Alias for `compose`
     * @function |>
     */
    dsl.aliasFunction(COMPOSE_DELIMITER, 'compose');

    /**
     * Parse and evaluate a string as Runiq code
     * String -> List
     * @function eval
     * @example (eval "(+ 1 2)")
     * @returns {List}
     */
    dsl.defineFunction('eval', {
        signature: [[STRING_TYPE],LIST_TYPE],
        implementation: function(s_source, ret) {
            try {
                var ast = RuniqParser.parse(RuniqParser.lex(s_source));
                return ret(null, ast);
            }
            catch (e) {
                return ret(e);
            }
        }
    });

    /**
     * Run code only if the name matches the current event
     * String, String, List -> *
     * @function event
     * @example (event foo payload '(+ 1 payload))
     * @returns {Anything}
     */
    dsl.defineFunction('event', {
        signature: [[STRING_TYPE,STRING_TYPE,LIST_TYPE],ANY_TYPE],
        implementation: function(s_event_name, s_payload_name, l_reaction, ret) {
            if (!this.event) return ret(null);
            if (s_event_name === CATCH_ALL_EVENT_NAME || this.event.name === s_event_name) {
                var populated = populateReaction(l_reaction, s_payload_name, this.event.payload);
                return ret(null, populated);
            }
            return ret(null);
        }
    });

    /**
     * Execute a list after the given amount of time
     * Number, List -> *
     * @function after
     * @example (after 1000 '(+ 1 2))
     * @returns {Anything}
     */
    dsl.defineFunction('after', {
        signature: [[NUMBER_TYPE,LIST_TYPE],ANY_TYPE],
        implementation: function(ms, list, ret) {
            setTimeout(function() {
                return ret(null, list);
            }, parseInt(ms));
        }
    });

    /**
     * Expand occurrences of a token into a list form
     * Note: This is not a global 'let'; only the selfsame
     * list and accessible descendents are transformed
     * String, [...*] -> List
     * @function let
     * @example (let foo '(+ 1 2) + foo 3)
     * @returns {Anything}
     */
    dsl.defineFunction('let', {
        signature: [[STRING_TYPE,REST_TYPE],LIST_TYPE],
        implementation: function() {
            var list = this.list;
            list.shift();
            var name = list.shift();
            var what = list.shift();
            var modified = lettifyList(name, what, list);
            return this.cb(null, modified);
        }
    });

    /**
     *
     *
     * @function list.find-index
     * @example (list.find-index)
     * @returns {Number}
     */
    arrayMapper('list.find-index', Lodash.findIndex, dsl);
    /**
     *
     *
     * @function list.find-last-index
     * @example (list.find-last-index)
     * @returns {Number}
     */
    arrayMapper('list.find-last-index', Lodash.findLastIndex, dsl);
    /**
     *
     *
     * @function list.remove
     * @example (list.remove)
     * @returns {List}
     */
    arrayMapper('list.remove', Lodash.remove, dsl);
    /**
     *
     *
     * @function list.count-by
     * @example (list.count-by)
     * @returns {Hash}
     */
    arrayMapper('list.count-by', Lodash.countBy, dsl);
    /**
     *
     *
     * @function'list.every
     * @example (list.every)
     * @returns {List}
     */
    arrayMapper('list.every', Lodash.every, dsl);
    /**
     *
     *
     * @function list.filter
     * @example (list.filter)
     * @returns {List}
     */
    arrayMapper('list.filter', Lodash.filter, dsl);
    /**
     *
     *
     * @functio 'list.find
     * @example (list.find)
     * @returns {Anything}
     */
    arrayMapper('list.find', Lodash.find, dsl);
    /**
     *
     *
     * @function list.find-last
     * @example (list.find-last)
     * @returns {Anything}
     */
    arrayMapper('list.find-last', Lodash.findLast, dsl);
    /**
     *
     *
     * @function list.group-by
     * @example (list.group-by)
     * @returns {List}
     */
    arrayMapper('list.group-by', Lodash.groupBy, dsl);
    /**
     *
     *
     * @function list.index-by
     * @example (list.index-by)
     * @returns {List}
     */
    arrayMapper('list.index-by', Lodash.indexBy, dsl);
    /**
     *
     *
     * @functin 'list.map
     * @example (list.map)
     * @returns {Hash}
     */
    arrayMapper('list.map', Lodash.map, dsl);
    /**
     *
     *
     * @function list.partition
     * @example (list.partition)
     * @returns {List}
     */
    arrayMapper('list.partition', Lodash.partition, dsl);
    /**
     *
     *
     * @function list.reduce
     * @example (list.reduce)
     * @returns {Anything}
     */
    arrayMapper('list.reduce', Lodash.reduce, dsl);
    /**
     *
     *
     * @function list.reduce-right
     * @example (list.reduce-right)
     * @returns {Anything}
     */
    arrayMapper('list.reduce-right', Lodash.reduceRight, dsl);
    /**
     *
     *
     * @function list.reject
     * @example (list.reject)
     * @returns {List}
     */
    arrayMapper('list.reject', Lodash.reject, dsl);
    /**
     *
     *
     * @function list.some
     * @example (list.some)
     * @returns {List}
     */
    arrayMapper('list.some', Lodash.some, dsl);
    /**
     *
     *
     * @function list.sort-by
     * @example (list.sort-by)
     * @returns {List}
     */
    arrayMapper('list.sort-by', Lodash.sortBy, dsl);

    return dsl;
};
