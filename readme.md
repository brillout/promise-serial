#### Usage

```js
// example.js
const Promise_serial = require('promise-serial');


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
```

`node example.js` prints:

```
### Run all promises in sequence
promise 0 start
promise 0 end
promise 1 start
promise 1 end
promise 2 start
promise 2 end
promise 3 start
promise 3 end
promise 4 start
promise 4 end
promise 5 start
promise 5 end
promise 6 start
promise 6 end
promise 7 start
promise 7 end
promise 8 start
promise 8 end
promise 9 start
promise 9 end
promise 10 start
promise 10 end
promise 11 start
promise 11 end
promise 12 start
promise 12 end
promise 13 start
promise 13 end
promise 14 start
promise 14 end
### Run all promises in series of 5
promise 0 start
promise 1 start
promise 2 start
promise 3 start
promise 4 start
promise 0 end
promise 1 end
promise 2 end
promise 3 end
promise 4 end
promise 5 start
promise 6 start
promise 7 start
promise 8 start
promise 9 start
promise 5 end
promise 6 end
promise 7 end
promise 8 end
promise 9 end
promise 10 start
promise 11 start
promise 12 start
promise 13 start
promise 14 start
promise 10 end
promise 11 end
promise 12 end
promise 13 end
promise 14 end
### Run all promises in series of 10
promise 0 start
promise 1 start
promise 2 start
promise 3 start
promise 4 start
promise 5 start
promise 6 start
promise 7 start
promise 8 start
promise 9 start
promise 0 end
promise 1 end
promise 2 end
promise 3 end
promise 4 end
promise 5 end
promise 6 end
promise 7 end
promise 8 end
promise 9 end
promise 10 start
promise 11 start
promise 12 start
promise 13 start
promise 14 start
promise 10 end
promise 11 end
promise 12 end
promise 13 end
promise 14 end
```
