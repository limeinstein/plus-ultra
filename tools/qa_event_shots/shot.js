/* 아직 한 번도 일어나지 않은 사건을 조건을 맞춰 억지로 일으켜 본다 — node force.js [id…]
   match.json(hits 없는 것) → force.json [{id, fired, observed, errors, diagnosis}]
   페이지 쪽 도구: qalib.js · evlog.js · forcelib.js (window.FORCE). 시작 상태: base/save_1600.json */
'use strict';
const path = require('path'), fs = require('fs'), { execSync } = require('child_process');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const DIR = __dirname, ROOT = path.resolve(__dirname, '../..'), WORK = process.env.WORK || '/tmp/qa_event_shots';   // 결과는 WORK 아래 (저장소에 쌓지 않는다)
fs.mkdirSync(WORK, { recursive: true });
const EXE = process.env.BROWSER_EXE || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = process.env.OUT || path.join(WORK, 'shots.json');
const SHOTS = process.env.SHOTS || path.join(WORK, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
let metas = [];
const SKIP = new Set(['eventrumors']);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 사건마다 더 볼 표식 (match.json alts 에 더해) — 단계·결과를 가리는 글
const EXTRA = {
  globe_songs: ['갑판 위의 무대'], peter_lost: ['사라졌다'], peter_return: ['피터 팬이 따라왔다'],
  mingfall_deliver: ['진원원에게 전했다', '진원원이 동료가'], mingfall_again: ['진원원이 동료가', '제독의 배에 올랐다'],
  sky_kep: ['프라하에서 케플러에게'], quixote_tours: ['투르의 생마르탱'], quixote_toulouse: ['툴루즈의 생세르냉'], quixote_santiago: ['순례를 마쳤다', '순례를 마치고'],
  newton_principia_book: ['상자 하나가 왔다'], newton_news: ['왕립 조폐국장'], elmina_news_dutch: ['엘미나', '네덜란드 서인도 회사'],
  coven_coven_oath: ['열셋의 결속'], coven_wage_waiver: ['열여섯 마녀의 무급'],
  family_osa: ['소꿉친구'], family_firstlove: ['첫 항해의 밤'], family_kidwed: ['왕세자비가 되었다', '혼례를 올렸다. (지참금', '편지 한 장을 남기고'],
  princess_quest: ['특명을 받았다', '쳐부쉈다', '해적 요새에서', '모셔 왔다'], littleprince_well: ['숨은 우물', '왕자로 다니던 소녀'],
  gyeonwoo_chain: ['견우를 배에 태웠다', '직녀를 배에 태웠다', '부부로 부하가', '일본도를 받았다'], castaway_journal: ['표류기'], nzinga_kombi: ['콤비에서', '콤비 전투', '콤비로 가는'], tarzan: ['그는 자신이 사람이라는']
};

async function waitCpu() {
  for (;;) {
    let busy = '';
    try { busy = execSync("pgrep -f '[r]un1600.js' || true").toString().trim(); } catch (e) { busy = ''; }
    if (!busy) return;
    console.log(new Date().toISOString().slice(11, 19) + ' waiting for run16.js (' + busy.split('\n').length + ')');
    await sleep(30000);
  }
}

(async function () {
  /* 연출 QA는 기다리지 않는다 */
  const M = JSON.parse(fs.readFileSync(path.join(DIR, 'match.json'), 'utf8'));
  const byId = {}; M.events.forEach(e => { byId[e.id] = e; });
  let ids = process.argv.slice(2);
  if (!ids.length) ids = JSON.parse(fs.readFileSync(path.join(DIR, 'ids.json'), 'utf8'));
  console.log('events to force:', ids.length);
  const prev = fs.existsSync(OUT) && process.env.APPEND ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
  const results = prev.filter(r => ids.indexOf(r.id) < 0);

  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--js-flags=--max-old-space-size=4096'] });
  let page, errs = [];
  async function openPage() {
    if (page) { try { await page.close(); } catch (e) { /* 없음 */ } }
    page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errs.push('pageerror: ' + e.message + ' | ' + String(e.stack || '').split('\n').slice(1, 3).join(' ').trim()));
    page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_FILE_NOT_FOUND|ERR_NAME|ERR_TUNNEL|ERR_CONNECTION|net::|Failed to load resource/.test(t)) errs.push('console.error: ' + t.slice(0, 300) + ' @' + ((m.location() || {}).url || '').replace(/.*pu_full\//, '') + ':' + ((m.location() || {}).lineNumber || '')); });
    await page.route(/^https?:\/\//, r => r.fulfill({ status: 204, body: '' }));
    await page.addInitScript('window.__QA_SEED=20261101');
    if (process.env.SHOT_CANVAS !== '0') await page.addInitScript('window.SHOT_CANVAS=1');
    if (process.env.SHOT_WAIT) await page.addInitScript('window.SHOT_WAIT=' + (+process.env.SHOT_WAIT));
    await page.addInitScript('window.__START=' + JSON.stringify(fs.readFileSync((process.env.START || path.join(WORK, 'save_1600.json')), 'utf8')));
    await page.addInitScript({ path: path.join(DIR, 'qalib.js') });
    await page.addInitScript({ path: path.join(DIR, 'evlog.js') });
    await page.addInitScript({ path: path.join(DIR, 'forcelib.js') });
    if (fs.existsSync(path.join(DIR, 'forcelib2.js'))) await page.addInitScript({ path: path.join(DIR, 'forcelib2.js') });
    await page.addInitScript({ path: path.join(DIR, 'shotlib.js') });
    await page.exposeBinding('__shot', async (src, meta) => {
      const fn = meta.ev + '_' + String(meta.i).padStart(3, '0') + '.jpg';
      try { await page.screenshot({ path: path.join(SHOTS, fn), type: 'jpeg', quality: 72 }); meta.file = fn; } catch (e) { meta.file = null; meta.shotErr = String(e.message).slice(0, 100); }
      metas.push(meta);
    });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && window.QA && QA.evStart && window.FORCE, null, { timeout: 180000 });
    await page.evaluate(async () => { await G.Game.ensureGeo(); if (G.Nav && G.Nav.init) G.Nav.init(); G.UI.fade = async fn => { fn && fn(); }; QA.stubGames(); var lw = G.Games.landWar; G.Games.landWar = function (opt) { if (opt && opt.halt) { QA.fights.land++; var p = (opt && opt.party) || 10; return Promise.resolve({ res: 'truce', left: Math.max(1, Math.round(p * 0.97)), leaderDown: false }); } return lw(opt); }; });
    errs = [];
  }
  await openPage();
  const T0 = Date.now();
  for (const id of ids) {
    errs = [];
    let r;
    try {
      r = await Promise.race([page.evaluate(id => { SHOT.start(id); return FORCE.run(id); }, id), sleep(+(process.env.EV_MS || 300000)).then(() => ({ id, timeout: true }))]);
    } catch (e) { r = { id, crash: String(e.message || e).slice(0, 300) }; }
    if (r.timeout) { try { const n = await Promise.race([page.evaluate(() => ({ notes: FORCE.notes.slice(0, 30), date: QA.date(), scene: G.Game.sceneName, modal: ((document.querySelector('.modal-back:last-of-type') || {}).innerText || '').slice(0, 200), busy: G.UI.busy(), cityBusy: G.Scenes.city.isBusy && G.Scenes.city.isBusy() })), sleep(8000).then(() => null)]); if (n) { r.notes = n.notes.concat(['at timeout: ' + JSON.stringify({ date: n.date, scene: n.scene, busy: n.busy, cityBusy: n.cityBusy, modal: n.modal })]); } } catch (e) { /* 없음 */ } }
    const e = byId[id] || { alts: [] };
    const alts = (e.alts || []).concat(EXTRA[id] || []);
    const log = r.log || [];
    const hits = alts.filter(a => log.some(l => l.indexOf(a) >= 0));
    let imgs = {}; try { imgs = await page.evaluate(() => SHOT.stop()); } catch (e) { /* 없음 */ }
    const rec = {
      id, fired: !!hits.length, matched: hits, imgMiss: imgs.miss, imgFallback: imgs.fb, shots: metas.filter(x => x.ev === id),
      observed: (r.notes || []).join(' ; ') + (r.err ? ' ; ERR ' + r.err : '') + (r.timeout ? ' ; TIMEOUT' : '') + (r.crash ? ' ; CRASH ' + r.crash : ''),
      log: log.filter(l => !/유럽 시장|\[토스트\] .*(입항|출발|피로|탐험대)|^\d+ \[소식\] .*(유럽 시장)/.test(l)).slice(0, 40),
      errors: errs.slice(0, 10), diagnosis: '', ms: r.ms, end: r.scene + ' ' + r.date
    };
    if (r.res === 'skip') rec.fired = false;
    results.push(rec); metas = metas.filter(x => x.ev !== id);
    fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
    console.log((rec.fired ? 'YES ' : 'no  ') + id.padEnd(26) + ' ' + (rec.matched.join('|') || '-').slice(0, 40) + ' errs=' + errs.length + ' ' + Math.round((r.ms || 0) / 1000) + 's  ' + rec.observed.slice(0, 160));
    if (r.timeout || r.crash) { console.log('  reopening page'); try { await openPage(); } catch (e2) { console.log('reopen failed', e2.message); } }
  }
  console.log('done in', Math.round((Date.now() - T0) / 60000), 'min; fired', results.filter(r => r.fired).length, '/', results.length);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
