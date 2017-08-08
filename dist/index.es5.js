'use strict';

var assert = require('assert');
var Promise = require('bluebird');Promise.longStackTraces();

module.exports = function Promise_serial(promises) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$parallelize = _ref.parallelize,
        parallelize = _ref$parallelize === undefined ? 1 : _ref$parallelize,
        log_progress = _ref.log_progress;

    validate_input(promises, { parallelize: parallelize });

    var chunks = build_chunks_of_parralel_promises(promises, parallelize);

    var log = build_logger(promises.length, log_progress);

    var overall_promise = Promise.resolve();

    var output = [];
    chunks.forEach(function (chunk) {
        var chunk_overall_promise = function chunk_overall_promise() {
            var chunk_promises = chunk.map(function (p) {
                return log(p());
            });
            var chunk_overall_promise = chunk_promises.length === 1 ? chunk_promises[0].then(function (result) {
                return [result];
            }) : Promise.all(chunk_promises);
            chunk_overall_promise = chunk_overall_promise.then(function (result) {
                output = output.concat(result);
            });
            return chunk_overall_promise;
        };
        overall_promise = overall_promise.then(chunk_overall_promise);
    });
    overall_promise = overall_promise.then(function () {
        assert(output.length === promises.length);
        return output;
    });

    return overall_promise;

    function build_chunks_of_parralel_promises(promises, parallelize) {
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

        return chunks;
    }

    function validate_input(promises, _ref2) {
        var parallelize = _ref2.parallelize;

        if ((promises || 0).constructor !== Array) {
            throw new Error("input is expected to be an array but got: " + promises);
        }
        promises.forEach(function (p, i) {
            if (!(p instanceof Function)) {
                throw new Error("the elements of the input array are expected to be functions but " + i + "-th element is: " + p);
            }
            if (p.then) {
                throw new Error("input array " + i + "-th element is a Promise but it doesn't make sense to already run a Promise before calling Promise_serial");
            }
        });
        if (!(parallelize >= 1)) {
            throw new Error("parallelize option is expected to be a number greater or equal 1");
        }
    }

    function build_logger(total, log_progress) {
        if (!log_progress) {
            return function (p) {
                return p;
            };
        }

        var suffix = log_progress.constructor === String && log_progress || log_progress.constructor === Object && log_progress.suffix || '';
        var keep_last_line = log_progress.constructor === Object && log_progress.keep_last_line;
        var keep_all_lines = log_progress.constructor === Object && log_progress.keep_all_lines;

        var done = 0;

        start_log();

        return log;

        function log(p) {
            p.finally(function () {
                done++;
                logger();
            });
            return p;
        }

        function start_log() {
            logger();
        }

        function logger() {
            //make webpack not try to bundle readline
            var readline = eval("require('readline')");

            readline.clearLine(process.stdout);
            process.stdout.write(done + '/' + total + ' ' + suffix);
            if (total === done) {
                if (keep_last_line || keep_all_lines) {
                    process.stdout.write('\n');
                } else {
                    readline.cursorTo(process.stdout, 0);
                    readline.clearLine(process.stdout);
                }
            } else {
                if (keep_all_lines) {
                    process.stdout.write('\n');
                } else {
                    readline.cursorTo(process.stdout, 0);
                }
            }
        }
    }
};

