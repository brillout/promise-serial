// example.js
const Promise_serial = require('./dist/index.es5.js');


const promises =
    Array(15).fill()
    .map((_, i) =>
        () => new Promise(resolve => {
            console.log('promise '+i+' start');
            setTimeout(
                () => {
                    console.log('promise '+i+' end');
                    resolve('output-'+i);
                },
                500
            );
        })
    );


console.log('### Run promises in sequence')
Promise_serial(promises)
.then(() => {
    console.log('### Run promises in series of 5')
    return Promise_serial(promises, {parallelize: 5});
})
.then(output => {
    console.log('### Run promises in series of 10')
    return (
        Promise_serial(promises, {parallelize: 10})
        .then(output => {console.log('Resolved values: '+JSON.stringify(output))})
    );
});
