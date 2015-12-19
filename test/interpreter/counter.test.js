'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter - counter', function(t) {
    t.plan(1);
    var lib = RuniqLib();
    lib.functions['foo'] = function() {
        var out = this.args.join('');
        return this.cb(null, out);
    };
    lib.functions['counter'] = function() {
        return this.cb(null, this.id + '-');
    };
    function rand() {
        return ~~(Math.random() * 100);
    }
    var interpreter = new RuniqInterpreter(lib, { debug: true });
    var program = [
        ['foo',
            ['after', rand(), {"'": ['counter']}],
            ['after', rand(), {"'": ['counter']}],
            ['after', rand(), {"'": ['foo',
                ['after', rand(), {"'": ['counter']}],
                ['after', rand(), {"'": ['counter']}],
                ['after', rand(), {"'": ['counter']}],
            ]}],
            ['after', rand(), {"'": ['counter']}],
            ['after', rand(), {"'": ['counter']}]],
    ];
    var argv = [];
    var expected = "8-9-18-19-20-14-15-";
    var callback = function(err, result) {
        t.equal(JSON.stringify(result), JSON.stringify(expected));
    };
    interpreter.run(program, argv, null, callback);
});
