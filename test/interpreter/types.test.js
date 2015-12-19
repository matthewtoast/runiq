'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - types processing', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), {debug:true});
    var program = [
        ['hash.to-json',
            ['hash',
                'a', 1,
                'b', 2,
                'c', 3,
                'd', ['number', '1'],
                'e', ['string', 1],
                'f', ['bool', 1],
                'g', ['hash', 'foo', 'bar'],
                'h', ['list', 1, 2, 3]
            ]
        ]
    ];
    var argv = [];
    var expected = JSON.stringify({"a":1,"b":2,"c":3,"d":1,"e":"1","f":true,"g":{"foo":"bar"},"h":[1,2,3]});
    var callback = function(err, result) {
        t.equal(result, expected);
    };
    interpreter.run(program, argv, null, callback);
});
