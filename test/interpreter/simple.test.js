'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - simple arithmetic', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib());
    var program = ['+', 1, ['*', 2, 3]];
    var argv = [];
    var expected = 7;
    var callback = function(err, result) {
        t.equal(result, expected);
    };
    interpreter.run(program, argv, null, callback);
});
