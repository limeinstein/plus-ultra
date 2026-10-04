/* 모든 도시의 배경 등록과 추가 도시 12곳의 file:// 거리 렌더링을 확인한다.
   node tests/city_backgrounds_smoke.js */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');
const IDS = Array.from({ length: 12 }, (_, i) => 286 + i);
const context = { window: { G: {} } }; context.G = context.window.G;
for (const file of ['js/data/cities.js', 'images/manifest.js', 'js/core/images.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context);
}
for (const city of context.G.CITY_DATA) {
  const key = 'backgrounds/' + city.id, file = context.G.IMAGE_FILES[key];
  assert(file && fs.existsSync(path.join(ROOT, 'images', file)), city.name + ': 도시 전용 배경 누락');
  assert.strictEqual(context.G.Img.pick(context.G.Img.chain.bg(city)), key, city.name + ': 전용 배경 우선 적용');
}
console.log('도시 ' + context.G.CITY_DATA.length + '곳의 배경 파일·등록·선택 검사 통과');
const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && fs.existsSync(p));
assert(CHROME, 'Chrome 또는 Edge가 필요합니다.');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function connect(url) {
  const ws = new WebSocket(url), pending = new Map(), errors = [];
  let seq = 0;
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.timer);
      if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result);
    }
    if (m.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(m.params.exceptionDetails));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      errors.push(m.params.args.map(x => x.value || x.description || '').join(' '));
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' &&
        !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(m.params.entry.url || '')) {
      errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
    }
  };
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  return { ws, errors, call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++seq;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(method + ': 응답 시간 초과')); }, 90000);
      pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
    });
  } };
}
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'plus-ultra-city-bg-'));
  const browser = spawn(CHROME, ['--headless=new', '--no-sandbox', '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--remote-debugging-port=0',
    '--remote-allow-origins=*', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let cdp;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
    const port = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/)[0];
    const target = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' }).then(r => r.json());
    cdp = await connect(target.webSocketDebuggerUrl);
    await cdp.call('Runtime.enable'); await cdp.call('Log.enable'); await cdp.call('Page.enable');
    await cdp.call('Page.addScriptToEvaluateOnNewDocument', { source: 'window.requestAnimationFrame = function () { return 0; };' });
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.call('Page.navigate', { url: pathToFileURL(path.join(ROOT, 'index.html')).href });
    async function evaluate(expression) {
      const r = await cdp.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      assert(!r.exceptionDetails, JSON.stringify(r.exceptionDetails)); return r.result.value;
    }
    let ready = false;
    for (let i = 0; i < 240; i++) {
      ready = await evaluate('!!(window.G && G.Game && G.Game.sceneName === "title" && G.Town)');
      if (ready) break; await sleep(250);
    }
    assert(ready, '게임 초기화');
    await evaluate(`(() => {
      const sk = {}; G.SKILLS.forEach(x => sk[x.id] = 1);
      G.Game.state = G.State.newGame({ name: '배경 점검', nation: 'PT', job: 'explorer', age: 22,
        birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk,
        lg: G.LANGS.map(() => 3), diff: 'normal' });
      G.Game.state.settings.res = .35; G.Game.state.settings.sound = 0; G.Game.state.settings.music = 0;
      G.Game.showLayers(false, false, true);
      window.bgSheets = [document.createElement('canvas'), document.createElement('canvas')];
      bgSheets.forEach(cv => { cv.width = 1600; cv.height = 804;
        const x = cv.getContext('2d'); x.fillStyle = '#191e24'; x.fillRect(0, 0, cv.width, cv.height); });
      return true;
    })()`);
    for (let i = 0; i < IDS.length; i++) {
      const row = await evaluate(`(async () => {
        const c = G.CITY_DATA[${IDS[i]}], key = 'backgrounds/' + c.id;
        G.Game.state.date = { y: Math.max(1480, c.founded), m: 6, d: 1 };
        G.Game.state.day = 0; G.Game.state.loc.city = c.id;
        await G.Img.load(key);
        const img = G.Img.get(key), buildings = G.Scenes.city.buildings(c);
        await G.Town.open(c, buildings);
        const st = G.Town.runtime(); st.cam = st.camTo = Math.max(0, (st.streetW - 1600) / 2);
        st.hero.x = st.cam + 800; st.dirty = true; G.Town.update(0);
        const x = (${i} % 4) * 400, y = Math.floor(${i} / 4) * 268;
        [img, G.Game.canvases().scene].forEach((im, n) => {
          const ctx = bgSheets[n].getContext('2d'); ctx.drawImage(im, x + 8, y + 40, 384, 216);
          ctx.fillStyle = '#efdfc1'; ctx.font = '18px sans-serif'; ctx.fillText(c.id + ' · ' + c.name, x + 10, y + 28);
        });
        const times = [];
        for (const day of [0, 5, 6]) {
          G.Game.state.day = day; st.dirty = true; G.Town.update(0); times.push(st.tod);
        }
        return { id: c.id, name: c.name, width: img && img.naturalWidth, height: img && img.naturalHeight,
          applied: st.bg === img && !!st.bgCv, buildings: st.items.length, expected: buildings.length,
          outpost: !!c.outpost, times };
      })()`);
      assert(row.applied && row.width >= 1600 && row.height >= 900, row.name + ': 고해상도 배경 실제 적용');
      assert(Math.abs(row.width / row.height - 16 / 9) < .01, row.name + ': 16:9 구도');
      assert.strictEqual(row.buildings, row.expected, row.name + ': 건물 유지');
      if (row.outpost) assert.strictEqual(row.buildings, 1, '독도는 선착장만 표시');
      assert.deepStrictEqual(row.times, ['day', 'golden', 'dusk'], row.name + ': 시간대 렌더링');
      console.log(row.id + ' ' + row.name + ': 배경·건물·시간대 검사 통과');
    }
    const urls = await evaluate('bgSheets.map(cv => cv.toDataURL("image/jpeg", .91))');
    const out = path.join(ROOT, 'docs/art'); fs.mkdirSync(out, { recursive: true });
    for (let i = 0; i < urls.length; i++) {
      fs.writeFileSync(path.join(out, 'additional-city-backgrounds-' + (i ? 'runtime' : 'preview') + '.jpg'),
        Buffer.from(urls[i].split(',')[1], 'base64'));
    }
    assert.strictEqual(cdp.errors.length, 0, cdp.errors.join('\n'));
    console.log('추가 도시 12곳의 file:// 거리 화면 검사 통과 · 콘솔 오류 0');
  } finally {
    if (cdp) cdp.ws.close(); browser.kill();
  }
})().then(() => process.exit(0), e => { console.error(e.stack || e); process.exit(1); });
