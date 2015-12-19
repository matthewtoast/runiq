'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - parallel iii', function(t) {
    t.plan(1);
    var lib = RuniqLib();
    lib.functions['foo'] = function() {
        var out = this.args.join('');
        return this.cb(null, out);
    };
    var interpreter = new RuniqInterpreter(lib, { debug: true });
    var program = [
        ['foo',
            ['+', 1, 2],
            ['-', 3, 2],
            ['*', 5, 2],
            ['/', 7, [['+', 3, 3],
                      ['-', 3, 3],
                      ['*', 5, 3],
                      ['/', 7, 3],
                      ['+', 9, 3],
                      ['-', 1, 3],
                      ['*', 1, 2]]],
            ['+', 9, 2],
            ['-', 1, 2],
            ['*', 3, 2]],
    ];
    var argv = [];
    var expected = "31103.511-16";
    var callback = function(err, result) {
        t.equal(JSON.stringify(result), JSON.stringify(expected));
    };
    interpreter.run(program, argv, null, callback);
});
