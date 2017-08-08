const assert = require('assert');
const Promise = require('bluebird'); Promise.longStackTraces();


module.exports = function Promise_serial(promises, {parallelize=1, log_progress}={}) {

    validate_input(promises, {parallelize});

    const chunks = build_chunks_of_parralel_promises(promises, parallelize);

    const log = build_logger(promises.length, log_progress);

    let overall_promise = Promise.resolve();

    let output = [];
    chunks.forEach(chunk => {
        const chunk_overall_promise = () => {
            const chunk_promises = chunk.map(p => log(p()))
            let chunk_overall_promise = (
                chunk_promises.length === 1 ?
                    chunk_promises[0].then(result => [result]) :
                    Promise.all(chunk_promises)
                );
                chunk_overall_promise = chunk_overall_promise.then(result => {output = output.concat(result)});
                return chunk_overall_promise;
        };
        overall_promise = overall_promise.then(chunk_overall_promise);
    });
    overall_promise = overall_promise.then(() => {
        assert(output.length===promises.length);
        return output;
    });

    return overall_promise;

    function build_chunks_of_parralel_promises(promises, parallelize) { 
        const chunks = [];

        const chunk = [];
        promises.forEach((p, i) => {
            chunk.push(p)
            if( chunk.length >= parallelize || i===promises.length-1 ) {
                chunks.push(Array.from(chunk));
                chunk.length = 0;
                assert(chunk.length === 0);
            }
        });

        assert(chunks.map(c => c.length).reduce((total, len) => total+len, 0) === promises.length);
        assert(chunks.map(c => c.length).every(len => 1 <= len && len<=parallelize));

        return chunks;
    } 

    function validate_input(promises, {parallelize}) { 
        if( (promises||0).constructor !== Array ) {
            throw new Error("input is expected to be an array but got: "+promises);
        }
        promises.forEach((p, i) => {
            if( !((p||0).constructor instanceof Function) ) {
                throw new Error("the elements of the input array are expected to be functions but "+i+"-th element is: "+p);
            }
            if( p.then ) {
                throw new Error("input array "+i+"-th element is a Promise but it doesn't make sense to already run a Promise before calling Promise_serial");
            }
        });
        if( ! (parallelize >= 1) ) {
            throw new Error("parallelize option is expected to be a number greater or equal 1");
        }
    } 

    function build_logger(total, log_progress) { 
        if( ! log_progress ) {
            return (p => p);
        }

        const suffix = log_progress.constructor===String && log_progress || log_progress.constructor===Object && log_progress.suffix || '';
        const keep_last_line = log_progress.constructor===Object && log_progress.keep_last_line;
        const keep_all_lines = log_progress.constructor===Object && log_progress.keep_all_lines;

        let done = 0;

        start_log();

        return log;

        function log(p) {
            p.finally(() => {
                done++;
                logger();
            })
            return p;
        }

        function start_log() {
            logger();
        }

        function logger() {
            //make webpack not try to bundle readline
            const readline = eval("require('readline')");

            readline.clearLine(process.stdout);
            process.stdout.write(done+'/'+total+' '+suffix);
            if( total === done ) {
                if( keep_last_line || keep_all_lines ) {
                    process.stdout.write('\n');
                }
                else {
                    readline.cursorTo(process.stdout, 0);
                    readline.clearLine(process.stdout);
                }
            }
            else {
                if( keep_all_lines ) {
                    process.stdout.write('\n');
                }
                else {
                    readline.cursorTo(process.stdout, 0);
                }
            }
        }
    } 

};

