'use strict';

var Assign = require('lodash.assign');
var CloneDeep = require('lodash.clonedeep');
var Console = require('./console');
var IsEqual = require('lodash.isequal');
var Library = require('./library');
var Storage = require('./storage');
var Types = require('./types');

var JS_STRING_TYPE = 'string';

var RUNIQ_INDEX_OF_FUNCTION_NAME = 0;
var RUNIQ_INDEX_OF_FUNCTION_ARGUMENTS = 1;
var RUNIQ_QUOTED_ENTITY_PROP_NAME = "'";
var RUNIQ_RESERVED_QUOTE_FN_NAMES = {};
RUNIQ_RESERVED_QUOTE_FN_NAMES[RUNIQ_QUOTED_ENTITY_PROP_NAME] = true;
RUNIQ_RESERVED_QUOTE_FN_NAMES['quote'] = true;

/**
 * An instance of Interpreter can execute a Runiq AST. At a high level,
 * it performs instructions defined in the AST by mapping function
 * names to function entries in the passed-in Library instance
 *
 * The interpreter also manages ordering operations in accordance with
 * the three basic control patterns available in Runiq:
 *   - Asynchronous function composition, via nesting:
 *       ['last', ['third', ['second', ['first']]]]
 *   - asynchronous function sequencing
 *       [['first'],['second'],['third'],['last']]
 *   - quoting (witholding lists for later execution)
 *       ['quote', ['save', 'me', 'for', 'later']]
 *
 * @class Interpreter
 * @constructor
 * @param [library] {Object} - Library dictionary
 * @param [options] {Object} - Options object
 */
function Interpreter(library, options, storage) {
    // What lengths I've gone to to use only 7-letter properties...
    this.library = new Library(CloneDeep(library || {}));
    this.options = Assign({}, Interpreter.DEFAULT_OPTIONS, options);
    this.balance = this.options.balance;
    this.timeout = Date.now() + this.options.timeout;
    this.seednum = this.options.seed || Math.random();
    this.counter = this.options.count || 0;
    this.storage = storage || new Storage();

    var outputs = this.outputs = [];
    if (this.options.doCaptureConsole) {
        Console.capture(function(type, messages) {
            outputs.push({ type: type, messages: messages });
        });
    }
};

var DEFAULT_TX_PRICE = -1;

Interpreter.DEFAULT_OPTIONS = {
    debug: false,
    balance: Infinity,
    timeout: Infinity,
    quoteTransaction: DEFAULT_TX_PRICE,
    invokeTransaction: DEFAULT_TX_PRICE,
    sequenceTransaction: DEFAULT_TX_PRICE,
    doIrreducibleListCheck: true,
    doRuntimeTypeCheck: true,
    doPreflightTypeCheck: true,
    functionMissingName: 'function-missing',
    doAllowImpureFunctions: true,
    doWarnOnImpureFunctions: true,
    doCaptureConsole: false
};

/**
 * Execute the given Runiq AST, and return the final result of the
 * computation (or error) to the given callback function.
 *
 * @method run
 * @param [list] {Array} - Runiq AST
 * @param [argv] {Array} - Args to append to the main program list
 * @param [event] {Object|null} - Event object with `.name` and `.payload`
 * @param [cb] {Function} - Node-style callback function
 */
Interpreter.prototype.run = function(list, argv, event, cb) {
    this.counter = 0;
    if (this.options.debug) Console.printDebug(this, list);
    if (this.options.doPreflightTypeCheck) {
        var typeError = Types.preflightCheck(this, list, this.library, {});
        if (typeError) return cb(_wrapError(typeError, this, list));
    }
    return exec(this, list, argv, event, cb);
};

/**
 * Execute only one computation of the given list, returning the
 * modified program AST (or error) to the given callback.
 *
 * @method step
 * @param [list] {Array} - Runiq AST
 * @param [argv] {Array} - Args to append to the main program list
 * @param [event] {Object|null} - Event object with `.name` and `.payload`
 * @param [cb] {Function} - Node-style callback function
*/
Interpreter.prototype.step = function(list, argv, event, cb) {
    if (this.options.debug) Console.printDebug(this, list);
    return step(this, list, argv, event, cb);
};

/**
 * Return a snapshot of the internal state of the interpreter,
 * including any objects which may have been added to the storage.
 *
 * @method state
 * @returns {Object}
*/
Interpreter.prototype.state = function() {
    return {
        seednum: this.seednum,
        counter: this.counter,
        storage: this.storage.export()
    };
};

