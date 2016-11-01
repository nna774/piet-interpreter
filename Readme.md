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
  while(world.halt) {
    console.log(world.env.output);
    world = interpreter.next(world); // step execution
  }
});

const p2 = loader.load(...); // another piet
p2.then((code) => {
  console.log(interpreter.run(code, input)); // run piet and returns output
});
```

## public env members

* `x`: current codel position x
* `y`: current codel position y

like above

```
code(x,y)
  0,0 0,1 0,2...
  1,0 1,1...
  2,0...
```

* `dp`: direction pointer status
* `cc`: codel chooser statu

```
dp
  0, 4, 8...: right →
  1, 5, 9...: down ↓
  2, 6, 10..: left ←
  3, 7, 11..: up ↑

cc
  even: left ←
  odd: right →
```

* `stack`: stack status
* `input`: input
* `output`: output
