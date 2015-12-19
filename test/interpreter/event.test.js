'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - events', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var program = ['list',
        // This one should run
        ['event', 'foobar', 'foobar-payload', ['quote', [
            ['+', ['hash.fetch', 'foobar-payload', 'value'], 11]
        ]]],
        // This one shouldn't run
        ['event', 'barfoo', 'barfoo-payload', ['quote', [
            ['+', ['hash.fetch', 'barfoo-payload', 'value'], 10000]
        ]]]
    ];
    var argv = [];
    var event = { name: 'foobar', payload: { value: 12 } };
    var expected = [23];
    var callback = function(err, result) {
        t.equal(result[0], expected[0]);
    };
    interpreter.run(program, argv, event, callback);
});
