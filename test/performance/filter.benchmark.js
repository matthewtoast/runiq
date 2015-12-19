'use strict';

var Benchmark = require('benchmark');
var Lodash = require('lodash');
var Runiq = require('./../../runiq');
var RuniqLib = require('./../../lib');

var lib = RuniqLib();

var source = " " +
  " (list.filter (quote (1 2 3 4 5 6 7 8 9 0)) (lambda n" +
  "  '(< n 3) " +
  " ))        " ;

function runiq(deferred) {
    return Runiq.run(source, {
        success: function(result) {
            return deferred.resolve();
        }
    }, lib);
}

function js(deferred) {
    Lodash.filter([1,2,3,4,5,6,7,8,9,0], function(n) {
        return n < 3;
    });
    return deferred.resolve();
}

console.log('filter');
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
