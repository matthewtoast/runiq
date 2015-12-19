'use strict';

var STRING_TYPE = 'string';
// var NULL_TYPE = 'null';
var LIST_TYPE = 'list';
var REST_TYPE = '...';
var OBJECT_TYPE = 'object';
var DEFINE_ERROR = new Error('Runiq: Improper `define` syntax');

function _expandWithDefinition(thing, name, lambda) {
    if (Array.isArray(thing)) {
        for (var i = 0; i < thing.length; i++) {
            thing[i] = _expandWithDefinition(thing[i], name, lambda);
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
            thing["'"] = _expandWithDefinition(thing["'"], name, lambda);
        }
        return thing;
    }
    return thing;
}

module.exports = function(dsl) {
    /**
     * Define a function at runtime
     * Note: This is not a global define; only the selfsame
     * descendents are transformed
     * String, [...*] -> List
     * @function define
     * @example (define foo a b c '(a b c) '(foo 1 2 3))
     * @returns {List}
     */
    dsl.defineFunction('define', {
        signature: [[STRING_TYPE,REST_TYPE],LIST_TYPE],
        implementation: function() {
            var list = this.list;
            list.shift();
            var name = list.shift();
            var params = [];
            var body;
            var prog = [];
            
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
                            return this.cb(DEFINE_ERROR);
                        }
                        continue;
                    }
                    return this.cb(DEFINE_ERROR);
                }
                prog.push(next);
            }

            var lambda = ['lambda'];
            for (var i = 0; i < params.length; i++) lambda.push(params[i]);
            lambda.push({"'": body});

            var expanded = _expandWithDefinition(prog, name, lambda);
            if (expanded[0] !== 'define') expanded.unshift('sequence');
            return this.cb(null, expanded);
        }
    });
};
