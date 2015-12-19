#!/usr/bin/env node

'use strict';

var Fs = require('fs');
var Os = require('os');
var Program = require('commander');
var Repl = require('repl');
var Runiq = require('./../runiq');
var RuniqLib = require('./../lib');

var version = require('./../package.json')['version'];

Program
    .version(version)
    .usage('[options] <file>')
    .option('-v, --verbose', 'Verbose output');

Program.parse(process.argv);

var filename = Program.args.shift();
if (filename) {
    // If we got a file, execute it
    var fileContent = Fs.readFileSync(filename, 'utf8');
    var givenArgv = Program.args.splice(0);
    run(fileContent, givenArgv, function(result) {
        process.stdout.write(result);
    });
}
else {
    // If no arguments were passed, open a REPL
    console.log('Runiq (' + version + ')');
    var empty = '(' + Os.EOL + ')';
    Repl.start({
        input: process.stdin,
        output: process.stdout,
        eval: function(cmd, context, filename, callback) {
            if (cmd === empty) return callback();
            return run(cmd, [], callback);
        }
    });
}

var lib = RuniqLib();

function run(program, argv, cb) {
    Runiq.run(program, {
        argv: argv,
        debug: !!Program.verbose,
        error: function(err) {
            return console.error(err);
        },
        success: function(result) {
            var writeable = (result && result + '') || '';
            return cb(writeable);
        }
    }, lib);
}
