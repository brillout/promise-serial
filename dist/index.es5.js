'use strict';

var assert = require('assert');
var Promise = require('bluebird');Promise.longStackTraces();

module.exports = function Promise_serial(promises) {
    var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var _ref$parallelize = _ref.parallelize;
    var parallelize = _ref$parallelize === undefined ? 1 : _ref$parallelize;
    var log_progress = _ref.log_progress;


    var on_progress = !log_progress ? function () {} : function (_ref2) {
        var total = _ref2.total;
        var success = _ref2.success;
        var fail = _ref2.fail;

        require('readline').clearLine(process.stdout);
        var suffix = log_progress.constructor === String && log_progress || log_progress.constructor === Object && log_progress.suffix || '';
        var keep_last_line = log_progress.constructor === Object && log_progress.keep_last_line;
        var keep_all_lines = log_progress.constructor === Object && log_progress.keep_all_lines;
        process.stdout.write(success + '/' + total + ' ' + suffix);
        if (total === success + fail) {
            if (keep_last_line || keep_all_lines) {
                process.stdout.write('\n');
            } else {
                require('readline').cursorTo(process.stdout, 0);
                require('readline').clearLine(process.stdout);
            }
        } else {
            if (keep_all_lines) {
                process.stdout.write('\n');
            } else {
                require('readline').cursorTo(process.stdout, 0);
            }
        }
    };

    if (!(parallelize >= 1)) {
        throw new Error("parallelize option is expected to be greater or equal 1");
    }
    if ((promises || 0).constructor !== Array) {
        throw new Error("input is expected to be an array but got: " + promises);
    }
    promises.forEach(function (p, i) {
        if ((p || 0).constructor !== Function) {
            throw new Error("the elements of the input array are expected to be functions but " + i + "-th element is: " + p);
        }
        if (p.then) {
            throw new Error("input array " + i + "-th element is a Promise but it doesn't make sense to already run a Promise before calling Promise_serial");
        }
    });

    var chunks = [];
    var chunk = [];
    promises.forEach(function (p, i) {
        chunk.push(p);
        if (chunk.length >= parallelize || i === promises.length - 1) {
            chunks.push(Array.from(chunk));
            chunk.length = 0;
            assert(chunk.length === 0);
        }
    });

    assert(chunks.map(function (c) {
        return c.length;
    }).reduce(function (total, len) {
        return total + len;
    }, 0) === promises.length);
    assert(chunks.map(function (c) {
        return c.length;
    }).every(function (len) {
        return 1 <= len && len <= parallelize;
    }));

    var returned_promise = Promise.resolve();

    var promises_count = {
        total: promises.length,
        fail: 0,
        success: 0
    };

    on_progress(promises_count);

    chunks.forEach(function (parallelized_promises) {
        var chunk_promise = parallelized_promises.length === 1 ? function () {
            return log_promise(parallelized_promises[0]());
        } : function () {
            return Promise.all(parallelized_promises.map(function (p) {
                return log_promise(p());
            }));
        };
        returned_promise = returned_promise.then(chunk_promise);

        function log_promise(p) {
            p.then(function () {
                return promises_count.success++;
            }).catch(function () {
                return promises_count.fail++;
            }).then(function () {
                return on_progress(promises_count);
            });
            return p;
        }
    });

    return returned_promise;
};

