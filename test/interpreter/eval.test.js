'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - eval', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var program = [
        'eval', '(+ 1 2)'
    ];
    var argv = [];
    var event = null;
    var expected = 3;
    var callback = function(err, result) {
        t.equal(result, expected);
    };
    interpreter.run(program, argv, event, callback);
});
