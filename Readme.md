# Piet-interpreter

## how to use

`code` is array of array of color.
equals [`piet-loder`](https://github.com/nna774/piet-loader)'s output.

```
const loader = require('piet-loader'); // load
const interpreter = require('piet-interpreter');

const p1 = loader.load(...); // see https://github.com/nna774/piet-loader
const input = '42 3 14 hoge'.split(' '); // input is array

p1.then((code) => {
  const world = interpreter.create(code, input);
  while(world.env.halt) {
    console.log(world.env.output);
    world = interpreter.next(world); // step execution
  }
});

const p2 = loader.load(...); // another piet
p2.then((code) => {
  console.log(interpreter.run(code, input)); // run piet and returns output
});
```