/**
 * Return a snapshot of any outputs that may have been logged
 * to the interpreter.
 *
 * @method outputs
 * @returns {Object}
*/
Interpreter.prototype.output = function(doSplice) {
    if (doSplice) return this.outputs.splice(0);
    else return this.outputs;
};

// Update balance with debit/credit; return T/F if script can continue.
function ok(inst, transaction) {
    if (transaction === undefined) transaction = 0;
    inst.balance = inst.balance + transaction;
    var _ok = inst.balance > 0 && Date.now() < inst.timeout;
    return _ok;
}

// Used for early exiting the program on timeout/negative balance
function exit(inst, state, fin) {
    return fin(_wrapError(_outOfGasError(inst), inst, state), state);
}

// Recursively execute a list in the context of the passed-in instance.
function exec(inst, raw, argv, event, fin) {
    var after = nextup(inst, raw, argv, event, fin);
    return step(inst, raw, argv, event, passthrough(after));
}

// Return callback to produce a usable value, or continue execution
function nextup(inst, orig, argv, event, cb) {
    return function nextupCallback(err, data) {
        if (err) return cb(err, null);
        if (_isQuoted(data)) return cb(null, _unquote(data));
        if (_isValue(data)) return cb(null, _entityToValue(data, inst.library));
        // Remove any nulls or undefineds from the list
        var compact = _compactList(data);
        // Allow the programmer to opt out for _minor_ perf gains
        if (inst.options.doIrreducibleListCheck) {
            // If no change, we'll keep looping forever, so just return
            if (IsEqual(orig, compact)) {
                Console.printWarning(inst, 'Detected irreducible list; exiting...');
                return cb(null, compact);
            }
        }
        return exec(inst, compact, argv, event, cb);
    };
}

// Perform one step of execution to the given list, and return the AST.
function step(inst, raw, argv, event, fin) {
    if (!_isPresent(raw)) return fin(_wrapError(_badInput(inst), inst, raw), null);
    var flat = _denestList(raw);
    preproc(inst, flat, argv, event, function postPreproc(err, data) {
        if (err) return fin(err);
        var list = _safeObject(data);
        return branch(inst, list, argv, event, fin);
    });
}

// Run any preprocessors that are present in the program, please
function preproc(inst, prog, argv, event, fin) {
    var info = findPreprocs(inst, prog, [], []);
    function step(procs, parts, list) {
        if (!procs || procs.length < 1) {
            return fin(null, list);
        }
        var part = parts.shift();
        var proc = procs.shift();
        var ctx = {
            id: inst.counter,
            seed: inst.seednum,
            store: inst.storage,
            argv: argv,
            event: event
        };
        return proc.call(ctx, part, list, function(err, _list) {
            if (err) return fin(err);
            return step(procs, parts, _list);
        });
    }
    return step(info.procs, info.parts, info.list);
}

// Find all preprocessors in the given program
function findPreprocs(inst, list, procs, parts) {
    if (Array.isArray(list)) {
        while (list.length > 0) {
            var part = list.shift();
            // Preprocessors must be the first elements in the list;
            // if we hit any non-preprocessors, immediately assume
            // we're done preprocessing and can move on with execution
            // This is as opposed to doing something like hoisting
            if (!_isFunc(part)) {
                list.unshift(part);
                break;
            }
            var name = _getFnName(part);
            var lookup = inst.library.lookupPreprocessor(name);

            if (!lookup) {
                list.unshift(part);
                break;
            }
            if (lookup) {
                parts.push(part);
                procs.push(lookup);
            }
        }
    }
    return {
        list: list,
        parts: parts,
        procs: procs
    };
}

// Force flow through a set timeout prior to executing the given list
function branch(inst, list, argv, event, fin) {
    if (argv.length > 0) {
        // Append the argv for programs that return
        // a list that accepts them as parameters
        list = list.concat(argv.splice(0));
    }
    // HACK HACK HACK. OK, so, when dealing with deeply recursive
    // functions in Runiq, we may hit an error where we exceed the
    // available call stack size. A setTimeout will get us a fresh
    // call stack, but at serious perf expense, since setTimeouts
    // end up triggered 4 ms later. So what I'm doing here is
    // trying to call unload, and if that gives an error, then
    // falling back to setTimeout method. This technique has an
    // incredible benefit, speeding up Runiq programs by 50X or so.
    // However, it could prove unworkable depending on browser support
    // for catching call-stack errors.
    try {
        return unload(inst, list, argv, event, fin);
    }
    catch (e) {
        return setTimeout(function branchCallback() {
            Console.printWarning(inst, "Caught call stack error: " + e);
            return unload(inst, list, argv, event, fin);
        }, 0);
    }
}

