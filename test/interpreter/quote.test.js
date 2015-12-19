'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - quoting', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var quotable = ['+', 1, 2];
    var program = [
        'quote', quotable
    ];
    var argv = [];
    var expected = ["+",1,2];
    var callback = function(err, result) {
        t.equal(JSON.stringify(result), JSON.stringify(expected));
    };
    interpreter.run(program, argv, null, callback);
});
