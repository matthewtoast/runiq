'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - balance', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), {
        debug: true,
        balance: 0
    });
    var program = ['+', 1, 2];
    var argv = [];
    var event = null;
    var callback = function(err, result) {
        t.ok(err);
    };
    interpreter.run(program, argv, event, callback);
});
