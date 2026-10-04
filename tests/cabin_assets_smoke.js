/* 기함 선실 화면의 선박 36종·선실 19종 그림 등록과 실제 표시를 확인한다.
   node tests/cabin_assets_smoke.js */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PAGE = pathToFileURL(path.join(ROOT, 'index.html')).href;
const SCREEN = path.join(ROOT, 'docs', 'art', 'flagship-cabin-runtime.png');
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
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const job = pending.get(message.id); pending.delete(message.id);
      if (message.error) job.reject(new Error(message.error.message)); else job.resolve(message.result);
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push('예외: ' + (message.params.exceptionDetails.text || '알 수 없음'));
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push('console.error: ' + message.params.args.map(x => x.value || x.description || '').join(' '));
    }
  };
  return new Promise((resolve, reject) => {
    ws.onopen = () => resolve({ ws, call, errors });
    ws.onerror = () => reject(new Error('Chrome 개발자 프로토콜 연결에 실패했습니다.'));
  });
}

(async function () {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'plus-ultra-cabins-'));
  const portFile = path.join(profile, 'DevToolsActivePort');
  const browser = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--remote-debugging-port=0', '--remote-allow-origins=*', '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });
  let cdp;
  try {
    await waitFor(portFile, 10000);
    const port = fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0];
    const target = await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(PAGE), { method: 'PUT' }).then(r => r.json());
    cdp = await socket(target.webSocketDebuggerUrl);
    await cdp.call('Runtime.enable'); await cdp.call('Page.enable');
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
    for (let i = 0; i < 240; i++) {
      const value = await cdp.call('Runtime.evaluate', { expression: '!!(window.G&&G.Game&&G.State&&G.CabinView&&G.Game.sceneName==="title")', returnByValue: true });
      if (value.result.value) break;
      if (i === 239) throw new Error('게임 첫 화면을 기다리다 시간이 지났습니다.');
      await sleep(250);
    }
    await cdp.call('Runtime.evaluate', {
      expression: `(()=>{
        const sk={}; G.SKILLS.forEach(x=>{sk[x.id]=0;});
        const s=G.State.newGame({name:'선실 시험',nation:'PT',job:'explorer',age:22,birth:{m:4,d:12},st:{str:50,int:50,mar:50,cha:50},sk,lg:G.LANGS.map(()=>0),diff:'normal'});
        s.fleet.ships[0].type='galleon'; s.fleet.ships[0].name='시안';
        s.fleet.ships[0].cabins=['deck','chart','galley','mess','account','chapel','sick','rec','rig','repair','pen','gun','marine','interp'];
        G.Game.state=s; G.CabinView.open({}); return true;
      })()`,
      returnByValue: true
    });
    let state;
    for (let i = 0; i < 240; i++) {
      await sleep(250);
      const value = await cdp.call('Runtime.evaluate', {
        expression: `(()=>{
          const shipMissing=G.SHIP_TYPES.filter(x=>!G.Img.has('ships/'+x.id)).map(x=>x.id);
          const cabinMissing=G.CABINS.filter(x=>!G.Img.has('cabins/'+x.id)).map(x=>x.id);
          const room=[...document.querySelectorAll('.cb-card-art')];
          return {shipMissing,cabinMissing,shipReady:!!document.querySelector('.cb-stage.art-ready'),roomCount:room.length,roomReady:room.filter(x=>x.naturalWidth>100).length};
        })()`,
        returnByValue: true
      });
      state = value.result.value;
      if (state && state.shipReady && state.roomReady === state.roomCount && state.roomCount >= 10) break;
    }
    const shot = await cdp.call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(SCREEN, Buffer.from(shot.data, 'base64'));
    console.log(JSON.stringify({ state, errors: cdp.errors, screen: SCREEN }));
    if (!state || state.shipMissing.length || state.cabinMissing.length || !state.shipReady || state.roomCount < 10 || state.roomReady !== state.roomCount || cdp.errors.length) process.exitCode = 1;
  } finally {
    if (cdp) cdp.ws.close();
    browser.kill();
  }
})().then(() => process.exit(process.exitCode || 0), error => { console.error(error.stack || error); process.exit(1); });
