'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - argv', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var program = [
        'lambda', 'a', 'b', 'c', [
            'quote', ['+', 'a', ['-', 'b', 'c']]
        ]
    ];
    var argv = [1, 11, 7];
    var expected = 5;
    var callback = function(err, result) {
        t.equal(result, expected);
    };
    interpreter.run(program, argv, null, callback);
});
