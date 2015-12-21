'use strict';

var Fs = require('fs');
var Path = require('path');
var Tape = require('tape');
var Runiq = require('./../../runiq');

var tests = {
    'component.rune': 2,
};

Tape('integration - component', function(t) {
    t.plan(Object.keys(tests).length);

    for (var filename in tests) {
        var path = Path.join(__dirname, '..', 'fixtures', filename);
        var source = Fs.readFileSync(path, {encoding: 'utf8'});
        Runiq.run(source, {
            error: function(error) {
                console.log(error);
            },
            success: function(result) {
                t.equal(result, tests[filename]);
            }
        });
    }
});
