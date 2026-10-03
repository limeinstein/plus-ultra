/* 육상전 지형 배경 9종의 파일·매니페스트·브라우저 적용과 콘솔 오류를 점검한다. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const TERRAINS = ['grass', 'steppe', 'desert', 'forest', 'jungle', 'mountain', 'snow', 'tundra', 'ice'];
const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => p && fs.existsSync(p));
function ok(v, msg) { if (!v) throw new Error(msg); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function readWhenReady(file, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { const text = fs.readFileSync(file, 'utf8'); if (text.trim()) return text; } catch (e) { /* Chrome가 쓰기를 마칠 때까지 기다린다. */ }
    await sleep(100);
  }
  throw new Error(file + ' 생성 대기 시간이 지났습니다.');
}
function pngSize(file) {
  const b = fs.readFileSync(file);
  ok(b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), file + ': PNG 서명');
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}
function socket(url) {
  const ws = new WebSocket(url), pending = new Map(), errors = [];
  let seq = 0;
  function call(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++seq; pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result);
      return;
    }
    if (m.method === 'Runtime.exceptionThrown') errors.push('예외: ' + (m.params.exceptionDetails.text || '알 수 없음'));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error: ' + m.params.args.map(x => x.value || x.description || '').join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      const e = m.params.entry;
      if (!(e.url || '').startsWith('https://fonts.googleapis.com/')) errors.push('로그 오류: ' + e.text + (e.url ? ' · ' + e.url : ''));
    }
  };
  return new Promise((resolve, reject) => {
    ws.onopen = () => resolve({ ws, call, errors });
    ws.onerror = () => reject(new Error('Chrome 개발자 프로토콜 연결에 실패했습니다.'));
  });
}

for (const terrain of TERRAINS) {
  const file = path.join(ROOT, 'images', 'landwar', 'backgrounds', terrain + '.png');
  const s = pngSize(file), ratio = s.width / s.height;
  ok(s.width >= 1800 && s.height >= 700, terrain + ': 고해상도 배경이어야 함');
  ok(ratio >= 2.25 && ratio <= 2.8, terrain + ': 육상전용 초광폭 구도여야 함');
}
const manifest = fs.readFileSync(path.join(ROOT, 'images', 'manifest.js'), 'utf8');
for (const terrain of TERRAINS) ok(manifest.includes('"landwar/backgrounds/' + terrain + '"'), terrain + ': 매니페스트 등록');
const sandbox = { window: { G: {} } }; sandbox.G = sandbox.window.G;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'core', 'images.js'), 'utf8'), sandbox);
for (const terrain of TERRAINS) ok(sandbox.G.Img.chain.landWarBackground(terrain)[0] === 'landwar/backgrounds/' + terrain, terrain + ': 그림 체인');

if (!CHROME) throw new Error('Chrome 또는 Edge를 찾지 못했습니다. CHROME_PATH를 지정하십시오.');
(async function () {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'plus-ultra-landwar-bg-'));
  const portFile = path.join(profile, 'DevToolsActivePort');
  const screen = path.join(os.tmpdir(), 'plus-ultra-landwar-background-runtime.png');
  const browser = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--remote-debugging-port=0', '--remote-allow-origins=*', '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });
  let cdp;
  try {
    const port = (await readWhenReady(portFile, 10000)).split(/\r?\n/)[0];
    const page = pathToFileURL(path.join(ROOT, 'index.html')).href;
    const target = await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(page), { method: 'PUT' }).then(r => r.json());
    cdp = await socket(target.webSocketDebuggerUrl);
    await cdp.call('Runtime.enable'); await cdp.call('Log.enable'); await cdp.call('Page.enable');
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
    for (let i = 0; i < 80; i++) {
      const q = await cdp.call('Runtime.evaluate', { expression: '!!(window.G&&G.State&&G.Games&&G.Games.landWar)', returnByValue: true });
      if (q.result.value) break;
      await sleep(250);
    }
    const setup = `(()=>{const sk={};G.SKILLS.forEach(x=>sk[x.id]=1);const lg=G.LANGS.map(()=>0);G.State.newGame({name:'시험 제독',nation:'PT',job:'explorer',age:22,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg,diff:'normal'});G.Game.state.settings.sound=0;G.Game.state.settings.music=0;G.Games.landWar({enemy:{name:'배경 시험대',kind:'bandit',n:24},party:30,terr:'jungle',guns:false,flee:true});return true;})()`;
    await cdp.call('Runtime.evaluate', { expression: setup, awaitPromise: true, returnByValue: true });
    let state;
    for (let i = 0; i < 80; i++) {
      await sleep(250);
      const q = await cdp.call('Runtime.evaluate', { expression: `(()=>{const im=G.Img.get('landwar/backgrounds/jungle'),cv=document.querySelector('.lwar canvas');return {canvas:!!cv,image:!!im,width:im&&im.naturalWidth,height:im&&im.naturalHeight};})()`, returnByValue: true });
      state = q.result.value;
      if (state && state.canvas && state.image) break;
    }
    await cdp.call('Runtime.evaluate', { expression: 'G.Games._landDebug.draw()' });
    const shot = await cdp.call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(screen, Buffer.from(shot.data, 'base64'));
    ok(state && state.canvas && state.image && state.width >= 1800, '브라우저에서 밀림 배경을 불러와야 함');
    ok(!cdp.errors.length, cdp.errors.join('\n'));
    console.log('육상전 지형 배경 9종·매니페스트·그림 체인·브라우저 적용 검사 통과: ' + screen);
  } finally {
    if (cdp) cdp.ws.close();
    browser.kill();
  }
})().then(() => process.exit(0), err => { console.error(err.stack || err); process.exit(1); });
