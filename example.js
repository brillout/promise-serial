// example.js
const Promise_serial = require('./');


const promises =
    Array(15).fill()
    .map((_, i) =>
        () => new Promise(resolve => {
            console.log('promise '+i+' start');
            setTimeout(
                () => {
                    console.log('promise '+i+' end');
                    resolve();
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
.then(() => {
    console.log('### Run promises in series of 10')
    return Promise_serial(promises, {parallelize: 10});
});
