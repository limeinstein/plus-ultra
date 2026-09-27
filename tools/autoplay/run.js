// 자동 플레이 실행기: node run.js [--resume ckpt.json] [--minutes 60] [--test script.js]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const DIR = '/tmp/claude-0/bot';
const OUT = opt('--out') || DIR + '/out';
const MIN = +(opt('--minutes') || 60);
const URL = opt('--url') || 'file:///home/claude/game/index.html';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('ERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_TUNNEL|fonts|favicon/.test(t)) errs.push('C ' + t.slice(0, 300)); });
  await p.addInitScript(() => { window.requestAnimationFrame = function () { return 0; }; });
  await p.goto(URL);
  await p.waitForFunction(() => window.G && G.Game && G.Img && G.Img.count() > 0, { timeout: 90000 });
  await p.evaluate(() => G.Game.ensureGeo());
  await p.waitForFunction(() => G.Game.geoReady, { timeout: 90000 });
  await p.addScriptTag({ path: DIR + '/bot.js' });
  await p.addScriptTag({ path: DIR + '/brain.js' });
  const resume = opt('--resume');
  const ck = resume ? fs.readFileSync(resume, 'utf8') : null;
  const test = opt('--test');
  if (test) {
    const code = fs.readFileSync(test, 'utf8');
    await p.evaluate(async ([code, ck]) => { window.__ck = ck; return eval(code); }, [code, ck]);
  } else {
    await p.evaluate(([ck]) => { BOT.start({ resume: ck }); }, [ck]);
  }
  const t0 = Date.now();
  let evN = 0, lastCk = Date.now();
  const trace = fs.createWriteStream(OUT + '/trace.log', { flags: resume ? 'a' : 'w' });
  const evs = fs.createWriteStream(OUT + '/events.jsonl', { flags: resume ? 'a' : 'w' });
  let lastLine = '', lastCkKey = '';
  const cdp = await p.context().newCDPSession(p);
  const withTimeout = (pr, ms) => Promise.race([pr, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  for (;;) {
    await sleep(3000);
    let st;
    try {
      st = await withTimeout(p.evaluate(() => ({ status: BOT.status, stage: BOT.stage, info: BOT.info ? BOT.info() : '', tr: BOT.drain(), ev: BOT.ev.length, err: BOT.err.splice(0), ck: BOT.lastCk ? BOT.lastCk.length + ':' + G.Game.state.day : '' })), 20000);
    } catch (e) {
      console.log('eval fail', e.message, '— pausing to get stack');
      try {
        await cdp.send('Debugger.enable');
        const got = new Promise(res => cdp.once('Debugger.paused', ev => res(ev)));
        await cdp.send('Debugger.pause');
        const ev = await withTimeout(got, 10000);
        console.log('STACK:\n' + ev.callFrames.slice(0, 15).map(f => '  ' + f.functionName + ' @ ' + f.url.split('/').pop() + ':' + (f.location.lineNumber + 1)).join('\n'));
      } catch (e2) { console.log('pause fail', e2.message); }
      break;
    }
    if (st.ck && st.ck !== lastCkKey) { lastCkKey = st.ck; try { const c = await p.evaluate(() => BOT.lastCk); if (c) fs.writeFileSync(OUT + '/ckpt.json', c); } catch (e) { } }
    st.tr.forEach(r => trace.write(r.join('\t') + '\n'));
    if (st.ev > evN) { const add = await p.evaluate(n => BOT.ev.slice(n), evN); add.forEach(e => evs.write(JSON.stringify(e) + '\n')); evN = st.ev; }
    st.err.forEach(e => console.log('BOTERR', e));
    const line = `[${((Date.now() - t0) / 60000).toFixed(1)}m] ${st.status} ${st.stage} ${st.info}`;
    if (line !== lastLine) { console.log(line); lastLine = line; }
    if (errs.length) { console.log(errs.splice(0).slice(0, 5).join('\n')); }
    if (Date.now() - lastCk > 5 * 60000 || /done|error|stop/.test(st.status)) {
      try { const c = await p.evaluate(() => BOT.checkpoint ? BOT.checkpoint() : null); if (c) fs.writeFileSync(OUT + '/ckpt.json', c); lastCk = Date.now(); } catch (e) { console.log('ckpt fail', e.message); }
    }
    if (/done|error|stop/.test(st.status)) break;
    if (Date.now() - t0 > MIN * 60000) { console.log('TIME UP'); try { const c = await p.evaluate(() => BOT.checkpoint ? BOT.checkpoint() : null); if (c) fs.writeFileSync(OUT + '/ckpt.json', c); } catch (e) { } break; }
  }
  try {
    const fin = await p.evaluate(() => BOT.final ? BOT.final() : null);
    if (fin) fs.writeFileSync(OUT + '/final.json', JSON.stringify(fin, null, 1));
  } catch (e) { console.log('final fail', e.message); }
  trace.end(); evs.end();
  console.log('ERRORS', errs.length, errs.slice(0, 8).join('\n'));
  await b.close();
})().catch(e => { console.log('FAIL', e); process.exit(1); });
