'use strict';

var OBJECT_TYPE = 'object';
var STRING_TYPE = 'string';
var DEFINE_ERROR = new Error('Runiq: Improper definition syntax');

function expandWithDefinition(thing, name, lambda) {
    if (Array.isArray(thing)) {
        for (var i = 0; i < thing.length; i++) {
            thing[i] = expandWithDefinition(thing[i], name, lambda);
        }
        if (thing[0] === name) {
            thing.shift();
            for (var j = lambda.length - 1; j >= 0; j--) {
                thing.unshift(lambda[j]);
            }
        }
        return thing;
    }
    if (typeof thing === OBJECT_TYPE) {
        if (thing["'"]) {
            thing["'"] = expandWithDefinition(thing["'"], name, lambda);
        }
        return thing;
    }
    return thing;
}

function getDefinedParts(list) {
    var name = list.shift();
    var params = [];
    var body;
    var program = [];

    var foundBody = false;

    while (list.length > 0) {
        var next = list.shift();

        if (!foundBody) {
            if (typeof next === STRING_TYPE) {
                params.push(next);
                continue;
            }
            if (typeof next === OBJECT_TYPE) {
                foundBody = true;
                body = next["'"];
                if (!body || !Array.isArray(body)) {

                    return DEFINE_ERROR;
                }
                continue;
            }
            return DEFINE_ERROR;
        }

        program.push(next);
    }

    return {
        name: name,
        params: params,
        body: body,
        program: program
    };
}

module.exports = {
    getDefinedParts: getDefinedParts,
    expandWithDefinition: expandWithDefinition
};
