/* 설치된 Chrome으로 유적·자연 경관 GIF의 등록·로딩·발견 카드 요소를 확인한다. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PAGE = pathToFileURL(path.join(ROOT, 'index.html')).href;
const CATALOG = pathToFileURL(path.join(ROOT, 'catalog.html')).href;
const SCREEN = path.join(ROOT, 'docs', 'art', 'ruin-gif-runtime.png');
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
      // file:// 오프라인 시험에서는 선택 글꼴 CDN만 막힐 수 있다. 게임 자원 오류는 그대로 실패시킨다.
      if (!/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//.test(url)) errors.push(entry.text);
    }
  };
  return new Promise((resolve, reject) => { ws.onopen = () => resolve({ ws, call, errors }); ws.onerror = reject; });
}

(async function () {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'plus-ultra-ruin-gifs-'));
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
    let result;
    for (let i = 0; i < 50; i++) {
      await sleep(200);
      const q = await cdp.call('Runtime.evaluate', { expression: "!!(window.G&&G.DISC&&G.Scenes&&G.Scenes.discoveryPicture)", returnByValue: true });
      if (q.result.value) break;
    }
    const q = await cdp.call('Runtime.evaluate', { expression: `new Promise(resolve=>{
      const ruins=G.DISCOVERIES.filter(d=>d.cat==='ruin'), files=ruins.map(d=>G.Img.file('discoveries/'+d.id));
      const natures=G.DISCOVERIES.filter(d=>d.cat==='nature'), natureFiles=natures.map(d=>G.Img.file('discoveries/'+d.id));
      const landscapeIds=[...new Set(natures.map(d=>d.id).concat(G.NATURALS||[]))];
      const landscapes=landscapeIds.map(id=>G.DISC[id]).filter(Boolean);
      const landscapeFiles=landscapes.map(d=>G.Img.file('discoveries/'+d.id));
      const landscapeSheets=landscapes.map(d=>G.Img.file('discovery-sheets/'+d.id));
      const d=G.DISC.stonehenge, pic=G.Scenes.discoveryPicture(d); pic.id='ruin-gif-test';
      const naturePic=G.Scenes.discoveryPicture(G.DISC.uluru);
      const solomonPic=G.Scenes.discoveryPicture(G.DISC.solomon);
      document.body.innerHTML='<main class="disc-card" style="width:720px;margin:20px auto"><div class="disc-head">RUIN RESTORATION</div><div class="art"></div><div class="dname">'+d.name+'</div></main>';
      document.querySelector('.art').appendChild(pic);
      const load=[d,G.DISC.uluru,G.DISC.solomon].map(x=>G.Reel.load(G.Reel.key(x)));
      Promise.all(load).then(loaded=>resolve({
        ruins:ruins.length,gifs:files.filter(f=>/\\.gif$/.test(f||'')).length,
        natures:natures.length,natureGifs:natureFiles.filter(f=>/\\.gif$/.test(f||'')).length,
        naturals:(G.NATURALS||[]).length,landscapes:landscapes.length,
        landscapeGifs:landscapeFiles.filter(f=>/\\.gif$/.test(f||'')).length,
        landscapeSheets:landscapeSheets.filter(f=>/\\.webp$/.test(f||'')).length,
        landscapeReveals:landscapes.filter(d=>G.Scenes.hasReveal(d)).length,
        loaded:loaded.every(Boolean),tag:pic.tagName,size:[pic.width,pic.height],
        natureTag:naturePic.tagName,natureAria:naturePic.getAttribute('aria-label'),
        solomonTag:solomonPic.tagName,solomonAria:solomonPic.getAttribute('aria-label')
      }));
    })`, awaitPromise: true, returnByValue: true });
    result = q.result.value;
    await sleep(2400); // 적어도 두 단계가 재생된 시점의 사진
    const shot = await cdp.call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(SCREEN, Buffer.from(shot.data, 'base64'));
    await cdp.call('Page.navigate', { url: CATALOG });
    let catalog = null;
    for (let i = 0; i < 50; i++) {
      await sleep(200);
      const c = await cdp.call('Runtime.evaluate', { expression: `(()=>{
        const tab=document.querySelector('[data-tab="discoveries"]'); if(!tab)return null; tab.click();
        const ruin=document.querySelector('[data-chip="ruin"]'); if(ruin)ruin.click();
        return {cards:document.querySelectorAll('#grid .card').length,ready:true};
      })()`, returnByValue: true });
      catalog = c.result.value; if (catalog && catalog.ready) break;
    }
    await sleep(1000);
    const c = await cdp.call('Runtime.evaluate', { expression: `(()=>{
      const pic=document.querySelector('#grid .thumb canvas.reel');
      return {cards:document.querySelectorAll('#grid .card').length,animated:document.querySelectorAll('#grid .thumb canvas.reel').length,tag:pic&&pic.tagName};
    })()`, returnByValue: true });
    catalog = c.result.value;
    console.log(JSON.stringify({ result, catalog, errors: cdp.errors }));
    if (!result || result.ruins !== 162 || result.gifs !== 162 || result.natures !== 40 || result.natureGifs !== 40 || result.naturals !== 34 || result.landscapes !== 41 || result.landscapeGifs !== 41 || result.landscapeSheets !== 41 || result.landscapeReveals !== 41 || !result.loaded || result.tag !== 'CANVAS' || result.size[0] !== 1152 || result.size[1] !== 512 || result.natureTag !== 'CANVAS' || result.natureAria !== '지구의 배꼽' || result.solomonTag !== 'CANVAS' || result.solomonAria !== '솔로몬의 광산' || !catalog || catalog.cards !== 162 || catalog.animated < 1 || catalog.tag !== 'CANVAS' || cdp.errors.length) process.exitCode = 1;
    cdp.ws.close();
  } finally { browser.kill(); }
})().then(() => process.exit(process.exitCode || 0), err => { console.error(err.stack || err); process.exit(1); });
