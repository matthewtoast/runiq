'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - fibonacci recursive', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib());
    var program = [
        ['ycomb',
            ['lambda', 'fn', 'n', ['quote',
                ['if', ['<=', 'n', 2],
                    ['quote', [1]],
                 'else',
                    ['quote', ['+',
                        ['ycomb', 'fn', ['-', 'n', 1]],
                        ['ycomb', 'fn', ['-', 'n', 2]]
                    ]]
                ]
            ]],
            16
        ]
    ];
    var argv = [];
    var expected = 987;
    var callback = function(err, result) {
        t.equal(result, expected);
    };
    interpreter.run(program, argv, null, callback);
});
