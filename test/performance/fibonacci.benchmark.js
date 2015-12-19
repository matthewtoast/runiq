'use strict';

var Benchmark = require('benchmark');
var Runiq = require('./../../runiq');
var RuniqLib = require('./../../lib');

var lib = RuniqLib();

var source = " " +
    " (ycomb (lambda fn n              " +
    "     '(if (<= n 2)                " +
    "         '(1)                     " +
    "      else                        " +
    "         '(+ (ycomb fn (- n 1))   " +
    "             (ycomb fn (- n 2)))) " +
    " ) 8)                             " ;

function runiq(deferred) {
    return Runiq.run(source, {
        success: function(result) {
            return deferred.resolve();
        }
    }, lib);
}

function fib(n) {
    if (n <= 2) return 1;
    return fib(n - 1) + fib(n - 2);
}

function js(deferred) {
    fib(8);
    return deferred.resolve();
}

console.log('fibonacci');
var suite = new Benchmark.Suite;
suite.add('runiq', {
    'defer': true,
    'fn': function(deferred) {
        return runiq(deferred);
    }
})
suite.add('js', {
    'defer': true,
    'fn': function(deferred) {
        return js(deferred);
    }
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
.run({
  'async': true
});
