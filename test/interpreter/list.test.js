'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - list i', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var program = [
        ['list', 1, 2, 3]
    ];
    var argv = [];
    var event = null;
    var expected = [1,2,3];
    var callback = function(err, result) {
        t.equal(JSON.stringify(result), JSON.stringify(expected));
    };
    interpreter.run(program, argv, event, callback);
});
