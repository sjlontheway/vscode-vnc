const p = new Promise((res, rej) => {
  rej('rej');
});


async function f() {
  d = await p.catch(e => { throw Error(e) });
}
f();

// const fork = require('child_process').fork;


// fork();