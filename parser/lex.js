'use strict';

// Note: I took the basic idea for this lexer from the original
// parser for CoffeeScript. The basic idea is to use regexes to
// extract parts of the source a chunk at a time. Each chunk maps
// to a defined type, and a corresponding token object is created
// and added to an array.

var BOM_CODE = 65279;
var CR_REGEXP = /\r/g;
var TRAILING_WHITESPACE_REGEXP = /\s+$/;
var BLANK = '';

var SYMBOLS = '~!@#$%^&*-_=+/|:\'<,>.?'.split('').join('\\');

var REGEXPS = {
    open: /^\(/,
    close: /^\)/,
    quote: /^'\(/,
    whitespace: /^[\s]+/,
    comment: /^;([^;][\s\S]*?)?;/,
    number: /^0b[01]+|^0o[0-7]+|^0x[\da-f]+|^-?\d*\.?\d+(?:e[+-]?\d+)?/i,
    string: /^"[^\\"]*(?:\\[\s\S][^\\"]*)*"/,
    json: /^`([^`][\s\S]*?)?`/,
    identifier: new RegExp('^([$A-Za-z_' + SYMBOLS + '\\x7f-\\uffff][$\\w\\x' + SYMBOLS + '7f-\\uffff]*)([^\\n\\S]*:(?!:))?'),
    open_array: /^\[/,
    close_array: /^\]/
};

// Remove any unwanted characters from the raw source code string
function clean(source) {
    if (!source) return BLANK;
    if (source.charCodeAt(0) === BOM_CODE) source = source.slice(1);
    source = source.replace(CR_REGEXP, BLANK).replace(TRAILING_WHITESPACE_REGEXP, BLANK);
    return source;
}

// Return an array of token objects for the clean source code string
function lex(source) {
    var tokens = [];
    var chunk = clean(source);
    var total = chunk.length;
    var iterations = 0;

    while (chunk.length > 0) {
        for (var regexpName in REGEXPS) {
            var regexp = REGEXPS[regexpName];
            var match = regexp.exec(chunk);

            if (match) {
                var original = match[0];
                var str = original;
                if (regexpName === 'string') str = str.replace(/\\"/g, '"');
                tokens.push({ type: regexpName, string: str, original: original });
                // Need to slice the chunk at the original match length
                chunk = chunk.slice(match[0].length, chunk.length);
                break;
            }
        }

        // We've probably failed to parse correctly if we get here
        if (iterations++ > total) {
            var parts = [
                'Runiq: Lexer ran too many iterations!',
                '--- Failed at chunk: `' + chunk + '`'
            ];
            throw new Error(parts.join('\n'));
        }
    }

    return tokens;
}

module.exports = lex;
