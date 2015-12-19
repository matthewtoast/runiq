'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - constants', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var program = [
        '+', 'PI', 'E'
    ];
    var argv = [];
    var event = null;
    var expected = 5.859874482048838;
    var callback = function(err, result) {
        t.equal(result, expected);
    };
    interpreter.run(program, argv, event, callback);
});
