'use strict';

var DSL = require('./../dsl');

module.exports = function() {
    var dsl = new DSL();
    require('./core')(dsl);
    require('./control')(dsl);
    require('./define')(dsl);
    require('./component')(dsl);
    require('./http')(dsl);
    require('./package')(dsl);
    return dsl.exportLibrary();
};
