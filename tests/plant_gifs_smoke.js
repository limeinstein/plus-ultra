/* 설치된 Chrome으로 식물 GIF의 등록·장면 판·발견 화면 재생기를 확인한다. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PAGE = pathToFileURL(path.join(ROOT, 'index.html')).href;
const PLANTS = ['rubber','sequoia','breadfruit','lotus','welwitschia','mangrove','papyrus','rafflesia','carnivplant','startower'];
const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome 또는 Edge를 찾지 못했습니다.');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitFor(file, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (fs.existsSync(file)) return; await sleep(100); }
  throw new Error(file + ' 생성 대기 시간이 지났습니다.');
}
function socket(url) {
  const ws = new WebSocket(url), pending = new Map(), errors = []; let seq = 0;
  function call(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++seq; pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      return m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
    }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text || '스크립트 예외');
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(x => x.value || x.description || '').join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      const entry = m.params.entry, url = entry.url || '';
      if (!/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//.test(url)) errors.push(entry.text);
    }
  };
  return new Promise((resolve, reject) => {
    ws.onopen = () => resolve({ ws, call, errors }); ws.onerror = reject;
  });
}

(async function () {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'plus-ultra-plant-gifs-'));
  const portFile = path.join(profile, 'DevToolsActivePort');
  const browser = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--remote-debugging-port=0', '--remote-allow-origins=*', '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });
  try {
    await waitFor(portFile, 10000);
    const port = fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0];
    const target = await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(PAGE), { method: 'PUT' }).then(r => r.json());
    const cdp = await socket(target.webSocketDebuggerUrl);
    await cdp.call('Runtime.enable'); await cdp.call('Log.enable'); await cdp.call('Page.enable');
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1000, height: 610, deviceScaleFactor: 1, mobile: false });
    for (let i = 0; i < 60; i++) {
      await sleep(200);
      const ready = await cdp.call('Runtime.evaluate', { expression: '!!(window.G&&G.DISC&&G.Reel&&G.Scenes&&G.Scenes.discoveryPicture)', returnByValue: true });
      if (ready.result.value) break;
    }
    const q = await cdp.call('Runtime.evaluate', { expression: `new Promise(resolve=>{
      const ids=${JSON.stringify(PLANTS)}, plants=ids.map(id=>G.DISC[id]).filter(Boolean);
      const gifs=ids.map(id=>G.Img.file('discoveries/'+id));
      const sheets=ids.map(id=>G.Img.file('discovery-sheets/'+id));
      const d=G.DISC.rafflesia, pic=G.Scenes.discoveryPicture(d);
      document.body.innerHTML='<main class="disc-card" style="width:820px;margin:28px auto"><div class="disc-head">BOTANICAL DISCOVERY</div><div class="art"></div><div class="dname">'+d.name+'</div></main>';
      document.querySelector('.art').appendChild(pic);
      Promise.all([G.DISC.rubber,G.DISC.lotus,G.DISC.rafflesia,G.DISC.startower].map(x=>G.Reel.load(G.Reel.key(x)))).then(loaded=>resolve({
        plants:plants.length,marked:plants.filter(x=>x.plant).length,
        gifs:gifs.filter(f=>/\\.gif$/.test(f||'')).length,
        sheets:sheets.filter(f=>/\\.webp$/.test(f||'')).length,
        reveals:plants.filter(x=>G.Scenes.hasReveal(x)).length,
        loaded:loaded.every(Boolean),tag:pic.tagName,size:[pic.width,pic.height],
        aria:pic.getAttribute('aria-label'),ms:G.FX.reveal.plantPlayMs
      }));
    })`, awaitPromise: true, returnByValue: true });
    const result = q.result.value;
    await sleep(2300);
    console.log(JSON.stringify({ result, errors: cdp.errors }));
    if (!result || result.plants !== 10 || result.marked !== 10 || result.gifs !== 10 || result.sheets !== 10 || result.reveals !== 10 || !result.loaded || result.tag !== 'CANVAS' || result.size[0] !== 1152 || result.size[1] !== 512 || result.aria !== '지옥의 꽃' || result.ms !== 8400 || cdp.errors.length) process.exitCode = 1;
    cdp.ws.close();
  } finally { browser.kill(); }
})().then(() => process.exit(process.exitCode || 0), err => { console.error(err.stack || err); process.exit(1); });
