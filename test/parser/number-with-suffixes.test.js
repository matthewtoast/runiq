'use strict';

var Fs = require('fs');
var Path = require('path');
var Tape = require('tape');
var RuniqParser = require('./../../parser');

Tape('parser - numbers with suffixes', function(t) {
    t.plan(2);
    var path = Path.join(__dirname, '..', 'fixtures', 'numbers-with-suffixes.rune');
    var source = Fs.readFileSync(path, {encoding: 'utf8'});
    var ast = RuniqParser.parse(RuniqParser.lex(source));
    t.ok(ast);
    t.equal(JSON.stringify(ast), JSON.stringify([ { '\'': [ '1px', '10px', '100%', '2000em', '1.1px', '1.2em', '1.002%' ] } ]));
});