// Delegate to a subprocessor based on the list type: quote, list, seq
function unload(inst, list, argv, event, fin) {
    inst.counter++;
    if (inst.options.debug) Console.printDebug(inst, list);
    if (_isQuote(list)) {
        return quote(inst, list, argv, event, fin);
    }
    if (_isFunc(list)) {
        if (_callReady(list)) {
            return invoke(inst, list, argv, event, fin);
        }
    }
    return sequence(inst, list, argv, event, fin);
}

// Given a quote list, return a quote object for later use
function quote(inst, list, argv, event, fin) {
    // Remember to charge for the 'quote' function as a transaction
    if (!ok(inst, inst.options.quoteTransaction)) return exit(inst, list, fin);
    var entity = list[list.length - 1];
    if (_isValue(entity)) return fin(null, entity);
    var quotation = {};
    quotation[RUNIQ_QUOTED_ENTITY_PROP_NAME] = entity;
    return fin(null, quotation);
}

// Execute a list that is a 'function' (i.e. begins with a keyword)
function invoke(inst, list, argv, event, fin) {
    // All invocations cost some amount just for running
    if (!ok(inst, inst.options.invokeTransaction)) return exit(inst, list, fin);
    var name = _getFnName(list);
    var args = _getFnArgs(list);
    var library = inst.library;
    var lookup;

    // Prepare the arguments and context
    _unquoteArgs(args);
    _valuefyArgs(args, library);
    var ctx = {
        id: inst.counter,
        seed: inst.seednum,
        store: inst.storage,
        name: name,
        list: list,
        args: args,
        argv: argv,
        event: event,
        cb: fin
    };

    // Function (or global fallback)
    lookup = library.lookupFunction(name);
    if (!_isPresent(lookup)) {
        var missing = inst.options.functionMissingName;
        var fallback = library.lookupFunction(missing);
        if (fallback) {
            lookup = fallback;
            name = missing;
        }
    }
    if (lookup) {
        // The library may define function prices
        var price = library.lookupPrice(name);
        if (_isPresent(price)) {
            if (!ok(inst, -price)) {
                return exit(inst, list, fin);
            }
        }
        // Type checking
        if (inst.options.doRuntimeTypeCheck) {
            var typeError = Types.runtimeCheck(inst, name, library, args);
            if (typeError) return fin(_wrapError(typeError, inst, list), null);
        }
        if (library.isImpureFunction(name)) {
            if (!inst.options.doAllowImpureFunctions) {
                return fin(_wrapError(_impurityError(inst), inst, list), null);
            }
            if (inst.options.doWarnOnImpureFunctions) {
                Console.printWarning(inst, 'Function `' + name + '` is labeled impure');
            }
        }
        var invokeArgs = args.concat(passthrough(fin));
        return lookup.apply(ctx, invokeArgs);
    }

    // Type conversion
    lookup = library.lookupTypeCaster(name);
    if (lookup) {
        return fin(null, lookup.apply(ctx, args));
    }

    // Constant
    lookup = library.lookupConstant(name);
    if (_isPresent(lookup)) {
        if (args.length < 1) return fin(null, lookup);
        list[RUNIQ_INDEX_OF_FUNCTION_NAME] = lookup;
        return fin(null, list);
    }

    // Without any args present, return the string
    if (args.length < 1) return fin(null, name);

    // If no other option, just return the entire list
    return fin(null, list);
}

// Callback wrapper for passing data through library functions (currently no-op)
function passthrough(fin) {
    return function passthroughCallback(err, data) {
        return fin(err, data);
    };
}

// Get values for each list element. Subproc any elements that are lists
function sequence(inst, elems, argv, event, fin) {
    if (elems.length < 1) return fin(null, elems);
    // Running a sequence also costs some amount per element to sequence
    if (!ok(inst, inst.options.sequenceTransaction * elems.length)) {
        return exit(inst, list, fin);
    }
    return parallel(inst, elems, argv, event, fin, postSequence);
}

