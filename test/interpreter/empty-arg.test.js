'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - empty array arg', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var program = ['+', 1, ['list']]; 
    var argv = [];
    var event = null;
    var expected = '1'; // JS casting 'wat'
    var callback = function(err, result) {
        t.equal(result, expected);
    };
    interpreter.run(program, argv, event, callback);
});
