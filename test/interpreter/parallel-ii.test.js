'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - parallel ii', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var program = [
        [['+', 1, 2],
         ['-', 3, 2],
         ['*', 5, 2],
         ['/', 7, 2],
         ['+', 9, 2],
         ['-', 1, 2],
         ['*', 3, 2]],
    ];
    var argv = [];
    var expected = 6;
    var callback = function(err, result) {
        t.equal(JSON.stringify(result), JSON.stringify(expected));
    };
    interpreter.run(program, argv, null, callback);
});
