'use strict';

var Fs = require('fs');
var Path = require('path');
var Tape = require('tape');
var Runiq = require('./../../runiq');

var tests = {
    'too-many-args-1.rune': true,
    'too-many-args-2.rune': true,
};

Tape('integration - type checking', function(t) {
    t.plan(Object.keys(tests).length);
    for (var filename in tests) {
        (function(filename) {
            var path = Path.join(__dirname, '..', 'fixtures', filename);
            var source = Fs.readFileSync(path, {encoding: 'utf8'});
            Runiq.run(source, {
                error: function(result) {
                    t.ok(result);
                }
            });
        }(filename));
    }
});
