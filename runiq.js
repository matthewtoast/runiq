'use strict';

var Assign = require('lodash.assign');
var RuniqParser = require('./parser');
var RuniqInterpreter = require('./interpreter');
var RuniqLib = require('./lib');

var DEFAULT_OPTIONS = {};

function _createLibrary() {
    return RuniqLib();
}

// Just a simplified wrapper API for executing Runiq programs,
// one that assumes you probably don't need to toy around with
// the parser etc. Pass a program string, and your options,
// which can/should include a `success` and `error` callback.
function run(program, options, library) {
    var opts = Assign({}, DEFAULT_OPTIONS, options);
    var argv = opts.argv || [];
    var event = opts.event || null;

    var tokens = RuniqParser.lex(program);
    var ast = RuniqParser.parse(tokens);
    if (!library) library = _createLibrary();
    var interpreter = new RuniqInterpreter(library, opts);

    interpreter.run(ast, argv, event, function(err, result) {
        if (err && opts.error) return opts.error(err);
        if (opts.success) return opts.success(result);
    });
}

module.exports = {
    run: run
};
