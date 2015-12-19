'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - return true', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib());
    var program = ['true'];
    var argv = [];
    var expected = true;
    var callback = function(err, result) {
        t.equal(result, expected);
    };
    interpreter.run(program, argv, null, callback);
});
