'use strict';

var CryptoJS = require('crypto-js');
var JSONStableStringify = require('json-stable-stringify');
var Lodash = require('lodash');
var LogLevel = require('loglevel');
var Moment = require('moment');
var Sprintf = require('sprintf-js');
var SeedRandom = require('seedrandom');
var URLParse = require('url-parse');

var BOOL_TYPE = 'bool';
var STRING_TYPE = 'string';
var NULL_TYPE = 'null';
var LIST_TYPE = 'list';
var HASH_TYPE = 'hash';
var ENTITY_TYPE = 'entity';
var NUMBER_TYPE = 'number';

var JS_UNDEF = 'undefined';
var ANY_TYPE = '*';
var REST_TYPE = '...';
var BLANK = '';
var B64 = 'base64';
var UNICODE_PREFIX = '0x';
var UNICODE_REPLACER_RE = /%([0-9A-F]{2})/g;
var TEMPLATE_REGEXP = /[^\\\s\S]*?\$\{(.*?)\}/;
var IS_BROWSER = typeof window !== JS_UNDEF;

function _quotize(arg) {
    return { "'": arg };
}

function _hashize(args) {
    var hash = {};
    for (var i = 0; i < args.length; i += 2) {
        var key = args[i];
        var value = args[i + 1];
        hash[key] = value;
    }
    return hash;
}

function _listize(args) {
    var list = _quotize(args);
    return list;
}

function _getRegexpMatches(s, re) {
    var matches = [];
    var match;
    while (match = regex.exec(string)) {
        matches.push(match[1]);
    }
    return matches;
}

var _atob = (typeof atob === JS_UNDEF)
    ? function(s) {
        return new Buffer(s, B64).toString('binary');
    }
    : atob;

var _btoa = (typeof btoa === JS_UNDEF)
    ? function(s) {
        return new Buffer(s).toString(B64);
    }
    : btoa;

