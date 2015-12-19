'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - timer', function(t) {
    t.plan(1);
    var lib = RuniqLib();
    lib.functions['foo'] = function() {
        var out = this.args.join('');
        return this.cb(null, out);
    };
    function rand() {
        return ~~(Math.random() * 100);
    }
    var interpreter = new RuniqInterpreter(lib, {debug: true});
    var program = [
        ['foo',
            ['after', rand(), {"'": ['+', 1, 2]}],
            ['after', rand(), {"'": ['-', 3, 2]}],
            ['after', rand(), {"'": ['*', 5, 2]}],
            ['after', rand(), {"'": ['/', 7, 2]}],
            ['after', rand(), {"'": ['+', 9, 2]}]],
    ];
    var argv = [];
    var expected = "31103.511";
    var callback = function(err, result) {
        t.equal(JSON.stringify(result), JSON.stringify(expected));
    };
    interpreter.run(program, argv, null, callback);
});
