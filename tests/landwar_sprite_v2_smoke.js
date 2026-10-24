/* 육상전 병사 v3 — 최고 솜씨·LV0~3 기병·지역 무장·악어·file:// 그림 로드를 점검한다. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => p && fs.existsSync(p));
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function readWhenReady(file, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { const text = fs.readFileSync(file, 'utf8'); if (text.trim()) return text; } catch (e) { /* Chrome 준비 대기 */ }
    await sleep(100);
  }
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
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      const e = m.params.entry;
      if (!(e.url || '').startsWith('https://fonts.googleapis.com/')) errors.push('로그 오류: ' + e.text);
    }
  };
  return new Promise((resolve, reject) => {
    ws.onopen = () => resolve({ ws, call, errors });
    ws.onerror = () => reject(new Error('Chrome 개발자 프로토콜 연결 실패'));
  });
}

if (!CHROME) throw new Error('Chrome 또는 Edge를 찾지 못했습니다.');
(async function () {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'plus-ultra-landwar-v3-'));
  const portFile = path.join(profile, 'DevToolsActivePort');
  const shot = path.join(ROOT, 'artifacts', 'landwar-regional-v3', 'runtime.png');
  fs.mkdirSync(path.dirname(shot), { recursive: true });
  const browser = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--remote-debugging-port=0', '--remote-allow-origins=*', '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });
  let cdp;
  try {
    const port = (await readWhenReady(portFile, 10000)).split(/\r?\n/)[0];
    const target = await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(pathToFileURL(path.join(ROOT, 'index.html')).href), { method: 'PUT' }).then(r => r.json());
    cdp = await socket(target.webSocketDebuggerUrl);
    await cdp.call('Runtime.enable'); await cdp.call('Log.enable'); await cdp.call('Page.enable');
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    let booted = false;
    for (let i = 0; i < 480; i++) {
      const q = await cdp.call('Runtime.evaluate', { expression: '!!(window.G&&G.State&&G.Games&&G.Games.landWar&&!G.Scenes.title.bootPending)', returnByValue: true });
      if (q.result.value) { booted = true; break; }
      await sleep(250);
    }
    if (!booted) throw new Error('게임 데이터 초기화가 120초 안에 끝나지 않았습니다.' + (cdp.errors.length ? ' ' + cdp.errors.join(' | ') : ''));
    const setup = `(()=>{const sk={};G.SKILLS.forEach(x=>sk[x.id]=0);const lg=G.LANGS.map(()=>0);G.State.newGame({name:'병사 시험',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk,lg,diff:'normal'});const s=G.Game.state;s.settings.sound=0;s.settings.music=0;s.loc={mode:'city',city:0,lon:-9.1,lat:38.7,mount:{id:'horse',n:20}};s.mates=[{id:'guan_yu',role:'none',loyal:100}];G.Sprites.preload(['east_fighters','ottoman','natives','west_europe','india_central','southeast_asia','africa_regions','meso_south','north_america','pacific','animals','crocodile','cavalry_horse','cavalry_camel','cavalry_elephant','swordsmen_enemy','musketeers_enemy','cannons_enemy','officers_enemy']);G.Games.landWar({enemy:{name:'색상 시험대',kind:'bandit',n:30},party:40,terr:'grass',guns:true,flee:true});return true;})()`;
    const started = await cdp.call('Runtime.evaluate', { expression: setup, returnByValue: true });
    if (started.exceptionDetails) throw new Error('육상전 준비 실패: ' + (started.exceptionDetails.exception && started.exceptionDetails.exception.description || started.exceptionDetails.text));
    let state;
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      const q = await cdp.call('Runtime.evaluate', { expression: `(()=>{const D=G.Games._landDebug;if(!D)return null;const cav=D.mine.find(u=>u.type==='cav'),cs=cav&&D.sprite(cav),ids=[...new Set(D.foes.map(u=>{const x=D.sprite(u);return x&&x.id}).filter(Boolean))],fresh=['east_fighters','ottoman','natives','west_europe','india_central','southeast_asia','africa_regions','meso_south','north_america','pacific','animals','crocodile','cavalry_horse','cavalry_camel','cavalry_elephant','swordsmen_enemy','musketeers_enemy','cannons_enemy','officers_enemy'],cv=document.createElement('canvas');cv.width=640;cv.height=280;const crocodileReady=G.EventFx.render(cv.getContext('2d'),'beast',2,{animal:'crocodile',pack:'crocodile'},640,280),ir=G.LANDWAR_ART.regions.india;return {tier:D.tier({type:'inf'}),cavTier:cav&&D.tier(cav),cavSheet:cs&&cs.id,all:G.R.skillRead('sword'),placed:G.R.skill('sword'),ids,ready:fresh.every(id=>G.Sprites.ready(id)),meta:fresh.every(id=>!!G.Sprites.meta(id)),manifest:fresh.every(id=>G.Img.has('sprites/'+id)),regionalMap:[ir.m,ir.r,ir.l].every(x=>x[0]==='india_central'),crocRegions:['india','thai','malay','swahili','maya','caribbean','amazon','australia','papua'].every(k=>G.LANDWAR_ART.regions[k].b.includes('crocodile')),crocSpoil:G.HUNT_SPOILS.crocodile&&G.HUNT_SPOILS.crocodile.ko,crocodileReady};})()`, returnByValue: true });
      state = q.result.value;
      if (state && state.ready) break;
    }
    await cdp.call('Runtime.evaluate', { expression: 'G.Games._landDebug.draw()' });
    const png = await cdp.call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(shot, Buffer.from(png.data, 'base64'));
    console.log('  상태 ' + JSON.stringify(state));
    ok(state && state.all === 3 && state.tier === state.all && state.placed < state.all, '자리 없는 관우의 검술 3이 보병 LV3에 적용');
    ok(state.cavTier === 3 && state.cavSheet === 'cavalry_horse', '기병도 최고 검술 3을 받아 베이지/아이보리 말 기병 LV3 사용');
    ok(state.regionalMap, '인도 전투가 라지푸트·무굴 총병 등 지역 무장 시트에 연결');
    ok(state.meta && state.manifest && state.ready, '지역 무장 10종·동물·기병 3종 메타·매니페스트·file:// 로드');
    ok(state.crocRegions && state.crocSpoil === '악어' && state.crocodileReady, '악어가 열대 지역·사냥 전리품·사건 그림에 연결');
    ok(!cdp.errors.length, '콘솔 오류 0' + (cdp.errors.length ? ': ' + cdp.errors.join(' | ') : ''));
    console.log('실전 화면: ' + shot);
  } finally {
    if (cdp) cdp.ws.close();
    browser.kill();
  }
})().then(() => process.exit(0), err => { console.error(err.stack || err); process.exit(1); });
