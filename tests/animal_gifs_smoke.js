/* 설치된 Chrome으로 동물 GIF의 등록·로딩·발견 카드·도감 재생기를 확인한다. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PAGE = pathToFileURL(path.join(ROOT, 'index.html')).href;
const CATALOG = pathToFileURL(path.join(ROOT, 'catalog.html')).href;
const SCREEN = path.join(ROOT, 'docs', 'art', 'animal-gif-runtime.png');
const BASE_ANIMALS = ['tarantula','llama','prairiedog','moose','frigatebird','tortoise','albatross','kangaroo','paradise','sable','tiger','panda','porcupine','coelacanth','warthog','komodo','penguin','mandrill','ostrich','flamingo','hippo','crocodile','polarbear'];
const ADDED_ANIMALS = [...fs.readFileSync(path.join(ROOT, 'js', 'data', 'animals.js'), 'utf8').matchAll(/^\s*a\('([^']+)'/gm)].map(m => m[1]);
const ANIMALS = BASE_ANIMALS.concat(ADDED_ANIMALS.filter(id => !BASE_ANIMALS.includes(id)));
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
      const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); return m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text || '스크립트 예외');
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(x => x.value || x.description || '').join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      const entry = m.params.entry, url = entry.url || '';
      if (!/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//.test(url)) errors.push(entry.text);
    }
  };
  return new Promise((resolve, reject) => { ws.onopen = () => resolve({ ws, call, errors }); ws.onerror = reject; });
}

(async function () {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'plus-ultra-animal-gifs-'));
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
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 900, height: 520, deviceScaleFactor: 1, mobile: false });
    for (let i = 0; i < 60; i++) {
      await sleep(200);
      const ready = await cdp.call('Runtime.evaluate', { expression: "!!(window.G&&G.DISC&&G.Reel&&G.Scenes&&G.Scenes.discoveryPicture)", returnByValue: true });
      if (ready.result.value) break;
    }
    const q = await cdp.call('Runtime.evaluate', { expression: `new Promise(resolve=>{
      const ids=${JSON.stringify(ANIMALS)}, animals=ids.map(id=>G.DISC[id]).filter(Boolean);
      const gifs=ids.map(id=>G.Img.file('discoveries/'+id));
      const sheets=ids.map(id=>G.Img.file('discovery-sheets/'+id));
      const lion=G.DISC.lion, pic=G.Scenes.discoveryPicture(lion); pic.id='animal-gif-test';
      document.body.innerHTML='<main class="disc-card" style="width:720px;margin:20px auto"><div class="disc-head">WILDLIFE DISCOVERY</div><div class="art"></div><div class="dname">'+lion.name+'</div></main>';
      document.querySelector('.art').appendChild(pic);
      Promise.all([G.DISC.lion,G.DISC.mermaid,G.DISC.trex].map(d=>G.Reel.load(G.Reel.key(d)))).then(loaded=>resolve({
        animals:animals.length,gifs:gifs.filter(f=>/\\.gif$/.test(f||'')).length,
        sheets:sheets.filter(f=>/\\.webp$/.test(f||'')).length,reveals:animals.filter(d=>G.Scenes.hasReveal(d)).length,
        loaded:loaded.every(Boolean),tag:pic.tagName,size:[pic.width,pic.height],aria:pic.getAttribute('aria-label')
      }));
    })`, awaitPromise: true, returnByValue: true });
    const result = q.result.value;
    await sleep(4200); // 성체가 새끼 뒤에 나타난 장면
    const shot = await cdp.call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(SCREEN, Buffer.from(shot.data, 'base64'));

    await cdp.call('Page.navigate', { url: CATALOG });
    let catalog = null;
    for (let i = 0; i < 60; i++) {
      await sleep(200);
      const c = await cdp.call('Runtime.evaluate', { expression: `(()=>{
        const tab=document.querySelector('[data-tab="discoveries"]'); if(!tab)return null; tab.click();
        const chip=document.querySelector('[data-chip="creature"]'); if(chip)chip.click();
        return {ready:true};
      })()`, returnByValue: true });
      if (c.result.value && c.result.value.ready) break;
    }
    // 도감은 화면 가까이에 온 카드만 그린다. 끝까지 훑어 117개 장면 판을 모두 만든다.
    const height = await cdp.call('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true });
    for (let y = 0; y < height.result.value; y += 420) {
      await cdp.call('Runtime.evaluate', { expression: 'window.scrollTo(0,' + y + ')' });
      await sleep(160);
    }
    await sleep(800);
    const c = await cdp.call('Runtime.evaluate', { expression: `(()=>({
      cards:document.querySelectorAll('#grid .card').length,
      expected:G.DISCOVERIES.filter(d=>d.cat==='creature').length,
      expectedAnimated:G.DISCOVERIES.filter(d=>d.cat==='creature'&&G.Reel.has(d)).length,
      animated:document.querySelectorAll('#grid .thumb canvas.reel').length,
      aria:[...document.querySelectorAll('#grid .thumb canvas.reel')].map(x=>x.getAttribute('aria-label'))
    }))()`, returnByValue: true });
    catalog = c.result.value;
    console.log(JSON.stringify({ result, catalog, errors: cdp.errors }));
    if (!result || result.animals !== 117 || result.gifs !== 117 || result.sheets !== 117 || result.reveals !== 117 || !result.loaded || result.tag !== 'CANVAS' || result.size[0] !== 1152 || result.size[1] !== 512 || result.aria !== '사자' || !catalog || catalog.cards !== catalog.expected || catalog.animated !== catalog.expectedAnimated || !catalog.aria.includes('사자') || !catalog.aria.includes('티라노사우루스') || !catalog.aria.includes('홍학') || !catalog.aria.includes('지옥의 꽃') || cdp.errors.length) process.exitCode = 1;
    cdp.ws.close();
  } finally { browser.kill(); }
})().then(() => process.exit(process.exitCode || 0), err => { console.error(err.stack || err); process.exit(1); });
