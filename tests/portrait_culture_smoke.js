/* 문화권 NPC 초상 시험: 관모·복식 규칙과 Canvas 렌더링, 브라우저 오류를 함께 확인한다. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PAGE = pathToFileURL(path.join(ROOT, 'test_portrait.html')).href;
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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'plus-ultra-portrait-'));
  const portFile = path.join(profile, 'DevToolsActivePort');
  const browser = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--remote-debugging-port=0', '--remote-allow-origins=*', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  try {
    await waitFor(portFile, 10000);
    const port = fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0];
    const target = await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(PAGE), { method: 'PUT' }).then(r => r.json());
    const cdp = await connect(target.webSocketDebuggerUrl);
    await cdp.call('Runtime.enable'); await cdp.call('Log.enable');
    let result;
    for (let i = 0; i < 60; i++) {
      await sleep(100);
      const q = await cdp.call('Runtime.evaluate', { expression: `(()=>{
        if(document.title!=='done')return null;
        const A=G.Art, specs=[A.npcSpec('k','king','kr','m'),A.npcSpec('s','scholar','kr','m'),A.npcSpec('a','soldier','az','m'),A.npcSpec('w','native','na','f'),A.npcSpec('c','king','na','m'),A.npcSpec('x','soldier','na','m')];
        const joseon=A.NPC_ROLES.map(role=>A.npcSpec('matrix:kr:'+role,role,'kr'));
        const pretty=A.npcSpec('pretty','scholar','kr','f'),trader=A.npcSpec('trader','merchant','cn','m'),rival=A.npcSpec('rival','captain','jp','m');
        const canvases=[...document.querySelectorAll('canvas')], hashes=canvases.map(cv=>{const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let h=2166136261;for(let i=0;i<d.length;i+=97)h=Math.imul(h^d[i],16777619);return h>>>0;});
        const actual=canvases.filter(cv=>(cv.dataset.img||'').startsWith('portraits/npc-roles/')).length;
        return {title:document.title,count:canvases.length,actual,unique:new Set(hashes).size,styleCount:A.NPC_STYLES.length,roleCount:A.NPC_ROLES.length,joseonWomen:joseon.filter(s=>s.g==='f').length,hats:specs.map(s=>s.hat),dresses:specs.map(s=>s.dress),pretty:[pretty.hat,pretty.glam,pretty.ornament],trader:[trader.hat,trader.dress,trader.roundFace,trader.moustache,trader.expression],rival:rival.expression,styles:[A.nativeStyle(-77,38),A.nativeStyle(-99,19),A.nativeStyle(-75,-12)],fleets:[A.fleetStyle('east','조선'),A.fleetStyle('east','일본'),A.fleetStyle('ind','캘리컷 왕국')]};
      })()`, returnByValue: true });
      result = q.result.value; if (result) break;
    }
    await cdp.call('Page.navigate', { url: GAME });
    let game;
    for (let i = 0; i < 120; i++) {
      await sleep(100);
      const q = await cdp.call('Runtime.evaluate', { expression: `(()=>{
        if(!(window.G&&G.Game&&G.Game.sceneName&&G.Scenes&&G.Scenes.land))return null;
        const ids=Object.keys(G.Art.TOWNFOLK),styles=G.Art.NPC_STYLES,missing=[];
        styles.forEach((style,si)=>ids.forEach(id=>{
          const spec=G.Art.townSpec(id,{id:9000+si,style,rel:'C'}),key=G.Img.pick(G.Art.portraitKeys(spec));
          if(!key||!key.startsWith('portraits/'))missing.push(style+':'+id+':'+(key||'polygon'));
        }));
        return {scene:G.Game.sceneName,native:typeof G.Art.nativeSpec==='function',fleet:typeof G.Art.fleetStyle==='function',rolePick:G.Img.pick(G.Img.chain.npc('trader',{id:9999,style:'kr'})),townCount:styles.length*ids.length,townMissing:missing};
      })()`, returnByValue: true });
      game = q.result.value; if (game) break;
    }
    const ok = result && result.title === 'done' && result.count === 240 && result.actual === 240 && result.unique >= 220 && result.styleCount === 20 && result.roleCount === 12 && result.joseonWomen >= 7 && result.hats.join() === 'ikseongwan,gat,jaguar,wampum,warbonnet,roach' && result.dresses.join() === 'hanbok,hanbok,jaguar,buckskin,buckskin,buckskin' && result.pretty.join() === 'gache,1.35,daenggi' && result.trader.join() === 'merchantCap,changshan,true,true,warm' && result.rival === 'guarded' && result.styles.join() === 'na,az,an' && result.fleets.join() === 'kr,jp,in' && game && game.scene === 'title' && game.native && game.fleet && game.rolePick === 'portraits/npc-roles/kr/merchant' && game.townCount === 180 && game.townMissing.length === 0 && !cdp.errors.length;
    console.log(JSON.stringify({ ok, result, game, errors: cdp.errors }));
    cdp.ws.close(); if (!ok) process.exitCode = 1;
  } finally { browser.kill(); }
})().then(() => process.exit(process.exitCode || 0), err => { console.error(err.stack || err); process.exit(1); });
