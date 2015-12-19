'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - filter', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib());
    var program = [
        'list.filter', ['quote', [1, 2, 3]], ['lambda', 'e', ['quote',
            ['>', 'e', 1]
        ]]
    ];
    var argv = [];
    var expected = [2,3];
    var callback = function(err, result) {
        t.equal(JSON.stringify(result), JSON.stringify(expected));
    };
    interpreter.run(program, argv, null, callback);
});
