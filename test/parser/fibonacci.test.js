'use strict';

var Fs = require('fs');
var Path = require('path');
var Tape = require('tape');
var RuniqParser = require('./../../parser');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

var tests = {
    'fibonacci.rune': true,
};

Tape('parser - fibonacci', function(t) {
    t.plan(Object.keys(tests).length);
    for (var filename in tests) {
        var path = Path.join(__dirname, '..', 'fixtures', filename);
        var source = Fs.readFileSync(path, {encoding: 'utf8'});
        var ast = RuniqParser.parse(RuniqParser.lex(source));
        var interpreter = new RuniqInterpreter(RuniqLib());
        interpreter.run(ast, [], null, function(err, data) {
            t.equal(21, data);
        });
    }
});
