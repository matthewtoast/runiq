'use strict';

var SA = require('superagent');

var STRING_TYPE = 'string';
var REST_TYPE = '...';
var ANY_TYPE = '*';

/**
 * Execute a HTTP request
 *
 * @function http.request
 * @example (http.request)
 * @returns {Anything}
 */
function request(meth, url, headers, query, data, cb) {
    var req = SA(meth, url);
    if (headers) req.set(headers);
    if (query) req.query(query);
    if (data) req.send(data);
    return req.end(function(err, res) {
        if (err) return cb(err);
        return cb(null, res.text);
    });
}

/**
 * Execute a HTTP GET request
 *
 * @function http.get
 * @example (http.get)
 * @returns {Anything}
 */

/**
 * Execute a HTTP POST request
 *
 * @function http.post
 * @example (http.post)
 * @returns {Anything}
 */

/**
 * Execute a HTTP HEAD request
 *
 * @function http.head
 * @example (http.head)
 * @returns {Anything}
 */

/**
 * Execute a HTTP OPTIONS request
 *
 * @function http.options
 * @example (http.options)
 * @returns {Anything}
 */

/**
 * Execute a HTTP PUT request
 *
 * @function http.put
 * @example (http.put)
 * @returns {Anything}
 */

/**
 * Execute a HTTP DELETE request
 *
 * @function http.delete
 * @example (http.delete)
 * @returns {Anything}
 */

/**
 * Execute a HTTP PATCH request
 *
 * @function http.patch
 * @example (http.patch)
 * @returns {Anything}
 */

/**
 * Execute a HTTP TRACE request
 *
 * @function http.trace
 * @example (http.trace)
 * @returns {Anything}
 */

/**
 * Execute a HTTP CONNECT request
 *
 * @function http.connect
 * @example (http.connect)
 * @returns {Anything}
 */

var METHODS = [
    'get',
    'post',
    'head',
    'options',
    'put',
    'delete',
    'patch',
    'trace',
    'connect'
];

module.exports = function(dsl) {
    dsl.defineFunction('http.request', {
        signature: [[STRING_TYPE,STRING_TYPE,REST_TYPE],ANY_TYPE],
        implementation: request
    });

    for (var i = 0; i < METHODS.length; i++) {
        (function(i) {
            dsl.defineFunction('http.' + METHODS[i], {
                signature: [[STRING_TYPE,REST_TYPE],ANY_TYPE],
                implementation: function(url, headers, query, data, cb) {
                    return request(METHODS[i], url, headers, query, data, cb);
                }
            });
        }(i));
    }

    return dsl;
};
