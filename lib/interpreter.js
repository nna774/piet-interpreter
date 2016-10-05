// interpreter.js

/*
dp
  0, 4, 8...: 右
  1, 5, 9...: 下
  2, 6, 10..: 左
  3, 7, 11..: 上

cc
  偶数: 左
  奇数: 右

code(x,y)
  0,0 0,1 0,2...
  1,0 1,1...
  2,0...
*/

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
        env.stack.push(env.area);
        return;
      }
      if (diffL === 2) { /* pop */
        env.stack.pop();
        return;
      }
      break;
    case 1:
      if (diffL === 0) { /* add */
        if (env.stack.length < 2) return; // スタックが足りず失敗。
        const tmp1 = env.stack.pop();
        const tmp2 = env.stack.pop();
        env.stack.push(tmp1 + tmp2);
        return;
      }
      if (diffL === 1) { /* substract */
        if (env.stack.length < 2) return; // スタックが足りず失敗。
        const tmp1 = env.stack.pop();
        const tmp2 = env.stack.pop();
        env.stack.push(tmp2 - tmp1);
        return;
      }
      if (diffL === 2) { /* multiply */
        if (env.stack.length < 2) return; // スタックが足りず失敗。
        const tmp1 = env.stack.pop();
        const tmp2 = env.stack.pop();
        env.stack.push(tmp1 * tmp2);
        return;
      }
      break;
    case 2:
      if (diffL === 0) { /* divide */
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
        if (env.stack.length < 2) return; // スタックが足りず失敗。
        const tmp1 = env.stack.pop();
        const tmp2 = env.stack.pop();
        env.stack.push(mod(tmp2, tmp1));
        return;
      }
      if (diffL === 2) { /* not */
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
        if (env.stack.length < 1) return; // スタックが足りず失敗。
        const tmp = env.stack.pop();
        env.dp += tmp;
        return;
      }
      if (diffL === 2) { /* switch */
        if (env.stack.length < 1) return; // スタックが足りず失敗。
        const tmp = env.stack.pop();
        env.cc += tmp;
        return;
      }
      break;
    case 4:
      if (diffL === 0) { /* duplicate */
        if (env.stack.length < 1) return; // スタックが足りず失敗。
        const tmp = env.stack.pop();
        env.stack.push(tmp);
        env.stack.push(tmp);
      }
      if (diffL === 1) { /* roll */
        // めんどくさい
        if (env.stack.length < 2) return; // スタックが足りず失敗。
        const tmp1 = env.stack.pop();
        const tmp2 = env.stack.pop();
        if (tmp2 < 0) { // 深さが負のロールは失敗する。
          env.stack.push(tmp2);
          env.stack.push(tmp1);
        } else { // ここ
          let fail = false;
          const view = new Array(tmp2);
          let i;
          for (i = 0; i < tmp2; ++i) {
            view[i] = env.stack.pop();
          }
          for (i = tmp2; i > 0; --i) { // 失敗してないかな？
            if (view[i - 1] === undefined) {
              break;
            }
          }
          if (i !== 0) { // 失敗してた。
            const last = i;
                fail = true;
            for (i = 0; i < last; ++i) { // 巻き戻す。
              env.stack.push(view[i]);
            }
          }
          if (!fail) {
            const res = new Array(tmp2);
            for (i = 0; i < res.length; ++i) {
              res[i] = view[(i + tmp1) % tmp2];
            }
            const l = res.length;
            for (i = 0; i < l; ++i) {
              env.stack.push(res.pop());
            }
          }
        }
        return;
      }
      if (diffL === 2) { /* in(num) */
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
        const tmp = env.input.shift();
        const num = tmp.charCodeAt(0);
        env.stack.push(num);
        return;
      }
      if (diffL === 1) { /* out(num) */
        if (env.stack.length < 1) return; // スタックが足りず失敗。
        const tmp = env.stack.pop();
        env.output += tmp.toString();
        return;
      }
      if (diffL === 2) { /* out(char) */
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
  // process.stdout.write("findNext: ");
  // process.stdout.write(nextCodel.toString());
  // process.stdout.write("\n");
  // console.log(list)
  // process.stdout.write("#########\n");

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

function next(env, code) {
  let nextCodel = findNextCodel(env, code);

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
    return 'stop';
  }

  const currentColor = code[env.x][env.y];
  const nextColor = code[nextCodel[0]][nextCodel[1]];

  // console.log(nextCodel)
  // console.log("current:" + currentColor + ", next: " + nextColor)
  // console.log(env.stack)
  // console.log(env.area)
  // process.stdout.write("dp: " + env.dp.toString());
  // process.stdout.write(", cc: " + env.cc.toString() + "\n");

  env.area = nextCodel[2];
  if (nextCodel.exec) {
    execCommand(env, currentColor, nextColor);
  }
  env.x = nextCodel[0];
  env.y = nextCodel[1];

  return 'cont';
}

function run(env, code) {
  let status = 'init';
  while (status !== 'stop') {
    status = next(env, code);
  }
  return env.output;
}

module.exports = {
  next,

  run: (code, input) => {
    const env = {};
    env.x = env.y = env.dp = env.cc = env.area = 0;
    env.stack = [];
    env.input = input;
    env.output = '';
    return run(env, code);
  },
};