// Run the sequence in parallel
function parallel(inst, elems, argv, event, fin, _postSequence) {
    var total = elems.length;
    var complete = 0;
    function check(err, list) {
        if (total === ++complete) {
            if (!_isFunc(list)) return _postSequence(list, fin);
            return fin(err, list);
        }
    }
    for (var i = 0; i < total; i++) {
        if (_isList(elems[i])) {
            var after = edit(inst, elems, i, argv, event, check);
            branch(inst, elems[i], argv, event, after);
        }
        else {
            check(null, elems);
        }
    }
}

// Fire this function after completing a sequence of lists
function postSequence(elems, fin) {
    // Treat the final value of a sequence as its return value
    var toReturn = elems[elems.length - 1];
    return fin(null, toReturn);
}

// Return a function to patch a subroutine result into a parent list
function edit(inst, list, index, argv, event, fin) {
    return function editCallback(err, data) {
        if (err) return fin(err);
        list[index] = data;
        return fin(null, list);
    };
}

// Convert 'const' args to their values when they are defined
function _valuefyArgs(args, lib) {
    for (var i = 0; i < args.length; i++) {
        args[i] = _entityToValue(args[i], lib);
    }
}

// Unquote the arguments. This modifies the arguments in place
function _unquoteArgs(args) {
    for (var i = 0; i < args.length; i++) {
        if (_isQuoted(args[i])) args[i] = _unquote(args[i]);
    }
}

// Convert a given entity to a value, if one is defined in the lib
function _entityToValue(item, lib) {
    if (typeof item === JS_STRING_TYPE) {
        // Only JSON-serializable entities may be put into a list
        var constant = lib.lookupConstant(item);
        if (constant !== undefined) return constant;
    }
    // Also unquote any item we got that also happens to be a quote
    if (item && item[RUNIQ_QUOTED_ENTITY_PROP_NAME]) {
        return item[RUNIQ_QUOTED_ENTITY_PROP_NAME];
    }
    return item;
}

function _outOfGasError(inst) {
    var error = 'Script timed out and/or arrived at a negative balance';
    return new Error(error);
}

function _badInput(inst) {
    var error = 'Input provided was blank or malformed';
    return new Error(error);
}

function _impurityError(inst) {
    var error = 'Impure functions are not permitted in this program';
    return new Error(error);
}

function _getFnArgs(list) {
    return list.slice(RUNIQ_INDEX_OF_FUNCTION_ARGUMENTS, list.length);
}

function _getFnName(list) {
    if (_isFunc(list)) {
        return list[RUNIQ_INDEX_OF_FUNCTION_NAME];
    }
    return null;
}

function _callReady(list) {
    var isFunc = _isFunc(list);
    var argsReady = _argsReady(list);
    return isFunc && argsReady;
}

function _argsReady(list) {
    for (var i = RUNIQ_INDEX_OF_FUNCTION_ARGUMENTS; i < list.length; i++) {
        if (_isList(list[i])) {
            if (list[i].length > 0) {
                return false;
            }
        }
    }
    return true;
}

function _unquote(thing) {
    return thing[RUNIQ_QUOTED_ENTITY_PROP_NAME];
}

function _isQuoted(thing) {
    if (!_isPresent(thing)) return false;
    return _isPresent(thing[RUNIQ_QUOTED_ENTITY_PROP_NAME]);
}

function _isQuote(list) {
    return (_getFnName(list) in RUNIQ_RESERVED_QUOTE_FN_NAMES);
}

function _denestList(list) {
    if (_isList(list) && list.length === 1) {
        if (_isList(list[0])) {
            return _denestList(list[0]);
        }
    }
    return list;
}

function _compactList(list) {
    var compact = [];
    for (var i = 0; i < list.length; i++) {
        if (_isPresent(list[i])) {
            compact.push(list[i]);
        }
    }
    return compact;
}

function _isFunc(list) {
    return Array.isArray(list) &&
           typeof list[RUNIQ_INDEX_OF_FUNCTION_NAME] === JS_STRING_TYPE;
}

function _isList(thing) {
    return Array.isArray(thing);
}

function _isEmptyList(thing) {
    return _isList(thing) && thing.length < 1;
}

function _isValue(thing) {
    return _isEmptyList(thing) || !_isList(thing);
}

function _isPresent(thing) {
    return thing !== undefined && thing !== null;
}

function _safeObject(thing) {
    return CloneDeep(thing);
}

function _wrapError(error, inst, state) {
    Console.printError(inst, error.message, state);
    return error;   
}

module.exports = Interpreter;
