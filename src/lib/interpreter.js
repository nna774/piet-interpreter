// interpreter.js

const table = {
  lred: [0, 0],
  lyellow: [0, 1],
  lgreen: [0, 2],
  lcyan: [0, 3],
  lblue: [0, 4],
  lmagenta: [0, 5],

  red: [1, 0],
  yellow: [1, 1],
  green: [1, 2],
  cyan: [1, 3],
  blue: [1, 4],
  magenta: [1, 5],

  dred: [2, 0],
  dyellow: [2, 1],
  dgreen: [2, 2],
  dcyan: [2, 3],
  dblue: [2, 4],
  dmagenta: [2, 5],

  white: [-1, 0],
  black: [-1, -1],
};

function eq(l1, l2) {
  if (l1.length !== l2.length) return false;
  for (let i = 0; i < l1.length; i++) {
    if (l1[i] !== l2[i]) return false;
  }
  return true;
}

function width(code) {
  return code[0].length;
}
function height(code) {
  return code.length;
}
function outside(code, codel) {
  const w = width(code);
  const h = height(code);
  return (codel[0] < 0 ||
          codel[1] < 0 ||
          codel[0] >= h ||
          codel[1] >= w);
}

function unmovable(code, codel) {
  if (outside(code, codel)) return true; // はみ出す
  return code[codel[0]][codel[1]] === 'black';
}

function mod(n, m) {
  if (n === 0 || m === 0 || n % m === 0) return 0;
  if ((n > 0 && m > 0) || (n < 0 && m < 0)) return n % m;
  return (n % m) + m;
}

function execCommand(env, currentColor, nextColor) {
  if (currentColor === 'white' || nextColor === 'white') { return; /* nothing */ }
  const currentT = table[currentColor];
  const nextT = table[nextColor];

  const diffL = (nextT[0] - currentT[0] + 3) % 3;
  const diffH = (nextT[1] - currentT[1] + 6) % 6;

  switch (diffH) {
    case 0:
      if (diffL === 0) { /* none */ }
      if (diffL === 1) { /* push */
        env.cmd = 'push';
        env.stack.push(env.area);
        return;
      }
      if (diffL === 2) { /* pop */
        env.cmd = 'pop';
        env.stack.pop();
        return;
      }
      break;
    case 1:
      if (diffL === 0) { /* add */
        env.cmd = 'add';
        if (env.stack.length < 2) return; // スタックが足りず失敗。
        const tmp1 = env.stack.pop();
        const tmp2 = env.stack.pop();
        env.stack.push(tmp1 + tmp2);
        return;
      }
      if (diffL === 1) { /* substract */
        env.cmd = 'sub';
        if (env.stack.length < 2) return; // スタックが足りず失敗。
        const tmp1 = env.stack.pop();
        const tmp2 = env.stack.pop();
        env.stack.push(tmp2 - tmp1);
        return;
      }
      if (diffL === 2) { /* multiply */
        env.cmd = 'mul';
        if (env.stack.length < 2) return; // スタックが足りず失敗。
        const tmp1 = env.stack.pop();
        const tmp2 = env.stack.pop();
        env.stack.push(tmp1 * tmp2);
        return;
      }
      break;
    case 2:
      if (diffL === 0) { /* divide */
        env.cmd = 'div';
        if (env.stack.length < 2) return; // スタックが足りず失敗。
        const tmp1 = env.stack.pop();
        const tmp2 = env.stack.pop();
        if (tmp1 !== 0) {
          env.stack.push((tmp2 / tmp1) | 0);
        } else { // 0除算して失敗した。スタックを戻す。
          env.stack.push(tmp2);
          env.stack.push(tmp1);
        }
        return;
      }
      if (diffL === 1) { /* mod */
        env.cmd = 'mod';
        if (env.stack.length < 2) return; // スタックが足りず失敗。
        const tmp1 = env.stack.pop();
        const tmp2 = env.stack.pop();
        env.stack.push(mod(tmp2, tmp1));
        return;
      }
      if (diffL === 2) { /* not */
        env.cmd = 'not';
        if (env.stack.length < 1) return; // スタックが足りず失敗。
        const tmp = env.stack.pop();
        if (tmp === 0) {
          env.stack.push(1);
        } else {
          env.stack.push(0);
        }
        return;
      }
      break;
    case 3:
      if (diffL === 0) { /* greater */
        env.cmd = 'greater';
        if (env.stack.length < 2) return; // スタックが足りず失敗。
        const tmp1 = env.stack.pop();
        const tmp2 = env.stack.pop();
        if (tmp2 > tmp1) {
          env.stack.push(1);
        } else {
          env.stack.push(0);
        }
        return;
      }
      if (diffL === 1) { /* pointer */
        env.cmd = 'pointer';
        if (env.stack.length < 1) return; // スタックが足りず失敗。
        const tmp = env.stack.pop();
        env.dp += tmp;
        return;
      }
      if (diffL === 2) { /* switch */
        env.cmd = 'switch';
        if (env.stack.length < 1) return; // スタックが足りず失敗。
        const tmp = env.stack.pop();
        env.cc += tmp;
        return;
      }
      break;
    case 4:
      if (diffL === 0) { /* duplicate */
        env.cmd = 'dup';
        if (env.stack.length < 1) return; // スタックが足りず失敗。
        const tmp = env.stack.pop();
        env.stack.push(tmp);
        env.stack.push(tmp);
      }
      if (diffL === 1) { /* roll */
        env.cmd = 'roll';
        // めんどくさい
        if (env.stack.length < 2) return; // スタックが足りず失敗。
        const tmp1 = env.stack.pop();
        const tmp2 = env.stack.pop();
        if (tmp2 < 0 || env.stack.length < tmp2) { // 深さが負、残りstackより長いロールは失敗する。
          env.stack.push(tmp2);
          env.stack.push(tmp1);
          return;
        }
        const view = new Array(tmp2);
        for (let i = 0; i < tmp2; ++i) {
          view[i] = env.stack.pop();
        }
        const res = new Array(tmp2);
        for (let i = 0; i < tmp2; ++i) {
          res[i] = view[(i + tmp1) % tmp2];
        }
        for (let i = 0; i < tmp2; ++i) {
          env.stack.push(res.pop());
        }
        return;
      }
      if (diffL === 2) { /* in(num) */
        env.cmd = 'in(n)';
        const tmp = env.input.shift();
        const num = parseInt(tmp, 10);
        if (!Number.isNaN(num)) {
          env.stack.push(num);
        } else {
          // どうしよう？
        }
        return;
      }
      break;
    case 5:
      if (diffL === 0) { /* in(char) */
        env.cmd = 'in(c)';
        const tmp = env.input.shift();
        const num = tmp.charCodeAt(0);
        env.stack.push(num);
        return;
      }
      if (diffL === 1) { /* out(num) */
        env.cmd = 'out(n)';
        if (env.stack.length < 1) return; // スタックが足りず失敗。
        const tmp = env.stack.pop();
        env.output += tmp.toString();
        return;
      }
      if (diffL === 2) { /* out(char) */
        env.cmd = 'out(c)';
        if (env.stack.length < 1) return; // スタックが足りず失敗。
        const tmp = env.stack.pop();
        env.output += String.fromCharCode(tmp);
        return;
      }
      break;
    default:
      throw new Error('never come!');
  }
}

