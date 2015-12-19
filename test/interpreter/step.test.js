'use strict';

var Tape = require('tape');
var RuniqInterpreter = require('./../../interpreter');
var RuniqLib = require('./../../lib');

Tape('interpreter stepping', function(t) {
    var interpreter = new RuniqInterpreter(RuniqLib(), { debug: true });
    var steps = [
        [ '+', 1, [ '-', 2, [ '*', 3, [ '/', 4, 5 ]]]],
        [ '+', 1, [ '-', 2, [ '*', 3, 0.8 ]]],
        [ '+', 1, [ '-', 2, 2.4000000000000004 ]],
        [ '+', 1, -0.40000000000000036 ],
        0.5999999999999996
    ];
    t.plan(steps.length - 1);
    function doStep(i, scope) {
        interpreter.step(steps[i], [], null, scope, function(err, result, _scope) {
            var outcome = JSON.stringify(result);
            var expected = JSON.stringify(steps[i + 1]);
            t.equal(outcome, expected);
            if (i < (steps.length - 2)) {
                doStep(i + 1, _scope);
            }
        });
    }
    doStep(0, {});
});
