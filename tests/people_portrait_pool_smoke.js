/* 국가별 항해사 후보·후원자 초상 760장이 실제 그림으로 열리는지 확인한다. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PAGE = pathToFileURL(path.join(ROOT, 'test_people_portraits.html')).href;
const GAME = pathToFileURL(path.join(ROOT, 'index.html')).href;
const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome 또는 Edge를 찾지 못했습니다. CHROME_PATH를 지정하십시오.');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitFor(file, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (fs.existsSync(file)) return; await sleep(100); }
  throw new Error(file + ' 생성 대기 시간이 지났습니다.');
}
function connect(url) {
  const ws = new WebSocket(url), pending = new Map(), errors = [];
  let seq = 0;
  function call(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result); return;
    }
    if (m.method === 'Runtime.exceptionThrown') errors.push('예외: ' + (m.params.exceptionDetails.text || '알 수 없음'));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error: ' + m.params.args.map(x => x.value || x.description || '').join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('로그 오류: ' + m.params.entry.text);
  };
  return new Promise((resolve, reject) => { ws.onopen = () => resolve({ ws, call, errors }); ws.onerror = reject; });
}

(async function () {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'plus-ultra-people-pool-'));
  const portFile = path.join(profile, 'DevToolsActivePort');
  const browser = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--remote-debugging-port=0', '--remote-allow-origins=*', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  try {
    await waitFor(portFile, 10000);
    const port = fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0];
    const target = await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(PAGE), { method: 'PUT' }).then(r => r.json());
    const cdp = await connect(target.webSocketDebuggerUrl);
    await cdp.call('Runtime.enable'); await cdp.call('Log.enable');
    let result;
    for (let i = 0; i < 600; i++) {
      await sleep(100);
      const q = await cdp.call('Runtime.evaluate', { expression: `(()=>{
        if(document.title!=='done')return null;
        const canvases=[...document.querySelectorAll('canvas')],keys=canvases.map(cv=>cv.dataset.img||'');
        return {count:canvases.length,actual:keys.filter(k=>k.startsWith('portraits/pools/')).length,uniqueKeys:new Set(keys).size};
      })()`, returnByValue: true });
      result = q.result.value; if (result) break;
    }
    await cdp.call('Page.navigate', { url: GAME });
    let game;
    for (let i = 0; i < 120; i++) {
      await sleep(100);
      const q = await cdp.call('Runtime.evaluate', { expression: "(()=>window.G&&G.Game&&G.Game.sceneName?{scene:G.Game.sceneName,pick:G.Img.pick(G.Img.chain.peoplePool('mates','kr','f',3))}:null)()", returnByValue: true });
      game = q.result.value; if (game) break;
    }
    const ok = result && result.count === 760 && result.actual === 760 && result.uniqueKeys === 760 && game && game.scene === 'title' && game.pick === 'portraits/pools/mates/kr/f/03' && !cdp.errors.length;
    console.log(JSON.stringify({ ok, result, game, errors: cdp.errors }));
    cdp.ws.close(); if (!ok) process.exitCode = 1;
  } finally { browser.kill(); }
})().then(() => process.exit(process.exitCode || 0), err => { console.error(err.stack || err); process.exit(1); });