function findNextCodelImp(env, code) {
  let list = [];
  const color = code[env.x][env.y];
  const w = width(code);
  const h = height(code);
  const dp = env.dp;
  const cc = env.cc;

  // 同色の探索
  const que = [[env.x, env.y]];
  const done = [];
  while (que.length > 0) {
    const point = que.shift();
    done.push(point);
    if (code[point[0]][point[1]] === color) {
      list.push(point);
      if (point[0] !== 0) {
        const newp = [point[0] - 1, point[1]];
        let ins = true;
        for (const p of done) {
          if (eq(p, newp)) {
            ins = false;
            break;
          }
        }
        if (ins) {
          for (const p of que) {
            if (eq(p, newp)) {
              ins = false;
              break;
            }
          }
        }
        if (ins) que.push(newp);
      }
      if (point[1] !== 0) {
        const newp = [point[0], point[1] - 1];
        let ins = true;
        for (const p of done) {
          if (eq(p, newp)) {
            ins = false;
            break;
          }
        }
        if (ins) {
          for (const p of que) {
            if (eq(p, newp)) {
              ins = false;
              break;
            }
          }
        }
        if (ins) que.push(newp);
      }
      if (point[0] !== h - 1) {
        const newp = [point[0] + 1, point[1]];
        let ins = true;
        for (const p of done) {
          if (eq(p, newp)) {
            ins = false;
            break;
          }
        }
        if (ins) {
          for (const p of que) {
            if (eq(p, newp)) {
              ins = false;
              break;
            }
          }
        }
        if (ins) que.push(newp);
      }
      if (point[1] !== w - 1) {
        const newp = [point[0], point[1] + 1];
        let ins = true;
        for (const p of done) {
          if (eq(p, newp)) {
            ins = false;
            break;
          }
        }
        if (ins) {
          for (const p of que) {
            if (eq(p, newp)) {
              ins = false;
              break;
            }
          }
        }
        if (ins) que.push(newp);
      }
    }
  }

  const area = list.length;

  let nextCodel = [-1, -1];
  switch (dp % 4) {
    case 0: {
      let max = -1;
      for (const p of list) max = Math.max(max, p[1]);
      list = list.filter((p) => p[1] === max);
      if (list.length !== 1) {
        // cc を考慮
        if (cc % 2 === 0) {
          let min = Infinity;
          for (const p of list) min = Math.min(min, p[0]);
          list = list.filter((p) => p[0] === min);
        } else {
          max = -1;
          for (const p of list) max = Math.max(max, p[0]);
          list = list.filter((p) => p[0] === max);
        }
      }
      nextCodel = list[0];
      nextCodel[1] += 1;
      break;
    }
    case 1: {
      let max = -1;
      for (const p of list) max = Math.max(max, p[0]);
      list = list.filter((p) => p[0] === max);
      if (list.length !== 1) {
        // cc を考慮
        if (cc % 2 === 0) {
          max = -1;
          for (const p of list) max = Math.max(max, p[1]);
          list = list.filter((p) => p[1] === max);
        } else {
          let min = Infinity;
          for (const p of list) min = Math.min(min, p[1]);
          list = list.filter((p) => p[1] === min);
        }
      }
      nextCodel = list[0];
      nextCodel[0] += 1;
      break;
    }
    case 2: {
      let min = Infinity;
      for (const p of list) min = Math.min(min, p[1]);
      list = list.filter((p) => p[1] === min);
      if (list.length !== 1) {
        // cc を考慮
        if (cc % 2 === 0) {
          let max = -1;
          for (const p of list) max = Math.max(max, p[0]);
          list = list.filter((p) => p[0] === max);
        } else {
          min = Infinity;
          for (const p of list) min = Math.min(min, p[0]);
          list = list.filter((p) => p[0] === min);
        }
      }
      nextCodel = list[0];
      nextCodel[1] -= 1;
      break;
    }
    case 3: {
      let min = Infinity;
      for (const p of list) min = Math.min(min, p[0]);
      list = list.filter((p) => p[0] === min);
      if (list.length !== 1) {
        // cc を考慮
        if (cc % 2 === 0) {
          let max = -1;
          for (const p of list) max = Math.max(max, p[1]);
          list = list.filter((p) => p[1] === max);
        } else {
          min = Infinity;
          for (const p of list) min = Math.min(min, p[1]);
          list = list.filter((p) => p[1] === min);
        }
      }
      nextCodel = list[0];
      nextCodel[0] -= 1;
      break;
    }
    default: {
      throw new Error('never come!');
    }
  }

  // ここに来た時、listの長さは1となっている。


  nextCodel[2] = area; // 現在の色の広さ こんなところに突っ込むのは気持ち悪いけど……。
  return nextCodel;
}

