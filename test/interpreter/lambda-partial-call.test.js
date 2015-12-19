'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - lambda partial call', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var program = [
        'call',['lambda','a','b','c',['quote',['+','a',['-','b','c']]],1,2],3
    ];
    var argv = [];
    var expected = 0;
    var callback = function(err, result) {
        t.equal(JSON.stringify(result), JSON.stringify(expected));
    };
    interpreter.run(program, argv, null, callback);
});
