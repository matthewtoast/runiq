'use strict';

var Utils = require('./_utils');

var STRING_TYPE = 'string';
var LIST_TYPE = 'list';
var REST_TYPE = '...';

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
            this.list.shift();
            var parts = Utils.getDefinedParts(this.list);
            if (parts instanceof Error) return this.cb(parts);

            var lambda = ['lambda'];
            for (var i = 0; i < parts.params.length; i++) lambda.push(parts.params[i]);
            lambda.push({"'": parts.body});

            var expanded = Utils.expandWithDefinition(parts.program, parts.name, lambda);
            if (expanded[0] !== 'define') expanded.unshift('sequence');
            return this.cb(null, expanded);
        }
    });
};
