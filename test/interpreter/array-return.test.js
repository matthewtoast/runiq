'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - array return', function(t) {
    t.plan(1);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var program = [
        ['event', 'ready', '_', ['quote', ['dom-text', 'howdy']]]
    ];
    var argv = [];
    var event = { name: 'ready', payload: 123 };
    var expected = ['dom-text','howdy'];
    var callback = function(err, result) {
        t.equal(JSON.stringify(result), JSON.stringify(expected));
    };
    interpreter.run(program, argv, event, callback);
});
