'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - let', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var program = [
        'let', 'wow', ['quote', ['lambda', 'n', ['quote', ['+', 'n', 'n']]]],
        'let', 'whoa', ['quote', ['lambda', ['quote', ['+',3,4]]]],
        'call', 'wow', 'whoa'
    ];
    var argv = [];
    var event = null;
    var expected = 14;
    var callback = function(err, result) {
        t.equal(result, expected);
    };
    interpreter.run(program, argv, event, callback);
});
