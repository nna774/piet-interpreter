const assert = require('assert');

const interpreter = require('../lib/interpreter.js');

describe('interpreter', () => {
  describe('print and div by 2 loop', () => {
    const code = [
      ['lred', 'dblue', 'dgreen', 'lyellow', 'lmagenta', 'dyellow', 'cyan', 'dred', 'black', 'white', 'dred'],
      ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'dred', 'dred', 'white', 'dred'],
      ['white', 'dcyan', 'white', 'white', 'white', 'black', 'white', 'yellow', 'black', 'white', 'dred'],
      ['white', 'dcyan', 'dcyan', 'dcyan', 'dcyan', 'dcyan', 'dyellow', 'yellow', 'white', 'black', 'dred'],
    ];
    // this code is like below C++ code

    // int n;
    // std::cin >> n;
    // while(true) {
    //   std::cout << n;
    //   n /= 2;
    //   if (n == 0) break;
    // }

    it('starts with 0', () => {
      const output = interpreter.run(code, ['0']);
      assert.equal('0', output);
    });
    it('starts with 10', () => {
      const output = interpreter.run(code, ['10']);
      assert.equal('105210', output);
    });
  });
});
