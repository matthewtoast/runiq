'use strict';

var Trunc = require('lodash.trunc');

function printDebug(inst, thing) {
    printMessage('DEBUG', inst, thing);
}

function printWarning(inst, thing) {
    printMessage('WARN', inst, thing);
}

function printError(inst, thing, state) {
    printMessage('ERROR', inst, thing);
    printMessage('ERROR', inst, 'Error occurred while processing list ' + inst.counter + '');
    if (state) printMessage('ERROR', inst, state);
}

function printMessage(type, inst, thing) {
    var meth = 'info';
    if (type === 'ERROR') meth = 'error';
    if (type === 'WARN') meth = 'warn';
    var info =
        'Runiq [' + type + ']: ' +
        '(' + inst.counter + ') ' +
        Trunc(JSON.stringify(thing), 60)
    console[meth](info);
}

module.exports = {
    printDebug: printDebug,
    printWarning: printWarning,
    printError: printError,
    printMessage: printMessage
};
