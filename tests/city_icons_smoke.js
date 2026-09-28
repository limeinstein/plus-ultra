/* 설치된 Chrome으로 도시 아이콘 시험 화면을 열어 항해 장면과 브라우저 오류를 확인한다. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PAGE_FILE = process.env.CITY_ICON_PAGE || 'test_city_icons_game.html';
const EXPECTED_SCENE = process.env.CITY_ICON_SCENE || 'sea';
const DONE_TITLE = process.env.CITY_ICON_DONE || 'game done';
const PAGE = pathToFileURL(path.join(ROOT, PAGE_FILE)).href;
const SCREEN = path.join(ROOT, 'docs', 'art', process.env.CITY_ICON_SCREEN || 'city-icons-sea-runtime.png');
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
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result);
      return;
    }
    if (m.method === 'Runtime.exceptionThrown') errors.push('예외: ' + (m.params.exceptionDetails.text || '알 수 없음'));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error: ' + m.params.args.map(x => x.value || x.description || '').join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('로그 오류: ' + m.params.entry.text);
  };
  return new Promise((resolve, reject) => {
    ws.onopen = () => resolve({ ws, call, errors });
    ws.onerror = () => reject(new Error('Chrome 개발자 프로토콜 연결에 실패했습니다.'));
  });
}

(async function () {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'plus-ultra-city-icons-'));
  const portFile = path.join(profile, 'DevToolsActivePort');
  const browser = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--remote-debugging-port=0', '--remote-allow-origins=*', '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });
  let target;
  try {
    await waitFor(portFile, 10000);
    const port = fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0];
    target = await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(PAGE), { method: 'PUT' }).then(r => r.json());
    const cdp = await socket(target.webSocketDebuggerUrl);
    await cdp.call('Runtime.enable'); await cdp.call('Log.enable'); await cdp.call('Page.enable');
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
    let state = null;
    for (let i = 0; i < 80; i++) {
      await sleep(250);
      const q = await cdp.call('Runtime.evaluate', { expression: "(()=>{const f=document.getElementById('game'),w=f&&f.contentWindow,G=w&&w.G;return {title:document.title,scene:G&&G.Game&&G.Game.sceneName,cityIcon:!!(G&&G.CityIcon),known:G&&G.Game&&G.Game.state&&G.Game.state.known.length};})()", returnByValue: true });
      state = q.result.value;
      if (state && (state.title === DONE_TITLE || / err /.test(state.title))) break;
    }
    const shot = await cdp.call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(SCREEN, Buffer.from(shot.data, 'base64'));
    const result = { state, errors: cdp.errors };
    console.log(JSON.stringify(result));
    if (!state || state.title !== DONE_TITLE || state.scene !== EXPECTED_SCENE || !state.cityIcon || !state.known || cdp.errors.length) process.exitCode = 1;
    cdp.ws.close();
  } finally {
    if (target && target.id) { /* 닫히는 중인 표적은 Chrome 종료와 함께 정리된다. */ }
    browser.kill();
  }
})().then(function () { process.exit(process.exitCode || 0); }, function (err) { console.error(err.stack || err); process.exit(1); });
