'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - find-index', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib());
    var program = [
        ['list.find-index', ['quote', [1, 2, 3]], ['lambda', 'e', ['quote',
            ['==', 'e', 3]
        ]]]
    ];
    var argv = [];
    var expected = 2;
    var callback = function(err, result) {
        t.equal(result, expected);
    };
    interpreter.run(program, argv, null, callback);
});
