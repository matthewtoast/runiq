'use strict';

function defineize(program, name, body, params) {
    if (Array.isArray(program)) {
        for (var i = 0; i < program.length; i++) {
            var step = program[i];
            defineize(step, name, body, params);
        }
        if (program[0] === name) {
            program[0] = 'lambda';
            program.splice(1, 0, body);
            for (var j = params.length - 1; j >= 0; j--) {
                var param = params[j];
                program.splice(1, 0, param);
            }
        }
    }
    if (typeof program === 'object') {
        if (program["'"]) {
            defineize(program["'"], name, body, params);
        }
    }
}

module.exports = function(dsl) {
    dsl.definePreprocessor('define', {
        implementation: function(list, program, cb) {
            list.shift();
            var name = list.shift();
            var params = [];
            while (list.length > 0) {
                var element = list.shift();
                if (typeof element === 'string') params.push(element);
                if (typeof element === 'object') {
                    params.push(element);
                    break;
                }
            }
            var body = params.pop();
            defineize(program, name, body, params);
            return cb(null, program);
        }
    });

    return dsl;
};