module.exports = function(dsl) {
    /**
     * Types
     */

    /**
     * Convert the argument to a number
     * * -> Number
     * @function number
     * @example (number "1")
     * @returns {Number}
     */
    dsl.defineType(NUMBER_TYPE, {
        cast: function(entity) {
            return Number(entity);
        }
    });

    /**
     * Convert the argument to a boolean
     * * -> Bool
     * @function bool 
     * @example (bool 1)
     * @returns {Bool}
     */
    dsl.defineType(BOOL_TYPE, {
        cast: function(entity) {
            return !!entity;
        }
    });

    /**
     * Convert the argument to a string
     * * -> String
     * @function string
     * @example (string 123)
     * @returns {String}
     */
    dsl.defineType(STRING_TYPE, {
        cast: function(entity) {
            return entity + BLANK;
        }
    });

    /**
     * Convert the argument to a null
     * * -> Null
     * @function null 
     * @example (null 1)
     * @returns {Null}
     */
    dsl.defineType(NULL_TYPE, {
        cast: function(entity) {
            return null;
        }
    });

    /**
     * Convert the arguments to a list
     * [...*] -> List
     * @function list
     * @example (list 1 2 3 4)
     * @returns {List}
     */
    dsl.defineType(LIST_TYPE, {
        cast: function(entity) {
            return _listize(this.args);
        }
    });

    /**
     * Convert the arguments to a hash
     * [...*] -> Hash
     * @function hash
     * @example (hash key1 val1 key2 val2 ...)
     * @returns {Hash}
     */
    dsl.defineType(HASH_TYPE, {
        cast: function(entity) {
            return _hashize(this.args);
        }
    });

    dsl.aliasType('#', HASH_TYPE);

    /**
     * Return the given argument (i.e., a no-op type)
     * * -> *
     * @function entity
     * @example (entity 1)
     * @returns {Anything}
     */
    dsl.defineType(ENTITY_TYPE, {
        cast: function(entity) {
            return entity;
        }
    });

    /**
     * Constants
     */

    /**
     * Gives `true`
     * @constant true
     * @example (foo true)
     */
    dsl.defineConstant('true', true);
    /**
     * Gives `false`
     * @constant false
     * @example (foo false)
     */
    dsl.defineConstant('false', false);
    /**
     * Gives 1.618...
     * @constant PHI
     * @example (foo PHI)
     */
    dsl.defineConstant('PHI', 1.618033988);
    /**
     * Gives 3.141...
     * @constant PI
     * @example (foo PI)
     */
    dsl.defineConstant('PI', Math.PI);
    /**
     * Gives 2.718...
     * @constant E
     * @example (foo E)
     */
    dsl.defineConstant('E', Math.E);
    /**
     * Gives 1.434...
     * @constant LOG10E
     * @example (foo LOG10E)
     */
    dsl.defineConstant('LOG10E', Math.LOG10E);
    /**
     * Gives 0.735...
     * @constant LOG2E
     * @example (foo LOG2E)
     */
    dsl.defineConstant('LOG2E', Math.LOG2E);
    /**
     * Gives 2.302...
     * @constant LN10
     * @example (foo LN10)
     */
    dsl.defineConstant('LN10', Math.LN10);
    /**
     * Gives 0.693...
     * @constant LN2
     * @example (foo LN2)
     */
    dsl.defineConstant('LN2', Math.LN2);
    /**
     * Gives 6.283...
     * http://tauday.com/tau-manifesto
     * @constant TAU
     * @example (foo TAU)
     */
    dsl.defineConstant('TAU', Math.PI * 2);

    /**
     * Env
     */

    /**
     * Gives `true` if the program is running in the browser
     * @constant env.browser?
     * @example (foobar env.browser?)
     * @returns {Bool}
     */
    dsl.defineConstant('env.browser?', IS_BROWSER);

    /**
     * Returns the current ARGV (an array of program arguments)
     * _ -> List
     * @function argv
     * @example (argv)
     * @returns {List}
     */
    dsl.defineFunction('argv', {
        signature: [false, LIST_TYPE],
        implementation: function(cb) {
            return cb(null, _quotize(this.argv));
        }
    });

    /**
     * Errors
     */

    /**
     * Ends the program with an error
     * String -> Error!
     * @function error.throw
     * @example (error.throw)
     * @returns {Error}
     */
    dsl.defineFunction('error.throw', {
        signature: [[STRING_TYPE],NULL_TYPE],
        implementation: function(s_error_message, ret) {
            return ret(new Error(s_error_message));
        }
    });

    dsl.aliasFunction('error.raise', 'error.throw');

    /**
     * Assert
     */

    /**
     * Assert the given argument is truthy, or error
     * * -> Null|Error!
     * @function assert
     * @example (assert 1)
     * @returns {Null|Error}
     */
    dsl.defineFunction('assert', {
        signature: [[ANY_TYPE],NULL_TYPE],
        implementation: function(e_value, ret) {
            if (!e_value) {
                var msg = 'Runiq: Assertion failed!';
                return ret(new Error(msg));
            }
            return ret(null);
        }
    });

    /**
     * Assert the given argument exists, or error
     * * -> Null|Error!
     * @function assert.exists
     * @example (assert.exists 1)
     * @returns {Null|Error}
     */
    dsl.defineFunction('assert.exists', {
        signature: [[ANY_TYPE],NULL_TYPE],
        implementation: function(e_value, ret) {
            if (e_value !== null && e_value !== undefined) {
                var msg = 'Runiq: Existence assertion failed!';
                return ret(new Error(msg));
            }
            return ret(null);
        }
    });

    /**
     * Assert the given argument doesn't exist, or error
     * * -> Null|Error!
     * @function assert.not-exists
     * @example (assert.not-exists null)
     * @returns {Null|Error}
     */
    dsl.defineFunction('assert.not-exists', {
        signature: [[ANY_TYPE],NULL_TYPE],
        implementation: function(e_value, ret) {
            if (e_value === null || e_value === undefined) {
                var msg = 'Runiq: Nonexistence assertion failed!';
                return ret(new Error(msg));
            }
            return ret(null);
        }
    });

    /**
     * Assert the given arguments are equal, or error
     * *, * -> Null|Error!
     * @function assert.equal
     * @example (assert.equal 1 1)
     * @returns {Null|Error}
     */
    dsl.defineFunction('assert.equal', {
        signature: [[ANY_TYPE,ANY_TYPE],NULL_TYPE],
        implementation: function(e_value, e_comparison, ret) {
            if (e_value !== e_comparison) {
                var msg = 'Runiq: Equality assertion failed!';
                return ret(new Error(msg));
            }
            return ret(null);
        }
    });

    /**
     * Assert the given arguments are equal, or error
     * *, * -> Null|Error!
     * @function assert.not-equal
     * @example (assert.not-equal 1 2)
     * @returns {Null|Error}
     */
    dsl.defineFunction('assert.not-equal', {
        signature: [[ANY_TYPE,ANY_TYPE],NULL_TYPE],
        implementation: function(e_value, e_comparison, ret) {
            if (e_value === e_comparison) {
                var msg = 'Runiq: Inequality assertion failed!';
                return ret(new Error(msg));
            }
            return ret(null);
        }
    });

    /**
     * Assert the given argument is of the given type, or error
     * *, String -> Null|Error!
     * @function assert.type
     * @example (assert.type 1 number)
     * @returns {Null|Error}
     */
    dsl.defineFunction('assert.type', {
        signature: [[ANY_TYPE,STRING_TYPE],NULL_TYPE],
        implementation: function(e_value, s_type, ret) {
            if (typeof e_value !== s_type) {
                var msg = 'Runiq: Type assertion failed!';
                return ret(new Error(msg));
            }
            return ret(null);
        }
    });

    /**
     * Assert the given argument is not of the given type, or error
     * *, String -> Null|Error!
     * @function assert.not-type
     * @example (assert.not-type 1 string)
     * @returns {Null|Error}
     */
    dsl.defineFunction('assert.not-type', {
        signature: [[ANY_TYPE,STRING_TYPE],NULL_TYPE],
        implementation: function(e_value, s_type, ret) {
            if (typeof e_value === s_type) {
                var msg = 'Runiq: Not-type assertion failed!';
                return ret(new Error(msg));
            }
            return ret(null);
        }
    });

    /**
     * Console
     */

    /**
     * Print the given message to the console
     * String -> Null
     * @function print
     * @example (print "hello")
     * @returns {Null}
     */
    dsl.defineFunction('print', {
        signature: [[STRING_TYPE],NULL_TYPE],
        implementation: function(s_message, ret) {
            console.log(s_message);
            return ret(null);
        }
    });

    /**
     * Print the given string, with the given formatting arguments
     * String, [...*] -> Null
     * @function sprintf
     * @example (sprintf "hi %s %s %s" 1 2 3)
     * @returns {Null}
     */
    dsl.defineFunction('sprintf', {
        signature: [[STRING_TYPE,REST_TYPE],NULL_TYPE],
        implementation: function() {
            var args = Array.prototype.slice.call(arguments);
            var cb = args.pop();
            var msg = args.shift();
            var rest = args;
            Sprintf.sprintf.apply(Sprintf.sprintf, [].concat(msg).concat(rest));
            return cb(null);
        }
    });

    /**
     * Print the given string with the given format list
     * String, String -> Null
     * @function vprintf
     * @example (vprintf "hello %s %s %s" '(1 2 3))
     * @returns {Null}
     */
    dsl.defineFunction('vprintf', {
        signature: [[STRING_TYPE,LIST_TYPE],NULL_TYPE],
        implementation: function(s_message, a_formats, ret) {
            Sprintf.vprintf(s_message, a_formats);
            return ret(null);
        }
    });

    /**
     * Globally set the logger level
     * * -> Null
     * @function logger.level
     * @example (logger.level info)
     * @returns {Null}
     */
    dsl.defineFunction('logger.level', {
        signature: [[ANY_TYPE],NULL_TYPE],
        implementation: function(l, ret) {
            LogLevel.setLevel(l);
            return ret(null);
        }
    });

    /**
     * Output a message
     * * -> *
     * @function logger.trace
     * @example (logger.trace "wha happen")
     * @returns {Null}
     */
    dsl.defineFunction('logger.trace', {
        signature: [[ANY_TYPE],NULL_TYPE],
        implementation: function(a, ret) {
            LogLevel.trace(a);
            return ret(n);
        }
    });

    /**
     * Output a debug message
     * * -> *
     * @function logger.debug
     * @example (logger.debug "hmm")
     * @returns {Null}
     */
    dsl.defineFunction('logger.debug', {
        signature: [[ANY_TYPE],NULL_TYPE],
        implementation: function(a, ret) {
            LogLevel.debug(a);
            return ret(null);
        }
    });

    /**
     * Output a info message
     * * -> *
     * @function logger.info
     * @example (logger.info "howdy")
     * @returns {Null}
     */
    dsl.defineFunction('logger.info', {
        signature: [[ANY_TYPE],NULL_TYPE],
        implementation: function(a, ret) {
            LogLevel.info(a);
            return ret(null);
        }
    });

    /**
     * Output a warning message
     * * -> *
     * @function logger.warn
     * @example (logger.warn "uh-oh")
     * @returns {Null}
     */
    dsl.defineFunction('logger.warn', {
        signature: [[ANY_TYPE],NULL_TYPE],
        implementation: function(a, ret) {
            LogLevel.warn(a);
            return ret(null);
        }
    });

    /**
     * Output an error message
     * * -> *
     * @function logger.error
     * @example (logger.error "oops")
     * @returns {Null}
     */
    dsl.defineFunction('logger.error', {
        signature: [[ANY_TYPE],NULL_TYPE],
        implementation: function(a, ret) {
            LogLevel.error(a);
            return ret(null);
        }
    });

    /**
     * Number
     */

    /**
     * Add two numbers
     * Number, Number -> Number
     * @function +
     * @example (+ 1 2)
     * @returns {Number}
     */
    dsl.defineFunction('+', {
        signature: [[NUMBER_TYPE,NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_operand1, n_operand2, ret) {
            return ret(null, n_operand1 + n_operand2);
        }
    });

    /**
     * Subtract the second number from the first
     * Number, Number -> Number
     * @function -
     * @example (- 3 1)
     * @returns {Number}
     */
    dsl.defineFunction('-', {
        signature: [[NUMBER_TYPE,NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_operand1, n_operand2, ret) {
            return ret(null, n_operand1 - n_operand2);
        }
    });

    /**
     * Multiply two numbers
     * Number, Number -> Number
     * @function *
     * @example (* 3 4)
     * @returns {Number}
     */
    dsl.defineFunction('*', {
        signature: [[NUMBER_TYPE,NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_operand1, n_operand2, ret) {
            return ret(null, n_operand1 * n_operand2);
        }
    });

    /**
     * Divide the first number by the second
     * Number, Number -> Number
     * @function /
     * @example (/ 4 2)
     * @returns {Number}
     */
    dsl.defineFunction('/', {
        signature: [[NUMBER_TYPE,NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_operand1, n_operand2, ret) {
            return ret(null, n_operand1 / n_operand2);
        }
    });

    /**
     * Modulo; remainder from dividing the first number by the second
     * Number, Number -> Number
     * @function %
     * @example (% 3 2)
     * @returns {Number}
     */
    dsl.defineFunction('%', {
        signature: [[NUMBER_TYPE,NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_operand1, n_operand2, ret) {
            return ret(null, n_operand1 % n_operand2);
        }
    });

    /**
     * Return true/false whether two numbers are equal
     * Number, Number -> Number
     * @function =
     * @example (= 1 2)
     * @returns {Bool}
     */
    dsl.defineFunction('=', {
        signature: [[NUMBER_TYPE,NUMBER_TYPE],BOOL_TYPE],
        implementation: function(n_operand1, n_operand2, ret) {
            return ret(null, n_operand1 === n_operand2);
        }
    });

    dsl.aliasFunction('==', '=');
    dsl.aliasFunction('===', '=');

    /**
     * Return true/false whether two numbers are not equal
     * Number, Number -> Number
     * @function !=
     * @example (!= 1 2)
     * @returns {Bool}
     */
    dsl.defineFunction('!=', {
        signature: [[NUMBER_TYPE,NUMBER_TYPE],BOOL_TYPE],
        implementation: function(n_operand1, n_operand2, ret) {
            return ret(null, n_operand1 !== n_operand2);
        }
    });

    /**
     * Return true/false whether the first number is greater than the second
     * Number, Number -> Number
     * @function >
     * @example (> 2 1)
     * @returns {Bool}
     */
    dsl.defineFunction('>', {
        signature: [[NUMBER_TYPE,NUMBER_TYPE],BOOL_TYPE],
        implementation: function(n_operand1, n_operand2, ret) {
            return ret(null, n_operand1 > n_operand2);
        }
    });

    /**
     * Return true/false whether the first number is less than the second
     * Number, Number -> Number
     * @function <
     * @example (< 1 2)
     * @returns {Bool}
     */
    dsl.defineFunction('<', {
        signature: [[NUMBER_TYPE,NUMBER_TYPE],BOOL_TYPE],
        implementation: function(n_operand1, n_operand2, ret) {
            return ret(null, n_operand1 < n_operand2);
        }
    });

    /**
     * Return true/false whether the first number is greater than or equal to the second
     * Number, Number -> Number
     * @function >=
     * @example (>= 2 1)
     * @returns {Bool}
     */
    dsl.defineFunction('>=', {
        signature: [[NUMBER_TYPE,NUMBER_TYPE],BOOL_TYPE],
        implementation: function(n_operand1, n_operand2, ret) {
            return ret(null, n_operand1 >= n_operand2);
        }
    });

    /**
     Return true/false whether the first number is less than or equal to the second
     * Number, Number -> Number
     * @function <=
     * @example (<= 1 2)
     * @returns {Bool}
     */
    dsl.defineFunction('<=', {
        signature: [[NUMBER_TYPE,NUMBER_TYPE],BOOL_TYPE],
        implementation: function(n_operand1, n_operand2, ret) {
            return ret(null, n_operand1 <= n_operand2);
        }
    });

    /**
     * Bitwise
     */

    /**
     * Inverts the bits of its argument
     * * -> Number
     * @function ~
     * @example (~ 1)
     * @returns {Number}
     */
    dsl.defineFunction('~', {
        signature: [[ANY_TYPE],NUMBER_TYPE],
        implementation: function(e_operand1, ret) {
            return ret(null, ~a);
        }
    });

    /**
     * Returns a one in each bit position for which the corresponding bits of both operands are ones
     * *, *, -> Number
     * @function &
     * @example (& 1 2)
     * @returns {Number}
     */
    dsl.defineFunction('&', {
        signature: [[ANY_TYPE,ANY_TYPE],NUMBER_TYPE],
        implementation: function(e_operand1, e_operand2, ret) {
            return ret(null, e_operand1 & e_operand2);
        }
    });

    /**
     * Returns a one in each bit position for which the corresponding bits of either or both operands are ones
     * *, *, -> Number
     * @function |
     * @example (| 1 2)
     * @returns {Number}
     */
    dsl.defineFunction('|', {
        signature: [[ANY_TYPE,ANY_TYPE],NUMBER_TYPE],
        implementation: function(e_operand1, e_operand2, ret) {
            return ret(null, e_operand1 | e_operand2);
        }
    });

    /**
     * Returns the first number one in each bit position for which the corresponding bits of either but not both operands are ones
     * *, *, -> Number
     * @function ^
     * @example (^ 1 2)
     * @returns {Number}
     */
    dsl.defineFunction('^', {
        signature: [[ANY_TYPE,ANY_TYPE],NUMBER_TYPE],
        implementation: function(e_operand1, e_operand2, ret) {
            return ret(null, e_operand1 ^ e_operand2);
        }
    });

    /**
     * Shifts the first number in binary representation of the second number (< 32) bits to the left, shifting in zeroes from the right
     * *, *, -> Number
     * @function <<
     * @example (<< 1 2)
     * @returns {Number}
     */
    dsl.defineFunction('<<', {
        signature: [[ANY_TYPE,ANY_TYPE],NUMBER_TYPE],
        implementation: function(e_operand1, e_operand2, ret) {
            return ret(null, e_operand1 << e_operand2);
        }
    });

    /**
     * Shifts the first number in binary representation of the second number (< 32) bits to the right, discarding bits shifted off
     * *, *, -> Number
     * @function >>
     * @example (>> 1 2)
     * @returns {Number}
     */
    dsl.defineFunction('>>', {
        signature: [[ANY_TYPE,ANY_TYPE],NUMBER_TYPE],
        implementation: function(e_operand1, e_operand2, ret) {
            return ret(null, e_operand1 >> e_operand2);
        }
    });

    /**
     * Shifts the first number in binary representation of the second number (< 32) bits to the right, discarding bits shifted off, and shifting in zeroes from the left
     * *, *, -> Number
     * @function >>>
     * @example (>>> 1 2)
     * @returns {Number}
     */
    dsl.defineFunction('>>>', {
        signature: [[ANY_TYPE,ANY_TYPE],NUMBER_TYPE],
        implementation: function(e_operand1, e_operand2, ret) {
            return ret(null, e_operand1 >>> e_operand2);
        }
    });

    /**
     * Boolean
     */

    /**
     * Returns true if both arguments are truthy, else false
     * *, * -> Bool
     * @function and
     * @example (and true false)
     * @returns {Bool}
     */
    dsl.defineFunction('and', {
        signature: [[ANY_TYPE,ANY_TYPE],BOOL_TYPE],
        implementation: function(e_value1, e_value2, ret) {
            return ret(null, e_value1 && e_value2);
        }
    });

    /**
     * Returns false if both arguments are truthy, else true
     * *, * -> Bool
     * @function nand
     * @example (nand true false)
     * @returns {Bool}
     */
    dsl.defineFunction('nand', {
        signature: [[ANY_TYPE,ANY_TYPE],BOOL_TYPE],
        implementation: function(e_value1, e_value2, ret) {
            return ret(null, !(e_value1 && e_value2));
        }
    });

    /**
     * Returns true only if both arguments are falsy
     * *, * -> Bool
     * @function nor
     * @example (nor true false)
     * @returns {Bool}
     */
    dsl.defineFunction('nor', {
        signature: [[ANY_TYPE,ANY_TYPE],BOOL_TYPE],
        implementation: function(e_value1, e_value2, ret) {
            return ret(null, !e_value1 && !e_value2);
        }
    });

    /**
     * Returns true if the argument is falsy
     * *, * -> Bool
     * @function not
     * @example (not true false)
     * @returns {Bool}
     */
    dsl.defineFunction('not', {
        signature: [[ANY_TYPE],BOOL_TYPE],
        implementation: function(e_value, ret) {
            return ret(null, !e_value);
        }
    });

    /**
     * Returns true if either argument is truthy
     * *, * -> Bool
     * @function or
     * @example (or true false)
     * @returns {Bool}
     */
    dsl.defineFunction('or', {
        signature: [[ANY_TYPE,ANY_TYPE],BOOL_TYPE],
        implementation: function(e_value1, e_value2, ret) {
            return ret(null, e_value1 || e_value2);
        }
    });

    /**
     * Returns true only if both arguments have the same truthiness
     * *, * -> Bool
     * @function xnor
     * @example (xnor true false)
     * @returns {Bool}
     */
    dsl.defineFunction('xnor', {
        signature: [[ANY_TYPE,ANY_TYPE],BOOL_TYPE],
        implementation: function(e_value1, e_value2, ret) {
            return ret(null, !!e_value1 === !!e_value2);
        }
    });

    /**
     * Returns true only if the arguments have the opposite truthiness
     * *, * -> Bool
     * @function xor
     * @example (xor true false)
     * @returns {Bool}
     */
    dsl.defineFunction('xor', {
        signature: [[ANY_TYPE,ANY_TYPE],BOOL_TYPE],
        implementation: function(e_value1, e_value2, ret) {
            return ret(null, ((e_value1 && !e_value2) || (!e_value1 && e_value2)));
        }
    });

    /**
     * Math
     */

    /**
     * Returns the absolute value of the given number
     * Number -> Number
     * @function math.abs
     * @example (math.abs 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.abs', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.abs(n_number));
        }
    });

    /**
     * Returns the arccosine of the given number
     * Number -> Number
     * @function math.acos
     * @example (math.acos 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.acos', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.acos(n_number));
        }
    });

    /**
     * Returns the arcsine of the given number
     * Number -> Number
     * @function math.asin
     * @example (math.asin 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.asin', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.asin(n_number));
        }
    });

    /**
     * Returns the arctangent of the given number
     * Number -> Number
     * @function math.atan
     * @example (math.atan 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.atan', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.atan(n_number));
        }
    });

    /**
     * Rounds the number up to the nearest integer
     * Number -> Number
     * @function math.ceil
     * @example (math.ceil 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.ceil', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.ceil(n_number));
        }
    });

    /**
     * Returns the cosine of the given number
     * Number -> Number
     * @function math.cos
     * @example (math.cos 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.cos', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.cos(n_number));
        }
    });

    /**
     * Returns E to the power of the given argument
     * Number -> Number
     * @function math.exp
     * @example (math.exp 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.exp', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.exp(n_number));
        }
    });

    /**
     * Rounds the given number down to the nearest integer
     * Number -> Number
     * @function math.floor
     * @example (math.floor 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.floor', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.floor(n_number));
        }
    });

    /**
     * Returns the log of the given number
     * Number -> Number
     * @function math.log
     * @example (math.log 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.log', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.log(n_number));
        }
    });

    /**
     * Returns the first argument to the power of the second argument
     * Number, Number -> Number
     * @function math.pow
     * @example (math.pow 2 2)
     * @returns {Number}
     */
    dsl.defineFunction('math.pow', {
        signature: [[NUMBER_TYPE,NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, n_power, ret) {
            return ret(null, Math.pow(n_number, n_power));
        }
    });

    var RNGS = {};

    /**
     * Returns a random number between 0 and 1 using the interpreter's current seed value
     * Number -> Number
     * @function math.rand
     * @example (math.rand)
     * @returns {Number}
     */
    dsl.defineFunction('math.rand', {
        signature: [false,NUMBER_TYPE],
        implementation: function(ret) {
            if (!RNGS[this.seed]) RNGS[this.seed] = SeedRandom(this.seed);
            return ret(null, RNGS[this.seed]());
        }
    });

    /**
     * Rounds the given number
     * Number -> Number
     * @function math.round
     * @example (math.round 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.round', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.round(n_number));
        }
    });

    /**
     * Returns the sine of the given number
     * Number -> Number
     * @function math.sin
     * @example (math.sin 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.sin', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.sin(n_number));
        }
    });

    /**
     * Returns the square root of the given number
     * Number -> Number
     * @function math.sqrt
     * @example (math.sqrt 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.sqrt', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.sqrt(n_number));
        }
    });

    /**
     * Returns the tangent of the given number
     * Number -> Number
     * @function math.tan
     * @example (math.tan 1)
     * @returns {Number}
     */
    dsl.defineFunction('math.tan', {
        signature: [[NUMBER_TYPE],NUMBER_TYPE],
        implementation: function(n_number, ret) {
            return ret(null, Math.tan(n_number));
        }
    });

    /**
     * String
     */

    /**
     *
     *
     * @function str.camel-case
     * @example (str.camel-case)
     * @returns {}
     */
    dsl.defineFunction('str.camel-case', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.camelCase(s_string));
        }
    });

    /**
     *
     *
     * @function str.capitalize
     * @example (str.capitalize)
     * @returns {}
     */
    dsl.defineFunction('str.capitalize', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.capitalize(s_string));
        }
    });

    /**
     *
     *
     * @function str.deburr
     * @example (str.deburr)
     * @returns {}
     */
    dsl.defineFunction('str.deburr', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.deburr(s_string));
        }
    });

    /**
     *
     *
     * @function str.ends-with
     * @example (str.ends-with)
     * @returns {}
     */
    dsl.defineFunction('str.ends-with', {
        signature: [[STRING_TYPE,STRING_TYPE],BOOL_TYPE],
        implementation: function(s_string, target, ret) {
            return ret(null, Lodash.endsWith(s_string, target));
        }
    });

    /**
     *
     *
     * @function str.escape
     * @example (str.escape)
     * @returns {}
     */
    dsl.defineFunction('str.escape', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.escape(s_string));
        }
    });

    /**
     *
     *
     * @function str.escape-regexp
     * @example (str.escape-regexp)
     * @returns {}
     */
    dsl.defineFunction('str.escape-regexp', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.escapeRegExp(s_string));
        }
    });

    /**
     *
     *
     * @function str.kebab-case
     * @example (str.kebab-case)
     * @returns {}
     */
    dsl.defineFunction('str.kebab-case', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.kebabCase(s_string));
        }
    });

    /**
     *
     *
     * @function str.pad
     * @example (str.pad)
     * @returns {}
     */
    dsl.defineFunction('str.pad', {
        signature: [[STRING_TYPE,NUMBER_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, m_length, s_characters, ret) {
            return ret(null, Lodash.pad(s_string, m_length, s_characters));
        }
    });

    /**
     *
     *
     * @function str.pad-left
     * @example (str.pad-left)
     * @returns {}
     */
    dsl.defineFunction('str.pad-left', {
        signature: [[STRING_TYPE,NUMBER_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, m_length, s_characters, ret) {
            return ret(null, Lodash.padLeft(s_string, m_length, s_characters));
        }
    });

    /**
     *
     *
     * @function str.pad-right
     * @example (str.pad-right)
     * @returns {}
     */
    dsl.defineFunction('str.pad-right', {
        signature: [[STRING_TYPE,NUMBER_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, m_length, s_characters, ret) {
            return ret(null, Lodash.padRight(s_string, m_length, s_characters));
        }
    });

    /**
     *
     *
     * @function str.parse-int
     * @example (str.parse-int)
     * @returns {}
     */
    dsl.defineFunction('str.parse-int', {
        signature: [[STRING_TYPE],NUMBER_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.parseInt(s_string));
        }
    });

    /**
     *
     *
     * @function str.repeat
     * @example (str.repeat)
     * @returns {}
     */
    dsl.defineFunction('str.repeat', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, n_times, ret) {
            return ret(null, Lodash.repeat(s_string, n_times));
        }
    });

    /**
     *
     *
     * @function str.snake-case
     * @example (str.snake-case)
     * @returns {}
     */
    dsl.defineFunction('str.snake-case', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.snakeCase(s_string));
        }
    });

    /**
     *
     *
     * @function str.start-case
     * @example (str.start-case)
     * @returns {}
     */
    dsl.defineFunction('str.start-case', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.startCase(s_string));
        }
    });

    /**
     *
     *
     * @function str.starts-with
     * @example (str.starts-with)
     * @returns {}
     */
    dsl.defineFunction('str.starts-with', {
        signature: [[STRING_TYPE,STRING_TYPE],BOOL_TYPE],
        implementation: function(s_string, s_target, ret) {
            return ret(null, Lodash.startsWith(s_string, s_target));
        }
    });

    /**
     *
     *
     * @function str.trim
     * @example (str.trim)
     * @returns {}
     */
    dsl.defineFunction('str.trim', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.trim(s_string));
        }
    });

    /**
     *
     *
     * @function str.trim-left
     * @example (str.trim-left)
     * @returns {}
     */
    dsl.defineFunction('str.trim-left', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.trimLeft(s_string));
        }
    });

    /**
     *
     *
     * @function str.trim-right
     * @example (str.trim-right)
     * @returns {}
     */
    dsl.defineFunction('str.trim-right', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.trimRight(s_string));
        }
    });

    /**
     *
     *
     * @function str.truncate
     * @example (str.truncate)
     * @returns {}
     */
    dsl.defineFunction('str.truncate', {
        signature: [[STRING_TYPE,NUMBER_TYPE,BOOL_TYPE],STRING_TYPE],
        implementation: function(s_string, n_length, b_omission, ret) {
            return ret(null, Lodash.trunc(s_string, {
                length: n_length,
                omission: b_omission
            }));
        }
    });

    /**
     *
     *
     * @function str.unescape
     * @example (str.unescape)
     * @returns {}
     */
    dsl.defineFunction('str.unescape', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.unescape(s_string));
        }
    });

    /**
     *
     *
     * @function str.words
     * @example (str.words)
     * @returns {}
     */
    dsl.defineFunction('str.words', {
        signature: [[STRING_TYPE],LIST_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, Lodash.words(s_string));
        }
    });

    /**
     *
     *
     * @function str.char
     * @example (str.char)
     * @returns {}
     */
    dsl.defineFunction('str.char', {
        signature: [[STRING_TYPE,NUMBER_TYPE],STRING_TYPE],
        implementation: function(s_string, n_index, ret) {
            return ret(null, s_string.charAt(n_index));
        }
    });

    /**
     *
     *
     * @function str.concat
     * @example (str.concat)
     * @returns {}
     */
    dsl.defineFunction('str.concat', {
        signature: [true,STRING_TYPE],
        implementation: function() {
            var out = BLANK;
            for (var i = 0; i < this.args.length; i++) {
                var str = this.args[i];
                if (str) out = out + str;
            }
            return this.cb(null, out);
        }
    });

    /**
     *
     *
     * @function str.lowercase
     * @example (str.lowercase)
     * @returns {}
     */
    dsl.defineFunction('str.lowercase', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, s_string.toLowerCase());
        }
    });

    /**
     *
     *
     * @function str.parse-json
     * @example (str.parse-json)
     * @returns {}
     */
    dsl.defineFunction('str.parse-json', {
        signature: [[STRING_TYPE],HASH_TYPE],
        implementation: function(s_string, ret) {
            try {
                var parsed = JSON.parse(s_string);
                return ret(null, parsed);
            }
            catch (e) {
                return ret(e);
            }
        }
    });

    /**
     *
     *
     * @function str.replace
     * @example (str.replace)
     * @returns {}
     */
    dsl.defineFunction('str.replace', {
        signature: [[STRING_TYPE,STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, s_replacee, s_replacement, ret) {
            return ret(null, s_string.replace(s_replacee, s_replacement));
        }
    });

    /**
     *
     *
     * @function str.replace-all
     * @example (str.replace-all)
     * @returns {}
     */
    dsl.defineFunction('str.replace-all', {
        signature: [[STRING_TYPE,STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, s_replacee, s_replacement, ret) {
            return ret(null, s_string.split(s_replacee).join(s_replacement));
        }
    });

    /**
     *
     *
     * @function str.same
     * @example (str.same)
     * @returns {}
     */
    dsl.defineFunction('str.same', {
        signature: [[STRING_TYPE,STRING_TYPE],BOOL_TYPE],
        implementation: function(s_string, s_comparison, ret) {
            return ret(null, s_string === s_comparison);
        }
    });

    /**
     *
     *
     * @function str.search
     * @example (str.search)
     * @returns {}
     */
    dsl.defineFunction('str.search', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, s_substring, ret) {
            return ret(null, s_string.indexOf(s_substring));
        }
    });

    /**
     *
     *
     * @function str.split
     * @example (str.split)
     * @returns {}
     */
    dsl.defineFunction('str.split', {
        signature: [[STRING_TYPE,STRING_TYPE],LIST_TYPE],
        implementation: function(s_string, s_splitter, ret) {
            return ret(null, s_string.split(s_splitter || BLANK));
        }
    });

    /**
     *
     *
     * @function str.substr
     * @example (str.substr)
     * @returns {}
     */
    dsl.defineFunction('str.substr', {
        signature: [[STRING_TYPE,NUMBER_TYPE,NUMBER_TYPE],STRING_TYPE],
        implementation: function(s_string, n_start_index, n_end_index, ret) {
            return ret(null, s_string.substr(n_start_index, n_end_index));
        }
    });

    /**
     *
     *
     * @function str.uppercase
     * @example (str.uppercase)
     * @returns {}
     */
    dsl.defineFunction('str.uppercase', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            return ret(null, s_string.toUpperCase());
        }
    });

    /**
     *
     *
     * @function str.template
     * @example (str.template)
     * @returns {}
     */
    dsl.defineFunction('str.template', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s_string, ret) {
            var parts = s_string.split(TEMPLATE_REGEXP);
            var parsed = ['list'];
            for (var i = 0; i < parts.length; i++) {
                if (i % 2 === 0) parsed.push(parts[i]);
                else parsed.push(['eval', parts[i]]);
            }
            var out = ['list.join', parsed, BLANK];
            return ret(null, out);
        }
    });

    /**
     *
     *
     * @function str.encode64
     * @example (str.encode64)
     * @returns {}
     */
    dsl.defineFunction('str.encode64', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            var uriEncoded = encodeURIComponent(s);
            var unicodeFixed = uriEncoded.replace(UNICODE_REPLACER_RE, function(match, p1) {
                return String.fromCharCode(UNICODE_PREFIX + p1);
            });
            var b64encoded = _btoa(unicodeFixed);
            return ret(null, b64encoded);
        }
    });

    /**
     *
     *
     * @function str.decode64
     * @example (str.decode64)
     * @returns {}
     */
    dsl.defineFunction('str.decode64', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, _atob(s));
        }
    });

    /**
     * Regexp
     */

    /**
     *
     *
     * @function regexp.exec
     * @example (regexp.exec)
     * @returns {}
     */
    dsl.defineFunction('regexp.exec', {
        signature: [[STRING_TYPE,STRING_TYPE],NUMBER_TYPE],
        implementation: function(res, s, ret) {
            var result = new RegExp(res).exec(s);
            var output = (result !== null) ? result.index : -1;
            return ret(null, output);
        }
    });

    /**
     *
     *
     * @function regexp.match
     * @example (regexp.match)
     * @returns {}
     */
    dsl.defineFunction('regexp.match', {
        signature: [[STRING_TYPE,STRING_TYPE],LIST_TYPE],
        implementation: function(res, s, ret) {
            return ret(null, _getRegexpMatches(s, new RegExp(res)));
        }
    });

    /**
     *
     *
     * @function regexp.test
     * @example (regexp.test)
     * @returns {}
     */
    dsl.defineFunction('regexp.test', {
        signature: [[STRING_TYPE,STRING_TYPE],BOOL_TYPE],
        implementation: function(res, s, ret) {
            return ret(null, new RegExp(res).test(s));
        }
    });

    /**
     *
     *
     * @function regexp.replace
     * @example (regexp.replace)
     * @returns {}
     */
    dsl.defineFunction('regexp.replace', {
        signature: [[STRING_TYPE,STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(res, s1, s2, ret) {
            return ret(null, s1.replace(new RegExp(res), s2));
        }
    });

    /**
     *
     *
     * @function regexp.replace-all
     * @example (regexp.replace-all)
     * @returns {}
     */
    dsl.defineFunction('regexp.replace-all', {
        signature: [[STRING_TYPE,STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(res, s1, s2, ret) {
            return ret(null, s.split(new RegExp(res)).join(s2));
        }
    });

    /**
     *
     *
     * @function regexp.split
     * @example (regexp.split)
     * @returns {}
     */
    dsl.defineFunction('regexp.split', {
        signature: [[STRING_TYPE,STRING_TYPE],LIST_TYPE],
        implementation: function(res, s, ret) {
            return ret(null, s.split(new RegExp(res)));
        }
    });

    /**
     * Date / Time
     */

    /**
     *
     *
     * @function moment.now
     * @example (moment.now)
     * @returns {}
     */
    dsl.defineFunction('moment.now', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().toString());
        }
    });

    /**
     *
     *
     * @function moment.format
     * @example (moment.format)
     * @returns {}
     */
    dsl.defineFunction('moment.format', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, f, ret) {
            return ret(null, Moment(s).format(f));
        }
    });

    /**
     *
     *
     * @function moment.parse
     * @example (moment.parse)
     * @returns {}
     */
    dsl.defineFunction('moment.parse', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, Moment(s).toString());
        }
    });

    /**
     *
     *
     * @function moment.parse-format
     * @example (moment.parse-format)
     * @returns {}
     */
    dsl.defineFunction('moment.parse-format', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(ts, fs, ret) {
            return ret(null, Moment(ts, fs).toString());
        }
    });

    /**
     *
     *
     * @function moment.timestamp
     * @example (moment.timestamp)
     * @returns {}
     */
    dsl.defineFunction('moment.timestamp', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, new Date().getTime());
        }
    });

    /**
     *
     *
     * @function moment.unix-timestamp
     * @example (moment.unix-timestamp)
     * @returns {}
     */
    dsl.defineFunction('moment.unix-timestamp', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Math.round(new Date().getTime() / 1000));
        }
    });

    /**
     *
     *
     * @function moment.utc
     * @example (moment.utc)
     * @returns {}
     */
    dsl.defineFunction('moment.utc', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, moment.utc().toString());
        }
    });

    /**
     *
     *
     * @function moment.utc-offset
     * @example (moment.utc-offset)
     * @returns {}
     */
    dsl.defineFunction('moment.utc-offset', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, moment.utcOffset());
        }
    });

    /**
     *
     *
     * @function moment.utc-parse
     * @example (moment.utc-parse)
     * @returns {}
     */
    dsl.defineFunction('moment.utc-parse', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, Moment.utc(s).toString());
        }
    });

    /**
     *
     *
     * @function moment.utc-parse-format
     * @example (moment.utc-parse-format)
     * @returns {}
     */
    dsl.defineFunction('moment.utc-parse-format', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(ts, fs, ret) {
            return ret(null, Moment.utc(ts, fs).toString());
        }
    });

    /**
     *
     *
     * @function moment.millisecond
     * @example (moment.millisecond)
     * @returns {}
     */
    dsl.defineFunction('moment.millisecond', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().millisecond());
        }
    });

    /**
     *
     *
     * @function moment.second
     * @example (moment.second)
     * @returns {}
     */
    dsl.defineFunction('moment.second', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().second());
        }
    });

    /**
     *
     *
     * @function moment.minute
     * @example (moment.minute)
     * @returns {}
     */
    dsl.defineFunction('moment.minute', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().minute());
        }
    });

    /**
     *
     *
     * @function moment.hour
     * @example (moment.hour)
     * @returns {}
     */
    dsl.defineFunction('moment.hour', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().hour());
        }
    });

    /**
     *
     *
     * @function moment.date-of-month
     * @example (moment.date-of-month)
     * @returns {}
     */
    dsl.defineFunction('moment.date-of-month', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().date());
        }
    });

    /**
     *
     *
     * @function moment.day-of-week
     * @example (moment.day-of-week)
     * @returns {}
     */
    dsl.defineFunction('moment.day-of-week', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().day());
        }
    });

    /**
     *
     *
     * @function moment.day-of-year
     * @example (moment.day-of-year)
     * @returns {}
     */
    dsl.defineFunction('moment.day-of-year', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().dayOfYear());
        }
    });

    /**
     *
     *
     * @function moment.week-of-year
     * @example (moment.week-of-year)
     * @returns {}
     */
    dsl.defineFunction('moment.week-of-year', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().week());
        }
    });

    /**
     *
     *
     * @function moment.month
     * @example (moment.month)
     * @returns {}
     */
    dsl.defineFunction('moment.month', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().month());
        }
    });

    /**
     *
     *
     * @function moment.quarter
     * @example (moment.quarter)
     * @returns {}
     */
    dsl.defineFunction('moment.quarter', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().quarter());
        }
    });

    /**
     *
     *
     * @function moment.year
     * @example (moment.year)
     * @returns {}
     */
    dsl.defineFunction('moment.year', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().year());
        }
    });

    /**
     *
     *
     * @function moment.weeks-in-year
     * @example (moment.weeks-in-year)
     * @returns {}
     */
    dsl.defineFunction('moment.weeks-in-year', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().weeksInYear());
        }
    });

    /**
     *
     *
     * @function moment.get
     * @example (moment.get)
     * @returns {}
     */
    dsl.defineFunction('moment.get', {
        signature: [[STRING_TYPE,STRING_TYPE],ANY_TYPE],
        implementation: function(t, k, ret) {
            return ret(null, Moment(t).get(k));
        }
    });

    /**
     *
     *
     * @function moment.set
     * @example (moment.set)
     * @returns {}
     */
    dsl.defineFunction('moment.set', {
        signature: [[STRING_TYPE,STRING_TYPE,ANY_TYPE],STRING_TYPE],
        implementation: function(t, k, v, ret) {
            return ret(null, Moment(t).set(key, v).toString());
        }
    });

    /**
     *
     *
     * @function moment.add
     * @example (moment.add)
     * @returns {}
     */
    dsl.defineFunction('moment.add', {
        signature: [[STRING_TYPE,NUMBER_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(t, n, s, ret) {
            return ret(null, Moment(t).add(n, s).toString());
        }
    });

    /**
     *
     *
     * @function moment.sub
     * @example (moment.sub)
     * @returns {}
     */
    dsl.defineFunction('moment.sub', {
        signature: [[STRING_TYPE,NUMBER_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(t, n, s, ret) {
            return ret(null, Moment(t).sub(n, s).toString());
        }
    });

    /**
     *
     *
     * @function moment.from-now
     * @example (moment.from-now)
     * @returns {}
     */
    dsl.defineFunction('moment.from-now', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(t, ret) {
            return ret(null, Moment(t).fromNow(true).toString());
        }
    });

    /**
     *
     *
     * @function moment.to-now
     * @example (moment.to-now)
     * @returns {}
     */
    dsl.defineFunction('moment.to-now', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(t, ret) {
            return ret(null, Moment(t).toNow(true).toString());
        }
    });

    /**
     *
     *
     * @function moment.calendar
     * @example (moment.calendar)
     * @returns {}
     */
    dsl.defineFunction('moment.calendar', {
        signature: [false,STRING_TYPE],
        implementation: function(ret) {
            return ret(null, Moment().calendar());
        }
    });

    /**
     *
     *
     * @function moment.is-leap-year
     * @example (moment.is-leap-year)
     * @returns {}
     */
    dsl.defineFunction('moment.is-leap-year', {
        signature: [[STRING_TYPE],BOOL_TYPE],
        implementation: function(y, ret) {
            return ret(null, Moment(y).isLeapYear());
        }
    });

    /**
     *
     *
     * @function moment.is-dst
     * @example (moment.is-dst)
     * @returns {}
     */
    dsl.defineFunction('moment.is-dst', {
        signature: [[STRING_TYPE],BOOL_TYPE],
        implementation: function(y, ret) {
            return ret(null, Moment(y).isDST());
        }
    });

    /**
     *
     *
     * @function moment.duration
     * @example (moment.duration)
     * @returns {}
     */
    dsl.defineFunction('moment.duration', {
        signature: [[NUMBER_TYPE,STRING_TYPE,STRING_TYPE],NUMBER_TYPE],
        implementation: function(n, unitIn, unitOut, ret) {
            return ret(null, Moment.duration(n, unitIn).get(unitOut));
        }
    });

    /**
     *
     *
     * @function moment.diff
     * @example (moment.diff)
     * @returns {}
     */
    dsl.defineFunction('moment.diff', {
        signature: [[STRING_TYPE,STRING_TYPE,STRING_TYPE],NUMBER_TYPE],
        implementation: function(t1, t2, unit, ret) {
            var a = Moment(t1);
            var b = Moment(t2);
            return ret(null, a.diff(b, unit));
        }
    });

    /**
     * Crypto
     */

    /**
     *
     *
     * @function crypto.md5
     * @example (crypto.md5)
     * @returns {}
     */
    dsl.defineFunction('crypto.md5', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, CryptoJS.MD5(s).toString());
        }
    });

    /**
     *
     *
     * @function crypto.sha1
     * @example (crypto.sha1)
     * @returns {}
     */
    dsl.defineFunction('crypto.sha1', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, CryptoJS.SHA1(s).toString());
        }
    });

    /**
     *
     *
     * @function crypto.sha256
     * @example (crypto.sha256)
     * @returns {}
     */
    dsl.defineFunction('crypto.sha256', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, CryptoJS.SHA256(s).toString());
        }
    });

    /**
     *
     *
     * @function crypto.sha512
     * @example (crypto.sha512)
     * @returns {}
     */
    dsl.defineFunction('crypto.sha512', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, CryptoJS.SHA512(s).toString());
        }
    });

    /**
     *
     *
     * @function crypto.sha3
     * @example (crypto.sha3)
     * @returns {}
     */
    dsl.defineFunction('crypto.sha3', {
        signature: [[STRING_TYPE,NULL_TYPE],STRING_TYPE],
        implementation: function(s, len, ret) {
            return ret(null, CryptoJS.SHA3(s, len).toString());
        }
    });

    /**
     *
     *
     * @function crypto.ripemd160
     * @example (crypto.ripemd160)
     * @returns {}
     */
    dsl.defineFunction('crypto.ripemd160', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, CryptoJS.RIPEMD160(s).toString());
        }
    });

    /**
     *
     *
     * @function crypto.hmac-md5
     * @example (crypto.hmac-md5)
     * @returns {}
     */
    dsl.defineFunction('crypto.hmac-md5', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.HmacMD5(s, p).toString());
        }
    });

    /**
     *
     *
     * @function crypto.hmac-sha1
     * @example (crypto.hmac-sha1)
     * @returns {}
     */
    dsl.defineFunction('crypto.hmac-sha1', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.HmacSHA1(s, p).toString());
        }
    });

    /**
     *
     *
     * @function crypto.hmac-sha256
     * @example (crypto.hmac-sha256)
     * @returns {}
     */
    dsl.defineFunction('crypto.hmac-sha256', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.HmacSHA256(s, p).toString());
        }
    });

    /**
     *
     *
     * @function crypto.hmac-sha512
     * @example (crypto.hmac-sha512)
     * @returns {}
     */
    dsl.defineFunction('crypto.hmac-sha512', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.HmacSHA512(s, p).toString());
        }
    });

    /**
     *
     *
     * @function crypto.aes-encrypt
     * @example (crypto.aes-encrypt)
     * @returns {}
     */
    dsl.defineFunction('crypto.aes-encrypt', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.AES.encrypt(s, p).toString());
        }
    });

    /**
     *
     *
     * @function crypto.aes-decrypt
     * @example (crypto.aes-decrypt)
     * @returns {}
     */
    dsl.defineFunction('crypto.aes-decrypt', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.AES.decrypt(s, p).toString(CryptoJS.enc.Utf8));
        }
    });

    /**
     *
     *
     * @function crypto.des-encrypt
     * @example (crypto.des-encrypt)
     * @returns {}
     */
    dsl.defineFunction('crypto.des-encrypt', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.DES.encrypt(s, p).toString());
        }
    });

    /**
     *
     *
     * @function crypto.des-decrypt
     * @example (crypto.des-decrypt)
     * @returns {}
     */
    dsl.defineFunction('crypto.des-decrypt', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.DES.decrypt(s, p).toString(CryptoJS.enc.Utf8));
        }
    });

    /**
     *
     *
     * @function crypto.triple-des-encrypt
     * @example (crypto.triple-des-encrypt)
     * @returns {}
     */
    dsl.defineFunction('crypto.triple-des-encrypt', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.TripleDES.encrypt(s, p).toString());
        }
    });

    /**
     *
     *
     * @function crypto.triple-des-decrypt
     * @example (crypto.triple-des-decrypt)
     * @returns {}
     */
    dsl.defineFunction('crypto.triple-des-decrypt', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.TripleDES.decrypt(s, p).toString(CryptoJS.enc.Utf8));
        }
    });

    /**
     *
     *
     * @function crypto.rabbit-encrypt
     * @example (crypto.rabbit-encrypt)
     * @returns {}
     */
    dsl.defineFunction('crypto.rabbit-encrypt', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.Rabbit.encrypt(s, p).toString());
        }
    });

    /**
     *
     *
     * @function crypto.rabbit-decrypt
     * @example (crypto.rabbit-decrypt)
     * @returns {}
     */
    dsl.defineFunction('crypto.rabbit-decrypt', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.Rabbit.decrypt(s, p).toString(CryptoJS.enc.Utf8));
        }
    });

    /**
     *
     *
     * @function crypto.rc4-encrypt
     * @example (crypto.rc4-encrypt)
     * @returns {}
     */
    dsl.defineFunction('crypto.rc4-encrypt', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.RC4.encrypt(s, p).toString());
        }
    });

    /**
     *
     *
     * @function crypto.rc4-decrypt
     * @example (crypto.rc4-decrypt)
     * @returns {}
     */
    dsl.defineFunction('crypto.rc4-decrypt', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.RC4.decrypt(s, p).toString(CryptoJS.enc.Utf8));
        }
    });

    /**
     *
     *
     * @function crypto.rc4-drop-encrypt
     * @example (crypto.rc4-drop-encrypt)
     * @returns {}
     */
    dsl.defineFunction('crypto.rc4-drop-encrypt', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.RC4Drop.encrypt(s, p).toString());
        }
    });

    /**
     *
     *
     * @function crypto.rc4-drop-decrypt
     * @example (crypto.rc4-drop-decrypt)
     * @returns {}
     */
    dsl.defineFunction('crypto.rc4-drop-decrypt', {
        signature: [[STRING_TYPE,STRING_TYPE],STRING_TYPE],
        implementation: function(s, p, ret) {
            return ret(null, CryptoJS.RC4Drop.decrypt(s, p).toString(CryptoJS.enc.Utf8));
        }
    });

    /**
     * List / Array
     */

    /**
     *
     *
     * @function list.chunk
     * @example (list.chunk)
     * @returns {}
     */
    dsl.defineFunction('list.chunk', {
        signature: [[LIST_TYPE, NUMBER_TYPE], LIST_TYPE],
        implementation: function(a_array, n_size, cb) {
            return cb(null, Lodash.chunk(a_array, n_size));
        }
    });

    /**
     *
     *
     * @function list.compact
     * @example (list.compact)
     * @returns {}
     */
    dsl.defineFunction('list.compact', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, cb) {
            return cb(null, Lodash.compact(a_array));
        }
    });

    /**
     *
     *
     * @function list.difference
     * @example (list.difference)
     * @returns {}
     */
    dsl.defineFunction('list.difference', {
        signature: [[LIST_TYPE, LIST_TYPE], LIST_TYPE],
        implementation: function(a_array1, a_array2, cb) {
            return cb(null, Lodash.difference(a_array1, a_array2));
        }
    });

    /**
     *
     *
     * @function list.drop
     * @example (list.drop)
     * @returns {}
     */
    dsl.defineFunction('list.drop', {
        signature: [[LIST_TYPE, NUMBER_TYPE], LIST_TYPE],
        implementation: function(a_array, n_number, cb) {
            return cb(null, Lodash.drop(a_array, n_number));
        }
    });

    /**
     *
     *
     * @function list.drop-right
     * @example (list.drop-right)
     * @returns {}
     */
    dsl.defineFunction('list.drop-right', {
        signature: [[LIST_TYPE, NUMBER_TYPE], LIST_TYPE],
        implementation: function(a_array, n_number, cb) {
            return cb(null, Lodash.dropRight(a_array, n_number));
        }
    });

    /**
     *
     *
     * @function list.fill
     * @example (list.fill)
     * @returns {}
     */
    dsl.defineFunction('list.fill', {
        signature: [[LIST_TYPE, '*', NUMBER_TYPE, NUMBER_TYPE], LIST_TYPE],
        implementation: function(a_array, e_value, n_start_index, n_end_index, cb) {
            return cb(null, Lodash.fill(a_array, e_value, n_start_index, n_end_index));
        }
    });

    /**
     *
     *
     * @function list.flatten
     * @example (list.flatten)
     * @returns {}
     */
    dsl.defineFunction('list.flatten', {
        signature: [[LIST_TYPE, 'bool'], LIST_TYPE],
        implementation: function(a_array, b_is_deep, cb) {
            return cb(null, Lodash.flatten(a_array, b_is_deep));
        }
    });

    /**
     *
     *
     * @function list.flatten-deep
     * @example (list.flatten-deep)
     * @returns {}
     */
    dsl.defineFunction('list.flatten-deep', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, cb) {
            return cb(null, Lodash.flattenDeep(a_array));
        }
    });

    /**
     *
     *
     * @function list.intersection
     * @example (list.intersection)
     * @returns {}
     */
    dsl.defineFunction('list.intersection', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array_of_arrays, cb) {
            return cb(null, Lodash.intersection(a_array_of_arrays));
        }
    });

    /**
     *
     *
     * @function list.last-index-of
     * @example (list.last-index-of)
     * @returns {}
     */
    dsl.defineFunction('list.last-index-of', {
        signature: [[LIST_TYPE, '*'], NUMBER_TYPE],
        implementation: function(a_array, e_value, cb) {
            return cb(null, Lodash.lastIndexOf(a_array, e_value));
        }
    });

    /**
     *
     *
     * @function list.pull
     * @example (list.pull)
     * @returns {}
     */
    dsl.defineFunction('list.pull', {
        signature: [[LIST_TYPE, LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, a_values, cb) {
            return cb(null, Lodash.pull.apply(Lodash, [a_array].concat(a_values)));
        }
    });

    /**
     *
     *
     * @function list.pull-at
     * @example (list.pull-at)
     * @returns {}
     */
    dsl.defineFunction('list.pull-at', {
        signature: [[LIST_TYPE, LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, a_indices, cb) {
            return cb(null, Lodash.pullAt(a_array, a_indices));
        }
    });

    /**
     *
     *
     * @function list.sorted-index
     * @example (list.sorted-index)
     * @returns {}
     */
    dsl.defineFunction('list.sorted-index', {
        signature: [[LIST_TYPE, ANY_TYPE], LIST_TYPE],
        implementation: function(a_array, e_value, cb) {
            return cb(null, Lodash.sortedIndex(a_array, e_value));
        }
    });

    /**
     *
     *
     * @function list.sorted-last-index
     * @example (list.sorted-last-index)
     * @returns {}
     */
    dsl.defineFunction('list.sorted-last-index', {
        signature: [[LIST_TYPE, ANY_TYPE], NUMBER_TYPE],
        implementation: function(a_array, e_value, cb) {
            return cb(null, Lodash.sortedLastIndex(a_array, e_value));
        }
    });

    /**
     *
     *
     * @function list.take
     * @example (list.take)
     * @returns {}
     */
    dsl.defineFunction('list.take', {
        signature: [[LIST_TYPE, NUMBER_TYPE], LIST_TYPE],
        implementation: function(a_array, n_number, cb) {
            return cb(null, Lodash.take(a_array, n_number));
        }
    });

    /**
     *
     *
     * @function list.take-right
     * @example (list.take-right)
     * @returns {}
     */
    dsl.defineFunction('list.take-right', {
        signature: [[LIST_TYPE, NUMBER_TYPE], LIST_TYPE],
        implementation: function(a_array, n_number, cb) {
            return cb(null, Lodash.takeRight(a_array, n_number));
        }
    });

    /**
     *
     *
     * @function list.union
     * @example (list.union)
     * @returns {}
     */
    dsl.defineFunction('list.union', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array_of_arrays, cb) {
            return cb(null, Lodash.union(a_array_of_arrays));
        }
    });

    /**
     *
     *
     * @function list.uniq
     * @example (list.uniq)
     * @returns {}
     */
    dsl.defineFunction('list.uniq', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, cb) {
            return cb(null, Lodash.uniq(a_array));
        }
    });

    /**
     *
     *
     * @function list.unzip
     * @example (list.unzip)
     * @returns {}
     */
    dsl.defineFunction('list.unzip', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, cb) {
            return cb(null, Lodash.unzip(a_array));
        }
    });

    /**
     *
     *
     * @function list.without
     * @example (list.without)
     * @returns {}
     */
    dsl.defineFunction('list.without', {
        signature: [[LIST_TYPE, LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, a_values, cb) {
            return cb(null, Lodash.without.apply(Lodash, [a_array].concat([a_values])));
        }
    });

    /**
     *
     *
     * @function list.symmetric-difference
     * @example (list.symmetric-difference)
     * @returns {}
     */
    dsl.defineFunction('list.symmetric-difference', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array_of_arrays, cb) {
            return cb(null, Lodash.xor(a_array_of_arrays));
        }
    });

    /**
     *
     *
     * @function list.zip
     * @example (list.zip)
     * @returns {}
     */
    dsl.defineFunction('list.zip', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array_of_arrays, cb) {
            return cb(null, Lodash.zip(a_array_of_arrays));
        }
    });

    /**
     *
     *
     * @function list.at
     * @example (list.at)
     * @returns {}
     */
    dsl.defineFunction('list.at', {
        signature: [[LIST_TYPE, LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, a_properties, cb) {
            return cb(null, Lodash.at(a_array, a_properties));
        }
    });

    /**
     *
     *
     * @function list.find-where
     * @example (list.find-where)
     * @returns {}
     */
    dsl.defineFunction('list.find-where', {
        signature: [[LIST_TYPE, HASH_TYPE], LIST_TYPE],
        implementation: function(a_array, h_query, cb) {
            return cb(null, Lodash.findWhere(a_array, h_query));
        }
    });

    /**
     *
     *
     * @function list.includes
     * @example (list.includes)
     * @returns {}
     */
    dsl.defineFunction('list.includes', {
        signature: [[LIST_TYPE, ANY_TYPE], LIST_TYPE],
        implementation: function(a_array, e_target, cb) {
            return cb(null, Lodash.includes(a_array, e_target));
        }
    });

    /**
     *
     *
     * @function list.pluck
     * @example (list.pluck)
     * @returns {}
     */
    dsl.defineFunction('list.pluck', {
        signature: [[LIST_TYPE, HASH_TYPE], LIST_TYPE],
        implementation: function(a_array, h_query, cb) {
            return cb(null, Lodash.pluck(a_array, h_query));
        }
    });

    /**
     *
     *
     * @function list.sample
     * @example (list.sample)
     * @returns {}
     */
    dsl.defineFunction('list.sample', {
        signature: [[LIST_TYPE, NUMBER_TYPE], LIST_TYPE],
        implementation: function(a_array, n_number, cb) {
            return cb(null, Lodash.sample(a_array, n_number));
        }
    });

    /**
     *
     *
     * @function list.shuffle
     * @example (list.shuffle)
     * @returns {}
     */
    dsl.defineFunction('list.shuffle', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, cb) {
            return cb(null, Lodash.shuffle(a_array));
        }
    });

    /**
     *
     *
     * @function list.size
     * @example (list.size)
     * @returns {}
     */
    dsl.defineFunction('list.size', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, cb) {
            return cb(null, Lodash.size(a_array));
        }
    });

    /**
     *
     *
     * @function list.where
     * @example (list.where)
     * @returns {}
     */
    dsl.defineFunction('list.where', {
        signature: [[LIST_TYPE, HASH_TYPE], LIST_TYPE],
        implementation: function(a_array, h_query, cb) {
            return cb(null, Lodash.where(a_array, h_query));
        }
    });

    /**
     *
     *
     * @function list.first
     * @example (list.first)
     * @returns {}
     */
    dsl.defineFunction('list.first', {
        signature: [[LIST_TYPE], ANY_TYPE],
        implementation: function(a_array, cb) {
            return cb(null, a_array[0]);
        }
    });

    /**
     *
     *
     * @function list.init
     * @example (list.init)
     * @returns {}
     */
    dsl.defineFunction('list.init', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, cb) {
            return cb(null, a_array.slice(0, a_array.length - 1));
        }
    });

    /**
     *
     *
     * @function list.last
     * @example (list.last)
     * @returns {}
     */
    dsl.defineFunction('list.last', {
        signature: [[LIST_TYPE], ANY_TYPE],
        implementation: function(a_array, cb) {
            return cb(null, a_array[a_array.length - 1]);
        }
    });

    /**
     *
     *
     * @function list.tail
     * @example (list.tail)
     * @returns {}
     */
    dsl.defineFunction('list.tail', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, cb) {
            return cb(null, a_array.slice(1));
        }
    });

    /**
     *
     *
     * @function list.join
     * @example (list.join)
     * @returns {}
     */
    dsl.defineFunction('list.join', {
        signature: [[LIST_TYPE, 'string'], 'string'],
        implementation: function(a_array, s_string, cb) {
            return cb(null, a_array.join(s_string));
        }
    });

    /**
     *
     *
     * @function list.length
     * @example (list.length)
     * @returns {}
     */
    dsl.defineFunction('list.length', {
        signature: [[LIST_TYPE], NUMBER_TYPE],
        implementation: function(a_array, cb) {
            return cb(null, a_array.length);
        }
    });

    /**
     *
     *
     * @function list.index
     * @example (list.index)
     * @returns {}
     */
    dsl.defineFunction('list.index', {
        signature: [[LIST_TYPE, ANY_TYPE], NUMBER_TYPE],
        implementation: function(a_array, e_element, cb) {
            return cb(null, a_array.indexOf(e_element));
        }
    });

    /**
     *
     *
     * @function list.pop
     * @example (list.pop)
     * @returns {}
     */
    dsl.defineFunction('list.pop', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, cb) {
            a_array.pop();
            return cb(null, [LIST_TYPE].concat(a_array));
        }
    });

    /**
     *
     *
     * @function list.push
     * @example (list.push)
     * @returns {}
     */
    dsl.defineFunction('list.push', {
        signature: [[LIST_TYPE, ANY_TYPE], LIST_TYPE],
        implementation: function(a_array, e_value, cb) {
            a_array.push(e_value);
            return cb(null, [LIST_TYPE].concat(a_array));
        }
    });

    /**
     *
     *
     * @function list.shift
     * @example (list.shift)
     * @returns {}
     */
    dsl.defineFunction('list.shift', {
        signature: [[LIST_TYPE], LIST_TYPE],
        implementation: function(a_array, cb) {
            a_array.shift();
            return cb(null, [LIST_TYPE].concat(a_array));
        }
    });

    /**
     *
     *
     * @function list.unshift
     * @example (list.unshift)
     * @returns {}
     */
    dsl.defineFunction('list.unshift', {
        signature: [[LIST_TYPE, ANY_TYPE], LIST_TYPE],
        implementation: function(a_array, e_value, cb) {
            a_array.unshift(e_value);
            return cb(null, [LIST_TYPE].concat(a_array));
        }
    });

    /**
     *
     *
     * @function list.slice
     * @example (list.slice)
     * @returns {}
     */
    dsl.defineFunction('list.slice', {
        signature: [[LIST_TYPE, NUMBER_TYPE, NUMBER_TYPE], LIST_TYPE],
        implementation: function(a_array, n_start_index, n_end_index, cb) {
            return cb(null, a_array.slice(n_start_index, n_end_index));
        }
    });

    /**
     *
     *
     * @function list.splice
     * @example (list.splice)
     * @returns {}
     */
    dsl.defineFunction('list.splice', {
        signature: [[LIST_TYPE, NUMBER_TYPE, NUMBER_TYPE], LIST_TYPE],
        implementation: function(a_array, n_start_index, n_end_index, cb) {
            return cb(null, a_array.splice(n_start_index, n_end_index, rest));
        }
    });

    /**
     * Hash
     */

    /**
     *
     *
     * @function hash.assign
     * @example (hash.assign)
     * @returns {}
     */
    dsl.defineFunction('hash.assign', {
        signature: [[HASH_TYPE,HASH_TYPE],HASH_TYPE],
        implementation: function(h_hash, h_source, ret) {
            return ret(null, Lodash.assign(h_hash, h_source));
        }
    });

    /**
     *
     *
     * @function hash.defaults
     * @example (hash.defaults)
     * @returns {}
     */
    dsl.defineFunction('hash.defaults', {
        signature: [[HASH_TYPE,HASH_TYPE],HASH_TYPE],
        implementation: function(h_hash, h_source, ret) {
            return ret(null, Lodash.defaults(h_hash, h_source));
        }
    });

    /**
     *
     *
     * @function hash.defaults-deep
     * @example (hash.defaults-deep)
     * @returns {}
     */
    dsl.defineFunction('hash.defaults-deep', {
        signature: [[HASH_TYPE,HASH_TYPE],HASH_TYPE],
        implementation: function(h_hash, h_source, ret) {
            return ret(null, Lodash.defaultsDeep(h_hash, h_source));
        }
    });

    /**
     *
     *
     * @function hash.get
     * @example (hash.get)
     * @returns {}
     */
    dsl.defineFunction('hash.get', {
        signature: [[HASH_TYPE,STRING_TYPE],ANY_TYPE],
        implementation: function(h_hash, s_path, ret) {
            var value = Lodash.get(h_hash, s_path);
            if (Array.isArray(value)) {
                if (value.length > 1) value = ['list'].concat(value);
                else value = _quotize(value); // HACK: Avoid irreducible list
            }
            return ret(null, value);
        }
    });

    /**
     *
     *
     * @function hash.has
     * @example (hash.has)
     * @returns {}
     */
    dsl.defineFunction('hash.has', {
        signature: [[HASH_TYPE,STRING_TYPE],BOOL_TYPE],
        implementation: function(h_hash, s_path, ret) {
            return ret(null, Lodash.has(h_hash, s_path));
        }
    });

    /**
     *
     *
     * @function hash.set
     * @example (hash.set)
     * @returns {}
     */
    dsl.defineFunction('hash.set', {
        signature: [[HASH_TYPE,STRING_TYPE,ANY_TYPE],NULL_TYPE],
        implementation: function(h_hash, s_path, e_value, ret) {
            Lodash.set(h_hash, s_path, e_value);
            return ret(null);
        }
    });

    /**
     *
     *
     * @function hash.invert
     * @example (hash.invert)
     * @returns {}
     */
    dsl.defineFunction('hash.invert', {
        signature: [[HASH_TYPE,BOOL_TYPE],HASH_TYPE],
        implementation: function(h_hash, b_multi_value, ret) {
            return ret(null, Lodash.invert(h_hash, b_multi_value));
        }
    });

    /**
     *
     *
     * @function hash.keys
     * @example (hash.keys)
     * @returns {}
     */
    dsl.defineFunction('hash.keys', {
        signature: [[HASH_TYPE],LIST_TYPE],
        implementation: function(h_hash, ret) {
            return ret(null, Lodash.keys(h_hash));
        }
    });

    /**
     *
     *
     * @function hash.keys-in
     * @example (hash.keys-in)
     * @returns {}
     */
    dsl.defineFunction('hash.keys-in', {
        signature: [[HASH_TYPE],LIST_TYPE],
        implementation: function(h_hash, ret) {
            return ret(null, Lodash.keysIn(h_hash));
        }
    });

    /**
     *
     *
     * @function hash.merge
     * @example (hash.merge)
     * @returns {}
     */
    dsl.defineFunction('hash.merge', {
        signature: [[HASH_TYPE,HASH_TYPE],HASH_TYPE],
        implementation: function(h_hash, h_source, ret) {
            return ret(null, Lodash.merge(h_hash, h_source));
        }
    });

    /**
     *
     *
     * @function hash.omit
     * @example (hash.omit)
     * @returns {}
     */
    dsl.defineFunction('hash.omit', {
        signature: [[HASH_TYPE,STRING_TYPE],HASH_TYPE],
        implementation: function(h_hash, s_property, ret) {
            return ret(null, Lodash.omit(h_hash, s_property));
        }
    });

    /**
     *
     *
     * @function hash.pairs
     * @example (hash.pairs)
     * @returns {}
     */
    dsl.defineFunction('hash.pairs', {
        signature: [[HASH_TYPE],LIST_TYPE],
        implementation: function(h_hash, ret) {
            return ret(null, Lodash.pairs(h_hash));
        }
    });

    /**
     *
     *
     * @function hash.pick
     * @example (hash.pick)
     * @returns {}
     */
    dsl.defineFunction('hash.pick', {
        signature: [[HASH_TYPE,STRING_TYPE],HASH_TYPE],
        implementation: function(h_hash, s_property, ret) {
            return ret(null, Lodash.pick(h_hash, s_property));
        }
    });

    /**
     *
     *
     * @function hash.values
     * @example (hash.values)
     * @returns {}
     */
    dsl.defineFunction('hash.values', {
        signature: [[HASH_TYPE],LIST_TYPE],
        implementation: function(h_hash, ret) {
            return ret(null, Lodash.values(h_hash));
        }
    });

    /**
     *
     *
     * @function hash.values-in
     * @example (hash.values-in)
     * @returns {}
     */
    dsl.defineFunction('hash.values-in', {
        signature: [[HASH_TYPE],LIST_TYPE],
        implementation: function(h_hash, ret) {
            return ret(null, Lodash.valuesIn(h_hash));
        }
    });

    /**
     *
     *
     * @function hash.fetch
     * @example (hash.fetch)
     * @returns {}
     */
    dsl.defineFunction('hash.fetch', {
        signature: [[HASH_TYPE,STRING_TYPE],ANY_TYPE],
        implementation: function(h_hash, s_key, ret) {
            return ret(null, h_hash[s_key]);
        }
    });

    /**
     *
     *
     * @function hash.to-json
     * @example (hash.to-json)
     * @returns {}
     */
    dsl.defineFunction('hash.to-json', {
        signature: [[HASH_TYPE],STRING_TYPE],
        implementation: function(h_hash, ret) {
            return ret(null, JSONStableStringify(h_hash));
        }
    });

    /**
     *
     *
     * @function hash.delete
     * @example (hash.delete)
     * @returns {}
     */
    dsl.defineFunction('hash.delete', {
        signature: [[HASH_TYPE,STRING_TYPE],HASH_TYPE],
        implementation: function(h_hash, s_key, ret) {
            delete h_hash[s_key];
            return ret(null, h_hash);
        }
    });

    /**
     *
     *
     * @function hash.store
     * @example (hash.store)
     * @returns {}
     */
    dsl.defineFunction('hash.store', {
        signature: [[HASH_TYPE,STRING_TYPE,ANY_TYPE],HASH_TYPE],
        implementation: function(h_hash, s_key, e_value, ret) {
            h_hash[s_key] = e_value;
            return ret(null, h_hash);
        }
    });

    /**
     * URI
     */

    /**
     *
     *
     * @function uri.parse
     * @example (uri.parse)
     * @returns {}
     */
    dsl.defineFunction('uri.parse', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, URLParse(s));
        }
    });

    /**
     *
     *
     * @function uri.protocol
     * @example (uri.protocol)
     * @returns {}
     */
    dsl.defineFunction('uri.protocol', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, URLParse(s).protocol);
        }
    });

    /**
     *
     *
     * @function uri.username
     * @example (uri.username)
     * @returns {}
     */
    dsl.defineFunction('uri.username', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, URLParse(s).username);
        }
    });

    /**
     *
     *
     * @function uri.password
     * @example (uri.password)
     * @returns {}
     */
    dsl.defineFunction('uri.password', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, URLParse(s).password);
        }
    });

    /**
     *
     *
     * @function uri.auth
     * @example (uri.auth)
     * @returns {}
     */
    dsl.defineFunction('uri.auth', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, URLParse(s).auth);
        }
    });

    /**
     *
     *
     * @function uri.host
     * @example (uri.host)
     * @returns {}
     */
    dsl.defineFunction('uri.host', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, URLParse(s).host);
        }
    });

    /**
     *
     *
     * @function uri.hostname
     * @example (uri.hostname)
     * @returns {}
     */
    dsl.defineFunction('uri.hostname', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, URLParse(s).hostname);
        }
    });

    /**
     *
     *
     * @function uri.port
     * @example (uri.port)
     * @returns {}
     */
    dsl.defineFunction('uri.port', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, URLParse(s).port);
        }
    });

    /**
     *
     *
     * @function uri.pathname
     * @example (uri.pathname)
     * @returns {}
     */
    dsl.defineFunction('uri.pathname', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, URLParse(s).pathname);
        }
    });

    /**
     *
     *
     * @function uri.query
     * @example (uri.query)
     * @returns {}
     */
    dsl.defineFunction('uri.query', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, URLParse(s).query);
        }
    });

    /**
     *
     *
     * @function uri.hash
     * @example (uri.hash)
     * @returns {}
     */
    dsl.defineFunction('uri.hash', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, URLParse(s).hash);
        }
    });

    /**
     *
     *
     * @function uri.href
     * @example (uri.href)
     * @returns {}
     */
    dsl.defineFunction('uri.href', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(s, ret) {
            return ret(null, URLParse(s).href);
        }
    });

    /**
     *
     *
     * @function uri.build
     * @example (uri.build)
     * @returns {}
     */
    dsl.defineFunction('uri.build', {
        signature: [[HASH_TYPE],STRING_TYPE],
        implementation: function(o, ret) {
            var url = new URLParse('');
            for (var name in o) url.set(name, o[name]);
            return ret(null, url.toString());
        }
    });

    /**
     *
     *
     * @function uri.encode
     * @example (uri.encode)
     * @returns {}
     */
    dsl.defineFunction('uri.encode', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(a, ret) {
            return ret(null, encodeURI(a));
        }
    });

    /**
     *
     *
     * @function uri.decode
     * @example (uri.decode)
     * @returns {}
     */
    dsl.defineFunction('uri.decode', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(a, ret) {
            return ret(null, decodeURI(a));
        }
    });

    /**
     *
     *
     * @function uri.encode-component
     * @example (uri.encode-component)
     * @returns {}
     */
    dsl.defineFunction('uri.encode-component', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(a, ret) {
            return ret(null, encodeURIComponent(a));
        }
    });

    /**
     *
     *
     * @function uri.decode-component
     * @example (uri.decode-component)
     * @returns {}
     */
    dsl.defineFunction('uri.decode-component', {
        signature: [[STRING_TYPE],STRING_TYPE],
        implementation: function(a, ret) {
            return ret(null, decodeURIComponent(a));
        }
    });

    return dsl;
};
