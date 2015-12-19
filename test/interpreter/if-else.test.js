'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - if/else', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var program = [
        ['call',
            ['lambda', 'a', 'b', 'c', ['quote',
                ['if', ['>=', 'c', 6],
                    ['quote', ['-', 'b', 23]],
                 'else',
                    ['quote', ['a']]
                ]
            ]],
            1, 3, 7
        ]
    ];
    var argv = [];
    var expected = -20;
    var callback = function(err, result) {
        t.equal(result, expected);
    };
    interpreter.run(program, argv, null, callback);
});
