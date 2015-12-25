'use strict';

// The parse function takes an array of token objects (of the kind generated
// by the lexer), and returns an AST object. 'Tokens' are just objects that
// look like this: { type: 'foo', string: 'bar' }, where the 'type' property
// is the token type as identified by the lexer, and the 'string' property is
// the raw string discovered for that token.

var JSONStableStringify = require('json-stable-stringify');

var NEWLINE = '\n';

var TYPES = {
    open: 'open',
    quote: 'quote',
    whitespace: 'whitespace',
    comment: 'comment',
    close: 'close',
    identifier: 'identifier',
    number: 'number',
    suffixed_number: 'suffixed_number',
    string: 'string',
    json: 'json',
    open_array: 'open_array',
    close_array: 'close_array',
    open_object: 'open_object',
    close_object: 'close_object'
};

// Given an array of token objects, recursively build an AST
function parse(tokens) {
    var ast = [];

    var current = ast;

    var _line = 0;
    var _char = 0;

    var openCount = 0;
    var closeCount = 0;

    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        switch (token.type) {
            case TYPES.open:
                // Every time we open a list, we drop into a sub-array
                var child = [];
                child.parent = current;
                current.push(child);
                current = child;
                openCount += 1;
                break;

            case TYPES.open_array:
            case TYPES.quote:
                var child = [];
                var quote = {"'": child };
                child.parent = current;
                current.push(quote);
                current = child;
                openCount += 1;
                break;

            case TYPES.close_array:
            case TYPES.close:
                // If no current, we probably have too many closing parens
                if (!current) _tooManyClosingParensErr(closeCount, openCount);
                // If we close a list, jump back up to the parent list
                current = current.parent;
                closeCount += 1;
                break;

            case TYPES.identifier:
            case TYPES.suffixed_number:
                current.push(token.string);
                break;

            case TYPES.number:
                current.push(Number(token.string));
                break;

            case TYPES.string:
                // We need to strip the quotes off the string entity
                var dequoted = token.string.slice(1).slice(0, token.string.length - 2);
                current.push(dequoted);
                break;

            case TYPES.json:
                try {
                    var deticked = token.string.slice(1).slice(0, token.string.length - 2);
                    current.push(JSON.parse(deticked));
                }
                catch (e) {
                    throw new Error([
                        'Runiq: Couldn\'t parse inlined JSON!',
                        '--- Error occurred at line ' + _line + ', char ' + _char
                    ].join('\n'));
                }
                break;
        }

        // Capture line numbers and columns for future use
        var lines = token.string.split(NEWLINE);
        _line += lines.length - 1;
        if (lines.length > 1) _char = lines[lines.length - 1].length;
        else _char += token.string.length;
    }

    // Raise error if we have a parentheses mismatch
    if (openCount > closeCount) _tooManyOpenParensErr(closeCount, openCount);
    if (openCount < closeCount) _tooManyClosingParensErr(closeCount, openCount);

    // For both safety and to ensure we actually have a JSON-able AST
    return JSON.parse(JSONStableStringify(ast));
}

function _tooManyClosingParensErr(closeCount, openCount) {
    throw new Error([
        'Runiq: Too many closing parentheses!',
        '--- Found ' + closeCount + ' parentheses, but expected ' + openCount
    ].join('\n'));
}

function _tooManyOpenParensErr(closeCount, openCount) {
    throw new Error([
        'Runiq: Missing closing parentheses!',
        '--- Found ' + closeCount + ' parentheses, but expected ' + openCount
    ].join('\n'));
}

module.exports = parse;
