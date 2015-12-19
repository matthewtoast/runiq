'use strict';

var Fs = require('fs');
var Path = require('path');
var Tape = require('tape');
var Runiq = require('./../../runiq');

var tests = {
    'define.rune': 44,
    'define-ii.rune': 24
};

Tape('integration - define', function(t) {
    t.plan(Object.keys(tests).length);
    for (var filename in tests) {
        (function(filename) {
            var path = Path.join(__dirname, '..', 'fixtures', filename);
            var source = Fs.readFileSync(path, {encoding: 'utf8'});
            Runiq.run(source, {
                debug: true,
                success: function(result) {
                    t.equal(result, tests[filename]);
                }
            });
        }(filename));
    }
});