function findNextCodel(env, code) {
  const point = findNextCodelImp(env, code);

  if (outside(code, point)) { return point; }
  const color = code[point[0]][point[1]];

  point.exec = true;
  if (color === 'white') {
    point.exec = false;
    while (!outside(code, point) && code[point[0]][point[1]] === 'white') { // まっすぐ進む
      switch (env.dp % 4) {
        case 0:
          point[1]++;
          break;
        case 1:
          point[0]++;
          break;
        case 2:
          point[1]--;
          break;
        case 3:
          point[0]--;
          break;
        default:
          throw new Error('never come!');
      }
    }
  }
  return point;
}

function next(world) {
  const env = world.env;
  const code = world.code;
  let nextCodel = findNextCodel(env, code);

  if (!world.step) {
    let contFlg = false;
    for (let i = 0; i < 8; ++i) {
      if (unmovable(code, nextCodel)) {
        if (i % 2 === 0) {
          env.cc++;
        } else {
          env.dp++;
        }
        nextCodel = findNextCodel(env, code);
      } else {
        contFlg = true;
        break;
      }
    }
    if (!contFlg && unmovable(code, nextCodel)) {
      // おしまい
      world.halt = true;
      return world;
    }
  } else {
    if (unmovable(code, nextCodel)) {
      if (env.unmovableCnt %2 === 0) {
        ++env.cc;
      } else {
        ++env.dp;
      }
      ++env.unmovableCnt;
      if (env.unmovableCnt === 8) {
        world.halt = true;
        return world;
      }

      nextCodel = findNextCodel(env, code);
      env.nextCodel = {
        x: nextCodel[0],
        y: nextCodel[1],
      };
      return world;
    } else {
      env.unmovableCnt = 0;
    }
  }

  const currentColor = code[env.x][env.y];
  const nextColor = code[nextCodel[0]][nextCodel[1]];

  env.area = nextCodel[2];
  if (nextCodel.exec) {
    execCommand(env, currentColor, nextColor);
  }
  env.x = nextCodel[0];
  env.y = nextCodel[1];

  nextCodel = findNextCodel(env, code);
  env.nextCodel = {
    x: nextCodel[0],
    y: nextCodel[1],
  };

  world.halt = false;
  return world;
}

function runImp(world) {
  while (!world.halt) {
    world = next(world);
  }
  return world.env.output;
}

function create(code, input, step) {
  const env = {};
  env.x = env.y = env.dp = env.cc = env.area = 0;
  env.unmovableCnt = 0;
  env.stack = [];
  env.input = input || [];
  env.output = '';
  return {
    env,
    code,
    halt: false,
    step,
  };
}

module.exports = {
  next,

  run: (code, input) => runImp(create(code, input)),
  create,
};
