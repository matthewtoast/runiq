'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - template strings', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib());
    var program = ['str.template', 'hello ${+ 1 2} there ${+ 3 4}'];
    var argv = [];
    var expected = 'hello 3 there 7';
    var callback = function(err, result) {
        t.equal(result, expected);
    };
    interpreter.run(program, argv, null, callback);
});
