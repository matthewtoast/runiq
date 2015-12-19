'use strict';

var Fs = require('fs');
var Path = require('path');
var Tape = require('tape');
var RuniqParser = require('./../../parser');

var tests = {
    'parse-test-1.rune': [["foo",["bar",["baz",1,"2","\'3\'",3.45],[">>>","lala","hey"]]]],
    'parse-test-2.rune': [["foo",123,"hello",["bar",-456,"howdy",["-baz",["quz"]]]]],
    'parse-test-3.rune': [["foo","hey"],["bar","hey\n"],["baz","\nhey"],["baz","hey\nthere"],["baz","\n\nhey\n\nthere\n\n   "]],
    'parse-test-4.rune': [["html","\n\n    <howdy></howdy>\n    <hi what='foo'>\n        <yes>\n        <no/>\n        <!-- What why not -->\n        <!-- I dunno -->\n    </hi>\n\n"]],
    'parse-test-5.rune': [["string-with-escapes",'\n\n    " DOES THIS WORK? "\n     "HMM I HOPE SO"\n\n    " YES\n    " INDEED\n']],
    'parse-test-6.rune': [["foo",["bar",{"'":["baz",{"'":["qux"]}]}],{"'":["chow"]}]],
    'parse-test-7.rune': [["here-is-array",{"\'":[1,2,3,4,5]},"here-is-another",{"\'":[{"\'":[{"\'":[{"\'":[{"\'":[4]}]}]}]}]},"here-is-another",{"\'":[1,{"\'":[2,3]},{"\'":[4]}]}]],
    'parse-test-8.rune': [["here-is-json",{"baz":"qux","foo":"bar"},[1,2,3]]],
};

Tape('parser - parsing tests', function(t) {
    t.plan(Object.keys(tests).length);
    for (var filename in tests) {
        var path = Path.join(__dirname, '..', 'fixtures', filename);
        var source = Fs.readFileSync(path, {encoding: 'utf8'});
        var expected = tests[filename];
        var outcome = RuniqParser.parse(RuniqParser.lex(source));
        t.equal(JSON.stringify(outcome), JSON.stringify(expected));
    }
});
