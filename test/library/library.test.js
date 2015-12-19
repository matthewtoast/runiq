'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

var tests = [
    { program: ['hash', 'a', 1], expected: {"a": 1} },
    { program: ['str.capitalize', 'hello'], expected: 'Hello' },
    { program: ['math.floor', 10.0], expected: 10 },
    { program: ['str.encode64', 'foobar'], expected: 'Zm9vYmFy' },
    { program: ['str.decode64', 'Zm9vYmFy'], expected: 'foobar' },
    { program: ['crypto.md5', 'abcde'], expected: 'ab56b4d92b40713acc5af89985d4b786' },
    { program: ['moment.now'], expected: function(r){ return r.length === 33} },
    { program: ['regexp.exec', 'abc', '123abc123'], expected: 3 },
    { program: ['uri.host', 'http://example.com?foo=ha'], expected: 'example.com' }
];

Tape('corelib', function(t) {
    t.plan(tests.length);
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    for (var i = 0; i < tests.length; i++) {
        (function(i) {
            var test = tests[i];
            interpreter.run(test.program, [], null, function(err, result) {
                if (typeof test.expected === 'function') {
                    t.ok(test.expected(result));
                }
                else {
                    t.equal(JSON.stringify(result), JSON.stringify(test.expected));
                }
            });
        }(i));
    }
});
