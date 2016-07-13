const assert = require('assert');
const Promise = require('bluebird'); Promise.longStackTraces();


module.exports = function Promise_serial(promises, {parallelize=1, log_progress}={}) {

    const on_progress = ! log_progress ? (() =>{}) : ({total, success, fail}) => {
        require('readline').clearLine(process.stdout);
        process.stdout.write(success+'/'+total+' '+(log_progress.constructor===String?log_progress:''));
        require('readline').cursorTo(process.stdout, 0);
        if( total === success + fail ) {
            require('readline').clearLine(process.stdout);
        }
    };

    if( ! (parallelize >= 1) ) {
        throw new Error("parallelize option is expected to be greater or equal 1");
    }
    if( (promises||0).constructor !== Array ) {
        throw new Error("input is expected to be an array but got: "+promises);
    }
    promises.forEach((p, i) => {
        if( (p||0).constructor !== Function ) {
            throw new Error("the elements of the input array are expected to be functions but "+i+"-th element is: "+p);
        }
        if( p.then ) {
            throw new Error("input array "+i+"-th element is a Promise but it doesn't make sense to already run a Promise before calling Promise_serial");
        }
    });

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

    var returned_promise = Promise.resolve();

    const promises_count = {
        total: promises.length,
        fail: 0,
        success: 0,
    };

    on_progress(promises_count);

    chunks.forEach(parallelized_promises => {
        const chunk_promise =
            parallelized_promises.length === 1  ?
                () => log_promise(parallelized_promises[0]()) :
                () => Promise.all(parallelized_promises.map(p => log_promise(p()))) ;
        returned_promise = returned_promise.then(chunk_promise);

        function log_promise(p) {
            p
            .then(() => promises_count.success++ )
            .catch(() => promises_count.fail++ )
            .then(() => on_progress(promises_count) )
            return p;
        }
    });

    return returned_promise;

};

