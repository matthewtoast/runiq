'use strict';

var Fs = require('fs');
var Path = require('path');
var Tape = require('tape');
var RuniqParser = require('./../../parser');

Tape('parser - too many open parens error', function(t) {
    t.plan(2);
    var path = Path.join(__dirname, '..', 'fixtures', 'too-many-open-parens.rune');
    var source = Fs.readFileSync(path, {encoding: 'utf8'});
    try {
        RuniqParser.parse(RuniqParser.lex(source));
    }
    catch (e) {
        t.ok(e);
        t.equal(e.message.indexOf('Runiq: Missing closing parentheses!'), 0);
    }
});
